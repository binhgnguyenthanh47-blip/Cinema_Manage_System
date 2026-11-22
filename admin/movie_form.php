<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

const AGE_RATINGS = ['P', 'K', 'T13', 'T16', 'T18'];
const MAX_GALLERY = 20;

$id = int_param($_GET['id'] ?? null);
$movie = $id ? db_one('SELECT * FROM movies WHERE movie_id = ?', [$id]) : null;

if ($id && !$movie) {
    flash('error', 'Không tìm thấy phim.');
    redirect('movies.php');
}

$images = $id
    ? db_all('SELECT image_id, image_url FROM movie_images WHERE movie_id = ? ORDER BY sort_order, image_id', [$id])
    : [];

$form = $movie ?? [
    'title' => '', 'genre' => '', 'duration_minutes' => '', 'age_rating' => 'P',
    'release_date' => '', 'release_date_text' => '', 'status' => 'coming_soon',
    'director' => '', 'actors' => '', 'country' => '', 'language' => '',
    'rating' => '', 'trailer_url' => '', 'description' => '', 'poster_url' => '',
];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    // ----- Doc va kiem tra du lieu -----
    $data = [
        'title'             => str_param($_POST['title'] ?? '', 255),
        'genre'             => str_param($_POST['genre'] ?? '', 100),
        'duration_minutes'  => str_param($_POST['duration_minutes'] ?? '', 4),
        'age_rating'        => str_param($_POST['age_rating'] ?? '', 10),
        'release_date'      => str_param($_POST['release_date'] ?? '', 10),
        'release_date_text' => str_param($_POST['release_date_text'] ?? '', 100),
        'status'            => str_param($_POST['status'] ?? '', 20),
        'director'          => str_param($_POST['director'] ?? '', 255),
        'actors'            => str_param($_POST['actors'] ?? '', 2000),
        'country'           => str_param($_POST['country'] ?? '', 100),
        'language'          => str_param($_POST['language'] ?? '', 100),
        'rating'            => str_param($_POST['rating'] ?? '', 4),
        'trailer_url'       => str_param($_POST['trailer_url'] ?? '', 500),
        // Noi dung tu editor: loc HTML theo danh sach trang (chong XSS)
        'description'       => sanitize_html(is_string($_POST['description'] ?? null) ? $_POST['description'] : ''),
    ];

    if ($data['title'] === '') $errors['title'] = 'Vui lòng nhập tên phim.';
    if ($data['genre'] === '') $errors['genre'] = 'Vui lòng nhập thể loại.';
    if ($data['duration_minutes'] !== '' && (!ctype_digit($data['duration_minutes']) || (int) $data['duration_minutes'] < 1 || (int) $data['duration_minutes'] > 600)) {
        $errors['duration_minutes'] = 'Thời lượng từ 1 đến 600 phút.';
    }
    if (!in_array($data['age_rating'], AGE_RATINGS, true)) $errors['age_rating'] = 'Độ tuổi không hợp lệ.';
    if ($data['release_date'] !== '' && !DateTime::createFromFormat('!Y-m-d', $data['release_date'])) {
        $errors['release_date'] = 'Ngày khởi chiếu không hợp lệ.';
    }
    if (!isset(MOVIE_STATUS[$data['status']])) $errors['status'] = 'Trạng thái không hợp lệ.';
    if ($data['rating'] !== '' && (!is_numeric($data['rating']) || $data['rating'] < 0 || $data['rating'] > 10)) {
        $errors['rating'] = 'Điểm từ 0 đến 10.';
    }
    if ($data['trailer_url'] !== '' && youtube_id($data['trailer_url']) === '') {
        $errors['trailer_url'] = 'Link YouTube không hợp lệ.';
    }

    $removeIds = array_values(array_filter(array_map('int_param', (array) ($_POST['remove_images'] ?? []))));
    $posterFiles = normalize_files($_FILES['poster'] ?? null);
    $galleryFiles = array_values(array_filter(
        normalize_files($_FILES['gallery'] ?? null),
        fn ($f) => $f['error'] !== UPLOAD_ERR_NO_FILE
    ));

    if (count($galleryFiles) > UPLOAD_MAX_FILES) {
        $errors['gallery'] = 'Mỗi lần chỉ upload tối đa ' . UPLOAD_MAX_FILES . ' ảnh.';
    } elseif (count($images) - count($removeIds) + count($galleryFiles) > MAX_GALLERY) {
        $errors['gallery'] = 'Mỗi phim tối đa ' . MAX_GALLERY . ' ảnh.';
    }

    // ----- Luu file anh (chi khi du lieu hop le) -----
    $newFiles = [];
    $newPoster = null;
    $newGallery = [];

    if (!$errors) {
        try {
            if ($posterFiles && $posterFiles[0]['error'] !== UPLOAD_ERR_NO_FILE) {
                $newPoster = $newFiles[] = save_uploaded_image($posterFiles[0]);
            }
            foreach ($galleryFiles as $file) {
                $newGallery[] = $newFiles[] = save_uploaded_image($file);
            }
        } catch (RuntimeException $ex) {
            $errors['upload'] = $ex->getMessage();
            array_walk($newFiles, fn ($url) => delete_uploaded_image($url));
            $newFiles = [];
        }
    }

    // ----- Ghi CSDL trong 1 transaction -----
    if (!$errors) {
        $values = [
            $data['title'], $data['genre'],
            $data['duration_minutes'] !== '' ? (int) $data['duration_minutes'] : null,
            $data['age_rating'],
            $data['release_date'] ?: null,
            $data['release_date_text'] ?: null,
            $data['status'],
            $data['director'] ?: null, $data['actors'] ?: null,
            $data['country'] ?: null, $data['language'] ?: null,
            $data['rating'] !== '' ? round((float) $data['rating'], 1) : null,
            $data['trailer_url'] ?: null,
            $data['description'] ?: null,
            $newPoster ?? ($movie['poster_url'] ?? null),
        ];

        $pdo = db();
        $removedUrls = [];
        try {
            $pdo->beginTransaction();

            if ($movie) {
                db_query(
                    'UPDATE movies SET title = ?, genre = ?, duration_minutes = ?, age_rating = ?, release_date = ?,
                        release_date_text = ?, status = ?, director = ?, actors = ?, country = ?, language = ?,
                        rating = ?, trailer_url = ?, description = ?, poster_url = ?
                     WHERE movie_id = ?',
                    [...$values, $id]
                );
                $movieId = $id;
            } else {
                db_query(
                    'INSERT INTO movies (title, genre, duration_minutes, age_rating, release_date, release_date_text,
                        status, director, actors, country, language, rating, trailer_url, description, poster_url)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    $values
                );
                $movieId = (int) $pdo->lastInsertId();
            }

            if ($removeIds) {
                $in = implode(',', array_fill(0, count($removeIds), '?'));
                $removedUrls = array_column(
                    db_all("SELECT image_url FROM movie_images WHERE movie_id = ? AND image_id IN ($in)", [$movieId, ...$removeIds]),
                    'image_url'
                );
                db_query("DELETE FROM movie_images WHERE movie_id = ? AND image_id IN ($in)", [$movieId, ...$removeIds]);
            }

            $order = (int) db_value('SELECT COALESCE(MAX(sort_order), 0) FROM movie_images WHERE movie_id = ?', [$movieId]);
            foreach ($newGallery as $url) {
                db_query('INSERT INTO movie_images (movie_id, image_url, sort_order) VALUES (?, ?, ?)', [$movieId, $url, ++$order]);
            }

            $pdo->commit();
        } catch (PDOException $ex) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            array_walk($newFiles, fn ($url) => delete_uploaded_image($url));
            $errors['db'] = db_error_message($ex);
        }

        if (!$errors) {
            // Xoa file cu sau khi DB da luu thanh cong
            if ($newPoster && !empty($movie['poster_url'])) {
                delete_uploaded_image($movie['poster_url']);
            }
            array_walk($removedUrls, fn ($url) => delete_uploaded_image($url));

            flash('success', $movie ? 'Đã cập nhật phim "' . $data['title'] . '".' : 'Đã thêm phim "' . $data['title'] . '".');
            redirect($movie ? 'movie_form.php?id=' . $movieId : 'movies.php');
        }
    }

    $form = array_merge($form, $data);
}

$title = $movie ? 'Sửa phim' : 'Thêm phim mới';
admin_header($title, 'movies', $user);

$err = fn (string $key) => isset($errors[$key]) ? '<small class="field__error">' . e($errors[$key]) . '</small>' : '';
?>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css">

<p><a href="movies.php">← Danh sách phim</a></p>

<?php foreach (['upload', 'db'] as $k): ?>
    <?php if (isset($errors[$k])): ?><div class="alert alert--error"><?= e($errors[$k]) ?></div><?php endif; ?>
<?php endforeach; ?>
<?php if ($errors && !isset($errors['upload']) && !isset($errors['db'])): ?>
    <div class="alert alert--error">Vui lòng kiểm tra lại các trường được đánh dấu.</div>
<?php endif; ?>

<form class="form-grid" method="post" enctype="multipart/form-data" id="movieForm">
    <?= csrf_field() ?>

    <section class="card form-grid__main">
        <h2 class="card__title">Thông tin phim</h2>

        <label class="field">
            <span>Tên phim *</span>
            <input class="input" name="title" value="<?= e($form['title']) ?>" required maxlength="255">
            <?= $err('title') ?>
        </label>

        <div class="row-3">
            <label class="field">
                <span>Thể loại *</span>
                <input class="input" name="genre" value="<?= e($form['genre']) ?>" required maxlength="100" placeholder="Hành động, Hài...">
                <?= $err('genre') ?>
            </label>
            <label class="field">
                <span>Thời lượng (phút)</span>
                <input class="input" type="number" name="duration_minutes" min="1" max="600" value="<?= e($form['duration_minutes']) ?>">
                <?= $err('duration_minutes') ?>
            </label>
            <label class="field">
                <span>Độ tuổi</span>
                <select class="input" name="age_rating">
                    <?php foreach (AGE_RATINGS as $r): ?>
                        <option<?= $form['age_rating'] === $r ? ' selected' : '' ?>><?= e($r) ?></option>
                    <?php endforeach; ?>
                </select>
                <?= $err('age_rating') ?>
            </label>
        </div>

        <div class="row-3">
            <label class="field">
                <span>Ngày khởi chiếu</span>
                <input class="input" type="date" name="release_date" value="<?= e($form['release_date']) ?>">
                <?= $err('release_date') ?>
            </label>
            <label class="field">
                <span>Ghi chú khởi chiếu</span>
                <input class="input" name="release_date_text" value="<?= e($form['release_date_text']) ?>" placeholder="VD: 07/2026">
            </label>
            <label class="field">
                <span>Điểm đánh giá (0–10)</span>
                <input class="input" type="number" name="rating" min="0" max="10" step="0.1" value="<?= e($form['rating']) ?>">
                <?= $err('rating') ?>
            </label>
        </div>

        <div class="row-2">
            <label class="field">
                <span>Đạo diễn</span>
                <input class="input" name="director" value="<?= e($form['director']) ?>">
            </label>
            <label class="field">
                <span>Diễn viên</span>
                <input class="input" name="actors" value="<?= e($form['actors']) ?>">
            </label>
        </div>

        <div class="row-2">
            <label class="field">
                <span>Quốc gia</span>
                <input class="input" name="country" value="<?= e($form['country']) ?>">
            </label>
            <label class="field">
                <span>Ngôn ngữ</span>
                <input class="input" name="language" value="<?= e($form['language']) ?>">
            </label>
        </div>

        <label class="field">
            <span>Link trailer YouTube</span>
            <input class="input" name="trailer_url" value="<?= e($form['trailer_url']) ?>" placeholder="https://www.youtube.com/watch?v=...">
            <?= $err('trailer_url') ?>
        </label>

        <div class="field">
            <span>Nội dung phim</span>
            <!-- Khong co JS: dung textarea thuong. Co JS: admin.js thay bang editor Quill -->
            <textarea class="input" name="description" rows="8" data-editor><?= e(sanitize_html((string) ($form['description'] ?? ''))) ?></textarea>
        </div>
    </section>

    <aside class="form-grid__side">
        <section class="card form-grid__publish">
            <h2 class="card__title">Xuất bản</h2>
            <label class="field">
                <span>Trạng thái</span>
                <select class="input" name="status">
                    <?php foreach (MOVIE_STATUS as $value => $label): ?>
                        <option value="<?= e($value) ?>"<?= $form['status'] === $value ? ' selected' : '' ?>><?= e($label) ?></option>
                    <?php endforeach; ?>
                </select>
                <?= $err('status') ?>
            </label>
            <button class="btn btn--primary btn--block" type="submit"><?= $movie ? 'Lưu thay đổi' : 'Thêm phim' ?></button>
        </section>

        <section class="card">
            <h2 class="card__title">Poster</h2>
            <?php if (!empty($form['poster_url'])): ?>
                <img class="poster-preview" src="../<?= e($form['poster_url']) ?>" alt="Poster hiện tại">
            <?php endif; ?>
            <label class="field">
                <span><?= empty($form['poster_url']) ? 'Chọn ảnh poster' : 'Thay poster' ?></span>
                <input class="input" type="file" name="poster" accept="image/jpeg,image/png,image/webp,image/gif" data-preview="posterPreview">
            </label>
            <div class="preview-list" id="posterPreview"></div>
        </section>

        <section class="card">
            <h2 class="card__title">Bộ ảnh phim</h2>
            <?php if ($images): ?>
                <p class="muted">Tick vào ảnh muốn xóa:</p>
                <div class="gallery">
                    <?php foreach ($images as $img): ?>
                        <label class="gallery__item">
                            <img src="../<?= e($img['image_url']) ?>" alt="" loading="lazy">
                            <input type="checkbox" name="remove_images[]" value="<?= (int) $img['image_id'] ?>"> Xóa
                        </label>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            <label class="field">
                <span>Thêm ảnh (chọn nhiều ảnh cùng lúc)</span>
                <input class="input" type="file" name="gallery[]" multiple accept="image/jpeg,image/png,image/webp,image/gif" data-preview="galleryPreview">
                <small class="muted">JPG/PNG/WEBP/GIF, tối đa <?= UPLOAD_MAX_BYTES / 1024 / 1024 ?> MB/ảnh, <?= UPLOAD_MAX_FILES ?> ảnh/lần.</small>
                <?= $err('gallery') ?>
            </label>
            <div class="preview-list" id="galleryPreview"></div>
        </section>
    </aside>
</form>
<?php
admin_footer(['https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js', 'assets/editor.js']);
