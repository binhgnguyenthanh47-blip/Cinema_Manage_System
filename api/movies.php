<?php
/**
 * API phim
 *   GET api/movies.php                -> phim dang chieu + sap chieu
 *   GET api/movies.php?id=5           -> chi tiet 1 phim (kem bo anh)
 *   GET api/movies.php?page=1&limit=8 -> co phan trang (tuy chon)
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

const MOVIE_COLUMNS = 'movie_id, title, genre, duration_minutes, age_rating, release_date,
    release_date_text, poster_url, trailer_url, description, director, actors,
    country, language, rating, status';

function format_movie(array $m): array
{
    $m['movie_id'] = (int) $m['movie_id'];
    $m['duration_minutes'] = $m['duration_minutes'] !== null ? (int) $m['duration_minutes'] : null;
    $m['rating'] = $m['rating'] !== null ? (float) $m['rating'] : null;
    // Frontend chi can ma video YouTube
    $m['trailer_url'] = youtube_id($m['trailer_url']);
    // Noi dung HTML tu editor: loc lai lan nua truoc khi tra ve (phong du lieu cu)
    $m['description'] = sanitize_html((string) ($m['description'] ?? ''));
    return $m;
}

api_guard(function (): void {
    require_method('GET');

    $id = int_param($_GET['id'] ?? null);

    if ($id !== null) {
        $movie = db_one('SELECT ' . MOVIE_COLUMNS . ' FROM movies WHERE movie_id = ?', [$id]);
        if (!$movie) {
            json_error('Không tìm thấy phim.', 404);
        }

        $movie = format_movie($movie);
        $movie['images'] = array_column(
            db_all('SELECT image_url FROM movie_images WHERE movie_id = ? ORDER BY sort_order, image_id', [$id]),
            'image_url'
        );
        json_ok($movie);
    }

    $where = "WHERE status IN ('now_showing', 'coming_soon')";
    $limit = int_param($_GET['limit'] ?? null);

    if ($limit === null) {
        $movies = db_all('SELECT ' . MOVIE_COLUMNS . " FROM movies $where ORDER BY movie_id");
        json_ok(array_map('format_movie', $movies), '', 200, ['total' => count($movies)]);
    }

    // Phan trang phia server
    $limit = min($limit, 50);
    $total = (int) db_value("SELECT COUNT(*) FROM movies $where");
    $p = paginate($total, $limit, $_GET['page'] ?? 1);

    $movies = db_all(
        'SELECT ' . MOVIE_COLUMNS . " FROM movies $where ORDER BY movie_id LIMIT {$p['per_page']} OFFSET {$p['offset']}"
    );

    json_ok(array_map('format_movie', $movies), '', 200, [
        'total' => $p['total'],
        'page'  => $p['page'],
        'pages' => $p['pages'],
    ]);
});
