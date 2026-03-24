<?php
/**
 * Geocoding proxy - ค้นหาสถานที่ในประเทศไทย
 * ใช้หลายแหล่งข้อมูลและหลายกลยุทธ์เพื่อผลลัพธ์ที่แม่นยำและครบถ้วน
 */
$method = $GLOBALS['method'];
if ($method !== 'GET') {
    error_response('Method not allowed', 405);
}

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 2) {
    success_response([]);
    exit;
}

// Thailand bounding box: left, bottom, right, top (lon, lat)
$thailandViewbox = '97.5,5.5,105.5,20.5';
$thailandBbox = '97.5,5.5,105.5,20.5'; // Photon uses lon_min,lat_min,lon_max,lat_max
$provinceSuffixes = ['อยุธยา', 'กรุงเทพ', 'เชียงใหม่', 'ภูเก็ต', 'พัทยา', 'ระยอง', 'ชลบุรี', 'นครราชสีมา', 'ขอนแก่น', 'สุราษฎร์', 'กระบี่', 'เชียงราย', 'นครศรีธรรมราช', 'สงขลา', 'อุบลราชธานี', 'ร้อยเอ็ด', 'บุรีรัมย์', 'สระบุรี', 'นนทบุรี', 'นครปฐม'];

/**
 * ค้นหาจาก Nominatim
 */
function searchNominatim($q, $options = []) {
    $params = [
        'q' => $q,
        'format' => 'json',
        'limit' => isset($options['limit']) ? $options['limit'] : 10,
    ];
    if (!empty($options['countrycodes'])) {
        $params['countrycodes'] = $options['countrycodes'];
    }
    if (!empty($options['viewbox'])) {
        $params['viewbox'] = $options['viewbox'];
        $params['bounded'] = isset($options['bounded']) ? $options['bounded'] : 0;
    }
    $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query($params);
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Boatly/1.0 (Thailand Travel App)\r\nAccept-Language: th\r\n",
            'timeout' => 8,
        ]
    ]);
    $json = @file_get_contents($url, false, $ctx);
    if ($json === false) return [];
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

/**
 * ค้นหาจาก Photon API (fallback)
 */
function searchPhoton($q, $bbox, $limit = 10) {
    $url = 'https://photon.komoot.io/api/?' . http_build_query([
        'q' => $q,
        'bbox' => $bbox,
        'limit' => $limit,
        'lang' => 'th',
    ]);
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Boatly/1.0\r\n",
            'timeout' => 8,
        ]
    ]);
    $json = @file_get_contents($url, false, $ctx);
    if ($json === false) return [];
    $data = json_decode($json, true);
    if (!isset($data['features']) || !is_array($data['features'])) return [];
    // แปลง Photon format เป็น format เดียวกับ Nominatim
    $results = [];
    foreach ($data['features'] as $f) {
        $props = $f['properties'] ?? [];
        $geom = $f['geometry'] ?? [];
        $coords = $geom['coordinates'] ?? [0, 0];
        $country = $props['country'] ?? '';
        $countrycode = $props['countrycode'] ?? '';
        if (strtoupper($countrycode) !== 'TH' && stripos($country, 'Thailand') === false) continue;
        $name = $props['name'] ?? '';
        $street = $props['street'] ?? '';
        $city = $props['city'] ?? $props['district'] ?? '';
        $state = $props['state'] ?? '';
        $display = array_filter([$name, $street, $city, $state, 'Thailand']);
        $results[] = [
            'lat' => (string)($coords[1] ?? 0),
            'lon' => (string)($coords[0] ?? 0),
            'display_name' => implode(', ', $display),
            'name' => $name,
        ];
    }
    return $results;
}

/**
 * แปลงผลลัพธ์ให้เป็นรูปแบบมาตรฐาน
 */
function normalizeResults($raw) {
    $out = [];
    $seen = [];
    foreach ($raw as $r) {
        $key = round((float)($r['lat'] ?? 0), 5) . ',' . round((float)($r['lon'] ?? 0), 5);
        if (isset($seen[$key])) continue;
        $seen[$key] = true;
        $out[] = [
            'lat' => $r['lat'] ?? '',
            'lon' => $r['lon'] ?? '',
            'display_name' => $r['display_name'] ?? $r['name'] ?? '',
            'name' => $r['name'] ?? '',
        ];
    }
    return $out;
}

// เติม Thailand ถ้ายังไม่มี (ช่วยให้ผลลัพธ์ตรงกับประเทศไทยมากขึ้น)
$qWithCountry = (stripos($q, 'thailand') === false && stripos($q, 'ไทย') === false) ? $q . ' Thailand' : $q;

// กลยุทธ์ 1: ค้นหาด้วย query + Thailand, จำกัดประเทศ
$data = searchNominatim($qWithCountry, ['countrycodes' => 'th', 'limit' => 10]);

// กลยุทธ์ 2: ถ้าไม่เจอ ลอง query เฉยๆ กับ countrycodes
if (empty($data)) {
    $data = searchNominatim($q, ['countrycodes' => 'th', 'limit' => 10]);
}

// กลยุทธ์ 3: ถ้ายังไม่เจอ ลอง viewbox Thailand (ไม่บังคับ country)
if (empty($data)) {
    $data = searchNominatim($qWithCountry, [
        'viewbox' => $thailandViewbox,
        'bounded' => 0,
        'limit' => 10,
    ]);
}

// กลยุทธ์ 4: ลองคำสั้นลง - ตัดคำต่อท้ายที่เป็นชื่อจังหวัดที่พบบ่อย (เช่น อยุธยา, กรุงเทพ)
if (empty($data) && mb_strlen($q) > 4) {
    $shorter = $q;
    foreach ($provinceSuffixes as $suffix) {
        if (mb_substr($q, -mb_strlen($suffix)) === $suffix) {
            $shorter = trim(mb_substr($q, 0, -mb_strlen($suffix)));
            break;
        }
    }
    if ($shorter !== $q && mb_strlen($shorter) >= 2) {
        $data = searchNominatim($shorter . ' Thailand', ['countrycodes' => 'th', 'limit' => 10]);
    }
}

// กลยุทธ์ 5: Photon API เป็น fallback
if (empty($data)) {
    $photonResults = searchPhoton($q, $thailandBbox, 10);
    if (!empty($photonResults)) {
        $data = $photonResults;
    }
}

// กลยุทธ์ 6: Photon ด้วยคำสั้นลง (ตัด suffix จังหวัด)
if (empty($data) && mb_strlen($q) > 4) {
    $shorter = $q;
    foreach ($provinceSuffixes as $suffix) {
        if (mb_substr($q, -mb_strlen($suffix)) === $suffix) {
            $shorter = trim(mb_substr($q, 0, -mb_strlen($suffix)));
            break;
        }
    }
    if ($shorter !== $q && mb_strlen($shorter) >= 2) {
        $data = searchPhoton($shorter, $thailandBbox, 10);
    }
}

$data = normalizeResults($data);
success_response(array_slice($data, 0, 10));
