# ย้ายโฟลเดอร์ `boathub` → `boatly` (XAMPP / production)

โค้ดรองรับทั้ง **URL `/boatly`** (ค่าเริ่มต้น) และ **legacy `/boathub`** ชั่วคราว (ลิงก์เก่า, bookmark)

## 1. เปลี่ยนชื่อโฟลเดอร์ใน htdocs

```bash
cd /Applications/XAMPP/xamppfiles/htdocs
mv boathub boatly
```

จากนั้นเปิดแอปที่ **`http://localhost/boatly/`** (แทน `/boathub/`)

## 2. MySQL — เปลี่ยนชื่อ database (ถ้าใช้ `setup.php` / API PHP เดิม)

ถ้าเคยใช้ฐานชื่อ `boathub` ให้สร้างฐานใหม่หรือ rename:

```sql
-- ตัวอย่าง rename (หยุดแอปก่อน, สำรองข้อมูลก่อนเสมอ)
CREATE DATABASE boatly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- จากนั้น mysqldump boathub | mysql boatly หรือใช้เครื่องมือ GUI
```

อัปเดต `api/config/database.php` ใช้ `boatly` เป็นค่าเริ่มต้นแล้ว — ตรวจสอบ user/password ในเครื่องคุณ

## 3. Line / Google OAuth

อัปเดต **Callback URL** ใน Console เป็น:

`https://yourdomain.com/boatly/api/auth/line-callback`

(หรือคง `/boathub/` ไว้ชั่วคราวถ้ายังไม่ย้ายโฟลเดอร์)

## 4. `assets/config.js`

ตั้ง `window.BOATLY_PUBLIC_URL = 'https://yourdomain.com/boatly'` เมื่อ deploy

## 5. Monorepo (`@boatly/*`)

รัน `npm install` ที่ root หลัง pull เพื่อ sync workspace หลัง rename scope แพ็กเกจ
