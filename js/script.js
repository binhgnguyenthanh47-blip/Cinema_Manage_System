const soPhimMotTrang = 8;

function boDau(chuoi) {
    return String(chuoi || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
}

function chuoiThoiLuong(p) {
    return p && p.thoiLuong ? p.thoiLuong + " phút" : "Đang cập nhật";
}

function layThamSo(ten) {
    return new URLSearchParams(location.search).get(ten);
}

function layIdYoutube(url) {
    const giaTri = String(url || "").trim();
    if (!giaTri) return "";
    const khop = giaTri.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (khop && khop[1]) return khop[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(giaTri)) return giaTri;
    return "";
}

function timRap(id) {
    return dsRap.find(function (r) {
        return Number(r.id) === Number(id);
    }) || { id: id, ten: "Rạp " + id, cum: "Cụm rạp" };
}

function layDanhSachCum() {
    const dsCum = [];
    for (let i = 0; i < dsRap.length; i++) {
        if (dsRap[i].cum && dsCum.indexOf(dsRap[i].cum) === -1) {
            dsCum.push(dsRap[i].cum);
        }
    }
    return dsCum;
}

function thayAnhLoi(anh) {
    const khoi = document.createElement("div");
    khoi.className = "anh-loi " + anh.className;
    khoi.textContent = anh.alt;
    anh.replaceWith(khoi);
}

function tenRapDayDu(rap) {
    return rap.cum ? rap.cum + " - " + rap.ten : rap.ten;
}

function taoAnh(p, lop) {
    const src = (p.anh || '').replace(/^(\.\.\/|\/)+/, '');
    return '<img' + (lop ? ' class="' + lop + '"' : '') + ' src="' + src + '" alt="' + p.ten + '" onerror="thayAnhLoi(this)">';
}

function taoThePhim(p) {
    const lienKet = "chitiet.html?id=" + p.id;
    const chuNutDau = p.trangThai == "sap" ? "Chi tiết" : "Mua vé";
    let diem = "";
    if (!isNaN(parseFloat(p.diem))) {
        diem = '<span class="the-phim__diem">' + p.diem + '</span>';
    }
    return '<div class="the-phim">' +
        '<div class="the-phim__poster">' +
        '<a href="' + lienKet + '">' + taoAnh(p, "") + '</a>' +
        '<span class="the-phim__nhan">' + p.doTuoi + '</span>' + diem +
        '<div class="the-phim__hanh-dong">' +
        '<a class="nut nut--chinh" href="' + lienKet + '#lichChieu">' + chuNutDau + '</a>' +
        '<a class="nut nut--trang" href="' + lienKet + '#khungTrailer">Xem trailer</a>' +
        '</div></div>' +
        '<a class="the-phim__ten" href="' + lienKet + '">' + p.ten + '</a>' +
        '<span class="the-phim__thong-tin">' + p.theLoai + ' - ' + chuoiThoiLuong(p) + '</span></div>';
}

function veLuoiPhim(ds, luoi) {
    if (!luoi) return;
    if (ds.length == 0) {
        luoi.innerHTML = '<div class="luoi-phim__trong">Không có phim phù hợp.</div>';
        return;
    }
    let html = "";
    for (let i = 0; i < ds.length; i++) {
        html += taoThePhim(ds[i]);
    }
    luoi.innerHTML = html;
}

function veTaiKhoan() {
    localStorage.removeItem("dsNguoiDung");
    localStorage.removeItem("nguoiDangNhap");
    if (window.AuthService && typeof window.AuthService.renderHeaderAccount === "function") {
        window.AuthService.renderHeaderAccount();
    }
}

function khoiTaoTrangChu() {
    const dsAnh = document.getElementById("dsAnhBanner");
    const dsCham = document.getElementById("dsCham");
    const luoi = document.getElementById("luoiPhim");
    const dsNutTab = document.querySelectorAll("#dsTab button");
    const phimNoiBat = dsPhim.filter(function (p) {
        return p.trangThai == "dang";
    }).slice(0, 4);
    let viTri = 0;
    let boDem;

    let htmlAnh = "";
    let htmlCham = "";
    for (let i = 0; i < phimNoiBat.length; i++) {
        htmlAnh += '<a class="banner__anh" href="chitiet.html?id=' + phimNoiBat[i].id + '">' +
            taoAnh(phimNoiBat[i], "banner__poster") +
            '<div class="banner__chu"><b class="banner__ten">' + phimNoiBat[i].ten + '</b>' +
            '<span class="banner__loai">' + phimNoiBat[i].theLoai + ' - ' + chuoiThoiLuong(phimNoiBat[i]) + '</span>' +
            '<span class="nut nut--chinh">Xem chi tiết</span></div></a>';
        htmlCham += '<button class="banner__diem"></button>';
    }
    dsAnh.innerHTML = htmlAnh;
    dsCham.innerHTML = htmlCham;

    const anh = dsAnh.children;
    const cham = dsCham.children;

    function hienAnh(vt) {
        viTri = (vt + phimNoiBat.length) % phimNoiBat.length;
        for (let i = 0; i < anh.length; i++) {
            anh[i].classList.toggle("banner__anh--hien", i == viTri);
            cham[i].classList.toggle("banner__diem--hien", i == viTri);
        }
    }

    function batDauTuDong() {
        clearInterval(boDem);
        boDem = setInterval(function () {
            hienAnh(viTri + 1);
        }, 4000);
    }

    document.getElementById("nutTrai").addEventListener("click", function () {
        hienAnh(viTri - 1);
        batDauTuDong();
    });

    document.getElementById("nutPhai").addEventListener("click", function () {
        hienAnh(viTri + 1);
        batDauTuDong();
    });

    for (let i = 0; i < cham.length; i++) {
        cham[i].addEventListener("click", function () {
            hienAnh(i);
            batDauTuDong();
        });
    }

    if (phimNoiBat.length > 0) {
        hienAnh(0);
        batDauTuDong();
    }

    function hienThiTheoTab(tt) {
        const ds = dsPhim.filter(function (p) {
            return p.trangThai == tt;
        }).slice(0, 4);
        veLuoiPhim(ds, luoi);
    }

    for (let i = 0; i < dsNutTab.length; i++) {
        dsNutTab[i].addEventListener("click", function () {
            for (let j = 0; j < dsNutTab.length; j++) {
                dsNutTab[j].classList.remove("tab__nut--hien");
            }
            dsNutTab[i].classList.add("tab__nut--hien");
            hienThiTheoTab(dsNutTab[i].dataset.tt);
        });
    }

    hienThiTheoTab("dang");
}

function khoiTaoDanhSach() {
    const luoi = document.getElementById("luoiPhim");
    const phanTrang = document.getElementById("phanTrang");
    const dsNutTab = document.querySelectorAll("#dsTab button");
    const locLoai = document.getElementById("locLoai");
    const locCum = document.getElementById("locCum");
    const locRap = document.getElementById("locRap");
    const locNgay = document.getElementById("locNgay");
    const tuKhoa = boDau((layThamSo("tukhoa") || "").trim());

    let trangThai = layThamSo("tab") === "sap" ? "sap" : "dang";
    if (trangThai === "sap") {
        for (let i = 0; i < dsNutTab.length; i++) {
            dsNutTab[i].classList.toggle("tab__nut--hien", dsNutTab[i].dataset.tt === "sap");
        }
    }
    let trangHienTai = 1;
    let boLoc = {loai: "", cum: "", rap: "", ngay: ""};

    let dsLoai = [];
    for (let i = 0; i < dsPhim.length; i++) {
        if (dsLoai.indexOf(dsPhim[i].theLoai) == -1) {
            dsLoai.push(dsPhim[i].theLoai);
        }
    }

    let htmlLoai = '<option value="">Thể loại</option>';
    for (let i = 0; i < dsLoai.length; i++) {
        htmlLoai += '<option value="' + dsLoai[i] + '">' + dsLoai[i] + '</option>';
    }
    locLoai.innerHTML = htmlLoai;

    let htmlCum = '<option value="">Cụm rạp</option>';
    const dsCum = layDanhSachCum();
    for (let i = 0; i < dsCum.length; i++) {
        htmlCum += '<option value="' + dsCum[i] + '">' + dsCum[i] + '</option>';
    }
    locCum.innerHTML = htmlCum;

    let htmlNgay = '<option value="">Ngày chiếu</option>';
    for (let i = 0; i < dsNgayHienTai.length; i++) {
        htmlNgay += '<option value="' + dsNgayHienTai[i].so + '">' + dsNgayHienTai[i].nhan + '</option>';
    }
    locNgay.innerHTML = htmlNgay;

    function napDanhSachRap() {
        let html = '<option value="">Rạp</option>';
        for (let i = 0; i < dsRap.length; i++) {
            if (locCum.value == "" || dsRap[i].cum == locCum.value) {
                html += '<option value="' + dsRap[i].id + '">' + dsRap[i].ten + '</option>';
            }
        }
        locRap.innerHTML = html;
    }

    napDanhSachRap();
    locCum.addEventListener("change", napDanhSachRap);

    function layDanhSachLoc() {
        return dsPhim.filter(function (p) {
            if (p.trangThai != trangThai) return false;
            if (tuKhoa != "" && boDau(p.ten).indexOf(tuKhoa) == -1) return false;
            if (boLoc.loai != "" && p.theLoai != boLoc.loai) return false;
            if (boLoc.rap != "" && p.rap.indexOf(Number(boLoc.rap)) == -1) return false;
            if (boLoc.cum != "") {
                const coCum = p.rap.some(function (r) {
                    return timRap(r).cum == boLoc.cum;
                });
                if (!coCum) return false;
            }
            if (boLoc.ngay != "" && !coNgayChieu(p, boLoc.ngay)) return false;
            return true;
        });
    }

    function veTrang() {
        const ds = layDanhSachLoc();
        const tongTrang = Math.ceil(ds.length / soPhimMotTrang);
        if (trangHienTai > tongTrang) trangHienTai = 1;

        const batDau = (trangHienTai - 1) * soPhimMotTrang;
        veLuoiPhim(ds.slice(batDau, batDau + soPhimMotTrang), luoi);

        if (tongTrang <= 1) {
            phanTrang.innerHTML = "";
            return;
        }
        let html = '<button class="phan-trang__nut" data-trang="' + (trangHienTai - 1) + '"><</button>';
        for (let i = 1; i <= tongTrang; i++) {
            html += '<button class="phan-trang__nut' + (i == trangHienTai ? ' phan-trang__nut--hien' : '') + '" data-trang="' + i + '">' + i + '</button>';
        }
        html += '<button class="phan-trang__nut" data-trang="' + (trangHienTai + 1) + '">></button>';
        phanTrang.innerHTML = html;

        const dsNut = phanTrang.querySelectorAll("button");
        for (let i = 0; i < dsNut.length; i++) {
            dsNut[i].addEventListener("click", function () {
                const so = Number(dsNut[i].dataset.trang);
                if (so >= 1 && so <= tongTrang) {
                    trangHienTai = so;
                    veTrang();
                }
            });
        }
    }

    for (let i = 0; i < dsNutTab.length; i++) {
        dsNutTab[i].addEventListener("click", function () {
            for (let j = 0; j < dsNutTab.length; j++) {
                dsNutTab[j].classList.remove("tab__nut--hien");
            }
            dsNutTab[i].classList.add("tab__nut--hien");
            trangThai = dsNutTab[i].dataset.tt;
            trangHienTai = 1;
            veTrang();
        });
    }

    document.getElementById("nutLoc").addEventListener("click", function () {
        boLoc = {loai: locLoai.value, cum: locCum.value, rap: locRap.value, ngay: locNgay.value};
        trangHienTai = 1;
        veTrang();
    });

    veTrang();
}

function taoDongThongTin(nhan, giaTri) {
    return '<p><b>' + nhan + ':</b> ' + giaTri + '</p>';
}

function khoiTaoChiTiet() {
    const id = Number(layThamSo("id"));
    const phim = dsPhim.find(function (p) {
        return p.id == id;
    });

    if (!phim) {
        document.getElementById("noiDungChinh").innerHTML = '<p class="thong-bao-loi">Không tìm thấy phim. <a href="danhsach.html">Quay lại danh sách</a></p>';
        return;
    }

    document.title = phim.ten;
    document.getElementById("posterPhim").innerHTML = taoAnh(phim, "");
    document.getElementById("tenPhim").textContent = phim.ten;
    document.getElementById("dongMot").innerHTML = '<span class="chi-tiet__the chi-tiet__the--tuoi">' + phim.doTuoi + '</span>' +
        '<span class="chi-tiet__the">' + phim.theLoai + '</span>' +
        '<span class="chi-tiet__the">' + chuoiThoiLuong(phim) + '</span>' +
        '<span class="chi-tiet__the">Điểm đánh giá: ' + phim.diem + '</span>';
    document.getElementById("dongHai").innerHTML = taoDongThongTin("Đạo diễn", phim.daoDien) +
        taoDongThongTin("Diễn viên", phim.dienVien) +
        taoDongThongTin("Quốc gia", phim.quocGia) +
        taoDongThongTin("Ngôn ngữ", phim.ngonNgu) +
        taoDongThongTin("Khởi chiếu", phim.khoiChieu);
    document.getElementById("noiDungPhim").textContent = phim.noiDung;

    const khungTrailer = document.getElementById("khungTrailer");
    const duongDanTim = "https://www.youtube.com/results?search_query=" + encodeURIComponent(phim.ten + " official trailer");
    const youtubeId = layIdYoutube(phim.trailer);
    if (youtubeId != "" && location.protocol != "file:") {
        khungTrailer.innerHTML = '<iframe class="chi-tiet__video" src="https://www.youtube.com/embed/' + youtubeId + '" title="Trailer ' + phim.ten + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    } else if (youtubeId != "") {
        khungTrailer.innerHTML = '<a class="chi-tiet__trailer-lien" href="https://www.youtube.com/watch?v=' + youtubeId + '" target="_blank" rel="noopener">' +
            '<img class="chi-tiet__trailer-anh" src="https://img.youtube.com/vi/' + youtubeId + '/hqdefault.jpg" alt="Trailer ' + phim.ten + '">' +
            '<span class="nut nut--chinh chi-tiet__trailer-chu">Xem trailer trên YouTube</span></a>';
    } else {
        khungTrailer.innerHTML = '<a class="chi-tiet__trailer-lien" href="' + duongDanTim + '" target="_blank" rel="noopener">' +
            '<span class="nut nut--chinh chi-tiet__trailer-chu">Tìm trailer trên YouTube</span></a>';
    }

    document.getElementById("nutMuaVe").addEventListener("click", function () {
        document.getElementById("lichChieu").scrollIntoView({behavior: "smooth"});
    });

    const dsNgay = document.getElementById("dsNgay");
    const dsSuat = document.getElementById("dsSuat");

    let htmlNgay = "";
    for (let i = 0; i < dsNgayHienTai.length; i++) {
        const phan = dsNgayHienTai[i].nhan.split(" ");
        htmlNgay += '<button class="lich-chieu__ngay-nut" data-ngay="' + dsNgayHienTai[i].so + '">' +
            '<span class="lich-chieu__thu">' + phan[0] + '</span>' +
            '<span class="lich-chieu__so">' + phan[1] + '</span></button>';
    }
    dsNgay.innerHTML = htmlNgay;

    const dsNut = dsNgay.querySelectorAll("button");

    function veSuatChieu(ngay) {
        for (let i = 0; i < dsNut.length; i++) {
            dsNut[i].classList.toggle("lich-chieu__ngay-nut--chon", dsNut[i].dataset.ngay == String(ngay));
        }

        if (phim.trangThai == "sap") {
            dsSuat.innerHTML = '<p class="lich-chieu__thong-bao">Phim chưa có lịch chiếu.</p>';
            return;
        }
        if (!coNgayChieu(phim, ngay)) {
            dsSuat.innerHTML = '<p class="lich-chieu__thong-bao">Không có suất chiếu trong ngày này.</p>';
            return;
        }

        const ngayDuocChon = dsNgayHienTai.find(function (n) {
            return String(n.so) == String(ngay);
        });
        const ngayDayDu = ngayDuocChon.nhan.split(" ")[1] + "/2026";

        const dsSuatTrongNgay = laySuatTheoNgay(phim, ngay);
        let html = "";
        for (let i = 0; i < dsSuatTrongNgay.length; i++) {
            const rap = timRap(dsSuatTrongNgay[i].rap);
            const suatCuaRap = dsSuatTrongNgay[i];
            const tenRapHienThi = tenRapDayDu(rap);
            html += '<div class="lich-chieu__rap"><b class="lich-chieu__tieu-de">' + tenRapHienThi + '</b>';
            for (let j = 0; j < suatCuaRap.suat.length; j++) {
                html += '<div class="lich-chieu__suat"><span class="lich-chieu__dinh-dang">' + suatCuaRap.suat[j].dinhDang + '</span>';
                for (let k = 0; k < suatCuaRap.suat[j].gio.length; k++) {
                    const gio = suatCuaRap.suat[j].gio[k];
                    const duongDanDatVe = "booking.html?movie=" + encodeURIComponent(phim.ten) +
                        "&cinema=" + encodeURIComponent(tenRapHienThi) +
                        "&date=" + encodeURIComponent(ngayDayDu) +
                        "&time=" + encodeURIComponent(gio);
                    html += '<a class="lich-chieu__gio" href="' + duongDanDatVe + '">' + gio + '</a>';
                }
                html += '</div>';
            }
            html += '</div>';
        }
        dsSuat.innerHTML = html;
    }

    for (let i = 0; i < dsNut.length; i++) {
        dsNut[i].addEventListener("click", function () {
            veSuatChieu(dsNut[i].dataset.ngay);
        });
    }

    if (dsNgayHienTai.length > 0) {
        veSuatChieu(dsNgayHienTai[0].so);
    }
}

async function khoiTao() {
    if (location.protocol !== "file:" && typeof khoiTaoDuLieu === "function") {
        try {
            await khoiTaoDuLieu();
        } catch (err) {
            console.warn("Khong ket noi duoc API, su dung du lieu mac dinh:", err);
        }
    }

    window.duLieuDaTai = true;
    document.dispatchEvent(new Event("duLieuSanSang"));

    veTaiKhoan();

    if (document.getElementById("dsAnhBanner")) {
        khoiTaoTrangChu();
    }
    if (document.getElementById("phanTrang")) {
        khoiTaoDanhSach();
    }
    if (document.getElementById("posterPhim")) {
        khoiTaoChiTiet();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", khoiTao);
} else {
    khoiTao();
}