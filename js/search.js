(function () {
    function boDauChuoi(chuoi) {
        return String(chuoi || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
    }

    // Escape du lieu truoc khi chen vao HTML (chong XSS)
    function escapeHtmlTim(giaTri) {
        return String(giaTri ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function khoiTaoTimKiem() {
        const oTim = document.getElementById("oTim");
        const goiY = document.getElementById("goiY");
        if (!oTim || !goiY) return;
        if (oTim.dataset.daGanTimKiem === "1") return;
        oTim.dataset.daGanTimKiem = "1";

        oTim.addEventListener("input", function () {
            const tuKhoa = boDauChuoi(oTim.value.trim());
            if (!tuKhoa) {
                goiY.classList.remove("o-tim__goi-y--hien");
                goiY.innerHTML = "";
                return;
            }

            const nguonPhim = typeof dsPhim !== "undefined" && Array.isArray(dsPhim) ? dsPhim : [];
            const ketQua = nguonPhim.filter(function (p) {
                const ten = boDauChuoi(p.ten);
                const theLoai = boDauChuoi(p.theLoai);
                const dienVien = boDauChuoi(p.dienVien);
                return ten.indexOf(tuKhoa) !== -1 || theLoai.indexOf(tuKhoa) !== -1 || dienVien.indexOf(tuKhoa) !== -1;
            }).slice(0, 5);

            if (ketQua.length === 0) {
                goiY.innerHTML = '<p class="o-tim__trong">Không tìm thấy phim</p>';
            } else {
                let html = "";
                for (let i = 0; i < ketQua.length; i++) {
                    html += '<a class="o-tim__muc" href="chitiet.html?id=' + encodeURIComponent(ketQua[i].id) + '">' +
                        taoAnh(ketQua[i], "o-tim__anh") +
                        '<span><span class="o-tim__ten">' + escapeHtmlTim(ketQua[i].ten) + '</span>' +
                        '<span class="o-tim__loai">' + escapeHtmlTim(ketQua[i].theLoai) + ' • ' + escapeHtmlTim(ketQua[i].doTuoi) + '</span></span></a>';
                }
                goiY.innerHTML = html;
            }
            goiY.classList.add("o-tim__goi-y--hien");
        });

        oTim.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && oTim.value.trim() !== "") {
                e.preventDefault();
                window.location.href = "danhsach.html?tukhoa=" + encodeURIComponent(oTim.value.trim());
            }
        });

        document.addEventListener("click", function (e) {
            if (!e.target.closest(".o-tim")) {
                goiY.classList.remove("o-tim__goi-y--hien");
            }
        });
    }

    window.SearchModule = {
        khoiTaoTimKiem: khoiTaoTimKiem
    };

    document.addEventListener("DOMContentLoaded", khoiTaoTimKiem);
})();