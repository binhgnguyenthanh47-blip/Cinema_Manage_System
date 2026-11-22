<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

if (is_admin()) {
    redirect('index.php');
}

$error = '';
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $email = str_param($_POST['email'] ?? '', 255);
    $password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';

    $user = $email !== '' && $password !== '' ? attempt_login($email, $password) : null;

    if (!$user) {
        usleep(300000);
        $error = 'Email hoặc mật khẩu không đúng.';
    } elseif ($user['role'] !== ROLE_ADMIN) {
        $error = 'Tài khoản này không có quyền quản trị.';
    } else {
        login_user($user);
        // Chi chuyen huong ve trang noi bo (chong open redirect)
        $next = $_GET['next'] ?? '';
        $safeNext = is_string($next) && preg_match('~^/[^/\\\\]~', $next) && str_contains($next, '/admin/') ? $next : 'index.php';
        redirect($safeNext);
    }
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập quản trị · Cinema Admin</title>
    <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="login-page">
<form class="login-card" method="post">
    <h1>🎬 Cinema<span>Admin</span></h1>
    <p class="muted">Đăng nhập bằng tài khoản quản trị viên</p>

    <?php if ($error): ?>
        <div class="alert alert--error" role="alert"><?= e($error) ?></div>
    <?php endif; ?>

    <?= csrf_field() ?>
    <label class="field">
        <span>Email</span>
        <input class="input" type="email" name="email" value="<?= e($email) ?>" required autofocus autocomplete="username">
    </label>
    <label class="field">
        <span>Mật khẩu</span>
        <input class="input" type="password" name="password" required autocomplete="current-password">
    </label>
    <button class="btn btn--primary btn--block" type="submit">Đăng nhập</button>
    <a class="muted login-card__back" href="../index.html">← Về trang khách</a>
</form>
</body>
</html>
