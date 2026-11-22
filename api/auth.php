<?php
/**
 * API tai khoan
 *   GET  api/auth.php?action=me        -> nguoi dang dang nhap (hoac null)
 *   POST api/auth.php?action=register  {full_name, email, password}
 *   POST api/auth.php?action=login     {email, password}
 *   POST api/auth.php?action=logout
 */

declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

api_guard(function (): void {
    $action = $_GET['action'] ?? 'me';

    switch ($action) {
        case 'me':
            require_method('GET');
            $user = current_user();
            json_ok($user ? public_user($user) : null);

        case 'register':
            require_method('POST');
            $body = read_json_body();

            $fullName = str_param($body['full_name'] ?? '', 100);
            $email = mb_strtolower(str_param($body['email'] ?? '', 255));
            $password = is_string($body['password'] ?? null) ? $body['password'] : '';

            if ($fullName === '') {
                json_error('Vui lòng nhập họ tên.');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_error('Email không hợp lệ.');
            }
            if (mb_strlen($password) < 6 || mb_strlen($password) > 128) {
                json_error('Mật khẩu phải có từ 6 đến 128 ký tự.');
            }

            if (db_value('SELECT 1 FROM users WHERE email = ?', [$email])) {
                json_error('Email này đã được đăng ký.', 409);
            }

            db_query(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
                [$fullName, $email, password_hash($password, PASSWORD_DEFAULT)]
            );

            $user = [
                'user_id'   => (int) db()->lastInsertId(),
                'full_name' => $fullName,
                'email'     => $email,
                'role'      => ROLE_CUSTOMER,
            ];
            login_user($user);
            json_ok(public_user($user), 'Đăng ký thành công.', 201);

        case 'login':
            require_method('POST');
            $body = read_json_body();

            $email = str_param($body['email'] ?? '', 255);
            $password = is_string($body['password'] ?? null) ? $body['password'] : '';

            if ($email === '' || $password === '') {
                json_error('Vui lòng nhập email và mật khẩu.');
            }

            $user = attempt_login($email, $password);
            if (!$user) {
                // Lam cham 1 chut de giam toc do do mat khau
                usleep(300000);
                json_error('Email hoặc mật khẩu không đúng.', 401);
            }

            login_user($user);
            json_ok(public_user($user), 'Đăng nhập thành công.');

        case 'logout':
            require_method('POST');
            read_json_body();
            logout_user();
            json_ok(null, 'Đã đăng xuất.');

        default:
            json_error('Hành động không hợp lệ.', 404);
    }
});
