<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

$keepQuery = fn () => http_build_query(array_intersect_key($_GET, array_flip(['q', 'status', 'date', 'page', 'view'])));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';
    $id = int_param($_POST['id'] ?? null);
    $booking = $id ? db_one('SELECT booking_id, status FROM bookings WHERE booking_id = ?', [$id]) : null;

    if (!$booking) {
        flash('error', 'Không tìm thấy đơn.');
    } elseif ($action === 'cancel') {
        if (!in_array($booking['status'], ['pending', 'paid'], true)) {
            flash('error', 'Chỉ hủy được đơn đang giữ ghế hoặc đã thanh toán.');
        } else {
            // Huy don: tra ghe ve trang thai trong, danh dau hoan tien
            $pdo = db();
            $pdo->beginTransaction();
            db_query("UPDATE bookings SET status = 'cancelled', expires_at = NULL WHERE booking_id = ?", [$id]);
            db_query("UPDATE tickets SET status = 'cancelled' WHERE booking_id = ? AND status IN ('held', 'paid')", [$id]);
            db_query("UPDATE payments SET status = 'refunded' WHERE booking_id = ? AND status = 'success'", [$id]);
            $pdo->commit();
            flash('success', 'Đã hủy đơn #' . $id . ', ghế đã được mở bán lại.');
        }
    } elseif ($action === 'delete') {
        if (!in_array($booking['status'], ['cancelled', 'expired'], true)) {
            flash('error', 'Chỉ xóa được đơn đã hủy hoặc hết hạn. Hãy hủy đơn trước.');
        } else {
            $pdo = db();
            $pdo->beginTransaction();
            db_query('DELETE FROM payments WHERE booking_id = ?', [$id]);
            db_query('DELETE FROM tickets WHERE booking_id = ?', [$id]);
            db_query('DELETE FROM bookings WHERE booking_id = ?', [$id]);
            $pdo->commit();
            flash('success', 'Đã xóa đơn #' . $id . '.');
            unset($_GET['view']);
        }
    }
    redirect('bookings.php?' . $keepQuery());
}

// ===== Chi tiet 1 don =====
$viewId = int_param($_GET['view'] ?? null);
$detail = null;
if ($viewId) {
    $detail = db_one(
        'SELECT b.*, u.full_name, u.email FROM bookings b JOIN users u ON u.user_id = b.user_id WHERE b.booking_id = ?',
        [$viewId]
    );
    if ($detail) {
        $detail['tickets'] = db_all(
            "SELECT t.ticket_id, t.price, t.status, t.qr_code, CONCAT(se.row_label, se.seat_number) AS seat_label, se.seat_type,
                    m.title, s.start_time, h.hall_name, c.name AS cinema_name
             FROM tickets t
             JOIN seats se ON se.seat_id = t.seat_id
             JOIN shows s ON s.show_id = t.show_id
             JOIN movies m ON m.movie_id = s.movie_id
             JOIN cinemahalls h ON h.hall_id = s.hall_id
             JOIN cinemas c ON c.cinema_id = h.cinema_id
             WHERE t.booking_id = ?
             ORDER BY se.row_label, se.seat_number",
            [$viewId]
        );
        $detail['payments'] = db_all('SELECT * FROM payments WHERE booking_id = ? ORDER BY payment_id', [$viewId]);
    }
}

// ===== Danh sach =====
$where = [];
$params = [];
$q = str_param($_GET['q'] ?? '', 100);
if ($q !== '') {
    $idSearch = (int) preg_replace('/\D/', '', $q);
    $where[] = '(u.full_name LIKE ? OR u.email LIKE ? OR b.booking_id = ?)';
    array_push($params, "%$q%", "%$q%", $idSearch);
}
$status = $_GET['status'] ?? '';
if (isset(BOOKING_STATUS[$status])) {
    $where[] = 'b.status = ?';
    $params[] = $status;
}
$date = str_param($_GET['date'] ?? '', 10);
if ($date !== '' && DateTime::createFromFormat('!Y-m-d', $date)) {
    $where[] = 'DATE(b.booking_time) = ?';
    $params[] = $date;
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$total = (int) db_value("SELECT COUNT(*) FROM bookings b JOIN users u ON u.user_id = b.user_id $whereSql", $params);
$p = paginate($total, 15, $_GET['page'] ?? 1);
$bookings = db_all(
    "SELECT b.booking_id, b.booking_time, b.status, b.total_amount, u.full_name, u.email,
            (SELECT COUNT(*) FROM tickets t WHERE t.booking_id = b.booking_id) AS so_ve
     FROM bookings b JOIN users u ON u.user_id = b.user_id
     $whereSql
     ORDER BY b.booking_id DESC
     LIMIT {$p['per_page']} OFFSET {$p['offset']}",
    $params
);

admin_header('Đơn đặt vé', 'bookings', $user);

$actionForm = function (string $action, int $id, string $label, string $class, string $confirm): string {
    return '<form method="post" class="inline" data-confirm="' . e($confirm) . '">' . csrf_field()
        . '<input type="hidden" name="action" value="' . e($action) . '">'
        . '<input type="hidden" name="id" value="' . $id . '">'
        . '<button class="btn btn--sm ' . e($class) . '" type="submit">' . e($label) . '</button></form>';
};
?>
<?php if ($detail): ?>
    <section class="card">
        <div class="card__head">
            <h2 class="card__title">Đơn #<?= (int) $detail['booking_id'] ?> <?= badge($detail['status'], BOOKING_STATUS) ?></h2>
            <a class="btn btn--ghost btn--sm" href="?<?= e(http_build_query(array_diff_key($_GET, ['view' => 1]))) ?>">Đóng</a>
        </div>
        <dl class="details">
            <div><dt>Khách hàng</dt><dd><?= e($detail['full_name']) ?> · <?= e($detail['email']) ?></dd></div>
            <div><dt>Thời gian đặt</dt><dd><?= e(format_datetime($detail['booking_time'])) ?></dd></div>
            <div><dt>Tổng tiền</dt><dd><strong><?= e(money($detail['total_amount'])) ?></strong></dd></div>
            <?php if ($detail['tickets']): $t0 = $detail['tickets'][0]; ?>
                <div><dt>Phim</dt><dd><?= e($t0['title']) ?></dd></div>
                <div><dt>Suất chiếu</dt><dd><?= e(format_datetime($t0['start_time'])) ?> · <?= e($t0['cinema_name']) ?> · <?= e($t0['hall_name']) ?></dd></div>
            <?php endif; ?>
        </dl>

        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Ghế</th><th>Loại</th><th class="num">Giá</th><th>Trạng thái vé</th><th>Mã QR</th></tr></thead>
                <tbody>
                <?php foreach ($detail['tickets'] as $t): ?>
                    <tr>
                        <td><strong><?= e($t['seat_label']) ?></strong></td>
                        <td><?= e(SEAT_TYPE[$t['seat_type']] ?? $t['seat_type']) ?></td>
                        <td class="num"><?= e(money($t['price'])) ?></td>
                        <td><?= badge($t['status'], TICKET_STATUS) ?></td>
                        <td><code><?= e($t['qr_code'] ?: '—') ?></code></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <?php $ticketTotal = array_sum(array_column($detail['tickets'], 'price')); ?>
        <div class="bill">
            <div class="bill__row"><span>Tiền vé (<?= count($detail['tickets']) ?> ghế)</span><span><?= e(money($ticketTotal)) ?></span></div>
            <?php if ((float) $detail['combo_amount'] > 0): ?>
                <div class="bill__row"><span>Combo: <?= e($detail['combo_detail']) ?></span><span><?= e(money($detail['combo_amount'])) ?></span></div>
            <?php endif; ?>
            <?php if ((float) $detail['discount_amount'] > 0): ?>
                <div class="bill__row"><span>Mã giảm giá <code><?= e($detail['voucher_code']) ?></code></span><span>−<?= e(money($detail['discount_amount'])) ?></span></div>
            <?php endif; ?>
            <div class="bill__row bill__total"><span>Tổng tiền</span><span><?= e(money($detail['total_amount'])) ?></span></div>
        </div>

        <?php if ($detail['payments']): ?>
            <h3 class="section-title">Thanh toán</h3>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Phương thức</th><th class="num">Số tiền</th><th>Trạng thái</th><th>Thời gian</th><th>Mã giao dịch</th></tr></thead>
                    <tbody>
                    <?php foreach ($detail['payments'] as $pay): ?>
                        <tr>
                            <td><?= e(PAYMENT_METHOD_LABEL[$pay['method']] ?? $pay['method']) ?></td>
                            <td class="num"><?= e(money($pay['amount'])) ?></td>
                            <td><?= badge($pay['status'], PAYMENT_STATUS) ?></td>
                            <td><?= e(format_datetime($pay['paid_at'])) ?></td>
                            <td><code><?= e($pay['transaction_code']) ?></code></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>

        <div class="form-actions">
            <?php if (in_array($detail['status'], ['pending', 'paid'], true)): ?>
                <?= $actionForm('cancel', (int) $detail['booking_id'], 'Hủy đơn & mở lại ghế', 'btn--danger', 'Hủy đơn #' . $detail['booking_id'] . '? Ghế sẽ được mở bán lại.') ?>
            <?php else: ?>
                <?= $actionForm('delete', (int) $detail['booking_id'], 'Xóa đơn', 'btn--danger', 'Xóa vĩnh viễn đơn #' . $detail['booking_id'] . '?') ?>
            <?php endif; ?>
        </div>
    </section>
<?php endif; ?>

<section class="card">
    <form class="toolbar" method="get">
        <input class="input" type="search" name="q" value="<?= e($q) ?>" placeholder="Mã đơn, tên hoặc email khách...">
        <select class="input" name="status" aria-label="Trạng thái">
            <option value="">Mọi trạng thái</option>
            <?php foreach (BOOKING_STATUS as $value => $label): ?>
                <option value="<?= e($value) ?>"<?= $status === $value ? ' selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach; ?>
        </select>
        <input class="input" type="date" name="date" value="<?= e($date) ?>" aria-label="Ngày đặt">
        <button class="btn" type="submit">Lọc</button>
        <?php if ($q !== '' || $status !== '' || $date !== ''): ?><a class="btn btn--ghost" href="?">Xóa lọc</a><?php endif; ?>
    </form>

    <p class="muted">Tìm thấy <?= $p['total'] ?> đơn</p>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Thời gian đặt</th><th class="num">Số vé</th><th class="num">Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
            <?php foreach ($bookings as $b): ?>
                <tr<?= $viewId === (int) $b['booking_id'] ? ' class="is-selected"' : '' ?>>
                    <td>#<?= (int) $b['booking_id'] ?></td>
                    <td><?= e($b['full_name']) ?><br><small class="muted"><?= e($b['email']) ?></small></td>
                    <td><?= e(format_datetime($b['booking_time'])) ?></td>
                    <td class="num"><?= (int) $b['so_ve'] ?></td>
                    <td class="num"><?= e(money($b['total_amount'])) ?></td>
                    <td><?= badge($b['status'], BOOKING_STATUS) ?></td>
                    <td class="actions">
                        <a class="btn btn--sm" href="?<?= e(http_build_query(array_merge($_GET, ['view' => (int) $b['booking_id']]))) ?>">Chi tiết</a>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$bookings): ?>
                <tr><td colspan="7" class="muted center">Không có đơn nào.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?= pagination_links($p) ?>
</section>
<?php
admin_footer();
