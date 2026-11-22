<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/_layout.php';

$user = admin_require_login();

$stats = [
    'movies'   => (int) db_value("SELECT COUNT(*) FROM movies WHERE status = 'now_showing'"),
    'shows'    => (int) db_value("SELECT COUNT(*) FROM shows WHERE status = 'scheduled' AND start_time >= NOW()"),
    'users'    => (int) db_value("SELECT COUNT(*) FROM users WHERE role = 'customer'"),
    'tickets'  => (int) db_value("SELECT COUNT(*) FROM tickets WHERE status = 'paid'"),
    'revenue'  => (float) db_value("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success'"),
    'pending'  => (int) db_value("SELECT COUNT(*) FROM bookings WHERE status = 'pending' AND expires_at > NOW()"),
];

// Doanh thu 7 ngay gan nhat (ke ca ngay khong co doanh thu)
$rows = db_all(
    "SELECT DATE(paid_at) AS ngay, SUM(amount) AS tong
     FROM payments
     WHERE status = 'success' AND paid_at >= CURDATE() - INTERVAL 6 DAY
     GROUP BY DATE(paid_at)"
);
$byDay = array_column($rows, 'tong', 'ngay');
$chartLabels = [];
$chartData = [];
for ($i = 6; $i >= 0; $i--) {
    $day = date('Y-m-d', strtotime("-$i day"));
    $chartLabels[] = date('d/m', strtotime($day));
    $chartData[] = (float) ($byDay[$day] ?? 0);
}

$topMovies = db_all(
    "SELECT m.title, COUNT(t.ticket_id) AS so_ve, SUM(t.price) AS doanh_thu
     FROM tickets t
     JOIN shows s ON s.show_id = t.show_id
     JOIN movies m ON m.movie_id = s.movie_id
     WHERE t.status = 'paid'
     GROUP BY m.movie_id, m.title
     ORDER BY doanh_thu DESC
     LIMIT 5"
);

$recent = db_all(
    "SELECT b.booking_id, b.booking_time, b.status, b.total_amount, u.full_name
     FROM bookings b
     JOIN users u ON u.user_id = b.user_id
     ORDER BY b.booking_id DESC
     LIMIT 8"
);

admin_header('Tổng quan', 'index', $user);
?>
<section class="stats">
    <div class="stat"><span class="stat__label">Doanh thu</span><strong class="stat__value"><?= e(money($stats['revenue'])) ?></strong></div>
    <div class="stat"><span class="stat__label">Vé đã bán</span><strong class="stat__value"><?= $stats['tickets'] ?></strong></div>
    <div class="stat"><span class="stat__label">Phim đang chiếu</span><strong class="stat__value"><?= $stats['movies'] ?></strong></div>
    <div class="stat"><span class="stat__label">Suất sắp chiếu</span><strong class="stat__value"><?= $stats['shows'] ?></strong></div>
    <div class="stat"><span class="stat__label">Khách hàng</span><strong class="stat__value"><?= $stats['users'] ?></strong></div>
    <div class="stat"><span class="stat__label">Đơn đang giữ ghế</span><strong class="stat__value"><?= $stats['pending'] ?></strong></div>
</section>

<div class="grid-2">
    <section class="card">
        <h2 class="card__title">Doanh thu 7 ngày gần nhất</h2>
        <div class="chart-box">
            <canvas id="revenueChart"
                    data-labels="<?= e(json_encode($chartLabels)) ?>"
                    data-values="<?= e(json_encode($chartData)) ?>"
                    aria-label="Biểu đồ doanh thu 7 ngày" role="img"></canvas>
        </div>
    </section>

    <section class="card">
        <h2 class="card__title">Phim bán chạy</h2>
        <?php if (!$topMovies): ?>
            <p class="muted">Chưa có vé nào được bán.</p>
        <?php else: ?>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Phim</th><th class="num">Vé</th><th class="num">Tiền vé</th></tr></thead>
                    <tbody>
                    <?php foreach ($topMovies as $m): ?>
                        <tr>
                            <td><?= e($m['title']) ?></td>
                            <td class="num"><?= (int) $m['so_ve'] ?></td>
                            <td class="num"><?= e(money($m['doanh_thu'])) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </section>
</div>

<section class="card">
    <div class="card__head">
        <h2 class="card__title">Đơn đặt vé mới nhất</h2>
        <a class="btn btn--ghost btn--sm" href="bookings.php">Xem tất cả</a>
    </div>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Thời gian</th><th class="num">Tổng tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
            <?php foreach ($recent as $b): ?>
                <tr>
                    <td><a href="bookings.php?view=<?= (int) $b['booking_id'] ?>">#<?= (int) $b['booking_id'] ?></a></td>
                    <td><?= e($b['full_name']) ?></td>
                    <td><?= e(format_datetime($b['booking_time'])) ?></td>
                    <td class="num"><?= e(money($b['total_amount'])) ?></td>
                    <td><?= badge($b['status'], BOOKING_STATUS) ?></td>
                </tr>
            <?php endforeach; ?>
            <?php if (!$recent): ?>
                <tr><td colspan="5" class="muted center">Chưa có đơn nào.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</section>
<?php
admin_footer(['https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'assets/dashboard.js']);
