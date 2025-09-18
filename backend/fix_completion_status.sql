-- แก้ไขสถานะ completion_requests ที่ครูพี่เลี้ยงประเมินแล้วแต่ยังไม่ได้อนุมัติ
-- เปลี่ยนจาก 'approved' เป็น 'under_review' สำหรับรายการที่:
-- 1. teacher_reviewed_at มีค่า (ครูพี่เลี้ยงประเมินแล้ว)
-- 2. supervisor_reviewed_at เป็น NULL (อาจารย์นิเทศยังไม่ประเมิน)
-- 3. approved_date เป็น NULL (ยังไม่ได้อนุมัติ)

USE daily;

-- แสดงข้อมูลก่อนแก้ไข
SELECT 'Before Update:' as status;
SELECT id, status, teacher_reviewed_at, supervisor_reviewed_at, approved_date 
FROM completion_requests 
ORDER BY id;

-- แก้ไขสถานะ
UPDATE completion_requests 
SET status = 'under_review' 
WHERE teacher_reviewed_at IS NOT NULL 
  AND supervisor_reviewed_at IS NULL 
  AND approved_date IS NULL 
  AND status = 'approved';

-- แสดงข้อมูลหลังแก้ไข
SELECT 'After Update:' as status;
SELECT id, status, teacher_reviewed_at, supervisor_reviewed_at, approved_date 
FROM completion_requests 
ORDER BY id;

-- แสดงจำนวนรายการที่แก้ไข
SELECT ROW_COUNT() as 'Records Updated';


