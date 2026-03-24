<?php
/**
 * Public Destinations API - สถานที่/จังหวัดที่มีทัวร์
 * สำหรับแสดงใน filter chips การค้นหาทริป
 * คืนค่า unique ตาม province/name_th เพื่อไม่ให้ chip ซ้ำ
 */
$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'] ?? 'GET';

if ($method !== 'GET') {
    error_response('Method not allowed', 405);
}

try {
    $stmt = $db->prepare(
        "SELECT d.id, d.name, d.name_th, d.province, d.slug
         FROM destinations d
         INNER JOIN boats b ON b.destination_id = d.id
         LEFT JOIN operators o ON b.operator_id = o.id
         WHERE b.status = 'active'
           AND (o.status = 'approved' OR o.status IS NULL)
         ORDER BY d.sort_order ASC, d.name ASC"
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();
    $seen = [];
    $out = [];
    foreach ($rows as $r) {
        $val = trim($r['province'] ?? '') ?: trim($r['name_th'] ?? '') ?: trim($r['name'] ?? '');
        $key = $val ? strtolower($val) : '';
        if ($key && !isset($seen[$key])) {
            $seen[$key] = true;
            $out[] = $r;
        }
    }
    success_response($out);
} catch (PDOException $e) {
    success_response([]);
}
