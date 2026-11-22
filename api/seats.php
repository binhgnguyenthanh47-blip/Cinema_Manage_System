<?php
/**
 * API so do ghe cua 1 suat chieu
 *   GET api/seats.php?show_id=12
 * availability = 'occupied' neu ghe da thanh toan hoac dang duoc giu (chua het han).
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

api_guard(function (): void {
    require_method('GET');

    $showId = int_param($_GET['show_id'] ?? null);
    if ($showId === null) {
        json_error('Suất chiếu không hợp lệ.');
    }

    $show = db_one('SELECT show_id, hall_id, base_price FROM shows WHERE show_id = ?', [$showId]);
    if (!$show) {
        json_error('Không tìm thấy suất chiếu.', 404);
    }

    $seats = db_all(
        "SELECT s.seat_id, s.hall_id, s.row_label, s.seat_number, s.seat_type,
                CONCAT(s.row_label, s.seat_number) AS seat_label,
                CASE s.seat_type
                    WHEN 'standard' THEN sh.base_price
                    WHEN 'vip' THEN sh.base_price + 20000
                    WHEN 'couple' THEN 190000
                END AS price,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM tickets t
                    JOIN bookings b ON b.booking_id = t.booking_id
                    WHERE t.show_id = sh.show_id
                      AND t.seat_id = s.seat_id
                      AND (t.status = 'paid'
                           OR (t.status = 'held' AND b.expires_at > NOW()))
                ) THEN 'occupied' ELSE 'available' END AS availability
         FROM seats s
         JOIN shows sh ON sh.hall_id = s.hall_id
         WHERE sh.show_id = ?
         ORDER BY s.row_label, s.seat_number",
        [$showId]
    );

    foreach ($seats as &$seat) {
        $seat['seat_id'] = (int) $seat['seat_id'];
        $seat['hall_id'] = (int) $seat['hall_id'];
        $seat['seat_number'] = (int) $seat['seat_number'];
        $seat['price'] = (float) $seat['price'];
    }

    json_ok($seats, '', 200, [
        'show_id'    => $showId,
        'hall_id'    => (int) $show['hall_id'],
        'base_price' => (float) $show['base_price'],
        'total'      => count($seats),
    ]);
});
