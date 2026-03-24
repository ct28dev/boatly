/**
 * BOATLY - App Config
 * ตั้งค่า URL สาธารณะเมื่อ deploy ขึ้น server เพื่อให้ลิงก์แชร์ (Line, Facebook ฯลฯ) เปิดได้
 *
 * ตัวอย่าง:
 *   Production: window.BOATLY_PUBLIC_URL = 'https://yourdomain.com/boatly';
 *   (รองรับเดิม) window.BOATHUB_PUBLIC_URL — ถ้าไม่ตั้ง BOATLY จะใช้ค่านี้
 *   ทดสอบ local ด้วย ngrok: window.BOATLY_PUBLIC_URL = 'https://xxxx.ngrok.io/boatly';
 *
 * ถ้าไม่ตั้งค่า ระบบจะใช้ URL ปัจจุบัน (localhost จะทำให้เพื่อนเปิดลิงก์จาก Line ไม่ได้)
 */
window.BOATLY_PUBLIC_URL = window.BOATLY_PUBLIC_URL || '';
window.BOATHUB_PUBLIC_URL = window.BOATHUB_PUBLIC_URL || window.BOATLY_PUBLIC_URL;
