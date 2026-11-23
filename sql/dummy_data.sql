
USE cinema_management_dev;



INSERT INTO Cinemas (cinema_id, name, address)
VALUES (1, 'Cinema Demo Quan 1', 'Quan 1, TP. Ho Chi Minh');

INSERT INTO Cinemas (cinema_id, name, address)
VALUES (2, 'Cinema Demo Thu Duc', 'TP. Thu Duc, TP. Ho Chi Minh');

INSERT INTO CinemaHalls (hall_id, cinema_id, hall_name)
VALUES (1, 1, 'Phong 01');

INSERT INTO CinemaHalls (hall_id, cinema_id, hall_name)
VALUES (2, 1, 'Phong 02');

INSERT INTO CinemaHalls (hall_id, cinema_id, hall_name)
VALUES (3, 2, 'Phong 01');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (4, 'Tee Yod – Quỷ Ăn Tạng', 'Kinh di', 121, 'T18', '2023-10-26', 'assets/posters/tee-yod-1.jpg', NULL, 'Gia dinh Yak doi mat voi the luc ta ac.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (5, 'Tee Yod 2 – Quỷ Ăn Tạng 2', 'Kinh di', 112, 'T18', '2024-10-10', 'assets/posters/tee-yod-2.jpg', NULL, 'Yak quyet tam san lung hon ma de tra thu.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (6, 'Tee Yod 3 – Quỷ Ăn Tạng 3', 'Kinh di', 104, 'T18', '2025-10-01', 'assets/posters/tee-yod-3.jpg', NULL, 'Yak doi dau voi nhung the luc tam linh moi.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (7, 'Tee Yod 4 – Quỷ Ăn Tạng 4', 'Kinh di', 111, 'T18', '2026-01-01', 'assets/posters/tee-yod-4.jpg', NULL, 'Yak tim hieu bi an cua Ho Tinh.', 'coming_soon');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (8, 'Avatar – Thế Thần', 'Khoa hoc vien tuong', 162, 'T13', '2009-12-18', 'assets/posters/avatar-1.jpg', NULL, 'Jake Sully kham pha hanh tinh Pandora.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (9, 'Avatar: Dòng Chảy Của Nước', 'Khoa hoc vien tuong', 192, 'T13', '2022-12-16', 'assets/posters/avatar-2.jpg', NULL, 'Gia dinh Jake Sully kham pha dai duong Pandora.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (10, 'Avatar: Lửa Và Tro Tàn', 'Khoa hoc vien tuong', 195, 'T13', '2025-12-19', 'assets/posters/avatar-3.jpg', NULL, 'Gia dinh Sully doi mat voi toc Mangkwan.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (11, 'Lật Mặt', 'Hanh dong, hai', 100, 'T13', '2015-05-15', 'assets/posters/lat-mat-1.jpg', NULL, 'Hanh trinh truy duoi va vu oan.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (12, 'Lật Mặt 2: Phim Trường', 'Hanh dong, hai', 100, 'T13', '2016-04-01', 'assets/posters/lat-mat-2.jpg', NULL, 'Cau chuyen ve nhung nguoi dong the.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (13, 'Lật Mặt 3: Ba Chàng Khuyết', 'Hai, tam ly', 100, 'T13', '2018-04-20', 'assets/posters/lat-mat-3.jpg', NULL, 'Ba nguoi ban tim lai nguoi me.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (14, 'Lật Mặt 4: Nhà Có Khách', 'Kinh di, hai', 100, 'T16', '2019-04-12', 'assets/posters/lat-mat-4.jpg', NULL, 'Nhung bi an trong ngoi nha o que.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (15, 'Lật Mặt 5: 48H', 'Hanh dong', 100, 'T16', '2021-04-16', 'assets/posters/lat-mat-5.jpg', NULL, 'Nguoi cha bao ve gia dinh khoi toi pham.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (16, 'Lật Mặt 6: Tấm Vé Định Mệnh', 'Tam ly, giat gan', 100, 'T16', '2023-04-28', 'assets/posters/lat-mat-6.jpg', NULL, 'Tam ve so va bi mat tinh ban.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (17, 'Lật Mặt 7: Một Điều Ước', 'Tinh cam, gia dinh', 100, 'P', '2024-04-26', 'assets/posters/lat-mat-7.jpg', NULL, 'Cau chuyen cam dong ve tinh mau tu.', 'now_showing');

INSERT INTO Movies (movie_id, title, genre, duration_minutes, age_rating, release_date, poster_url, trailer_url, description, status)
VALUES (18, 'Lật Mặt 8: Vòng Tay Nắng', 'Tinh cam, gia dinh', 100, 'K', '2025-04-30', 'assets/posters/lat-mat-8.jpg', NULL, 'Hanh trinh theo duoi uoc mo am nhac.', 'now_showing');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (1, 4, 1, '2026-11-10 09:00:00', '2026-11-10 11:01:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (2, 11, 1, '2026-11-10 14:00:00', '2026-11-10 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (3, 18, 1, '2026-11-10 19:00:00', '2026-11-10 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (4, 10, 2, '2026-11-10 09:00:00', '2026-11-10 12:15:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (5, 17, 2, '2026-11-10 14:00:00', '2026-11-10 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (6, 9, 2, '2026-11-10 19:00:00', '2026-11-10 22:12:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (7, 16, 3, '2026-11-10 09:00:00', '2026-11-10 10:40:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (8, 8, 3, '2026-11-10 14:00:00', '2026-11-10 16:42:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (9, 15, 3, '2026-11-10 19:00:00', '2026-11-10 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (10, 7, 1, '2026-11-11 09:00:00', '2026-11-11 10:51:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (11, 14, 1, '2026-11-11 14:00:00', '2026-11-11 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (12, 6, 1, '2026-11-11 19:00:00', '2026-11-11 20:44:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (13, 13, 2, '2026-11-11 09:00:00', '2026-11-11 10:40:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (14, 5, 2, '2026-11-11 14:00:00', '2026-11-11 15:52:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (15, 12, 2, '2026-11-11 19:00:00', '2026-11-11 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (16, 4, 3, '2026-11-11 09:00:00', '2026-11-11 11:01:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (17, 11, 3, '2026-11-11 14:00:00', '2026-11-11 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (18, 18, 3, '2026-11-11 19:00:00', '2026-11-11 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (19, 10, 1, '2026-11-12 09:00:00', '2026-11-12 12:15:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (20, 17, 1, '2026-11-12 14:00:00', '2026-11-12 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (21, 9, 1, '2026-11-12 19:00:00', '2026-11-12 22:12:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (22, 16, 2, '2026-11-12 09:00:00', '2026-11-12 10:40:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (23, 8, 2, '2026-11-12 14:00:00', '2026-11-12 16:42:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (24, 15, 2, '2026-11-12 19:00:00', '2026-11-12 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (25, 7, 3, '2026-11-12 09:00:00', '2026-11-12 10:51:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (26, 14, 3, '2026-11-12 14:00:00', '2026-11-12 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (27, 6, 3, '2026-11-12 19:00:00', '2026-11-12 20:44:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (28, 13, 1, '2026-11-13 09:00:00', '2026-11-13 10:40:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (29, 5, 1, '2026-11-13 14:00:00', '2026-11-13 15:52:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (30, 12, 1, '2026-11-13 19:00:00', '2026-11-13 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (31, 4, 2, '2026-11-13 09:00:00', '2026-11-13 11:01:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (32, 11, 2, '2026-11-13 14:00:00', '2026-11-13 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (33, 18, 2, '2026-11-13 19:00:00', '2026-11-13 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (34, 10, 3, '2026-11-13 09:00:00', '2026-11-13 12:15:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (35, 17, 3, '2026-11-13 14:00:00', '2026-11-13 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (36, 9, 3, '2026-11-13 19:00:00', '2026-11-13 22:12:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (37, 16, 1, '2026-11-14 09:00:00', '2026-11-14 10:40:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (38, 8, 1, '2026-11-14 14:00:00', '2026-11-14 16:42:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (39, 15, 1, '2026-11-14 19:00:00', '2026-11-14 20:40:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (40, 7, 2, '2026-11-14 09:00:00', '2026-11-14 10:51:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (41, 14, 2, '2026-11-14 14:00:00', '2026-11-14 15:40:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (42, 6, 2, '2026-11-14 19:00:00', '2026-11-14 20:44:00', 90000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (43, 13, 3, '2026-11-14 09:00:00', '2026-11-14 10:40:00', 65000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (44, 5, 3, '2026-11-14 14:00:00', '2026-11-14 15:52:00', 75000, 'scheduled');

INSERT INTO Shows (show_id, movie_id, hall_id, start_time, end_time, base_price, status)
VALUES (45, 12, 3, '2026-11-14 19:00:00', '2026-11-14 20:40:00', 90000, 'scheduled');