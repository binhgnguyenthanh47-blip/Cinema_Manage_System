USE cinema_management_dev;


DELIMITER $$

DROP TRIGGER IF EXISTS trg_shows_no_overlap_insert$$

CREATE TRIGGER trg_shows_no_overlap_insert
BEFORE INSERT ON shows
FOR EACH ROW
BEGIN
    IF NEW.status <> 'cancelled'
       AND EXISTS (
           SELECT 1
           FROM shows s
           WHERE s.hall_id = NEW.hall_id
             AND s.status <> 'cancelled'
             AND NEW.start_time < s.end_time
             AND NEW.end_time > s.start_time
       )
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Lich chieu bi trung trong cung phong';
    END IF;
END$$

DELIMITER ;


DELIMITER $$

DROP TRIGGER IF EXISTS trg_shows_no_overlap_update$$

CREATE TRIGGER trg_shows_no_overlap_update
BEFORE UPDATE ON shows
FOR EACH ROW
BEGIN
    IF NEW.status <> 'cancelled'
       AND EXISTS (
           SELECT 1
           FROM shows s
           WHERE s.hall_id = NEW.hall_id
             AND s.show_id <> OLD.show_id
             AND s.status <> 'cancelled'
             AND NEW.start_time < s.end_time
             AND NEW.end_time > s.start_time
       )
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cap nhat lich chieu bi trung gio';
    END IF;
END$$

DELIMITER ;
