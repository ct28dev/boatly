<?php
/**
 * Production Tables Migration (V2)
 * หลักการ: เพิ่มเท่านั้น ไม่แก้ของเดิม
 * Run: ถูกโหลดอัตโนมัติเมื่อ API เริ่มทำงาน (lazy migrate)
 */

if (!isset($db) || !($db instanceof PDO)) return;

$tables = [
    'ai_logs' => "CREATE TABLE ai_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        input_json JSON NULL,
        output_json JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'boat_availability_v2' => "CREATE TABLE boat_availability_v2 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boat_id INT NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_boat_date_time (boat_id, date, start_time),
        INDEX idx_boat_date (boat_id, date),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'boat_scores' => "CREATE TABLE boat_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boat_id INT NOT NULL,
        request_id VARCHAR(64) NULL,
        score DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_boat (boat_id),
        INDEX idx_request (request_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'revenues' => "CREATE TABLE revenues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        reference_id INT NULL,
        operator_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_created (created_at),
        INDEX idx_operator (operator_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'subscriptions' => "CREATE TABLE subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL,
        plan VARCHAR(50) NOT NULL DEFAULT 'free',
        status VARCHAR(20) DEFAULT 'active',
        start_date DATE NULL,
        end_date DATE NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_partner (partner_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'feature_flags' => "CREATE TABLE feature_flags (
        `key` VARCHAR(50) PRIMARY KEY,
        is_active TINYINT(1) DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
];

foreach ($tables as $name => $sql) {
    try {
        $db->query("SELECT 1 FROM {$name} LIMIT 1");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), "doesn't exist") !== false) {
            try {
                $db->exec($sql);
            } catch (PDOException $e2) {
                error_log("Migration {$name}: " . $e2->getMessage());
            }
        }
    }
}

// Seed feature_flags
try {
    $seed = $db->prepare("INSERT IGNORE INTO feature_flags (`key`, is_active) VALUES (?, ?)");
    foreach (['dynamic_pricing' => 0, 'ai_recommendation' => 0] as $k => $v) {
        $seed->execute([$k, $v]);
    }
} catch (PDOException $e) {}
