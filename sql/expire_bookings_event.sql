
USE cinema_management_dev;

DROP EVENT IF EXISTS ev_expire_bookings;

CREATE EVENT ev_expire_bookings
ON SCHEDULE EVERY 1 MINUTE
STARTS CURRENT_TIMESTAMP
ENABLE
DO
    CALL sp_expire_bookings();

