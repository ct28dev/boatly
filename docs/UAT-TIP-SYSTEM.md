# UAT Checklist - ระบบทิป (Tip System)

## ก่อนเริ่ม UAT

1. **รัน XAMPP** – Apache + MySQL
2. **สร้างข้อมูลทดสอบ** (ถ้ายังไม่มี):
   - เปิด `http://localhost/boatly/setup.php?action=add-operator` เพื่อสร้างพาร์ทเนอร์ somsak
   - สร้างการจองที่ status = `completed` (หรือใช้ Admin เปลี่ยนสถานะ)
3. **เปิดระบบทิป** – Admin → Settings → Tip System → เปิดใช้งาน
4. **ตั้งค่า PromptPay** – Operator Dashboard → ทิป → ใส่เบอร์ 10 หลัก

## ข้อมูลทดสอบ

| รายการ | ค่า |
|--------|-----|
| **URL หลัก** | http://localhost/boatly/ |
| **Operator Dashboard** | http://localhost/boatly/pages/operator/dashboard.php |
| **บัญชีทดสอบ Operator** | somsak@ayutthaya-boats.com / password123 |

---

## 1. Production Flow: Trip Completed → Review → Tip

### 1.1 เปิดระบบทิป (Admin)
- [ ] เข้า Admin → Settings → เปิด Tip System
- [ ] ตรวจสอบว่า Tip System แสดงสถานะ "เปิดใช้งาน"

### 1.2 เตรียมข้อมูล
- [ ] มีการจองที่ status = `completed`
- [ ] ลูกค้ายังไม่ได้รีวิว และยังไม่ได้ให้ทิป

### 1.3 Flow ลูกค้า (จากหน้า My Bookings)
- [ ] Login เป็นลูกค้าที่มี booking completed
- [ ] เปิดรายละเอียดการจอง
- [ ] เห็นปุ่ม **"เขียนรีวิว"** และ **"ให้ทิป"**
- [ ] คลิก **"เขียนรีวิว"** → เปิด Review Modal
- [ ] ให้คะแนน 4 หรือ 5 ดาว + เขียนความคิดเห็น
- [ ] กดส่งรีวิว
- [ ] **หลังรีวิวสำเร็จ** (rating ≥ 4): Tip Modal เปิดอัตโนมัติ
- [ ] เห็นข้อความ "วันนี้เรือ [ชื่อเรือ] ดูแลคุณนะครับ 🙏" (Human Connection)
- [ ] เห็นปุ่ม preset 20, 50, 100 บาท (AI Suggest: 5★→50฿, 4★→20฿)
- [ ] เลือกจำนวนทิป → กด **"ให้ทิป 💙"**
- [ ] เปิด QR Modal แสดง PromptPay QR
- [ ] กด **"ฉันโอนแล้ว"** (หรือจ่ายสดแล้วกดยืนยัน)
- [ ] แสดง toast "ขอบคุณสำหรับทิป!"
- [ ] ปุ่ม "ให้ทิป" หายไป (แสดงว่า tip_given = true)

### 1.4 Flow ให้ทิปโดยตรง (ไม่ผ่านรีวิว)
- [ ] เปิด booking detail ที่ completed
- [ ] คลิก **"ให้ทิป"** โดยตรง (ไม่เขียนรีวิวก่อน)
- [ ] Tip Modal เปิด พร้อม Human Connection
- [ ] เลือกจำนวน → QR → ยืนยันโอน
- [ ] บันทึกสำเร็จ

### 1.5 กรณีข้ามทิป (ไม่ตอนนี้)
- [ ] เปิด Tip Modal
- [ ] กด **"ไม่ตอนนี้"** → Modal ปิด
- [ ] ปุ่ม "ให้ทิป" ยังแสดงอยู่ (สามารถให้ทิปภายหลังได้)

---

## 2. ป้องกัน Duplicate Tip

- [ ] ให้ทิปสำเร็จแล้ว
- [ ] เปิด booking detail อีกครั้ง
- [ ] ปุ่ม "ให้ทิป" **ไม่แสดง** (เพราะ tip_given = true)
- [ ] (ถ้า bypass API) POST /bookings/{id}/tip ซ้ำ → ได้ error "การจองนี้ได้รับทิปแล้ว"

---

## 3. Operator Dashboard - Tip Report

### 3.1 เข้าสู่ระบบ
- [ ] Login ที่ Operator Dashboard
- [ ] ไปที่เมนู **"ทิป"**

### 3.2 ตั้งค่า PromptPay
- [ ] กรอกเบอร์ PromptPay (10-13 หลัก)
- [ ] กดบันทึก
- [ ] แสดงข้อความ "บันทึกเบอร์ PromptPay สำหรับรับทิปแล้ว"

### 3.3 Tip Report
- [ ] **ทิปทั้งหมด** แสดงยอดรวม
- [ ] **ทิปวันนี้** แสดงยอดวันนี้
- [ ] **Top Boat** แสดงชื่อเรือที่ได้รับทิปมากที่สุด (หรือ "-" ถ้าไม่มี)
- [ ] **กราฟ 7 วัน** แสดงแถบกราฟรายวัน
- [ ] ตารางรายการทิป แสดง Ref, ลูกค้า, เรือ, จำนวน, วันที่

### 3.4 การแจ้งเตือน
- [ ] เมื่อลูกค้าให้ทิป → Operator ได้ notification "ลูกค้าให้ทิป ฿XX"

---

## 4. Tip Distribution (Backend)

- [ ] หลังให้ทิป 100 บาท → ตรวจสอบ DB:
  - `tip_distribution`: captain 50฿, staff 30฿, platform 20฿
- [ ] ตาราง `booking_tips` มี record ใหม่
- [ ] ตาราง `tip_distribution` มี 3 แถวต่อ 1 tip

---

## 5. Edge Cases & Error Handling

### 5.1 ระบบทิปปิด
- [ ] ปิด Tip System ใน Admin
- [ ] ลูกค้าไม่เห็นปุ่ม "ให้ทิป"
- [ ] POST /bookings/{id}/tip → error "ระบบทิปปิดใช้งานอยู่"

### 5.2 Operator ยังไม่ตั้งค่า PromptPay
- [ ] Operator ไม่ได้ใส่เบอร์ PromptPay
- [ ] ลูกค้าให้ทิป → GET /tip/qr → error "พาร์ทเนอร์ยังไม่ได้ตั้งค่าเบอร์ PromptPay..."

### 5.3 การจองที่ยังไม่ completed
- [ ] Booking status = confirmed (ยังไม่ completed)
- [ ] ลูกค้าพยายามให้ทิป → error "สามารถให้ทิปได้หลังการจองยืนยันหรือเสร็จสิ้น"

### 5.4 ผู้ใช้ไม่ใช่เจ้าของการจอง
- [ ] User A จอง, User B พยายามให้ทิป → error "เฉพาะผู้จองเท่านั้นที่ให้ทิปได้"

### 5.5 จำนวนทิป = 0
- [ ] เลือก 0 บาท หรือไม่เลือก → ปุ่ม "ให้ทิป" disabled
- [ ] POST ด้วย amount=0 → error "กรุณาระบุจำนวนทิป"

---

## 6. UI / UX

- [ ] Tip Modal มี glass effect, animation
- [ ] ปุ่ม preset มี hover/active effect
- [ ] กราฟใน Dashboard แสดงถูกต้อง (ไม่มี NaN, ไม่ break layout)
- [ ] Mobile responsive

---

## 7. สรุปผล UAT

| หัวข้อ | ผล | หมายเหตุ |
|-------|-----|----------|
| Production Flow | ☐ Pass ☐ Fail | |
| Duplicate Prevention | ☐ Pass ☐ Fail | |
| Operator Dashboard | ☐ Pass ☐ Fail | |
| Tip Distribution | ☐ Pass ☐ Fail | |
| Edge Cases | ☐ Pass ☐ Fail | |
| UI/UX | ☐ Pass ☐ Fail | |

**วันที่ทดสอบ:** _______________  
**ผู้ทดสอบ:** _______________
