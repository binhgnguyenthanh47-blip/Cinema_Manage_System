<?php
/**
 * Khoi tao chung cho moi trang PHP (API + Admin):
 * doc cau hinh, mo session, nap cac thu vien noi bo.
 */

declare(strict_types=1);

define('ROOT_PATH', dirname(__DIR__));

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

date_default_timezone_set(APP_TIMEZONE);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('CINEMASESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,              // JS khong doc duoc cookie phien
        'samesite' => 'Lax',             // giam nguy co CSRF
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_start();
}
