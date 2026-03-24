<?php

/** จำนวนการ์ดโปรโมชันสูงสุดที่แสดงบนหน้าแรก (ลูกค้า) */
const PROMO_MAX_VISIBLE = 8;

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'GET':
        if (is_numeric($action)) {
            handlePromotionDetail($db, (int)$action);
        } else {
            handleListPromotions($db);
        }
        break;
    case 'POST':
        if ($action === 'validate') {
            handleValidateCode($db);
        } else {
            handleCreatePromotion($db);
        }
        break;
    case 'PUT':
        if (is_numeric($action)) {
            handleUpdatePromotion($db, (int)$action);
        } else {
            error_response('Invalid promotions endpoint', 404);
        }
        break;
    case 'DELETE':
        if (is_numeric($action)) {
            handleDeletePromotion($db, (int)$action);
        } else {
            error_response('Invalid promotions endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function count_active_promotions_excluding(PDO $db, ?int $excludeId): int {
    if ($excludeId !== null) {
        $stmt = $db->prepare('SELECT COUNT(*) FROM promotions WHERE is_active = 1 AND id != ?');
        $stmt->execute([$excludeId]);
    } else {
        $stmt = $db->query('SELECT COUNT(*) FROM promotions WHERE is_active = 1');
    }
    return (int)$stmt->fetchColumn();
}

function require_promotions_manager(PDO $db): array {
    return require_admin_or_staff($db, 'promotions');
}

function handleListPromotions(PDO $db): void {
    $manage = isset($_GET['manage']) && $_GET['manage'] === '1';

    if ($manage) {
        require_promotions_manager($db);
        try {
            $stmt = $db->query(
                "SELECT id, title_th, title_en, title_zh, title_ko, title_fr,
                        description_th, description_en, description_zh, description_ko, description_fr,
                        image_url, link_type, link_value, gradient_colors, icon,
                        discount_type, discount_value, code, start_date, end_date,
                        is_active, sort_order, created_at, updated_at
                 FROM promotions
                 ORDER BY sort_order ASC, id DESC"
            );
            success_response($stmt->fetchAll());
        } catch (PDOException $e) {
            success_response([]);
        }
        return;
    }

    try {
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');

        $stmt = $db->prepare(
            "SELECT id, title_th, title_en, title_zh, title_ko, title_fr,
                    description_th, description_en, description_zh, description_ko, description_fr,
                    image_url, link_type, link_value, gradient_colors, icon,
                    discount_type, discount_value, code, start_date, end_date,
                    is_active, sort_order
             FROM promotions
             WHERE is_active = 1
               AND (start_date IS NULL OR start_date <= CURDATE())
               AND (end_date IS NULL OR end_date >= CURDATE())
             ORDER BY sort_order ASC, id DESC
             LIMIT " . (int)PROMO_MAX_VISIBLE
        );
        $stmt->execute();
        $promotions = $stmt->fetchAll();

        success_response($promotions);
    } catch (PDOException $e) {
        success_response([]);
    }
}

function handlePromotionDetail(PDO $db, int $id): void {
    try {
        $stmt = $db->prepare('SELECT * FROM promotions WHERE id = ?');
        $stmt->execute([$id]);
        $promo = $stmt->fetch();

        if (!$promo) {
            error_response('Promotion not found', 404);
        }

        success_response($promo);
    } catch (PDOException $e) {
        error_response('Failed to fetch promotion: ' . $e->getMessage(), 500);
    }
}

function handleCreatePromotion(PDO $db): void {
    require_promotions_manager($db);
    $data = get_json_body();

    $willBeActive = array_key_exists('is_active', $data) ? (int)$data['is_active'] : 1;
    if ($willBeActive === 1 && count_active_promotions_excluding($db, null) >= PROMO_MAX_VISIBLE) {
        error_response('มีโปรโมชันที่เปิดแสดงครบ ' . PROMO_MAX_VISIBLE . ' รายการแล้ว กรุณาปิดการแสดงโปรเดิมก่อน หรือตั้งรายการนี้เป็นไม่แสดง', 400);
    }

    $fields = [
        'title_th', 'title_en', 'title_zh', 'title_ko', 'title_fr',
        'description_th', 'description_en', 'description_zh', 'description_ko', 'description_fr',
        'image_url', 'link_type', 'link_value', 'gradient_colors', 'icon',
        'discount_type', 'discount_value', 'code', 'start_date', 'end_date',
        'is_active', 'sort_order',
    ];

    $columns = [];
    $placeholders = [];
    $values = [];

    foreach ($fields as $field) {
        if (array_key_exists($field, $data)) {
            $columns[] = $field;
            $placeholders[] = '?';
            $values[] = in_array($field, ['is_active', 'sort_order'], true)
                ? (int)$data[$field]
                : (in_array($field, ['discount_value'], true)
                    ? (float)$data[$field]
                    : sanitize($data[$field]));
        }
    }

    if (empty($columns)) {
        error_response('No valid fields provided');
    }

    try {
        $sql = 'INSERT INTO promotions (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $stmt = $db->prepare($sql);
        $stmt->execute($values);
        $id = (int)$db->lastInsertId();

        $stmt = $db->prepare('SELECT * FROM promotions WHERE id = ?');
        $stmt->execute([$id]);
        $promo = $stmt->fetch();

        success_response($promo, 'Promotion created', 201);
    } catch (PDOException $e) {
        error_response('Failed to create promotion: ' . $e->getMessage(), 500);
    }
}

function handleUpdatePromotion(PDO $db, int $id): void {
    require_promotions_manager($db);
    $data = get_json_body();

    try {
        $stmt = $db->prepare('SELECT id, is_active FROM promotions WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            error_response('Promotion not found', 404);
        }

        if (array_key_exists('is_active', $data) && (int)$data['is_active'] === 1) {
            if (count_active_promotions_excluding($db, $id) >= PROMO_MAX_VISIBLE) {
                error_response('มีโปรโมชันที่เปิดแสดงครบ ' . PROMO_MAX_VISIBLE . ' รายการแล้ว กรุณาปิดการแสดงโปรอื่นก่อน', 400);
            }
        }

        $fields = [
            'title_th', 'title_en', 'title_zh', 'title_ko', 'title_fr',
            'description_th', 'description_en', 'description_zh', 'description_ko', 'description_fr',
            'image_url', 'link_type', 'link_value', 'gradient_colors', 'icon',
            'discount_type', 'discount_value', 'code', 'start_date', 'end_date',
            'is_active', 'sort_order',
        ];

        $sets = [];
        $values = [];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "{$field} = ?";
                $values[] = in_array($field, ['is_active', 'sort_order'], true)
                    ? (int)$data[$field]
                    : (in_array($field, ['discount_value'], true)
                        ? (float)$data[$field]
                        : sanitize($data[$field]));
            }
        }

        if (empty($sets)) {
            error_response('No valid fields to update');
        }

        $values[] = $id;
        $sql = 'UPDATE promotions SET ' . implode(', ', $sets) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($values);

        $stmt = $db->prepare('SELECT * FROM promotions WHERE id = ?');
        $stmt->execute([$id]);
        $promo = $stmt->fetch();

        success_response($promo, 'Promotion updated');
    } catch (PDOException $e) {
        error_response('Failed to update promotion: ' . $e->getMessage(), 500);
    }
}

function handleDeletePromotion(PDO $db, int $id): void {
    require_promotions_manager($db);

    try {
        $stmt = $db->prepare('SELECT id FROM promotions WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            error_response('Promotion not found', 404);
        }

        $db->prepare('DELETE FROM promotions WHERE id = ?')->execute([$id]);

        success_response(null, 'Promotion deleted');
    } catch (PDOException $e) {
        error_response('Failed to delete promotion: ' . $e->getMessage(), 500);
    }
}

function handleValidateCode(PDO $db): void {
    $data = get_json_body();
    $code = sanitize($data['code'] ?? '');

    if (empty($code)) {
        error_response('Promo code is required');
    }

    try {
        $stmt = $db->prepare(
            "SELECT id, title_en, title_th, discount_type, discount_value, code,
                    start_date, end_date, is_active
             FROM promotions
             WHERE code = ? AND is_active = 1
               AND (start_date IS NULL OR start_date <= CURDATE())
               AND (end_date IS NULL OR end_date >= CURDATE())
             LIMIT 1"
        );
        $stmt->execute([$code]);
        $promo = $stmt->fetch();

        if (!$promo) {
            success_response([
                'valid'   => false,
                'message' => 'Invalid or expired promo code',
            ]);
            return;
        }

        success_response([
            'valid'          => true,
            'promotion_id'   => (int)$promo['id'],
            'title_en'       => $promo['title_en'],
            'title_th'       => $promo['title_th'],
            'discount_type'  => $promo['discount_type'],
            'discount_value' => (float)$promo['discount_value'],
            'message'        => 'Promo code is valid',
        ]);
    } catch (PDOException $e) {
        error_response('Validation failed: ' . $e->getMessage(), 500);
    }
}
