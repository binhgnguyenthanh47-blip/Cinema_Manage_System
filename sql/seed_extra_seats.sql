
USE cinema_management_dev;

DELIMITER $$

DROP PROCEDURE IF EXISTS seed_extra_seats$$

CREATE PROCEDURE seed_extra_seats()
BEGIN
    DECLARE v_hall_id BIGINT;
    DECLARE v_row INT;
    DECLARE v_number INT;
    DECLARE v_done BOOLEAN DEFAULT FALSE;

    DECLARE hall_cursor CURSOR FOR
        SELECT hall_id FROM cinemahalls;

    DECLARE CONTINUE HANDLER FOR NOT FOUND
        SET v_done = TRUE;

    OPEN hall_cursor;

    hall_loop: LOOP
        FETCH hall_cursor INTO v_hall_id;

        IF v_done THEN
            LEAVE hall_loop;
        END IF;

        -- Thêm hàng F, G: ghế VIP
        SET v_row = 6;

        WHILE v_row <= 7 DO
            SET v_number = 1;

            WHILE v_number <= 10 DO
                INSERT INTO seats
                    (hall_id, row_label, seat_number, seat_type)
                VALUES
                    (v_hall_id, CHAR(64 + v_row USING utf8mb4),
                     v_number, 'vip')
                ON DUPLICATE KEY UPDATE
                    seat_id = seat_id;

                SET v_number = v_number + 1;
            END WHILE;

            SET v_row = v_row + 1;
        END WHILE;

        -- Thêm hàng H: 5 ghế đôi
        SET v_number = 1;

        WHILE v_number <= 5 DO
            INSERT INTO seats
                (hall_id, row_label, seat_number, seat_type)
            VALUES
                (v_hall_id, 'H', v_number, 'couple')
            ON DUPLICATE KEY UPDATE
                seat_id = seat_id;

            SET v_number = v_number + 1;
        END WHILE;

    END LOOP;

    CLOSE hall_cursor;
END$$

DELIMITER ;

CALL seed_extra_seats();

DROP PROCEDURE IF EXISTS seed_extra_seats;
