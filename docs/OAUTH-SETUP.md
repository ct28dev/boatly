# OAuth Setup (Google & Line Login)

**ระบบจะตั้งค่าอัตโนมัติ:** ไฟล์ `oauth.local.php` และคอลัมน์ในฐานข้อมูลจะถูกสร้างให้เอง

## 1. Google Sign-In

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. สร้าง OAuth 2.0 Client ID (Web application)
3. ใส่ **Authorized JavaScript origins**: `http://localhost` หรือโดเมนจริง
4. คัดลอก Client ID

## 3. Line Login

1. ไปที่ [Line Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider และ Channel (LINE Login)
3. ใส่ **Callback URL**: `http://localhost/boatly/api/auth/line-callback` หรือโดเมนจริง
4. คัดลอก Channel ID และ Channel Secret

## 4. ตั้งค่า Config

ไฟล์ `api/config/oauth.local.php` จะถูกสร้างอัตโนมัติเมื่อโหลดครั้งแรก  
แก้ไขไฟล์นี้เพื่อใส่ Client ID และ Secret:

**หรือใช้ environment variables** (เหมาะกับ production): รองรับชื่อใหม่ `BOATLY_GOOGLE_CLIENT_ID`, `BOATLY_LINE_CHANNEL_ID`, `BOATLY_LINE_CHANNEL_SECRET` และยังรองรับชื่อเดิม `BOATHUB_*` แบบเดิม

```php
return [
    'google' => [
        'client_id' => 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        'enabled'   => true,
    ],
    'line' => [
        'channel_id'     => 'YOUR_LINE_CHANNEL_ID',
        'channel_secret' => 'YOUR_LINE_CHANNEL_SECRET',
        'enabled'        => true,
    ],
];
```

## 5. ทดสอบ

เมื่อใส่ Client ID / Secret ใน `oauth.local.php` แล้ว ปุ่ม "Sign in with Google" และ "Sign in with Line" จะแสดงในหน้า Login และ Register อัตโนมัติ
