<?php
/**
 * Matching Engine API
 * POST /api/match/boats
 * Contract: { date, time, people, location } -> [{ boat_id, score }, ...]
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

if ($method !== 'POST' || $action !== 'boats') {
    if ($method === 'GET' && ($action === '' || $action === '/')) {
        json_response(['success' => true, 'message' => 'Match API - POST /match/boats']);
        exit;
    }
    error_response('Invalid match endpoint', 404);
}

$data = get_json_body();
$date = trim($data['date'] ?? '');
$time = trim($data['time'] ?? '10:00');
$people = max(1, (int)($data['people'] ?? 2));
$location = trim($data['location'] ?? '');

if (empty($date)) error_response('date is required');

$request_id = bin2hex(random_bytes(8));
$results = matchBoats($db, $date, $time, $people, $location, $request_id);

success_response($results);

function matchBoats(PDO $db, string $date, string $time, int $people, string $location, string $request_id): array {
    try {
        $boats = $db->prepare(
            "SELECT b.id, b.name, b.price, b.capacity, b.boat_type, b.destination_id,
                    d.province, d.name_th AS dest_name,
                    (SELECT AVG(r.rating) FROM reviews r WHERE r.boat_id = b.id AND r.status = 'approved') AS avg_rating,
                    (SELECT COUNT(*) FROM availability a WHERE a.boat_id = b.id AND a.date = ? AND a.time_slot = ? AND a.is_available = 1 AND (a.max_seats - a.booked_seats) >= ?) AS slot_ok
             FROM boats b
             LEFT JOIN destinations d ON b.destination_id = d.id
             WHERE b.status = 'active'"
        );
        $boats->execute([$date, $time, $people]);
        $rows = $boats->fetchAll();
    } catch (PDOException $e) {
        return [];
    }

    $scored = [];
    foreach ($rows as $b) {
        $available = (int)($b['slot_ok'] ?? 0) > 0;
        $score = scoreBoat($b, $people, $available);
        $scored[] = ['boat_id' => (int)$b['id'], 'score' => round($score, 0), 'name' => $b['name'] ?? '', 'price' => (float)($b['price'] ?? 0), 'available' => $available];
        try {
            $db->prepare("INSERT INTO boat_scores (boat_id, request_id, score) VALUES (?, ?, ?)")->execute([$b['id'], $request_id, $score]);
        } catch (PDOException $e) {}
    }

    usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
    return array_slice($scored, 0, 20);
}

function scoreBoat(array $b, int $people, bool $available): float {
    $score = 0;
    $price = (float)($b['price'] ?? 9999);
    $score += max(0, 1000 - $price * 0.1);
    $rating = (float)($b['avg_rating'] ?? 0);
    $score += $rating * 100;
    $capacity = (int)($b['capacity'] ?? 10);
    if ($capacity >= $people) $score += 100;
    if ($available) $score += 500;
    return $score;
}
