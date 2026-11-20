
const db = require('../config/db');

const getAllMovies = async (req, res) => {
    try {
        const [movies] = await db.query(`
            SELECT
                movie_id,
                title,
                genre,
                duration_minutes,
                age_rating,
                release_date,
                release_date_text,
                poster_url,
                trailer_url,
                description,
                director,
                actors,
                country,
                language,
                rating,
                status
            FROM movies
            WHERE status IN ('now_showing', 'coming_soon')
            ORDER BY movie_id ASC
        `);

        res.status(200).json({
            success: true,
            total: movies.length,
            data: movies
        });

    } catch (error) {
        console.error('Error getting movies:', error);

        res.status(500).json({
            success: false,
            message: 'Khong the lay danh sach phim'
        });
    }
};

module.exports = { getAllMovies };
