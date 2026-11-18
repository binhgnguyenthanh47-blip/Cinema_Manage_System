
const db = require('../config/db');

const getSeatsByShow = async (req, res) => {
    try {
        const showId = Number(req.params.showId);

        // Kiểm tra ID suất chiếu
        if (!Number.isSafeInteger(showId) || showId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID suat chieu khong hop le'
            });
        }

        // Lấy thông tin suất chiếu
        const [shows] = await db.query(`
            SELECT show_id, hall_id, base_price
            FROM shows
            WHERE show_id = ?
        `, [showId]);

        if (shows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay suat chieu'
            });
        }

        const show = shows[0];

        // Lấy danh sách ghế, giá và trạng thái
        const [seats] = await db.query(`
            SELECT
                s.seat_id,
                s.hall_id,
                s.row_label,
                s.seat_number,
                s.seat_type,

                CONCAT(
                    s.row_label,
                    s.seat_number
                ) AS seat_label,

                CASE s.seat_type
                    WHEN 'standard' THEN sh.base_price
                    WHEN 'vip' THEN sh.base_price + 20000
                    WHEN 'couple' THEN 190000
                END AS price,

                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM tickets t
                        WHERE t.show_id = sh.show_id
                          AND t.seat_id = s.seat_id
                          AND t.status IN ('held', 'paid')
                    )
                    THEN 'occupied'
                    ELSE 'available'
                END AS availability

            FROM seats s
            JOIN shows sh
                ON s.hall_id = sh.hall_id

            WHERE sh.show_id = ?

            ORDER BY
                s.row_label,
                s.seat_number
        `, [showId]);

        res.status(200).json({
            success: true,
            show_id: showId,
            hall_id: show.hall_id,
            base_price: Number(show.base_price),
            total: seats.length,
            data: seats.map(seat => ({
                ...seat,
                price: Number(seat.price)
            }))
        });

    } catch (error) {
        console.error('Error getting seats:', error);

        res.status(500).json({
            success: false,
            message: 'Khong the lay danh sach ghe'
        });
    }
};

module.exports = { getSeatsByShow };
