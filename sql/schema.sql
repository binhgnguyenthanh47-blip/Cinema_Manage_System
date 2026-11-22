-- ==========================================
-- CINEMA MANAGEMENT SYSTEM
-- Database Schema
-- Tuong thich: MySQL 8.0+ va MariaDB 10.2+
--
-- Thu tu chay cac file SQL:
--   1. schema.sql              (tao database + bang)
--   2. procedures.sql          (sp_book_seat)
--   3. triggers.sql            (chong trung lich chieu)
--   4. expire_bookings.sql     (sp_expire_bookings)
--   5. expire_bookings_event.sql
--   6. dummy_data.sql          (du lieu mau)
--   7. seed_seats.sql / seed_extra_seats.sql
--
-- Luu y:
--   - Ten bang viet thuong toan bo de chay duoc tren ca
--     Windows va Linux (lower_case_table_names = 0).
--   - CREATE TABLE IF NOT EXISTS se KHONG cap nhat bang da ton tai.
--     Database cu: chay migrate_frontend_schema.sql,
--     hoac DROP DATABASE roi chay lai tu dau.
-- ==========================================

CREATE DATABASE IF NOT EXISTS cinema_management_dev
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cinema_management_dev;


-- ==========================================
-- 1. USERS - QUẢN LÝ NGƯỜI DÙNG
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    role ENUM('customer', 'admin')
        NOT NULL DEFAULT 'customer',

    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email
        UNIQUE (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2. MOVIES - QUẢN LÝ PHIM
-- ==========================================

CREATE TABLE IF NOT EXISTS movies (
    movie_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NULL,
    age_rating VARCHAR(10) NULL,
    release_date DATE NULL,
    release_date_text VARCHAR(100) NULL,
    poster_url VARCHAR(500) NULL,
    trailer_url VARCHAR(500) NULL,
    description TEXT NULL,

    status ENUM(
        'coming_soon',
        'now_showing',
        'ended'
    ) NOT NULL DEFAULT 'coming_soon',

    director VARCHAR(255) NULL,
    actors TEXT NULL,
    country VARCHAR(100) NULL,
    language VARCHAR(100) NULL,
    rating DECIMAL(3,1) NULL,

    -- API /api/movies loc theo status
    KEY idx_movies_status (status),

    CONSTRAINT chk_movie_duration
        CHECK (duration_minutes IS NULL OR duration_minutes > 0),

    CONSTRAINT chk_movie_rating
        CHECK (rating IS NULL OR rating BETWEEN 0 AND 10)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2b. MOVIE_IMAGES - BỘ ẢNH CỦA PHIM (upload nhiều ảnh)
-- ==========================================

CREATE TABLE IF NOT EXISTS movie_images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    KEY idx_movie_images_movie (movie_id, sort_order),

    -- Xoa phim thi xoa luon danh sach anh
    CONSTRAINT fk_movie_images_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 3. CINEMAS - QUẢN LÝ RẠP CHIẾU PHIM
-- ==========================================

CREATE TABLE IF NOT EXISTS cinemas (
    cinema_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    cluster_name VARCHAR(100) NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 4. CINEMAHALLS - QUẢN LÝ PHÒNG CHIẾU
-- ==========================================

CREATE TABLE IF NOT EXISTS cinemahalls (
    hall_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cinema_id BIGINT NOT NULL,
    hall_name VARCHAR(100) NOT NULL,

    UNIQUE KEY uq_hall_name_per_cinema
        (cinema_id, hall_name),

    CONSTRAINT fk_halls_cinema
        FOREIGN KEY (cinema_id)
        REFERENCES cinemas(cinema_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 5. SEATS - QUẢN LÝ GHẾ NGỒI
-- ==========================================

CREATE TABLE IF NOT EXISTS seats (
    seat_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hall_id BIGINT NOT NULL,
    row_label VARCHAR(5) NOT NULL,
    seat_number SMALLINT UNSIGNED NOT NULL,

    seat_type ENUM('standard', 'vip', 'couple')
        NOT NULL DEFAULT 'standard',

    UNIQUE KEY uq_seat_position
        (hall_id, row_label, seat_number),

    UNIQUE KEY uq_seat_hall
        (seat_id, hall_id),

    CONSTRAINT fk_seats_hall
        FOREIGN KEY (hall_id)
        REFERENCES cinemahalls(hall_id),

    CONSTRAINT chk_seat_number
        CHECK (seat_number > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 6. SHOWS - QUẢN LÝ SUẤT CHIẾU
-- ==========================================

CREATE TABLE IF NOT EXISTS shows (
    show_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    hall_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,

    -- Dinh dang suat chieu: 2D phu de / 2D long tieng
    show_format ENUM('2d_sub', '2d_dubbed')
        NOT NULL DEFAULT '2d_sub',

    status ENUM('scheduled', 'cancelled', 'finished')
        NOT NULL DEFAULT 'scheduled',

    UNIQUE KEY uq_show_hall (show_id, hall_id),

    KEY idx_shows_hall_time (hall_id, start_time),
    KEY idx_shows_movie_time (movie_id, start_time),
    KEY idx_shows_start_time (start_time),

    CONSTRAINT fk_shows_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(movie_id),

    CONSTRAINT fk_shows_hall
        FOREIGN KEY (hall_id)
        REFERENCES cinemahalls(hall_id),

    CONSTRAINT chk_show_times
        CHECK (end_time > start_time),

    CONSTRAINT chk_show_price
        CHECK (base_price >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 7. BOOKINGS - QUẢN LÝ ĐƠN ĐẶT VÉ
-- ==========================================

CREATE TABLE IF NOT EXISTS bookings (
    booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,

    booking_time DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    expires_at DATETIME NULL,

    status ENUM(
        'pending',
        'paid',
        'cancelled',
        'expired'
    ) NOT NULL DEFAULT 'pending',

    -- So tien khach thuc tra = tien ve + combo - giam gia
    total_amount DECIMAL(12,2)
        NOT NULL DEFAULT 0,

    -- Chi tiet combo bap nuoc va ma giam gia (luu khi thanh toan)
    combo_detail VARCHAR(255) NULL,
    combo_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    voucher_code VARCHAR(30) NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Thong tin nguoi nhan ve (nhap o trang thanh toan)
    contact_name VARCHAR(100) NULL,
    contact_email VARCHAR(255) NULL,
    contact_phone VARCHAR(15) NULL,

    KEY idx_bookings_user (user_id),

    -- Phuc vu sp_expire_bookings (chay moi phut)
    KEY idx_bookings_status_expires (status, expires_at),

    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT chk_booking_total
        CHECK (total_amount >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 8. TICKETS - QUẢN LÝ VÉ XEM PHIM
-- ==========================================

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    show_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    price DECIMAL(12,2) NOT NULL,

    status ENUM(
        'held',
        'paid',
        'cancelled',
        'expired'
    ) NOT NULL DEFAULT 'held',

    qr_code VARCHAR(255) NULL,

    -- Cot tu sinh: chi giu ghe khi ve con hieu luc.
    -- STORED chay duoc tren ca MySQL 8 va MariaDB
    -- (PERSISTENT chi co tren MariaDB).
    active_seat_id BIGINT
        GENERATED ALWAYS AS (
            CASE
                WHEN status IN ('held', 'paid')
                THEN seat_id
                ELSE NULL
            END
        ) STORED,

    -- Ngan dat trung ghe trong cung suat chieu
    -- (NULL khong bi tinh trung nen ve het han/huy khong chan ghe)
    UNIQUE KEY uq_active_show_seat
        (show_id, active_seat_id),

    CONSTRAINT uq_tickets_qr_code
        UNIQUE (qr_code),

    KEY idx_tickets_booking (booking_id),
    KEY idx_tickets_seat (seat_id),

    -- Phuc vu truy van trang thai ghe theo suat chieu
    KEY idx_tickets_show_seat_status (show_id, seat_id, status),

    CONSTRAINT fk_tickets_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id),

    CONSTRAINT fk_tickets_show
        FOREIGN KEY (show_id)
        REFERENCES shows(show_id),

    CONSTRAINT fk_tickets_seat
        FOREIGN KEY (seat_id)
        REFERENCES seats(seat_id),

    CONSTRAINT chk_ticket_price
        CHECK (price >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 9. PAYMENTS - QUẢN LÝ THANH TOÁN
-- ==========================================

CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,

    method ENUM(
        'cash',
        'bank_transfer',
        'card',
        'ewallet'
    ) NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    status ENUM(
        'pending',
        'success',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'pending',

    transaction_code VARCHAR(100) NULL,
    paid_at DATETIME NULL,

    CONSTRAINT uq_payments_transaction_code
        UNIQUE (transaction_code),

    KEY idx_payments_booking (booking_id),

    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id),

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- KIỂM TRA DANH SÁCH BẢNG
-- ==========================================

SHOW TABLES;
