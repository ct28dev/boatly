<?php
/**
 * AI Recommend – ดึงสถานที่จากแพลตฟอร์ม + fallback สื่อชื่อจังหวัด (ไม่แก้ตารางเดิม)
 */

/**
 * ชื่อจังหวัด/พื้นที่ที่ผู้ใช้พิมพ์ (ว่าง → ข้อความกลาง)
 */
function ai_normalize_location_label(string $location): string {
    $s = trim($location);
    return $s !== '' ? $s : 'พื้นที่ท่องเที่ยว';
}

/**
 * 1) destinations ที่ active และ match คำค้น
 * 2) เรือ/ทริปในแพลตฟอร์ม (boats + destinations + operators)
 * 3) เทมเพลตที่มีชื่อจังหวัดในข้อความ
 *
 * @return array{places: string[], source: string, boat_ids: int[]}
 */
function ai_collect_places_for_recommend(PDO $db, array $input): array {
    $location = trim($input['location'] ?? '');
    $interests = $input['interests'] ?? [];
    if (!is_array($interests)) {
        $interests = [];
    }

    $fromDest = ai_fetch_places_from_destinations($db, $location);
    if (count($fromDest) >= 2) {
        return ['places' => array_slice($fromDest, 0, 5), 'source' => 'destinations', 'boat_ids' => []];
    }

    $fromBoats = ai_fetch_places_from_boats($db, $location);
    if (!empty($fromBoats['places'])) {
        return $fromBoats;
    }

    $label = ai_normalize_location_label($location);
    return [
        'places' => ai_build_generic_places_template($label, $interests),
        'source' => 'template',
        'boat_ids' => [],
    ];
}

function ai_fetch_places_from_destinations(PDO $db, string $location): array {
    if ($location === '') {
        return [];
    }
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9ก-๙]/u', '', $location));
    if ($slug === '') {
        $slug = 'x';
    }
    try {
        $stmt = $db->prepare(
            "SELECT id, name, name_th, slug FROM destinations
             WHERE status = 'active' AND (province LIKE ? OR name_th LIKE ? OR name LIKE ? OR slug LIKE ?)
             LIMIT 10"
        );
        $like = "%{$location}%";
        $stmt->execute([$like, $like, $like, "%{$slug}%"]);
        $dests = $stmt->fetchAll();
        if (!empty($dests)) {
            return array_map(static fn($d) => $d['name_th'] ?: $d['name'], $dests);
        }
    } catch (PDOException $e) {
    }
    return [];
}

/**
 * ดึงชื่อทริป/เรือจากแพลตฟอร์มที่เกี่ยวกับจังหวัดหรือคำค้น
 */
function ai_fetch_places_from_boats(PDO $db, string $location): array {
    if ($location === '') {
        return ['places' => [], 'source' => 'boats', 'boat_ids' => []];
    }
    $like = '%' . $location . '%';
    try {
        $db->query('SELECT 1 FROM boats LIMIT 1');
    } catch (PDOException $e) {
        return ['places' => [], 'source' => 'boats', 'boat_ids' => []];
    }

    $sql = "SELECT b.id, b.name, b.description, b.description_th,
                   d.name_th AS dest_name_th, d.name AS dest_name, d.province
            FROM boats b
            INNER JOIN destinations d ON b.destination_id = d.id
            LEFT JOIN operators o ON b.operator_id = o.id
            WHERE b.status = 'active'
              AND (o.status = 'approved' OR o.status IS NULL)
              AND (
                    d.province LIKE ? OR d.name_th LIKE ? OR d.name LIKE ?
                    OR b.name LIKE ? OR b.description LIKE ? OR b.description_th LIKE ?
                  )
            ORDER BY b.featured DESC, b.id DESC
            LIMIT 15";

    try {
        $stmt = $db->prepare($sql);
        $stmt->execute([$like, $like, $like, $like, $like, $like]);
        $rows = $stmt->fetchAll();
    } catch (PDOException $e) {
        return ['places' => [], 'source' => 'boats', 'boat_ids' => []];
    }

    if (empty($rows)) {
        return ['places' => [], 'source' => 'boats', 'boat_ids' => []];
    }

    $seen = [];
    $places = [];
    $boat_ids = [];

    foreach ($rows as $row) {
        $bid = (int)$row['id'];
        $name = trim((string)($row['name'] ?? ''));
        if ($name === '') {
            continue;
        }
        $key = mb_strtolower($name, 'UTF-8');
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $places[] = $name;
        $boat_ids[] = $bid;
        if (count($places) >= 5) {
            break;
        }
    }

    return [
        'places' => $places,
        'source' => 'boats',
        'boat_ids' => $boat_ids,
    ];
}

/**
 * Fallback เมื่อไม่มี destinations / boats ตรงคำค้น — สื่อชื่อจังหวัดในข้อความ
 */
function ai_build_generic_places_template(string $provinceLabel, array $interests): array {
    $has_temple = false;
    $has_dive = false;
    $has_chill = false;
    foreach ($interests as $i) {
        if (!is_string($i)) {
            continue;
        }
        if (mb_strpos($i, 'วัด') !== false) {
            $has_temple = true;
        }
        if (mb_strpos($i, 'ดำน้ำ') !== false || mb_strpos($i, 'เกาะ') !== false) {
            $has_dive = true;
        }
        if (mb_strpos($i, 'ชิล') !== false || mb_strpos($i, 'พักผ่อน') !== false) {
            $has_chill = true;
        }
    }

    $spots = [];
    $spots[] = 'ท่าเรือ / จุดนัดพบ (' . $provinceLabel . ')';

    if ($has_temple) {
        $spots[] = 'วัด / โบราณสถาน (' . $provinceLabel . ')';
    } else {
        $spots[] = 'จุดท่องเที่ยวแนะนำ (' . $provinceLabel . ')';
    }

    if ($has_dive) {
        $spots[] = 'ดำน้ำ / ชมธรรมชาติ (' . $provinceLabel . ')';
    } elseif ($has_chill) {
        $spots[] = 'คาเฟ่ / จุดพักผ่อนริมน้ำ (' . $provinceLabel . ')';
    } else {
        $spots[] = 'ล่องเรือชมบรรยากาศ (' . $provinceLabel . ')';
    }

    $spots[] = 'ร้านอาหารท้องถิ่น / พักเที่ยง (' . $provinceLabel . ')';

    return array_slice($spots, 0, 5);
}

/**
 * จัดลำดับเส้นทาง — ไม่ซ้ำคำว่า "ท่าเรือ" ถ้าจุดแรกเป็นท่าเรืออยู่แล้ว
 */
function ai_optimize_route(array $places): array {
    if (empty($places)) {
        return ['ท่าเรือ', 'จุดท่องเที่ยว', 'ร้านอาหาร'];
    }
    $first = (string)($places[0] ?? '');
    if ($first !== '' && (mb_stripos($first, 'ท่าเรือ') !== false || mb_stripos($first, 'จุดนัด') !== false)) {
        return array_values(array_unique($places));
    }
    return array_values(array_unique(array_merge(['ท่าเรือ'], $places)));
}

/**
 * กิจกรรมตามความสนใจ (ข้อความ)
 */
function ai_activity_for_segment(int $index, int $total, array $interests): string {
    if ($index === 0) {
        return 'ออกเดินทาง / นัดพบ';
    }
    if ($index === $total - 1) {
        return 'พักเที่ยง / รับประทานอาหาร';
    }
    foreach ($interests as $i) {
        if (!is_string($i)) {
            continue;
        }
        if (mb_strpos($i, 'วัด') !== false) {
            return 'ชมวัด / โบราณสถาน';
        }
        if (mb_strpos($i, 'ดำน้ำ') !== false) {
            return 'ดำน้ำ / กิจกรรมทางน้ำ';
        }
        if (mb_strpos($i, 'ชิล') !== false) {
            return 'พักผ่อน ถ่ายรูป';
        }
    }
    return 'ชมสถานที่ / กิจกรรม';
}

function ai_build_timeline(array $route, int $people, array $interests = []): array {
    $times = ['09:00', '09:45', '10:30', '11:30', '12:30'];
    $out = [];
    $total = count($route);
    foreach (array_slice($route, 0, 5) as $i => $place) {
        $out[] = [
            'time' => $times[$i] ?? '12:00',
            'place' => $place,
            'activity' => ai_activity_for_segment($i, $total, $interests),
        ];
    }
    return $out;
}

/**
 * ประกอบผลลัพธ์สุดท้าย (รองรับ feature flag: ถ้าปิด จะไม่ query destinations หนัก — ใช้ boats+template)
 */
function ai_build_recommend_output(PDO $db, array $input, bool $use_destinations): array {
    $location = trim($input['location'] ?? '');
    $people = max(1, (int)($input['people'] ?? 2));
    $budget = (float)($input['budget'] ?? 5000);
    $interests = $input['interests'] ?? [];
    if (!is_array($interests)) {
        $interests = [];
    }

    if ($use_destinations) {
        $resolved = ai_collect_places_for_recommend($db, $input);
    } else {
        $fromBoats = ai_fetch_places_from_boats($db, $location);
        if (!empty($fromBoats['places'])) {
            $resolved = $fromBoats;
        } else {
            $label = ai_normalize_location_label($location);
            $resolved = [
                'places' => ai_build_generic_places_template($label, $interests),
                'source' => 'template',
                'boat_ids' => [],
            ];
        }
    }

    $route = ai_optimize_route($resolved['places']);
    $timeline = ai_build_timeline($route, $people, $interests);
    $boat_type = $budget >= 8000 ? 'private' : 'shared';

    return [
        'route' => $route,
        'timeline' => $timeline,
        'boat_type' => $boat_type,
        'location_label' => ai_normalize_location_label($location),
        'source' => $resolved['source'],
        'matched_boat_ids' => $resolved['boat_ids'] ?? [],
    ];
}
