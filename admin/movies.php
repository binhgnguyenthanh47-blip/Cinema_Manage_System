<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

// ===== Xoa phim =====
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    verify_csrf();
    $id = int_param($_POST['id'] ?? null);
    $movie = $id ? db_one('SELECT movie_id, title, poster_url FROM movies WHERE movie_id = ?', [$id]) : null;

    if (!$movie) {
        flash('error', 'Không tìm thấy phim.');
    } elseif ((int) db_value('SELECT COUNT(*) FROM shows WHERE movie_id = ?', [$id]) > 0) {
        flash('error', 'Phim "' . $movie['title'] . '" đã có suất chiếu, không thể xóa. Hãy chuyển trạng thái sang "Ngừng chiếu".');
    } else {
        $images = array_column(db_all('SELECT image_url FROM movie_images WHERE movie_id = ?', [$id]), 'image_url');
        db_query('DELETE FROM movies WHERE movie_id = ?', [$id]); // movie_images tu xoa (ON DELETE CASCADE)

        delete_uploaded_image($movie['poster_url']);
        foreach ($images as $url) {
            delete_uploaded_image($url);
        }
        flash('success', 'Đã xóa phim "' . $movie['title'] . '".');
    }
    redirect('movies.php?' . http_build_query(array_intersect_key($_GET, array_flip(['q', 'status', 'page']))));
}

// ===== Danh sach + tim kiem + phan trang =====
$where = [];
$params = [];

$q = str_param($_GET['q'] ?? '', 100);
if ($q !== '') {
    $where[] = '(m.title LIKE ? OR m.director LIKE ? OR m.genre LIKE ?)';
    array_push($params, "%$q%", "%$q%", "%$q%");
}

$status = $_GET['status'] ?? '';
if (isset(MOVIE_STATUS[$status])) {
    $where[] = 'm.status = ?';
    $params[] = $status;
}

$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$total = (int) db_value("SELECT COUNT(*) FROM movies m $whereSql", $params);
$p = paginate($total, 10, $_GET['page'] ?? 1);

$movies = db_all(
    "SELECT m.movie_id, m.title, m.genre, m.duration_minutes, m.age_rating, m.status, m.poster_url, m.rating,
            (SELECT COUNT(*) FROM shows s WHERE s.movie_id = m.movie_id) AS so_suat,
            (SELECT COUNT(*) FROM movie_images i WHERE i.movie_id = m.movie_id) AS so_anh
     FROM movies m
     $whereSql
     ORDER BY m.movie_id DESC
     LIMIT {$p['per_page']} OFFSET {$p['offset']}",
    $params
);

admin_header('Quản lý phim', 'movies', $user);
?>
<div class="page-head">
    <?php admin_search_form('Tìm theo tên phim, đạo diễn, thể loại...', ['status' => ['Mọi trạng thái', MOVIE_STATUS]]); ?>
    <a class="btn btn--primary" href="movie_form.php">+ Thêm phim</a>
</div>

<section class="card">
    <p class="muted">Tìm thấy <?= $p['total'] ?> phim</p>
    <div class="table-wrap">
        <table class="table">
            <thead>
            <tr>
                <th>Poster</th><th>Tên phim</th><th>Thể loại</th><th class="num">Thời lượng</th>
                <th>Độ tuổi</th><th>Trạng thái</th><th class="num">Suất</th><th class="num">Ảnh</th><th></th>
            </tr>
            </thead>
            <tbody>
            <?php foreach ($movies as $m): ?>
                <tr>
                    <td>
                        <?php if ($m['poster_url']): ?>
                            <img class="thumb" src="../<?= e($m['poster_url']) ?>" alt="" loading="lazy">
                        <?php else: ?>
                            <span class="thumb thumb--empty">🎞</span>
                        <?php endif; ?>
                    </td>
                    <td><strong><?= e($m['title']) ?></strong></td>
                    <td><?= e($m['genre']) ?></td>
                    <td class="num"><?= $m['duration_minutes'] ? (int) $m['duration_minutes'] . ' phút' : '—' ?></td>
                    <td><?= e($m['age_rating'] ?: '—') ?></td>
                    <td><?= badge($m['status'], MOVIE_STATUS) ?></td>
                    <td class="num"><?= (int) $m['so_suat'] ?></td>
                    <td class="num"><?= (int) $m['so_anh'] ?></td>
                    <td class="actions">
                        <a class="btn btn--sm" href="movie_form.php?id=<?= (int) $m['movie_id'] ?>">Sửa</a>
                        <?= delete_button('', (int) $m['movie_id'], 'Xóa phim "' . $m['title'] . '"? Toàn bộ ảnh của phim cũng bị xóa.') ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$movies): ?>
                <tr><td colspan="9" class="muted center">Không có phim nào.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?= pagination_links($p) ?>
</section>
<?php
admin_footer();
