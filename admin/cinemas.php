<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

$editId = int_param($_GET['edit'] ?? null);
$editing = $editId ? db_one('SELECT * FROM cinemas WHERE cinema_id = ?', [$editId]) : null;
$form = $editing ?? ['name' => '', 'address' => '', 'cluster_name' => ''];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'delete') {
        $id = int_param($_POST['id'] ?? null);
        $cinema = $id ? db_one('SELECT name FROM cinemas WHERE cinema_id = ?', [$id]) : null;

        if (!$cinema) {
            flash('error', 'Không tìm thấy rạp.');
        } elseif ((int) db_value('SELECT COUNT(*) FROM cinemahalls WHERE cinema_id = ?', [$id]) > 0) {
            flash('error', 'Rạp "' . $cinema['name'] . '" còn phòng chiếu, hãy xóa phòng trước.');
        } else {
            db_query('DELETE FROM cinemas WHERE cinema_id = ?', [$id]);
            flash('success', 'Đã xóa rạp "' . $cinema['name'] . '".');
        }
        redirect('cinemas.php');
    }

    if ($action === 'save') {
        $form = [
            'name'         => str_param($_POST['name'] ?? '', 150),
            'address'      => str_param($_POST['address'] ?? '', 255),
            'cluster_name' => str_param($_POST['cluster_name'] ?? '', 100),
        ];
        $id = int_param($_POST['id'] ?? null);

        if ($form['name'] === '') $errors['name'] = 'Vui lòng nhập tên rạp.';
        if ($form['address'] === '') $errors['address'] = 'Vui lòng nhập địa chỉ.';

        if (!$errors) {
            $values = [$form['name'], $form['address'], $form['cluster_name'] ?: null];
            if ($id) {
                db_query('UPDATE cinemas SET name = ?, address = ?, cluster_name = ? WHERE cinema_id = ?', [...$values, $id]);
                flash('success', 'Đã cập nhật rạp "' . $form['name'] . '".');
            } else {
                db_query('INSERT INTO cinemas (name, address, cluster_name) VALUES (?, ?, ?)', $values);
                flash('success', 'Đã thêm rạp "' . $form['name'] . '".');
            }
            redirect('cinemas.php');
        }
        $editId = $id;
    }
}

$q = str_param($_GET['q'] ?? '', 100);
$where = $q !== '' ? 'WHERE c.name LIKE ? OR c.address LIKE ? OR c.cluster_name LIKE ?' : '';
$params = $q !== '' ? ["%$q%", "%$q%", "%$q%"] : [];

$total = (int) db_value("SELECT COUNT(*) FROM cinemas c $where", $params);
$p = paginate($total, 10, $_GET['page'] ?? 1);
$cinemas = db_all(
    "SELECT c.*, (SELECT COUNT(*) FROM cinemahalls h WHERE h.cinema_id = c.cinema_id) AS so_phong
     FROM cinemas c $where
     ORDER BY c.cinema_id DESC
     LIMIT {$p['per_page']} OFFSET {$p['offset']}",
    $params
);

admin_header('Quản lý rạp chiếu', 'cinemas', $user);
$err = fn (string $key) => isset($errors[$key]) ? '<small class="field__error">' . e($errors[$key]) . '</small>' : '';
?>
<div class="grid-side">
    <section class="card">
        <div class="page-head">
            <?php admin_search_form('Tìm theo tên, địa chỉ, cụm rạp...'); ?>
        </div>
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Tên rạp</th><th>Cụm rạp</th><th>Địa chỉ</th><th class="num">Phòng</th><th></th></tr></thead>
                <tbody>
                <?php foreach ($cinemas as $c): ?>
                    <tr>
                        <td><strong><?= e($c['name']) ?></strong></td>
                        <td><?= e($c['cluster_name'] ?: '—') ?></td>
                        <td><?= e($c['address']) ?></td>
                        <td class="num"><a href="halls.php?cinema_id=<?= (int) $c['cinema_id'] ?>"><?= (int) $c['so_phong'] ?></a></td>
                        <td class="actions">
                            <a class="btn btn--sm" href="?edit=<?= (int) $c['cinema_id'] ?>">Sửa</a>
                            <?= delete_button('cinemas.php', (int) $c['cinema_id'], 'Xóa rạp "' . $c['name'] . '"?') ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$cinemas): ?>
                    <tr><td colspan="5" class="muted center">Chưa có rạp nào.</td></tr>
                <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?= pagination_links($p) ?>
    </section>

    <form class="card" method="post" action="cinemas.php<?= $editId ? '?edit=' . $editId : '' ?>">
        <h2 class="card__title"><?= $editId ? 'Sửa rạp' : 'Thêm rạp mới' ?></h2>
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="id" value="<?= (int) $editId ?>">

        <label class="field">
            <span>Tên rạp *</span>
            <input class="input" name="name" value="<?= e($form['name']) ?>" required maxlength="150">
            <?= $err('name') ?>
        </label>
        <label class="field">
            <span>Cụm rạp</span>
            <input class="input" name="cluster_name" value="<?= e($form['cluster_name']) ?>" maxlength="100" placeholder="VD: Cụm rạp A">
        </label>
        <label class="field">
            <span>Địa chỉ *</span>
            <input class="input" name="address" value="<?= e($form['address']) ?>" required maxlength="255">
            <?= $err('address') ?>
        </label>

        <div class="form-actions">
            <button class="btn btn--primary" type="submit"><?= $editId ? 'Lưu thay đổi' : 'Thêm rạp' ?></button>
            <?php if ($editId): ?><a class="btn btn--ghost" href="cinemas.php">Hủy</a><?php endif; ?>
        </div>
    </form>
</div>
<?php
admin_footer();
