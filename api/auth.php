<?php

$db = Database::getInstance()->getConnection();

// Auto-migrate: add OAuth columns if missing
try {
    $db->query("SELECT 1 FROM users LIMIT 1");
    $db->query("SELECT google_id FROM users LIMIT 1");
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'google_id') !== false || strpos($e->getMessage(), 'Unknown column') !== false) {
        try {
            $db->exec("ALTER TABLE users ADD COLUMN google_id VARCHAR(100) NULL");
            $db->exec("ALTER TABLE users ADD COLUMN line_id VARCHAR(100) NULL");
        } catch (PDOException $e2) {}
    }
}

$method = $GLOBALS['method'];
$segments = $GLOBALS['route_segments'];
$action = $segments[0] ?? '';

switch ($method) {
    case 'POST':
        if ($action === 'register') {
            handleRegister($db);
        } elseif ($action === 'register-operator') {
            handleRegisterOperator($db);
        } elseif ($action === 'login') {
            handleLogin($db);
        } elseif ($action === 'google') {
            handleGoogleLogin($db);
        } elseif ($action === 'logout') {
            handleLogout();
        } else {
            error_response('Invalid auth endpoint', 404);
        }
        break;
    case 'GET':
        if ($action === 'me') {
            handleMe($db);
        } elseif ($action === 'providers') {
            handleGetOAuthProviders();
        } elseif ($action === 'line') {
            handleLineRedirect();
        } elseif ($action === 'line-callback') {
            handleLineCallback($db);
        } else {
            error_response('Invalid auth endpoint', 404);
        }
        break;
    case 'PUT':
        if ($action === 'change-password') {
            handleChangePassword($db);
        } else {
            error_response('Invalid auth endpoint', 404);
        }
        break;
    default:
        error_response('Method not allowed', 405);
}

function handleRegister(PDO $db): void {
    $data = get_json_body();

    $name = sanitize($data['name'] ?? '');
    $email = sanitize($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $phone = sanitize($data['phone'] ?? '');

    if (empty($name) || empty($email) || empty($password)) {
        error_response('Name, email and password are required');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error_response('Invalid email format');
    }

    if (strlen($password) < 6) {
        error_response('Password must be at least 6 characters');
    }

    try {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            error_response('Email already registered', 409);
        }

        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $db->prepare(
            "INSERT INTO users (name, email, phone, password_hash, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'customer', NOW(), NOW())"
        );
        $stmt->execute([$name, $email, $phone, $password_hash]);
        $user_id = (int)$db->lastInsertId();

        $token = generate_token($user_id, 'customer');

        success_response([
            'token' => $token,
            'user' => [
                'id' => $user_id,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'role' => 'customer',
                'language' => 'th'
            ]
        ], 'Registration successful', 201);
    } catch (PDOException $e) {
        error_response('Registration failed: ' . $e->getMessage(), 500);
    }
}

function handleRegisterOperator(PDO $db): void {
    $data = get_json_body();

    $name = sanitize($data['name'] ?? '');
    $email = sanitize($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $phone = sanitize($data['phone'] ?? '');
    $company = trim($data['company_name'] ?? '');
    $description = trim($data['description'] ?? '');

    if (empty($name) || empty($email) || empty($password) || empty($company)) {
        error_response('Name, email, password and company name are required');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error_response('Invalid email format');
    }

    if (strlen($password) < 6) {
        error_response('Password must be at least 6 characters');
    }

    try {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            error_response('Email already registered', 409);
        }

        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $db->prepare(
            "INSERT INTO users (name, email, phone, password_hash, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'operator', NOW(), NOW())"
        );
        $stmt->execute([$name, $email, $phone, $password_hash]);
        $user_id = (int)$db->lastInsertId();

        $stmt = $db->prepare(
            "INSERT INTO operators (user_id, company_name, description, contact_phone, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())"
        );
        $stmt->execute([$user_id, $company, $description, $phone]);

        $operator_id = (int)$db->lastInsertId();
        $token = generate_token($user_id, 'operator');

        // ส่งอีเมลยืนยันการสมัคร
        try {
            send_partner_registration_email($email, $name, $company);
        } catch (Throwable $e) {
            // ไม่ให้การสมัครล้มเหลวแม้อีเมลส่งไม่ได้
        }

        success_response([
            'token' => $token,
            'user' => [
                'id' => $user_id,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'role' => 'operator',
                'operator_id' => $operator_id
            ]
        ], 'Registration successful. Awaiting admin approval.', 201);
    } catch (PDOException $e) {
        error_response('Registration failed: ' . $e->getMessage(), 500);
    }
}

function handleLogin(PDO $db): void {
    $data = get_json_body();
    $email = sanitize($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        error_response('Email and password are required');
    }

    try {
        $stmt = $db->prepare(
            "SELECT id, name, email, phone, password_hash, role, language, profile_image, created_at
             FROM users WHERE email = ?"
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            error_response('Invalid email or password', 401);
        }

        $token = generate_token((int)$user['id'], $user['role']);

        unset($user['password_hash']);

        $response = ['token' => $token, 'user' => $user];

        if ($user['role'] === 'staff') {
            $pm = $db->prepare("SELECT module FROM admin_permissions WHERE user_id = ?");
            $pm->execute([(int)$user['id']]);
            $response['user']['modules'] = array_column($pm->fetchAll(), 'module');
        }

        // สำหรับพาร์ทเนอร์: ส่ง operator_status เพื่อให้แอปแสดงสถานะอนุมัติ
        if ($user['role'] === 'operator') {
            $op_stmt = $db->prepare("SELECT id, status FROM operators WHERE user_id = ?");
            $op_stmt->execute([(int)$user['id']]);
            $op_row = $op_stmt->fetch();
            $response['operator_status'] = $op_row ? ($op_row['status'] ?? 'pending') : 'pending';
            $response['operator_id'] = $op_row ? (int)$op_row['id'] : null;
        }

        success_response($response, 'Login successful');
    } catch (PDOException $e) {
        error_response('Login failed: ' . $e->getMessage(), 500);
    }
}

function handleMe(PDO $db): void {
    $auth = require_auth();

    try {
        $stmt = $db->prepare(
            "SELECT id, name, email, phone, role, language, profile_image, created_at, updated_at
             FROM users WHERE id = ?"
        );
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            error_response('User not found', 404);
        }

        if ($user['role'] === 'staff') {
            $pm = $db->prepare("SELECT module FROM admin_permissions WHERE user_id = ?");
            $pm->execute([(int)$user['id']]);
            $user['modules'] = array_column($pm->fetchAll(), 'module');
        }

        success_response($user);
    } catch (PDOException $e) {
        error_response('Failed to get user: ' . $e->getMessage(), 500);
    }
}

function handleLogout(): void {
    success_response(null, 'Logged out successfully');
}

function handleGetOAuthProviders(): void {
    $config = require __DIR__ . '/config/oauth.php';
    success_response([
        'google' => [
            'enabled' => !empty($config['google']['enabled']),
            'client_id' => $config['google']['client_id'] ?? '',
        ],
        'line' => [
            'enabled' => !empty($config['line']['enabled']),
        ],
    ]);
}

function handleChangePassword(PDO $db): void {
    $auth = require_auth();
    $data = get_json_body();

    $current_password = $data['current_password'] ?? '';
    $new_password = $data['new_password'] ?? '';

    if (empty($current_password) || empty($new_password)) {
        error_response('Current and new passwords are required');
    }

    if (strlen($new_password) < 6) {
        error_response('New password must be at least 6 characters');
    }

    try {
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$auth['user_id']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($current_password, $user['password_hash'])) {
            error_response('Current password is incorrect', 401);
        }

        $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$new_hash, $auth['user_id']]);

        success_response(null, 'Password changed successfully');
    } catch (PDOException $e) {
        error_response('Failed to change password: ' . $e->getMessage(), 500);
    }
}

function handleGoogleLogin(PDO $db): void {
    $config = require __DIR__ . '/config/oauth.php';
    if (empty($config['google']['enabled']) || empty($config['google']['client_id'])) {
        error_response('Google Sign-In is not configured', 503);
    }

    $data = get_json_body();
    $id_token = $data['id_token'] ?? $data['credential'] ?? '';

    if (empty($id_token)) {
        error_response('Google token is required');
    }

    $client_id = $config['google']['client_id'];
    $payload = verify_google_token($id_token, $client_id);
    if (!$payload) {
        error_response('Invalid Google token', 401);
    }

    $google_id = $payload['sub'] ?? '';
    $email = $payload['email'] ?? '';
    $name = $payload['name'] ?? ($payload['given_name'] ?? 'User');
    $picture = $payload['picture'] ?? null;

    if (empty($google_id)) {
        error_response('Invalid Google token payload', 401);
    }

    try {
        $stmt = $db->prepare("SELECT id, name, email, phone, role, language, profile_image, google_id FROM users WHERE google_id = ?");
        $stmt->execute([$google_id]);
        $user = $stmt->fetch();
        if (!$user && $email) {
            $stmt = $db->prepare("SELECT id, name, email, phone, role, language, profile_image, google_id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
        }

        if (!$user) {
            $email_to_use = $email ?: 'g_' . substr($google_id, 0, 20) . '@boatly.oauth';
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email_to_use]);
            if ($stmt->fetch()) $email_to_use = 'g_' . $google_id . '@boatly.oauth';

            $pw = password_hash('oauth_google_' . $google_id . bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
            $stmt = $db->prepare(
                "INSERT INTO users (name, email, phone, password_hash, role, google_id, profile_image, created_at, updated_at)
                 VALUES (?, ?, '', ?, 'customer', ?, ?, NOW(), NOW())"
            );
            $stmt->execute([$name, $email_to_use, $pw, $google_id, $picture]);
            $user_id = (int)$db->lastInsertId();
            $user = [
                'id' => $user_id,
                'name' => $name,
                'email' => $email_to_use,
                'phone' => '',
                'role' => 'customer',
                'language' => 'th',
                'profile_image' => $picture
            ];
        } else {
            if (empty($user['profile_image']) && $picture) {
                $db->prepare("UPDATE users SET profile_image = ?, name = ? WHERE id = ?")->execute([$picture, $name, $user['id']]);
                $user['profile_image'] = $picture;
                $user['name'] = $name;
            }
            if (empty($user['google_id'] ?? null)) {
                $db->prepare("UPDATE users SET google_id = ? WHERE id = ?")->execute([$google_id, $user['id']]);
            }
        }

        $token = generate_token((int)$user['id'], $user['role']);
        success_response(['token' => $token, 'user' => $user], 'Login successful');
    } catch (PDOException $e) {
        error_response('Login failed: ' . $e->getMessage(), 500);
    }
}

function verify_google_token(string $id_token, string $client_id): ?array {
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($id_token);
    $ctx = stream_context_create(['http' => ['timeout' => 10]]);
    $json = @file_get_contents($url, false, $ctx);
    if (!$json) return null;
    $data = json_decode($json, true);
    if (!$data || ($data['aud'] ?? '') !== $client_id) return null;
    return $data;
}

function handleLineRedirect(): void {
    $config = require __DIR__ . '/config/oauth.php';
    if (empty($config['line']['enabled'])) {
        header('Location: ' . app_base_path() . '/?error=line_not_configured');
        exit;
    }
    if (session_status() === PHP_SESSION_NONE) session_start();
    $state = bin2hex(random_bytes(16));
    $_SESSION['line_oauth_state'] = $state;
    $redirect = urlencode((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . app_base_path() . '/api/auth/line-callback');
    $url = 'https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=' . urlencode($config['line']['channel_id']) . '&redirect_uri=' . $redirect . '&state=' . $state . '&scope=profile%20openid%20email';
    header('Location: ' . $url);
    exit;
}

function handleLineCallback(PDO $db): void {
    $config = require __DIR__ . '/config/oauth.php';
    if (empty($config['line']['enabled'])) {
        header('Location: ' . app_base_path() . '/?error=line_not_configured');
        exit;
    }

    $code = $_GET['code'] ?? '';
    $state = $_GET['state'] ?? '';
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($code) || $state !== ($_SESSION['line_oauth_state'] ?? '')) {
        header('Location: ' . app_base_path() . '/?error=line_auth_failed');
        exit;
    }

    $redirect_uri = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . app_base_path() . '/api/auth/line-callback';
    $post = http_build_query([
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $redirect_uri,
        'client_id' => $config['line']['channel_id'],
        'client_secret' => $config['line']['channel_secret'],
    ]);
    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $post,
            'timeout' => 10
        ]
    ]);
    $json = @file_get_contents('https://api.line.me/oauth2/v2.1/token', false, $ctx);
    if (!$json) {
        header('Location: ' . app_base_path() . '/?error=line_token_failed');
        exit;
    }
    $token_data = json_decode($json, true);
    $access_token = $token_data['access_token'] ?? '';
    $id_token = $token_data['id_token'] ?? '';

    $profile = null;
    if ($id_token) {
        $parts = explode('.', $id_token);
        if (count($parts) >= 2) {
            $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
            $profile = [
                'sub' => $payload['sub'] ?? '',
                'name' => $payload['name'] ?? 'User',
                'picture' => $payload['picture'] ?? null,
                'email' => $payload['email'] ?? null,
            ];
        }
    }
    if (!$profile && $access_token) {
        $ctx2 = stream_context_create(['http' => ['header' => 'Authorization: Bearer ' . $access_token, 'timeout' => 10]]);
        $prof_json = @file_get_contents('https://api.line.me/v2/profile', false, $ctx2);
        if ($prof_json) {
            $p = json_decode($prof_json, true);
            $profile = ['sub' => $p['userId'] ?? '', 'name' => $p['displayName'] ?? 'User', 'picture' => $p['pictureUrl'] ?? null, 'email' => null];
        }
    }

    if (!$profile || empty($profile['sub'])) {
        header('Location: ' . app_base_path() . '/?error=line_profile_failed');
        exit;
    }

    $line_id = $profile['sub'];
    $name = $profile['name'] ?? 'User';
    $email = $profile['email'] ?? null;
    $picture = $profile['picture'] ?? null;
    $email_to_use = $email ?: 'line_' . substr($line_id, 0, 20) . '@boatly.oauth';

    try {
        $stmt = $db->prepare("SELECT id, name, email, phone, role, language, profile_image FROM users WHERE line_id = ?");
        $stmt->execute([$line_id]);
        $user = $stmt->fetch();

        if (!$user) {
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email_to_use]);
            if ($stmt->fetch()) $email_to_use = 'line_' . $line_id . '@boatly.oauth';

            $pw = password_hash('oauth_line_' . $line_id . bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
            $stmt = $db->prepare(
                "INSERT INTO users (name, email, phone, password_hash, role, line_id, profile_image, created_at, updated_at)
                 VALUES (?, ?, '', ?, 'customer', ?, ?, NOW(), NOW())"
            );
            $stmt->execute([$name, $email_to_use, $pw, $line_id, $picture]);
            $user_id = (int)$db->lastInsertId();
            $user = ['id' => $user_id, 'name' => $name, 'email' => $email_to_use, 'phone' => '', 'role' => 'customer', 'language' => 'th', 'profile_image' => $picture];
        } else {
            if (empty($user['profile_image']) && $picture) {
                $db->prepare("UPDATE users SET profile_image = ?, name = ? WHERE id = ?")->execute([$picture, $name, $user['id']]);
                $user['profile_image'] = $picture;
                $user['name'] = $name;
            }
        }

        $token = generate_token((int)$user['id'], $user['role']);
        header('Location: ' . app_base_path() . '/?token=' . urlencode($token));
        exit;
    } catch (PDOException $e) {
        header('Location: ' . app_base_path() . '/?error=line_db_failed');
        exit;
    }
}
