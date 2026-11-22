-- ==========================================
-- MIGRATION cho database da tao tu schema cu.
-- Chay duoc nhieu lan (idempotent).
-- Tuong thich MySQL 8.0+ va MariaDB
-- (MySQL khong ho tro ADD COLUMN IF NOT EXISTS
--  nen dung thu tuc kiem tra information_schema).
-- ==========================================

USE cinema_management_dev;

DELIMITER $$

-- Them cot neu chua co
DROP PROCEDURE IF EXISTS mig_add_column$$
CREATE PROCEDURE mig_add_column(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', p_table, '` ADD COLUMN `',
            p_column, '` ', p_definition
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

-- Them index neu chua co
DROP PROCEDURE IF EXISTS mig_add_index$$
CREATE PROCEDURE mig_add_index(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND INDEX_NAME = p_index
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', p_table, '` ADD INDEX `',
            p_index, '` (', p_columns, ')'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;


-- Bo sung thong tin phim
CALL mig_add_column('movies', 'director', 'VARCHAR(255) NULL');
CALL mig_add_column('movies', 'actors', 'TEXT NULL');
CALL mig_add_column('movies', 'country', 'VARCHAR(100) NULL');
CALL mig_add_column('movies', 'language', 'VARCHAR(100) NULL');
CALL mig_add_column('movies', 'rating', 'DECIMAL(3,1) NULL');
CALL mig_add_column('movies', 'release_date_text', 'VARCHAR(100) NULL');

-- Cho phep phim chua co thoi luong
ALTER TABLE movies
    MODIFY COLUMN duration_minutes SMALLINT UNSIGNED NULL;

-- Bo sung cum rap
CALL mig_add_column('cinemas', 'cluster_name', 'VARCHAR(100) NULL');

-- Bo sung dinh dang suat chieu (API /api/shows can cot nay)
CALL mig_add_column(
    'shows',
    'show_format',
    'ENUM(''2d_sub'', ''2d_dubbed'') NOT NULL DEFAULT ''2d_sub'' AFTER base_price'
);

-- Thoi diem tao tai khoan
CALL mig_add_column(
    'users',
    'created_at',
    'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
);

-- Chi tiet combo + ma giam gia cua don (luu khi thanh toan)
CALL mig_add_column('bookings', 'combo_detail', 'VARCHAR(255) NULL AFTER total_amount');
CALL mig_add_column('bookings', 'combo_amount', 'DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER combo_detail');
CALL mig_add_column('bookings', 'voucher_code', 'VARCHAR(30) NULL AFTER combo_amount');
CALL mig_add_column('bookings', 'discount_amount', 'DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER voucher_code');

-- Thong tin nguoi nhan ve
CALL mig_add_column('bookings', 'contact_name', 'VARCHAR(100) NULL AFTER discount_amount');
CALL mig_add_column('bookings', 'contact_email', 'VARCHAR(255) NULL AFTER contact_name');
CALL mig_add_column('bookings', 'contact_phone', 'VARCHAR(15) NULL AFTER contact_email');

-- Index phuc vu API va job het han booking
CALL mig_add_index('movies', 'idx_movies_status', 'status');
CALL mig_add_index('shows', 'idx_shows_start_time', 'start_time');
CALL mig_add_index('bookings', 'idx_bookings_status_expires', 'status, expires_at');
CALL mig_add_index('tickets', 'idx_tickets_show_seat_status', 'show_id, seat_id, status');

-- Bang anh cua phim (upload nhieu anh)
CREATE TABLE IF NOT EXISTS movie_images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_movie_images_movie (movie_id, sort_order),
    CONSTRAINT fk_movie_images_movie
        FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Don dep thu tuc tam
DROP PROCEDURE IF EXISTS mig_add_column;
DROP PROCEDURE IF EXISTS mig_add_index;
