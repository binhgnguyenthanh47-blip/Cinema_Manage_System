// ===== Bieu do doanh thu tren trang Tong quan =====
(function () {
    const canvas = document.getElementById("revenueChart");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = JSON.parse(canvas.dataset.labels || "[]");
    const values = JSON.parse(canvas.dataset.values || "[]");
    const vnd = (v) => Number(v).toLocaleString("vi-VN") + "đ";

    new Chart(canvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Doanh thu",
                data: values,
                backgroundColor: "#6366F1",
                borderRadius: 6,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => vnd(ctx.parsed.y) } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    // Chua co doanh thu: van hien thang 0 - 100.000d thay vi 0,1d 0,2d...
                    suggestedMax: Math.max(...values, 0) > 0 ? undefined : 100000,
                    ticks: { precision: 0, callback: (v) => vnd(v) }
                },
                x: { grid: { display: false } }
            }
        }
    });
})();
