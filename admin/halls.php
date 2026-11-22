<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

const MAX_ROWS = 26;
const MAX_SEATS_PER_ROW = 30;

/** Sinh ghe tu dong: hang thuong, hang VIP, roi 1 hang ghe doi cuoi cung. */
function generate_seats(int $hallId, int $standardRows, int $vipRows, int $perRow, int $coupleSeats): int
{
    $count = 0;
    $rowIndex = 0;
    $insert = db()->prepare('INSERT INTO seats (hall_id, row_label, seat_number, seat_type) VALUES (?, ?, ?, ?)');

    foreach ([['standard', $standardRows], ['vip', $vipRows]] as [$type, $rows]) {
        for ($r = 0; $r < $rows; $r++, $rowIndex++) {
            for ($n = 1; $n <= $perRow; $n++) {
                $insert->execute([$hallId, chr(65 + $rowIndex), $n, $type]);
                $count++;
            }
        }
    }
    for ($n = 1; $n <= $coupleSeats; $n++) {
        $insert->execute([$hallId, chr(65 + $rowIndex), $n, 'couple']);
        $count++;
    }
    return $count;
}

$editId = int_param($_GET['edit'] ?? null);
$editing = $editId ? db_one('SELECT * FROM cinemahalls WHERE hall_id = ?', [$editId]) : null;
if ($editId && !$editing) {
    $editId = null;
}

$form = [
    'cinema_id' => $editing['cinema_id'] ?? (int_param($_GET['cinema_id'] ?? null) ?? ''),
    'hall_name' => $editing['hall_name'] ?? '',
    'standard_rows' => '5', 'vip_rows' => '2', 'per_row' => '10', 'couple_seats' => '5',
];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'delete') {
        $id = int_param($_POST['id'] ?? null);
        $hall = $id ? db_one('SELECT hall_name FROM cinemahalls WHERE hall_id = ?', [$id]) : null;

        if (!$hall) {
            flash('error', 'Không tìm thấy phòng.');
        } elseif ((int) db_value('SELECT COUNT(*) FROM shows WHERE hall_id = ?', [$id]) > 0) {
            flash('error', 'Phòng "' . $hall['hall_name'] . '" đã có suất chiếu, không thể xóa.');
        } else {
            $pdo = db();
            $pdo->beginTransaction();
            db_query('DELETE FROM seats WHERE hall_id = ?', [$id]);
            db_query('DELETE FROM cinemahalls WHERE hall_id = ?', [$id]);
            $pdo->commit();
            flash('success', 'Đã xóa phòng "' . $hall['hall_name'] . '" và toàn bộ ghế.');
        }
        redirect('halls.php?' . http_build_query(array_intersect_key($_GET, array_flip(['cinema_id', 'page']))));
    }

    if ($action === 'save') {
        $id = int_param($_POST['id'] ?? null);
        $form = [
            'cinema_id'     => str_param($_POST['cinema_id'] ?? '', 20),
            'hall_name'     => str_param($_POST['hall_name'] ?? '', 100),
            'standard_rows' => str_param($_POST['standard_rows'] ?? '0', 3),
            'vip_rows'      => str_param($_POST['vip_rows'] ?? '0', 3),
            'per_row'       => str_param($_POST['per_row'] ?? '0', 3),
            'couple_seats'  => str_param($_POST['couple_seats'] ?? '0', 3),
        ];

        $cinemaId = int_param($form['cinema_id']);
        if (!$cinemaId || !db_value('SELECT 1 FROM cinemas WHERE cinema_id = ?', [$cinemaId])) {
            $errors['cinema_id'] = 'Vui lòng chọn rạp.';
        }
        if ($form['hall_name'] === '') {
            $errors['hall_name'] = 'Vui lòng nhập tên phòng.';
        }

        if (!$id) {
            foreach (['standard_rows', 'vip_rows', 'per_row', 'couple_seats'] as $k) {
                if (!ctype_digit($form[$k])) {
                    $errors[$k] = 'Phải là số nguyên ≥ 0.';
                }
            }
            if (!$errors) {
                $rows = (int) $form['standard_rows'] + (int) $form['vip_rows'] + ((int) $form['couple_seats'] > 0 ? 1 : 0);
                if ($rows < 1 || $rows > MAX_ROWS) $errors['standard_rows'] = 'Tổng số hàng từ 1 đến ' . MAX_ROWS . '.';
                if ((int) $form['per_row'] < 1 || (int) $form['per_row'] > MAX_SEATS_PER_ROW) $errors['per_row'] = 'Số ghế mỗi hàng từ 1 đến ' . MAX_SEATS_PER_ROW . '.';
                if ((int) $form['couple_seats'] > MAX_SEATS_PER_ROW) $errors['couple_seats'] = 'Tối đa ' . MAX_SEATS_PER_ROW . ' ghế đôi.';
            }
        }

        if (!$errors) {
            $pdo = db();
            try {
                $pdo->beginTransaction();
                if ($id) {
                    db_query('UPDATE cinemahalls SET cinema_id = ?, hall_name = ? WHERE hall_id = ?', [$cinemaId, $form['hall_name'], $id]);
                    $message = 'Đã cập nhật phòng "' . $form['hall_name'] . '".';
                } else {
                    db_query('INSERT INTO cinemahalls (cinema_id, hall_name) VALUES (?, ?)', [$cinemaId, $form['hall_name']]);
                    $newId = (int) $pdo->lastInsertId();
                    $seatCount = generate_seats(
                        $newId,
                        (int) $form['standard_rows'],
                        (int) $form['vip_rows'],
                        (int) $form['per_row'],
                        (int) $form['couple_seats']
                    );
                    $message = 'Đã thêm phòng "' . $form['hall_name'] . '" với ' . $seatCount . ' ghế.';
                }
                $pdo->commit();
                flash('success', $message);
                redirect('halls.php?cinema_id=' . $cinemaId);
            } catch (PDOException $ex) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                $errors['db'] = ((int) ($ex->errorInfo[1] ?? 0)) === 1062
                    ? 'Rạp này đã có phòng tên "' . $form['hall_name'] . '".'
                    : db_error_message($ex);
            }
        }
        $editId = $id;
    }
}

$cinemas = array_column(db_all('SELECT cinema_id, name FROM cinemas ORDER BY name'), 'name', 'cinema_id');

$filterCinema = int_param($_GET['cinema_id'] ?? null);
$where = $filterCinema ? 'WHERE h.cinema_id = ?' : '';
$params = $filterCinema ? [$filterCinema] : [];

$total = (int) db_value("SELECT COUNT(*) FROM cinemahalls h $where", $params);
$p = paginate($total, 10, $_GET['page'] ?? 1);
$halls = db_all(
    "SELECT h.hall_id, h.hall_name, c.name AS cinema_name,
            (SELECT COUNT(*) FROM seats s WHERE s.hall_id = h.hall_id) AS so_ghe,
            (SELECT COUNT(*) FROM shows sh WHERE sh.hall_id = h.hall_id) AS so_suat
     FROM cinemahalls h JOIN cinemas c ON c.cinema_id = h.cinema_id
     $where
     ORDER BY c.name, h.hall_name
     LIMIT {$p['per_page']} OFFSET {$p['offset']}",
    $params
);

admin_header('Phòng chiếu & ghế', 'halls', $user);
$err = fn (string $key) => isset($errors[$key]) ? '<small class="field__error">' . e($errors[$key]) . '</small>' : '';
?>
<?php if (isset($errors['db'])): ?>
    <div class="alert alert--error"><?= e($errors['db']) ?></div>
<?php endif; ?>

<div class="grid-side">
    <section class="card">
        <form class="toolbar" method="get">
            <select class="input" name="cinema_id" aria-label="Lọc theo rạp">
                <option value="">Mọi rạp</option>
                <?php foreach ($cinemas as $cid => $name): ?>
                    <option value="<?= (int) $cid ?>"<?= $filterCinema === (int) $cid ? ' selected' : '' ?>><?= e($name) ?></option>
                <?php endforeach; ?>
            </select>
            <button class="btn" type="submit">Lọc</button>
        </form>

        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Phòng</th><th>Rạp</th><th class="num">Ghế</th><th class="num">Suất</th><th></th></tr></thead>
                <tbody>
                <?php foreach ($halls as $h): ?>
                    <tr>
                        <td><strong><?= e($h['hall_name']) ?></strong></td>
                        <td><?= e($h['cinema_name']) ?></td>
                        <td class="num"><?= (int) $h['so_ghe'] ?></td>
                        <td class="num"><?= (int) $h['so_suat'] ?></td>
                        <td class="actions">
                            <a class="btn btn--sm" href="hall_seats.php?hall_id=<?= (int) $h['hall_id'] ?>">Sơ đồ ghế</a>
                            <a class="btn btn--sm" href="?edit=<?= (int) $h['hall_id'] ?>">Sửa</a>
                            <?= delete_button('', (int) $h['hall_id'], 'Xóa phòng "' . $h['hall_name'] . '" và toàn bộ ghế?') ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$halls): ?>
                    <tr><td colspan="5" class="muted center">Chưa có phòng chiếu.</td></tr>
                <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?= pagination_links($p) ?>
    </section>

    <form class="card" method="post" action="halls.php<?= $editId ? '?edit=' . $editId : '' ?>">
        <h2 class="card__title"><?= $editId ? 'Sửa phòng chiếu' : 'Thêm phòng chiếu' ?></h2>
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="id" value="<?= (int) $editId ?>">

        <label class="field">
            <span>Rạp *</span>
            <select class="input" name="cinema_id" required>
                <option value="">-- Chọn rạp --</option>
                <?php foreach ($cinemas as $cid => $name): ?>
                    <option value="<?= (int) $cid ?>"<?= (string) $form['cinema_id'] === (string) $cid ? ' selected' : '' ?>><?= e($name) ?></option>
                <?php endforeach; ?>
            </select>
            <?= $err('cinema_id') ?>
        </label>
        <label class="field">
            <span>Tên phòng *</span>
            <input class="input" name="hall_name" value="<?= e($form['hall_name']) ?>" required maxlength="100" placeholder="VD: Phòng 01">
            <?= $err('hall_name') ?>
        </label>

        <?php if (!$editId): ?>
            <fieldset class="fieldset">
                <legend>Tự động tạo sơ đồ ghế</legend>
                <div class="row-2">
                    <label class="field"><span>Số hàng ghế thường</span>
                        <input class="input" type="number" name="standard_rows" min="0" max="<?= MAX_ROWS ?>" value="<?= e($form['standard_rows']) ?>"><?= $err('standard_rows') ?></label>
                    <label class="field"><span>Số hàng ghế VIP</span>
                        <input class="input" type="number" name="vip_rows" min="0" max="<?= MAX_ROWS ?>" value="<?= e($form['vip_rows']) ?>"><?= $err('vip_rows') ?></label>
                    <label class="field"><span>Số ghế mỗi hàng</span>
                        <input class="input" type="number" name="per_row" min="1" max="<?= MAX_SEATS_PER_ROW ?>" value="<?= e($form['per_row']) ?>"><?= $err('per_row') ?></label>
                    <label class="field"><span>Số ghế đôi (hàng cuối)</span>
                        <input class="input" type="number" name="couple_seats" min="0" max="<?= MAX_SEATS_PER_ROW ?>" value="<?= e($form['couple_seats']) ?>"><?= $err('couple_seats') ?></label>
                </div>
            </fieldset>
        <?php endif; ?>

        <div class="form-actions">
            <button class="btn btn--primary" type="submit"><?= $editId ? 'Lưu thay đổi' : 'Thêm phòng' ?></button>
            <?php if ($editId): ?><a class="btn btn--ghost" href="halls.php">Hủy</a><?php endif; ?>
        </div>
    </form>
</div>
<?php
admin_footer();
