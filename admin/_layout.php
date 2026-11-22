<?php
/**
 * Khung giao dien chung cho trang Admin (menu, header, thong bao).
 */

declare(strict_types=1);

const ADMIN_MENU = [
    'index'    => ['Tổng quan', 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z'],
    'movies'   => ['Phim', 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4z'],
    'shows'    => ['Suất chiếu', 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'],
    'cinemas'  => ['Rạp chiếu', 'M12 2 2 7v2h20V7zm-8 9v7h3v-7zm6.5 0v7h3v-7zM17 11v7h3v-7zM2 20v2h20v-2z'],
    'halls'    => ['Phòng & ghế', 'M4 18v3h3v-3h10v3h3v-6H4zm15-8h3v3h-3zM2 10h3v3H2zm15 3H7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2z'],
    'bookings' => ['Đơn đặt vé', 'M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 1 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 1 1 0-4z'],
    'users'    => ['Người dùng', 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05C16.19 13.89 17 15.02 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'],
];

function admin_header(string $title, string $active, array $user): void
{
    $flashes = take_flashes();
    ?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?> · Cinema Admin</title>
    <link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<div class="admin">
    <aside class="sidebar" id="sidebar">
        <a class="sidebar__brand" href="index.php">🎬 Cinema<span>Admin</span></a>
        <nav class="sidebar__nav">
            <?php foreach (ADMIN_MENU as $key => [$label, $icon]): ?>
                <a class="sidebar__link<?= $key === $active ? ' is-active' : '' ?>" href="<?= e($key) ?>.php">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="<?= e($icon) ?>"/></svg>
                    <span><?= e($label) ?></span>
                </a>
            <?php endforeach; ?>
        </nav>
        <a class="sidebar__link sidebar__site" href="../index.html" target="_blank" rel="noopener">↗ Xem trang khách</a>
    </aside>
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

    <div class="main">
        <header class="topbar">
            <button class="topbar__menu" id="menuToggle" type="button" aria-label="Mở menu" aria-controls="sidebar">☰</button>
            <h1 class="topbar__title"><?= e($title) ?></h1>
            <div class="topbar__user">
                <span class="topbar__name"><?= e($user['full_name']) ?></span>
                <form method="post" action="logout.php">
                    <?= csrf_field() ?>
                    <button class="btn btn--ghost btn--sm" type="submit">Đăng xuất</button>
                </form>
            </div>
        </header>

        <main class="content">
            <?php foreach ($flashes as $f): ?>
                <div class="alert alert--<?= e($f['type']) ?>" role="status"><?= e($f['message']) ?></div>
            <?php endforeach; ?>
    <?php
}

function admin_footer(array $scripts = []): void
{
    ?>
        </main>
    </div>
</div>
<script src="assets/admin.js"></script>
<?php foreach ($scripts as $src): ?>
<script src="<?= e($src) ?>"></script>
<?php endforeach; ?>
</body>
</html>
    <?php
}

/** O tim kiem + bo loc dung chung cho cac trang danh sach. */
function admin_search_form(string $placeholder, array $selects = []): void
{
    ?>
    <form class="toolbar" method="get">
        <input class="input" type="search" name="q" value="<?= e($_GET['q'] ?? '') ?>" placeholder="<?= e($placeholder) ?>">
        <?php foreach ($selects as $name => [$label, $options]): ?>
            <select class="input" name="<?= e($name) ?>" aria-label="<?= e($label) ?>">
                <option value=""><?= e($label) ?></option>
                <?php foreach ($options as $value => $text): ?>
                    <option value="<?= e($value) ?>"<?= (string) ($_GET[$name] ?? '') === (string) $value ? ' selected' : '' ?>><?= e($text) ?></option>
                <?php endforeach; ?>
            </select>
        <?php endforeach; ?>
        <button class="btn" type="submit">Lọc</button>
        <?php if (!empty(array_filter(array_intersect_key($_GET, array_flip(array_merge(['q'], array_keys($selects))))))): ?>
            <a class="btn btn--ghost" href="?">Xóa lọc</a>
        <?php endif; ?>
    </form>
    <?php
}

/** Nut xoa (form POST co CSRF + hop xac nhan). */
function delete_button(string $action, int $id, string $confirm, string $label = 'Xóa'): string
{
    return '<form method="post" action="' . e($action) . '" class="inline" data-confirm="' . e($confirm) . '">'
        . csrf_field()
        . '<input type="hidden" name="action" value="delete">'
        . '<input type="hidden" name="id" value="' . $id . '">'
        . '<button class="btn btn--danger btn--sm" type="submit">' . e($label) . '</button>'
        . '</form>';
}

const MOVIE_STATUS = ['now_showing' => 'Đang chiếu', 'coming_soon' => 'Sắp chiếu', 'ended' => 'Ngừng chiếu'];
const SHOW_STATUS = ['scheduled' => 'Đã lên lịch', 'cancelled' => 'Đã hủy', 'finished' => 'Đã chiếu'];
const SHOW_FORMAT = ['2d_sub' => '2D phụ đề', '2d_dubbed' => '2D lồng tiếng'];
const BOOKING_STATUS = ['pending' => 'Đang giữ ghế', 'paid' => 'Đã thanh toán', 'cancelled' => 'Đã hủy', 'expired' => 'Hết hạn'];
const SEAT_TYPE = ['standard' => 'Thường', 'vip' => 'VIP', 'couple' => 'Đôi'];
const ROLES = ['customer' => 'Khách hàng', 'admin' => 'Quản trị viên'];
const TICKET_STATUS = ['held' => 'Đang giữ', 'paid' => 'Đã thanh toán', 'cancelled' => 'Đã hủy', 'expired' => 'Hết hạn'];
const PAYMENT_STATUS = ['pending' => 'Chờ thanh toán', 'success' => 'Thành công', 'failed' => 'Thất bại', 'refunded' => 'Đã hoàn tiền'];
const PAYMENT_METHOD_LABEL =['cash' => 'Tiền mặt', 'bank_transfer' => 'Chuyển khoản', 'card' => 'Thẻ', 'ewallet' => 'Ví điện tử'];

function badge(string $value, array $labels): string
{
    return '<span class="badge badge--' . e($value) . '">' . e($labels[$value] ?? $value) . '</span>';
}
