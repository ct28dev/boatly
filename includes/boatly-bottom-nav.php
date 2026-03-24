<?php
/**
 * เมนูล่อง BOATLY (4 ปุ่ม) — ใช้กับ index.html แบบเดียวกัน
 * @var string $boatlyNavActive home | bookings | plan | explore
 */
if (!function_exists('baseUrl')) {
    require_once __DIR__ . '/db.php';
}
$boatlyNavActive = $boatlyNavActive ?? 'home';
$tabs = [
    'home'     => ['href' => baseUrl('/index.html'), 'icon' => 'fa-house', 'label' => 'หน้าแรก', 'key' => 'nav_home'],
    'bookings' => ['href' => baseUrl('/index.html?open=bookings'), 'icon' => 'fa-ticket', 'label' => 'เรือที่จอง', 'key' => 'nav_bookings'],
    'plan'     => ['href' => baseUrl('/planner'), 'icon' => 'fa-route', 'label' => 'วางแผน', 'key' => null],
    'explore'  => ['href' => baseUrl('/boats'), 'icon' => 'fa-compass', 'label' => 'สำรวจ', 'key' => null],
];
$order = ['home', 'bookings', 'plan', 'explore'];
$activeIndex = array_search($boatlyNavActive, $order, true);
if ($activeIndex === false) {
    $activeIndex = 0;
}
$indicatorLeft = ($activeIndex * 25) . '%';
?>
<link rel="stylesheet" href="<?= e(asset('css/boatly-nav.css')) ?>">
<nav class="boatly-bottom-nav bottom-nav bottom-nav--floating" aria-label="เมนูหลักล่าง">
  <div class="bottom-nav-inner">
    <div class="bottom-nav-pill-indicator" style="left:<?= e($indicatorLeft) ?>"></div>
    <?php foreach ($order as $k) :
        $t = $tabs[$k];
        $isActive = ($boatlyNavActive === $k);
        ?>
    <a class="nav-item<?= $isActive ? ' active' : '' ?>"
       href="<?= e($t['href']) ?>">
      <i class="fas <?= e($t['icon']) ?>"></i>
      <span<?= !empty($t['key']) ? ' data-t="' . e($t['key']) . '"' : '' ?>><?= e($t['label']) ?></span>
    </a>
    <?php endforeach; ?>
  </div>
</nav>
<div class="boatly-nav-spacer"></div>
