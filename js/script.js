const soPhimMotTrang = 8;

function boDau(chuoi) {
    return String(chuoi || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
}

// Escape du lieu truoc khi chen vao HTML (chong XSS)
function escapeHtml(giaTri) {
    return String(giaTri ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function chuoiThoiLuong(p) {
    return p && p.thoiLuong ? p.thoiLuong + " phút" : "Đang cập nhật";
}

function layThamSo(ten) {
    return new URLSearchParams(location.search).get(ten);
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
    return '<img' + (lop ? ' class="' + escapeHtml(lop) + '"' : '') + ' src="' + escapeHtml(p.anh) + '" alt="' + escapeHtml(p.ten) + '" onerror="thayAnhLoi(this)">';
}

function taoThePhim(p) {
    const lienKet = "chitiet.html?id=" + encodeURIComponent(p.id);
    const chuNutDau = p.trangThai == "sap" ? "Chi tiết" : "Mua vé";
    let diem = "";
    if (!isNaN(parseFloat(p.diem))) {
        diem = '<span class="the-phim__diem">' + escapeHtml(p.diem) + '</span>';
    }
    return '<div class="the-phim">' +
        '<div class="the-phim__poster">' +
        '<a href="' + lienKet + '">' + taoAnh(p, "") + '</a>' +
        '<span class="the-phim__nhan">' + escapeHtml(p.doTuoi) + '</span>' + diem +
        '<div class="the-phim__hanh-dong">' +
        '<a class="nut nut--chinh" href="' + lienKet + '#lichChieu">' + chuNutDau + '</a>' +
        '<a class="nut nut--trang" href="' + lienKet + '#khungTrailer">Xem trailer</a>' +
        '</div></div>' +
        '<a class="the-phim__ten" href="' + lienKet + '">' + escapeHtml(p.ten) + '</a>' +
        '<span class="the-phim__thong-tin">' + escapeHtml(p.theLoai) + ' - ' + escapeHtml(chuoiThoiLuong(p)) + '</span></div>';
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

// Ban cu tung luu danh sach tai khoan + mat khau dang chu trong localStorage: xoa di
localStorage.removeItem("dsNguoiDung");

function layNguoiDangNhap() {
    return JSON.parse(localStorage.getItem("nguoiDangNhap") || "null");
}

function veTaiKhoan() {
    const khung = document.getElementById("taiKhoan");
    if (!khung) return;
    let nguoi = layNguoiDangNhap();
    khung.innerHTML = "";

    // Khi chay qua server: tai khoan cu chi luu o trinh duyet (khong co userId tu server)
    // khong dung duoc de dat ve -> buoc dang nhap lai.
    if (nguoi && dungDuLieuApi && !nguoi.userId) {
        localStorage.removeItem("nguoiDangNhap");
        nguoi = null;
    }

    if (nguoi) {
        const chao = document.createElement("span");
        chao.className = "dau-trang__chao";
        chao.textContent = "Xin chào, " + nguoi.hoTen;
        khung.appendChild(chao);

        // Tai khoan admin: hien nut vao trang quan tri
        if (nguoi.role === "admin") {
            const nutAdmin = document.createElement("a");
            nutAdmin.className = "nut nut--chinh";
            nutAdmin.href = "admin/index.php";
            nutAdmin.textContent = "Quản trị";
            khung.appendChild(nutAdmin);
        }

        const nutThoat = document.createElement("button");
        nutThoat.className = "nut";
        nutThoat.textContent = "Đăng xuất";
        nutThoat.addEventListener("click", async function () {
            if (dungDuLieuApi) {
                nutThoat.disabled = true;
                await goiApi("api/auth.php?action=logout", {method: "POST", body: {}});
            }
            localStorage.removeItem("nguoiDangNhap");
            location.reload();
        });
        khung.appendChild(nutThoat);
        return;
    }

    const nutVao = document.createElement("button");
    nutVao.className = "nut";
    nutVao.textContent = "Đăng nhập";
    nutVao.addEventListener("click", function () {
        moHopThoai("dangNhap");
    });

    const nutDangKy = document.createElement("button");
    nutDangKy.className = "nut nut--chinh";
    nutDangKy.textContent = "Đăng ký";
    nutDangKy.addEventListener("click", function () {
        moHopThoai("dangKy");
    });

    khung.appendChild(nutVao);
    khung.appendChild(nutDangKy);
}

// Dong bo trang thai dang nhap voi server (phien PHP la nguon chinh xac nhat)
async function dongBoTaiKhoanServer() {
    const kq = await goiApi("api/auth.php?action=me");
    if (!kq.ok) return; // loi mang: giu nguyen trang thai hien tai

    if (kq.data) {
        luuNguoiDangNhap(kq.data);
    } else {
        localStorage.removeItem("nguoiDangNhap");
    }
}

function luuNguoiDangNhap(user) {
    localStorage.setItem("nguoiDangNhap", JSON.stringify({
        hoTen: user.full_name,
        email: user.email,
        userId: user.user_id,
        role: user.role
    }));
}

let cheDoHop = "dangNhap";

function moHopThoai(cheDo) {
    cheDoHop = cheDo;
    const dangKy = cheDo == "dangKy";
    document.getElementById("tabDangNhap").classList.toggle("hop-thoai__tab--hien", !dangKy);
    document.getElementById("tabDangKy").classList.toggle("hop-thoai__tab--hien", dangKy);
    document.getElementById("dongHoTen").style.display = dangKy ? "block" : "none";
    document.getElementById("dongNhapLai").style.display = dangKy ? "block" : "none";
    document.getElementById("nutGui").textContent = dangKy ? "Tạo tài khoản" : "Đăng nhập";
    document.getElementById("bieuMau").reset();
    document.getElementById("thongBaoLoi").textContent = "";
    document.getElementById("hopThoai").classList.add("hop-thoai--hien");
    document.getElementById(dangKy ? "oHoTen" : "oEmail").focus();
}

function dongHopThoai() {
    const hop = document.getElementById("hopThoai");
    if (hop) hop.classList.remove("hop-thoai--hien");
}

// Dang ky / dang nhap qua server PHP: tai khoan luu trong MySQL,
// dung chung cho moi trinh duyet va moi may.
async function xacThucQuaApi(duongDan, duLieu, thongBao) {
    const nutGui = document.getElementById("nutGui");
    nutGui.disabled = true;
    thongBao.textContent = "";

    const kq = await goiApi(duongDan, {method: "POST", body: duLieu});
    nutGui.disabled = false;

    if (!kq.ok || !kq.data) {
        thongBao.textContent = kq.message || "Không thể xác thực tài khoản.";
        return;
    }

    luuNguoiDangNhap(kq.data);
    // Tai lai trang de cac module (dat ghe, thanh toan) nhan tai khoan moi
    location.reload();
}

function khoiTaoTaiKhoan() {
    if (!document.getElementById("taiKhoan")) return;

    const hop = document.createElement("div");
    hop.className = "hop-thoai";
    hop.id = "hopThoai";
    hop.innerHTML = '<div class="hop-thoai__noi-dung">' +
        '<div class="hop-thoai__dau">' +
        '<button class="hop-thoai__tab" id="tabDangNhap" type="button">Đăng nhập</button>' +
        '<button class="hop-thoai__tab" id="tabDangKy" type="button">Đăng ký</button>' +
        '<button class="hop-thoai__dong" id="nutDong" type="button">Đóng</button>' +
        '</div>' +
        '<form class="hop-thoai__form" id="bieuMau">' +
        '<div id="dongHoTen"><label class="hop-thoai__nhan" for="oHoTen">Họ tên</label><input class="hop-thoai__o" type="text" id="oHoTen"></div>' +
        '<div><label class="hop-thoai__nhan" for="oEmail">Email</label><input class="hop-thoai__o" type="text" id="oEmail"></div>' +
        '<div><label class="hop-thoai__nhan" for="oMatKhau">Mật khẩu</label><input class="hop-thoai__o" type="password" id="oMatKhau"></div>' +
        '<div id="dongNhapLai"><label class="hop-thoai__nhan" for="oNhapLai">Nhập lại mật khẩu</label><input class="hop-thoai__o" type="password" id="oNhapLai"></div>' +
        '<p class="hop-thoai__loi" id="thongBaoLoi"></p>' +
        '<button class="nut nut--chinh hop-thoai__gui" id="nutGui" type="submit"></button>' +
        '</form>' +
        '</div>';
    document.body.appendChild(hop);

    document.getElementById("nutDong").addEventListener("click", dongHopThoai);

    document.getElementById("tabDangNhap").addEventListener("click", function () {
        moHopThoai("dangNhap");
    });

    document.getElementById("tabDangKy").addEventListener("click", function () {
        moHopThoai("dangKy");
    });

    hop.addEventListener("click", function (e) {
        if (e.target == hop) dongHopThoai();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key == "Escape") dongHopThoai();
    });

    document.getElementById("bieuMau").addEventListener("submit", function (e) {
        e.preventDefault();
        const thongBao = document.getElementById("thongBaoLoi");
        const email = document.getElementById("oEmail").value.trim().toLowerCase();
        const matKhau = document.getElementById("oMatKhau").value;

        // Tai khoan chi luu tren server (MySQL, mat khau ma hoa bcrypt).
        // Mo file HTML truc tiep (khong co server) thi khong dang ky / dang nhap duoc.
        if (!dungDuLieuApi) {
            thongBao.textContent = "Không kết nối được máy chủ. Hãy mở website qua XAMPP (http://localhost/...) để đăng nhập.";
            return;
        }

        if (cheDoHop == "dangKy") {
            const hoTen = document.getElementById("oHoTen").value.trim();
            if (hoTen == "") {
                thongBao.textContent = "Vui lòng nhập họ tên.";
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                thongBao.textContent = "Email không hợp lệ.";
                return;
            }
            if (matKhau.length < 6) {
                thongBao.textContent = "Mật khẩu phải có ít nhất 6 ký tự.";
                return;
            }
            if (matKhau != document.getElementById("oNhapLai").value) {
                thongBao.textContent = "Mật khẩu nhập lại không khớp.";
                return;
            }
            xacThucQuaApi("api/auth.php?action=register", {full_name: hoTen, email: email, password: matKhau}, thongBao);
            return;
        }

        xacThucQuaApi("api/auth.php?action=login", {email: email, password: matKhau}, thongBao);
    });

    veTaiKhoan();
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
        htmlAnh += '<a class="banner__anh" href="chitiet.html?id=' + encodeURIComponent(phimNoiBat[i].id) + '">' +
            taoAnh(phimNoiBat[i], "banner__poster") +
            '<div class="banner__chu"><b class="banner__ten">' + escapeHtml(phimNoiBat[i].ten) + '</b>' +
            '<span class="banner__loai">' + escapeHtml(phimNoiBat[i].theLoai) + ' - ' + escapeHtml(chuoiThoiLuong(phimNoiBat[i])) + '</span>' +
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
        htmlLoai += '<option value="' + escapeHtml(dsLoai[i]) + '">' + escapeHtml(dsLoai[i]) + '</option>';
    }
    locLoai.innerHTML = htmlLoai;

    let htmlCum = '<option value="">Cụm rạp</option>';
    const dsCum = layDanhSachCum();
    for (let i = 0; i < dsCum.length; i++) {
        htmlCum += '<option value="' + escapeHtml(dsCum[i]) + '">' + escapeHtml(dsCum[i]) + '</option>';
    }
    locCum.innerHTML = htmlCum;

    let htmlNgay = '<option value="">Ngày chiếu</option>';
    for (let i = 0; i < dsNgayHienTai.length; i++) {
        htmlNgay += '<option value="' + escapeHtml(dsNgayHienTai[i].so) + '">' + escapeHtml(dsNgayHienTai[i].nhan) + '</option>';
    }
    locNgay.innerHTML = htmlNgay;

    function napDanhSachRap() {
        let html = '<option value="">Rạp</option>';
        for (let i = 0; i < dsRap.length; i++) {
            if (locCum.value == "" || dsRap[i].cum == locCum.value) {
                html += '<option value="' + escapeHtml(dsRap[i].id) + '">' + escapeHtml(dsRap[i].ten) + '</option>';
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
    return '<p><b>' + escapeHtml(nhan) + ':</b> ' + escapeHtml(giaTri) + '</p>';
}

// Bo anh cua phim (admin upload nhieu anh)
async function hienBoAnhPhim(idPhim) {
    const khung = document.getElementById("khungBoAnh");
    const luoi = document.getElementById("boAnhPhim");
    if (!khung || !luoi || !dungDuLieuApi) return;

    const kq = await goiApi("api/movies.php?id=" + encodeURIComponent(idPhim));
    const dsAnh = kq.ok && kq.data && Array.isArray(kq.data.images) ? kq.data.images : [];
    if (dsAnh.length === 0) return;

    luoi.innerHTML = "";
    dsAnh.forEach(function (url, i) {
        const lienKet = document.createElement("a");
        lienKet.className = "bo-anh__muc";
        lienKet.href = url;
        lienKet.target = "_blank";
        lienKet.rel = "noopener";
        const anh = document.createElement("img");
        anh.src = url;
        anh.alt = "Ảnh phim " + (i + 1);
        anh.loading = "lazy";
        lienKet.appendChild(anh);
        luoi.appendChild(lienKet);
    });
    khung.hidden = false;
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
    document.getElementById("dongMot").innerHTML = '<span class="chi-tiet__the chi-tiet__the--tuoi">' + escapeHtml(phim.doTuoi) + '</span>' +
        '<span class="chi-tiet__the">' + escapeHtml(phim.theLoai) + '</span>' +
        '<span class="chi-tiet__the">' + escapeHtml(chuoiThoiLuong(phim)) + '</span>' +
        '<span class="chi-tiet__the">Điểm đánh giá: ' + escapeHtml(phim.diem) + '</span>';
    document.getElementById("dongHai").innerHTML = taoDongThongTin("Đạo diễn", phim.daoDien) +
        taoDongThongTin("Diễn viên", phim.dienVien) +
        taoDongThongTin("Quốc gia", phim.quocGia) +
        taoDongThongTin("Ngôn ngữ", phim.ngonNgu) +
        taoDongThongTin("Khởi chiếu", phim.khoiChieu);
    const khungNoiDung = document.getElementById("noiDungPhim");
    if (phim.noiDungHtml) {
        // HTML tu editor admin, server da loc (chi giu the dinh dang an toan)
        khungNoiDung.innerHTML = phim.noiDung || "<p>Đang cập nhật.</p>";
    } else {
        khungNoiDung.textContent = phim.noiDung;
    }
    hienBoAnhPhim(phim.id);

    const khungTrailer = document.getElementById("khungTrailer");
    const duongDanTim = "https://www.youtube.com/results?search_query=" + encodeURIComponent(phim.ten + " official trailer");
    const maTrailer = encodeURIComponent(phim.trailer || "");
    if (maTrailer != "" && location.protocol != "file:") {
        khungTrailer.innerHTML = '<iframe class="chi-tiet__video" src="https://www.youtube.com/embed/' + maTrailer + '" allowfullscreen></iframe>';
    } else if (maTrailer != "") {
        khungTrailer.innerHTML = '<a class="chi-tiet__trailer-lien" href="https://www.youtube.com/watch?v=' + maTrailer + '" target="_blank" rel="noopener">' +
            '<img class="chi-tiet__trailer-anh" src="https://img.youtube.com/vi/' + maTrailer + '/hqdefault.jpg" alt="Trailer ' + escapeHtml(phim.ten) + '">' +
            '<span class="nut nut--chinh chi-tiet__trailer-chu">Xem trailer trên YouTube</span></a>';
    } else {
        khungTrailer.innerHTML = '<a class="chi-tiet__trailer-lien" href="' + escapeHtml(duongDanTim) + '" target="_blank" rel="noopener">' +
            '<span class="nut nut--chinh chi-tiet__trailer-chu">Tìm trailer trên YouTube</span></a>';
    }

    const nutMuaVe = document.getElementById("nutMuaVe");
    const dsNgay = document.getElementById("dsNgay");
    const dsSuat = document.getElementById("dsSuat");

    // Phim sap chieu: khong co nut "Mua ve" va hang chon ngay, chi bao ngay khoi chieu
    if (phim.trangThai == "sap") {
        nutMuaVe.hidden = true;
        dsNgay.hidden = true;
        const thongBao = document.createElement("p");
        thongBao.className = "lich-chieu__thong-bao";
        thongBao.textContent = phim.khoiChieu
            ? "Phim sẽ khởi chiếu từ " + phim.khoiChieu + ". Lịch chiếu và đặt vé sẽ được mở khi có suất chiếu."
            : "Phim sắp chiếu. Lịch chiếu và đặt vé sẽ được mở khi có suất chiếu.";
        dsSuat.replaceChildren(thongBao);
        return;
    }

    nutMuaVe.addEventListener("click", function () {
        document.getElementById("lichChieu").scrollIntoView({behavior: "smooth"});
    });

    let htmlNgay = "";
    for (let i = 0; i < dsNgayHienTai.length; i++) {
        const phan = dsNgayHienTai[i].nhan.split(" ");
        htmlNgay += '<button class="lich-chieu__ngay-nut" data-ngay="' + escapeHtml(dsNgayHienTai[i].so) + '">' +
            '<span class="lich-chieu__thu">' + escapeHtml(phan[0]) + '</span>' +
            '<span class="lich-chieu__so">' + escapeHtml(phan[1]) + '</span></button>';
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
        // Du lieu API: so = "YYYY-MM-DD" (co nam that). Du lieu mau: chi co "dd/mm" cua nam 2026.
        const ngayDayDu = /^\d{4}-\d{2}-\d{2}$/.test(String(ngayDuocChon.so))
            ? String(ngayDuocChon.so).split("-").reverse().join("/")
            : ngayDuocChon.nhan.split(" ")[1] + "/2026";

        const dsSuatTrongNgay = laySuatTheoNgay(phim, ngay);
        let html = "";
        for (let i = 0; i < dsSuatTrongNgay.length; i++) {
            const rap = timRap(dsSuatTrongNgay[i].rap);
            const suatCuaRap = dsSuatTrongNgay[i];
            const tenRapHienThi = tenRapDayDu(rap);
            html += '<div class="lich-chieu__rap"><b class="lich-chieu__tieu-de">' + escapeHtml(tenRapHienThi) + '</b>';
            for (let j = 0; j < suatCuaRap.suat.length; j++) {
                html += '<div class="lich-chieu__suat"><span class="lich-chieu__dinh-dang">' + escapeHtml(suatCuaRap.suat[j].dinhDang) + '</span>';
                for (let k = 0; k < suatCuaRap.suat[j].gio.length; k++) {
                    const gio = suatCuaRap.suat[j].gio[k];
                    const duongDanDatVe = "booking.html?movie=" + encodeURIComponent(phim.ten) +
                        "&cinema=" + encodeURIComponent(tenRapHienThi) +
                        "&date=" + encodeURIComponent(ngayDayDu) +
                        "&time=" + encodeURIComponent(gio);
                    html += '<a class="lich-chieu__gio" href="' + escapeHtml(duongDanDatVe) + '">' + escapeHtml(gio) + '</a>';
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
        // Mo san ngay dau tien con suat cua phim (vd: suat hom nay da chieu het)
        const ngayCoSuat = dsNgayHienTai.find(function (n) {
            return coNgayChieu(phim, n.so);
        });
        veSuatChieu((ngayCoSuat || dsNgayHienTai[0]).so);
    }
}

// Bao ro khi chay qua web server nhung API/CSDL loi (thay vi am tham dung du lieu mau)
function hienCanhBaoMayChu() {
    if (document.getElementById("canhBaoMayChu")) return;
    const thanh = document.createElement("div");
    thanh.id = "canhBaoMayChu";
    thanh.setAttribute("role", "alert");
    thanh.style.cssText = "background:#FEF2F2;color:#991B1B;border-bottom:1px solid #FECACA;" +
        "padding:10px 16px;text-align:center;font-size:14px;";
    thanh.textContent = "Không kết nối được cơ sở dữ liệu — đang hiển thị dữ liệu mẫu, " +
        "chưa đăng nhập/đặt vé được. Kiểm tra MySQL và file .env (xem README).";
    document.body.prepend(thanh);
}

async function khoiTao() {
    if (location.protocol !== "file:" && typeof khoiTaoDuLieu === "function") {
        try {
            await khoiTaoDuLieu();
        } catch (err) {
            console.warn("Khong ket noi duoc API, su dung du lieu mac dinh:", err);
            hienCanhBaoMayChu();
        }
    }

    if (dungDuLieuApi) {
        await dongBoTaiKhoanServer();
    }

    khoiTaoTaiKhoan();

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

// Promise dung chung: cac module khac (seats.js) cho du lieu API tai xong
let hoanTatKhoiTao = null;

function batDauKhoiTao() {
    if (!hoanTatKhoiTao) {
        hoanTatKhoiTao = khoiTao();
    }
    return hoanTatKhoiTao;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", batDauKhoiTao);
} else {
    batDauKhoiTao();
}