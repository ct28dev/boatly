<?php
/**
 * การตั้งค่าอีเมลสำหรับ BOATLY
 * คัดลอกเป็น email.local.php เพื่อ override (ไม่ commit)
 */
return [
    'enabled' => true,
    'from_email' => 'noreply@boatly.th',
    'from_name' => 'BOATLY',
    'reply_to' => null,
    // สำหรับ SMTP (ถ้าใช้) - ใส่ใน email.local.php
    // 'smtp_host' => 'smtp.gmail.com',
    // 'smtp_port' => 587,
    // 'smtp_user' => '',
    // 'smtp_pass' => '',
    // 'smtp_secure' => 'tls',
];
