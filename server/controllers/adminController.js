const db = require('../config/db');
const { broadcast } = require('../utils/realtime');

// Middleware kiểm tra quyền Admin dựa trên bảng users trong MySQL
const verifyAdmin = async (req, res, next) => {
    try {
        const userId = Number(req.headers['x-user-id'] || req.query.userId);
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: 'Thiếu thông tin xác thực quản trị viên!' });
        }

        const [rows] = await db.query(
            'SELECT user_id, role FROM users WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0 || String(rows[0].role).toLowerCase() !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền quản trị!' });
        }

        req.adminUser = rows[0];
        next();
    } catch (error) {
        console.error('Lỗi xác thực Admin:', error);
        return res.status(500).json({ success: false, message: 'Lỗi xác thực quyền truy cập!' });
    }
};

// ==========================================
// 1. THỐNG KÊ DOANH THU & TỔNG QUAN
// ==========================================
const getDashboardStats = async (req, res) => {
    try {
        const [[revenueRow]] = await db.query(`
            SELECT
                COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) AS pending_revenue,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN combo_amount ELSE 0 END), 0) AS paid_combo_revenue,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN combo_amount ELSE 0 END), 0) AS pending_combo_revenue,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN (total_amount - combo_amount) ELSE 0 END), 0) AS paid_ticket_revenue,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_bookings,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_bookings
            FROM bookings
        `);

        const [[ticketRow]] = await db.query(`
            SELECT
                COUNT(CASE WHEN status = 'paid' THEN 1 END) AS sold_tickets,
                COUNT(CASE WHEN status = 'held' THEN 1 END) AS held_tickets
            FROM tickets
        `);

        const [[movieRow]] = await db.query(`
            SELECT
                COUNT(*) AS total_movies,
                COUNT(CASE WHEN status = 'now_showing' THEN 1 END) AS now_showing_count,
                COUNT(CASE WHEN status = 'coming_soon' THEN 1 END) AS coming_soon_count
            FROM movies
        `);

        const [[showRow]] = await db.query(`
            SELECT COUNT(*) AS active_shows
            FROM shows
            WHERE status = 'scheduled'
        `);

        const [revenueByMovie] = await db.query(`
            SELECT
                m.movie_id,
                m.title,
                m.status,
                COUNT(CASE WHEN t.status IN ('paid', 'held') THEN t.ticket_id END) AS ticket_count,
                COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.price ELSE 0 END), 0) AS revenue
            FROM movies m
            LEFT JOIN shows s ON m.movie_id = s.movie_id
            LEFT JOIN tickets t ON s.show_id = t.show_id
            GROUP BY m.movie_id, m.title, m.status
            ORDER BY revenue DESC, ticket_count DESC, m.movie_id ASC
        `);

        const [revenueByCinema] = await db.query(`
            SELECT
                c.cinema_id,
                c.name AS cinema_name,
                c.cluster_name,
                COALESCE(SUM(CASE WHEN t.status = 'paid' THEN t.price ELSE 0 END), 0) AS revenue,
                COUNT(CASE WHEN t.status = 'paid' THEN t.ticket_id END) AS ticket_count
            FROM cinemas c
            LEFT JOIN cinemahalls h ON c.cinema_id = h.cinema_id
            LEFT JOIN shows s ON h.hall_id = s.hall_id
            LEFT JOIN tickets t ON s.show_id = t.show_id
            GROUP BY c.cinema_id, c.name, c.cluster_name
            ORDER BY revenue DESC
        `);

        return res.json({
            success: true,
            data: {
                kpis: {
                    paid_revenue: Number(revenueRow.paid_revenue || 0),
                    pending_revenue: Number(revenueRow.pending_revenue || 0),
                    paid_combo_revenue: Number(revenueRow.paid_combo_revenue || 0),
                    pending_combo_revenue: Number(revenueRow.pending_combo_revenue || 0),
                    paid_ticket_revenue: Number(revenueRow.paid_ticket_revenue || 0),
                    paid_bookings: Number(revenueRow.paid_bookings || 0),
                    pending_bookings: Number(revenueRow.pending_bookings || 0),
                    sold_tickets: Number(ticketRow.sold_tickets || 0),
                    held_tickets: Number(ticketRow.held_tickets || 0),
                    total_movies: Number(movieRow.total_movies || 0),
                    now_showing_count: Number(movieRow.now_showing_count || 0),
                    coming_soon_count: Number(movieRow.coming_soon_count || 0),
                    active_shows: Number(showRow.active_shows || 0)
                },
                revenueByMovie: revenueByMovie.map(r => ({
                    ...r,
                    ticket_count: Number(r.ticket_count),
                    revenue: Number(r.revenue)
                })),
                revenueByCinema: revenueByCinema.map(r => ({
                    ...r,
                    ticket_count: Number(r.ticket_count),
                    revenue: Number(r.revenue)
                }))
            }
        });
    } catch (error) {
        console.error('Lỗi getDashboardStats:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải dữ liệu thống kê!' });
    }
};

// ==========================================
// 2. CRUD QUẢN LÝ PHIM
// ==========================================
const getAdminMovies = async (req, res) => {
    try {
        const [movies] = await db.query(`
            SELECT
                m.*,
                (SELECT COUNT(*) FROM shows s WHERE s.movie_id = m.movie_id AND s.status = 'scheduled') AS show_count
            FROM movies m
            ORDER BY m.movie_id ASC
        `);
        return res.json({ success: true, data: movies });
    } catch (error) {
        console.error('Lỗi getAdminMovies:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải danh sách phim!' });
    }
};

const createMovie = async (req, res) => {
    try {
        const {
            title, genre, duration_minutes, age_rating, release_date_text,
            poster_url, trailer_url, description, status,
            director, actors, country, language, rating
        } = req.body;

        if (!title || !genre) {
            return res.status(400).json({ success: false, message: 'Tên phim và thể loại là bắt buộc!' });
        }

        const validStatuses = ['coming_soon', 'now_showing', 'ended'];
        const movieStatus = validStatuses.includes(status) ? status : 'now_showing';
        const duration = duration_minutes ? Number(duration_minutes) : null;
        const parsedRating = (rating !== '' && rating !== null && rating !== undefined) ? Number(rating) : null;

        const [result] = await db.query(`
            INSERT INTO movies (
                title, genre, duration_minutes, age_rating, release_date_text,
                poster_url, trailer_url, description, status,
                director, actors, country, language, rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title.trim(),
            genre.trim(),
            duration,
            age_rating || 'P',
            release_date_text || null,
            poster_url || 'assets/images/spiderman-brand-new-day.jpeg',
            trailer_url || null,
            description || null,
            movieStatus,
            director || null,
            actors || null,
            country || 'Mỹ',
            language || 'Tiếng Anh, phụ đề tiếng Việt',
            parsedRating
        ]);

        broadcast('movies_updated', { action: 'create', movie_id: result.insertId });

        return res.status(201).json({
            success: true,
            message: 'Thêm phim mới thành công!',
            movie_id: result.insertId
        });
    } catch (error) {
        console.error('Lỗi createMovie:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi thêm phim!' });
    }
};

const updateMovie = async (req, res) => {
    try {
        const movieId = Number(req.params.id);
        const {
            title, genre, duration_minutes, age_rating, release_date_text,
            poster_url, trailer_url, description, status,
            director, actors, country, language, rating
        } = req.body;

        if (!title || !genre) {
            return res.status(400).json({ success: false, message: 'Tên phim và thể loại là bắt buộc!' });
        }

        const validStatuses = ['coming_soon', 'now_showing', 'ended'];
        const movieStatus = validStatuses.includes(status) ? status : 'now_showing';
        const duration = duration_minutes ? Number(duration_minutes) : null;
        const parsedRating = (rating !== '' && rating !== null && rating !== undefined) ? Number(rating) : null;

        const [result] = await db.query(`
            UPDATE movies SET
                title = ?,
                genre = ?,
                duration_minutes = ?,
                age_rating = ?,
                release_date_text = ?,
                poster_url = ?,
                trailer_url = ?,
                description = ?,
                status = ?,
                director = ?,
                actors = ?,
                country = ?,
                language = ?,
                rating = ?
            WHERE movie_id = ?
        `, [
            title.trim(),
            genre.trim(),
            duration,
            age_rating || 'P',
            release_date_text || null,
            poster_url || null,
            trailer_url || null,
            description || null,
            movieStatus,
            director || null,
            actors || null,
            country || null,
            language || null,
            parsedRating,
            movieId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phim cần cập nhật!' });
        }

        broadcast('movies_updated', { action: 'update', movie_id: movieId });

        return res.json({ success: true, message: 'Cập nhật phim thành công!' });
    } catch (error) {
        console.error('Lỗi updateMovie:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật phim!' });
    }
};

const deleteMovie = async (req, res) => {
    try {
        const movieId = Number(req.params.id);

        const [[showCheck]] = await db.query(
            'SELECT COUNT(*) AS cnt FROM shows WHERE movie_id = ?',
            [movieId]
        );

        if (showCheck.cnt > 0) {
            return res.status(400).json({
                success: false,
                message: `Phim này đang có ${showCheck.cnt} suất chiếu liên kết. Hãy xóa các suất chiếu trước hoặc chuyển trạng thái phim sang "Ngừng chiếu"!`
            });
        }

        const [result] = await db.query('DELETE FROM movies WHERE movie_id = ?', [movieId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phim!' });
        }

        broadcast('movies_updated', { action: 'delete', movie_id: movieId });

        return res.json({ success: true, message: 'Đã xóa phim khỏi hệ thống!' });
    } catch (error) {
        console.error('Lỗi deleteMovie:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa phim!' });
    }
};

// ==========================================
// 3. CRUD QUẢN LÝ SUẤT CHIẾU
// ==========================================
const getAdminShows = async (req, res) => {
    try {
        const [shows] = await db.query(`
            SELECT
                s.show_id,
                s.movie_id,
                m.title AS movie_title,
                m.duration_minutes,
                s.hall_id,
                h.hall_name,
                c.cinema_id,
                c.name AS cinema_name,
                c.cluster_name,
                DATE_FORMAT(s.start_time, '%Y-%m-%d %H:%i:%s') AS start_time,
                DATE_FORMAT(s.end_time, '%Y-%m-%d %H:%i:%s') AS end_time,
                s.base_price,
                s.show_format,
                s.status,
                (SELECT COUNT(*) FROM tickets t WHERE t.show_id = s.show_id AND t.status IN ('held', 'paid')) AS booked_seats,
                (SELECT COUNT(*) FROM seats st WHERE st.hall_id = s.hall_id) AS total_seats
            FROM shows s
            JOIN movies m ON s.movie_id = m.movie_id
            JOIN cinemahalls h ON s.hall_id = h.hall_id
            JOIN cinemas c ON h.cinema_id = c.cinema_id
            ORDER BY s.start_time DESC, s.show_id DESC
        `);

        return res.json({
            success: true,
            data: shows.map(s => ({
                ...s,
                base_price: Number(s.base_price),
                booked_seats: Number(s.booked_seats),
                total_seats: Number(s.total_seats)
            }))
        });
    } catch (error) {
        console.error('Lỗi getAdminShows:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải danh sách suất chiếu!' });
    }
};

const createShow = async (req, res) => {
    try {
        const { movie_id, hall_id, start_time, end_time, base_price, show_format, status } = req.body;

        if (!movie_id || !hall_id || !start_time || !end_time || base_price === undefined) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin suất chiếu!' });
        }

        const startFormatted = start_time.replace('T', ' ').slice(0, 19);
        const endFormatted = end_time.replace('T', ' ').slice(0, 19);

        if (new Date(endFormatted) <= new Date(startFormatted)) {
            return res.status(400).json({ success: false, message: 'Giờ kết thúc phải sau giờ bắt đầu!' });
        }

        // Kiểm tra trùng khung giờ trong cùng phòng chiếu
        const [conflicts] = await db.query(`
            SELECT s.show_id, m.title,
                   DATE_FORMAT(s.start_time, '%H:%i %d/%m') AS st,
                   DATE_FORMAT(s.end_time, '%H:%i %d/%m') AS et
            FROM shows s
            JOIN movies m ON s.movie_id = m.movie_id
            WHERE s.hall_id = ?
              AND s.status != 'cancelled'
              AND s.start_time < ?
              AND s.end_time > ?
        `, [Number(hall_id), endFormatted, startFormatted]);

        if (conflicts.length > 0) {
            const c = conflicts[0];
            return res.status(409).json({
                success: false,
                message: `Trùng lịch phòng chiếu! Phim "${c.title}" đang chiếu từ ${c.st} đến ${c.et}.`
            });
        }

        const [result] = await db.query(`
            INSERT INTO shows (movie_id, hall_id, start_time, end_time, base_price, show_format, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            Number(movie_id),
            Number(hall_id),
            startFormatted,
            endFormatted,
            Number(base_price),
            show_format || '2d_subtitled',
            status || 'scheduled'
        ]);

        broadcast('shows_updated', { action: 'create', show_id: result.insertId });

        return res.status(201).json({
            success: true,
            message: 'Tạo suất chiếu mới thành công!',
            show_id: result.insertId
        });
    } catch (error) {
        console.error('Lỗi createShow:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo suất chiếu!' });
    }
};

const updateShow = async (req, res) => {
    try {
        const showId = Number(req.params.id);
        const { movie_id, hall_id, start_time, end_time, base_price, show_format, status } = req.body;

        const startFormatted = start_time.replace('T', ' ').slice(0, 19);
        const endFormatted = end_time.replace('T', ' ').slice(0, 19);

        if (new Date(endFormatted) <= new Date(startFormatted)) {
            return res.status(400).json({ success: false, message: 'Giờ kết thúc phải sau giờ bắt đầu!' });
        }

        if (status !== 'cancelled') {
            const [conflicts] = await db.query(`
                SELECT s.show_id, m.title
                FROM shows s
                JOIN movies m ON s.movie_id = m.movie_id
                WHERE s.hall_id = ?
                  AND s.show_id != ?
                  AND s.status != 'cancelled'
                  AND s.start_time < ?
                  AND s.end_time > ?
            `, [Number(hall_id), showId, endFormatted, startFormatted]);

            if (conflicts.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Khung giờ bị trùng với suất chiếu phim "${conflicts[0].title}" trong phòng này!`
                });
            }
        }

        const [result] = await db.query(`
            UPDATE shows SET
                movie_id = ?,
                hall_id = ?,
                start_time = ?,
                end_time = ?,
                base_price = ?,
                show_format = ?,
                status = ?
            WHERE show_id = ?
        `, [
            Number(movie_id),
            Number(hall_id),
            startFormatted,
            endFormatted,
            Number(base_price),
            show_format || '2d_subtitled',
            status || 'scheduled',
            showId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy suất chiếu!' });
        }

        broadcast('shows_updated', { action: 'update', show_id: showId });

        return res.json({ success: true, message: 'Cập nhật suất chiếu thành công!' });
    } catch (error) {
        console.error('Lỗi updateShow:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật suất chiếu!' });
    }
};

const deleteShow = async (req, res) => {
    try {
        const showId = Number(req.params.id);

        const [[activeTickets]] = await db.query(
            `SELECT COUNT(*) AS cnt FROM tickets WHERE show_id = ? AND status IN ('held', 'paid')`,
            [showId]
        );

        if (activeTickets.cnt > 0) {
            return res.status(400).json({
                success: false,
                message: `Suất chiếu đã có ${activeTickets.cnt} vé được đặt/giữ chỗ. Hãy chuyển trạng thái sang "Đã hủy" thay vì xóa!`
            });
        }

        await db.query('DELETE FROM tickets WHERE show_id = ?', [showId]);
        const [result] = await db.query('DELETE FROM shows WHERE show_id = ?', [showId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy suất chiếu!' });
        }

        broadcast('shows_updated', { action: 'delete', show_id: showId });

        return res.json({ success: true, message: 'Đã xóa suất chiếu!' });
    } catch (error) {
        console.error('Lỗi deleteShow:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa suất chiếu!' });
    }
};

// ==========================================
// 4. QUẢN LÝ RẠP, PHÒNG CHIẾU & SƠ ĐỒ GHẾ
// ==========================================
const getCinemasAndHalls = async (req, res) => {
    try {
        const [cinemas] = await db.query('SELECT * FROM cinemas ORDER BY cinema_id ASC');
        const [halls] = await db.query(`
            SELECT
                h.*,
                c.name AS cinema_name,
                c.cluster_name,
                (SELECT COUNT(*) FROM seats s WHERE s.hall_id = h.hall_id) AS seat_count
            FROM cinemahalls h
            JOIN cinemas c ON h.cinema_id = c.cinema_id
            ORDER BY c.cinema_id ASC, h.hall_id ASC
        `);

        return res.json({
            success: true,
            data: {
                cinemas,
                halls: halls.map(h => ({ ...h, seat_count: Number(h.seat_count) }))
            }
        });
    } catch (error) {
        console.error('Lỗi getCinemasAndHalls:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải danh sách rạp và phòng!' });
    }
};

const createCinema = async (req, res) => {
    try {
        const { name, address, cluster_name } = req.body;
        if (!name || !address) {
            return res.status(400).json({ success: false, message: 'Tên rạp và địa chỉ là bắt buộc!' });
        }
        const [result] = await db.query(
            'INSERT INTO cinemas (name, address, cluster_name) VALUES (?, ?, ?)',
            [name.trim(), address.trim(), cluster_name ? cluster_name.trim() : 'Cụm rạp Trung tâm']
        );
        broadcast('cinemas_updated', { action: 'create_cinema', cinema_id: result.insertId });
        return res.status(201).json({ success: true, message: 'Thêm rạp chiếu mới thành công!', cinema_id: result.insertId });
    } catch (error) {
        console.error('Lỗi createCinema:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi thêm rạp chiếu!' });
    }
};

const createHall = async (req, res) => {
    try {
        const { cinema_id, hall_name, auto_generate_seats } = req.body;
        if (!cinema_id || !hall_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn rạp và nhập tên phòng!' });
        }

        const [result] = await db.query(
            'INSERT INTO cinemahalls (cinema_id, hall_name) VALUES (?, ?)',
            [Number(cinema_id), hall_name.trim()]
        );
        const hallId = result.insertId;

        if (auto_generate_seats) {
            const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
            const values = [];
            for (const r of rows) {
                const seatType = r === 'F' ? 'couple' : (r === 'D' || r === 'E' ? 'vip' : 'standard');
                const cols = r === 'F' ? 4 : 8;
                for (let num = 1; num <= cols; num++) {
                    values.push([hallId, r, num, seatType]);
                }
            }
            await db.query('INSERT INTO seats (hall_id, row_label, seat_number, seat_type) VALUES ?', [values]);
        }

        broadcast('cinemas_updated', { action: 'create_hall', hall_id: hallId });
        return res.status(201).json({ success: true, message: 'Thêm phòng chiếu thành công!', hall_id: hallId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Tên phòng đã tồn tại trong rạp này!' });
        }
        console.error('Lỗi createHall:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi thêm phòng chiếu!' });
    }
};

const getHallSeats = async (req, res) => {
    try {
        const hallId = Number(req.params.hallId);
        const showId = req.query.showId ? Number(req.query.showId) : null;

        let query = `
            SELECT
                s.seat_id,
                s.hall_id,
                s.row_label,
                s.seat_number,
                s.seat_type,
                CONCAT(s.row_label, s.seat_number) AS seat_label
        `;

        const params = [];
        if (showId) {
            query += `,
                COALESCE((
                    SELECT t.status
                    FROM tickets t
                    WHERE t.show_id = ?
                      AND t.seat_id = s.seat_id
                      AND t.status IN ('held', 'paid')
                    LIMIT 1
                ), 'available') AS booking_status
            `;
            params.push(showId);
        } else {
            query += `, 'available' AS booking_status`;
        }

        query += `
            FROM seats s
            WHERE s.hall_id = ?
            ORDER BY s.row_label ASC, s.seat_number ASC
        `;
        params.push(hallId);

        const [seats] = await db.query(query, params);
        return res.json({ success: true, data: seats });
    } catch (error) {
        console.error('Lỗi getHallSeats:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải sơ đồ ghế!' });
    }
};

const generateHallSeats = async (req, res) => {
    try {
        const hallId = Number(req.params.hallId);
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        const values = [];

        for (const r of rows) {
            const seatType = r === 'F' ? 'couple' : (r === 'D' || r === 'E' ? 'vip' : 'standard');
            const cols = r === 'F' ? 4 : 8;
            for (let num = 1; num <= cols; num++) {
                values.push([hallId, r, num, seatType]);
            }
        }

        await db.query('INSERT IGNORE INTO seats (hall_id, row_label, seat_number, seat_type) VALUES ?', [values]);
        broadcast('seats_updated', { hall_id: hallId });

        return res.json({ success: true, message: 'Đã khởi tạo sơ đồ 44 ghế chuẩn cho phòng chiếu!' });
    } catch (error) {
        console.error('Lỗi generateHallSeats:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khởi tạo sơ đồ ghế!' });
    }
};

const updateSeatType = async (req, res) => {
    try {
        const seatId = Number(req.params.seatId);
        const { seat_type } = req.body;
        const allowed = ['standard', 'vip', 'couple'];

        if (!allowed.includes(seat_type)) {
            return res.status(400).json({ success: false, message: 'Loại ghế không hợp lệ!' });
        }

        const [result] = await db.query('UPDATE seats SET seat_type = ? WHERE seat_id = ?', [seat_type, seatId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy ghế!' });
        }

        broadcast('seats_updated', { seat_id: seatId, seat_type });
        return res.json({ success: true, message: 'Cập nhật loại ghế thành công!' });
    } catch (error) {
        console.error('Lỗi updateSeatType:', error);
        return res.status(500).json({ success: false, message: 'Lỗi cập nhật ghế!' });
    }
};

// ==========================================
// 5. QUẢN LÝ ĐƠN ĐẶT VÉ (REAL-TIME BOOKINGS)
// ==========================================
const getAdminBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT
                b.booking_id,
                b.user_id,
                u.full_name,
                u.email,
                DATE_FORMAT(b.booking_time, '%H:%i %d/%m/%Y') AS booking_time,
                b.status,
                b.total_amount,
                b.combo_summary,
                b.combo_amount,
                MIN(m.title) AS movie_title,
                MIN(c.name) AS cinema_name,
                MIN(h.hall_name) AS hall_name,
                DATE_FORMAT(MIN(s.start_time), '%H:%i %d/%m/%Y') AS show_time,
                GROUP_CONCAT(CONCAT(st.row_label, st.seat_number) ORDER BY st.row_label, st.seat_number SEPARATOR ', ') AS seats,
                COUNT(t.ticket_id) AS ticket_count
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            LEFT JOIN tickets t ON b.booking_id = t.booking_id
            LEFT JOIN shows s ON t.show_id = s.show_id
            LEFT JOIN movies m ON s.movie_id = m.movie_id
            LEFT JOIN cinemahalls h ON s.hall_id = h.hall_id
            LEFT JOIN cinemas c ON h.cinema_id = c.cinema_id
            LEFT JOIN seats st ON t.seat_id = st.seat_id
            GROUP BY b.booking_id, b.user_id, u.full_name, u.email, b.booking_time, b.status, b.total_amount, b.combo_summary, b.combo_amount
            ORDER BY b.booking_id DESC
            LIMIT 100
        `);

        return res.json({
            success: true,
            data: bookings.map(b => ({
                ...b,
                total_amount: Number(b.total_amount),
                combo_amount: Number(b.combo_amount || 0),
                ticket_count: Number(b.ticket_count)
            }))
        });
    } catch (error) {
        console.error('Lỗi getAdminBookings:', error);
        return res.status(500).json({ success: false, message: 'Không thể tải danh sách đơn đặt vé!' });
    }
};

const updateBookingStatus = async (req, res) => {
    let connection;
    try {
        const bookingId = Number(req.params.id);
        const { status } = req.body;
        const mapTicketStatus = {
            paid: 'paid',
            cancelled: 'cancelled',
            expired: 'expired',
            pending: 'held'
        };

        if (!mapTicketStatus[status]) {
            return res.status(400).json({ success: false, message: 'Trạng thái đơn vé không hợp lệ!' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'UPDATE bookings SET status = ? WHERE booking_id = ?',
            [status, bookingId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt vé!' });
        }

        await connection.query(
            'UPDATE tickets SET status = ? WHERE booking_id = ?',
            [mapTicketStatus[status], bookingId]
        );

        await connection.commit();

        broadcast('bookings_updated', { booking_id: bookingId, status });
        return res.json({ success: true, message: 'Đã cập nhật trạng thái đơn vé & đồng bộ ghế!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Lỗi updateBookingStatus:', error);
        return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn vé!' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    verifyAdmin,
    getDashboardStats,
    getAdminMovies,
    createMovie,
    updateMovie,
    deleteMovie,
    getAdminShows,
    createShow,
    updateShow,
    deleteShow,
    getCinemasAndHalls,
    createCinema,
    createHall,
    getHallSeats,
    generateHallSeats,
    updateSeatType,
    getAdminBookings,
    updateBookingStatus
};
