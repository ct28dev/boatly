<?php
/**
 * CMS API - ความเห็น, ศูนย์ช่วยเหลือ, ประกาศ
 * Public GET สำหรับดึงเนื้อหา | Admin จัดการผ่าน /admin
 */
$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

// Auto-migrate: site_content table
try {
    $db->query("SELECT 1 FROM site_content LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE site_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content_type ENUM('feedback_intro','help_item','announcement') NOT NULL,
                title_th VARCHAR(255) NULL,
                title_en VARCHAR(255) NULL,
                body_th TEXT NULL,
                body_en TEXT NULL,
                sort_order INT DEFAULT 0,
                is_active TINYINT DEFAULT 1,
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        } catch (PDOException $e2) {}
    }
}
try {
    $db->query("SELECT 1 FROM feedback_submissions LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
        try {
            $db->exec("CREATE TABLE feedback_submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        } catch (PDOException $e2) {}
    }
}

if ($method !== 'GET' && $method !== 'POST') {
    error_response('Method not allowed', 405);
}

if ($action === 'feedback') {
    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT title_th, title_en, body_th, body_en FROM site_content WHERE content_type = 'feedback_intro' AND is_active = 1 LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        success_response($row ?: ['title_th' => '', 'title_en' => '', 'body_th' => '', 'body_en' => '']);
    }
    if ($method === 'POST') {
        $auth = get_auth_user();
        $data = get_json_body();
        $msg = trim($data['message'] ?? '');
        if (empty($msg)) error_response('กรุณากรอกข้อความ');
        $user_id = $auth ? (int)$auth['user_id'] : null;
        $stmt = $db->prepare("INSERT INTO feedback_submissions (user_id, message) VALUES (?, ?)");
        $stmt->execute([$user_id, $msg]);
        success_response(['id' => (int)$db->lastInsertId()], 'ส่งความเห็นสำเร็จ', 201);
    }
}

if ($action === 'help') {
    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT id, title_th, title_en, body_th, body_en, sort_order FROM site_content WHERE content_type = 'help_item' AND is_active = 1 ORDER BY sort_order ASC, id ASC");
        $stmt->execute();
        success_response($stmt->fetchAll());
    }
}

if ($action === 'announcements') {
    if ($method === 'GET') {
        $stmt = $db->prepare("SELECT id, title_th, title_en, body_th, body_en, sort_order, created_at FROM site_content WHERE content_type = 'announcement' AND is_active = 1 ORDER BY sort_order ASC, created_at DESC");
        $stmt->execute();
        success_response($stmt->fetchAll());
    }
}

error_response('Invalid CMS endpoint', 404);
