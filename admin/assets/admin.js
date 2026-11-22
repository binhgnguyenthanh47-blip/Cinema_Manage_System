// ===== Cinema Admin: tuong tac chung =====
(function () {
    // Menu tren dien thoai
    const admin = document.querySelector(".admin");
    const toggle = document.getElementById("menuToggle");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (admin && toggle) {
        toggle.addEventListener("click", () => admin.classList.toggle("menu-open"));
        backdrop?.addEventListener("click", () => admin.classList.remove("menu-open"));
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") admin.classList.remove("menu-open");
        });
    }

    // Hop xac nhan truoc khi xoa / huy (form co data-confirm)
    document.querySelectorAll("form[data-confirm]").forEach((form) => {
        form.addEventListener("submit", (e) => {
            if (!confirm(form.dataset.confirm)) e.preventDefault();
        });
    });
    document.querySelectorAll("[data-confirm-click]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            if (!confirm(btn.dataset.confirmClick)) e.preventDefault();
        });
    });

    // Xem truoc anh truoc khi upload
    document.querySelectorAll("input[type=file][data-preview]").forEach((input) => {
        const box = document.getElementById(input.dataset.preview);
        if (!box) return;
        input.addEventListener("change", () => {
            box.querySelectorAll("img").forEach((img) => URL.revokeObjectURL(img.src));
            box.innerHTML = "";
            Array.from(input.files || []).forEach((file) => {
                if (!file.type.startsWith("image/")) return;
                const img = document.createElement("img");
                img.src = URL.createObjectURL(file);
                img.alt = file.name;
                box.appendChild(img);
            });
        });
    });

    // Bang tren dien thoai: gan ten cot vao tung o (data-label) de CSS
    // hien moi dong thanh 1 the, moi o kem nhan cot (xem admin.css).
    document.querySelectorAll("table.table").forEach((table) => {
        const labels = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim());
        table.querySelectorAll("tbody tr").forEach((tr) => {
            Array.from(tr.children).forEach((td, i) => {
                if (td.colSpan > 1) {
                    td.classList.add("cell-full"); // dong "Khong co du lieu"
                } else if (labels[i]) {
                    td.dataset.label = labels[i];
                } else {
                    td.classList.add("cell-actions"); // cot nut Sua/Xoa khong co tieu de
                }
            });
        });
        table.classList.add("table--stack");
    });

    // Chon tat ca ghe
    const checkAll = document.getElementById("checkAllSeats");
    if (checkAll) {
        checkAll.addEventListener("change", () => {
            document.querySelectorAll('#seatForm input[name="seat_ids[]"]').forEach((cb) => {
                cb.checked = checkAll.checked;
            });
        });
    }
})();
