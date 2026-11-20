
const db = require('../config/db');

const getAllShows = async (req, res) => {
    try {
        const [shows] = await db.query(`
            SELECT
                s.show_id,
                s.movie_id,
                m.title AS movie_title,
                s.hall_id,
                h.hall_name,
                c.cinema_id,
                c.name AS cinema_name,
                c.address AS cinema_address,
                c.cluster_name,
                s.start_time,
                s.end_time,
                s.show_format,
                s.base_price,
                s.status
            FROM shows s
            JOIN movies m
                ON s.movie_id = m.movie_id
            JOIN cinemahalls h
                ON s.hall_id = h.hall_id
            JOIN cinemas c
                ON h.cinema_id = c.cinema_id
            ORDER BY s.start_time ASC, s.show_id ASC
        `);

        res.status(200).json({
            success: true,
            total: shows.length,
            data: shows
        });

    } catch (error) {
        console.error('Error getting shows:', error);

        res.status(500).json({
            success: false,
            message: 'Khong the lay danh sach suat chieu'
        });
    }
};

module.exports = { getAllShows };
