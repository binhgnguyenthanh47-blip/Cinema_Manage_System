
const db = require('../config/db');

const getAllCinemas = async (req, res) => {
    try {
        const [cinemas] = await db.query(`
            SELECT
                cinema_id,
                name,
                address,
                cluster_name
            FROM cinemas
            ORDER BY cinema_id ASC
        `);

        res.status(200).json({
            success: true,
            total: cinemas.length,
            data: cinemas
        });

    } catch (error) {
        console.error('Error getting cinemas:', error);

        res.status(500).json({
            success: false,
            message: 'Khong the lay danh sach rap'
        });
    }
};

module.exports = { getAllCinemas };
