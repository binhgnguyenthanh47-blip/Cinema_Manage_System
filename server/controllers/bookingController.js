
const pool = require('../config/db');
const { broadcast } = require('../utils/realtime'); // <-- Thêm dòng này

const createBooking = async (req, res) => {
    let connection;

    try {
        const { user_id, show_id, seat_ids } = req.body || {};

        // 1. Kiem tra user_id
        if (!Number.isSafeInteger(user_id) || user_id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'user_id khong hop le'
            });
        }

        // 2. Kiem tra show_id
        if (!Number.isSafeInteger(show_id) || show_id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'show_id khong hop le'
            });
        }

        // 3. Kiem tra danh sach ghe
        if (
            !Array.isArray(seat_ids) ||
            seat_ids.length === 0 ||
            seat_ids.length > 8 ||
            !seat_ids.every(
                id => Number.isSafeInteger(id) && id > 0
            ) ||
            new Set(seat_ids).size !== seat_ids.length
        ) {
            return res.status(400).json({
                success: false,
                message: 'Danh sach ghe khong hop le'
            });
        }

        // 4. Lay ket noi va bat dau transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 5. Kiem tra nguoi dung
        const [users] = await connection.query(
            'SELECT user_id FROM users WHERE user_id = ?',
            [user_id]
        );

        if (users.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Nguoi dung khong ton tai'
            });
        }

        // 6. Tao booking, giu ghe trong 15 phut
        const [bookingResult] = await connection.query(
            `INSERT INTO bookings (
                user_id,
                expires_at,
                status,
                total_amount
            )
            VALUES (
                ?,
                DATE_ADD(NOW(), INTERVAL 15 MINUTE),
                'pending',
                0
            )`,
            [user_id]
        );

        const bookingId = bookingResult.insertId;

        // 7. Dat tung ghe
        const sortedSeatIds = [...seat_ids].sort((a, b) => a - b);

        for (const seatId of sortedSeatIds) {
            await connection.query(
                'CALL sp_book_seat(?, ?, ?, ?)',
                [bookingId, show_id, seatId, 0]
            );
        }

        // 8. Tinh tong tien tu database
        const [totals] = await connection.query(
            `SELECT SUM(price) AS total_amount
             FROM tickets
             WHERE booking_id = ?`,
            [bookingId]
        );

        const totalAmount = Number(totals[0].total_amount);

        // 9. Cap nhat tong tien booking
        await connection.query(
            `UPDATE bookings
             SET total_amount = ?
             WHERE booking_id = ?`,
            [totalAmount, bookingId]
        );

        // 10. Luu transaction
        await connection.commit();

        // 11. Thong bao realtime
        try {
            broadcast('booking_created', {
                booking_id: bookingId,
                show_id,
                seat_ids,
                total_amount: totalAmount
            });
        } catch (realtimeError) {
            console.error('Realtime error:', realtimeError);
        }

        // 12. Tra ket qua ve frontend
        return res.status(201).json({
            success: true,
            message: 'Giu ghe thanh cong',
            data: {
                booking_id: bookingId,
                show_id,
                seat_ids,
                total_amount: totalAmount,
                status: 'pending'
            }
        });


    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Create booking error:', error);

        // Loi dat trung ghe
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Mot hoac nhieu ghe da duoc dat'
            });
        }

        // Loi tu stored procedure
        if (error.sqlState === '45000') {
            return res.status(400).json({
                success: false,
                message: error.sqlMessage
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Loi he thong'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const confirmCheckout = async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        const { combo_solo = 0, combo_couple = 0, discount_amount = 0 } = req.body || {};

        if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã đơn không hợp lệ' });
        }

        const [[ticketSum]] = await pool.query(
            'SELECT COALESCE(SUM(price), 0) AS ticket_total FROM tickets WHERE booking_id = ?',
            [bookingId]
        );
        const ticketTotal = Number(ticketSum.ticket_total || 0);

        const soloQty = Math.max(0, parseInt(combo_solo, 10) || 0);
        const coupleQty = Math.max(0, parseInt(combo_couple, 10) || 0);
        const comboAmount = soloQty * 79000 + coupleQty * 139000;

        const comboParts = [];
        if (soloQty > 0) comboParts.push(`${soloQty}x Combo Solo`);
        if (coupleQty > 0) comboParts.push(`${coupleQty}x Combo Couple`);
        const comboSummary = comboParts.length > 0 ? comboParts.join(', ') : null;

        const discount = Math.max(0, Number(discount_amount) || 0);
        const finalTotal = Math.max(0, ticketTotal + comboAmount - discount);

        const [result] = await pool.query(
            `UPDATE bookings
             SET combo_summary = ?,
                 combo_amount = ?,
                 discount_amount = ?,
                 total_amount = ?
             WHERE booking_id = ?`,
            [comboSummary, comboAmount, discount, finalTotal, bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt vé' });
        }

        try {
            broadcast('bookings_updated', { booking_id: bookingId, combo_amount: comboAmount, total_amount: finalTotal });
        } catch (err) {
            console.error('Realtime error:', err);
        }

        return res.json({
            success: true,
            message: 'Đã cập nhật thông tin thanh toán & bắp nước!',
            data: { booking_id: bookingId, combo_summary: comboSummary, combo_amount: comboAmount, total_amount: finalTotal }
        });
    } catch (error) {
        console.error('Confirm checkout error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi cập nhật thanh toán' });
    }
};

module.exports = {
    createBooking,
    confirmCheckout
};
