
-- 1. Lấy tất cả phim
SELECT *
FROM Movies;

-- 2. Lấy phim đang chiếu
SELECT movie_id, title, genre, duration_minutes, poster_url
FROM Movies
WHERE status = 'now_showing';

-- 3. Lấy lịch chiếu kèm tên phim, rạp và phòng
SELECT
    s.show_id,
    m.title AS movie_title,
    c.name AS cinema_name,
    h.hall_name,
    s.start_time,
    s.end_time,
    s.base_price
FROM Shows AS s
JOIN Movies AS m ON s.movie_id = m.movie_id
JOIN CinemaHalls AS h ON s.hall_id = h.hall_id
JOIN Cinemas AS c ON h.cinema_id = c.cinema_id
ORDER BY s.start_time;
