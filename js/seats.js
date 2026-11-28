(function () {
    const KEY_SUAT_CHIEU = "cinema_suat_chieu_dang_chon";
    const KEY_DON_DAT_VE = "cinema_don_dat_ve_tam";
    const KEY_LICH_SU_VE = "cinema_lich_su_ve";
    const KEY_GHE_DA_DAT = "cinema_danh_sach_ghe_da_dat";
    const THOI_GIAN_GIU_GHE_MS = 15 * 60 * 1000;

    const VOUCHER_HOP_LE = {
        CINEMA20: { loai: "co_dinh", giaTri: 20000, moTa: "Giảm trực tiếp 20.000đ" },
        UTH2026: { loai: "phan_tram", giaTri: 15, moTa: "Giảm 15% tổng đơn" }
    };

    const DU_LIEU_HE_THONG_MAC_DINH = {
        phim: [
            "Spider-Man: Brand New Day",
            "The Odyssey",
            "Toy Story 5",
            "The Super Mario Galaxy Movie",
            "Resident Evil",
            "Moana",
            "Minions & Monsters",
            "The Dog Stars",
            "Mortal Kombat II"
        ],
        rap: [
            "Cụm rạp A - Rạp 1",
            "Cụm rạp B - Rạp 2",
            "Cụm rạp A - Rạp 3",
            "Cụm rạp B - Rạp 4"
        ],
        ngay: [
            "02/11/2026",
            "03/11/2026",
            "04/11/2026",
            "05/11/2026",
            "06/11/2026",
            "07/11/2026",
            "08/11/2026"
        ],
        suatTheoRap: {
            "Cụm rạp A - Rạp 1": [
                { gio: "09:30", phong: "Phòng 01" },
                { gio: "13:00", phong: "Phòng 02" },
                { gio: "19:45", phong: "Phòng 03" }
            ],
            "Cụm rạp B - Rạp 2": [
                { gio: "10:00", phong: "Phòng 02" },
                { gio: "14:30", phong: "Phòng 04" },
                { gio: "20:15", phong: "Phòng 01" }
            ],
            "Cụm rạp A - Rạp 3": [
                { gio: "09:00", phong: "Phòng 03" },
                { gio: "15:00", phong: "Phòng 01" },
                { gio: "18:30", phong: "Phòng 02" }
            ],
            "Cụm rạp B - Rạp 4": [
                { gio: "10:30", phong: "Phòng 04" },
                { gio: "13:45", phong: "Phòng 02" },
                { gio: "19:00", phong: "Phòng 03" }
            ]
        }
    };

    function dinhDangTien(soTien) {
        return Number(soTien || 0).toLocaleString("vi-VN") + "đ";
    }

    function boDauTiengViet(str) {
        return String(str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
    }

    function chuanHoaNgay(ngayStr) {
        const s = String(ngayStr || "").trim();
        const matchIso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (matchIso) {
            const dd = matchIso[3].padStart(2, "0");
            const mm = matchIso[2].padStart(2, "0");
            return `${dd}/${mm}/${matchIso[1]}`;
        }
        return s;
    }

    function chuanHoaText(str) {
        return String(str || "").trim().replace(/\s+/g, " ").toLowerCase();
    }

    function layKeySuat(suat) {
        const phim = chuanHoaText(suat.tenPhim);
        const rap = chuanHoaText(suat.rap);
        const ngay = chuanHoaText(chuanHoaNgay(suat.ngay));
        const gio = chuanHoaText(suat.gio);
        return `${phim}__${rap}__${ngay}__${gio}`;
    }

    function layBangGiaTheoGio(gioStr) {
        const gio = parseInt(String(gioStr || "14:30").split(":")[0], 10);
        if (!isNaN(gio) && gio < 12) {
            return { thuong: 65000, vip: 85000, doi: 170000, nhanKhungGio: "Suất sáng" };
        }
        if (!isNaN(gio) && gio >= 17) {
            return { thuong: 90000, vip: 110000, doi: 220000, nhanKhungGio: "Giờ vàng" };
        }
        return { thuong: 75000, vip: 95000, doi: 190000, nhanKhungGio: "Tiêu chuẩn" };
    }

    function tinhGiaMotGhe(maGhe, gioStr) {
        const bangGia = layBangGiaTheoGio(gioStr);
        const ma = String(maGhe || "").trim().toUpperCase();
        if (ma.includes("-") || ma.startsWith("H")) {
            return bangGia.doi;
        }
        const hang = ma.charAt(0);
        if (["A", "B", "C"].includes(hang)) {
            return bangGia.thuong;
        }
        return bangGia.vip;
    }

    function layTaiKhoanDangNhap() {
        const cacKeyUuTien = [
            "nguoiDangNhap", "taiKhoan", "nguoiDung", "nguoiDungHienTai", "taiKhoanHienTai",
            "userHienTai", "dangNhap", "khachHang", "currentUser",
            "user", "taiKhoanDangNhap", "loggedInUser", "loginUser", "auth"
        ];
        const keyBoQua = new Set([
            "dsNguoiDung", "dsPhim", "dsLichChieu", "dsRap",
            KEY_SUAT_CHIEU, KEY_DON_DAT_VE, KEY_LICH_SU_VE, KEY_GHE_DA_DAT
        ]);

        const tatCaKey = Array.from(new Set([
            ...cacKeyUuTien,
            ...Object.keys(localStorage),
            ...Object.keys(sessionStorage)
        ]));

        for (const key of tatCaKey) {
            if (keyBoQua.has(key) || key.startsWith("cinema_")) continue;
            const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (!raw) continue;

            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    if (
                        parsed.email || parsed.tenDangNhap || parsed.username ||
                        parsed.hoTen || parsed.ten || parsed.name ||
                        parsed.taiKhoan || parsed.sdt
                    ) {
                        return parsed;
                    }
                }
            } catch (_) {
                if (cacKeyUuTien.includes(key) && raw.trim() && raw !== "null" && raw !== "undefined") {
                    return { email: raw.trim(), hoTen: raw.trim() };
                }
            }
        }

        const khungTaiKhoan = document.getElementById("taiKhoan");
        if (khungTaiKhoan) {
            const text = khungTaiKhoan.textContent.trim();
            if (text && !text.toLowerCase().includes("đăng nhập")) {
                const tenHienThi = text.replace(/đăng xuất/gi, "").trim() || "Khách hàng";
                return { hoTen: tenHienThi, email: tenHienThi };
            }
        }

        return null;
    }

    function layDinhDanhTaiKhoan(user) {
        if (!user) return "";
        return (user.email || user.tenDangNhap || user.username || user.taiKhoan || user.id || user.hoTen || user.ten || "")
            .toString()
            .trim()
            .toLowerCase();
    }

    function layDuLieuHeThong() {
        const nguonPhim =
            (typeof dsPhim !== "undefined" && Array.isArray(dsPhim) && dsPhim) ||
            (typeof danhSachPhim !== "undefined" && Array.isArray(danhSachPhim) && danhSachPhim) ||
            (typeof movies !== "undefined" && Array.isArray(movies) && movies) ||
            (typeof PHIM !== "undefined" && Array.isArray(PHIM) && PHIM) ||
            [];

        const nguonLich =
            (typeof dsSuatChieu !== "undefined" && Array.isArray(dsSuatChieu) && dsSuatChieu) ||
            (typeof dsLichChieu !== "undefined" && Array.isArray(dsLichChieu) && dsLichChieu) ||
            (typeof lichChieu !== "undefined" && Array.isArray(lichChieu) && lichChieu) ||
            (typeof showtimes !== "undefined" && Array.isArray(showtimes) && showtimes) ||
            [];

        const nguonRap =
            (typeof dsRap !== "undefined" && Array.isArray(dsRap) && dsRap) ||
            (typeof cumRap !== "undefined" && Array.isArray(cumRap) && cumRap) ||
            (typeof cinemas !== "undefined" && Array.isArray(cinemas) && cinemas) ||
            [];

        const tenPhimList = nguonPhim
            .filter((p) => !p.trangThai || p.trangThai === "dang")
            .map((p) => (typeof p === "string" ? p : p.ten || p.tenPhim || p.title || p.name))
            .filter(Boolean);

        const tenRapTuLich = nguonLich
            .map((l) => (l.cum && l.tenRap ? `${l.cum} - ${l.tenRap}` : l.rap || l.tenRap || l.cumRap))
            .filter(Boolean);

        const tenRapTuDs = nguonRap
            .map((r) => (typeof r === "string" ? r : r.cum && r.ten ? `${r.cum} - ${r.ten}` : r.ten || r.tenRap || r.name))
            .filter(Boolean);

        const dsRapChuan = Array.from(new Set([...tenRapTuDs, ...tenRapTuLich]));

        let dsNgayChuan = [...DU_LIEU_HE_THONG_MAC_DINH.ngay];
        if (typeof lichChieu !== "undefined" && lichChieu && Array.isArray(lichChieu.cacNgay)) {
            dsNgayChuan = lichChieu.cacNgay.map((n) => n.nhan.split(" ")[1] + "/2026");
        }

        return {
            nguonPhim,
            nguonLich,
            phim: tenPhimList.length ? tenPhimList : DU_LIEU_HE_THONG_MAC_DINH.phim,
            rap: dsRapChuan.length ? dsRapChuan : DU_LIEU_HE_THONG_MAC_DINH.rap,
            ngay: dsNgayChuan
        };
    }

    function layDanhSachSuatTheoRap(tenPhim, tenRap, ngayChieu) {
        const heThong = layDuLieuHeThong();
        const ngayChuan = chuanHoaNgay(ngayChieu);
        if (heThong.nguonLich.length > 0) {
            const phimObj = heThong.nguonPhim.find((p) => (p.ten || p.tenPhim || p.title) === tenPhim);
            const loc = heThong.nguonLich.filter((l) => {
                const lPhim = l.tenPhim || l.phim || "";
                const lRap = l.cum && l.tenRap ? `${l.cum} - ${l.tenRap}` : l.rap || l.tenRap || l.cumRap || "";
                const lNgay = chuanHoaNgay(l.ngayId || l.ngay || l.ngayChieu || "");
                const khopPhim = (!lPhim && !l.phimId) || lPhim === tenPhim || (phimObj && String(l.phimId) === String(phimObj.id));
                const khopRap = !lRap || lRap === tenRap;
                const khopNgay = !lNgay || lNgay === ngayChuan;
                return khopPhim && khopRap && khopNgay;
            });
            if (loc.length > 0) {
                return loc.map((l, idx) => ({
                    gio: l.gio || l.gioChieu || l.suat || "19:30",
                    phong: l.tenPhong || l.phong || `Phòng 0${(idx % 4) + 1}`
                }));
            }
        }
        return DU_LIEU_HE_THONG_MAC_DINH.suatTheoRap[tenRap] || [
            { gio: "09:30", phong: "Phòng 01" },
            { gio: "14:30", phong: "Phòng 02" },
            { gio: "19:30", phong: "Phòng 03" }
        ];
    }

    function laySuatChieuHienTai() {
        const heThong = layDuLieuHeThong();
        const params = new URLSearchParams(window.location.search);

        const idPhimParam = params.get("id") || params.get("movieId") || params.get("phimId");
        let tenPhimTuId = "";
        if (idPhimParam && heThong.nguonPhim.length > 0) {
            const timPhim = heThong.nguonPhim.find((p) => String(p.id) === String(idPhimParam));
            if (timPhim) {
                tenPhimTuId = timPhim.ten || timPhim.tenPhim || timPhim.title || "";
            }
        }

        const tenPhimUrl = params.get("movie") || params.get("tenPhim") || params.get("phim") || tenPhimTuId;
        const rapUrl = params.get("cinema") || params.get("rap") || params.get("cumRap");
        const ngayUrl = params.get("date") || params.get("ngay");
        const gioUrl = params.get("time") || params.get("gio") || params.get("suat");
        const phongUrl = params.get("room") || params.get("phong");

        if (tenPhimUrl || rapUrl || ngayUrl || gioUrl) {
            const tenPhim = (tenPhimUrl || heThong.phim[0]).trim();
            const rap = (rapUrl || heThong.rap[0]).trim();
            const ngay = chuanHoaNgay(ngayUrl || heThong.ngay[0]);
            const dsSuat = layDanhSachSuatTheoRap(tenPhim, rap, ngay);
            const suatKhop = dsSuat.find((s) => s.gio === gioUrl);

            const suatTuUrl = {
                tenPhim,
                rap,
                ngay,
                gio: (gioUrl || dsSuat[0].gio).trim(),
                phong: (phongUrl || (suatKhop ? suatKhop.phong : dsSuat[0].phong)).trim()
            };
            localStorage.setItem(KEY_SUAT_CHIEU, JSON.stringify(suatTuUrl));
            return suatTuUrl;
        }

        const daLuu = localStorage.getItem(KEY_SUAT_CHIEU);
        if (daLuu) {
            const parsed = JSON.parse(daLuu);
            parsed.ngay = chuanHoaNgay(parsed.ngay);
            return parsed;
        }

        const rapMacDinh = heThong.rap[0];
        const dsSuatMacDinh = layDanhSachSuatTheoRap(heThong.phim[0], rapMacDinh, heThong.ngay[0]);
        const macDinh = {
            tenPhim: heThong.phim[0],
            rap: rapMacDinh,
            ngay: heThong.ngay[0],
            gio: dsSuatMacDinh[0].gio,
            phong: dsSuatMacDinh[0].phong
        };
        localStorage.setItem(KEY_SUAT_CHIEU, JSON.stringify(macDinh));
        return macDinh;
    }

    function layGheDaDatTheoSuat(suat) {
        const keyChuan = layKeySuat(suat);
        const gheMacDinh = [];

        const tatCa = JSON.parse(localStorage.getItem(KEY_GHE_DA_DAT) || "{}");
        const gheTuKho = tatCa[keyChuan] || [];

        const lichSuVe = JSON.parse(localStorage.getItem(KEY_LICH_SU_VE) || "[]");
        const gheTuLichSu = [];
        lichSuVe.forEach((ve) => {
            if (ve && ve.suat && Array.isArray(ve.ghe) && layKeySuat(ve.suat) === keyChuan) {
                gheTuLichSu.push(...ve.ghe);
            }
        });

        return Array.from(new Set([...gheMacDinh, ...gheTuKho, ...gheTuLichSu]));
    }

    function luuGheDaDat(suat, danhSachMaGhe) {
        const tatCa = JSON.parse(localStorage.getItem(KEY_GHE_DA_DAT) || "{}");
        const keyChuan = layKeySuat(suat);
        const hienCo = tatCa[keyChuan] || [];
        tatCa[keyChuan] = Array.from(new Set([...hienCo, ...danhSachMaGhe]));
        localStorage.setItem(KEY_GHE_DA_DAT, JSON.stringify(tatCa));
    }

    
    function khoiTaoTrangChonGhe() {
        const khungSoDo = document.getElementById("soDoGhe");
        if (!khungSoDo) return;

        const params = new URLSearchParams(location.search);

        const shows = (
            typeof dsSuatChieu !== "undefined" ? dsSuatChieu : []
        ).filter(s => s.trangThai === "scheduled");

        const rap = s => s.cum ? `${s.cum} - ${s.tenRap}` : s.tenRap;
        const ngay = s => chuanHoaNgay(s.ngayId);

        const selectPhim = document.getElementById("chonPhim");
        const selectRap = document.getElementById("chonRap");
        const selectNgay = document.getElementById("chonNgay");
        const selectGio = document.getElementById("chonGio");

        const tiep = document.getElementById("nutTiepTucThanhToan");
        const loi = document.getElementById("thongBaoGhe");

        let suat = {};
        let gheDangChon = [];
        let phien = 0;

        function options(el, items, preferred) {
            el.replaceChildren(
                ...items.map(([v, t]) => new Option(t, v))
            );

            if (items.some(([v]) => String(v) === String(preferred))) {
                el.value = preferred;
            }
        }

        const unique = arr => [...new Set(arr)].map(v => [v, v]);

        function capNhatBoLoc(initial = false) {
            options(
                selectPhim,
                unique(shows.map(s => s.tenPhim)),
                initial ? params.get("movie") : selectPhim.value
            );

            const p = shows.filter(s => s.tenPhim === selectPhim.value);

            options(
                selectRap,
                unique(p.map(rap)),
                initial ? params.get("cinema") : selectRap.value
            );

            const r = p.filter(s => rap(s) === selectRap.value);

            options(
                selectNgay,
                unique(r.map(ngay)),
                initial
                    ? chuanHoaNgay(params.get("date"))
                    : selectNgay.value
            );

            const d = r.filter(s => ngay(s) === selectNgay.value);

            const preferred = initial
                ? d.find(s =>
                    s.gio === params.get("time") &&
                    (!params.get("room") ||
                        s.tenPhong === params.get("room"))
                )?.id
                : selectGio.value;

            options(
                selectGio,
                d.map(s => [
                    String(s.id),
                    `${s.gio} (${s.tenPhong})`
                ]),
                preferred
            );

            veSoDoGhe();
        }

        async function veSoDoGhe(giuLuaChon = false) {
            const token = ++phien;

            const gheCu = giuLuaChon === true
                ? [...gheDangChon]
                : [];

            gheDangChon = [];
            tiep.disabled = true;
            khungSoDo.replaceChildren();

            capNhatTomTat();

            const show = shows.find(
                s => String(s.id) === selectGio.value
            );

            if (!show) {
                loi.textContent = "Không có suất chiếu phù hợp.";
                return;
            }

            suat = {
                show_id: show.id,
                tenPhim: show.tenPhim,
                rap: rap(show),
                ngay: ngay(show),
                gio: show.gio,
                phong: show.tenPhong
            };

            const thongTin = {
                ttTenPhim: suat.tenPhim,
                ttRap: suat.rap,
                ttPhong: suat.phong,
                ttSuat: `${suat.gio} - ${suat.ngay}`
            };

            for (const [id, value] of Object.entries(thongTin)) {
                document.getElementById(id).textContent = value;
            }

            loi.textContent = "Đang tải ghế...";

            try {
                const response = await fetch(
                    `/api/shows/${show.id}/seats`,
                    { cache: "no-store" }
                );

                const result = await response.json();

                if (token !== phien) return;

                if (
                    !response.ok ||
                    !result.success ||
                    !Array.isArray(result.data)
                ) {
                    throw new Error("API lỗi");
                }

                const gheConTrong = new Set(
                    result.data
                        .filter(g => g.availability === "available")
                        .map(g => Number(g.seat_id))
                );

                gheDangChon = gheCu.filter(
                    g => gheConTrong.has(Number(g.seat_id))
                );

                const types = {
                    standard: "thuong",
                    vip: "vip",
                    couple: "doi"
                };

                const rows = new Map();

                for (const g of result.data) {
                    if (!rows.has(g.row_label)) {
                        const dong = document.createElement("div");
                        dong.className = "hang-ghe";

                        const nhan = document.createElement("span");
                        nhan.className = "hang-ghe__nhan";
                        nhan.textContent = g.row_label;

                        dong.appendChild(nhan);
                        rows.set(g.row_label, dong);
                        khungSoDo.appendChild(dong);
                    }

                    rows.get(g.row_label).appendChild(
                        taoNutGhe(
                            g.seat_label,
                            types[g.seat_type],
                            Number(g.price),
                            g.availability !== "available",
                            g.seat_id
                        )
                    );
                }

                const bangGia = [
                    ["standard", "nhanGiaThuong", "Ghế Thường"],
                    ["vip", "nhanGiaVip", "Ghế VIP"],
                    ["couple", "nhanGiaDoi", "Ghế Đôi"]
                ];

                for (const [type, id, label] of bangGia) {
                    const g = result.data.find(
                        g => g.seat_type === type
                    );

                    document.getElementById(id).textContent = g
                        ? `${label} (${dinhDangTien(g.price)}${type === "couple" ? "/cặp" : ""})`
                        : label;
                }

                capNhatTomTat();

                loi.textContent = gheCu.length > gheDangChon.length
                    ? "Một số ghế bạn chọn không còn trống."
                    : "";

            } catch (e) {
                if (token === phien) {
                    khungSoDo.replaceChildren();
                    loi.textContent = "Không tải được ghế. Vui lòng thử lại.";
                }
            }
        }

        function taoNutGhe(ma, loai, gia, daDat, seatId) {
            const nut = document.createElement("button");

            nut.type = "button";
            nut.textContent = ma;

            const giaChuan = Number(gia) > 0
                ? Number(gia)
                : tinhGiaMotGhe(ma, suat.gio);

            const dangChon = !daDat &&
                gheDangChon.some(g => g.ma === ma);

            nut.className = `ghe ghe--${loai}`
                + (daDat ? " ghe--da-dat" : "")
                + (dangChon ? " ghe--dang-chon" : "");

            nut.disabled = daDat;

            nut.addEventListener("click", () => {
                const viTri = gheDangChon.findIndex(
                    g => g.ma === ma
                );

                if (viTri > -1) {
                    gheDangChon.splice(viTri, 1);
                    nut.classList.remove("ghe--dang-chon");
                } else {
                    if (gheDangChon.length >= 8) {
                        loi.textContent =
                            "Bạn chỉ được chọn tối đa 8 ghế mỗi lần đặt.";
                        return;
                    }

                    gheDangChon.push({
                        ma,
                        loai,
                        gia: giaChuan,
                        seat_id: seatId
                    });

                    nut.classList.add("ghe--dang-chon");
                }

                loi.textContent = "";
                capNhatTomTat();
            });

            return nut;
        }

        function capNhatTomTat() {
        const dsMa = gheDangChon.map(g => g.ma);

        const tongTien = gheDangChon.reduce(
            (tong, g) => tong +
                (Number(g.gia) || tinhGiaMotGhe(g.ma, suat.gio)),
            0
        );

        document.getElementById("ttDanhSachGhe").textContent =
            dsMa.length ? dsMa.join(", ") : "Chưa chọn";

        document.getElementById("ttSoLuong").textContent =
            gheDangChon.length;

        document.getElementById("ttTongTien").textContent =
            dinhDangTien(tongTien);

        // Bat nut Tiep tuc khi da chon ghe
        tiep.disabled = gheDangChon.length === 0;
        }

        [selectPhim, selectRap, selectNgay].forEach(el =>
            el.addEventListener("change", () => capNhatBoLoc())
        );

        selectGio.addEventListener("change", veSoDoGhe);

        capNhatBoLoc(true);

        const eventSource = new EventSource("/api/shows/stream");

        eventSource.addEventListener("connected", () => {
            console.log("Đã kết nối realtime ghế");

            if (!khungSoDo.inert && selectGio.value) {
                veSoDoGhe(true);
            }
        });

        eventSource.addEventListener("seats_updated", (event) => {
            try {
                const data = JSON.parse(event.data);

                console.log("Realtime booking:", data);

                if (
                    Number(data.show_id) === Number(selectGio.value)
                    && !khungSoDo.inert
                ) {
                    veSoDoGhe(true);
                }
            } catch (error) {
                console.error("Lỗi realtime:", error);
            }
        });

        eventSource.onerror = () => {
            console.warn("Mất kết nối realtime, đang kết nối lại...");
        };

        window.addEventListener("pagehide", () => {
            eventSource.close();
        });

        tiep.addEventListener("click", async () => {
            if (tiep.disabled || gheDangChon.length === 0) {
                return;
            }

            const taiKhoan = window.AuthService.getCurrentUser();

            if (!taiKhoan) {
                loi.textContent = "Bạn cần đăng nhập để đặt vé.";
                return;
            }

            const userId = Number(taiKhoan.user_id);

            console.log("User ID đặt vé:", userId);

            if (!Number.isSafeInteger(userId) || userId <= 0) {
                loi.textContent = "Không tìm thấy ID tài khoản.";
                return;
            }

            const showId = Number(suat.show_id);

            const seatIds = gheDangChon.map(
                g => Number(g.seat_id)
            );

            tiep.disabled = true;
            tiep.textContent = "Đang giữ ghế...";
            loi.textContent = "";

            const cacBoLoc = [
                selectPhim,
                selectRap,
                selectNgay,
                selectGio
            ];

            cacBoLoc.forEach(el => el.disabled = true);
            khungSoDo.inert = true;

            try {
                const response = await fetch("/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        show_id: showId,
                        seat_ids: seatIds
                    })
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || "Không thể giữ ghế."
                    );
                }

                const donTam = {
                    booking_id: result.data.booking_id,
                    suat: { ...suat },
                    ghe: [...gheDangChon],
                    tienVe: Number(result.data.total_amount),
                    hetHanLuc: Date.now() + THOI_GIAN_GIU_GHE_MS
                };

                localStorage.setItem(
                    KEY_SUAT_CHIEU,
                    JSON.stringify(suat)
                );

                localStorage.setItem(
                    KEY_DON_DAT_VE,
                    JSON.stringify(donTam)
                );

                console.log("Đặt vé thành công:", result);

                window.location.href = "checkout.html";

            } catch (error) {
                console.error("Lỗi đặt vé:", error);

                loi.textContent = error.message;

                tiep.disabled = false;
                tiep.textContent = "Tiếp tục";

                cacBoLoc.forEach(el => el.disabled = false);
                khungSoDo.inert = false;
            }
        });
    }

    function khoiTaoTrangThanhToan() {
        const nutThanhToan = document.getElementById("nutXacNhanThanhToan");
        if (!nutThanhToan) return;

        const taiKhoan = layTaiKhoanDangNhap();
        if (!taiKhoan) {
            alert("Bạn cần đăng nhập để tiếp tục thanh toán vé.");
            window.location.href = "booking.html";
            return;
        }

        const donTam = JSON.parse(localStorage.getItem(KEY_DON_DAT_VE) || "null");
        if (!donTam || !donTam.ghe || donTam.ghe.length === 0) {
            window.location.href = "booking.html";
            return;
        }

        donTam.suat.ngay = chuanHoaNgay(donTam.suat.ngay);

        donTam.ghe = donTam.ghe.map((g) => {
            const ma = typeof g === "string" ? g : g.ma;
            const gia = (typeof g === "object" && Number(g.gia) > 0)
                ? Number(g.gia)
                : tinhGiaMotGhe(ma, donTam.suat.gio);
            return { ma, loai: (typeof g === "object" && g.loai) || "thuong", gia };
        });
        donTam.tienVe = donTam.ghe.reduce((tong, g) => tong + g.gia, 0);

        if (!donTam.hetHanLuc) {
            donTam.hetHanLuc = Date.now() + THOI_GIAN_GIU_GHE_MS;
        }
        localStorage.setItem(KEY_DON_DAT_VE, JSON.stringify(donTam));

        const inputHoTen = document.getElementById("khachHoTen");
        const inputEmail = document.getElementById("khachEmail");
        const inputSdt = document.getElementById("khachSdt");
        if (inputHoTen && !inputHoTen.value) inputHoTen.value = taiKhoan.hoTen || taiKhoan.ten || taiKhoan.name || "";
        if (inputEmail && !inputEmail.value && taiKhoan.email && taiKhoan.email.includes("@")) inputEmail.value = taiKhoan.email;
        if (inputSdt && !inputSdt.value) inputSdt.value = taiKhoan.sdt || taiKhoan.soDienThoai || taiKhoan.phone || "";

        let soLuongCombo = { solo: 0, couple: 0 };
        let voucherDangAp = null;

        document.getElementById("ttTenPhim").textContent = donTam.suat.tenPhim;
        document.getElementById("ttRap").textContent = donTam.suat.rap;
        document.getElementById("ttSuat").textContent = `${donTam.suat.phong} | ${donTam.suat.gio} (${donTam.suat.ngay})`;
        document.getElementById("ttDanhSachGhe").textContent = donTam.ghe.map((g) => g.ma).join(", ");

        window.addEventListener("storage", (e) => {
            if (e.key === KEY_GHE_DA_DAT || e.key === KEY_LICH_SU_VE) {
                const gheDaBanMoiNhat = layGheDaDatTheoSuat(donTam.suat);
                const gheBiTrung = donTam.ghe.map((g) => g.ma).filter((ma) => gheDaBanMoiNhat.includes(ma));
                const loiEl = document.getElementById("thongBaoThanhToan");
                if (gheBiTrung.length > 0 && loiEl) {
                    loiEl.textContent = `Cảnh báo: Ghế ${gheBiTrung.join(", ")} vừa được mua ở phiên khác. Vui lòng quay lại đổi ghế!`;
                }
            }
        });

        const dongHoEl = document.getElementById("dongHoGiuGhe");
        function capNhatDongHoGiuGhe() {
            const giayConLai = Math.floor((donTam.hetHanLuc - Date.now()) / 1000);
            if (giayConLai <= 0) {
                clearInterval(boDem);
                localStorage.removeItem(KEY_DON_DAT_VE);
                alert("Hết thời gian giữ ghế 15 phút, vui lòng chọn lại ghế!");
                window.location.href = "booking.html";
                return;
            }
            const phut = String(Math.floor(giayConLai / 60)).padStart(2, "0");
            const giay = String(giayConLai % 60).padStart(2, "0");
            if (dongHoEl) dongHoEl.textContent = `${phut}:${giay}`;
        }

        capNhatDongHoGiuGhe();
        const boDem = setInterval(capNhatDongHoGiuGhe, 1000);

        document.querySelectorAll(".combo-item").forEach((item) => {
            const loai = item.dataset.combo;
            item.querySelectorAll(".nut-dem").forEach((btn) => {
                btn.addEventListener("click", () => {
                    if (btn.dataset.action === "tang") {
                        soLuongCombo[loai]++;
                    } else if (soLuongCombo[loai] > 0) {
                        soLuongCombo[loai]--;
                    }
                    document.getElementById(loai === "solo" ? "slComboSolo" : "slComboCouple").textContent = soLuongCombo[loai];
                    tinhTongTien();
                });
            });
        });

        document.getElementById("nutApMa").addEventListener("click", () => {
            const ma = document.getElementById("oMaGiamGia").value.trim().toUpperCase();
            const thongBao = document.getElementById("trangThaiVoucher");
            if (!ma) {
                voucherDangAp = null;
                thongBao.textContent = "";
                tinhTongTien();
                return;
            }
            if (VOUCHER_HOP_LE[ma]) {
                voucherDangAp = { ma, ...VOUCHER_HOP_LE[ma] };
                thongBao.style.color = "#4ade80";
                thongBao.textContent = `Đã áp dụng mã ${ma}: ${voucherDangAp.moTa}`;
            } else {
                voucherDangAp = null;
                thongBao.style.color = "#f87171";
                thongBao.textContent = "Mã giảm giá không hợp lệ. Thử: CINEMA20 hoặc UTH2026";
            }
            tinhTongTien();
        });

        function tinhTongTien() {
            const tienVe = donTam.ghe.reduce((tong, g) => tong + (Number(g.gia) || tinhGiaMotGhe(g.ma, donTam.suat.gio)), 0);
            const tienCombo = soLuongCombo.solo * 79000 + soLuongCombo.couple * 139000;
            const tamTinh = tienVe + tienCombo;

            let tienGiam = 0;
            if (voucherDangAp) {
                tienGiam = voucherDangAp.loai === "co_dinh"
                    ? voucherDangAp.giaTri
                    : Math.round((tamTinh * voucherDangAp.giaTri) / 100);
            }
            const tongCuoi = Math.max(0, tamTinh - tienGiam);

            document.getElementById("ttTienVe").textContent = dinhDangTien(tienVe);
            document.getElementById("ttTienCombo").textContent = dinhDangTien(tienCombo);
            document.getElementById("ttTienGiam").textContent = "-" + dinhDangTien(tienGiam);
            document.getElementById("ttTongThanhToan").textContent = dinhDangTien(tongCuoi);

            return { tienVe, tienCombo, tienGiam, tongCuoi };
        }

        tinhTongTien();

        nutThanhToan.addEventListener("click", async () => {
            const hoTen = inputHoTen.value.trim();
            const email = inputEmail.value.trim();
            const sdt = inputSdt.value.trim();
            const loiEl = document.getElementById("thongBaoThanhToan");

            if (!hoTen) {
                loiEl.textContent = "Vui lòng nhập Họ và tên người nhận vé.";
                inputHoTen.focus();
                return;
            }

            const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!regexEmail.test(email)) {
                loiEl.textContent = "Email không đúng định dạng (VD: nguyenvana@gmail.com).";
                inputEmail.focus();
                return;
            }

            const regexSdt = /^0\d{9}$/;
            if (!regexSdt.test(sdt)) {
                loiEl.textContent = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0.";
                inputSdt.focus();
                return;
            }

            const gheDaBanMoiNhat = layGheDaDatTheoSuat(donTam.suat);
            const gheBiTrung = donTam.ghe
                .map((g) => g.ma)
                .filter((ma) => gheDaBanMoiNhat.includes(ma));

            if (gheBiTrung.length > 0) {
                const thongBaoLoi = `Giao dịch bị từ chối: Ghế ${gheBiTrung.join(", ")} đã được bán cho khách hàng khác! Vui lòng chọn lại ghế.`;
                loiEl.textContent = thongBaoLoi;
                alert(thongBaoLoi);
                localStorage.removeItem(KEY_DON_DAT_VE);
                clearInterval(boDem);
                window.location.href = "booking.html";
                return;
            }

            loiEl.textContent = "";
            const phuongThuc = document.querySelector('input[name="phuongThuc"]:checked').value;
            const chiTietTien = tinhTongTien();
            const maVe = "CNM-" + Math.floor(100000 + Math.random() * 900000);

            // --- ĐOẠN MỚI THÊM: Gửi bắp nước & giảm giá xuống MySQL ---
            if (donTam.booking_id) {
                nutThanhToan.disabled = true;
                nutThanhToan.textContent = "Đang xử lý...";
                try {
                    const res = await fetch(`/api/bookings/${donTam.booking_id}/checkout`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            combo_solo: soLuongCombo.solo,
                            combo_couple: soLuongCombo.couple,
                            discount_amount: chiTietTien.tienGiam
                        })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                        throw new Error(data.message || "Lỗi cập nhật đơn hàng");
                    }
                } catch (err) {
                    loiEl.textContent = err.message;
                    nutThanhToan.disabled = false;
                    nutThanhToan.textContent = "Thanh toán";
                    return;
                }
            }
            // ---------------------------------------------------------

            const dsComboText = [];
            if (soLuongCombo.solo > 0) dsComboText.push(`${soLuongCombo.solo}x Combo Solo`);
            if (soLuongCombo.couple > 0) dsComboText.push(`${soLuongCombo.couple}x Combo Couple`);

            const veMoi = {
                maVe,
                userId: layDinhDanhTaiKhoan(taiKhoan),
                suat: donTam.suat,
                ghe: donTam.ghe.map((g) => g.ma),
                combo: dsComboText.length ? dsComboText.join(", ") : "Không có",
                tongTien: chiTietTien.tongCuoi,
                khachHang: { hoTen, email, sdt },
                phuongThuc,
                thoiGianDat: new Date().toLocaleString("vi-VN")
            };

            const lichSuVe = JSON.parse(localStorage.getItem(KEY_LICH_SU_VE) || "[]");
            lichSuVe.unshift(veMoi);
            localStorage.setItem(KEY_LICH_SU_VE, JSON.stringify(lichSuVe));

            luuGheDaDat(donTam.suat, veMoi.ghe);
            localStorage.removeItem(KEY_DON_DAT_VE);
            clearInterval(boDem);
            window.location.href = `e_ticket.html?maVe=${encodeURIComponent(maVe)}`;
        });
    }

    function khoiTaoTrangVeDienTu() {
        const khungQr = document.getElementById("khungQrVe");
        if (!khungQr) return;

        const taiKhoan = layTaiKhoanDangNhap();
        const userId = layDinhDanhTaiKhoan(taiKhoan);
        const tatCaVe = JSON.parse(localStorage.getItem(KEY_LICH_SU_VE) || "[]");

        const veCuaTaiKhoan = userId
            ? tatCaVe.filter((v) => !v.userId || v.userId === userId)
            : tatCaVe;

        if (!veCuaTaiKhoan || veCuaTaiKhoan.length === 0) {
            alert("Tài khoản của bạn chưa có vé nào. Hãy chọn phim và đặt vé nhé!");
            window.location.href = "booking.html";
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const maVeCanXem = params.get("maVe");
        let veDangHien = veCuaTaiKhoan.find((v) => v.maVe === maVeCanXem) || veCuaTaiKhoan[0];

        function hienThiChiTietVe(ve) {
            veDangHien = ve;
            document.getElementById("veTenPhim").textContent = ve.suat.tenPhim;
            document.getElementById("veMaDatVe").textContent = "#" + ve.maVe;
            document.getElementById("veRap").textContent = ve.suat.rap;
            document.getElementById("vePhong").textContent = ve.suat.phong;
            document.getElementById("veSuat").textContent = `${ve.suat.gio} - ${ve.suat.ngay}`;
            document.getElementById("veGhe").textContent = ve.ghe.join(", ");
            document.getElementById("veCombo").textContent = ve.combo;
            document.getElementById("veTongTien").textContent = dinhDangTien(ve.tongTien);
            document.getElementById("veKhachHang").textContent = ve.khachHang.hoTen;
            document.getElementById("veEmail").textContent = ve.khachHang.email;
            document.getElementById("veSdt").textContent = ve.khachHang.sdt;
            document.getElementById("vePhuongThuc").textContent = ve.phuongThuc;
            document.getElementById("veChuoiQr").textContent = ve.maVe;

            const noiDungQr = boDauTiengViet(
                `VE:${ve.maVe}|PHIM:${ve.suat.tenPhim}|RAP:${ve.suat.rap}|SUAT:${ve.suat.gio} ${ve.suat.ngay}|GHE:${ve.ghe.join(",")}`
            );

            khungQr.innerHTML = "";
            let daTaoQr = false;

            if (typeof QRCode !== "undefined") {
                try {
                    new QRCode(khungQr, {
                        text: noiDungQr,
                        width: 140,
                        height: 140,
                        colorDark: "#111827",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.L
                    });
                    daTaoQr = true;
                } catch (err) {
                    khungQr.innerHTML = "";
                }
            }

            if (!daTaoQr) {
                const img = document.createElement("img");
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(noiDungQr)}`;
                img.alt = ve.maVe;
                img.width = 140;
                img.height = 140;
                khungQr.appendChild(img);
            }

            renderDanhSachLichSu();
        }

        function renderDanhSachLichSu() {
            const dsEl = document.getElementById("dsLichSuVe");
            if (!dsEl) return;

            dsEl.innerHTML = veCuaTaiKhoan
                .map((v) => {
                    const dangXem = v.maVe === veDangHien.maVe ? " lich-su-ve__item--dang-xem" : "";
                    return `
                        <div class="lich-su-ve__item${dangXem}" data-mave="${v.maVe}">
                            <div>
                                <div class="lich-su-ve__phim">${v.suat.tenPhim} (#${v.maVe})</div>
                                <div class="lich-su-ve__phu">${v.suat.rap} • ${v.suat.phong} • ${v.suat.gio} (${v.suat.ngay}) • Ghế: ${v.ghe.join(", ")}</div>
                            </div>
                            <strong>${dinhDangTien(v.tongTien)}</strong>
                        </div>
                    `;
                })
                .join("");

            dsEl.querySelectorAll(".lich-su-ve__item").forEach((item) => {
                item.addEventListener("click", () => {
                    const timVe = veCuaTaiKhoan.find((v) => v.maVe === item.dataset.mave);
                    if (timVe) hienThiChiTietVe(timVe);
                });
            });
        }

        hienThiChiTietVe(veDangHien);

        document.getElementById("nutInVe").addEventListener("click", () => {
            window.print();
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
    if (window.duLieuDaTai) {
        khoiTaoTrangChonGhe();
    } else {
        document.addEventListener(
            "duLieuSanSang",
            khoiTaoTrangChonGhe,
            { once: true }
        );
    }

    khoiTaoTrangThanhToan();
    khoiTaoTrangVeDienTu();
    });
})();
