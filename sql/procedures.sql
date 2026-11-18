
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_book_seat$$

CREATE PROCEDURE sp_book_seat(
    IN p_booking_id BIGINT,
    IN p_show_id BIGINT,
    IN p_seat_id BIGINT,
    IN p_price DECIMAL(12,2)
)
BEGIN
    DECLARE v_hall_id BIGINT;
    DECLARE v_seat_hall_id BIGINT;

    -- Kiểm tra giá vé
    IF p_price < 0 OR p_price IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Gia ve khong hop le';
    END IF;

    -- Lấy phòng chiếu của suất chiếu
    SELECT hall_id INTO v_hall_id
    FROM shows
    WHERE show_id = p_show_id
      AND status = 'scheduled';

    -- Lấy phòng chứa ghế
    SELECT hall_id INTO v_seat_hall_id
    FROM seats
    WHERE seat_id = p_seat_id;

    -- Kiểm tra ghế có thuộc phòng chiếu không
    IF v_hall_id IS NULL
       OR v_seat_hall_id IS NULL
       OR v_hall_id <> v_seat_hall_id THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ghe khong thuoc phong chieu';
    END IF;

    -- Thêm vé
    -- UNIQUE KEY trong tickets sẽ chặn đặt trùng ghế
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
        p_price,
        'held'
    );
END$$

DELIMITER ;
