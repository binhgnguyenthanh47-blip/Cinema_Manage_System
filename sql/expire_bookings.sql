
USE cinema_management_dev;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_expire_bookings$$

CREATE PROCEDURE sp_expire_bookings()
BEGIN
    -- Cap nhat booking va ticket da het han
    UPDATE bookings b
    JOIN tickets t
        ON b.booking_id = t.booking_id
    SET
        b.status = 'expired',
        t.status = 'expired'
    WHERE b.status = 'pending'
      AND t.status = 'held'
      AND b.expires_at <= NOW();
END$$

DELIMITER ;
