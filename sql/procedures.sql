USE cinema_management_dev;


DELIMITER $$

DROP PROCEDURE IF EXISTS sp_book_seat$$

CREATE PROCEDURE sp_book_seat(
    IN p_booking_id BIGINT,
    IN p_show_id BIGINT,
    IN p_seat_id BIGINT,
    IN p_price DECIMAL(12,2)
)
BEGIN
    DECLARE v_hall_id BIGINT DEFAULT NULL;
    DECLARE v_seat_hall_id BIGINT DEFAULT NULL;
    DECLARE v_seat_type VARCHAR(20) DEFAULT NULL;
    DECLARE v_base_price DECIMAL(12,2) DEFAULT NULL;
    DECLARE v_price DECIMAL(12,2);

    -- Lay thong tin suat chieu (chi suat con lich va chua bat dau)
    SELECT hall_id, base_price
    INTO v_hall_id, v_base_price
    FROM shows
    WHERE show_id = p_show_id
      AND status = 'scheduled'
      AND start_time > NOW();

    IF v_hall_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Suat chieu khong ton tai, da huy hoac da bat dau';
    END IF;

    -- Lay thong tin ghe
    SELECT hall_id, seat_type
    INTO v_seat_hall_id, v_seat_type
    FROM seats
    WHERE seat_id = p_seat_id;

    -- Kiem tra ghe thuoc dung phong
    IF v_hall_id IS NULL
       OR v_seat_hall_id IS NULL
       OR v_hall_id <> v_seat_hall_id THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ghe khong thuoc phong chieu';
    END IF;

    -- Tinh gia theo loai ghe
    CASE v_seat_type
        WHEN 'standard' THEN
            SET v_price = v_base_price;

        WHEN 'vip' THEN
            SET v_price = v_base_price + 20000;

        WHEN 'couple' THEN
            SET v_price = 190000;

        ELSE
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Loai ghe khong hop le';
    END CASE;

    -- Them ve
    INSERT INTO tickets (
        booking_id,
        show_id,
        seat_id,
        price,
        status
    )
    VALUES (
        p_booking_id,
        p_show_id,
        p_seat_id,
        v_price,
        'held'
    );
END$$

DELIMITER ;
