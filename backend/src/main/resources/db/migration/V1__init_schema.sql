-- V1: Initial Schema for Kabadi Platform

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    waste_recycler_id VARCHAR(20) UNIQUE,
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    pincode VARCHAR(6),
    preferred_language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE kabadi_walas (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    area VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    k_coins_balance INTEGER DEFAULT 0,
    daily_collected_kg DECIMAL(10,2) DEFAULT 0,
    daily_threshold_unlocked BOOLEAN DEFAULT FALSE,
    last_threshold_reset DATE,
    priority_active BOOLEAN DEFAULT FALSE,
    priority_expires_at TIMESTAMP,
    preferred_language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE waste_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    kabadi_wala_id BIGINT NOT NULL REFERENCES kabadi_walas(id),
    material_type VARCHAR(20) NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2),
    price_per_kg DECIMAL(10,2),
    transaction_time TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    kabadi_wala_id BIGINT REFERENCES kabadi_walas(id),
    pickup_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    scheduled_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    material_type VARCHAR(20),
    expected_weight_kg DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE k_coin_redemptions (
    id BIGSERIAL PRIMARY KEY,
    kabadi_wala_id BIGINT NOT NULL REFERENCES kabadi_walas(id),
    coins_redeemed INTEGER NOT NULL,
    selected_commodity VARCHAR(50),
    redeemed_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE admin_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(200) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admins (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Default admin config values
INSERT INTO admin_config (config_key, config_value) VALUES
('daily_unlock_threshold_kg', '20'),
('kcoins_per_extra_kg', '5'),
('redemption_threshold_coins', '30'),
('redemption_validity_days', '2'),
('price_reduction_per_kg', '1');

-- Default admin user (password: admin123 - bcrypt hashed)
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2a$12$LkK3lHQ4BkJPlSd7v/gFCO0GnDAu/m9pJj9fGsBDe7KXW7hBGhFGi');
