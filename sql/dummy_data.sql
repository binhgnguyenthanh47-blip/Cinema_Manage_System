-- ==========================================
-- DU LIEU MAU (chay sau schema.sql, procedures.sql, triggers.sql)
-- 12 phim co san poster trong assets/images, 4 rap, 8 phong,
-- lich chieu 7 ngay TINH TU NGAY CHAY FILE (luon co suat de dat ve).
-- Sau file nay chay seed_seats.sql va seed_extra_seats.sql de tao ghe.
--
-- CANH BAO: file XOA TOAN BO du lieu cu (phim, rap, suat, don ve, user)
-- truoc khi nap lai. Chi dung khi cai dat / lam moi du lieu demo.
-- ==========================================

USE cinema_management_dev;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE tickets;
TRUNCATE TABLE bookings;
TRUNCATE TABLE shows;
TRUNCATE TABLE seats;
TRUNCATE TABLE cinemahalls;
TRUNCATE TABLE cinemas;
TRUNCATE TABLE movie_images;
TRUNCATE TABLE movies;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;


-- ==========================================
-- TAI KHOAN MAU (mat khau bcrypt, PHP password_verify doc duoc)
--   Admin:      admin@cinema.local    / admin123
--   Khach hang: customer@cinema.local / 123456
-- DOI MAT KHAU ADMIN sau khi cai dat (Admin > Nguoi dung).
-- ==========================================

INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES
    (1, 'Quản trị viên', 'admin@cinema.local',
     '$2y$10$1Y9BIvMjCIOTAg4G.GAgVOyZPMnQRp2fsEc9s8SC5K9jqrcJyNe.m', 'admin'),
    (2, 'Khách hàng demo', 'customer@cinema.local',
     '$2y$10$HS4WwXkHUiLs.oNBwdn2O.blWtfR/y18GE3ExmNqBw5LAzuIEgXMW', 'customer');


-- ==========================================
-- RAP CHIEU & PHONG CHIEU (moi rap 2 phong)
-- ==========================================

INSERT INTO cinemas (cinema_id, name, address, cluster_name) VALUES
    (1, 'Rạp 1', '72 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh', 'Cụm rạp A'),
    (2, 'Rạp 2', '469 Nguyễn Hữu Thọ, Quận 7, TP. Hồ Chí Minh', 'Cụm rạp B'),
    (3, 'Rạp 3', '190 Quang Trung, Quận Gò Vấp, TP. Hồ Chí Minh', 'Cụm rạp A'),
    (4, 'Rạp 4', '216 Võ Văn Ngân, TP. Thủ Đức, TP. Hồ Chí Minh', 'Cụm rạp B');

INSERT INTO cinemahalls (hall_id, cinema_id, hall_name) VALUES
    (1, 1, 'Phòng 01'), (2, 1, 'Phòng 02'),
    (3, 2, 'Phòng 01'), (4, 2, 'Phòng 02'),
    (5, 3, 'Phòng 01'), (6, 3, 'Phòng 02'),
    (7, 4, 'Phòng 01'), (8, 4, 'Phòng 02');


-- ==========================================
-- PHIM (poster co san trong assets/images)
-- ==========================================

INSERT INTO movies (movie_id, title, genre, duration_minutes, age_rating, release_date, release_date_text,
                    poster_url, trailer_url, description,
                    status, director, actors, country, language, rating) VALUES
    (1, 'Spider-Man: Brand New Day', 'Hành động', 135, 'T13', '2026-07-31', '31/07/2026',
     'assets/images/spiderman-brand-new-day.jpeg', 'https://www.youtube.com/watch?v=62bIsvRcPv0',
     '<p>Phần phim mới về Người Nhện, tiếp nối cuộc sống của Peter Parker sau các sự kiện trước đó.</p>',
     'now_showing', 'Destin Daniel Cretton', 'Tom Holland, Zendaya', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 7.8),
    (2, 'Avengers: Doomsday', 'Hành động', 150, 'T13', '2026-12-18', '18/12/2026',
     'assets/images/avengers-doomsday.jpeg', 'https://www.youtube.com/watch?v=irVNGjRFZGk',
     '<p>Biệt đội Avengers phải đối đầu với mối đe dọa mới mang tên Doom.</p>',
     'coming_soon', 'Anthony Russo, Joe Russo', 'Đang cập nhật', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', NULL),
    (3, 'Dune: Part Three', 'Khoa học viễn tưởng', 165, 'T13', '2026-12-18', '18/12/2026',
     'assets/images/dune-part-three.jpeg', 'https://www.youtube.com/watch?v=uJqaGLmZpGo',
     '<p>Phần kết của loạt phim Dune, tiếp nối hành trình của Paul Atreides trên hành tinh Arrakis.</p>',
     'coming_soon', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya, Jason Momoa, Florence Pugh, Rebecca Ferguson', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', NULL),
    (4, 'The Odyssey', 'Phiêu lưu', 170, 'T16', '2026-07-17', '17/07/2026',
     'assets/images/the-odyssey.jpeg', 'https://www.youtube.com/watch?v=Mzw2ttJD2qQ',
     '<p>Chuyển thể từ sử thi của Homer, kể về hành trình trở về quê nhà của Odysseus sau cuộc chiến thành Troy.</p>',
     'now_showing', 'Christopher Nolan', 'Matt Damon, Tom Holland, Anne Hathaway, Zendaya, Lupita Nyong''o, Robert Pattinson, Charlize Theron', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 8.2),
    (5, 'Toy Story 5', 'Hoạt hình', 100, 'P', '2026-06-17', '17/06/2026',
     'assets/images/toy-story-5.jpeg', 'https://www.youtube.com/watch?v=c51ND9Hdbw0',
     '<p>Nhóm đồ chơi quen thuộc phải đối mặt với sự xuất hiện của một thiết bị công nghệ mới trong nhà.</p>',
     'now_showing', 'Andrew Stanton', 'Tom Hanks, Tim Allen', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 7.6),
    (6, 'The Super Mario Galaxy Movie', 'Hoạt hình', 98, 'P', NULL, '04/2026',
     'assets/images/super-mario-galaxy.jpeg', 'https://www.youtube.com/watch?v=GuCejewteF8',
     '<p>Mario, Công chúa Peach và những người bạn bước vào cuộc phiêu lưu mới giữa vũ trụ.</p>',
     'now_showing', 'Aaron Horvath, Michael Jelenic', 'Chris Pratt, Anya Taylor-Joy, Charlie Day, Jack Black', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 6.9),
    (7, 'The Hunger Games: Sunrise on the Reaping', 'Khoa học viễn tưởng', 140, 'T16', '2026-11-20', '20/11/2026',
     'assets/images/hunger-games-sunrise.jpeg', 'https://www.youtube.com/watch?v=lYXtL5TreOE',
     '<p>Phần tiền truyện của loạt phim Hunger Games, lấy bối cảnh trước các phần đã ra mắt.</p>',
     'coming_soon', 'Francis Lawrence', 'Đang cập nhật', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', NULL),
    (8, 'Resident Evil', 'Kinh dị', 105, 'T18', '2026-09-18', '18/09/2026',
     'assets/images/resident-evil.jpeg', 'https://www.youtube.com/watch?v=mNd1gb19A-c',
     '<p>Phiên bản điện ảnh mới của loạt trò chơi kinh dị sinh tồn Resident Evil.</p>',
     'now_showing', 'Zach Cregger', 'Đang cập nhật', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 6.5),
    (9, 'Moana', 'Gia đình', 105, 'P', NULL, '07/2026',
     'assets/images/moana.jpeg', 'https://www.youtube.com/watch?v=n7f6hlKsxxo',
     '<p>Phiên bản người đóng của Moana, kể về cô gái trẻ và hành trình vượt đại dương cùng sức mạnh của biển cả.</p>',
     'now_showing', 'Thomas Kail', 'Catherine Laga''aia, Dwayne Johnson', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 6.8),
    (10, 'Minions & Monsters', 'Hoạt hình', 95, 'P', '2026-07-01', '01/07/2026',
     'assets/images/minions-monsters.jpeg', 'https://www.youtube.com/watch?v=V-O-uBaHk3c',
     '<p>Những chú Minion bước vào cuộc phiêu lưu mới cùng các sinh vật kỳ lạ.</p>',
     'now_showing', 'Pierre Coffin', 'Đang cập nhật', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 6.7),
    (11, 'The Dog Stars', 'Phiêu lưu', 120, 'T18', '2026-08-28', '28/08/2026',
     'assets/images/the-dog-stars.jpeg', 'https://www.youtube.com/watch?v=cmzVY1goqwQ',
     '<p>Chuyển thể từ tiểu thuyết của Peter Heller, kể về những người sống sót tìm cách tồn tại trong thế giới hậu tận thế.</p>',
     'now_showing', 'Ridley Scott', 'Jacob Elordi, Josh Brolin, Margaret Qualley', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 7.4),
    (12, 'Mortal Kombat II', 'Hành động', 115, 'T18', '2026-05-08', '08/05/2026',
     'assets/images/mortal-kombat-2.jpeg', 'https://www.youtube.com/watch?v=mITiMK1g338',
     '<p>Các chiến binh của Trái Đất tiếp tục tham gia giải đấu Mortal Kombat để bảo vệ thế giới.</p>',
     'now_showing', 'Simon McQuoid', 'Karl Urban, Jessica McNamee, Lewis Tan', 'Mỹ', 'Tiếng Anh, phụ đề tiếng Việt', 6.6);


-- ==========================================
-- LICH CHIEU: 7 ngay tu hom nay, moi phong 4 suat/ngay
-- (09:00, 12:30, 16:00, 19:30 - cach nhau 3h30, du cho phim dai nhat
--  170 phut + 15 phut don phong, khong vi pham trigger chong trung gio).
-- Phim duoc xoay vong trong so cac phim chieu tai rap do.
-- ==========================================

-- Phim nao chieu o rap nao
CREATE TEMPORARY TABLE tmp_movie_cinema (
    movie_id BIGINT NOT NULL,
    cinema_id BIGINT NOT NULL
);

INSERT INTO tmp_movie_cinema (movie_id, cinema_id) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (4, 1), (4, 2), (4, 4), (5, 1), (5, 3), (6, 2), (6, 3), (8, 2), (8, 4), (9, 1), (9, 3), (10, 3), (10, 4), (11, 1), (11, 4), (12, 2), (12, 3), (12, 4);

INSERT INTO shows (movie_id, hall_id, start_time, end_time, base_price, show_format, status)
SELECT
    mc.movie_id,
    g.hall_id,
    g.start_time,
    g.start_time + INTERVAL (m.duration_minutes + 15) MINUTE,
    g.price,
    IF(m.genre IN ('Hoạt hình', 'Gia đình'), '2d_dubbed', '2d_sub'),
    'scheduled'
FROM (
    SELECT h.hall_id, h.cinema_id, h.hall_idx, d.n AS day_no, s.n AS slot_no,
           TIMESTAMP(CURDATE() + INTERVAL d.n DAY, s.t) AS start_time,
           s.price
    FROM (SELECT hall_id, cinema_id, ROW_NUMBER() OVER (ORDER BY hall_id) AS hall_idx
          FROM cinemahalls) h
    CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
                UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) d
    CROSS JOIN (SELECT 0 AS n, '09:00:00' AS t, 65000 AS price
                UNION ALL SELECT 1, '12:30:00', 75000
                UNION ALL SELECT 2, '16:00:00', 75000
                UNION ALL SELECT 3, '19:30:00', 90000) s
) g
JOIN (
    SELECT movie_id, cinema_id,
           ROW_NUMBER() OVER (PARTITION BY cinema_id ORDER BY movie_id) - 1 AS rn,
           COUNT(*) OVER (PARTITION BY cinema_id) AS cnt
    FROM tmp_movie_cinema
) mc
    ON mc.cinema_id = g.cinema_id
   AND mc.rn = (g.day_no * 4 + g.slot_no + g.hall_idx) % mc.cnt
JOIN movies m ON m.movie_id = mc.movie_id
ORDER BY g.start_time, g.hall_id;

DROP TEMPORARY TABLE tmp_movie_cinema;
