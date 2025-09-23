-- สร้างตารางสำหรับเก็บการประเมินหัวข้อย่อย
CREATE TABLE IF NOT EXISTS evaluation_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    completion_request_id INT NOT NULL,
    criteria_id VARCHAR(10) NOT NULL,
    sub_item_id VARCHAR(10) NOT NULL,
    sub_item_name VARCHAR(255) NOT NULL,
    sub_item_description TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (completion_request_id) REFERENCES completion_requests(id) ON DELETE CASCADE,
    INDEX idx_completion_request_id (completion_request_id),
    INDEX idx_criteria_sub_item (criteria_id, sub_item_id)
);

-- เพิ่มคอลัมน์สำหรับเก็บข้อมูลการประเมินแบบละเอียดในตาราง completion_requests
ALTER TABLE completion_requests 
ADD COLUMN IF NOT EXISTS detailed_evaluation_data JSON DEFAULT NULL COMMENT 'ข้อมูลการประเมินแบบละเอียดในรูปแบบ JSON';

-- เพิ่มคอลัมน์สำหรับเก็บคะแนนรวมจากการประเมินหัวข้อย่อย
ALTER TABLE completion_requests 
ADD COLUMN IF NOT EXISTS detailed_rating DECIMAL(3,2) DEFAULT NULL COMMENT 'คะแนนรวมจากการประเมินหัวข้อย่อย';
