# UAT Checklist - Live Tracking, Chat, Dynamic Pricing

## ก่อนเริ่ม UAT

1. **รัน Socket Server**: `npm run socket` (หรือ `node socket-server.js`) ที่โฟลเดอร์ boatly
2. **รัน XAMPP**: Apache + MySQL
3. **เปิด Dynamic Pricing**: Admin → Settings → Dynamic Pricing → เปิด
4. **สร้าง pricing_rules** (ถ้าต้องการทดสอบ): INSERT ลง pricing_rules (name, multiplier, start_date, end_date, is_active)

---

## 1. Live Tracking

### 1.1 Boat Captain (ส่ง GPS)
- [ ] เปิด `http://localhost/boatly/pages/captain/track.html`
- [ ] ใส่เลขการจอง (booking id)
- [ ] กด "เริ่มส่งตำแหน่ง"
- [ ] อนุญาต GPS เมื่อเบราว์เซอร์ถาม
- [ ] แสดงสถานะ "กำลังส่งตำแหน่ง... lat, lng"
- [ ] กด "หยุดส่ง" → หยุด

### 1.2 ลูกค้า (รับตำแหน่ง)
- [ ] Login เป็นลูกค้าที่มีการจอง status = confirmed
- [ ] เปิด My Bookings → รายละเอียดการจอง
- [ ] เห็นส่วน **Live Tracking** + แผนที่
- [ ] เมื่อ Captain ส่ง GPS → marker บนแผนที่ขยับ
- [ ] delay < 3 วินาที

### 1.3 Security
- [ ] GPS ส่งเฉพาะ room booking_id นั้น
- [ ] ลูกค้าเห็นเฉพาะการจองของตัวเอง

---

## 2. Chat

### 2.1 ลูกค้า
- [ ] เปิด booking detail (status confirmed)
- [ ] เห็นส่วน **แชทกับทีมงาน**
- [ ] พิมพ์ข้อความ → กดส่ง
- [ ] ข้อความแสดงในแชท (คุณ: ...)

### 2.2 ทีมงาน (Operator)
- [ ] Login Operator Dashboard
- [ ] เปิดการจองที่ confirmed
- [ ] เห็นแชท (หรือต้องมีหน้าแชทใน Operator?)
- [ ] ส่งข้อความ → แสดงเป็น "ทีมงาน"

### 2.3 Real-time
- [ ] ฝั่งหนึ่งส่ง → อีกฝั่งเห็นทันที (ถ้าเปิดอยู่)
- [ ] ข้อความไม่หาย (โหลดจาก API ได้)

### 2.4 หลังจบทริป
- [ ] status = completed → แชทไม่แสดง (ปิดอัตโนมัติ)

---

## 3. Dynamic Pricing

### 3.1 Admin เปิด/ปิด
- [ ] Admin → Settings → Dynamic Pricing
- [ ] เปิด toggle → บันทึก
- [ ] ปิด toggle → บันทึก

### 3.2 ราคาคำนวณ
- [ ] สร้าง pricing_rule: multiplier 1.5, start_date วันนี้, end_date วันนี้
- [ ] เปิด Dynamic Pricing
- [ ] จองเรือ → ราคา = basePrice × 1.5
- [ ] ปิด Dynamic Pricing → ราคา = basePrice

### 3.3 ตัวอย่าง
- Low season → x1.0
- High season → x1.5
- Holiday → x2.0

---

## 4. Integration Flow

```
Booking (confirmed)
    ↓
Live Tracking (Captain ส่ง GPS → ลูกค้าเห็นแผนที่)
    ↓
Chat (ลูกค้า ↔ ทีมงาน)
    ↓
Trip Complete (Operator กด "งานสำเร็จ")
    ↓
Review + Tip
```

---

## 5. สรุปผล UAT

| หัวข้อ | ผล | หมายเหตุ |
|-------|-----|----------|
| Live Tracking | ☐ Pass ☐ Fail | |
| Chat | ☐ Pass ☐ Fail | |
| Dynamic Pricing | ☐ Pass ☐ Fail | |
| Integration | ☐ Pass ☐ Fail | |

**วันที่ทดสอบ:** _______________  
**ผู้ทดสอบ:** _______________
