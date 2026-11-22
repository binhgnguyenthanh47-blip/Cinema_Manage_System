<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

const CLEANING_MINUTES = 15; // thoi gian don phong sau moi suat

$id = int_param($_GET['id'] ?? null);
$show = $id ? db_one('SELECT * FROM shows WHERE show_id = ?', [$id]) : null;

if ($id && !$show) {
    flash('error', 'Không tìm thấy suất chiếu.');
    redirect('shows.php');
}

$movies = db_all(
    "SELECT movie_id, title, duration_minutes FROM movies
     WHERE status <> 'ended' OR movie_id = ?
     ORDER BY title",
    [$show['movie_id'] ?? 0]
);
$halls = db_all(
    'SELECT h.hall_id, h.hall_name, c.name AS cinema_name
     FROM cinemahalls h JOIN cinemas c ON c.cinema_id = h.cinema_id
     ORDER BY c.name, h.hall_name'
);

$toInput = fn (?string $dt) => $dt ? date('Y-m-d\TH:i', strtotime($dt)) : '';

$form = [
    'movie_id'    => $show['movie_id'] ?? '',
    'hall_id'     => $show['hall_id'] ?? '',
    'start_time'  => $toInput($show['start_time'] ?? null),
    'end_time'    => $toInput($show['end_time'] ?? null),
    'base_price'  => isset($show['base_price']) ? (string) (int) $show['base_price'] : '75000',
    'show_format' => $show['show_format'] ?? '2d_sub',
    'status'      => $show['status'] ?? 'scheduled',
];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $form = [
        'movie_id'    => str_param($_POST['movie_id'] ?? '', 20),
        'hall_id'     => str_param($_POST['hall_id'] ?? '', 20),
        'start_time'  => str_param($_POST['start_time'] ?? '', 16),
        'end_time'    => str_param($_POST['end_time'] ?? '', 16),
        'base_price'  => str_param($_POST['base_price'] ?? '', 12),
        'show_format' => str_param($_POST['show_format'] ?? '', 20),
        'status'      => str_param($_POST['status'] ?? '', 20),
    ];

    $movieId = int_param($form['movie_id']);
    $hallId = int_param($form['hall_id']);
    $movie = $movieId ? db_one('SELECT movie_id, duration_minutes FROM movies WHERE movie_id = ?', [$movieId]) : null;
    $start = DateTime::createFromFormat('!Y-m-d\TH:i', $form['start_time']);
    $end = $form['end_time'] !== '' ? DateTime::createFromFormat('!Y-m-d\TH:i', $form['end_time']) : null;

    if (!$movie) $errors['movie_id'] = 'Vui lòng chọn phim.';
    if (!$hallId || !db_value('SELECT 1 FROM cinemahalls WHERE hall_id = ?', [$hallId])) $errors['hall_id'] = 'Vui lòng chọn phòng chiếu.';
    if (!$start) $errors['start_time'] = 'Giờ bắt đầu không hợp lệ.';
    if ($form['end_time'] !== '' && !$end) $errors['end_time'] = 'Giờ kết thúc không hợp lệ.';
    if (!ctype_digit($form['base_price']) || (int) $form['base_price'] > 10000000) $errors['base_price'] = 'Giá vé không hợp lệ.';
    if (!isset(SHOW_FORMAT[$form['show_format']])) $errors['show_format'] = 'Định dạng không hợp lệ.';
    if (!isset(SHOW_STATUS[$form['status']])) $errors['status'] = 'Trạng thái không hợp lệ.';

    // Tu tinh gio ket thuc = bat dau + thoi luong phim + don phong
    if (!$errors && !$end) {
        if (empty($movie['duration_minutes'])) {
            $errors['end_time'] = 'Phim chưa có thời lượng, vui lòng nhập giờ kết thúc.';
        } else {
            $end = (clone $start)->modify('+' . ((int) $movie['duration_minutes'] + CLEANING_MINUTES) . ' minutes');
        }
    }
    if (!$errors && $end <= $start) {
        $errors['end_time'] = 'Giờ kết thúc phải sau giờ bắt đầu.';
    }

    if (!$errors) {
        $values = [
            $movieId, $hallId,
            $start->format('Y-m-d H:i:s'), $end->format('Y-m-d H:i:s'),
            (int) $form['base_price'], $form['show_format'], $form['status'],
        ];

        try {
            if ($show) {
                db_query(
                    'UPDATE shows SET movie_id = ?, hall_id = ?, start_time = ?, end_time = ?, base_price = ?,
                        show_format = ?, status = ? WHERE show_id = ?',
                    [...$values, $id]
                );
                flash('success', 'Đã cập nhật suất chiếu #' . $id . '.');
            } else {
                db_query(
                    'INSERT INTO shows (movie_id, hall_id, start_time, end_time, base_price, show_format, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?)',
                    $values
                );
                flash('success', 'Đã thêm suất chiếu mới.');
            }
            redirect('shows.php');
        } catch (PDOException $ex) {
            // Trigger trg_shows_no_overlap_* bao loi khi trung gio trong cung phong
            $errors['db'] = db_error_message($ex);
        }
    }
}

$title = $show ? 'Sửa suất chiếu #' . $id : 'Thêm suất chiếu';
admin_header($title, 'shows', $user);

$err = fn (string $key) => isset($errors[$key]) ? '<small class="field__error">' . e($errors[$key]) . '</small>' : '';
?>
<p><a href="shows.php">← Danh sách suất chiếu</a></p>

<?php if (isset($errors['db'])): ?>
    <div class="alert alert--error"><?= e($errors['db']) ?></div>
<?php endif; ?>

<form class="card form-narrow" method="post">
    <?= csrf_field() ?>

    <label class="field">
        <span>Phim *</span>
        <select class="input" name="movie_id" required>
            <option value="">-- Chọn phim --</option>
            <?php foreach ($movies as $m): ?>
                <option value="<?= (int) $m['movie_id'] ?>"<?= (string) $form['movie_id'] === (string) $m['movie_id'] ? ' selected' : '' ?>>
                    <?= e($m['title']) ?><?= $m['duration_minutes'] ? ' (' . (int) $m['duration_minutes'] . ' phút)' : '' ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?= $err('movie_id') ?>
    </label>

    <label class="field">
        <span>Phòng chiếu *</span>
        <select class="input" name="hall_id" required>
            <option value="">-- Chọn phòng --</option>
            <?php foreach ($halls as $h): ?>
                <option value="<?= (int) $h['hall_id'] ?>"<?= (string) $form['hall_id'] === (string) $h['hall_id'] ? ' selected' : '' ?>>
                    <?= e($h['cinema_name'] . ' — ' . $h['hall_name']) ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?= $err('hall_id') ?>
    </label>

    <div class="row-2">
        <label class="field">
            <span>Bắt đầu *</span>
            <input class="input" type="datetime-local" name="start_time" value="<?= e($form['start_time']) ?>" required>
            <?= $err('start_time') ?>
        </label>
        <label class="field">
            <span>Kết thúc</span>
            <input class="input" type="datetime-local" name="end_time" value="<?= e($form['end_time']) ?>">
            <small class="muted">Để trống: tự tính = thời lượng phim + <?= CLEANING_MINUTES ?> phút dọn phòng.</small>
            <?= $err('end_time') ?>
        </label>
    </div>

    <div class="row-3">
        <label class="field">
            <span>Giá vé ghế thường (đ) *</span>
            <input class="input" type="number" name="base_price" min="0" step="1000" value="<?= e($form['base_price']) ?>" required>
            <small class="muted">VIP = giá + 20.000đ, ghế đôi = 190.000đ</small>
            <?= $err('base_price') ?>
        </label>
        <label class="field">
            <span>Định dạng</span>
            <select class="input" name="show_format">
                <?php foreach (SHOW_FORMAT as $value => $label): ?>
                    <option value="<?= e($value) ?>"<?= $form['show_format'] === $value ? ' selected' : '' ?>><?= e($label) ?></option>
                <?php endforeach; ?>
            </select>
        </label>
        <label class="field">
            <span>Trạng thái</span>
            <select class="input" name="status">
                <?php foreach (SHOW_STATUS as $value => $label): ?>
                    <option value="<?= e($value) ?>"<?= $form['status'] === $value ? ' selected' : '' ?>><?= e($label) ?></option>
                <?php endforeach; ?>
            </select>
        </label>
    </div>

    <button class="btn btn--primary" type="submit"><?= $show ? 'Lưu thay đổi' : 'Thêm suất chiếu' ?></button>
</form>
<?php
admin_footer();
