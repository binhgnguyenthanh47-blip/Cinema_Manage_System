const dsPhim = [
    {"id": 1, "ten": "Spider-Man: Brand New Day", "anh": "assets/images/spiderman-brand-new-day.jpeg", "theLoai": "Hành động", "thoiLuong": "", "doTuoi": "T13", "diem": "Chưa có", "trangThai": "dang", "rap": [1, 2, 3, 4], "ngayChieu": [2, 3, 4, 5, 6, 7, 8], "daoDien": "Destin Daniel Cretton", "dienVien": "Tom Holland, Zendaya", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "31/07/2026", "noiDung": "Phần phim mới về Người Nhện, tiếp nối cuộc sống của Peter Parker sau các sự kiện trước đó.", "trailer": "62bIsvRcPv0"},
    {"id": 2, "ten": "Avengers: Doomsday", "anh": "assets/images/avengers-doomsday.jpeg", "theLoai": "Hành động", "thoiLuong": "", "doTuoi": "T13", "diem": "Chưa có", "trangThai": "sap", "rap": [], "ngayChieu": [], "daoDien": "Anthony Russo, Joe Russo", "dienVien": "Đang cập nhật", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "18/12/2026", "noiDung": "Biệt đội Avengers phải đối đầu với mối đe dọa mới mang tên Doom.", "trailer": "irVNGjRFZGk"},
    {"id": 3, "ten": "Dune: Part Three", "anh": "assets/images/dune-part-three.jpeg", "theLoai": "Khoa học viễn tưởng", "thoiLuong": "", "doTuoi": "T13", "diem": "Chưa có", "trangThai": "sap", "rap": [], "ngayChieu": [], "daoDien": "Denis Villeneuve", "dienVien": "Timothée Chalamet, Zendaya, Jason Momoa, Florence Pugh, Rebecca Ferguson", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "18/12/2026", "noiDung": "Phần kết của loạt phim Dune, tiếp nối hành trình của Paul Atreides trên hành tinh Arrakis.", "trailer": "uJqaGLmZpGo"},
    {"id": 4, "ten": "The Odyssey", "anh": "assets/images/the-odyssey.jpeg", "theLoai": "Phiêu lưu", "thoiLuong": "", "doTuoi": "T16", "diem": "Chưa có", "trangThai": "dang", "rap": [1, 2, 4], "ngayChieu": [2, 3, 4, 5, 6, 7, 8], "daoDien": "Christopher Nolan", "dienVien": "Matt Damon, Tom Holland, Anne Hathaway, Zendaya, Lupita Nyong'o, Robert Pattinson, Charlize Theron", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "17/07/2026", "noiDung": "Chuyển thể từ sử thi của Homer, kể về hành trình trở về quê nhà của Odysseus sau cuộc chiến thành Troy.", "trailer": "Mzw2ttJD2qQ"},
    {"id": 5, "ten": "Toy Story 5", "anh": "assets/images/toy-story-5.jpeg", "theLoai": "Hoạt hình", "thoiLuong": "", "doTuoi": "P", "diem": "Chưa có", "trangThai": "dang", "rap": [1, 3], "ngayChieu": [2, 4, 6, 8], "daoDien": "Andrew Stanton", "dienVien": "Tom Hanks, Tim Allen", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "17/06/2026", "noiDung": "Nhóm đồ chơi quen thuộc phải đối mặt với sự xuất hiện của một thiết bị công nghệ mới trong nhà.", "trailer": "c51ND9Hdbw0"},
    {"id": 6, "ten": "The Super Mario Galaxy Movie", "anh": "assets/images/super-mario-galaxy.jpeg", "theLoai": "Hoạt hình", "thoiLuong": "", "doTuoi": "P", "diem": "Chưa có", "trangThai": "dang", "rap": [2, 3], "ngayChieu": [3, 5, 7], "daoDien": "Aaron Horvath, Michael Jelenic", "dienVien": "Chris Pratt, Anya Taylor-Joy, Charlie Day, Jack Black", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "04/2026", "noiDung": "Mario, Công chúa Peach và những người bạn bước vào cuộc phiêu lưu mới giữa vũ trụ.", "trailer": "GuCejewteF8"},
    {"id": 7, "ten": "The Hunger Games: Sunrise on the Reaping", "anh": "assets/images/hunger-games-sunrise.jpeg", "theLoai": "Khoa học viễn tưởng", "thoiLuong": "", "doTuoi": "T16", "diem": "Chưa có", "trangThai": "sap", "rap": [], "ngayChieu": [], "daoDien": "Francis Lawrence", "dienVien": "Đang cập nhật", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "20/11/2026", "noiDung": "Phần tiền truyện của loạt phim Hunger Games, lấy bối cảnh trước các phần đã ra mắt.", "trailer": "lYXtL5TreOE"},
    {"id": 8, "ten": "Resident Evil", "anh": "assets/images/resident-evil.jpeg", "theLoai": "Kinh dị", "thoiLuong": "", "doTuoi": "T18", "diem": "Chưa có", "trangThai": "dang", "rap": [2, 4], "ngayChieu": [4, 5, 6, 7], "daoDien": "Zach Cregger", "dienVien": "Đang cập nhật", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "18/09/2026", "noiDung": "Phiên bản điện ảnh mới của loạt trò chơi kinh dị sinh tồn Resident Evil.", "trailer": "mNd1gb19A-c"},
    {"id": 9, "ten": "Moana", "anh": "assets/images/moana.jpeg", "theLoai": "Gia đình", "thoiLuong": "", "doTuoi": "P", "diem": "Chưa có", "trangThai": "dang", "rap": [1, 3], "ngayChieu": [2, 3, 4, 5, 6], "daoDien": "Thomas Kail", "dienVien": "Catherine Laga'aia, Dwayne Johnson", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "07/2026", "noiDung": "Phiên bản người đóng của Moana, kể về cô gái trẻ và hành trình vượt đại dương cùng sức mạnh của biển cả.", "trailer": "n7f6hlKsxxo"},
    {"id": 10, "ten": "Minions & Monsters", "anh": "assets/images/minions-monsters.jpeg", "theLoai": "Hoạt hình", "thoiLuong": "", "doTuoi": "P", "diem": "Chưa có", "trangThai": "dang", "rap": [3, 4], "ngayChieu": [5, 6, 7, 8], "daoDien": "Pierre Coffin", "dienVien": "Đang cập nhật", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "01/07/2026", "noiDung": "Những chú Minion bước vào cuộc phiêu lưu mới cùng các sinh vật kỳ lạ.", "trailer": "V-O-uBaHk3c"},
    {"id": 11, "ten": "The Dog Stars", "anh": "assets/images/the-dog-stars.jpeg", "theLoai": "Phiêu lưu", "thoiLuong": "", "doTuoi": "T18", "diem": "Chưa có", "trangThai": "dang", "rap": [1, 4], "ngayChieu": [2, 3, 7, 8], "daoDien": "Ridley Scott", "dienVien": "Jacob Elordi, Josh Brolin, Margaret Qualley", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "28/08/2026", "noiDung": "Chuyển thể từ tiểu thuyết của Peter Heller, kể về những người sống sót tìm cách tồn tại trong thế giới hậu tận thế.", "trailer": "cmzVY1goqwQ"},
    {"id": 12, "ten": "Mortal Kombat II", "anh": "assets/images/mortal-kombat-2.jpeg", "theLoai": "Hành động", "thoiLuong": "", "doTuoi": "T18", "diem": "Chưa có", "trangThai": "dang", "rap": [2, 3, 4], "ngayChieu": [2, 3, 5, 6, 8], "daoDien": "Simon McQuoid", "dienVien": "Karl Urban, Jessica McNamee, Lewis Tan", "quocGia": "Mỹ", "ngonNgu": "Tiếng Anh, phụ đề tiếng Việt", "khoiChieu": "08/05/2026", "noiDung": "Các chiến binh của Trái Đất tiếp tục tham gia giải đấu Mortal Kombat để bảo vệ thế giới.", "trailer": "mITiMK1g338"}
];

const dsRap = [
    {"id": 1, "ten": "Rạp 1", "cum": "Cụm rạp A"},
    {"id": 2, "ten": "Rạp 2", "cum": "Cụm rạp B"},
    {"id": 3, "ten": "Rạp 3", "cum": "Cụm rạp A"},
    {"id": 4, "ten": "Rạp 4", "cum": "Cụm rạp B"}
];

const lichChieu = {
    "cacNgay": [
        {
            "so": 2,
            "nhan": "T2 02/11"
        },
        {
            "so": 3,
            "nhan": "T3 03/11"
        },
        {
            "so": 4,
            "nhan": "T4 04/11"
        },
        {
            "so": 5,
            "nhan": "T5 05/11"
        },
        {
            "so": 6,
            "nhan": "T6 06/11"
        },
        {
            "so": 7,
            "nhan": "T7 07/11"
        },
        {
            "so": 8,
            "nhan": "CN 08/11"
        }
    ],
    "suatTheoRap": [
        {
            "rap": 1,
            "suat": [
                {
                    "dinhDang": "2D phụ đề",
                    "gio": [
                        "09:30",
                        "13:00",
                        "19:45"
                    ]
                },
                {
                    "dinhDang": "2D lồng tiếng",
                    "gio": [
                        "11:15",
                        "21:00"
                    ]
                }
            ]
        },
        {
            "rap": 2,
            "suat": [
                {
                    "dinhDang": "2D phụ đề",
                    "gio": [
                        "10:00",
                        "14:30",
                        "20:15"
                    ]
                },
                {
                    "dinhDang": "2D lồng tiếng",
                    "gio": [
                        "12:00",
                        "22:00"
                    ]
                }
            ]
        },
        {
            "rap": 3,
            "suat": [
                {
                    "dinhDang": "2D phụ đề",
                    "gio": [
                        "09:00",
                        "15:00",
                        "18:30"
                    ]
                },
                {
                    "dinhDang": "2D lồng tiếng",
                    "gio": [
                        "11:30",
                        "21:15"
                    ]
                }
            ]
        },
        {
            "rap": 4,
            "suat": [
                {
                    "dinhDang": "2D phụ đề",
                    "gio": [
                        "10:30",
                        "13:45",
                        "19:00"
                    ]
                },
                {
                    "dinhDang": "2D lồng tiếng",
                    "gio": [
                        "12:15",
                        "21:30"
                    ]
                }
            ]
        }
    ]
};
