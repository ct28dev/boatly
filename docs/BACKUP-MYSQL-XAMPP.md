# สำรองฐานข้อมูล MySQL (XAMPP / macOS)

คู่มือสำหรับโปรเจกต์ BOATLY ที่รัน PHP + MySQL ผ่าน XAMPP บนเครื่อง Mac

## สคริปต์

| ไฟล์ | คำอธิบาย |
|------|----------|
| [`infrastructure/ci-cd/scripts/backup-mysql-xampp.sh`](../infrastructure/ci-cd/scripts/backup-mysql-xampp.sh) | `mysqldump` + บีบอัด `.gz` + ลบไฟล์เก่าตามวัน |

ค่าเริ่มต้น:

- `mysqldump`: `/Applications/XAMPP/xamppfiles/bin/mysqldump`
- Host: `127.0.0.1` (ใช้ TCP — เหมาะกับ cron)
- User: `root` / รหัสผ่านว่าง (ตรงกับ `api/config/database.php` แบบ dev)
- ฐานข้อมูล: `boatly`
- โฟลเดอร์สำรอง: `~/boatly-backups/mysql`

## รันครั้งเดียว (ทดสอบ)

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/boatly
chmod +x infrastructure/ci-cd/scripts/backup-mysql-xampp.sh
./infrastructure/ci-cd/scripts/backup-mysql-xampp.sh
```

เปิด MySQL ใน XAMPP ให้รันก่อน มิฉะนั้นสคริปต์จะแจ้ง error

## ตั้งรหัสผ่าน MySQL (ถ้ามี)

```bash
export DB_PASSWORD='yourpassword'
./infrastructure/ci-cd/scripts/backup-mysql-xampp.sh
```

หรือตั้งถาวรใน `~/.zshrc` / `~/.bash_profile` เฉพาะเครื่อง dev

## เปลี่ยนโฟลเดอร์เก็บไฟล์

```bash
BACKUP_DIR="$HOME/Documents/boatly-sql-backups" ./infrastructure/ci-cd/scripts/backup-mysql-xampp.sh
```

## Cron — ตัวอย่าง (วันละ 2 ครั้ง: 14:00 และ 21:00)

1. `crontab -e`
2. ใส่บรรทัด (ปรับ path ให้ตรงเครื่องคุณ):

```cron
0 14 * * * /Applications/XAMPP/xamppfiles/htdocs/boatly/infrastructure/ci-cd/scripts/backup-mysql-xampp.sh >>$HOME/boatly-backups/backup-mysql.log 2>&1
0 21 * * * /Applications/XAMPP/xamppfiles/htdocs/boatly/infrastructure/ci-cd/scripts/backup-mysql-xampp.sh >>$HOME/boatly-backups/backup-mysql.log 2>&1
```

หมายเหตุ: บน macOS ต้องให้ cron มีสิทธิ์เข้า Full Disk Access ถ้าเก็บไฟล์ในโฟลเดอร์ที่จำกัดสิทธิ์ — โดยทั่วไป `~/boatly-backups` ใช้ได้

## อัปโหลด S3 (ถ้ามี AWS CLI)

```bash
./infrastructure/ci-cd/scripts/backup-mysql-xampp.sh --upload-s3
```

ต้อง `aws configure` แล้ว และตั้ง `S3_BUCKET` ถ้าไม่ใช้ค่า default

## กู้คืนจากไฟล์ `.sql.gz`

```bash
gunzip -c ~/boatly-backups/mysql/boatly_boatly_YYYYMMDD_HHMMSS.sql.gz | \
  /Applications/XAMPP/xamppfiles/bin/mysql -h 127.0.0.1 -u root boatly
```

ถ้าฐานยังไม่มี ให้สร้างก่อน:

```bash
/Applications/XAMPP/xamppfiles/bin/mysql -h 127.0.0.1 -u root -e "CREATE DATABASE IF NOT EXISTS boatly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## หมายเหตุทางเทคนิค

- สคริปต์ใช้ `--skip-routines` เพราะ schema MySQL ของ BOATLY ไม่ใช้ stored procedure/function และการดึง routines บางครั้งพังหลังอัปเกรด MariaDB แบบไม่รัน `mysql_upgrade` ถ้าคุณเพิ่ม routine ใน DB เอง ให้แก้สคริปต์เอา `--skip-routines` ออก (และควรรัน `mysql_upgrade` บน XAMPP ให้สอดคล้องกับเวอร์ชัน MariaDB)

## ควรทำเป็นประจำ

- ทดสอบ **restore** จากไฟล์สำรองบางไฟล์เป็นครั้งคราว (ไม่ใช่แค่มีไฟล์)
- เก็บสำเนา **นอกเครื่อง** (cloud, ดิสก์ภายนอก) อย่างน้อยรายสัปดาห์ถ้าเป็นข้อมูลสำคัญ

---

## English summary

The script dumps the `boatly` MySQL database using XAMPP’s `mysqldump`, gzips it under `~/boatly-backups/mysql`, rotates old files, and optionally uploads to S3. Use environment variables to override host, user, password, and paths. Schedule with `cron` and **test restores** periodically.
