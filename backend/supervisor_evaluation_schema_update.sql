-- เพิ่มคอลัมน์สำหรับการประเมินของอาจารย์นิเทศในตาราง completion_requests
-- เพิ่มเฉพาะคอลัมน์ที่ยังไม่มี

ALTER TABLE completion_requests 
ADD COLUMN IF NOT EXISTS supervisor_criteria_1 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 1: ความรู้ความเข้าใจในเนื้อหาวิชา (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_2 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 2: การวางแผนการสอน (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_3 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 3: การใช้สื่อและเทคโนโลยี (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_4 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 4: การจัดการชั้นเรียน (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_5 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 5: การสื่อสารและการนำเสนอ (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_6 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 6: การประเมินผลการเรียนรู้ (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_7 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 7: การพัฒนาตนเอง (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_8 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 8: การทำงานร่วมกับครูพี่เลี้ยง (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_9 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 9: ความรับผิดชอบและความตรงต่อเวลา (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_criteria_10 INT DEFAULT NULL COMMENT 'เกณฑ์ที่ 10: การสะท้อนคิดและการปรับปรุง (1-5)',
ADD COLUMN IF NOT EXISTS supervisor_total_score INT DEFAULT NULL COMMENT 'คะแนนรวมจาก 10 เกณฑ์',
ADD COLUMN IF NOT EXISTS supervisor_average_score DECIMAL(3,2) DEFAULT NULL COMMENT 'คะแนนเฉลี่ยจาก 10 เกณฑ์';

-- อัปเดตสถานะที่เป็นไปได้
-- pending -> teacher_approved -> supervisor_approved (สำเร็จ)
-- pending -> teacher_approved -> supervisor_rejected -> pending (ต้องทำใหม่)
