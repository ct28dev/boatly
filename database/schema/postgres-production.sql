-- ============================================================
-- BOATLY - PostgreSQL Production Schema (30+ Tables)
-- River & Sea Thailand - Boat Rental Platform
-- ============================================================
-- Compatible: PostgreSQL 14+
-- Preserves: Current MySQL schema logic + multilingual (th/en/zh/ko/fr)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT,
    language VARCHAR(10) NOT NULL DEFAULT 'th',
    profile_image TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','operator','admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================================
-- 2. USER AUTH (OAuth / Social Login)
-- ============================================================
CREATE TABLE user_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);
CREATE INDEX idx_user_auth_user_id ON user_auth(user_id);
CREATE INDEX idx_user_auth_provider ON user_auth(provider, provider_user_id);

-- ============================================================
-- 3. DESTINATIONS
-- ============================================================
CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    name_th VARCHAR(120),
    name_en VARCHAR(120),
    name_zh VARCHAR(120),
    name_ko VARCHAR(120),
    name_fr VARCHAR(120),
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    description_th TEXT,
    description_en TEXT,
    description_zh TEXT,
    description_ko TEXT,
    description_fr TEXT,
    hero_image TEXT,
    country VARCHAR(100) NOT NULL DEFAULT 'Thailand',
    province VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'coming_soon' CHECK (status IN ('active','coming_soon','inactive')),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_destinations_slug ON destinations(slug);
CREATE INDEX idx_destinations_status ON destinations(status);
CREATE INDEX idx_destinations_province ON destinations(province);

-- ============================================================
-- 4. PIERS
-- ============================================================
CREATE TABLE piers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    name_th VARCHAR(150),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_piers_destination_id ON piers(destination_id);
CREATE INDEX idx_piers_location ON piers(latitude, longitude);

-- ============================================================
-- 5. OPERATORS
-- ============================================================
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name VARCHAR(200) NOT NULL,
    description TEXT,
    logo TEXT,
    tax_id VARCHAR(20),
    bank_account VARCHAR(50),
    contact_phone VARCHAR(20),
    email VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_operators_user_id ON operators(user_id);
CREATE INDEX idx_operators_status ON operators(status);

-- ============================================================
-- 6. OPERATOR USERS
-- ============================================================
CREATE TABLE operator_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(operator_id, user_id)
);
CREATE INDEX idx_operator_users_operator ON operator_users(operator_id);
CREATE INDEX idx_operator_users_user ON operator_users(user_id);

-- ============================================================
-- 7. BOATS
-- ============================================================
CREATE TABLE boats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    name_th VARCHAR(150),
    name_en VARCHAR(150),
    name_zh VARCHAR(150),
    name_ko VARCHAR(150),
    name_fr VARCHAR(150),
    slug VARCHAR(200) NOT NULL UNIQUE,
    boat_type VARCHAR(50) NOT NULL DEFAULT 'longtail',
    capacity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration INT NOT NULL,
    description TEXT,
    description_th TEXT,
    description_en TEXT,
    description_zh TEXT,
    description_ko TEXT,
    description_fr TEXT,
    route TEXT,
    route_th TEXT,
    route_en TEXT,
    route_zh TEXT,
    route_ko TEXT,
    route_fr TEXT,
    highlights TEXT,
    river VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    featured BOOLEAN NOT NULL DEFAULT false,
    pier_name VARCHAR(200),
    pier_name_th VARCHAR(200),
    pier_latitude DECIMAL(10,8),
    pier_longitude DECIMAL(11,8),
    default_time_slots JSONB,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_boats_operator ON boats(operator_id);
CREATE INDEX idx_boats_destination ON boats(destination_id);
CREATE INDEX idx_boats_slug ON boats(slug);
CREATE INDEX idx_boats_status ON boats(status);
CREATE INDEX idx_boats_featured ON boats(featured) WHERE featured = true;

-- ============================================================
-- 8. BOAT IMAGES
-- ============================================================
CREATE TABLE boat_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_boat_images_boat_id ON boat_images(boat_id);

-- ============================================================
-- 9. BOAT ROUTES
-- ============================================================
CREATE TABLE boat_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    route_name VARCHAR(150) NOT NULL,
    duration INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_boat_routes_boat_id ON boat_routes(boat_id);

-- ============================================================
-- 10. ROUTE STOPS
-- ============================================================
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES boat_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    stop_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);

-- ============================================================
-- 11. ADDONS (Boat add-on services)
-- ============================================================
CREATE TABLE addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    name_th VARCHAR(200),
    name_en VARCHAR(200),
    name_zh VARCHAR(200),
    name_ko VARCHAR(200),
    name_fr VARCHAR(200),
    description_th TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'fa-plus-circle',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addons_boat_id ON addons(boat_id);

-- ============================================================
-- 12. BOAT AVAILABILITY
-- ============================================================
CREATE TABLE boat_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    max_seats INT NOT NULL,
    booked_seats INT NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    price_override DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(boat_id, date, time_slot)
);
CREATE INDEX idx_boat_availability_boat_date ON boat_availability(boat_id, date);
CREATE INDEX idx_boat_availability_available ON boat_availability(boat_id, date, time_slot) WHERE is_available = true;

-- ============================================================
-- 13. BOOKINGS
-- ============================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_ref VARCHAR(30) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE RESTRICT,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    passengers INT NOT NULL,
    customer_name VARCHAR(100),
    customer_email VARCHAR(150),
    customer_phone VARCHAR(20),
    special_request TEXT,
    booking_addons JSONB,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_boat_id ON bookings(boat_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- ============================================================
-- 14. BOOKING PASSENGERS
-- ============================================================
CREATE TABLE booking_passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    passenger_type VARCHAR(20) NOT NULL CHECK (passenger_type IN ('adult','child','infant')),
    count INT NOT NULL,
    unit_price DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_passengers_booking_id ON booking_passengers(booking_id);

-- ============================================================
-- 15. BOOKING REQUESTS
-- ============================================================
CREATE TABLE booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    request_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_requests_booking_id ON booking_requests(booking_id);

-- ============================================================
-- 16. BOOKING CHECKINS
-- ============================================================
CREATE TABLE booking_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    pier_id UUID REFERENCES piers(id) ON DELETE SET NULL,
    checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qr_code VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_checkins_booking_id ON booking_checkins(booking_id);
CREATE INDEX idx_booking_checkins_qr ON booking_checkins(qr_code) WHERE qr_code IS NOT NULL;

-- ============================================================
-- 17. PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL CHECK (method IN ('promptpay','credit_card','bank_transfer','cash')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
    transaction_ref VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_ref ON payments(transaction_ref) WHERE transaction_ref IS NOT NULL;

-- ============================================================
-- 18. PAYMENT TRANSACTIONS
-- ============================================================
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    gateway_ref VARCHAR(255),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);

-- ============================================================
-- 19. REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_boat_id ON reviews(boat_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_status ON reviews(status) WHERE status = 'approved';

-- ============================================================
-- 20. REVIEW IMAGES
-- ============================================================
CREATE TABLE review_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_review_images_review_id ON review_images(review_id);

-- ============================================================
-- 21. USER FAVORITES
-- ============================================================
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, boat_id)
);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_boat ON user_favorites(boat_id);

-- ============================================================
-- 22. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50),
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- 23. PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_th VARCHAR(200),
    title_en VARCHAR(200),
    title_zh VARCHAR(200),
    title_ko VARCHAR(200),
    title_fr VARCHAR(200),
    description_th TEXT,
    description_en TEXT,
    description_zh TEXT,
    description_ko TEXT,
    description_fr TEXT,
    image_url TEXT,
    link_type VARCHAR(20) DEFAULT 'none' CHECK (link_type IN ('boat','destination','url','none')),
    link_value VARCHAR(500),
    gradient_colors VARCHAR(200) DEFAULT 'linear-gradient(135deg,#023e8a,#00b4d8)',
    icon VARCHAR(50) DEFAULT 'fa-tag',
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
    discount_value DECIMAL(10,2) DEFAULT 0,
    code VARCHAR(50),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
CREATE INDEX idx_promotions_active ON promotions(is_active, start_date, end_date) WHERE is_active = true;

-- ============================================================
-- 24. BOAT LOCATION TRACKING
-- ============================================================
CREATE TABLE boat_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(6,2),
    heading DECIMAL(5,2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_boat_locations_boat_id ON boat_locations(boat_id);
CREATE INDEX idx_boat_locations_recorded ON boat_locations(boat_id, recorded_at DESC);

-- ============================================================
-- 25. TIPS (Crew tips)
-- ============================================================
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_id UUID,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tips_booking_id ON tips(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_tips_user_id ON tips(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 26. SETTINGS (Key-value config)
-- ============================================================
CREATE TABLE settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 27. AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- 28. DEVICE TOKENS (Push notifications)
-- ============================================================
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) CHECK (platform IN ('ios','android','web')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, token)
);
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);

-- ============================================================
-- 29. PROMO CODE USAGE
-- ============================================================
CREATE TABLE promo_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discount_applied DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(booking_id)
);
CREATE INDEX idx_promo_usage_promotion ON promo_usage(promotion_id);

-- ============================================================
-- 30. API KEYS (For external integrations)
-- ============================================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    scopes TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_destinations_updated_at BEFORE UPDATE ON destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_operators_updated_at BEFORE UPDATE ON operators FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_boats_updated_at BEFORE UPDATE ON boats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- BOOKING_REF GENERATOR (Optional helper)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_booking_ref(p_dest_slug VARCHAR DEFAULT 'GEN')
RETURNS VARCHAR AS $$
DECLARE
    v_code VARCHAR(3);
    v_ref VARCHAR(20);
    v_exists BOOLEAN;
BEGIN
    v_code := UPPER(REGEXP_REPLACE(COALESCE(p_dest_slug,'GEN'), '[^a-z]', '', 'gi'));
    v_code := SUBSTRING(v_code FROM 1 FOR 3);
    IF LENGTH(v_code) < 3 THEN v_code := RPAD(v_code, 3, 'X'); END IF;
    LOOP
        v_ref := 'BH-' || v_code || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_ref = v_ref) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;
    RETURN v_ref;
END;
$$ LANGUAGE plpgsql;
