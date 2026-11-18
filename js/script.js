const soPhimMotTrang = 8;

function chuoiThoiLuong(p) {
    return p.thoiLuong ? p.thoiLuong + " phút" : "Đang cập nhật";
}

function boDau(chuoi) {
    return chuoi.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

function layThamSo(ten) {
    return new URLSearchParams(location.search).get(ten);
}

function timRap(idRap) {
    return dsRap.find(function (r) {
        return r.id == idRap;
    });
}

function layDanhSachCum() {
    let dsCum = [];
    for (let i = 0; i < dsRap.length; i++) {
        if (dsCum.indexOf(dsRap[i].cum) == -1) {
            dsCum.push(dsRap[i].cum);
        }
    }
    return dsCum;
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
        '<a href="' + lienKet + '"><img src="' + p.anh + '" alt="' + p.ten + '"></a>' +
        '<span class="the-phim__nhan">' + p.doTuoi + '</span>' + diem +
        '<div class="the-phim__hanh-dong">' +
        '<a class="nut nut--chinh" href="' + lienKet + '#lichChieu">' + chuNutDau + '</a>' +
        '<a class="nut nut--trang" href="' + lienKet + '#khungTrailer">Xem trailer</a>' +
        '</div></div>' +
        '<a class="the-phim__ten" href="' + lienKet + '">' + p.ten + '</a>' +
        '<span class="the-phim__thong-tin">' + p.theLoai + ' - ' + chuoiThoiLuong(p) + '</span></div>';
}

function veLuoiPhim(ds, luoi) {
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

function khoiTaoTimKiem() {
    const oTim = document.getElementById("oTim");
    const goiY = document.getElementById("goiY");

    oTim.addEventListener("input", function () {
        const tuKhoa = boDau(oTim.value.trim());
        if (tuKhoa == "") {
            goiY.classList.remove("o-tim__goi-y--hien");
            return;
        }
        const ketQua = dsPhim.filter(function (p) {
            return boDau(p.ten).indexOf(tuKhoa) != -1;
        }).slice(0, 5);

        if (ketQua.length == 0) {
            goiY.innerHTML = '<p class="o-tim__trong">Không tìm thấy phim</p>';
        } else {
            let html = "";
            for (let i = 0; i < ketQua.length; i++) {
                html += '<a class="o-tim__muc" href="chitiet.html?id=' + ketQua[i].id + '">' +
                    '<img class="o-tim__anh" src="' + ketQua[i].anh + '" alt="' + ketQua[i].ten + '">' +
                    '<span><span class="o-tim__ten">' + ketQua[i].ten + '</span>' +
                    '<span class="o-tim__loai">' + ketQua[i].theLoai + '</span></span></a>';
            }
            goiY.innerHTML = html;
        }
        goiY.classList.add("o-tim__goi-y--hien");
    });

    oTim.addEventListener("keydown", function (e) {
        if (e.key == "Enter" && oTim.value.trim() != "") {
            location.href = "danhsach.html?tukhoa=" + encodeURIComponent(oTim.value.trim());
        }
    });

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".o-tim")) {
            goiY.classList.remove("o-tim__goi-y--hien");
        }
    });
}

function layDanhSachNguoiDung() {
    return JSON.parse(localStorage.getItem("dsNguoiDung") || "[]");
}

function layNguoiDangNhap() {
    return JSON.parse(localStorage.getItem("nguoiDangNhap") || "null");
}

function veTaiKhoan() {
    const khung = document.getElementById("taiKhoan");
    const nguoi = layNguoiDangNhap();
    khung.innerHTML = "";

    if (nguoi) {
        const chao = document.createElement("span");
        chao.className = "dau-trang__chao";
        chao.textContent = "Xin chào, " + nguoi.hoTen;
        const nutThoat = document.createElement("button");
        nutThoat.className = "nut";
        nutThoat.textContent = "Đăng xuất";
        nutThoat.addEventListener("click", function () {
            localStorage.removeItem("nguoiDangNhap");
            veTaiKhoan();
        });
        khung.appendChild(chao);
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
    document.getElementById("hopThoai").classList.remove("hop-thoai--hien");
}

function dangNhapThanhCong(nguoi) {
    localStorage.setItem("nguoiDangNhap", JSON.stringify({hoTen: nguoi.hoTen, email: nguoi.email}));
    dongHopThoai();
    veTaiKhoan();
}

function khoiTaoTaiKhoan() {
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
        const dsNguoiDung = layDanhSachNguoiDung();

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
            const daCo = dsNguoiDung.some(function (n) {
                return n.email == email;
            });
            if (daCo) {
                thongBao.textContent = "Email này đã được đăng ký.";
                return;
            }
            dsNguoiDung.push({hoTen: hoTen, email: email, matKhau: matKhau});
            localStorage.setItem("dsNguoiDung", JSON.stringify(dsNguoiDung));
            dangNhapThanhCong({hoTen: hoTen, email: email});
            return;
        }

        const nguoi = dsNguoiDung.find(function (n) {
            return n.email == email && n.matKhau == matKhau;
        });
        if (!nguoi) {
            thongBao.textContent = "Email hoặc mật khẩu không đúng.";
            return;
        }
        dangNhapThanhCong(nguoi);
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
        htmlAnh += '<a class="banner__anh" href="chitiet.html?id=' + phimNoiBat[i].id + '">' +
            '<img class="banner__poster" src="' + phimNoiBat[i].anh + '" alt="' + phimNoiBat[i].ten + '">' +
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

    hienAnh(0);
    batDauTuDong();

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

    let trangThai = "dang";
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

    const dsNgay = [...new Set(
        dsSuatChieu
            .filter(s => s.trangThai === "scheduled")
            .map(s => s.ngayId)
    )].sort();

    for (const ngayId of dsNgay) {
        const [nam, thang, ngay] = ngayId.split("-");

        htmlNgay += '<option value="' + ngayId + '">' +
            ngay + "/" + thang + "/" + nam +
            '</option>';
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

            if (p.trangThai !== trangThai) return false;

            if (tuKhoa !== "" &&
                boDau(p.ten).indexOf(tuKhoa) === -1)
                return false;

            if (boLoc.loai !== "" &&
                p.theLoai !== boLoc.loai)
                return false;

            const coLocLichChieu =
                boLoc.cum !== "" ||
                boLoc.rap !== "" ||
                boLoc.ngay !== "";

            if (coLocLichChieu) {
                const coSuatPhuHop = p.suatChieu.some(s => {

                    return (
                        (boLoc.cum === "" ||
                            s.cum === boLoc.cum) &&

                        (boLoc.rap === "" ||
                            s.rapId === Number(boLoc.rap)) &&

                        (boLoc.ngay === "" ||
                            s.ngayId === boLoc.ngay)
                    );
                });

                if (!coSuatPhuHop) return false;
            }

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
        let html = '<button class="phan-trang__nut" data-trang="' + (trangHienTai - 1) + '">&lt;</button>';
        for (let i = 1; i <= tongTrang; i++) {
            html += '<button class="phan-trang__nut' + (i == trangHienTai ? ' phan-trang__nut--hien' : '') + '" data-trang="' + i + '">' + i + '</button>';
        }
        html += '<button class="phan-trang__nut" data-trang="' + (trangHienTai + 1) + '">&gt;</button>';
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
    document.getElementById("posterPhim").innerHTML = '<img src="' + phim.anh + '" alt="' + phim.ten + '">';
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
    if (phim.trailer != "" && location.protocol != "file:") {
        khungTrailer.innerHTML = '<iframe class="chi-tiet__video" src="https://www.youtube.com/embed/' + phim.trailer + '" allowfullscreen></iframe>';
    } else if (phim.trailer != "") {
        khungTrailer.innerHTML = '<a class="chi-tiet__trailer-lien" href="https://www.youtube.com/watch?v=' + phim.trailer + '" target="_blank" rel="noopener">' +
            '<img class="chi-tiet__trailer-anh" src="https://img.youtube.com/vi/' + phim.trailer + '/hqdefault.jpg" alt="Trailer ' + phim.ten + '">' +
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

    const cacSuat = (phim.suatChieu || []).filter(s =>
        s.trangThai === "scheduled"
    );

    // Tao danh sach ngay chieu
    const cacNgay = [...new Set(
        cacSuat.map(s => s.ngayId)
    )].sort();

    // Xu ly phim chua co lich chieu
    if (phim.trangThai === "sap" || cacNgay.length === 0) {
        dsNgay.innerHTML = "";

        dsSuat.innerHTML =
            '<p class="lich-chieu__thong-bao">' +
            'Phim chưa có lịch chiếu.</p>';

        return;
    }

    // Hien thi cac nut ngay chieu
    dsNgay.innerHTML = cacNgay.map(ngayId => {
        const date = new Date(ngayId + "T12:00:00+07:00");

        const thu = date.toLocaleDateString("vi-VN", {
            weekday: "short",
            timeZone: "Asia/Ho_Chi_Minh"
        });

        const [nam, thang, ngay] = ngayId.split("-");

        return `
            <button class="lich-chieu__ngay-nut"
                    data-ngay="${ngayId}">
                <span class="lich-chieu__thu">${thu}</span>
                <span class="lich-chieu__so">
                    ${ngay}/${thang}
                </span>
            </button>
        `;
    }).join("");

    const dsNut = dsNgay.querySelectorAll("button");

    // Hien thi suat chieu theo ngay
    function veSuatChieu(ngayId) {

        dsNut.forEach(nut => {
            nut.classList.toggle(
                "lich-chieu__ngay-nut--chon",
                nut.dataset.ngay === ngayId
            );
        });

        const suatTrongNgay = cacSuat.filter(s =>
            s.ngayId === ngayId
        );

        const rapIds = [...new Set(
            suatTrongNgay.map(s => s.rapId)
        )];

        let html = "";

        for (const rapId of rapIds) {
            const rap = dsRap.find(r => r.id === rapId);

            if (!rap) continue;

            const suatCuaRap = suatTrongNgay.filter(s =>
                s.rapId === rapId
            );

            const cacDinhDang = [...new Set(
                suatCuaRap.map(s => s.dinhDang)
            )];

            html += `
                <div class="lich-chieu__rap">
                    <b class="lich-chieu__tieu-de">
                        ${rap.cum} - ${rap.ten}
                    </b>
            `;

            for (const dinhDang of cacDinhDang) {
                html += `
                    <div class="lich-chieu__suat">
                        <span class="lich-chieu__dinh-dang">
                            ${dinhDang}
                        </span>
                `;

                const cacGio = suatCuaRap.filter(s =>
                    s.dinhDang === dinhDang
                );

                for (const s of cacGio) {
                    const duongDan =
                        "booking.html?show_id=" + s.id;

                    html += `
                        <a class="lich-chieu__gio"
                           href="${duongDan}"
                           title="${s.tenPhong}">
                            ${s.gio}
                        </a>
                    `;
                }

                html += "</div>";
            }

            html += "</div>";
        }

        dsSuat.innerHTML = html ||
            '<p class="lich-chieu__thong-bao">' +
            'Không có suất chiếu trong ngày này.</p>';
    }

    // Khi nguoi dung chon ngay
    dsNut.forEach(nut => {
        nut.addEventListener("click", function () {
            veSuatChieu(nut.dataset.ngay);
        });
    });

    // Mac dinh hien thi ngay dau tien
    veSuatChieu(cacNgay[0]);

}

function khoiTao() {
    khoiTaoTaiKhoan();
    khoiTaoTimKiem();

    if (document.getElementById("banner")) {
        khoiTaoTrangChu();
    }
    if (document.getElementById("boLoc")) {
        khoiTaoDanhSach();
    }
    if (document.getElementById("lichChieu")) {
        khoiTaoChiTiet();
    }
}


async function batDauUngDung() {
    try {
        await khoiTaoDuLieu();

        khoiTao();

    } catch (error) {
        console.error("Loi khoi tao ung dung:", error);
        alert("Không thể tải dữ liệu. Vui lòng thử lại!");
    }
}


batDauUngDung();
