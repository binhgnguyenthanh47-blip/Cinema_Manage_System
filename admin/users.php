<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

$editId = int_param($_GET['edit'] ?? null);
$editing = $editId ? db_one('SELECT user_id, full_name, email, role FROM users WHERE user_id = ?', [$editId]) : null;
if ($editId && !$editing) {
    $editId = null;
}
$form = $editing ?? ['full_name' => '', 'email' => '', 'role' => ROLE_CUSTOMER];
$errors = [];

$adminCount = fn () => (int) db_value("SELECT COUNT(*) FROM users WHERE role = 'admin'");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'delete') {
        $id = int_param($_POST['id'] ?? null);
        $target = $id ? db_one('SELECT user_id, full_name, role FROM users WHERE user_id = ?', [$id]) : null;

        if (!$target) {
            flash('error', 'Không tìm thấy người dùng.');
        } elseif ((int) $target['user_id'] === $user['user_id']) {
            flash('error', 'Bạn không thể tự xóa tài khoản của mình.');
        } elseif ((int) db_value('SELECT COUNT(*) FROM bookings WHERE user_id = ?', [$id]) > 0) {
            flash('error', 'Người dùng "' . $target['full_name'] . '" đã có đơn đặt vé, không thể xóa.');
        } else {
            db_query('DELETE FROM users WHERE user_id = ?', [$id]);
            flash('success', 'Đã xóa người dùng "' . $target['full_name'] . '".');
        }
        redirect('users.php?' . http_build_query(array_intersect_key($_GET, array_flip(['q', 'role', 'page']))));
    }

    if ($action === 'save') {
        $id = int_param($_POST['id'] ?? null);
        $form = [
            'full_name' => str_param($_POST['full_name'] ?? '', 100),
            'email'     => mb_strtolower(str_param($_POST['email'] ?? '', 255)),
            'role'      => str_param($_POST['role'] ?? '', 20),
        ];
        $password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';

        if ($form['full_name'] === '') $errors['full_name'] = 'Vui lòng nhập họ tên.';
        if (!filter_var($form['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Email không hợp lệ.';
        if (!isset(ROLES[$form['role']])) $errors['role'] = 'Vai trò không hợp lệ.';
        if ((!$id || $password !== '') && (mb_strlen($password) < 6 || mb_strlen($password) > 128)) {
            $errors['password'] = 'Mật khẩu từ 6 đến 128 ký tự.';
        }
        if (!isset($errors['email']) && db_value('SELECT 1 FROM users WHERE email = ? AND user_id <> ?', [$form['email'], $id ?? 0])) {
            $errors['email'] = 'Email đã được dùng bởi tài khoản khác.';
        }

        $old = $id ? db_one('SELECT role FROM users WHERE user_id = ?', [$id]) : null;
        if ($id && !$old) {
            $errors['full_name'] = 'Không tìm thấy người dùng.';
        }
        // Khong cho ha quyen chinh minh / admin cuoi cung -> tranh mat quyen quan tri
        if ($old && $old['role'] === ROLE_ADMIN && $form['role'] !== ROLE_ADMIN) {
            if ($id === $user['user_id']) {
                $errors['role'] = 'Bạn không thể tự hạ quyền của mình.';
            } elseif ($adminCount() <= 1) {
                $errors['role'] = 'Phải còn ít nhất 1 quản trị viên.';
            }
        }

        if (!$errors) {
            if ($id) {
                db_query('UPDATE users SET full_name = ?, email = ?, role = ? WHERE user_id = ?',
                    [$form['full_name'], $form['email'], $form['role'], $id]);
                if ($password !== '') {
                    db_query('UPDATE users SET password_hash = ? WHERE user_id = ?', [password_hash($password, PASSWORD_DEFAULT), $id]);
                }
                flash('success', 'Đã cập nhật tài khoản "' . $form['full_name'] . '".');
            } else {
                db_query('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                    [$form['full_name'], $form['email'], password_hash($password, PASSWORD_DEFAULT), $form['role']]);
                flash('success', 'Đã tạo tài khoản "' . $form['full_name'] . '".');
            }
            redirect('users.php');
        }
        $editId = $id;
    }
}

$where = [];
$params = [];
$q = str_param($_GET['q'] ?? '', 100);
if ($q !== '') {
    $where[] = '(u.full_name LIKE ? OR u.email LIKE ?)';
    array_push($params, "%$q%", "%$q%");
}
$role = $_GET['role'] ?? '';
if (isset(ROLES[$role])) {
    $where[] = 'u.role = ?';
    $params[] = $role;
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$total = (int) db_value("SELECT COUNT(*) FROM users u $whereSql", $params);
$p = paginate($total, 10, $_GET['page'] ?? 1);
$users = db_all(
    "SELECT u.user_id, u.full_name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.user_id AND b.status = 'paid') AS so_don
     FROM users u $whereSql
     ORDER BY u.user_id DESC
     LIMIT {$p['per_page']} OFFSET {$p['offset']}",
    $params
);

admin_header('Quản lý người dùng', 'users', $user);
$err = fn (string $key) => isset($errors[$key]) ? '<small class="field__error">' . e($errors[$key]) . '</small>' : '';
?>
<div class="grid-side">
    <section class="card">
        <?php admin_search_form('Tìm theo tên hoặc email...', ['role' => ['Mọi vai trò', ROLES]]); ?>
        <p class="muted">Tìm thấy <?= $p['total'] ?> tài khoản</p>
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th class="num">Đơn đã mua</th><th>Ngày tạo</th><th></th></tr></thead>
                <tbody>
                <?php foreach ($users as $u): ?>
                    <tr>
                        <td><strong><?= e($u['full_name']) ?></strong><?= (int) $u['user_id'] === $user['user_id'] ? ' <small class="muted">(bạn)</small>' : '' ?></td>
                        <td><?= e($u['email']) ?></td>
                        <td><?= badge($u['role'], ROLES) ?></td>
                        <td class="num"><?= (int) $u['so_don'] ?></td>
                        <td><?= e(format_datetime($u['created_at'], 'd/m/Y')) ?></td>
                        <td class="actions">
                            <a class="btn btn--sm" href="?edit=<?= (int) $u['user_id'] ?>">Sửa</a>
                            <?php if ((int) $u['user_id'] !== $user['user_id']): ?>
                                <?= delete_button('', (int) $u['user_id'], 'Xóa tài khoản "' . $u['full_name'] . '"?') ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$users): ?>
                    <tr><td colspan="6" class="muted center">Không có tài khoản nào.</td></tr>
                <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?= pagination_links($p) ?>
    </section>

    <form class="card" method="post" action="users.php<?= $editId ? '?edit=' . $editId : '' ?>">
        <h2 class="card__title"><?= $editId ? 'Sửa tài khoản' : 'Tạo tài khoản' ?></h2>
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="save">
        <input type="hidden" name="id" value="<?= (int) $editId ?>">

        <label class="field"><span>Họ tên *</span>
            <input class="input" name="full_name" value="<?= e($form['full_name']) ?>" required maxlength="100"><?= $err('full_name') ?></label>
        <label class="field"><span>Email *</span>
            <input class="input" type="email" name="email" value="<?= e($form['email']) ?>" required maxlength="255" autocomplete="off"><?= $err('email') ?></label>
        <label class="field"><span>Vai trò</span>
            <select class="input" name="role">
                <?php foreach (ROLES as $value => $label): ?>
                    <option value="<?= e($value) ?>"<?= $form['role'] === $value ? ' selected' : '' ?>><?= e($label) ?></option>
                <?php endforeach; ?>
            </select><?= $err('role') ?></label>
        <label class="field"><span><?= $editId ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *' ?></span>
            <input class="input" type="password" name="password" minlength="6" maxlength="128" autocomplete="new-password"<?= $editId ? '' : ' required' ?>><?= $err('password') ?></label>

        <div class="form-actions">
            <button class="btn btn--primary" type="submit"><?= $editId ? 'Lưu thay đổi' : 'Tạo tài khoản' ?></button>
            <?php if ($editId): ?><a class="btn btn--ghost" href="users.php">Hủy</a><?php endif; ?>
        </div>
    </form>
</div>
<?php
admin_footer();
