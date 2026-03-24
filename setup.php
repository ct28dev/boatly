<?php
/**
 * BOATLY - Database Setup & Seed Script
 * Thailand boat tour platform (Ayutthaya first market)
 */

$action = $_GET['action'] ?? null;
$messages = [];
$success_count = 0;
$error_count = 0;

function msg(string $text, string $type = 'success'): void {
    global $messages, $success_count, $error_count;
    $messages[] = ['text' => $text, 'type' => $type];
    if ($type === 'success') $success_count++;
    if ($type === 'error') $error_count++;
}

if ($action === 'setup' || $action === 'reset' || $action === 'migrate') {
    try {
        // ─── CONNECTION ──────────────────────────────────────────
        $pdo = new PDO('mysql:host=localhost;charset=utf8mb4', 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        if ($action === 'reset') {
            $pdo->exec("DROP DATABASE IF EXISTS boatly");
            msg("Database 'boatly' dropped", 'info');
        }

        // ─── CREATE DATABASE ─────────────────────────────────────
        $pdo->exec("CREATE DATABASE IF NOT EXISTS boatly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE boatly");
        msg("Database 'boatly' ready");

        // ─── CREATE TABLES ───────────────────────────────────────

        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            phone VARCHAR(20),
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('customer','operator','admin') DEFAULT 'customer',
            language VARCHAR(5) DEFAULT 'th',
            profile_image TEXT,
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'users' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS operators (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            company_name VARCHAR(200) NOT NULL,
            description TEXT,
            logo TEXT,
            tax_id VARCHAR(20),
            bank_account VARCHAR(50),
            contact_phone VARCHAR(20),
            status ENUM('pending','approved','suspended') DEFAULT 'pending',
            doc_boat_license VARCHAR(500) NULL,
            doc_boat_permit VARCHAR(500) NULL,
            doc_insurance VARCHAR(500) NULL,
            doc_other TEXT NULL,
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'operators' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS destinations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            name_th VARCHAR(100),
            slug VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            description_th TEXT,
            hero_image TEXT,
            country VARCHAR(50) DEFAULT 'Thailand',
            province VARCHAR(100),
            status ENUM('active','coming_soon','inactive') DEFAULT 'coming_soon',
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            sort_order INT DEFAULT 0,
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'destinations' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS boats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            operator_id INT NOT NULL,
            destination_id INT NOT NULL,
            name VARCHAR(200) NOT NULL,
            slug VARCHAR(200) NOT NULL UNIQUE,
            boat_type ENUM('longtail','speedboat','yacht','catamaran','ferry','cruise','houseboat') DEFAULT 'longtail',
            capacity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            duration INT NOT NULL,
            description TEXT,
            description_th TEXT,
            route TEXT,
            route_th TEXT,
            highlights TEXT,
            river VARCHAR(100),
            status ENUM('active','inactive','maintenance') DEFAULT 'active',
            featured BOOLEAN DEFAULT 0,
            doc_boat_permit VARCHAR(500) NULL,
            doc_insurance VARCHAR(500) NULL,
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
            FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE,
            FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'boats' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS boat_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            boat_id INT NOT NULL,
            image_url TEXT NOT NULL,
            alt_text VARCHAR(200),
            is_primary BOOLEAN DEFAULT 0,
            sort_order INT DEFAULT 0,
            FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'boat_images' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS availability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            boat_id INT NOT NULL,
            date DATE NOT NULL,
            time_slot VARCHAR(10) NOT NULL,
            max_seats INT NOT NULL,
            booked_seats INT DEFAULT 0,
            is_available BOOLEAN DEFAULT 1,
            price_override DECIMAL(10,2) NULL,
            FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'availability' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_ref VARCHAR(20) NOT NULL UNIQUE,
            user_id INT NOT NULL,
            boat_id INT NOT NULL,
            destination_id INT NOT NULL,
            booking_date DATE NOT NULL,
            time_slot VARCHAR(10) NOT NULL,
            passengers INT NOT NULL,
            customer_name VARCHAR(100),
            customer_email VARCHAR(150),
            customer_phone VARCHAR(20),
            special_request TEXT,
            total_amount DECIMAL(10,2) NOT NULL,
            status ENUM('pending','confirmed','completed','cancelled','no_show') DEFAULT 'pending',
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE,
            FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'bookings' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            method ENUM('promptpay','credit_card','bank_transfer','cash') DEFAULT 'promptpay',
            amount DECIMAL(10,2) NOT NULL,
            status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
            transaction_ref VARCHAR(100),
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'payments' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            user_id INT NOT NULL,
            boat_id INT NOT NULL,
            destination_id INT NOT NULL,
            rating INT NOT NULL,
            comment TEXT,
            status ENUM('pending','approved','rejected') DEFAULT 'pending',
            created_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE,
            FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'reviews' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS favorites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            boat_id INT NOT NULL,
            created_at DATETIME DEFAULT NOW(),
            UNIQUE KEY unique_favorite (user_id, boat_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'favorites' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            body TEXT,
            type VARCHAR(50),
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'notifications' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS promotions (
            id INT AUTO_INCREMENT PRIMARY KEY,
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
            link_type ENUM('boat','destination','url','none') DEFAULT 'none',
            link_value VARCHAR(500),
            gradient_colors VARCHAR(200) DEFAULT 'linear-gradient(135deg,#023e8a,#00b4d8)',
            icon VARCHAR(50) DEFAULT 'fa-tag',
            discount_type ENUM('percentage','fixed') DEFAULT 'percentage',
            discount_value DECIMAL(10,2) DEFAULT 0,
            code VARCHAR(50),
            start_date DATE,
            end_date DATE,
            is_active BOOLEAN DEFAULT 1,
            sort_order INT DEFAULT 0,
            created_at DATETIME DEFAULT NOW(),
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'promotions' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS addons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            boat_id INT NOT NULL,
            name_th VARCHAR(200),
            name_en VARCHAR(200),
            name_zh VARCHAR(200),
            name_ko VARCHAR(200),
            name_fr VARCHAR(200),
            description_th TEXT,
            description_en TEXT,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            icon VARCHAR(50) DEFAULT 'fa-plus-circle',
            is_active BOOLEAN DEFAULT 1,
            sort_order INT DEFAULT 0,
            created_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'addons' created");

        $pdo->exec("CREATE TABLE IF NOT EXISTS review_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            review_id INT NOT NULL,
            image_url TEXT NOT NULL,
            sort_order INT DEFAULT 0,
            created_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        msg("Table 'review_images' created");

        // ─── ALTER EXISTING TABLES (multilingual + coordinates) ──

        $alterColumns = [
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS name_en VARCHAR(200) AFTER name",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS name_zh VARCHAR(200) AFTER name_en",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS name_ko VARCHAR(200) AFTER name_zh",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS name_fr VARCHAR(200) AFTER name_ko",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS description_zh TEXT AFTER description_th",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS description_ko TEXT AFTER description_zh",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS description_fr TEXT AFTER description_ko",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS route_zh TEXT AFTER route_th",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS route_ko TEXT AFTER route_zh",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS route_fr TEXT AFTER route_ko",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) AFTER featured",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) AFTER latitude",

            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS name_en VARCHAR(100) AFTER name_th",
            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS name_zh VARCHAR(100) AFTER name_en",
            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS name_ko VARCHAR(100) AFTER name_zh",
            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100) AFTER name_ko",
            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description_en TEXT AFTER description_th",
            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description_zh TEXT AFTER description_en",
            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description_ko TEXT AFTER description_zh",
            "ALTER TABLE destinations ADD COLUMN IF NOT EXISTS description_fr TEXT AFTER description_ko",

            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_addons TEXT AFTER special_request",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(500) NULL AFTER special_request",
            "ALTER TABLE itinerary_plans ADD COLUMN IF NOT EXISTS trip_date_start DATE NULL AFTER description",
            "ALTER TABLE itinerary_plans ADD COLUMN IF NOT EXISTS trip_date_end DATE NULL AFTER trip_date_start",
            "ALTER TABLE itinerary_plans ADD COLUMN IF NOT EXISTS location VARCHAR(200) NULL AFTER trip_date_end",

            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS doc_boat_permit VARCHAR(500) NULL",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS doc_insurance VARCHAR(500) NULL",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS pier_name VARCHAR(200) AFTER longitude",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS pier_name_th VARCHAR(200) AFTER pier_name",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS pier_latitude DECIMAL(10,8) AFTER pier_name_th",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS pier_longitude DECIMAL(11,8) AFTER pier_latitude",
            "ALTER TABLE boats ADD COLUMN IF NOT EXISTS default_time_slots TEXT AFTER pier_longitude",

            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) AFTER profile_image",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS line_id VARCHAR(100) AFTER google_id",
        ];

        foreach ($alterColumns as $sql) {
            try {
                $pdo->exec($sql);
            } catch (PDOException $e) {
                // Column may already exist — ignore duplicate column errors
            }
        }
        msg("Multilingual columns + coordinates + pier info added");

        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value LONGTEXT,
            updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $pdo->exec("ALTER TABLE settings MODIFY COLUMN setting_value LONGTEXT");
        msg("Table 'settings' created");

        if ($action === 'migrate') {
            msg("Migration complete — ข้อมูลเดิมยังอยู่ครบ (ไม่มีการลบข้อมูล)", 'info');
        } else {
            // ─── TRUNCATE ALL TABLES (เฉพาะ setup/reset เท่านั้น) ─────
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
            $tables = ['review_images','addons','promotions','notifications','favorites','reviews','payments','bookings','availability','boat_images','boats','destinations','operators','users'];
            foreach ($tables as $t) {
                try { $pdo->exec("TRUNCATE TABLE {$t}"); } catch (PDOException $e) {}
            }
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
            msg("All tables truncated for fresh seed");
        }

        if ($action === 'migrate') {
            msg("เสร็จสิ้น — ใช้ migrate เมื่อต้องการอัปเดตโครงสร้างโดยไม่ลบข้อมูล");
        } else {
        // ─── SEED: USERS (prepared statements) ──────────────────
        $stmtUser = $pdo->prepare("INSERT INTO users (name, email, phone, password_hash, role, language) VALUES (?, ?, ?, ?, ?, ?)");

        $users = [
            ['BOATLY Admin',               'admin@boatly.com',           '0800000001', 'admin123',    'admin',    'en'],
            ['สมศักดิ์ เรือไทย',                 'somsak@ayutthaya-boats.com',  '0812345678', 'password123', 'operator', 'th'],
            ['วิไล แม่น้ำเจ้าพระยา',              'wilai@chaophraya-tours.com',  '0823456789', 'password123', 'operator', 'th'],
            ['สมชาย ใจดี',                      'somchai@email.com',           '0834567890', 'password123', 'customer', 'th'],
            ['นภา สวยงาม',                      'napa@email.com',              '0845678901', 'password123', 'customer', 'th'],
            ['John Smith',                    'john@email.com',              '0856789012', 'password123', 'customer', 'en'],
        ];

        foreach ($users as $u) {
            $stmtUser->execute([$u[0], $u[1], $u[2], password_hash($u[3], PASSWORD_DEFAULT), $u[4], $u[5]]);
        }
        msg("Seeded 6 users (prepared statements)");

        // ─── SEED: OPERATORS ─────────────────────────────────────
        $stmtOp = $pdo->prepare("INSERT INTO operators (user_id, company_name, description, contact_phone, status) VALUES (?, ?, ?, ?, ?)");
        $stmtOp->execute([2, 'Ayutthaya Heritage Boats', 'เรือมรดกอยุธยา ล่องแม่น้ำชมโบราณสถาน ประสบการณ์กว่า 15 ปี', '0812345678', 'approved']);
        $stmtOp->execute([3, 'Chao Phraya River Tours', 'ล่องเจ้าพระยา ชมวัดและวิถีชีวิตริมน้ำ', '0823456789', 'approved']);
        msg("Seeded 2 operators");

        // ─── SEED: DESTINATIONS ──────────────────────────────────
        $stmtDest = $pdo->prepare("INSERT INTO destinations (name, name_th, slug, description, description_th, country, province, status, latitude, longitude, sort_order) VALUES (?, ?, ?, ?, ?, 'Thailand', ?, ?, ?, ?, ?)");

        $destinations = [
            ['Ayutthaya', 'พระนครศรีอยุธยา', 'ayutthaya',
             'Explore the ancient capital of Siam by boat. Cruise along the Chao Phraya and Pa Sak rivers, visiting stunning temples and historical sites dating back to 1350.',
             'ล่องเรือชมอดีตราชธานีแห่งสยาม สัมผัสมรดกโลกริมแม่น้ำเจ้าพระยาและป่าสัก ชมโบราณสถานอันงดงามย้อนไปถึง พ.ศ. 1893',
             'Phra Nakhon Si Ayutthaya', 'active', 14.3532, 100.5685, 1],
            ['Bangkok', 'กรุงเทพมหานคร', 'bangkok',
             'River cruises through the heart of Thailand\'s capital.',
             'ล่องเรือผ่านใจกลางเมืองหลวง',
             'Bangkok', 'coming_soon', 13.7563, 100.5018, 2],
            ['Phuket', 'ภูเก็ต', 'phuket',
             'Island hopping and marine adventures in the Andaman Sea.',
             'เที่ยวเกาะและผจญภัยทางทะเลอันดามัน',
             'Phuket', 'coming_soon', 7.8804, 98.3923, 3],
            ['Krabi', 'กระบี่', 'krabi',
             'Limestone cliffs and emerald waters.',
             'หน้าผาหินปูนและน้ำทะเลสีมรกต',
             'Krabi', 'coming_soon', 8.0863, 98.9063, 4],
            ['Pattaya', 'พัทยา', 'pattaya',
             'Coastal cruises and island tours.',
             'ล่องเรือชายฝั่งและเที่ยวเกาะ',
             'Chon Buri', 'coming_soon', 12.9236, 100.8825, 5],
        ];

        foreach ($destinations as $d) {
            $stmtDest->execute($d);
        }
        msg("Seeded 5 destinations");

        // ─── SEED: BOATS ─────────────────────────────────────────
        $stmtBoat = $pdo->prepare("INSERT INTO boats (operator_id, destination_id, name, slug, boat_type, capacity, price, duration, description, description_th, route, route_th, highlights, river, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $boats = [
            [1, 1, 'Ayutthaya Sunset Longtail', 'ayutthaya-sunset-longtail', 'longtail', 8, 1500.00, 120,
             'Experience the magic of Ayutthaya at golden hour aboard a traditional longtail boat. Cruise past illuminated temples as the sun sets over the ancient capital.',
             'สัมผัสความมหัศจรรย์ของอยุธยายามเย็น บนเรือหางยาวดั้งเดิม ล่องชมวัดที่ส่องสว่างยามพระอาทิตย์ตกเหนือราชธานีเก่า',
             'Wat Phanan Choeng → Wat Chaiwatthanaram → Chao Phraya River sunset viewpoint',
             'วัดพนัญเชิง → วัดไชยวัฒนาราม → จุดชมวิวพระอาทิตย์ตกแม่น้ำเจ้าพระยา',
             '["Temple viewing","Sunset photography","Traditional snacks","Life jacket provided"]',
             'Chao Phraya River', 1],
            [1, 1, 'Grand Temple River Cruise', 'grand-temple-river-cruise', 'cruise', 30, 2500.00, 180,
             'Comprehensive temple cruise covering all major UNESCO World Heritage sites. Includes lunch, guide, and temple entry fees.',
             'ล่องเรือชมวัดครบทุกจุดมรดกโลก UNESCO พร้อมอาหารกลางวัน ไกด์ และค่าเข้าชมวัด',
             'Wat Mahathat → Wat Ratchaburana → Wat Phra Si Sanphet → Wat Chaiwatthanaram → Wat Phutthaisawan',
             'วัดมหาธาตุ → วัดราชบูรณะ → วัดพระศรีสรรเพชญ์ → วัดไชยวัฒนาราม → วัดพุทไธศวรรย์',
             '["UNESCO sites","Lunch included","Professional guide","Temple entry fees"]',
             'Chao Phraya & Pa Sak Rivers', 1],
            [2, 1, 'Evening Dinner Cruise Ayutthaya', 'evening-dinner-cruise-ayutthaya', 'cruise', 20, 3500.00, 150,
             'Fine dining on the water with stunning views of illuminated ancient temples. Thai set dinner, live traditional music.',
             'รับประทานอาหารบนเรือ ชมวิวโบราณสถานยามค่ำคืน พร้อมเซ็ตดินเนอร์ไทยและดนตรีไทยสด',
             'Riverside departure → Wat Chaiwatthanaram night view → Floating restaurant stop → Return',
             'ท่าเรือริมน้ำ → ชมวัดไชยวัฒนารามยามค่ำ → จอดร้านอาหารลอยน้ำ → กลับท่า',
             '["Thai dinner set","Live music","Night temple view","Drinks included"]',
             'Chao Phraya River', 1],
            [1, 1, 'Private Longtail Temple Hop', 'private-longtail-temple-hop', 'longtail', 6, 2000.00, 90,
             'Private longtail boat for your group. Customize your route through Ayutthaya\'s waterways and temples.',
             'เรือหางยาวส่วนตัวสำหรับกลุ่มของคุณ เลือกเส้นทางเองผ่านลำน้ำและวัดในอยุธยา',
             'Customizable route - choose from 5 temples and 3 viewpoints',
             'เลือกเส้นทางได้เอง - เลือกจาก 5 วัด และ 3 จุดชมวิว',
             '["Private boat","Custom route","Flexible timing","Up to 6 pax"]',
             'Pa Sak River', 0],
            [2, 1, 'Ayutthaya Canal Explorer', 'ayutthaya-canal-explorer', 'longtail', 10, 1200.00, 90,
             'Discover hidden Ayutthaya through its ancient canal network. Visit local communities and lesser-known temples.',
             'ค้นพบอยุธยาที่ซ่อนอยู่ผ่านคลองโบราณ เยี่ยมชมชุมชนท้องถิ่นและวัดที่ไม่ค่อยมีนักท่องเที่ยว',
             'City Canal → Local community → Wat Na Phra Men → Local market',
             'คลองเมือง → ชุมชนท้องถิ่น → วัดหน้าพระเมรุ → ตลาดท้องถิ่น',
             '["Hidden gems","Local life","Off beaten path","Canal network"]',
             'Khlong Muang (City Canal)', 0],
            [2, 1, 'Romantic River Cruise for Two', 'romantic-river-cruise-two', 'longtail', 2, 4500.00, 120,
             'Intimate cruise for couples with champagne, appetizers, and breathtaking sunset views.',
             'ล่องเรือส่วนตัวสำหรับคู่รัก พร้อมแชมเปญ ขนม และวิวพระอาทิตย์ตก',
             'Private pier → Romantic river route → Sunset viewpoint → Champagne stop → Return',
             'ท่าเรือส่วนตัว → เส้นทางโรแมนติก → จุดชมพระอาทิตย์ตก → จอดจิบแชมเปญ → กลับ',
             '["Couples only","Champagne","Sunset view","Private boat"]',
             'Chao Phraya River', 0],
        ];

        foreach ($boats as $b) {
            $stmtBoat->execute($b);
        }
        msg("Seeded 6 boats");

        $pierData = [
            [1, 'Wat Phanan Choeng Pier', 'ท่าเรือวัดพนัญเชิง', 14.3445, 100.5883, '["09:00","16:00"]'],
            [2, 'Ayutthaya Historical Pier', 'ท่าเรืออยุธยาประวัติศาสตร์', 14.3530, 100.5775, '["09:00","13:00"]'],
            [3, 'Chao Phraya Riverside Pier', 'ท่าเรือริมแม่น้ำเจ้าพระยา', 14.3488, 100.5690, '["18:00"]'],
            [4, 'Pa Sak River Pier', 'ท่าเรือแม่น้ำป่าสัก', 14.3560, 100.5830, '["09:00","13:00","16:00"]'],
            [5, 'Khlong Muang Gate Pier', 'ท่าเรือประตูคลองเมือง', 14.3510, 100.5740, '["09:00","13:00","16:00"]'],
            [6, 'Sunset Private Pier', 'ท่าเรือส่วนตัว Sunset', 14.3470, 100.5810, '["16:00","17:00"]'],
        ];
        $stmtPier = $pdo->prepare("UPDATE boats SET pier_name=?, pier_name_th=?, pier_latitude=?, pier_longitude=?, default_time_slots=? WHERE id=?");
        foreach ($pierData as $p) {
            $stmtPier->execute([$p[1], $p[2], $p[3], $p[4], $p[5], $p[0]]);
        }
        msg("Updated 6 boats with pier info + default time slots");

        // ─── SEED: SETTINGS ──────────────────────────────────────
        $pdo->exec("DELETE FROM settings");
        $settingsFile = __DIR__ . '/uploads/settings/payment_settings.json';
        $paymentMethods = [
            'qr' => ['enabled' => true, 'label_th' => 'QR Payment / PromptPay', 'label_en' => 'QR Payment / PromptPay', 'promptpay_id' => '0123456789'],
            'cod' => ['enabled' => false, 'label_th' => 'จ่ายที่ท่าเรือ', 'label_en' => 'Pay at Pier'],
            'card' => ['enabled' => false, 'label_th' => 'บัตรเครดิต/เดบิต', 'label_en' => 'Credit/Debit Card'],
        ];
        if (file_exists($settingsFile)) {
            $raw = @file_get_contents($settingsFile);
            if ($raw && ($loaded = json_decode($raw, true)) && is_array($loaded)) {
                $paymentMethods = $loaded;
                msg("Restored payment settings from file (persisted across reset)");
            }
        }
        $stmtSetting = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $stmtSetting->execute(['payment_methods', json_encode($paymentMethods, JSON_UNESCAPED_UNICODE)]);
        msg("Seeded payment settings");

        // ─── SEED: BOAT IMAGES ───────────────────────────────────
        $stmtImg = $pdo->prepare("INSERT INTO boat_images (boat_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)");

        $boatImages = [
            [1, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', 'Ayutthaya Sunset Longtail - main', 1, 0],
            [1, 'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e5?w=800', 'Ayutthaya Sunset Longtail - temple view', 0, 1],
            [1, 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800', 'Ayutthaya Sunset Longtail - river', 0, 2],
            [2, 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800', 'Grand Temple River Cruise - main', 1, 0],
            [2, 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', 'Grand Temple River Cruise - temples', 0, 1],
            [2, 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800', 'Grand Temple River Cruise - cruise', 0, 2],
            [3, 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800', 'Evening Dinner Cruise - main', 1, 0],
            [3, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800', 'Evening Dinner Cruise - river night', 0, 1],
            [3, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'Evening Dinner Cruise - dining', 0, 2],
            [4, 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800', 'Private Longtail Temple Hop - main', 1, 0],
            [4, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Private Longtail Temple Hop - boat', 0, 1],
            [5, 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=800', 'Ayutthaya Canal Explorer - main', 1, 0],
            [5, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', 'Ayutthaya Canal Explorer - canal', 0, 1],
            [6, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Romantic River Cruise - main', 1, 0],
            [6, 'https://images.unsplash.com/photo-1502680390548-bdbac40551ce?w=800', 'Romantic River Cruise - sunset', 0, 1],
        ];

        foreach ($boatImages as $img) {
            $stmtImg->execute($img);
        }
        msg("Seeded " . count($boatImages) . " boat images");

        // ─── SEED: AVAILABILITY (next 14 days, from operator-defined slots) ──
        $stmtAvail = $pdo->prepare("INSERT INTO availability (boat_id, date, time_slot, max_seats, booked_seats, is_available) VALUES (?, ?, ?, ?, ?, 1)");

        $boatSlots = [
            1 => ['09:00', '16:00'],
            2 => ['09:00', '13:00'],
            3 => ['18:00'],
            4 => ['09:00', '13:00', '16:00'],
            5 => ['09:00', '13:00', '16:00'],
            6 => ['16:00', '17:00'],
        ];
        $boatCaps = [1 => 8, 2 => 30, 3 => 20, 4 => 6, 5 => 10, 6 => 2];

        $availCount = 0;
        for ($day = 0; $day < 14; $day++) {
            $date = date('Y-m-d', strtotime("+{$day} days"));
            foreach ($boatSlots as $boatId => $slots) {
                foreach ($slots as $slot) {
                    $booked = rand(0, 3);
                    $cap = $boatCaps[$boatId];
                    if ($booked > $cap) $booked = $cap;
                    $stmtAvail->execute([$boatId, $date, $slot, $cap, $booked]);
                    $availCount++;
                }
            }
        }
        msg("Seeded {$availCount} availability slots (14 days)");

        // ─── SEED: BOOKINGS ──────────────────────────────────────
        $stmtBooking = $pdo->prepare("INSERT INTO bookings (booking_ref, user_id, boat_id, destination_id, booking_date, time_slot, passengers, customer_name, customer_email, customer_phone, special_request, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $today = date('Y-m-d');
        $bookings = [
            ['BH-AYT-000001', 4, 1, 1, date('Y-m-d', strtotime('+2 days')), '16:00', 2, 'สมชาย ใจดี', 'somchai@email.com', '0834567890', 'ต้องการที่นั่งหน้าเรือ', 3000.00, 'confirmed'],
            ['BH-AYT-000002', 5, 2, 1, date('Y-m-d', strtotime('+3 days')), '09:00', 4, 'นภา สวยงาม', 'napa@email.com', '0845678901', null, 10000.00, 'confirmed'],
            ['BH-AYT-000003', 6, 3, 1, date('Y-m-d', strtotime('+5 days')), '18:00', 2, 'John Smith', 'john@email.com', '0856789012', 'Window seat please', 7000.00, 'pending'],
            ['BH-AYT-000004', 4, 6, 1, date('Y-m-d', strtotime('+7 days')), '16:00', 2, 'สมชาย ใจดี', 'somchai@email.com', '0834567890', 'ฉลองครบรอบแต่งงาน', 4500.00, 'confirmed'],
            ['BH-AYT-000005', 5, 5, 1, date('Y-m-d', strtotime('-5 days')), '09:00', 3, 'นภา สวยงาม', 'napa@email.com', '0845678901', null, 3600.00, 'completed'],
            ['BH-AYT-000006', 6, 1, 1, date('Y-m-d', strtotime('-3 days')), '09:00', 2, 'John Smith', 'john@email.com', '0856789012', null, 3000.00, 'completed'],
            ['BH-AYT-000007', 4, 2, 1, date('Y-m-d', strtotime('-7 days')), '13:00', 5, 'สมชาย ใจดี', 'somchai@email.com', '0834567890', 'มีเด็ก 2 คน', 12500.00, 'completed'],
            ['BH-AYT-000008', 5, 4, 1, date('Y-m-d', strtotime('+1 day')), '09:00', 3, 'นภา สวยงาม', 'napa@email.com', '0845678901', null, 6000.00, 'cancelled'],
        ];

        foreach ($bookings as $b) {
            $stmtBooking->execute($b);
        }
        msg("Seeded 8 bookings");

        // ─── SEED: PAYMENTS ──────────────────────────────────────
        $stmtPay = $pdo->prepare("INSERT INTO payments (booking_id, method, amount, status, transaction_ref) VALUES (?, ?, ?, ?, ?)");

        $payments = [
            [1, 'promptpay', 3000.00,  'paid',     'TXN-PP-20260301-001'],
            [2, 'credit_card', 10000.00, 'paid',   'TXN-CC-20260302-002'],
            [3, 'promptpay', 7000.00,  'pending',  null],
            [4, 'bank_transfer', 4500.00, 'paid',  'TXN-BT-20260304-004'],
            [5, 'promptpay', 3600.00,  'paid',     'TXN-PP-20260225-005'],
            [6, 'credit_card', 3000.00, 'paid',    'TXN-CC-20260227-006'],
            [7, 'promptpay', 12500.00, 'paid',     'TXN-PP-20260223-007'],
            [8, 'promptpay', 6000.00,  'refunded', 'TXN-PP-20260308-008'],
        ];

        foreach ($payments as $p) {
            $stmtPay->execute($p);
        }
        msg("Seeded 8 payments");

        // ─── SEED: REVIEWS ───────────────────────────────────────
        $stmtReview = $pdo->prepare("INSERT INTO reviews (booking_id, user_id, boat_id, destination_id, rating, comment, status) VALUES (?, ?, ?, ?, ?, ?, 'approved')");

        $reviews = [
            [5, 5, 5, 1, 5, 'ล่องคลองเมืองอยุธยาสนุกมาก ได้เห็นวิถีชีวิตชาวบ้านริมคลอง คนขับเรือน่ารัก ให้ความรู้ดีมาก แนะนำเลยค่ะ'],
            [6, 6, 1, 1, 5, 'Amazing sunset trip! The temples look magical when lit up against the evening sky. Our boat captain was very knowledgeable. Highly recommend!'],
            [7, 4, 2, 1, 5, 'ล่องเรือชมวัดครบทุกจุด อาหารกลางวันอร่อย ไกด์อธิบายประวัติศาสตร์ละเอียดมาก คุ้มค่ามากครับ ไม่ต้องเดินเหนื่อย'],
            [5, 5, 5, 1, 4, 'เส้นทางสวยมาก ได้ไปวัดที่ไม่ค่อยมีนักท่องเที่ยว บรรยากาศดี แต่อยากให้มีน้ำดื่มบริการด้วยค่ะ'],
            [6, 6, 1, 1, 4, 'Beautiful boat ride through Ayutthaya. The longtail boat was charming and authentic. Temples were breathtaking. Would love a slightly longer trip next time.'],
            [7, 4, 2, 1, 5, 'พาครอบครัวไปล่องเรือ ลูกๆ สนุกมาก เรือใหญ่นั่งสบาย อาหารอร่อย ได้ถ่ายรูปสวยๆ เยอะมาก จะมาอีกแน่นอนครับ'],
            [5, 5, 5, 1, 5, 'ประทับใจมากค่ะ คลองเมืองสวยงาม ได้แวะตลาดท้องถิ่น ซื้อขนมอร่อย บรรยากาศเหมือนย้อนเวลากลับไปสมัยก่อน'],
            [6, 6, 1, 1, 5, 'Perfect way to see Ayutthaya! So much better than driving between temples. The river breeze keeps you cool and the views are incredible. 10/10!'],
        ];

        foreach ($reviews as $r) {
            $stmtReview->execute($r);
        }
        msg("Seeded 8 reviews");

        // ─── SEED: FAVORITES ─────────────────────────────────────
        $stmtFav = $pdo->prepare("INSERT INTO favorites (user_id, boat_id) VALUES (?, ?)");
        $favs = [[4,1],[4,3],[5,2],[5,6],[6,1],[6,3]];
        foreach ($favs as $f) {
            $stmtFav->execute($f);
        }
        msg("Seeded 6 favorites");

        // ─── SEED: NOTIFICATIONS ─────────────────────────────────
        $stmtNotif = $pdo->prepare("INSERT INTO notifications (user_id, title, body, type, is_read) VALUES (?, ?, ?, ?, ?)");

        $notifications = [
            [1, 'ยินดีต้อนรับสู่ BOATLY', 'ระบบพร้อมใช้งานแล้ว คุณสามารถจัดการเรือและการจองได้จากแดชบอร์ด', 'system', 1],
            [2, 'บัญชีผู้ให้บริการอนุมัติแล้ว', 'บัญชี Ayutthaya Heritage Boats ของคุณได้รับการอนุมัติแล้ว เริ่มเพิ่มเรือได้เลย', 'approval', 1],
            [3, 'บัญชีผู้ให้บริการอนุมัติแล้ว', 'บัญชี Chao Phraya River Tours ของคุณได้รับการอนุมัติแล้ว เริ่มเพิ่มเรือได้เลย', 'approval', 1],
            [4, 'การจองยืนยันแล้ว', 'การจอง BH-AYT-000001 ของคุณได้รับการยืนยันแล้ว ขอให้สนุกกับทริป!', 'booking', 1],
            [4, 'การจองยืนยันแล้ว', 'การจอง BH-AYT-000004 ของคุณได้รับการยืนยันแล้ว', 'booking', 0],
            [5, 'การจองยืนยันแล้ว', 'การจอง BH-AYT-000002 ของคุณได้รับการยืนยันแล้ว', 'booking', 1],
            [5, 'ขอบคุณสำหรับรีวิว', 'ขอบคุณที่รีวิว Ayutthaya Canal Explorer ของคุณ!', 'review', 0],
            [6, 'Booking Pending', 'Your booking BH-AYT-000003 is pending payment. Please complete payment within 24 hours.', 'booking', 0],
            [6, 'Thank you for your review!', 'Thanks for reviewing Ayutthaya Sunset Longtail!', 'review', 0],
            [2, 'มีการจองใหม่', 'มีลูกค้าจอง Ayutthaya Sunset Longtail สำหรับวันที่ ' . date('d/m/Y', strtotime('+2 days')), 'booking', 0],
            [2, 'มีการจองใหม่', 'มีลูกค้าจอง Grand Temple River Cruise สำหรับวันที่ ' . date('d/m/Y', strtotime('+3 days')), 'booking', 0],
            [3, 'มีการจองใหม่', 'มีลูกค้าจอง Evening Dinner Cruise สำหรับวันที่ ' . date('d/m/Y', strtotime('+5 days')), 'booking', 0],
        ];

        foreach ($notifications as $n) {
            $stmtNotif->execute($n);
        }
        msg("Seeded " . count($notifications) . " notifications");

        // ─── SEED: PROMOTIONS ─────────────────────────────────────
        $stmtPromo = $pdo->prepare("INSERT INTO promotions (title_th, title_en, title_zh, title_ko, title_fr, description_th, description_en, description_zh, description_ko, description_fr, link_type, link_value, gradient_colors, icon, discount_type, discount_value, code, start_date, end_date, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)");

        $promoStart = date('Y-m-d');
        $promoEnd = date('Y-m-d', strtotime('+30 days'));

        $promotions = [
            [
                'ส่วนลด 20% ล่องเรืออยุธยา', '20% Off Ayutthaya Cruise', '大城游船八折优惠', '아유타야 크루즈 20% 할인', '20% de réduction croisière Ayutthaya',
                'รับส่วนลด 20% สำหรับทริปล่องเรือชมโบราณสถานอยุธยา ใช้โค้ด AYUT20 เมื่อจอง',
                'Get 20% off on Ayutthaya heritage boat trips. Use code AYUT20 at checkout.',
                '大城遗产船游享八折优惠，结账时使用代码 AYUT20',
                '아유타야 유산 보트 여행 20% 할인. 결제 시 코드 AYUT20 사용',
                'Obtenez 20% de réduction sur les croisières du patrimoine d\'Ayutthaya. Code AYUT20',
                'destination', 'ayutthaya',
                'linear-gradient(135deg,#023e8a,#00b4d8)', 'fa-ticket',
                'percentage', 20, 'AYUT20', $promoStart, $promoEnd, 1
            ],
            [
                'ล่องเรือชมพระอาทิตย์ตก สุดพิเศษ', 'Sunset Cruise Special', '日落游船特惠', '선셋 크루즈 스페셜', 'Spécial croisière au coucher du soleil',
                'สัมผัสความโรแมนติกของล่องเรือชมพระอาทิตย์ตก พร้อมเครื่องดื่มฟรี',
                'Experience a romantic sunset cruise with complimentary drinks.',
                '体验浪漫的日落游船之旅，附赠免费饮品',
                '무료 음료와 함께 로맨틱한 선셋 크루즈를 즐기세요',
                'Vivez une croisière romantique au coucher du soleil avec boissons offertes.',
                'boat', '1',
                'linear-gradient(135deg,#f97316,#fbbf24)', 'fa-sun',
                'percentage', 0, null, $promoStart, $promoEnd, 2
            ],
            [
                'แพ็กเกจครอบครัว', 'Family Package', '家庭套餐', '가족 패키지', 'Forfait familial',
                'แพ็กเกจพิเศษสำหรับครอบครัว เด็กต่ำกว่า 12 ปี ฟรี 1 คน',
                'Special family deal — 1 free child (under 12) per booking.',
                '家庭特惠——每次预订可免费携带1名12岁以下儿童',
                '가족 특별 할인 — 예약당 12세 미만 어린이 1명 무료',
                'Offre spéciale famille — 1 enfant gratuit (moins de 12 ans) par réservation.',
                'none', null,
                'linear-gradient(135deg,#10b981,#2dd4bf)', 'fa-gift',
                'fixed', 0, null, $promoStart, $promoEnd, 3
            ],
        ];

        foreach ($promotions as $p) {
            $stmtPromo->execute($p);
        }
        msg("Seeded 3 promotions");

        // ─── SEED: ADD-ONS (per boat) ────────────────────────────
        $stmtAddon = $pdo->prepare("INSERT INTO addons (boat_id, name_th, name_en, name_zh, name_ko, name_fr, description_th, description_en, price, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $addonTemplates = [
            ['อาหารกลางวัน', 'Lunch Set', '午餐套餐', '점심 세트', 'Déjeuner', 'เซ็ตอาหารกลางวันไทยต้นตำรับ', 'Authentic Thai lunch set', 350.00, 'fa-utensils', 1],
            ['เครื่องดื่มพรีเมียม', 'Premium Drinks', '高级饮品', '프리미엄 음료', 'Boissons premium', 'เครื่องดื่มพรีเมียมไม่จำกัด', 'Unlimited premium beverages', 150.00, 'fa-champagne-glasses', 2],
            ['ชุดดำน้ำ', 'Snorkeling Gear', '浮潜装备', '스노클링 장비', 'Équipement de plongée', 'ชุดดำน้ำตื้นพร้อมอุปกรณ์ครบ', 'Full snorkeling equipment set', 200.00, 'fa-mask-snorkel', 3],
            ['ช่างภาพ', 'Photographer', '摄影师', '사진작가', 'Photographe', 'ช่างภาพมืออาชีพถ่ายรูปตลอดทริป', 'Professional photographer for the trip', 500.00, 'fa-camera', 4],
            ['หมวกกันแดด', 'Sun Hat', '遮阳帽', '썬햇', 'Chapeau de soleil', 'หมวกกันแดดสไตล์ทะเล', 'Stylish sun protection hat', 100.00, 'fa-hat-cowboy-side', 5],
        ];

        $boatCount = 6;
        for ($boatId = 1; $boatId <= $boatCount; $boatId++) {
            foreach ($addonTemplates as $a) {
                $stmtAddon->execute([$boatId, $a[0], $a[1], $a[2], $a[3], $a[4], $a[5], $a[6], $a[7], $a[8], $a[9]]);
            }
        }
        msg("Seeded " . ($boatCount * count($addonTemplates)) . " add-ons (5 per boat × {$boatCount} boats)");

        msg("All done! Database is ready.", 'info');
        } // end else (seed block)
    } catch (PDOException $e) {
        msg("Database error: " . $e->getMessage(), 'error');
    } catch (Exception $e) {
        msg("Error: " . $e->getMessage(), 'error');
    }
}

if ($action === 'add-operator') {
    try {
        $pdo = new PDO('mysql:host=localhost;dbname=boatly;charset=utf8mb4', 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $email = 'somsak@ayutthaya-boats.com';
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            msg("มีผู้ใช้ somsak@ayutthaya-boats.com อยู่แล้ว", 'info');
        } else {
            $pw = password_hash('password123', PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO users (name, email, phone, password_hash, role, language) VALUES (?, ?, ?, ?, ?, ?)")
                ->execute(['สมศักดิ์ เรือไทย', $email, '0812345678', $pw, 'operator', 'th']);
            $user_id = (int)$pdo->lastInsertId();
            $pdo->prepare("INSERT INTO operators (user_id, company_name, description, contact_phone, status) VALUES (?, ?, ?, ?, ?)")
                ->execute([$user_id, 'Ayutthaya Heritage Boats', 'เรือมรดกอยุธยา ล่องแม่น้ำชมโบราณสถาน ประสบการณ์กว่า 15 ปี', '0812345678', 'approved']);
            msg("สร้างผู้ใช้พาร์ทเนอร์ somsak@ayutthaya-boats.com / password123 สำเร็จ");
        }
    } catch (PDOException $e) {
        msg("Database error: " . $e->getMessage(), 'error');
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOATLY - Database Setup</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .ocean-bg {
            position: fixed;
            inset: 0;
            z-index: 0;
            overflow: hidden;
        }

        .wave {
            position: absolute;
            bottom: 0;
            width: 200%;
            height: 200px;
            background: repeating-linear-gradient(
                90deg,
                transparent,
                transparent 40px,
                rgba(56, 189, 248, 0.03) 40px,
                rgba(56, 189, 248, 0.03) 80px
            );
            border-radius: 50% 50% 0 0;
            animation: wave 8s ease-in-out infinite alternate;
        }
        .wave:nth-child(2) {
            height: 180px;
            opacity: 0.5;
            animation-delay: -2s;
            animation-duration: 10s;
        }
        .wave:nth-child(3) {
            height: 160px;
            opacity: 0.3;
            animation-delay: -4s;
            animation-duration: 12s;
        }

        @keyframes wave {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }

        .container {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 720px;
            padding: 2rem 1rem;
        }

        header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -1px;
        }

        .subtitle {
            color: #94a3b8;
            margin-top: 0.25rem;
            font-size: 0.95rem;
        }

        .card {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            backdrop-filter: blur(12px);
        }

        .card h2 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .msg-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .msg-item {
            display: flex;
            align-items: flex-start;
            gap: 0.6rem;
            padding: 0.6rem 0.8rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            line-height: 1.4;
            background: rgba(15, 23, 42, 0.5);
        }

        .msg-icon {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 700;
            margin-top: 1px;
        }

        .msg-success .msg-icon { background: #22c55e; color: #fff; }
        .msg-error .msg-icon   { background: #ef4444; color: #fff; }
        .msg-info .msg-icon    { background: #38bdf8; color: #0f172a; }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 1rem;
            text-align: center;
        }

        .stat {
            padding: 1rem;
            border-radius: 0.75rem;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 800;
        }

        .stat-label {
            font-size: 0.8rem;
            color: #94a3b8;
            margin-top: 0.25rem;
        }

        .stat-success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); }
        .stat-success .stat-value { color: #4ade80; }

        .stat-error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }
        .stat-error .stat-value { color: #f87171; }

        .stat-info { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); }
        .stat-info .stat-value { color: #38bdf8; }

        .actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-size: 0.95rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: transform 0.15s, box-shadow 0.15s;
            flex: 1;
            justify-content: center;
            min-width: 180px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .btn-primary {
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            color: #fff;
        }

        .btn-danger {
            background: linear-gradient(135deg, #dc2626, #ea580c);
            color: #fff;
        }

        .btn-success {
            background: linear-gradient(135deg, #059669, #0d9488);
            color: #fff;
        }

        .landing {
            text-align: center;
            padding: 3rem 1.5rem;
        }

        .landing p {
            color: #94a3b8;
            margin: 1rem 0 2rem;
            font-size: 1.05rem;
            line-height: 1.6;
        }

        .landing .actions {
            justify-content: center;
        }

        .tables-info {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 0.5rem;
            margin-top: 0.5rem;
        }

        .table-tag {
            background: rgba(56, 189, 248, 0.1);
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 0.5rem;
            padding: 0.4rem 0.6rem;
            font-size: 0.8rem;
            color: #7dd3fc;
            text-align: center;
            font-family: 'SF Mono', 'Fira Code', monospace;
        }

        footer {
            text-align: center;
            padding: 2rem 0;
            color: #475569;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <div class="ocean-bg">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
    </div>

    <div class="container">
        <header>
            <div class="logo">BOATLY</div>
            <div class="subtitle">Database Setup &amp; Seed Tool</div>
        </header>

        <?php if (!$action): ?>
            <div class="card landing">
                <h2>Welcome to BOATLY Setup</h2>
                <p>
                    This tool will create the <strong>boatly</strong> database with all required tables
                    and populate it with sample data for the Ayutthaya boat tour market.
                </p>

                <div style="margin-bottom:1.5rem;">
                    <h2 style="font-size:0.95rem;margin-bottom:0.75rem;">14 Tables will be created</h2>
                    <div class="tables-info">
                        <?php foreach (['users','operators','destinations','boats','boat_images','availability','bookings','payments','reviews','favorites','notifications','promotions','addons','review_images'] as $t): ?>
                            <div class="table-tag"><?= $t ?></div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="actions">
                    <a href="?action=migrate" class="btn btn-outline" title="อัปเดตโครงสร้าง DB โดยไม่ลบข้อมูล">Migrate (ไม่ลบข้อมูล)</a>
                    <a href="?action=setup" class="btn btn-primary">Run Setup</a>
                    <a href="?action=reset" class="btn btn-danger" title="ลบข้อมูลทั้งหมด!">Reset &amp; Rebuild</a>
                    <a href="?action=add-operator" class="btn btn-success">เพิ่มพาร์ทเนอร์ทดสอบ (somsak)</a>
                </div>
            </div>

        <?php else: ?>

            <div class="card">
                <h2>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#38bdf8"/><path d="M6 10l3 3 5-5" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Setup Progress
                </h2>
                <ul class="msg-list">
                    <?php foreach ($messages as $m): ?>
                        <li class="msg-item msg-<?= $m['type'] ?>">
                            <span class="msg-icon">
                                <?php if ($m['type'] === 'success'): ?>&#10003;<?php elseif ($m['type'] === 'error'): ?>&#10007;<?php else: ?>i<?php endif; ?>
                            </span>
                            <span><?= htmlspecialchars($m['text']) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>

            <div class="card">
                <h2>Summary</h2>
                <div class="summary">
                    <div class="stat stat-success">
                        <div class="stat-value"><?= $success_count ?></div>
                        <div class="stat-label">Successful</div>
                    </div>
                    <div class="stat stat-error">
                        <div class="stat-value"><?= $error_count ?></div>
                        <div class="stat-label">Errors</div>
                    </div>
                    <div class="stat stat-info">
                        <div class="stat-value"><?= count($messages) ?></div>
                        <div class="stat-label">Total Steps</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <p style="background:#fef3c7;color:#92400e;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px">
                    <strong>⚠️ หลัง Reset:</strong> ข้อมูลผู้ใช้ถูกล้าง กรุณา<strong>ออกจากระบบและเข้าสู่ระบบใหม่</strong>ที่แอป หรือกดปุ่มด้านล่างเพื่อล้างเซสชันแล้วไปที่เว็บไซต์
                </p>
                <div class="actions">
                    <a href="?action=add-operator" class="btn btn-primary">เพิ่มพาร์ทเนอร์ทดสอบ (somsak)</a>
                    <a href="?action=reset" class="btn btn-danger">Reset Database</a>
                    <a href="/boatly/?clear_session=1" class="btn btn-success">Go to Website (ล้างเซสชัน)</a>
                </div>
            </div>

        <?php endif; ?>

        <footer>
            BOATLY &copy; <?= date('Y') ?> &mdash; Thailand Boat Tour Platform
        </footer>
    </div>
</body>
</html>
