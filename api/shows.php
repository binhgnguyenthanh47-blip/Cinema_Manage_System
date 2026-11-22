<?php
/**
 * API suat chieu
 *   GET api/shows.php              -> tat ca suat chieu
 *   GET api/shows.php?movie_id=5   -> suat chieu cua 1 phim
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

api_guard(function (): void {
    require_method('GET');

    $params = [];
    $where = '';
    $movieId = int_param($_GET['movie_id'] ?? null);
    if ($movieId !== null) {
        $where = 'WHERE s.movie_id = ?';
        $params[] = $movieId;
    }

    $shows = db_all(
        "SELECT s.show_id, s.movie_id, m.title AS movie_title,
                s.hall_id, h.hall_name,
                c.cinema_id, c.name AS cinema_name, c.address AS cinema_address, c.cluster_name,
                s.start_time, s.end_time, s.show_format, s.base_price,
                " . show_status_sql('s') . " AS status,
                (s.status = 'scheduled' AND s.start_time > NOW()) AS bookable
         FROM shows s
         JOIN movies m ON m.movie_id = s.movie_id
         JOIN cinemahalls h ON h.hall_id = s.hall_id
         JOIN cinemas c ON c.cinema_id = h.cinema_id
         $where
         ORDER BY s.start_time, s.show_id",
        $params
    );

    foreach ($shows as &$s) {
        foreach (['show_id', 'movie_id', 'hall_id', 'cinema_id'] as $key) {
            $s[$key] = (int) $s[$key];
        }
        $s['base_price'] = (float) $s['base_price'];
        // Chi dat ve duoc khi suat chua bat dau
        $s['bookable'] = (bool) $s['bookable'];
    }

    json_ok($shows, '', 200, ['total' => count($shows)]);
});
