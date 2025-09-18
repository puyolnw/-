# วิธีติดตั้งและรันโปรเจค

## 📋 สิ่งที่ต้องมี
- XAMPP
- Node.js
- Git

## 🚀 ขั้นตอนการติดตั้ง

### 1. ติดตั้ง XAMPP
1. ดาวน์โหลด XAMPP จาก [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. ติดตั้งตามปกติ
3. เปิด XAMPP Control Panel
4. เริ่ม **Apache** และ **MySQL**

### 2. สร้างฐานข้อมูล
1. เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost/phpmyadmin`
2. คลิกแท็บ **SQL**
3. สร้างฐานข้อมูลก่อน:
```sql
CREATE DATABASE IF NOT EXISTS daily 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```
4. คลิก **Go** เพื่อสร้างฐานข้อมูล
5. คัดลอกโค้ดทั้งหมดจากไฟล์ `daily.sql` มาวาง
6. คลิก **Go** เพื่อรัน

### 3. ตั้งค่าการเชื่อมต่อฐานข้อมูล
1. เปิดไฟล์ `backend/.env`
2. แก้ไขค่าต่างๆ:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=daily
JWT_SECRET=your_secret_key_here
PORT=3000
```

### 4. ติดตั้ง Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

## ▶️ วิธีรันโปรเจค

### 1. รัน Backend
```bash
cd backend
node server.js
```
**ควรเห็น:**
```
🚀 Server is running on port 3000
📊 Database connected successfully
```

### 2. รัน Frontend
เปิด terminal ใหม่:
```bash
cd frontend
npm run dev
```
**ควรเห็น:**
```
Local: http://localhost:5173/
```