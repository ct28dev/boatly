<?php
/**
 * OAuth Configuration for Google & Line Login
 * oauth.local.php is auto-created from example if missing. Edit it to add your credentials.
 */
$local = __DIR__ . '/oauth.local.php';
$example = __DIR__ . '/oauth.local.php.example';
if (!file_exists($local) && file_exists($example)) {
    @copy($example, $local);
}

$base = [
    'google' => [
        'client_id' => '',
        'enabled'   => false,
    ],
    'line' => [
        'channel_id'     => '',
        'channel_secret' => '',
        'enabled'        => false,
    ],
];

if (file_exists($local)) {
    $overrides = require $local;
    foreach ($overrides as $k => $v) {
        if (isset($base[$k]) && is_array($base[$k]) && is_array($v)) {
            $base[$k] = array_merge($base[$k], $v);
        } else {
            $base[$k] = $v;
        }
    }
    if (!empty($base['google']['client_id'])) $base['google']['enabled'] = true;
    if (!empty($base['line']['channel_id']) && !empty($base['line']['channel_secret'])) $base['line']['enabled'] = true;
}

$googleClientId = getenv('BOATLY_GOOGLE_CLIENT_ID') ?: getenv('BOATHUB_GOOGLE_CLIENT_ID');
if ($googleClientId) {
    $base['google']['client_id'] = $googleClientId;
    $base['google']['enabled'] = true;
}
$lineChannelId = getenv('BOATLY_LINE_CHANNEL_ID') ?: getenv('BOATHUB_LINE_CHANNEL_ID');
if ($lineChannelId) {
    $base['line']['channel_id'] = $lineChannelId;
    $base['line']['channel_secret'] = (getenv('BOATLY_LINE_CHANNEL_SECRET') ?: getenv('BOATHUB_LINE_CHANNEL_SECRET')) ?: '';
    $base['line']['enabled'] = !empty($base['line']['channel_secret']);
}

return $base;
