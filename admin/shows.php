<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

// ===== Xoa suat chieu =====
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    verify_csrf();
    $id = int_param($_POST['id'] ?? null);

    if (!$id || !db_value('SELECT 1 FROM shows WHERE show_id = ?', [$id])) {
        flash('error', 'Không tìm thấy suất chiếu.');
    } elseif ((int) db_value('SELECT COUNT(*) FROM tickets WHERE show_id = ?', [$id]) > 0) {
        flash('error', 'Suất #' . $id . ' đã có vé, không thể xóa. Hãy sửa trạng thái thành "Đã hủy".');
    } else {
        db_query('DELETE FROM shows WHERE show_id = ?', [$id]);
        flash('success', 'Đã xóa suất chiếu #' . $id . '.');
    }
    redirect('shows.php?' . http_build_query(array_intersect_key($_GET, array_flip(['q', 'cinema_id', 'date', 'status', 'page']))));
}

// ===== Danh sach =====
$where = [];
$params = [];

$q = str_param($_GET['q'] ?? '', 100);
if ($q !== '') {
    $where[] = 'm.title LIKE ?';
    $params[] = "%$q%";
}
$cinemaId = int_param($_GET['cinema_id'] ?? null);
if ($cinemaId) {
    $where[] = 'c.cinema_id = ?';
    $params[] = $cinemaId;
}
$date = str_param($_GET['date'] ?? '', 10);
if ($date !== '' && DateTime::createFromFormat('!Y-m-d', $date)) {
    $where[] = 'DATE(s.start_time) = ?';
    $params[] = $date;
}
$status = $_GET['status'] ?? '';
if (isset(SHOW_STATUS[$status])) {
    // Loc theo trang thai thuc te (suat da qua gio ket thuc tinh la 'Da chieu')
    $where[] = show_status_sql('s') . ' = ?';
    $params[] = $status;
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$from = "FROM shows s
         JOIN movies m ON m.movie_id = s.movie_id
         JOIN cinemahalls h ON h.hall_id = s.hall_id
         JOIN cinemas c ON c.cinema_id = h.cinema_id";

$total = (int) db_value("SELECT COUNT(*) $from $whereSql", $params);
$p = paginate($total, 15, $_GET['page'] ?? 1);

$shows = db_all(
    "SELECT s.show_id, s.start_time, s.end_time, s.base_price, s.show_format, " . show_status_sql('s') . " AS status,
            m.title, h.hall_name, c.name AS cinema_name,
            (SELECT COUNT(*) FROM tickets t WHERE t.show_id = s.show_id AND t.status = 'paid') AS ve_da_ban,
            (SELECT COUNT(*) FROM seats se WHERE se.hall_id = s.hall_id) AS tong_ghe
     $from $whereSql
     -- Suat chua ket thuc (ke ca dang chieu) len truoc, gan nhat truoc;
     -- sau do la suat da chieu xong, moi nhat truoc.
     ORDER BY (s.end_time < NOW()),
              CASE WHEN s.end_time >= NOW() THEN s.start_time END ASC,
              s.start_time DESC,
              s.show_id
     LIMIT {$p['per_page']} OFFSET {$p['offset']}",
    $params
);

$cinemaOptions = array_column(db_all('SELECT cinema_id, name FROM cinemas ORDER BY name'), 'name', 'cinema_id');

admin_header('Quản lý suất chiếu', 'shows', $user);
?>
<div class="page-head">
    <form class="toolbar" method="get">
        <input class="input" type="search" name="q" value="<?= e($q) ?>" placeholder="Tìm theo tên phim...">
        <select class="input" name="cinema_id" aria-label="Rạp">
            <option value="">Mọi rạp</option>
            <?php foreach ($cinemaOptions as $cid => $name): ?>
                <option value="<?= (int) $cid ?>"<?= $cinemaId === (int) $cid ? ' selected' : '' ?>><?= e($name) ?></option>
            <?php endforeach; ?>
        </select>
        <input class="input" type="date" name="date" value="<?= e($date) ?>" aria-label="Ngày chiếu">
        <select class="input" name="status" aria-label="Trạng thái">
            <option value="">Mọi trạng thái</option>
            <?php foreach (SHOW_STATUS as $value => $label): ?>
                <option value="<?= e($value) ?>"<?= $status === $value ? ' selected' : '' ?>><?= e($label) ?></option>
            <?php endforeach; ?>
        </select>
        <button class="btn" type="submit">Lọc</button>
        <?php if ($q !== '' || $cinemaId || $date !== '' || $status !== ''): ?>
            <a class="btn btn--ghost" href="?">Xóa lọc</a>
        <?php endif; ?>
    </form>
    <a class="btn btn--primary" href="show_form.php">+ Thêm suất chiếu</a>
</div>

<section class="card">
    <p class="muted">Tìm thấy <?= $p['total'] ?> suất chiếu</p>
    <div class="table-wrap">
        <table class="table">
            <thead>
            <tr>
                <th>#</th><th>Phim</th><th>Rạp / Phòng</th><th>Bắt đầu</th><th>Kết thúc</th>
                <th>Định dạng</th><th class="num">Giá gốc</th><th class="num">Đã bán</th><th>Trạng thái</th><th></th>
            </tr>
            </thead>
            <tbody>
            <?php foreach ($shows as $s): ?>
                <tr>
                    <td><?= (int) $s['show_id'] ?></td>
                    <td><strong><?= e($s['title']) ?></strong></td>
                    <td><?= e($s['cinema_name']) ?><br><small class="muted"><?= e($s['hall_name']) ?></small></td>
                    <td><?= e(format_datetime($s['start_time'])) ?></td>
                    <td><?= e(format_datetime($s['end_time'], 'H:i')) ?></td>
                    <td><?= e(SHOW_FORMAT[$s['show_format']] ?? $s['show_format']) ?></td>
                    <td class="num"><?= e(money($s['base_price'])) ?></td>
                    <td class="num"><?= (int) $s['ve_da_ban'] ?>/<?= (int) $s['tong_ghe'] ?></td>
                    <td><?= badge($s['status'], SHOW_STATUS) ?></td>
                    <td class="actions">
                        <a class="btn btn--sm" href="show_form.php?id=<?= (int) $s['show_id'] ?>">Sửa</a>
                        <?= delete_button('', (int) $s['show_id'], 'Xóa suất chiếu #' . $s['show_id'] . '?') ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$shows): ?>
                <tr><td colspan="10" class="muted center">Không có suất chiếu nào.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?= pagination_links($p) ?>
</section>
<?php
admin_footer();
