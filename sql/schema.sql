-- ==========================================
-- CINEMA MANAGEMENT SYSTEM
-- Database Schema
-- MySQL / MariaDB
-- ==========================================

CREATE DATABASE IF NOT EXISTS cinema_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cinema_management;


-- ==========================================
-- 1. USERS - QUẢN LÝ NGƯỜI DÙNG
-- ==========================================

CREATE TABLE IF NOT EXISTS Users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin')
        NOT NULL DEFAULT 'customer'
) ENGINE=InnoDB;


-- ==========================================
-- 2. MOVIES - QUẢN LÝ PHIM
-- ==========================================


CREATE TABLE IF NOT EXISTS Movies (
    movie_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NULL,
    age_rating VARCHAR(10) NULL,
    release_date DATE NULL,
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
    release_date_text VARCHAR(100) NULL
) ENGINE=InnoDB;


-- ==========================================
-- 3. CINEMAS - QUẢN LÝ RẠP CHIẾU PHIM
-- ==========================================

CREATE TABLE IF NOT EXISTS Cinemas (
    cinema_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    cluster_name VARCHAR(100) NULL
) ENGINE=InnoDB;


-- ==========================================
-- 4. CINEMAHALLS - QUẢN LÝ PHÒNG CHIẾU
-- ==========================================

CREATE TABLE IF NOT EXISTS CinemaHalls (
    hall_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cinema_id BIGINT NOT NULL,
    hall_name VARCHAR(100) NOT NULL,

    UNIQUE KEY uq_hall_name_per_cinema
        (cinema_id, hall_name),

    CONSTRAINT fk_halls_cinema
        FOREIGN KEY (cinema_id)
        REFERENCES Cinemas(cinema_id)
) ENGINE=InnoDB;


-- ==========================================
-- 5. SEATS - QUẢN LÝ GHẾ NGỒI
-- ==========================================

CREATE TABLE IF NOT EXISTS Seats (
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
        REFERENCES CinemaHalls(hall_id),

    CONSTRAINT chk_seat_number
        CHECK (seat_number > 0)
) ENGINE=InnoDB;


-- ==========================================
-- 6. SHOWS - QUẢN LÝ SUẤT CHIẾU
-- ==========================================

CREATE TABLE IF NOT EXISTS Shows (
    show_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    hall_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    show_format VARCHAR(20) NOT NULL DEFAULT '2D',

    status ENUM('scheduled', 'cancelled', 'finished')
        NOT NULL DEFAULT 'scheduled',

    UNIQUE KEY uq_show_hall (show_id, hall_id),

    KEY idx_shows_hall_time (hall_id, start_time),
    KEY idx_shows_movie_time (movie_id, start_time),

    CONSTRAINT fk_shows_movie
        FOREIGN KEY (movie_id)
        REFERENCES Movies(movie_id),

    CONSTRAINT fk_shows_hall
        FOREIGN KEY (hall_id)
        REFERENCES CinemaHalls(hall_id),

    CONSTRAINT chk_show_times
        CHECK (end_time > start_time),

    CONSTRAINT chk_show_price
        CHECK (base_price >= 0)
) ENGINE=InnoDB;


-- ==========================================
-- 7. BOOKINGS - QUẢN LÝ ĐƠN ĐẶT VÉ
-- ==========================================

CREATE TABLE IF NOT EXISTS Bookings (
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

    total_amount DECIMAL(12,2)
        NOT NULL DEFAULT 0,

    KEY idx_bookings_user (user_id),

    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id),

    CONSTRAINT chk_booking_total
        CHECK (total_amount >= 0)
) ENGINE=InnoDB;


-- ==========================================
-- 8. TICKETS - QUẢN LÝ VÉ XEM PHIM
-- ==========================================

CREATE TABLE IF NOT EXISTS Tickets (
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

    qr_code VARCHAR(255) NULL UNIQUE,

    -- Cột tự sinh: chỉ giữ ghế khi vé còn hiệu lực
    active_seat_id BIGINT AS (
        CASE
            WHEN status IN ('held', 'paid')
            THEN seat_id
            ELSE NULL
        END
    ) PERSISTENT,

    -- Ngăn đặt trùng ghế trong cùng suất chiếu
    UNIQUE KEY uq_active_show_seat
        (show_id, active_seat_id),

    KEY idx_tickets_booking (booking_id),
    KEY idx_tickets_seat (seat_id),

    CONSTRAINT fk_tickets_booking
        FOREIGN KEY (booking_id)
        REFERENCES Bookings(booking_id),

    CONSTRAINT fk_tickets_show
        FOREIGN KEY (show_id)
        REFERENCES Shows(show_id),

    CONSTRAINT fk_tickets_seat
        FOREIGN KEY (seat_id)
        REFERENCES Seats(seat_id),

    CONSTRAINT chk_ticket_price
        CHECK (price >= 0)
) ENGINE=InnoDB;


-- ==========================================
-- 9. PAYMENTS - QUẢN LÝ THANH TOÁN
-- ==========================================

CREATE TABLE IF NOT EXISTS Payments (
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

    transaction_code VARCHAR(100) NULL UNIQUE,
    paid_at DATETIME NULL,

    KEY idx_payments_booking (booking_id),

    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id)
        REFERENCES Bookings(booking_id),

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0)
) ENGINE=InnoDB;

-- ==========================================
-- KIỂM TRA DANH SÁCH BẢNG
-- ==========================================

SHOW TABLES;