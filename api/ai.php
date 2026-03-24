<?php
/**
 * AI Recommendation API
 * POST /api/ai/recommend
 * Contract: { location, people, budget, interests[] } -> { route, timeline, boat_type, location_label, source, matched_boat_ids }
 *
 * แหล่งข้อมูล: destinations → boats (แพลตฟอร์ม) → เทมเพลตสื่อชื่อจังหวัด (ไม่ hardcode แค่อยุธยา)
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/helpers.php';
require_once __DIR__ . '/config/feature-flags.php';
require_once __DIR__ . '/config/ai-recommend-helpers.php';

$db = Database::getInstance()->getConnection();
$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

if ($method !== 'POST' || $action !== 'recommend') {
    if ($method === 'GET' && ($action === '' || $action === '/')) {
        json_response(['success' => true, 'message' => 'AI API - POST /ai/recommend']);
        exit;
    }
    error_response('Invalid AI endpoint', 404);
}

$data = get_json_body();
$location = trim($data['location'] ?? '');
$people = max(1, (int)($data['people'] ?? 2));
$budget = (float)($data['budget'] ?? 5000);
$interests = $data['interests'] ?? [];
if (!is_array($interests)) {
    $interests = [];
}

$user_id = null;
try {
    $auth = get_auth_user();
    if ($auth) {
        $user_id = (int)$auth['user_id'];
    }
} catch (Exception $e) {
}

$input = [
    'location' => $location,
    'people' => $people,
    'budget' => $budget,
    'interests' => $interests,
];

// ai_recommendation = true → ใช้ pipeline เต็ม (destinations + boats + template)
// ai_recommendation = false → ใช้ boats + template เท่านั้น (เบากว่า ยังสื่อชื่อจังหวัดได้)
$use_destinations = is_feature_active($db, 'ai_recommendation');
$output = ai_build_recommend_output($db, $input, $use_destinations);

try {
    $stmt = $db->prepare('INSERT INTO ai_logs (user_id, input_json, output_json) VALUES (?, ?, ?)');
    $stmt->execute([$user_id, json_encode($input), json_encode($output)]);
} catch (PDOException $e) {
}

success_response($output);
