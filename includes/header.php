<?php
$pageTitle = $pageTitle ?? 'BOATLY';
$pageDescription = $pageDescription ?? 'Discover boat experiences across Thailand';
$bodyClass = $bodyClass ?? '';
require_once __DIR__ . '/base_path.php';
$currentPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$base = app_base_path();
$navPath = (str_starts_with($currentPath, $base))
    ? (substr($currentPath, strlen($base)) ?: '/')
    : $currentPath;
$navPath = rtrim($navPath, '/') ?: '/';
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
    <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?> | BOATLY</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Font Awesome 6.5.1 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

    <!-- PWA meta tags -->
    <meta name="theme-color" content="#0C4A6E">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <!-- Styles -->
    <link rel="stylesheet" href="<?= baseUrl('/assets/css/style.css') ?>">
</head>
<body class="<?= htmlspecialchars($bodyClass, ENT_QUOTES, 'UTF-8') ?>">
    <header class="navbar">
        <div class="navbar-inner">
            <a href="<?= baseUrl('/') ?>" class="navbar-brand">
                <i class="fas fa-anchor"></i>
                <span>BOATLY</span>
            </a>

            <button type="button" class="nav-toggle" aria-label="Toggle menu">
                <i class="fas fa-bars"></i>
            </button>

            <nav class="nav-links">
                <a href="<?= baseUrl('/') ?>" class="nav-link<?= $navPath === '/' ? ' active' : '' ?>">Home</a>
                <a href="<?= baseUrl('/destinations') ?>" class="nav-link<?= str_starts_with($navPath, '/destinations') ? ' active' : '' ?>">Destinations</a>
                <a href="<?= baseUrl('/boats') ?>" class="nav-link<?= str_starts_with($navPath, '/boats') ? ' active' : '' ?>">Boats</a>
                <a href="<?= baseUrl('/booking') ?>" class="btn btn-primary btn-nav">Book Now</a>
            </nav>
        </div>
    </header>
