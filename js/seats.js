(function () {
    const KEY_SUAT_CHIEU = "cinema_suat_chieu_dang_chon";
    const KEY_DON_DAT_VE = "cinema_don_dat_ve_tam";
    const KEY_VE_HOAN_TAT = "cinema_ve_dien_tu_cuoi";
    const KEY_GHE_DA_DAT = "cinema_danh_sach_ghe_da_dat";

    const GIA_VE = {
        thuong: 75000,
        vip: 95000,
        doi: 190000
    };

    const VOUCHER_HOP_LE = {
        CINEMA20: { loai: "co_dinh", giaTri: 20000, moTa: "Giảm trực tiếp 20.000đ" },
        UTH2026: { loai: "phan_tram", giaTri: 15, moTa: "Giảm 15% tổng đơn" }
    };

    const DU_LIEU_MAC_DINH = {
        phim: [
            "Spider-Man: Du Hành Vũ Trụ Nhện",
            "The Odyssey",
            "Doraemon: Nobita Và Bản Giao Hưởng Địa Cầu",
            "Ám Ảnh Kinh Hoàng",
            "Hồ Nuốt Người"
        ],
        rap: [
            "Cinema Thủ Đức",
            "Cinema Lê Văn Việt",
            "Cinema Linh Trung",
            "Cinema Sinh Viên"
        ],
        ngay: [
            "16/11/2026",
            "17/11/2026",
            "18/11/2026",
            "19/11/2026"
        ],
        suat: [
            { gio: "09:30", phong: "Phòng 01" },
            { gio: "13:15", phong: "Phòng 02" },
            { gio: "16:45", phong: "Phòng 04" },
            { gio: "19:30", phong: "Phòng 03" },
            { gio: "22:10", phong: "Phòng 01" }
        ]
    };

    function layDanhSachPhimTuHeThong() {
        const nguonDuLieu =
            (typeof dsPhim !== "undefined" && Array.isArray(dsPhim) && dsPhim) ||
            (typeof danhSachPhim !== "undefined" && Array.isArray(danhSachPhim) && danhSachPhim) ||
            (typeof movies !== "undefined" && Array.isArray(movies) && movies) ||
            (typeof PHIM !== "undefined" && Array.isArray(PHIM) && PHIM) ||
            null;

        if (nguonDuLieu && nguonDuLieu.length > 0) {
            const danhSachTen = nguonDuLieu
                .map((item) => (typeof item === "string" ? item : item.ten || item.tenPhim || item.title || item.name))
                .filter(Boolean);
            if (danhSachTen.length > 0) return danhSachTen;
        }
        return DU_LIEU_MAC_DINH.phim;
    }

    function dinhDangTien(soTien) {
        return Number(soTien || 0).toLocaleString("vi-VN") + "đ";
    }

    function laySuatChieuHienTai() {
        const dsPhimHienCo = layDanhSachPhimTuHeThong();
        const params = new URLSearchParams(window.location.search);

        if (params.get("movie") || params.get("tenPhim")) {
            const suatTuUrl = {
                tenPhim: params.get("movie") || params.get("tenPhim") || dsPhimHienCo[0],
                rap: params.get("cinema") || params.get("rap") || DU_LIEU_MAC_DINH.rap[0],
                phong: params.get("room") || params.get("phong") || "Phòng 03",
                ngay: params.get("date") || params.get("ngay") || DU_LIEU_MAC_DINH.ngay[0],
                gio: params.get("time") || params.get("gio") || "19:30"
            };
            localStorage.setItem(KEY_SUAT_CHIEU, JSON.stringify(suatTuUrl));
            return suatTuUrl;
        }

        const daLuu = localStorage.getItem(KEY_SUAT_CHIEU);
        if (daLuu) {
            return JSON.parse(daLuu);
        }

        const macDinh = {
            tenPhim: dsPhimHienCo[0],
            rap: DU_LIEU_MAC_DINH.rap[0],
            phong: "Phòng 03",
            ngay: DU_LIEU_MAC_DINH.ngay[0],
            gio: "19:30"
        };
        localStorage.setItem(KEY_SUAT_CHIEU, JSON.stringify(macDinh));
        return macDinh;
    }

    function layKeySuat(suat) {
        return `${suat.tenPhim}_${suat.rap}_${suat.ngay}_${suat.gio}`;
    }

    function layGheDaDatTheoSuat(suat) {
        const tatCa = JSON.parse(localStorage.getItem(KEY_GHE_DA_DAT) || "{}");
        const key = layKeySuat(suat);
        const gheMacDinh = ["C5", "C6", "D4", "D5", "E6", "E7", "F5"];
        const gheNguoiDungDat = tatCa[key] || [];
        return Array.from(new Set([...gheMacDinh, ...gheNguoiDungDat]));
    }

    function luuGheDaDat(suat, danhSachMaGhe) {
        const tatCa = JSON.parse(localStorage.getItem(KEY_GHE_DA_DAT) || "{}");
        const key = layKeySuat(suat);
        const hienCo = tatCa[key] || [];
        tatCa[key] = Array.from(new Set([...hienCo, ...danhSachMaGhe]));
        localStorage.setItem(KEY_GHE_DA_DAT, JSON.stringify(tatCa));
    }


    /* ================= TRANG 1: BOOKING.HTML ================= */
    function khoiTaoTrangChonGhe() {
        const khungSoDo = document.getElementById("soDoGhe");
        if (!khungSoDo) return;

        let suat = laySuatChieuHienTai();
        let gheDangChon = [];

        const selectPhim = document.getElementById("chonPhim");
        const selectRap = document.getElementById("chonRap");
        const selectNgay = document.getElementById("chonNgay");
        const selectGio = document.getElementById("chonGio");

        function napLuaChonBoLoc() {
            if (!selectPhim || !selectRap || !selectNgay || !selectGio) return;

            const dsPhim = layDanhSachPhimTuHeThong();
            if (!dsPhim.includes(suat.tenPhim)) dsPhim.unshift(suat.tenPhim);
            selectPhim.innerHTML = dsPhim.map((ten) => `<option value="${ten}">${ten}</option>`).join("");
            selectPhim.value = suat.tenPhim;

            const dsRap = [...DU_LIEU_MAC_DINH.rap];
            if (!dsRap.includes(suat.rap)) dsRap.unshift(suat.rap);
            selectRap.innerHTML = dsRap.map((rap) => `<option value="${rap}">${rap}</option>`).join("");
            selectRap.value = suat.rap;

            const dsNgay = [...DU_LIEU_MAC_DINH.ngay];
            if (!dsNgay.includes(suat.ngay)) dsNgay.unshift(suat.ngay);
            selectNgay.innerHTML = dsNgay.map((ngay) => `<option value="${ngay}">${ngay}</option>`).join("");
            selectNgay.value = suat.ngay;

            const dsSuat = [...DU_LIEU_MAC_DINH.suat];
            if (!dsSuat.some((s) => s.gio === suat.gio)) {
                dsSuat.unshift({ gio: suat.gio, phong: suat.phong });
            }
            selectGio.innerHTML = dsSuat
                .map((s) => `<option value="${s.gio}|${s.phong}">${s.gio} (${s.phong})</option>`)
                .join("");
            selectGio.value = `${suat.gio}|${suat.phong}`;

            const xuLyDoiSuat = () => {
                const [gioMoi, phongMoi] = selectGio.value.split("|");
                suat = {
                    tenPhim: selectPhim.value,
                    rap: selectRap.value,
                    ngay: selectNgay.value,
                    gio: gioMoi,
                    phong: phongMoi
                };
                localStorage.setItem(KEY_SUAT_CHIEU, JSON.stringify(suat));
                gheDangChon = [];
                document.getElementById("thongBaoGhe").textContent = "";
                capNhatThongTinSuatTrenThe();
                capNhatTomTat();
                veSoDoGhe();
            };

            selectPhim.addEventListener("change", xuLyDoiSuat);
            selectRap.addEventListener("change", xuLyDoiSuat);
            selectNgay.addEventListener("change", xuLyDoiSuat);
            selectGio.addEventListener("change", xuLyDoiSuat);
        }

        function capNhatThongTinSuatTrenThe() {
            document.getElementById("ttTenPhim").textContent = suat.tenPhim;
            document.getElementById("ttRap").textContent = suat.rap;
            document.getElementById("ttPhong").textContent = suat.phong;
            document.getElementById("ttSuat").textContent = `${suat.gio} - ${suat.ngay}`;
        }

        function veSoDoGhe() {
            khungSoDo.innerHTML = "";
            const gheDaDat = layGheDaDatTheoSuat(suat);
            const cacHang = ["A", "B", "C", "D", "E", "F", "G", "H"];

            cacHang.forEach((hang) => {
                const dong = document.createElement("div");
                dong.className = "hang-ghe";

                const nhan = document.createElement("span");
                nhan.className = "hang-ghe__nhan";
                nhan.textContent = hang;
                dong.appendChild(nhan);

                if (hang === "H") {
                    for (let i = 1; i <= 10; i += 2) {
                        const maGhe = `H${i}-H${i + 1}`;
                        dong.appendChild(taoNutGhe(maGhe, "doi", GIA_VE.doi, gheDaDat.includes(maGhe)));
                    }
                } else {
                    const loai = ["A", "B", "C"].includes(hang) ? "thuong" : "vip";
                    for (let cot = 1; cot <= 10; cot++) {
                        const maGhe = `${hang}${cot}`;
                        dong.appendChild(taoNutGhe(maGhe, loai, GIA_VE[loai], gheDaDat.includes(maGhe)));
                    }
                }

                khungSoDo.appendChild(dong);
            });
        }

        function taoNutGhe(ma, loai, gia, daDat) {
            const nut = document.createElement("button");
            nut.type = "button";
            nut.textContent = ma;
            nut.className = `ghe ghe--${loai}` + (daDat ? " ghe--da-dat" : "");
            nut.disabled = daDat;

            nut.addEventListener("click", () => {
                const viTri = gheDangChon.findIndex((g) => g.ma === ma);
                if (viTri > -1) {
                    gheDangChon.splice(viTri, 1);
                    nut.classList.remove("ghe--dang-chon");
                } else {
                    if (gheDangChon.length >= 8) {
                        document.getElementById("thongBaoGhe").textContent = "Bạn chỉ được chọn tối đa 8 ghế mỗi lần đặt.";
                        return;
                    }
                    gheDangChon.push({ ma, loai, gia });
                    nut.classList.add("ghe--dang-chon");
                }
                document.getElementById("thongBaoGhe").textContent = "";
                capNhatTomTat();
            });

            return nut;
        }

        function capNhatTomTat() {
            const dsMa = gheDangChon.map((g) => g.ma);
            const tongTien = gheDangChon.reduce((tong, g) => tong + g.gia, 0);

            document.getElementById("ttDanhSachGhe").textContent = dsMa.length ? dsMa.join(", ") : "Chưa chọn";
            document.getElementById("ttSoLuong").textContent = gheDangChon.length;
            document.getElementById("ttTongTien").textContent = dinhDangTien(tongTien);
        }

        napLuaChonBoLoc();
        capNhatThongTinSuatTrenThe();
        veSoDoGhe();

        document.getElementById("nutTiepTucThanhToan").addEventListener("click", () => {
            if (gheDangChon.length === 0) {
                document.getElementById("thongBaoGhe").textContent = "Vui lòng chọn ít nhất 1 ghế trước khi tiếp tục.";
                return;
            }
            const donTam = {
                suat,
                ghe: gheDangChon,
                tienVe: gheDangChon.reduce((tong, g) => tong + g.gia, 0)
            };
            localStorage.setItem(KEY_DON_DAT_VE, JSON.stringify(donTam));
            window.location.href = "checkout.html";
        });
    }

    /* ================= TRANG 2: CHECKOUT.HTML ================= */
    function khoiTaoTrangThanhToan() {
        const nutThanhToan = document.getElementById("nutXacNhanThanhToan");
        if (!nutThanhToan) return;

        const donTam = JSON.parse(localStorage.getItem(KEY_DON_DAT_VE) || "null");
        if (!donTam || !donTam.ghe || donTam.ghe.length === 0) {
            window.location.href = "booking.html";
            return;
        }

        let soLuongCombo = { solo: 0, couple: 0 };
        let voucherDangAp = null;

        document.getElementById("ttTenPhim").textContent = donTam.suat.tenPhim;
        document.getElementById("ttRap").textContent = donTam.suat.rap;
        document.getElementById("ttSuat").textContent = `${donTam.suat.phong} | ${donTam.suat.gio} (${donTam.suat.ngay})`;
        document.getElementById("ttDanhSachGhe").textContent = donTam.ghe.map((g) => g.ma).join(", ");

        let giayConLai = 600;
        const dongHoEl = document.getElementById("dongHoGiuGhe");
        const boDem = setInterval(() => {
            giayConLai--;
            if (giayConLai <= 0) {
                clearInterval(boDem);
                alert("Hết thời gian giữ ghế, vui lòng chọn lại ghế!");
                window.location.href = "booking.html";
                return;
            }
            const phut = String(Math.floor(giayConLai / 60)).padStart(2, "0");
            const giay = String(giayConLai % 60).padStart(2, "0");
            dongHoEl.textContent = `${phut}:${giay}`;
        }, 1000);

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
            const tienVe = donTam.tienVe;
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

        nutThanhToan.addEventListener("click", () => {
            const hoTen = document.getElementById("khachHoTen").value.trim();
            const email = document.getElementById("khachEmail").value.trim();
            const sdt = document.getElementById("khachSdt").value.trim();
            const loiEl = document.getElementById("thongBaoThanhToan");

            if (!hoTen || !email || !sdt) {
                loiEl.textContent = "Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại.";
                return;
            }

            const phuongThuc = document.querySelector('input[name="phuongThuc"]:checked').value;
            const chiTietTien = tinhTongTien();
            const maVe = "CNM-" + Math.floor(100000 + Math.random() * 900000);

            const dsComboText = [];
            if (soLuongCombo.solo > 0) dsComboText.push(`${soLuongCombo.solo}x Combo Solo`);
            if (soLuongCombo.couple > 0) dsComboText.push(`${soLuongCombo.couple}x Combo Couple`);

            const veHoanTat = {
                maVe,
                suat: donTam.suat,
                ghe: donTam.ghe.map((g) => g.ma),
                combo: dsComboText.length ? dsComboText.join(", ") : "Không có",
                tongTien: chiTietTien.tongCuoi,
                khachHang: { hoTen, email, sdt },
                phuongThuc,
                thoiGianDat: new Date().toLocaleString("vi-VN")
            };

            luuGheDaDat(donTam.suat, veHoanTat.ghe);
            localStorage.setItem(KEY_VE_HOAN_TAT, JSON.stringify(veHoanTat));
            localStorage.removeItem(KEY_DON_DAT_VE);
            clearInterval(boDem);
            window.location.href = "e_ticket.html";
        });
    }

    /* ================= TRANG 3: E_TICKET.HTML ================= */
    function khoiTaoTrangVeDienTu() {
        const canvas = document.getElementById("canvasQrVe");
        if (!canvas) return;

        const ve = JSON.parse(localStorage.getItem(KEY_VE_HOAN_TAT) || "null");
        if (!ve) {
            window.location.href = "index.html";
            return;
        }

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

        veMaQrGiaLap(canvas, ve.maVe + "|" + ve.ghe.join(","));

        document.getElementById("nutInVe").addEventListener("click", () => {
            window.print();
        });
    }

    function veMaQrGiaLap(canvas, duLieu) {
        const ctx = canvas.getContext("2d");
        const kichThuoc = 21;
        const o = Math.floor(canvas.width / kichThuoc);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let hash = 0;
        for (let i = 0; i < duLieu.length; i++) {
            hash = (hash * 31 + duLieu.charCodeAt(i)) >>> 0;
        }

        ctx.fillStyle = "#111827";
        function veGoc(x, y) {
            ctx.fillRect(x * o, y * o, 7 * o, 7 * o);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect((x + 1) * o, (y + 1) * o, 5 * o, 5 * o);
            ctx.fillStyle = "#111827";
            ctx.fillRect((x + 2) * o, (y + 2) * o, 3 * o, 3 * o);
        }

        veGoc(0, 0);
        veGoc(kichThuoc - 7, 0);
        veGoc(0, kichThuoc - 7);

        for (let r = 0; r < kichThuoc; r++) {
            for (let c = 0; c < kichThuoc; c++) {
                const trongGoc =
                    (r < 8 && c < 8) ||
                    (r < 8 && c >= kichThuoc - 8) ||
                    (r >= kichThuoc - 8 && c < 8);
                if (trongGoc) continue;

                hash = (hash * 1664525 + 1013904223) >>> 0;
                if ((hash & 1) === 1) {
                    ctx.fillRect(c * o, r * o, o, o);
                }
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        khoiTaoTrangChonGhe();
        khoiTaoTrangThanhToan();
        khoiTaoTrangVeDienTu();
    });
})();