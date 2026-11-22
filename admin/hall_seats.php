<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

$hallId = int_param($_GET['hall_id'] ?? null);
$hall = $hallId ? db_one(
    'SELECT h.hall_id, h.hall_name, c.name AS cinema_name
     FROM cinemahalls h JOIN cinemas c ON c.cinema_id = h.cinema_id
     WHERE h.hall_id = ?',
    [$hallId]
) : null;

if (!$hall) {
    flash('error', 'Không tìm thấy phòng chiếu.');
    redirect('halls.php');
}

$self = 'hall_seats.php?hall_id=' . $hallId;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';
    $seatIds = array_values(array_filter(array_map('int_param', (array) ($_POST['seat_ids'] ?? []))));

    if (in_array($action, ['set_type', 'delete'], true) && !$seatIds) {
        flash('error', 'Hãy chọn ít nhất 1 ghế.');
        redirect($self);
    }

    $in = implode(',', array_fill(0, max(1, count($seatIds)), '?'));

    if ($action === 'set_type') {
        $type = $_POST['seat_type'] ?? '';
        if (!isset(SEAT_TYPE[$type])) {
            flash('error', 'Loại ghế không hợp lệ.');
        } else {
            $n = db_query("UPDATE seats SET seat_type = ? WHERE hall_id = ? AND seat_id IN ($in)", [$type, $hallId, ...$seatIds])->rowCount();
            flash('success', "Đã đổi $n ghế sang loại " . SEAT_TYPE[$type] . '.');
        }
    }

    if ($action === 'delete') {
        $used = (int) db_value("SELECT COUNT(DISTINCT seat_id) FROM tickets WHERE seat_id IN ($in)", $seatIds);
        if ($used > 0) {
            flash('error', "Có $used ghế đã từng được bán vé, không thể xóa. Hãy bỏ chọn các ghế đó.");
        } else {
            $n = db_query("DELETE FROM seats WHERE hall_id = ? AND seat_id IN ($in)", [$hallId, ...$seatIds])->rowCount();
            flash('success', "Đã xóa $n ghế.");
        }
    }

    if ($action === 'add_row') {
        $row = strtoupper(str_param($_POST['row_label'] ?? '', 5));
        $count = int_param($_POST['count'] ?? null) ?? 0;
        $type = $_POST['seat_type'] ?? '';

        if (!preg_match('/^[A-Z]{1,2}$/', $row) || $count < 1 || $count > 30 || !isset(SEAT_TYPE[$type])) {
            flash('error', 'Thông tin hàng ghế không hợp lệ (hàng A–Z, 1–30 ghế).');
        } else {
            $start = (int) db_value('SELECT COALESCE(MAX(seat_number), 0) FROM seats WHERE hall_id = ? AND row_label = ?', [$hallId, $row]);
            $insert = db()->prepare('INSERT INTO seats (hall_id, row_label, seat_number, seat_type) VALUES (?, ?, ?, ?)');
            for ($i = 1; $i <= $count; $i++) {
                $insert->execute([$hallId, $row, $start + $i, $type]);
            }
            flash('success', "Đã thêm $count ghế vào hàng $row.");
        }
    }

    redirect($self);
}

$seats = db_all(
    'SELECT seat_id, row_label, seat_number, seat_type FROM seats WHERE hall_id = ? ORDER BY row_label, seat_number',
    [$hallId]
);
$rows = [];
foreach ($seats as $s) {
    $rows[$s['row_label']][] = $s;
}
$countByType = array_count_values(array_column($seats, 'seat_type'));

admin_header('Sơ đồ ghế — ' . $hall['hall_name'], 'halls', $user);
?>
<p><a href="halls.php">← Danh sách phòng</a> · <?= e($hall['cinema_name']) ?></p>

<div class="grid-side">
    <form class="card" method="post" action="<?= e($self) ?>" id="seatForm">
        <?= csrf_field() ?>
        <div class="card__head">
            <h2 class="card__title">
                <?= count($seats) ?> ghế
                <small class="muted">
                    (<?php foreach (SEAT_TYPE as $k => $label): ?><?= e($label) ?>: <?= (int) ($countByType[$k] ?? 0) ?> <?php endforeach; ?>)
                </small>
            </h2>
            <label class="muted"><input type="checkbox" id="checkAllSeats"> Chọn tất cả</label>
        </div>

        <div class="screen">MÀN HÌNH</div>
        <div class="seat-map">
            <?php foreach ($rows as $label => $rowSeats): ?>
                <div class="seat-row">
                    <span class="seat-row__label"><?= e($label) ?></span>
                    <?php foreach ($rowSeats as $s): ?>
                        <label class="seat seat--<?= e($s['seat_type']) ?>" title="<?= e($label . $s['seat_number'] . ' · ' . SEAT_TYPE[$s['seat_type']]) ?>">
                            <input type="checkbox" name="seat_ids[]" value="<?= (int) $s['seat_id'] ?>">
                            <span><?= (int) $s['seat_number'] ?></span>
                        </label>
                    <?php endforeach; ?>
                </div>
            <?php endforeach; ?>
            <?php if (!$seats): ?>
                <p class="muted center">Phòng chưa có ghế. Thêm hàng ghế ở khung bên phải.</p>
            <?php endif; ?>
        </div>

        <div class="legend">
            <?php foreach (SEAT_TYPE as $k => $label): ?>
                <span><i class="seat seat--<?= e($k) ?> seat--dot"></i><?= e($label) ?></span>
            <?php endforeach; ?>
        </div>

        <div class="toolbar">
            <select class="input" name="seat_type" aria-label="Loại ghế">
                <?php foreach (SEAT_TYPE as $k => $label): ?>
                    <option value="<?= e($k) ?>"><?= e($label) ?></option>
                <?php endforeach; ?>
            </select>
            <button class="btn" type="submit" name="action" value="set_type">Đổi loại ghế đã chọn</button>
            <button class="btn btn--danger" type="submit" name="action" value="delete"
                    data-confirm-click="Xóa các ghế đã chọn?">Xóa ghế đã chọn</button>
        </div>
    </form>

    <form class="card" method="post" action="<?= e($self) ?>">
        <h2 class="card__title">Thêm hàng ghế</h2>
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="add_row">
        <label class="field"><span>Hàng (A–Z)</span>
            <input class="input" name="row_label" maxlength="2" required pattern="[A-Za-z]{1,2}" placeholder="VD: I"></label>
        <label class="field"><span>Số ghế</span>
            <input class="input" type="number" name="count" min="1" max="30" value="10" required></label>
        <label class="field"><span>Loại ghế</span>
            <select class="input" name="seat_type">
                <?php foreach (SEAT_TYPE as $k => $label): ?>
                    <option value="<?= e($k) ?>"><?= e($label) ?></option>
                <?php endforeach; ?>
            </select></label>
        <p class="muted">Nếu hàng đã tồn tại, ghế mới được nối tiếp vào cuối hàng.</p>
        <button class="btn btn--primary" type="submit">Thêm</button>
    </form>
</div>
<?php
admin_footer();
