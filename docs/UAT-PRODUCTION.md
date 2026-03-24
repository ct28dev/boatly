# UAT Checklist - Production-Ready (Full Travel Platform)

## ก่อนเริ่ม UAT

1. **รัน XAMPP** – Apache + MySQL
2. **รัน Migration** – เปิด `http://localhost/boatly/api/` ครั้งแรกจะสร้างตารางใหม่อัตโนมัติ
3. **ข้อมูลทดสอบ** – มี operators, boats, destinations, availability

---

## หลักการสำคัญ (ล็อกก่อนเริ่ม)

- ❌ ไม่แก้ตาราง/โค้ดเดิมที่ stable
- ✅ เพิ่ม Service + Table + API ใหม่เท่านั้น
- ✅ ทุกระบบเชื่อมผ่าน API Contract เดียวกัน
- ✅ รองรับ Feature Toggle (เปิด/ปิด) เช่น Dynamic Pricing, AI Recommendation

---

## 1. AI Recommendation

### 1.1 กดแล้วได้ plan จริง
- [ ] POST `/api/ai/recommend` ด้วย `{ "location": "อยุธยา", "people": 4, "budget": 3000, "interests": ["วัด","ชิล"] }`
- [ ] Response มี `route`, `timeline`, `boat_type`, `location_label`, `source` (`destinations` | `boats` | `template`), `matched_boat_ids` (เมื่อ match จากเรือในแพลตฟอร์ม)
- [ ] ลอง `location` เป็นจังหวัดอื่น (เช่น พังงา) → ข้อความใน route/timeline **สื่อชื่อจังหวัด** (อย่างน้อยในโหมด `template`) หรือดึงจาก `destinations`/`boats` ถ้ามีข้อมูล
- [ ] `route` เป็น array สถานที่ (เช่น ท่าเรือ, วัด, ร้านอาหาร)
- [ ] `timeline` มี time, place, activity

### 1.2 Plan เข้า timeline
- [ ] `timeline` แสดงลำดับเวลาชัดเจน (09:00, 09:45, ...)
- [ ] สถานที่ใน route สอดคล้องกับ interests
- [ ] budget ≥ 8000 → boat_type = "private" | budget < 8000 → boat_type = "shared"

### 1.3 Feature Toggle
- [ ] `ai_recommendation` = false → ได้ fallback plan (อยุธยา default)
- [ ] `ai_recommendation` = true → ได้ plan จาก DB (destinations)

### 1.4 Logging
- [ ] บันทึกลง `ai_logs` (user_id, input_json, output_json)

---

## 2. Matching Engine

### 2.1 ไม่มีเรือซ้ำเวลา
- [ ] POST `/api/match/boats` ด้วย `{ "date": "2026-04-01", "time": "10:00", "people": 4, "location": "อยุธยา" }`
- [ ] เรือที่ `available = false` (slot เต็ม) ได้คะแนนต่ำหรือไม่แสดง
- [ ] เรือที่ `slot_ok > 0` ได้คะแนนสูง (available = true)

### 2.2 เลือกเรือได้จริง
- [ ] Response เป็น `[{ boat_id, score, name, price, available }, ...]`
- [ ] เรียงตาม score จากมากไปน้อย
- [ ] คลิก boat_id นำไปหน้า booking ได้

### 2.3 Scoring Logic
- [ ] ราคาต่ำ → คะแนนสูง
- [ ] rating สูง → คะแนนสูง
- [ ] available = true → +500 คะแนน
- [ ] capacity ≥ people → +100 คะแนน

---

## 3. Booking

### 3.1 ราคาไม่เพี้ยน
- [ ] ราคาที่แสดง = base price × multiplier (เมื่อ dynamic pricing เปิด)
- [ ] ราคาสรุปก่อนชำระตรงกับที่คำนวณ

### 3.2 Dynamic Pricing เปิด/ปิดได้
- [ ] Admin → Settings → Dynamic Pricing → เปิด
- [ ] ตรวจสอบ `feature_flags.dynamic_pricing = 1`
- [ ] ราคาใช้ multiplier จาก pricing_rules
- [ ] ปิด Dynamic Pricing
- [ ] ราคา = base price (multiplier = 1.0)

### 3.3 Lock booking (ป้องกัน double booking)
- [ ] จอง slot ที่มีคนจองแล้ว → ได้ error หรือ slot ไม่ available
- [ ] จองซ้ำเวลาเดียวกัน → ไม่สร้าง booking ซ้ำ

---

## 4. Chat + Tracking

### 4.1 Real-time
- [ ] ส่งข้อความ → ปรากฏทันที
- [ ] ฝั่ง operator เห็นข้อความลูกค้าทันที

### 4.2 ไม่หลุด connection
- [ ] เปิดหน้า chat นาน 5 นาที → ยังส่ง/รับได้
- [ ] Refresh หน้า → ข้อความเดิมยังอยู่

---

## 5. Tip

### 5.1 ไม่บังคับ
- [ ] ปุ่ม "ให้ทิป" ไม่บังคับ
- [ ] กด "ไม่ตอนนี้" ได้

### 5.2 เงินเข้า DB
- [ ] ให้ทิป 100 บาท
- [ ] `booking_tips` มี record ใหม่
- [ ] `tip_distribution` มี captain, staff, platform
- [ ] `revenues` มี record type = 'tip' (platform 20%)

---

## 6. Revenue

### 6.1 Commission ถูก
- [ ] หลังชำระเงิน booking → `revenues` มี commission 15%, platform_fee 5%
- [ ] reference_id = booking_id

### 6.2 Dashboard แสดงถูก
- [ ] GET `/api/revenue/summary` (operator) → แสดงเฉพาะ operator_id ของตน
- [ ] GET `/api/revenue/summary` (admin) → แสดงทั้งหมด
- [ ] แยก type: commission, platform_fee, tip, subscription

---

## 7. Feature Flags

### 7.1 Dynamic Pricing
- [ ] GET `/api/feature-flags` → มี `dynamic_pricing`
- [ ] PUT `/api/feature-flags` (admin) → อัปเดต `dynamic_pricing`
- [ ] Admin toggle Dynamic Pricing → sync กับ `feature_flags`

### 7.2 AI Recommendation
- [ ] GET `/api/feature-flags` → มี `ai_recommendation`
- [ ] PUT `/api/feature-flags` → อัปเดต `ai_recommendation`
- [ ] ai_recommendation = false → ใช้ fallback plan

---

## 8. Security + Stability

### 8.1 JWT Auth
- [ ] API ที่ต้อง auth → ส่ง token ไม่ถูกต้อง → 401
- [ ] Token หมดอายุ → 401

### 8.2 Rate limit API
- [ ] (ถ้ามี) เรียก API ซ้ำมาก → 429

### 8.3 Validate payment
- [ ] ชำระเงินสำเร็จ → booking status อัปเดต
- [ ] revenue บันทึกหลัง payment confirm

---

## 9. Subscription (Partner)

### 9.1 Status
- [ ] GET `/api/subscription/status` (partner) → plan, status, start_date, end_date

### 9.2 Upgrade
- [ ] POST `/api/subscription/upgrade` → อัปเดต plan

---

## 10. สรุปผล UAT

| หัวข้อ | ผล | หมายเหตุ |
|-------|-----|----------|
| AI Recommendation | ☐ Pass ☐ Fail | |
| Matching Engine | ☐ Pass ☐ Fail | |
| Booking | ☐ Pass ☐ Fail | |
| Chat + Tracking | ☐ Pass ☐ Fail | |
| Tip | ☐ Pass ☐ Fail | |
| Revenue | ☐ Pass ☐ Fail | |
| Feature Flags | ☐ Pass ☐ Fail | |
| Security | ☐ Pass ☐ Fail | |

**วันที่ทดสอบ:** _______________  
**ผู้ทดสอบ:** _______________

---

## API Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/recommend` | POST | AI แนะนำทริป |
| `/api/match/boats` | POST | Matching เรือ |
| `/api/subscription/status` | GET | สถานะ subscription |
| `/api/subscription/upgrade` | POST | อัปเกรด plan |
| `/api/revenue/summary` | GET | สรุป revenue |
| `/api/feature-flags` | GET/PUT | Feature flags (PUT = admin) |
