<?php
$pageTitle = 'วางแผนทริป';
$pageDescription = 'จัดแผนการเดินทางทางน้ำ แชร์แผนกับเพื่อน';
$bodyClass = 'page-planner';
require __DIR__ . '/../includes/header.php';
?>
<main class="page-content" style="padding-bottom: 24px;">
    <section class="hero-compact" style="padding-top: 100px; padding-bottom: 32px;">
        <div class="container">
            <h1 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 12px;">
                <i class="fas fa-route" style="color: var(--primary-light, #38bdf8);"></i> วางแผนทริป
            </h1>
            <p class="lead" style="color: #64748b; line-height: 1.6;">
                สร้างแผนการเดินทาง จัดลำดับสถานที่ และแชร์ลิงก์ให้เพื่อน — เปิดใช้งานเต็มรูปแบบในแอป BOATLY
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px;">
                <a href="<?= baseUrl('/index.html') ?>" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-arrow-right-to-bracket"></i> กลับไปแอป BOATLY
                </a>
                <a href="<?= baseUrl('/boats') ?>" style="display: inline-flex; align-items: center; gap: 8px; border: 2px solid #e2e8f0; color: #334155; padding: 10px 20px; border-radius: 12px; text-decoration: none; font-weight: 600;">
                    สำรวจทริป / เรือ
                </a>
            </div>
        </div>
    </section>
</main>
<?php
require __DIR__ . '/../includes/footer.php';
