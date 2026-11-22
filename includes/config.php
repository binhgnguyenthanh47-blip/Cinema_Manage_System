<?php
/**
 * Cau hinh he thong.
 * Doc tu file .env o thu muc goc (neu co), neu khong dung gia tri mac dinh
 * cua XAMPP (user root, khong mat khau).
 */

declare(strict_types=1);

function load_env_file(string $path): array
{
    if (!is_file($path)) {
        return [];
    }

    $values = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $values[trim($key)] = trim(trim($value), "\"'");
    }
    return $values;
}

$__env = load_env_file(dirname(__DIR__) . '/.env');

function env_value(string $key, string $default): string
{
    global $__env;
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    return $__env[$key] ?? $default;
}

define('DB_HOST', env_value('DB_HOST', '127.0.0.1'));
define('DB_PORT', (int) env_value('DB_PORT', '3306'));
define('DB_NAME', env_value('DB_NAME', 'cinema_management_dev'));
define('DB_USER', env_value('DB_USER', 'root'));
define('DB_PASSWORD', env_value('DB_PASSWORD', ''));

define('APP_TIMEZONE', env_value('APP_TIMEZONE', 'Asia/Ho_Chi_Minh'));
define('APP_DEBUG', env_value('APP_DEBUG', '0') === '1');

// Upload anh
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads/movies');
define('UPLOAD_URL', 'uploads/movies');          // duong dan tuong doi tu thu muc goc web
define('UPLOAD_MAX_BYTES', 5 * 1024 * 1024);     // 5 MB / anh
define('UPLOAD_MAX_FILES', 10);                  // toi da 10 anh / lan

// Dat ve
define('BOOKING_HOLD_MINUTES', 15);
define('BOOKING_MAX_SEATS', 8);

// Gia combo bap nuoc (server tu tinh tien, khong tin so tien trinh duyet gui len)
const COMBO_PRICES = [
    'solo'   => ['name' => 'Combo Solo', 'price' => 79000],
    'couple' => ['name' => 'Combo Couple', 'price' => 139000],
];
define('COMBO_MAX_QTY', 10);

// Ma giam gia: 'fixed' = tru thang so tien, 'percent' = giam % tren (tien ve + combo)
const VOUCHERS = [
    'CINEMA20' => ['type' => 'fixed', 'value' => 20000],
    'UTH2026'  => ['type' => 'percent', 'value' => 15],
];
