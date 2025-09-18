# ระบบจัดการฝึกประสบการณ์วิชาชีพ

ระบบจัดการฝึกประสบการณ์วิชาชีพสำหรับนักศึกษาครู เป็นระบบที่ช่วยในการจัดการข้อมูลโรงเรียน, นักศึกษา, ครูพี่เลี้ยง, อาจารย์นิเทศ และการประเมินผลการฝึกประสบการณ์

## 📋 สารบัญ

- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้ง](#การติดตั้ง)
  - [1. ติดตั้ง XAMPP](#1-ติดตั้ง-xampp)
  - [2. สร้างฐานข้อมูล](#2-สร้างฐานข้อมูล)
  - [3. ตั้งค่าการเชื่อมต่อฐานข้อมูล](#3-ตั้งค่าการเชื่อมต่อฐานข้อมูล)
  - [4. ติดตั้ง Dependencies](#4-ติดตั้ง-dependencies)
- [การรันโปรเจค](#การรันโปรเจค)
- [การใช้งานระบบ](#การใช้งานระบบ)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [API Endpoints](#api-endpoints)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

## 🖥️ ความต้องการของระบบ

### Software Requirements
- **Node.js** (v16 หรือสูงกว่า)
- **npm** (v8 หรือสูงกว่า)
- **XAMPP** (v8.0 หรือสูงกว่า)
- **MySQL** (v8.0 หรือสูงกว่า)
- **Git**

### Browser Support
- Chrome (แนะนำ)
- Firefox
- Safari
- Edge

## 🚀 การติดตั้ง

### 1. ติดตั้ง XAMPP

1. ดาวน์โหลด XAMPP จาก [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. ติดตั้ง XAMPP ตามขั้นตอนปกติ
3. เปิด XAMPP Control Panel
4. เริ่ม Apache และ MySQL services

```
✅ Apache - Running
✅ MySQL - Running
```

### 2. สร้างฐานข้อมูล

1. เปิดเว็บเบราว์เซอร์และไปที่ `http://localhost/phpmyadmin`
2. คลิกที่แท็บ "SQL"
3. คัดลอกและวางโค้ด SQL จากไฟล์ `daily.sql` ทั้งหมด
4. คลิก "Go" เพื่อรันคำสั่ง SQL

```sql
-- ตัวอย่างคำสั่ง SQL ที่ต้องรัน
CREATE DATABASE IF NOT EXISTS internship_management;
USE internship_management;

-- สร้างตาราง users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('student', 'teacher', 'supervisor', 'admin') NOT NULL,
    student_code VARCHAR(20),
    faculty VARCHAR(100),
    major VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ... (โค้ด SQL อื่นๆ จากไฟล์ daily.sql)
```

5. ตรวจสอบว่าฐานข้อมูลถูกสร้างเรียบร้อยแล้ว

### 3. ตั้งค่าการเชื่อมต่อฐานข้อมูล

1. เปิดไฟล์ `backend/.env` (ถ้าไม่มีให้สร้างใหม่)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=internship_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

2. แก้ไขค่าต่างๆ ตามการตั้งค่าของคุณ:
   - `DB_PASSWORD`: รหัสผ่าน MySQL (ถ้ามี)
   - `JWT_SECRET`: คีย์ลับสำหรับ JWT (ควรเป็นค่าที่ซับซ้อน)
   - `PORT`: พอร์ตของ backend server

### 4. ติดตั้ง Dependencies

#### Backend Dependencies
```bash
# ไปที่โฟลเดอร์ backend
cd backend

# ติดตั้ง dependencies
npm install

# ตรวจสอบการติดตั้ง
npm list
```

#### Frontend Dependencies
```bash
# ไปที่โฟลเดอร์ frontend
cd frontend

# ติดตั้ง dependencies
npm install

# ตรวจสอบการติดตั้ง
npm list
```

## 🔧 การรันโปรเจค

### 1. ตรวจสอบการเชื่อมต่อฐานข้อมูล

#### วิธีที่ 1: ใช้ phpMyAdmin
1. เปิด `http://localhost/phpmyadmin`
2. ตรวจสอบว่าฐานข้อมูล `internship_management` ปรากฏในรายการ
3. คลิกที่ฐานข้อมูลเพื่อดูตารางต่างๆ

#### วิธีที่ 2: ใช้ Command Line
```bash
# ไปที่โฟลเดอร์ backend
cd backend

# รันคำสั่งทดสอบการเชื่อมต่อ
node -e "
const { db } = require('./config/database');
db.query('SELECT 1 as test').then(() => {
  console.log('✅ Database connection successful!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"
```

**ผลลัพธ์ที่ควรเห็น:**
```
✅ Database connection successful!
```

### 2. รัน Backend Server

```bash
# ไปที่โฟลเดอร์ backend
cd backend

# รัน server
npm start
# หรือ
node server.js
```

**ผลลัพธ์ที่ควรเห็น:**
```
🚀 Server is running on port 3000
📊 Database connected successfully
🔗 API endpoints available at http://localhost:3000/api
```

### 3. รัน Frontend Development Server

เปิด terminal ใหม่:

```bash
# ไปที่โฟลเดอร์ frontend
cd frontend

# รัน development server
npm run dev
```

**ผลลัพธ์ที่ควรเห็น:**
```
  VITE v7.1.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 4. ตรวจสอบการทำงานของระบบ

1. เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost:5173`
2. ควรเห็นหน้า Login ของระบบ
3. ทดสอบเข้าสู่ระบบด้วยบัญชี admin:
   - **Username**: admin
   - **Password**: admin123

## 👥 การใช้งานระบบ

### บัญชีผู้ใช้เริ่มต้น

| Role | Username | Password | คำอธิบาย |
|------|----------|----------|----------|
| Admin | admin | admin123 | ผู้ดูแลระบบ |
| Supervisor | supervisor | supervisor123 | อาจารย์นิเทศ |
| Teacher | teacher | teacher123 | ครูพี่เลี้ยง |
| Student | student | student123 | นักศึกษา |

### ฟีเจอร์หลัก

#### สำหรับ Admin
- 📊 **Dashboard**: ภาพรวมระบบ
- 📈 **Reports**: รายงานและสถิติ
- 👥 **จัดการผู้ใช้**: เพิ่ม/แก้ไข/ลบผู้ใช้
- 🏫 **จัดการโรงเรียน**: เพิ่ม/แก้ไข/ลบโรงเรียน
- 📝 **จัดการบันทึกฝึกประสบการณ์**: ดู/แก้ไข/ลบบันทึก
- 📋 **จัดการการประเมิน**: ดู/แก้ไข/ลบการประเมิน

#### สำหรับ Supervisor
- 📊 **Dashboard**: ภาพรวมการนิเทศ
- 🏫 **โรงเรียน**: ดูข้อมูลโรงเรียนและนักศึกษา
- 📋 **ประเมิน**: ประเมินนักศึกษา
- 💬 **แชท**: สื่อสารกับผู้ใช้
- 📈 **รายงาน**: รายงานการนิเทศ

#### สำหรับ Teacher
- 📊 **Dashboard**: ภาพรวมการดูแล
- 👨‍🎓 **นักศึกษา**: ดูข้อมูลนักศึกษา
- 📋 **ประเมิน**: ประเมินนักศึกษา
- 🏫 **โรงเรียน**: ข้อมูลโรงเรียน
- 💬 **แชท**: สื่อสารกับนักศึกษา

#### สำหรับ Student
- 📊 **Dashboard**: ภาพรวมการฝึก
- 🏫 **เลือกโรงเรียน**: สมัครฝึกประสบการณ์
- 📝 **แผนการสอน**: สร้างและจัดการแผนการสอน
- 📚 **บันทึกฝึกประสบการณ์**: บันทึกการฝึกสอน
- 📋 **การประเมิน**: ดูผลการประเมิน
- 💬 **แชท**: สื่อสารกับครูพี่เลี้ยง

## 📁 โครงสร้างโปรเจค

```
dollar/
├── backend/                 # Backend API
│   ├── config/             # การตั้งค่า
│   │   └── database.js     # การเชื่อมต่อฐานข้อมูล
│   ├── controllers/        # Business Logic
│   ├── middleware/         # Middleware functions
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── .env               # Environment variables
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/              # Frontend React App
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
│   ├── index.html         # HTML template
│   └── package.json       # Frontend dependencies
├── daily.sql              # Database schema
└── README.md              # เอกสารนี้
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/logout` - ออกจากระบบ

### Admin APIs
- `GET /api/admin/dashboard` - ข้อมูลแดชบอร์ด
- `GET /api/admin/reports` - รายงาน
- `GET /api/admin/users` - รายการผู้ใช้
- `POST /api/admin/users` - สร้างผู้ใช้
- `PUT /api/admin/users/:id` - แก้ไขผู้ใช้
- `DELETE /api/admin/users/:id` - ลบผู้ใช้

### Supervisor APIs
- `GET /api/supervisor/dashboard` - ข้อมูลแดชบอร์ด
- `GET /api/supervisor/schools` - รายการโรงเรียน
- `GET /api/supervisor/evaluations` - การประเมิน
- `POST /api/supervisor/evaluations/:id` - ส่งการประเมิน

### Teacher APIs
- `GET /api/teacher/dashboard` - ข้อมูลแดชบอร์ด
- `GET /api/teacher/students` - รายการนักศึกษา
- `GET /api/teacher/school` - ข้อมูลโรงเรียน

### Student APIs
- `GET /api/student/dashboard` - ข้อมูลแดชบอร์ด
- `GET /api/student/schools` - รายการโรงเรียน
- `POST /api/student/register-school` - สมัครโรงเรียน
- `GET /api/student/lesson-plans` - แผนการสอน
- `POST /api/student/lesson-plans` - สร้างแผนการสอน

## 🛠️ การแก้ไขปัญหา

### ปัญหาการเชื่อมต่อฐานข้อมูล

**Error: `ECONNREFUSED`**
```bash
# ตรวจสอบว่า MySQL ทำงานอยู่
# ใน XAMPP Control Panel ตรวจสอบว่า MySQL เป็น "Running"
```

**Error: `Access denied for user 'root'@'localhost'`**
```bash
# ตรวจสอบรหัสผ่านในไฟล์ .env
DB_PASSWORD=your_mysql_password
```

**Error: `Unknown database 'internship_management'`**
```bash
# รันไฟล์ daily.sql ใน phpMyAdmin อีกครั้ง
# หรือสร้างฐานข้อมูลด้วยตนเอง:
CREATE DATABASE internship_management;
```

### ปัญหา Port ถูกใช้งาน

**Error: `Port 3000 is already in use`**
```bash
# เปลี่ยนพอร์ตในไฟล์ .env
PORT=3001

# หรือหยุด process ที่ใช้พอร์ต 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

**Error: `Port 5173 is already in use`**
```bash
# Vite จะใช้พอร์ตถัดไปอัตโนมัติ
# หรือระบุพอร์ตเอง:
npm run dev -- --port 5174
```

### ปัญหา Dependencies

**Error: `Module not found`**
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
```

**Error: `Permission denied`**
```bash
# ใช้ sudo (Mac/Linux) หรือ Run as Administrator (Windows)
sudo npm install
```

### ปัญหา Build

**Error: `TypeScript compilation failed`**
```bash
# ตรวจสอบ TypeScript errors
npm run build

# แก้ไข errors ที่แสดง
# หรือใช้ --no-check สำหรับ development
npm run dev -- --no-check
```

## 📞 การติดต่อและสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ [การแก้ไขปัญหา](#การแก้ไขปัญหา) ก่อน
2. ตรวจสอบ console logs ใน browser และ terminal
3. ตรวจสอบ network tab ใน browser developer tools
4. ตรวจสอบ database ใน phpMyAdmin

## 📝 หมายเหตุ

- ระบบนี้ใช้สำหรับการฝึกประสบการณ์วิชาชีพเท่านั้น
- ควรเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งานจริง
- ควรสำรองข้อมูลฐานข้อมูลเป็นประจำ
- ระบบรองรับการใช้งานในสภาพแวดล้อม development เท่านั้น

---

**สร้างโดย**: ระบบจัดการฝึกประสบการณ์วิชาชีพ  
**เวอร์ชัน**: 1.0.0  
**อัปเดตล่าสุด**: 2024
#   -  
 