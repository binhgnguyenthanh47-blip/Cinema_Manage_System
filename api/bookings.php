<?php
/**
 * API dat ve (bat buoc dang nhap)
 *   GET  api/bookings.php                       -> lich su dat ve cua toi
 *   POST api/bookings.php {action:"create", show_id, seat_ids:[..]}  -> giu ghe 15 phut
 *   POST api/bookings.php {action:"pay", booking_id, method}         -> thanh toan
 *
 * Chong dat trung ghe: unique key (show_id, active_seat_id) tren bang tickets.
 * Hai nguoi cung dat 1 ghe thi chi nguoi den truoc thanh cong, nguoi sau nhan 409.
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'ewallet'];

function booking_code(int $bookingId): string
{
    return 'CNM-' . str_pad((string) $bookingId, 6, '0', STR_PAD_LEFT);
}

function create_booking(array $user, array $body): void
{
    $showId = int_param($body['show_id'] ?? null);
    $seatIds = $body['seat_ids'] ?? null;

    if ($showId === null) {
        json_error('Suất chiếu không hợp lệ.');
    }

    if (
        !is_array($seatIds) ||
        count($seatIds) === 0 ||
        count($seatIds) > BOOKING_MAX_SEATS ||
        count(array_filter($seatIds, fn ($id) => int_param($id) === null)) > 0 ||
        count(array_unique(array_map('intval', $seatIds))) !== count($seatIds)
    ) {
        json_error('Danh sách ghế không hợp lệ (tối đa ' . BOOKING_MAX_SEATS . ' ghế).');
    }

    $seatIds = array_map('intval', $seatIds);
    sort($seatIds); // dat theo thu tu tang dan de tranh deadlock

    // Chi ban ve cho suat con lich va CHUA BAT DAU
    $show = db_one(
        'SELECT status, (start_time > NOW()) AS chua_bat_dau FROM shows WHERE show_id = ?',
        [$showId]
    );
    if (!$show) {
        json_error('Không tìm thấy suất chiếu.', 404);
    }
    if ($show['status'] !== 'scheduled') {
        json_error('Suất chiếu này đã bị hủy hoặc đã kết thúc.', 409);
    }
    if ((int) $show['chua_bat_dau'] !== 1) {
        json_error('Suất chiếu đã bắt đầu, không thể đặt vé. Vui lòng chọn suất khác.', 409);
    }

    $pdo = db();

    // Giai phong ghe da het han giu (phong khi event scheduler cua MySQL tat)
    db_call('CALL sp_expire_bookings()');

    $pdo->beginTransaction();
    try {
        db_query(
            "INSERT INTO bookings (user_id, expires_at, status, total_amount)
             VALUES (?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 'pending', 0)",
            [$user['user_id'], BOOKING_HOLD_MINUTES]
        );
        $bookingId = (int) $pdo->lastInsertId();

        foreach ($seatIds as $seatId) {
            // Thu tuc kiem tra ghe thuoc dung phong, tinh gia, them ve 'held'
            db_call('CALL sp_book_seat(?, ?, ?, ?)', [$bookingId, $showId, $seatId, 0]);
        }

        $total = (float) db_value('SELECT COALESCE(SUM(price), 0) FROM tickets WHERE booking_id = ?', [$bookingId]);
        db_query('UPDATE bookings SET total_amount = ? WHERE booking_id = ?', [$total, $bookingId]);

        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        $driverCode = (int) ($e->errorInfo[1] ?? 0);
        if ($driverCode === 1062) {
            json_error('Một hoặc nhiều ghế vừa được người khác đặt. Vui lòng chọn ghế khác.', 409);
        }
        if (($e->errorInfo[0] ?? '') === '45000') {
            json_error(db_error_message($e), 400);
        }
        throw $e;
    }

    json_ok([
        'booking_id'   => $bookingId,
        'booking_code' => booking_code($bookingId),
        'show_id'      => $showId,
        'seat_ids'     => $seatIds,
        'total_amount' => $total,
        'status'       => 'pending',
        'hold_seconds' => BOOKING_HOLD_MINUTES * 60,
    ], 'Giữ ghế thành công.', 201);
}

function pay_booking(array $user, array $body): void
{
    $bookingId = int_param($body['booking_id'] ?? null);
    $method = $body['method'] ?? '';

    if ($bookingId === null) {
        json_error('Mã đơn không hợp lệ.');
    }
    if (!in_array($method, PAYMENT_METHODS, true)) {
        json_error('Phương thức thanh toán không hợp lệ.');
    }

    // Combo + ma giam gia: chi nhan SO LUONG va MA, gia tien do server quy dinh
    $combos = [];
    foreach (array_keys(COMBO_PRICES) as $key) {
        $qty = $body['combos'][$key] ?? 0;
        if (!is_int($qty) || $qty < 0 || $qty > COMBO_MAX_QTY) {
            json_error('Số lượng combo không hợp lệ (0–' . COMBO_MAX_QTY . ').');
        }
        $combos[$key] = $qty;
    }

    $voucherCode = strtoupper(str_param($body['voucher'] ?? '', 30));
    if ($voucherCode !== '' && !isset(VOUCHERS[$voucherCode])) {
        json_error('Mã giảm giá không hợp lệ.');
    }

    // Thong tin nguoi nhan ve
    $contact = is_array($body['contact'] ?? null) ? $body['contact'] : [];
    $contactName = str_param($contact['name'] ?? '', 100);
    $contactEmail = mb_strtolower(str_param($contact['email'] ?? '', 255));
    $contactPhone = str_param($contact['phone'] ?? '', 15);
    if ($contactName === '') {
        json_error('Vui lòng nhập họ tên người nhận vé.');
    }
    if (!filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
        json_error('Email nhận vé không hợp lệ.');
    }
    if (!preg_match('/^0\d{9}$/', $contactPhone)) {
        json_error('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.');
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        // FOR UPDATE: khoa don, tranh thanh toan 2 lan hoac dua voi job het han
        $booking = db_one(
            'SELECT booking_id, status, total_amount,
                    (expires_at IS NOT NULL AND expires_at <= NOW()) AS da_het_han
             FROM bookings
             WHERE booking_id = ? AND user_id = ?
             FOR UPDATE',
            [$bookingId, $user['user_id']]
        );

        if (!$booking) {
            $pdo->rollBack();
            json_error('Không tìm thấy đơn đặt vé.', 404);
        }

        if ($booking['status'] !== 'pending') {
            $pdo->rollBack();
            json_error(
                $booking['status'] === 'paid'
                    ? 'Đơn này đã được thanh toán.'
                    : 'Đơn đã hết hạn hoặc bị hủy, vui lòng chọn lại ghế.',
                409
            );
        }

        if ((int) $booking['da_het_han'] === 1) {
            db_query("UPDATE bookings SET status = 'expired' WHERE booking_id = ?", [$bookingId]);
            db_query("UPDATE tickets SET status = 'expired' WHERE booking_id = ? AND status = 'held'", [$bookingId]);
            $pdo->commit();
            json_error('Hết thời gian giữ ghế, vui lòng chọn lại ghế.', 409);
        }

        $code = booking_code($bookingId);

        // Tinh tien tren server: tien ve (tu bang tickets) + combo - giam gia
        $ticketAmount = (float) $booking['total_amount'];
        $comboAmount = 0;
        foreach ($combos as $key => $qty) {
            $comboAmount += $qty * COMBO_PRICES[$key]['price'];
        }
        $subtotal = $ticketAmount + $comboAmount;
        $discount = 0;
        if ($voucherCode !== '') {
            $v = VOUCHERS[$voucherCode];
            $discount = $v['type'] === 'percent' ? round($subtotal * $v['value'] / 100) : $v['value'];
        }
        $discount = min($discount, $subtotal);
        $finalAmount = $subtotal - $discount;

        // total_amount cua don = so tien khach thuc tra (de doanh thu khop voi ve)
        // Mo ta combo de admin xem lai (vd: "1x Combo Solo, 2x Combo Couple")
        $comboParts = [];
        foreach ($combos as $key => $qty) {
            if ($qty > 0) {
                $comboParts[] = $qty . 'x ' . COMBO_PRICES[$key]['name'];
            }
        }

        db_query(
            "UPDATE bookings
             SET status = 'paid', expires_at = NULL, total_amount = ?,
                 combo_detail = ?, combo_amount = ?, voucher_code = ?, discount_amount = ?,
                 contact_name = ?, contact_email = ?, contact_phone = ?
             WHERE booking_id = ?",
            [$finalAmount, $comboParts ? implode(', ', $comboParts) : null, $comboAmount,
             $voucherCode ?: null, $discount, $contactName, $contactEmail, $contactPhone, $bookingId]
        );
        db_query(
            "UPDATE tickets SET status = 'paid', qr_code = CONCAT(?, '-', ticket_id)
             WHERE booking_id = ? AND status = 'held'",
            [$code, $bookingId]
        );
        db_query(
            "INSERT INTO payments (booking_id, method, amount, status, transaction_code, paid_at)
             VALUES (?, ?, ?, 'success', ?, NOW())",
            [$bookingId, $method, $finalAmount, 'PAY-' . $bookingId . '-' . bin2hex(random_bytes(4))]
        );

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    json_ok([
        'booking_id'   => $bookingId,
        'booking_code' => $code,
        'ticket_amount' => $ticketAmount,
        'combo_amount'  => (float) $comboAmount,
        'discount'      => (float) $discount,
        'voucher'       => $voucherCode ?: null,
        'total_amount'  => (float) $finalAmount,
        'status'       => 'paid',
    ], 'Thanh toán thành công.');
}

function my_bookings(array $user): void
{
    $rows = db_all(
        "SELECT b.booking_id, b.booking_time, b.status, b.total_amount,
                b.combo_detail, b.contact_name, b.contact_email, b.contact_phone,
                (SELECT p.method FROM payments p WHERE p.booking_id = b.booking_id
                 ORDER BY p.payment_id DESC LIMIT 1) AS payment_method,
                m.title AS movie_title, c.name AS cinema_name, c.cluster_name, h.hall_name, s.start_time,
                GROUP_CONCAT(CONCAT(se.row_label, se.seat_number) ORDER BY se.row_label, se.seat_number SEPARATOR ', ') AS seats
         FROM bookings b
         JOIN tickets t ON t.booking_id = b.booking_id
         JOIN shows s ON s.show_id = t.show_id
         JOIN movies m ON m.movie_id = s.movie_id
         JOIN cinemahalls h ON h.hall_id = s.hall_id
         JOIN cinemas c ON c.cinema_id = h.cinema_id
         JOIN seats se ON se.seat_id = t.seat_id
         WHERE b.user_id = ?
         GROUP BY b.booking_id, b.booking_time, b.status, b.total_amount,
                  b.combo_detail, b.contact_name, b.contact_email, b.contact_phone,
                  m.title, c.name, c.cluster_name, h.hall_name, s.start_time
         ORDER BY b.booking_id DESC
         LIMIT 50",
        [$user['user_id']]
    );

    foreach ($rows as &$r) {
        $r['booking_id'] = (int) $r['booking_id'];
        $r['booking_code'] = booking_code($r['booking_id']);
        $r['total_amount'] = (float) $r['total_amount'];
    }

    json_ok($rows);
}

api_guard(function (): void {
    require_method('GET', 'POST');
    $user = api_require_login();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        my_bookings($user);
    }

    $body = read_json_body();
    match ($body['action'] ?? '') {
        'create' => create_booking($user, $body),
        'pay'    => pay_booking($user, $body),
        default  => json_error('Hành động không hợp lệ.', 404),
    };
});
