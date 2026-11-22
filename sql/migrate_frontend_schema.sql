
USE cinema_management_dev;

-- Bo sung thong tin phim
ALTER TABLE movies
    ADD COLUMN IF NOT EXISTS director VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS actors TEXT NULL,
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS language VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) NULL,
    ADD COLUMN IF NOT EXISTS release_date_text VARCHAR(100) NULL;

-- Cho phep phim chua co thoi luong
ALTER TABLE movies
    MODIFY COLUMN duration_minutes SMALLINT UNSIGNED NULL;

-- Bo sung cum rap
ALTER TABLE cinemas
    ADD COLUMN IF NOT EXISTS cluster_name VARCHAR(100) NULL;
