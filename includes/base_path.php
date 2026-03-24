<?php
/**
 * URL path prefix when the app is served from /boatly (canonical) or legacy /boathub.
 * ใช้ร่วมกับ router, API, และลิงก์ในเทมเพลต
 */
if (!function_exists('app_base_path')) {
    function app_base_path(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        if (str_starts_with($uri, '/boatly')) {
            return '/boatly';
        }
        if (str_starts_with($uri, '/boathub')) {
            return '/boathub';
        }
        return '/boatly';
    }
}
