<?php
/**
 * Dang nhap / dang xuat / phan quyen bang PHP session.
 * Mat khau luu dang bcrypt (password_hash), khong bao gio luu ban ro.
 */

declare(strict_types=1);

const ROLE_ADMIN = 'admin';
const ROLE_CUSTOMER = 'customer';

/** Nguoi dung dang dang nhap (doc lai tu DB de cap nhat quyen moi nhat). */
function current_user(): ?array
{
    static $cache = false;

    if ($cache !== false) {
        return $cache;
    }

    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        return $cache = null;
    }

    $user = db_one(
        'SELECT user_id, full_name, email, role FROM users WHERE user_id = ?',
        [$userId]
    );

    if (!$user) {
        // Tai khoan da bi xoa -> huy phien
        logout_user();
        return $cache = null;
    }

    $user['user_id'] = (int) $user['user_id'];
    return $cache = $user;
}

function is_admin(): bool
{
    $user = current_user();
    return $user !== null && $user['role'] === ROLE_ADMIN;
}

/** Kiem tra email + mat khau. Tra ve user neu dung. */
function attempt_login(string $email, string $password): ?array
{
    $user = db_one(
        'SELECT user_id, full_name, email, role, password_hash FROM users WHERE email = ?',
        [mb_strtolower(trim($email))]
    );

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return null;
    }

    // Tu nang cap thuat toan bam neu PHP co thuat toan moi hon
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        db_query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [password_hash($password, PASSWORD_DEFAULT), $user['user_id']]
        );
    }

    unset($user['password_hash']);
    $user['user_id'] = (int) $user['user_id'];
    return $user;
}

function login_user(array $user): void
{
    // Doi session id sau khi dang nhap: chong session fixation
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['user_id'];
}

function logout_user(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 42000,
            'path'     => $params['path'],
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
    session_destroy();
}

/** Thong tin user tra ve cho frontend (khong co du lieu nhay cam). */
function public_user(array $user): array
{
    return [
        'user_id'   => (int) $user['user_id'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
    ];
}

// ===== Dung trong API =====

function api_require_login(): array
{
    $user = current_user();
    if (!$user) {
        json_error('Vui lòng đăng nhập để tiếp tục.', 401);
    }
    return $user;
}

// ===== Dung trong trang Admin =====

function admin_require_login(): array
{
    $user = current_user();
    if (!$user) {
        redirect('login.php?next=' . urlencode($_SERVER['REQUEST_URI'] ?? ''));
    }
    if ($user['role'] !== ROLE_ADMIN) {
        error_page(
            403,
            'Không có quyền truy cập',
            'Tài khoản ' . $user['email'] . ' không phải quản trị viên nên không thể vào trang quản trị.',
            '../index.html',
            'Về trang chủ'
        );
    }
    return $user;
}
