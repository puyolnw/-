-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 23, 2025 at 02:24 PM
-- Server version: 8.0.17
-- PHP Version: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `daily`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `GetConversationMessages` (IN `user1_id` INT, IN `user2_id` INT, IN `limit_count` INT, IN `offset_count` INT)  BEGIN
    SELECT 
        cm.*,
        CONCAT(sender.first_name, ' ', sender.last_name) AS sender_name,
        sender.profile_image AS sender_image
    FROM chat_messages cm
    JOIN users sender ON cm.sender_id = sender.id
    WHERE (cm.sender_id = user1_id AND cm.receiver_id = user2_id)
       OR (cm.sender_id = user2_id AND cm.receiver_id = user1_id)
    AND cm.is_deleted = 0
    ORDER BY cm.sent_at DESC
    LIMIT limit_count OFFSET offset_count;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetStudentTeachingStats` (IN `student_id` INT)  BEGIN
    SELECT * FROM student_teaching_statistics WHERE student_id = student_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateSchoolSchedule` (IN `p_school_id` VARCHAR(20), IN `p_academic_year_id` INT, IN `p_internship_start_date` DATE, IN `p_internship_end_date` DATE, IN `p_preparation_start_date` DATE, IN `p_orientation_date` DATE, IN `p_evaluation_date` DATE, IN `p_notes` TEXT, IN `p_updated_by` INT)  BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- ตรวจสอบว่ามี record อยู่แล้วหรือไม่
    IF EXISTS (SELECT 1 FROM school_academic_schedules WHERE school_id = p_school_id AND academic_year_id = p_academic_year_id) THEN
        -- อัพเดท
        UPDATE school_academic_schedules 
        SET 
            internship_start_date = p_internship_start_date,
            internship_end_date = p_internship_end_date,
            preparation_start_date = p_preparation_start_date,
            orientation_date = p_orientation_date,
            evaluation_date = p_evaluation_date,
            notes = p_notes,
            updated_by = p_updated_by
        WHERE school_id = p_school_id AND academic_year_id = p_academic_year_id;
    ELSE
        -- เพิ่มใหม่
        INSERT INTO school_academic_schedules (
            school_id, academic_year_id, internship_start_date, internship_end_date,
            preparation_start_date, orientation_date, evaluation_date, notes, created_by
        ) VALUES (
            p_school_id, p_academic_year_id, p_internship_start_date, p_internship_end_date,
            p_preparation_start_date, p_orientation_date, p_evaluation_date, p_notes, p_updated_by
        );
    END IF;

    -- อัพเดท internship_assignments ที่เกี่ยวข้อง
    UPDATE internship_assignments 
    SET 
        start_date = p_internship_start_date,
        end_date = p_internship_end_date
    WHERE school_id = p_school_id 
    AND academic_year_id = p_academic_year_id 
    AND status = 'active'
    AND (start_date IS NULL OR end_date IS NULL);

    COMMIT;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `id` int(11) NOT NULL,
  `year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ปีการศึกษา เช่น 2567',
  `semester` tinyint(1) NOT NULL COMMENT 'ภาคเรียน 1 หรือ 2',
  `start_date` date NOT NULL COMMENT 'วันที่เริ่มภาคเรียน',
  `end_date` date NOT NULL COMMENT 'วันที่สิ้นสุดภาคเรียน',
  `registration_start` date NOT NULL COMMENT 'วันที่เริ่มลงทะเบียน',
  `registration_end` date NOT NULL COMMENT 'วันที่สิ้นสุดลงทะเบียน',
  `is_active` tinyint(1) DEFAULT '0' COMMENT 'ปีการศึกษาที่ใช้งานอยู่',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`id`, `year`, `semester`, `start_date`, `end_date`, `registration_start`, `registration_end`, `is_active`, `created_at`) VALUES
(1, '2567', 1, '2024-06-01', '2024-10-31', '2024-04-01', '2024-05-31', 0, '2025-09-17 17:59:16'),
(2, '2567', 2, '2024-11-01', '2025-03-31', '2024-09-01', '2024-10-31', 0, '2025-09-17 17:59:16'),
(3, '2568', 1, '2025-06-01', '2025-10-31', '2025-04-01', '2025-05-31', 1, '2025-09-17 17:59:16'),
(4, '2568', 2, '2025-11-01', '2026-03-31', '2025-09-01', '2025-10-31', 0, '2025-09-17 17:59:16');

-- --------------------------------------------------------

--
-- Stand-in structure for view `available_schools`
-- (See below for the actual view)
--
CREATE TABLE `available_schools` (
`address` text
,`available_slots` bigint(12)
,`can_apply` int(1)
,`current_students` int(11)
,`current_teachers` int(11)
,`enrollment_status` varchar(12)
,`id` int(11)
,`max_students` int(11)
,`max_teachers` int(11)
,`phone` varchar(15)
,`school_id` varchar(20)
,`school_name` varchar(200)
,`teachers` text
);

-- --------------------------------------------------------

--
-- Table structure for table `backup_logs`
--

CREATE TABLE `backup_logs` (
  `id` int(11) NOT NULL,
  `backup_type` enum('full','incremental','differential') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `backup_size` bigint(20) NOT NULL,
  `backup_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('success','failed','in_progress') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL COMMENT 'ผู้ส่ง',
  `receiver_id` int(11) NOT NULL COMMENT 'ผู้รับ',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ข้อความ',
  `message_type` enum('text','file','image','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'text' COMMENT 'ประเภทข้อความ',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'path ไฟล์ (ถ้ามี)',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อไฟล์ (ถ้ามี)',
  `is_read` tinyint(1) DEFAULT '0' COMMENT 'อ่านแล้วหรือไม่',
  `read_at` timestamp NULL DEFAULT NULL COMMENT 'วันเวลาที่อ่าน',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT 'ลบแล้วหรือไม่',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'วันเวลาที่ลบ',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางข้อความในระบบแชทระหว่างนักศึกษาและครูพี่เลี้ยง';

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `sender_id`, `receiver_id`, `message`, `message_type`, `file_path`, `file_name`, `is_read`, `read_at`, `is_deleted`, `deleted_at`, `sent_at`) VALUES
(1, 18, 5, 'สวัสดีครับ', 'text', NULL, NULL, 1, '2025-09-18 06:30:07', 0, NULL, '2025-09-18 04:29:41'),
(2, 5, 18, 'มีอะไร', 'text', NULL, NULL, 1, '2025-09-18 06:44:44', 0, NULL, '2025-09-18 06:30:10'),
(3, 7, 1, 'สวัสดีครับ อาจารย์นิเทศ', 'text', NULL, NULL, 0, NULL, 0, NULL, '2025-09-18 09:17:12'),
(4, 1, 7, 'สวัสดีครับ อาจารย์', 'text', NULL, NULL, 1, '2025-09-18 09:25:41', 0, NULL, '2025-09-18 09:17:16'),
(5, 7, 1, 'สวัสดีครับ อาจารย์นิเทศ', 'text', NULL, NULL, 0, NULL, 0, NULL, '2025-09-18 09:24:33'),
(6, 1, 7, 'สวัสดีครับ อาจารย์', 'text', NULL, NULL, 1, '2025-09-18 09:25:41', 0, NULL, '2025-09-18 09:24:41'),
(7, 7, 1, 'มีไร', 'text', NULL, NULL, 0, NULL, 0, NULL, '2025-09-18 09:26:17'),
(8, 7, 18, '655', 'text', NULL, NULL, 1, '2025-09-18 09:28:01', 0, NULL, '2025-09-18 09:27:41'),
(9, 18, 7, '555', 'text', NULL, NULL, 1, '2025-09-18 09:28:06', 0, NULL, '2025-09-18 09:28:05'),
(10, 30, 6, 'สวัสดีครับ', 'text', NULL, NULL, 1, '2025-09-23 14:21:25', 0, NULL, '2025-09-23 14:20:02'),
(11, 30, 6, 'วันนี้วันอะไร', 'text', NULL, NULL, 1, '2025-09-23 14:21:25', 0, NULL, '2025-09-23 14:20:08');

-- --------------------------------------------------------

--
-- Table structure for table `completion_requests`
--

CREATE TABLE `completion_requests` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL COMMENT 'นักศึกษาผู้ยื่นคำร้อง',
  `assignment_id` int(11) NOT NULL COMMENT 'การมอบหมายฝึกงาน',
  `request_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่ยื่นคำร้อง',
  `total_teaching_hours` decimal(5,2) DEFAULT '0.00' COMMENT 'จำนวนชั่วโมงสอนรวม',
  `total_lesson_plans` int(11) DEFAULT '0' COMMENT 'จำนวนแผนการสอนทั้งหมด',
  `total_teaching_sessions` int(11) DEFAULT '0' COMMENT 'จำนวนครั้งที่สอน',
  `self_evaluation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'การประเมินตนเอง',
  `achievements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ผลงานที่ภาคภูมิใจ',
  `challenges_faced` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ความท้าทายที่เผชิญ',
  `skills_developed` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ทักษะที่พัฒนาได้',
  `future_goals` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'เป้าหมายในอนาคต',
  `status` enum('pending','under_review','approved','rejected','revision_required','supervisor_approved','supervisor_rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `teacher_comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ความเห็นครูพี่เลี้ยง',
  `teacher_rating` tinyint(1) DEFAULT NULL COMMENT 'คะแนนจากครูพี่เลี้ยง (1-5)',
  `teacher_reviewed_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่ครูให้ความเห็น',
  `supervisor_comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ความเห็นอาจารย์ผู้นิเทศ',
  `supervisor_rating` tinyint(1) DEFAULT NULL COMMENT 'คะแนนจากอาจารย์ผู้นิเทศ (1-5)',
  `supervisor_reviewed_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่อาจารย์ให้ความเห็น',
  `detailed_evaluation_data` json DEFAULT NULL,
  `detailed_rating` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL COMMENT 'ผู้อนุมัติ',
  `approved_date` timestamp NULL DEFAULT NULL COMMENT 'วันที่อนุมัติ',
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'เหตุผลการปฏิเสธ',
  `revision_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมายเหตุการแก้ไข',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `supervisor_criteria_1` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 1: ความรู้ความเข้าใจในเนื้อหาวิชา (1-5)',
  `supervisor_criteria_2` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 2: การวางแผนการสอน (1-5)',
  `supervisor_criteria_3` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 3: การใช้สื่อและเทคโนโลยี (1-5)',
  `supervisor_criteria_4` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 4: การจัดการชั้นเรียน (1-5)',
  `supervisor_criteria_5` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 5: การสื่อสารและการนำเสนอ (1-5)',
  `supervisor_criteria_6` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 6: การประเมินผลการเรียนรู้ (1-5)',
  `supervisor_criteria_7` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 7: การพัฒนาตนเอง (1-5)',
  `supervisor_criteria_8` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 8: การทำงานร่วมกับครูพี่เลี้ยง (1-5)',
  `supervisor_criteria_9` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 9: ความรับผิดชอบและความตรงต่อเวลา (1-5)',
  `supervisor_criteria_10` int(11) DEFAULT NULL COMMENT 'เกณฑ์ที่ 10: การสะท้อนคิดและการปรับปรุง (1-5)',
  `supervisor_total_score` int(11) DEFAULT NULL COMMENT 'คะแนนรวมจาก 10 เกณฑ์',
  `supervisor_average_score` decimal(3,2) DEFAULT NULL COMMENT 'คะแนนเฉลี่ยจาก 10 เกณฑ์'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางคำร้องขอสำเร็จการฝึกงาน พร้อมระบบอนุมัติ';

--
-- Dumping data for table `completion_requests`
--

INSERT INTO `completion_requests` (`id`, `student_id`, `assignment_id`, `request_date`, `total_teaching_hours`, `total_lesson_plans`, `total_teaching_sessions`, `self_evaluation`, `achievements`, `challenges_faced`, `skills_developed`, `future_goals`, `status`, `teacher_comments`, `teacher_rating`, `teacher_reviewed_at`, `supervisor_comments`, `supervisor_rating`, `supervisor_reviewed_at`, `detailed_evaluation_data`, `detailed_rating`, `approved_by`, `approved_date`, `rejection_reason`, `revision_notes`, `created_at`, `supervisor_criteria_1`, `supervisor_criteria_2`, `supervisor_criteria_3`, `supervisor_criteria_4`, `supervisor_criteria_5`, `supervisor_criteria_6`, `supervisor_criteria_7`, `supervisor_criteria_8`, `supervisor_criteria_9`, `supervisor_criteria_10`, `supervisor_total_score`, `supervisor_average_score`) VALUES
(1, 18, 21, '2025-09-18 06:58:18', '25.00', 5, 8, 'ดัมาก', 'กัมากๆ', 'กัมาก', 'กัมากหฟ', 'ฟหก', 'supervisor_approved', 'good', 5, '2025-09-18 07:16:15', '555', NULL, '2025-09-18 09:10:00', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-18 04:55:20', 5, 5, 5, 5, 5, 5, 4, 4, 4, 5, 47, '4.70'),
(2, 1, 19, '2025-09-18 05:23:43', '1.00', 1, 1, 'การฝึกสอนครั้งนี้ทำให้ได้เรียนรู้การจัดการชั้นเรียนและการสอนจริง', 'สามารถสอนนักเรียนได้อย่างมีประสิทธิภาพ', 'การจัดการพฤติกรรมนักเรียน', 'ทักษะการสื่อสารและการสอน', 'ต้องการพัฒนาทักษะการสอนให้ดีขึ้น', 'supervisor_approved', 'นักเรียนมีความตั้งใจในการสอนดีมาก สามารถจัดการชั้นเรียนได้อย่างมีประสิทธิภาพ', 4, '2025-09-18 05:25:32', '????????????', 5, '2025-09-18 08:58:24', NULL, NULL, NULL, '2025-09-18 05:25:35', NULL, NULL, '2025-09-18 05:23:43', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 40, '4.00'),
(9, 29, 25, '2025-09-23 12:15:36', '0.00', 0, 0, 'ไม่มี', '', '', '', '', 'supervisor_approved', 'ดีมาก', 4, '2025-09-23 12:42:37', 'ดีมาก', 4, '2025-09-23 13:03:13', '[{\"id\": \"1\", \"name\": \"ด้านเนื้อหาการสอน (Content Knowledge)\", \"rating\": 0, \"feedback\": \"\", \"subItems\": [{\"id\": \"1-1\", \"name\": \"ความเข้าใจในเนื้อหา\", \"rating\": 4, \"description\": \"ความเข้าใจลึกซึ้งในเนื้อหาวิชาที่สอน\"}, {\"id\": \"1-2\", \"name\": \"การอธิบายเนื้อหา\", \"rating\": 4, \"description\": \"ความสามารถในการอธิบายเนื้อหาให้ผู้เรียนเข้าใจ\"}], \"description\": \"การประเมินความรู้ของผู้ฝึกสอนในเนื้อหาวิชาที่สอน ว่ามีความเข้าใจลึกซึ้งและสามารถอธิบายเนื้อหาต่างๆ ให้ผู้เรียนเข้าใจได้หรือไม่\"}, {\"id\": \"2\", \"name\": \"ด้านวิธีการสอน (Teaching Methods)\", \"rating\": 0, \"feedback\": \"\", \"subItems\": [{\"id\": \"2-1\", \"name\": \"เทคนิคการสอน\", \"rating\": 4, \"description\": \"การใช้เทคนิคการสอนที่หลากหลายและเหมาะสม\"}, {\"id\": \"2-2\", \"name\": \"การอภิปรายและกิจกรรม\", \"rating\": 4, \"description\": \"การจัดกิจกรรมการอภิปรายและกิจกรรมกลุ่ม\"}], \"description\": \"การประเมินวิธีการที่ใช้ในการถ่ายทอดความรู้ เช่น การใช้เทคนิคการสอนที่หลากหลาย เช่น การอภิปราย การทำกิจกรรมกลุ่ม หรือการใช้สื่อการสอน\"}, {\"id\": \"3\", \"name\": \"ด้านความสัมพันธ์กับผู้เรียน (Teacher-Student Interaction)\", \"rating\": 0, \"feedback\": \"\", \"subItems\": [{\"id\": \"3-1\", \"name\": \"การสร้างความสัมพันธ์\", \"rating\": 4, \"description\": \"การสร้างความสัมพันธ์ที่ดีกับผู้เรียน\"}, {\"id\": \"3-2\", \"name\": \"บรรยากาศการเรียนรู้\", \"rating\": 4, \"description\": \"การสร้างบรรยากาศที่เอื้อต่อการเรียนรู้\"}], \"description\": \"การประเมินความสามารถของผู้ฝึกสอนในการสร้างความสัมพันธ์ที่ดีและเป็นมิตรกับผู้เรียน การสร้างบรรยากาศที่เอื้อต่อการเรียนรู้\"}, {\"id\": \"4\", \"name\": \"ด้านการประเมินผลการเรียนรู้ของผู้เรียน (Assessment of Learning)\", \"rating\": 0, \"feedback\": \"\", \"subItems\": [{\"id\": \"4-1\", \"name\": \"วิธีการประเมิน\", \"rating\": 4, \"description\": \"การใช้วิธีการประเมินที่เหมาะสมและมีประสิทธิภาพ\"}, {\"id\": \"4-2\", \"name\": \"การปรับปรุงการสอน\", \"rating\": 4, \"description\": \"การนำผลการประเมินมาปรับปรุงการสอน\"}], \"description\": \"การประเมินว่าเทคนิคหรือวิธีการที่ใช้ในการประเมินผลการเรียนรู้ของผู้เรียนมีประสิทธิภาพหรือไม่ และการปรับใช้ผลการประเมินในการปรับปรุงการสอน\"}, {\"id\": \"5\", \"name\": \"ด้านการจัดการชั้นเรียน (Classroom Management)\", \"rating\": 0, \"feedback\": \"\", \"subItems\": [{\"id\": \"5-1\", \"name\": \"การควบคุมระเบียบวินัย\", \"rating\": 4, \"description\": \"ความสามารถในการควบคุมระเบียบวินัยในชั้นเรียน\"}, {\"id\": \"5-2\", \"name\": \"การจัดสรรเวลา\", \"rating\": 4, \"description\": \"การจัดสรรเวลาในการสอนอย่างเหมาะสม\"}], \"description\": \"การประเมินความสามารถในการจัดการกับสถานการณ์ในห้องเรียน เช่น การควบคุมระเบียบวินัย การจัดสรรเวลา และการกระตุ้นให้ผู้เรียนมีส่วนร่วม\"}, {\"id\": \"6\", \"name\": \"ด้านการใช้สื่อและเทคโนโลยี (Use of Media and Technology)\", \"rating\": 0, \"feedback\": \"\", \"subItems\": [{\"id\": \"6-1\", \"name\": \"การใช้สื่อการสอน\", \"rating\": 4, \"description\": \"การใช้สื่อการสอนที่เหมาะสมและมีประสิทธิภาพ\"}, {\"id\": \"6-2\", \"name\": \"การใช้เทคโนโลยี\", \"rating\": 4, \"description\": \"การใช้เทคโนโลยีในการสนับสนุนการเรียนการสอน\"}], \"description\": \"การประเมินการใช้สื่อหรือเทคโนโลยีในการสนับสนุนการเรียนการสอน เพื่อเพิ่มประสิทธิภาพในการถ่ายทอดเนื้อหาหรือทำให้การเรียนรู้น่าสนใจขึ้น\"}, {\"id\": \"7\", \"name\": \"ด้านการพัฒนาตนเอง (Self-Development)\", \"rating\": 0, \"feedback\": \"\", \"subItems\": [{\"id\": \"7-1\", \"name\": \"การแสวงหาความรู้\", \"rating\": 4, \"description\": \"การแสวงหาความรู้ใหม่ๆ และพัฒนาตนเอง\"}, {\"id\": \"7-2\", \"name\": \"การรับฟังข้อเสนอแนะ\", \"rating\": 4, \"description\": \"การรับฟัง feedback และนำไปปรับปรุง\"}], \"description\": \"การประเมินความสามารถของผู้ฝึกสอนในการพัฒนาตนเอง เช่น การหาความรู้ใหม่ๆ การปรับปรุงทักษะการสอน รวมไปถึงการรับ feedback และนำไปปรับปรุง\"}]', 4, NULL, NULL, NULL, NULL, '2025-09-23 12:15:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 30, 26, '2025-09-23 14:20:21', '2.00', 1, 1, 'พอใจมาก', '5555', '555', '555', '555\n', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-23 14:20:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Triggers `completion_requests`
--
DELIMITER $$
CREATE TRIGGER `update_completion_request_stats` BEFORE INSERT ON `completion_requests` FOR EACH ROW BEGIN
    DECLARE total_hours DECIMAL(5,2) DEFAULT 0.00;
    DECLARE total_plans INT DEFAULT 0;
    DECLARE total_sessions INT DEFAULT 0;
    
    -- คำนวณสถิติจากการฝึกสอน
    SELECT 
        COUNT(DISTINCT lp.id),
        COUNT(DISTINCT ts.id),
        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, CONCAT(ts.teaching_date, ' ', ts.start_time), CONCAT(ts.teaching_date, ' ', ts.end_time)) / 60.0), 0)
    INTO total_plans, total_sessions, total_hours
    FROM lesson_plans lp
    LEFT JOIN teaching_sessions ts ON lp.id = ts.lesson_plan_id
    WHERE lp.student_id = NEW.student_id;
    
    -- อัปเดตค่าใน record ใหม่
    SET NEW.total_lesson_plans = total_plans;
    SET NEW.total_teaching_sessions = total_sessions;
    SET NEW.total_teaching_hours = total_hours;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `completion_request_overview`
-- (See below for the actual view)
--
CREATE TABLE `completion_request_overview` (
`approved_by_name` varchar(201)
,`approved_date` timestamp
,`assignment_id` int(11)
,`created_at` timestamp
,`id` int(11)
,`request_date` timestamp
,`school_id` varchar(20)
,`school_name` varchar(200)
,`status` enum('pending','under_review','approved','rejected','revision_required','supervisor_approved','supervisor_rejected')
,`student_code` varchar(20)
,`student_id` int(11)
,`student_name` varchar(201)
,`supervisor_rating` tinyint(1)
,`teacher_name` varchar(201)
,`teacher_rating` tinyint(1)
,`total_lesson_plans` int(11)
,`total_teaching_hours` decimal(5,2)
,`total_teaching_sessions` int(11)
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `participant_1` int(11) NOT NULL COMMENT 'ผู้เข้าร่วมคนที่ 1',
  `participant_2` int(11) NOT NULL COMMENT 'ผู้เข้าร่วมคนที่ 2',
  `last_message_id` int(11) DEFAULT NULL COMMENT 'ข้อความล่าสุด',
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'กิจกรรมล่าสุด',
  `is_archived` tinyint(1) DEFAULT '0' COMMENT 'เก็บถาวรแล้วหรือไม่',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางการสนทนา เก็บข้อมูลผู้เข้าร่วมและข้อความล่าสุด';

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `participant_1`, `participant_2`, `last_message_id`, `is_archived`, `created_at`) VALUES
(1, 5, 18, 2, 0, '2025-09-18 04:29:41'),
(3, 7, 1, 1, 0, '2025-09-18 09:25:10'),
(4, 1, 7, 7, 0, '2025-09-18 09:26:17'),
(5, 7, 18, 9, 0, '2025-09-18 09:27:41'),
(7, 6, 30, 11, 0, '2025-09-23 14:20:02');

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_criteria`
--

CREATE TABLE `evaluation_criteria` (
  `id` int(11) NOT NULL,
  `evaluation_id` int(11) NOT NULL,
  `criterion_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rating` int(11) NOT NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluation_criteria`
--

INSERT INTO `evaluation_criteria` (`id`, `evaluation_id`, `criterion_name`, `criterion_description`, `rating`, `feedback`, `created_at`) VALUES
(1, 1, '???????????????', '?????????????????? ???????????? ??????????????????', 4, '??', '2025-09-18 06:42:11'),
(2, 2, 'การเตรียมการสอน', 'การเตรียมแผนการสอน วัสดุอุปกรณ์ และเนื้อหาที่จะสอน', 1, '', '2025-09-18 06:42:45'),
(3, 2, 'การจัดการชั้นเรียน', 'การควบคุมชั้นเรียน การสร้างบรรยากาศการเรียนรู้ และการจัดการพฤติกรรมนักเรียน', 1, '', '2025-09-18 06:42:45'),
(4, 2, 'เทคนิคการสอน', 'การใช้วิธีการสอนที่เหมาะสม การอธิบายที่ชัดเจน และการกระตุ้นให้นักเรียนคิด', 1, '', '2025-09-18 06:42:45'),
(5, 2, 'การสื่อสารกับนักเรียน', 'การใช้ภาษาและท่าทางที่เหมาะสม การฟังและการตอบคำถามนักเรียน', 1, '', '2025-09-18 06:42:45'),
(6, 2, 'การประเมินผลการเรียนรู้', 'การตรวจสอบความเข้าใจของนักเรียน การให้คำแนะนำ และการประเมินผลงาน', 1, '', '2025-09-18 06:42:45'),
(7, 2, 'การแก้ไขปัญหา', 'การแก้ไขปัญหาที่เกิดขึ้นในชั้นเรียน การปรับแผนการสอนตามสถานการณ์', 1, '', '2025-09-18 06:42:45'),
(8, 2, 'การทำงานร่วมกับครูพี่เลี้ยง', 'การรับฟังคำแนะนำ การปรึกษา และการทำงานร่วมกับครูพี่เลี้ยง', 1, '', '2025-09-18 06:42:45'),
(9, 2, 'ความรับผิดชอบ', 'การตรงต่อเวลา การส่งงานตามกำหนด และการปฏิบัติตามกฎระเบียบ', 1, '', '2025-09-18 06:42:45'),
(10, 2, 'การพัฒนาตนเอง', 'การแสวงหาความรู้ใหม่ การปรับปรุงตนเอง และการรับฟังข้อเสนอแนะ', 1, '', '2025-09-18 06:42:45'),
(11, 2, 'การสร้างแรงบันดาลใจ', 'การสร้างแรงจูงใจให้นักเรียนเรียน การเป็นแบบอย่างที่ดี และการสร้างบรรยากาศการเรียนรู้', 1, '', '2025-09-18 06:42:45');

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_details`
--

CREATE TABLE `evaluation_details` (
  `id` int(11) NOT NULL,
  `completion_request_id` int(11) NOT NULL,
  `criteria_id` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `sub_item_id` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `sub_item_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sub_item_description` text COLLATE utf8mb4_general_ci,
  `rating` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `evaluation_details`
--

INSERT INTO `evaluation_details` (`id`, `completion_request_id`, `criteria_id`, `sub_item_id`, `sub_item_name`, `sub_item_description`, `rating`, `created_at`) VALUES
(15, 9, '1', '1-1', 'ความเข้าใจในเนื้อหา', 'ความเข้าใจลึกซึ้งในเนื้อหาวิชาที่สอน', 4, '2025-09-23 13:03:13'),
(16, 9, '1', '1-2', 'การอธิบายเนื้อหา', 'ความสามารถในการอธิบายเนื้อหาให้ผู้เรียนเข้าใจ', 4, '2025-09-23 13:03:13'),
(17, 9, '2', '2-1', 'เทคนิคการสอน', 'การใช้เทคนิคการสอนที่หลากหลายและเหมาะสม', 4, '2025-09-23 13:03:13'),
(18, 9, '2', '2-2', 'การอภิปรายและกิจกรรม', 'การจัดกิจกรรมการอภิปรายและกิจกรรมกลุ่ม', 4, '2025-09-23 13:03:13'),
(19, 9, '3', '3-1', 'การสร้างความสัมพันธ์', 'การสร้างความสัมพันธ์ที่ดีกับผู้เรียน', 4, '2025-09-23 13:03:13'),
(20, 9, '3', '3-2', 'บรรยากาศการเรียนรู้', 'การสร้างบรรยากาศที่เอื้อต่อการเรียนรู้', 4, '2025-09-23 13:03:13'),
(21, 9, '4', '4-1', 'วิธีการประเมิน', 'การใช้วิธีการประเมินที่เหมาะสมและมีประสิทธิภาพ', 4, '2025-09-23 13:03:13'),
(22, 9, '4', '4-2', 'การปรับปรุงการสอน', 'การนำผลการประเมินมาปรับปรุงการสอน', 4, '2025-09-23 13:03:13'),
(23, 9, '5', '5-1', 'การควบคุมระเบียบวินัย', 'ความสามารถในการควบคุมระเบียบวินัยในชั้นเรียน', 4, '2025-09-23 13:03:13'),
(24, 9, '5', '5-2', 'การจัดสรรเวลา', 'การจัดสรรเวลาในการสอนอย่างเหมาะสม', 4, '2025-09-23 13:03:13'),
(25, 9, '6', '6-1', 'การใช้สื่อการสอน', 'การใช้สื่อการสอนที่เหมาะสมและมีประสิทธิภาพ', 4, '2025-09-23 13:03:13'),
(26, 9, '6', '6-2', 'การใช้เทคโนโลยี', 'การใช้เทคโนโลยีในการสนับสนุนการเรียนการสอน', 4, '2025-09-23 13:03:13'),
(27, 9, '7', '7-1', 'การแสวงหาความรู้', 'การแสวงหาความรู้ใหม่ๆ และพัฒนาตนเอง', 4, '2025-09-23 13:03:13'),
(28, 9, '7', '7-2', 'การรับฟังข้อเสนอแนะ', 'การรับฟัง feedback และนำไปปรับปรุง', 4, '2025-09-23 13:03:13');

-- --------------------------------------------------------

--
-- Table structure for table `internship_assignments`
--

CREATE TABLE `internship_assignments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `school_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL COMMENT 'ครูพี่เลี้ยงที่รับผิดชอบ',
  `status` enum('active','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `enrollment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมายเหตุเพิ่มเติม',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `internship_assignments`
--

INSERT INTO `internship_assignments` (`id`, `student_id`, `school_id`, `academic_year_id`, `teacher_id`, `status`, `enrollment_date`, `start_date`, `end_date`, `notes`, `created_at`) VALUES
(3, 3, 'SCH003', 3, 6, 'active', '2025-09-17 17:59:16', '2025-06-01', '2025-10-31', NULL, '2025-09-17 17:59:16'),
(6, 2, 'SCH002', 3, NULL, 'active', '2025-09-17 20:50:19', NULL, NULL, NULL, '2025-09-17 20:50:19'),
(19, 1, 'SCH001', 3, 4, 'active', '2025-09-17 21:24:36', '2025-09-17', '2025-10-30', 'เพิ่มจากหน้า details', '2025-09-17 21:24:36'),
(20, 17, 'SCH002', 3, NULL, 'active', '2025-09-17 22:31:31', NULL, NULL, NULL, '2025-09-17 22:31:31'),
(21, 18, 'SCH002', 3, NULL, 'active', '2025-09-17 22:43:37', NULL, NULL, NULL, '2025-09-17 22:43:37'),
(22, 24, 'SCH001', 3, 20, 'active', '2025-09-18 08:34:19', NULL, NULL, NULL, '2025-09-18 08:34:19'),
(24, 27, 'SCH001', 3, 4, 'active', '2025-09-23 10:56:05', NULL, NULL, NULL, '2025-09-23 10:56:05'),
(25, 29, 'SCH002', 3, 5, 'active', '2025-09-23 12:09:30', NULL, NULL, NULL, '2025-09-23 12:09:30'),
(26, 30, 'SCH003', 3, 6, 'active', '2025-09-23 14:17:56', NULL, NULL, NULL, '2025-09-23 14:17:56');

--
-- Triggers `internship_assignments`
--
DELIMITER $$
CREATE TRIGGER `update_quota_after_assignment_delete` AFTER DELETE ON `internship_assignments` FOR EACH ROW BEGIN
    -- อัพเดท school_quotas
    UPDATE school_quotas 
    SET current_students = (
        SELECT COUNT(*) 
        FROM internship_assignments 
        WHERE school_id = OLD.school_id 
        AND academic_year_id = OLD.academic_year_id 
        AND status = 'active'
    )
    WHERE school_id = OLD.school_id 
    AND academic_year_id = OLD.academic_year_id;
    
    -- อัพเดท school_teachers
    IF OLD.teacher_id IS NOT NULL THEN
        UPDATE school_teachers 
        SET current_students = (
            SELECT COUNT(*) 
            FROM internship_assignments 
            WHERE school_id = OLD.school_id 
            AND academic_year_id = OLD.academic_year_id 
            AND teacher_id = OLD.teacher_id
            AND status = 'active'
        )
        WHERE teacher_id = OLD.teacher_id 
        AND school_id = OLD.school_id 
        AND academic_year_id = OLD.academic_year_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_quota_after_assignment_insert` AFTER INSERT ON `internship_assignments` FOR EACH ROW BEGIN
    -- อัพเดท school_quotas
    UPDATE school_quotas 
    SET current_students = (
        SELECT COUNT(*) 
        FROM internship_assignments 
        WHERE school_id = NEW.school_id 
        AND academic_year_id = NEW.academic_year_id 
        AND status = 'active'
    )
    WHERE school_id = NEW.school_id 
    AND academic_year_id = NEW.academic_year_id;
    
    -- อัพเดท school_teachers ถ้ามี teacher_id
    IF NEW.teacher_id IS NOT NULL THEN
        UPDATE school_teachers 
        SET current_students = (
            SELECT COUNT(*) 
            FROM internship_assignments 
            WHERE school_id = NEW.school_id 
            AND academic_year_id = NEW.academic_year_id 
            AND teacher_id = NEW.teacher_id
            AND status = 'active'
        )
        WHERE teacher_id = NEW.teacher_id 
        AND school_id = NEW.school_id 
        AND academic_year_id = NEW.academic_year_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_quota_after_assignment_update` AFTER UPDATE ON `internship_assignments` FOR EACH ROW BEGIN
    -- อัพเดท school_quotas
    UPDATE school_quotas 
    SET current_students = (
        SELECT COUNT(*) 
        FROM internship_assignments 
        WHERE school_id = NEW.school_id 
        AND academic_year_id = NEW.academic_year_id 
        AND status = 'active'
    )
    WHERE school_id = NEW.school_id 
    AND academic_year_id = NEW.academic_year_id;
    
    -- อัพเดท school_teachers สำหรับ teacher เก่า
    IF OLD.teacher_id IS NOT NULL THEN
        UPDATE school_teachers 
        SET current_students = (
            SELECT COUNT(*) 
            FROM internship_assignments 
            WHERE school_id = OLD.school_id 
            AND academic_year_id = OLD.academic_year_id 
            AND teacher_id = OLD.teacher_id
            AND status = 'active'
        )
        WHERE teacher_id = OLD.teacher_id 
        AND school_id = OLD.school_id 
        AND academic_year_id = OLD.academic_year_id;
    END IF;
    
    -- อัพเดท school_teachers สำหรับ teacher ใหม่
    IF NEW.teacher_id IS NOT NULL AND NEW.teacher_id != OLD.teacher_id THEN
        UPDATE school_teachers 
        SET current_students = (
            SELECT COUNT(*) 
            FROM internship_assignments 
            WHERE school_id = NEW.school_id 
            AND academic_year_id = NEW.academic_year_id 
            AND teacher_id = NEW.teacher_id
            AND status = 'active'
        )
        WHERE teacher_id = NEW.teacher_id 
        AND school_id = NEW.school_id 
        AND academic_year_id = NEW.academic_year_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_plans`
--

CREATE TABLE `lesson_plans` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL COMMENT 'นักศึกษาเจ้าของแผน',
  `lesson_plan_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อแผนการสอน',
  `subject_id` int(11) NOT NULL COMMENT 'วิชาที่สอน',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `objectives` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teaching_methods` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `assessment_methods` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `duration_minutes` int(11) DEFAULT '50' COMMENT 'ระยะเวลาสอน (นาที)',
  `target_grade` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ระดับชั้นเป้าหมาย',
  `status` enum('active','completed','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT 'สถานะแผน',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `teacher_feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `teacher_rating` int(11) DEFAULT NULL,
  `teacher_reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางแผนการสอน เก็บแผนการสอนของนักศึกษาแต่ละคน';

--
-- Dumping data for table `lesson_plans`
--

INSERT INTO `lesson_plans` (`id`, `student_id`, `lesson_plan_name`, `subject_id`, `description`, `objectives`, `teaching_methods`, `assessment_methods`, `duration_minutes`, `target_grade`, `status`, `created_at`, `teacher_feedback`, `teacher_rating`, `teacher_reviewed_at`) VALUES
(11, 18, 'das', 21, NULL, NULL, NULL, NULL, 50, 'ม.5', 'active', '2025-09-18 00:52:56', '', 5, '2025-09-18 05:41:25'),
(14, 18, 'das/ๅ', 22, 'ทดสอบ', NULL, NULL, NULL, 50, 'ม.5', 'active', '2025-09-18 01:30:07', '', 5, '2025-09-18 05:41:21'),
(17, 18, 'ฟกหหฟ', 23, 'ฟหก', 'ฟหก', 'ฟหก', 'ฟหก', 50, NULL, 'active', '2025-09-18 01:50:01', NULL, NULL, NULL),
(22, 1, 'แผนการสอนคณิตศาสตร์ ม.1', 1, 'การสอนเรื่องเศษส่วน', 'นักเรียนสามารถเข้าใจเศษส่วนได้', 'การบรรยายและการฝึกปฏิบัติ', 'การทดสอบและการประเมิน', 50, 'ม.1', 'active', '2025-09-18 05:18:43', NULL, NULL, NULL),
(23, 18, 'ฟหก', 25, NULL, NULL, NULL, NULL, 111, NULL, 'active', '2025-09-18 06:46:23', NULL, NULL, NULL),
(24, 24, 'แผนการสอนคณิตศาสตร์', 1, 'สอนการบวกเลข', 'นักเรียนสามารถบวกเลขได้', 'สอนแบบบรรยาย', 'ทดสอบการบวก', 50, 'ม.1', 'active', '2025-09-18 09:03:25', NULL, NULL, NULL),
(25, 27, 'วิทยาศาสตร์', 28, NULL, NULL, NULL, NULL, 50, NULL, 'active', '2025-09-23 11:31:24', NULL, NULL, NULL),
(26, 30, 'แผนการสอน 1', 29, 'วิชาคณิต ', 'บวกเลข', NULL, NULL, 50, NULL, 'active', '2025-09-23 14:18:44', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lesson_plan_documents`
--

CREATE TABLE `lesson_plan_documents` (
  `id` int(11) NOT NULL,
  `lesson_plan_id` int(11) NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิม',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'path ไฟล์ในระบบ',
  `file_size` bigint(20) NOT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทไฟล์',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_plan_files`
--

CREATE TABLE `lesson_plan_files` (
  `id` int(11) NOT NULL,
  `lesson_plan_id` int(11) NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิม',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'path ไฟล์ในระบบ',
  `file_size` bigint(20) NOT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทไฟล์',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'MIME type',
  `file_category` enum('document','presentation','media','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'document' COMMENT 'หมวดหมู่ไฟล์',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางไฟล์สื่อการสอนที่แนบกับแผนการสอน';

--
-- Dumping data for table `lesson_plan_files`
--

INSERT INTO `lesson_plan_files` (`id`, `lesson_plan_id`, `file_name`, `file_path`, `file_size`, `file_type`, `mime_type`, `file_category`, `uploaded_at`) VALUES
(5, 17, 'à¸à¸à¸à¸µà¹-1-à¸§à¸µà¸£à¸°à¸à¸à¸©à¹ à¸à¸£à¸´à¹à¸à¸ªà¹à¸ 25-2-68 (2).pdf', 'D:\\dollar\\backend\\uploads\\lesson-plans\\files-1758160201135-487647449.pdf', 83793, '.pdf', 'application/pdf', 'document', '2025-09-18 01:50:01'),
(6, 17, 'xing.png', 'D:\\dollar\\backend\\uploads\\lesson-plans\\files-1758160207436-98379598.png', 10453, '.png', 'image/png', 'media', '2025-09-18 01:50:07'),
(17, 14, 'บทที่-3-วีระพงษ์-ล่าสุด ฉบับสมบูรณ์.pdf', 'D:\\dollar\\backend\\uploads\\lesson-plans\\files-1758161982468-108403394-บทที่-3-วีระพงษ์-ล่าสุด ฉบับสมบูรณ์.pdf', 1849924, '.pdf', 'application/pdf', 'document', '2025-09-18 02:19:42'),
(18, 14, 'output-onlinepngtools.png', 'D:\\dollar\\backend\\uploads\\lesson-plans\\files-1758161982496-324033392-output-onlinepngtools.png', 11518, '.png', 'image/png', 'media', '2025-09-18 02:19:42'),
(19, 23, 'บทที่-3-วีระพงษ์-ล่าสุด ฉบับสมบูรณ์.pdf', 'D:\\dollar\\backend\\uploads\\lesson-plans\\files-1758177983505-242977565-บทที่-3-วีระพงษ์-ล่าสุด ฉบับสมบูรณ์.pdf', 1849924, '.pdf', 'application/pdf', 'document', '2025-09-18 06:46:23'),
(20, 23, 'output-onlinepngtools.png', 'D:\\dollar\\backend\\uploads\\lesson-plans\\files-1758177983559-730038072-output-onlinepngtools.png', 11518, '.png', 'image/png', 'media', '2025-09-18 06:46:23'),
(21, 25, 'คู่มือการใช้งานระบบฝึกประสบการณ์วิชาชีพครู (1)  แก้ไขใหม่  19-9-2568   แก้ไขแก้ไข  ออนไลน์ (1).docx', 'C:\\Users\\Dhinotea\\work\\-\\back\\uploads\\lesson-plans\\files-1758627092921-827186687-คู่มือการใช้งานระบบฝึกประสบการณ์วิชาชีพครู (1)  แก้ไขใหม่  19-9-2568   แก้ไขแก้ไข  ออนไลน์ (1).docx', 570990, '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'document', '2025-09-23 11:31:32'),
(22, 26, 'คู่มือการใช้งานระบบฝึกประสบการณ์วิชาชีพครู (1)  แก้ไขใหม่  19-9-2568   แก้ไขแก้ไข  ออนไลน์ (1).docx', 'C:\\Users\\Dhinotea\\work\\-\\back\\uploads\\lesson-plans\\files-1758637124255-957136325-คู่มือการใช้งานระบบฝึกประสบการณ์วิชาชีพครู (1)  แก้ไขใหม่  19-9-2568   แก้ไขแก้ไข  ออนไลน์ (1).docx', 570990, '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'document', '2025-09-23 14:18:44'),
(23, 26, '481071336_1114860143986043_6782195757044095901_n.jpg', 'C:\\Users\\Dhinotea\\work\\-\\back\\uploads\\lesson-plans\\files-1758637124268-963921064-481071336_1114860143986043_6782195757044095901_n.jpg', 139609, '.jpg', 'image/jpeg', 'media', '2025-09-23 14:18:44');

-- --------------------------------------------------------

--
-- Table structure for table `lesson_plan_materials`
--

CREATE TABLE `lesson_plan_materials` (
  `id` int(11) NOT NULL,
  `lesson_plan_id` int(11) NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิม',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'path ไฟล์ในระบบ',
  `file_size` bigint(20) NOT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทไฟล์',
  `file_category` enum('image','video','presentation','document','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'other' COMMENT 'หมวดหมู่ไฟล์',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `lesson_plan_overview`
-- (See below for the actual view)
--
CREATE TABLE `lesson_plan_overview` (
`created_at` timestamp
,`document_count` bigint(21)
,`id` int(11)
,`lesson_plan_name` varchar(200)
,`material_count` bigint(21)
,`status` enum('active','completed','archived')
,`student_id` int(11)
,`student_name` varchar(201)
,`subject_code` varchar(20)
,`subject_id` int(11)
,`subject_name` varchar(200)
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','success','warning','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email_notifications` tinyint(1) DEFAULT '1',
  `push_notifications` tinyint(1) DEFAULT '1',
  `lesson_plan_reminders` tinyint(1) DEFAULT '1',
  `teaching_session_reminders` tinyint(1) DEFAULT '1',
  `completion_request_updates` tinyint(1) DEFAULT '1',
  `chat_notifications` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schools`
--

CREATE TABLE `schools` (
  `id` int(11) NOT NULL,
  `school_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schools`
--

INSERT INTO `schools` (`id`, `school_id`, `school_name`, `address`, `phone`, `created_at`) VALUES
(1, 'SCH001', 'โรงเรียนประชาสามัคคี', '123 ถนนประชาสามัคคี ตำบลในเมือง อำเภอเมือง จังหวัดนครราชสีมา 30000', '044-123456', '2025-09-17 11:15:27'),
(2, 'SCH002', 'โรงเรียนวิทยาศาสตร์', '456 ถนนวิทยาศาสตร์ ตำบลสุรนารี อำเภอเมือง จังหวัดนครราชสีมา 30000', '044-234567', '2025-09-17 11:15:27'),
(3, 'SCH003', 'โรงเรียนเทคโนโลยี2', '789 ถนนเทคโนโลยี ตำบลหนองกระทุ่ม อำเภอเมือง จังหวัดนครราชสีมา 30000', '044-345678', '2025-09-17 11:15:27'),
(4, 'SCH004', 'ฟหกหฟก', '29/1 ฟหกาสฟวหกาสวกฟาหกสวหก', '084-567-8901', '2025-09-17 17:32:31'),
(5, 'SCH005', 'โรงเรียนทดสอบรายงาน', '123 ถนนทดสอบ', '02-123-4567', '2025-09-18 09:41:51');

-- --------------------------------------------------------

--
-- Table structure for table `school_academic_schedules`
--

CREATE TABLE `school_academic_schedules` (
  `id` int(11) NOT NULL,
  `school_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `internship_start_date` date NOT NULL COMMENT 'วันที่เริ่มฝึกงานในโรงเรียนนี้',
  `internship_end_date` date NOT NULL COMMENT 'วันที่สิ้นสุดฝึกงานในโรงเรียนนี้',
  `preparation_start_date` date DEFAULT NULL COMMENT 'วันที่เริ่มเตรียมตัว',
  `orientation_date` date DEFAULT NULL COMMENT 'วันปฐมนิเทศ',
  `evaluation_date` date DEFAULT NULL COMMENT 'วันประเมินผล',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมายเหตุเพิ่มเติม',
  `created_by` int(11) NOT NULL COMMENT 'ผู้สร้าง (admin/supervisor/teacher)',
  `updated_by` int(11) DEFAULT NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_academic_schedules`
--

INSERT INTO `school_academic_schedules` (`id`, `school_id`, `academic_year_id`, `internship_start_date`, `internship_end_date`, `preparation_start_date`, `orientation_date`, `evaluation_date`, `notes`, `created_by`, `updated_by`, `created_at`) VALUES
(1, 'SCH001', 3, '2025-09-17', '2025-09-30', '2025-09-17', '2025-09-17', '2025-09-30', 'อัปเดตโดยระบบ', 9, 9, '2025-09-17 18:50:38'),
(2, 'SCH002', 3, '2025-06-20', '2025-10-20', '2025-06-05', '2025-06-15', '2025-10-25', NULL, 9, NULL, '2025-09-17 18:50:38'),
(3, 'SCH003', 3, '2025-06-10', '2025-10-10', '2025-05-25', '2025-06-05', '2025-10-15', NULL, 9, NULL, '2025-09-17 18:50:38'),
(4, 'SCH004', 3, '2025-09-17', '2025-09-24', '2025-09-17', '2025-09-17', '2025-09-24', 'อัปเดตโดยระบบ', 9, 9, '2025-09-17 20:06:33');

-- --------------------------------------------------------

--
-- Stand-in structure for view `school_overview`
-- (See below for the actual view)
--
CREATE TABLE `school_overview` (
`academic_end_date` date
,`academic_start_date` date
,`academic_year_id` int(11)
,`active_students` bigint(21)
,`address` text
,`assigned_teachers` bigint(21)
,`available_slots` bigint(12)
,`cancelled_students` bigint(21)
,`completed_students` bigint(21)
,`current_students` bigint(11)
,`current_teachers` bigint(11)
,`evaluation_date` date
,`id` int(11)
,`internship_end_date` date
,`internship_start_date` date
,`is_open` int(4)
,`max_students` bigint(11)
,`max_teachers` bigint(11)
,`orientation_date` date
,`phone` varchar(15)
,`preparation_start_date` date
,`primary_teachers` bigint(21)
,`schedule_notes` text
,`school_id` varchar(20)
,`school_name` varchar(200)
,`semester` tinyint(1)
,`year` varchar(10)
);

-- --------------------------------------------------------

--
-- Table structure for table `school_quotas`
--

CREATE TABLE `school_quotas` (
  `id` int(11) NOT NULL,
  `school_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `max_students` int(11) NOT NULL DEFAULT '0' COMMENT 'จำนวนนักศึกษาสูงสุดที่รับได้',
  `current_students` int(11) NOT NULL DEFAULT '0' COMMENT 'จำนวนนักศึกษาปัจจุบัน',
  `max_teachers` int(11) NOT NULL DEFAULT '0' COMMENT 'จำนวนครูพี่เลี้ยงสูงสุด',
  `current_teachers` int(11) NOT NULL DEFAULT '0' COMMENT 'จำนวนครูพี่เลี้ยงปัจจุบัน',
  `is_open` tinyint(1) DEFAULT '1' COMMENT 'เปิดรับสมัครหรือไม่',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_quotas`
--

INSERT INTO `school_quotas` (`id`, `school_id`, `academic_year_id`, `max_students`, `current_students`, `max_teachers`, `current_teachers`, `is_open`, `created_at`) VALUES
(1, 'SCH001', 3, 5, 3, 3, 1, 1, '2025-09-17 17:59:16'),
(2, 'SCH002', 3, 8, 4, 2, 1, 1, '2025-09-17 17:59:16'),
(3, 'SCH003', 3, 12, 2, 4, 1, 1, '2025-09-17 17:59:16'),
(8, 'SCH004', 3, 1, 0, 5, 0, 1, '2025-09-17 18:37:24'),
(9, 'SCH001', 1, 15, 0, 3, 0, 0, '2025-09-17 20:15:16'),
(10, 'SCH002', 1, 15, 0, 3, 0, 0, '2025-09-17 20:15:16'),
(11, 'SCH003', 1, 15, 0, 3, 0, 0, '2025-09-17 20:15:16'),
(12, 'SCH004', 1, 15, 0, 3, 0, 0, '2025-09-17 20:15:16'),
(13, 'SCH001', 2, 12, 0, 2, 0, 0, '2025-09-17 20:15:16'),
(14, 'SCH002', 2, 12, 0, 2, 0, 0, '2025-09-17 20:15:16'),
(15, 'SCH003', 2, 12, 0, 2, 0, 0, '2025-09-17 20:15:16'),
(16, 'SCH004', 2, 12, 0, 2, 0, 0, '2025-09-17 20:15:16'),
(17, 'SCH001', 4, 18, 0, 3, 0, 0, '2025-09-17 20:15:16'),
(18, 'SCH002', 4, 18, 0, 3, 0, 0, '2025-09-17 20:15:16'),
(19, 'SCH003', 4, 18, 0, 3, 0, 0, '2025-09-17 20:15:16'),
(20, 'SCH004', 4, 18, 0, 3, 0, 0, '2025-09-17 20:15:16');

-- --------------------------------------------------------

--
-- Stand-in structure for view `school_schedule_overview`
-- (See below for the actual view)
--
CREATE TABLE `school_schedule_overview` (
`academic_end` date
,`academic_start` date
,`created_at` timestamp
,`created_by_name` varchar(201)
,`evaluation_date` date
,`internship_end_date` date
,`internship_start_date` date
,`notes` text
,`orientation_date` date
,`preparation_start_date` date
,`school_id` varchar(20)
,`school_name` varchar(200)
,`semester` tinyint(1)
,`updated_at` timestamp
,`updated_by_name` varchar(201)
,`year` varchar(10)
);

-- --------------------------------------------------------

--
-- Table structure for table `school_teachers`
--

CREATE TABLE `school_teachers` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `school_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0' COMMENT 'ครูหลักหรือไม่',
  `max_students` int(11) DEFAULT '5' COMMENT 'จำนวนนักศึกษาสูงสุดที่ดูแลได้',
  `current_students` int(11) DEFAULT '0' COMMENT 'จำนวนนักศึกษาปัจจุบัน',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_teachers`
--

INSERT INTO `school_teachers` (`id`, `teacher_id`, `school_id`, `academic_year_id`, `is_primary`, `max_students`, `current_students`, `created_at`) VALUES
(1, 4, 'SCH001', 3, 1, 20, 2, '2025-09-17 17:59:16'),
(2, 5, 'SCH002', 3, 1, 20, 1, '2025-09-17 17:59:16'),
(3, 6, 'SCH003', 3, 1, 20, 2, '2025-09-17 17:59:16'),
(4, 6, 'SCH002', 3, 0, 20, 0, '2025-09-17 20:42:02'),
(7, 20, 'SCH001', 3, 0, 20, 1, '2025-09-18 08:34:10'),
(8, 23, 'SCH001', 3, 0, 20, 0, '2025-09-18 08:34:31');

-- --------------------------------------------------------

--
-- Table structure for table `student_completion_requests`
--

CREATE TABLE `student_completion_requests` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `assignment_id` int(11) NOT NULL,
  `request_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_teaching_hours` decimal(5,2) DEFAULT '0.00',
  `total_teaching_sessions` int(11) DEFAULT '0',
  `status` enum('pending','under_review','approved','rejected','revision_required') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reviewer_id` int(11) DEFAULT NULL,
  `review_date` timestamp NULL DEFAULT NULL,
  `review_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `student_dashboard_overview`
-- (See below for the actual view)
--
CREATE TABLE `student_dashboard_overview` (
`academic_year` varchar(10)
,`completion_request_date` timestamp
,`faculty` varchar(200)
,`major` varchar(200)
,`registration_date` timestamp
,`registration_status` enum('unregistered','registered','completion_requested')
,`school_id` varchar(20)
,`school_name` varchar(200)
,`semester` tinyint(1)
,`student_code` varchar(20)
,`student_id` int(11)
,`student_name` varchar(201)
,`total_lesson_plans` bigint(21)
,`total_teaching_hours` decimal(46,4)
,`total_teaching_minutes` decimal(42,0)
,`total_teaching_sessions` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `student_registration_status`
--

CREATE TABLE `student_registration_status` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `academic_year_id` int(11) NOT NULL,
  `registration_status` enum('unregistered','registered','completion_requested') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unregistered',
  `registration_date` timestamp NULL DEFAULT NULL,
  `completion_request_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_teacher_conversations`
--

CREATE TABLE `student_teacher_conversations` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `last_message_id` int(11) DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `student_teaching_statistics`
-- (See below for the actual view)
--
CREATE TABLE `student_teaching_statistics` (
`average_self_rating` decimal(7,4)
,`faculty` varchar(200)
,`first_teaching_date` date
,`last_teaching_date` date
,`major` varchar(200)
,`school_id` varchar(20)
,`school_name` varchar(200)
,`student_code` varchar(20)
,`student_id` int(11)
,`student_name` varchar(201)
,`subjects_taught` bigint(21)
,`teaching_months` bigint(21)
,`total_lesson_plans` bigint(21)
,`total_teaching_hours` decimal(47,4)
,`total_teaching_sessions` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `subject_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสวิชา',
  `subject_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อวิชา',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายละเอียดวิชา',
  `created_by` int(11) NOT NULL COMMENT 'ผู้สร้าง',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บข้อมูลวิชาที่ใช้ในการสอน รองรับการสร้างวิชาใหม่โดยนักศึกษา';

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `subject_code`, `subject_name`, `description`, `created_by`, `created_at`) VALUES
(1, 'MATH001', 'คณิตศาสตร์พื้นฐาน', 'วิชาคณิตศาสตร์สำหรับนักเรียนชั้นประถม', 1, '2025-09-17 22:05:48'),
(2, 'SCI001', 'วิทยาศาสตร์พื้นฐาน', 'วิชาวิทยาศาสตร์สำหรับนักเรียนชั้นประถม', 1, '2025-09-17 22:05:48'),
(3, 'ENG001', 'ภาษาอังกฤษพื้นฐาน', 'วิชาภาษาอังกฤษสำหรับนักเรียนชั้นประถม', 1, '2025-09-17 22:05:48'),
(4, 'THAI001', 'ภาษาไทย ม.1', 'ภาษาไทย ระดับมัธยมศึกษาปีที่ 1', 1, '2025-09-17 22:05:48'),
(5, 'SOCIAL001', 'สังคมศึกษา ม.1', 'สังคมศึกษา ระดับมัธยมศึกษาปีที่ 1', 1, '2025-09-17 22:05:48'),
(6, 'MATH002', 'คณิตศาสตร์ ม.2', 'คณิตศาสตร์ ระดับมัธยมศึกษาปีที่ 2', 1, '2025-09-17 22:05:48'),
(7, 'SCI002', 'วิทยาศาสตร์ ม.2', 'วิทยาศาสตร์ ระดับมัธยมศึกษาปีที่ 2', 1, '2025-09-17 22:05:48'),
(8, 'COMP001', 'คอมพิวเตอร์ ม.1', 'วิชาคอมพิวเตอร์พื้นฐาน ระดับมัธยมศึกษาปีที่ 1', 1, '2025-09-17 22:05:48'),
(9, 'THA001', 'ภาษาไทยพื้นฐาน', 'วิชาภาษาไทยสำหรับนักเรียนชั้นประถม', 1, '2025-09-18 00:17:05'),
(10, 'SOC001', 'สังคมศึกษา', 'วิชาสังคมศึกษาสำหรับนักเรียนชั้นประถม', 1, '2025-09-18 00:17:05'),
(19, 'SC01', 'วิทยาศาสตร์', NULL, 18, '2025-09-18 00:18:23'),
(20, 'SC012', 'วิทยาศาสตร์2', NULL, 18, '2025-09-18 00:18:57'),
(21, 'TEST001', 'Test Subject', 'Test Description', 1, '2025-09-18 00:23:04'),
(22, 'กฟหก', 'ฟหกฟหก', NULL, 18, '2025-09-18 00:23:45'),
(23, 'หกฟหก', 'ฟหกหฟกฟ', NULL, 18, '2025-09-18 00:24:55'),
(24, 'หฟก/', 'ฟหก', 'ฟหก', 18, '2025-09-18 00:26:02'),
(25, 'ฟหกฟก', 'ฟหกฟก', 'ฟหก', 18, '2025-09-18 00:27:10'),
(26, 'กก/', 'ฟหก11', 'ฟหก', 18, '2025-09-18 02:07:07'),
(27, 'asdsdasd', '11asdda', '123', 18, '2025-09-18 06:46:01'),
(28, 'SC101', 'SCIEN', NULL, 27, '2025-09-23 11:31:13'),
(29, 'MATH 01', 'คณิตศาสตร์ 1', NULL, 30, '2025-09-23 14:18:27');

-- --------------------------------------------------------

--
-- Stand-in structure for view `teacher_dashboard_overview`
-- (See below for the actual view)
--
CREATE TABLE `teacher_dashboard_overview` (
`is_primary` tinyint(1)
,`school_id` varchar(20)
,`school_name` varchar(200)
,`teacher_code` varchar(20)
,`teacher_id` int(11)
,`teacher_name` varchar(201)
,`total_completion_requests` bigint(21)
,`total_lesson_plans_reviewed` bigint(21)
,`total_students` bigint(21)
,`total_teaching_sessions_reviewed` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `teaching_evaluations`
--

CREATE TABLE `teaching_evaluations` (
  `id` int(11) NOT NULL,
  `teaching_session_id` int(11) NOT NULL,
  `evaluator_id` int(11) NOT NULL,
  `evaluation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `teaching_quality` enum('excellent','good','fair','poor') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_engagement` enum('excellent','good','fair','poor') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `classroom_management` enum('excellent','good','fair','poor') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `overall_score` decimal(3,2) NOT NULL,
  `comments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `recommendations` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pass_status` enum('pass','fail') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pass_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teaching_evaluations`
--

INSERT INTO `teaching_evaluations` (`id`, `teaching_session_id`, `evaluator_id`, `evaluation_date`, `teaching_quality`, `student_engagement`, `classroom_management`, `overall_score`, `comments`, `recommendations`, `pass_status`, `pass_reason`) VALUES
(1, 6, 4, '2025-09-18 06:42:11', 'excellent', 'excellent', 'excellent', '4.00', '?????', NULL, 'pass', '????'),
(2, 4, 5, '2025-09-18 06:42:45', 'excellent', 'excellent', 'excellent', '1.00', 'ฟหก', NULL, 'fail', 'ห');

-- --------------------------------------------------------

--
-- Table structure for table `teaching_materials`
--

CREATE TABLE `teaching_materials` (
  `id` int(11) NOT NULL,
  `lesson_plan_id` int(11) NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_category` enum('document','presentation','media','image','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teaching_sessions`
--

CREATE TABLE `teaching_sessions` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL COMMENT 'นักศึกษาผู้สอน',
  `lesson_plan_id` int(11) NOT NULL COMMENT 'แผนการสอนที่ใช้',
  `subject_id` int(11) NOT NULL COMMENT 'วิชาที่สอน',
  `teaching_date` date NOT NULL COMMENT 'วันที่สอน',
  `start_time` time NOT NULL COMMENT 'เวลาเริ่ม',
  `end_time` time NOT NULL COMMENT 'เวลาสิ้นสุด',
  `class_level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ระดับชั้น',
  `class_room` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ห้องเรียน',
  `student_count` int(11) DEFAULT NULL COMMENT 'จำนวนนักเรียน',
  `lesson_topic` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หัวข้อบทเรียน',
  `learning_activities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'กิจกรรมการเรียนรู้',
  `learning_outcomes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ผลการเรียนรู้',
  `teaching_methods_used` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'วิธีการสอนที่ใช้',
  `materials_used` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'สื่อการสอนที่ใช้',
  `student_engagement` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'การมีส่วนร่วมของนักเรียน',
  `problems_encountered` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ปัญหาที่เกิดขึ้น',
  `problem_solutions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'วิธีแก้ปัญหา',
  `lessons_learned` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'สิ่งที่ได้เรียนรู้',
  `reflection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'การสะท้อนคิด',
  `improvement_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ข้อเสนอแนะในการปรับปรุง',
  `teacher_feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ความเห็นจากครูพี่เลี้ยง',
  `status` enum('draft','submitted','reviewed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft' COMMENT 'สถานะบันทึก',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `teacher_rating` decimal(3,2) DEFAULT NULL,
  `teacher_reviewed_at` timestamp NULL DEFAULT NULL,
  `self_rating` tinyint(1) DEFAULT NULL COMMENT 'การให้คะแนนตนเอง (1-5)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางบันทึกการฝึกสอนแต่ละครั้ง รายละเอียดครบถ้วน';

--
-- Dumping data for table `teaching_sessions`
--

INSERT INTO `teaching_sessions` (`id`, `student_id`, `lesson_plan_id`, `subject_id`, `teaching_date`, `start_time`, `end_time`, `class_level`, `class_room`, `student_count`, `lesson_topic`, `learning_activities`, `learning_outcomes`, `teaching_methods_used`, `materials_used`, `student_engagement`, `problems_encountered`, `problem_solutions`, `lessons_learned`, `reflection`, `improvement_notes`, `teacher_feedback`, `status`, `created_at`, `teacher_rating`, `teacher_reviewed_at`, `self_rating`) VALUES
(2, 18, 17, 23, '2025-09-17', '08:00:00', '11:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'submitted', '2025-09-18 03:31:06', NULL, NULL, NULL),
(4, 18, 14, 22, '2025-09-17', '11:00:00', '13:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ประเมินแบบละเอียด - คะแนนรวม: 1/5', 'submitted', '2025-09-18 04:08:24', '1.00', '2025-09-18 06:42:45', NULL),
(6, 1, 22, 1, '2025-09-18', '08:00:00', '09:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ประเมินแบบละเอียด - คะแนนรวม: 4/5', 'submitted', '2025-09-18 05:19:01', '4.00', '2025-09-18 06:42:11', NULL),
(10, 27, 25, 28, '2025-09-23', '08:00:00', '11:00:00', 'ป5', '505', 50, 'วิชาเอก', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'submitted', '2025-09-23 11:33:49', NULL, NULL, NULL),
(11, 30, 26, 29, '2025-09-23', '14:00:00', '16:00:00', 'ม.5', '101', 50, 'การบวก', 'ไม่มี', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'submitted', '2025-09-23 14:19:19', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teaching_session_files`
--

CREATE TABLE `teaching_session_files` (
  `id` int(11) NOT NULL,
  `teaching_session_id` int(11) NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิม',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'path ไฟล์ในระบบ',
  `file_size` bigint(20) NOT NULL COMMENT 'ขนาดไฟล์ (bytes)',
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทไฟล์',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'MIME type',
  `file_category` enum('photo','document','video','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'photo' COMMENT 'หมวดหมู่ไฟล์',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'คำอธิบายไฟล์',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางไฟล์ภาพถ่ายและเอกสารประกอบการสอน';

--
-- Dumping data for table `teaching_session_files`
--

INSERT INTO `teaching_session_files` (`id`, `teaching_session_id`, `file_name`, `file_path`, `file_size`, `file_type`, `mime_type`, `file_category`, `description`, `uploaded_at`) VALUES
(2, 2, 'Screenshot 2025-08-13 164013.png', 'D:\\dollar\\backend\\uploads\\teaching-sessions\\files-1758166266586-658272345.png', 7782, '.png', 'image/png', 'photo', NULL, '2025-09-18 03:31:06'),
(4, 4, 'Screenshot 2025-08-13 164029.png', 'D:\\dollar\\backend\\uploads\\teaching-sessions\\files-1758168504304-365650927.png', 40683, '.png', 'image/png', 'photo', NULL, '2025-09-18 04:08:24'),
(6, 10, '481071336_1114860143986043_6782195757044095901_n.jpg', 'C:\\Users\\Dhinotea\\work\\-\\back\\uploads\\teaching-sessions\\files-1758627229938-133257662.jpg', 139609, '.jpg', 'image/jpeg', 'photo', NULL, '2025-09-23 11:33:49'),
(7, 11, '481071336_1114860143986043_6782195757044095901_n.jpg', 'C:\\Users\\Dhinotea\\work\\-\\back\\uploads\\teaching-sessions\\files-1758637159899-251533.jpg', 139609, '.jpg', 'image/jpeg', 'photo', NULL, '2025-09-23 14:19:19');

-- --------------------------------------------------------

--
-- Stand-in structure for view `teaching_session_overview`
-- (See below for the actual view)
--
CREATE TABLE `teaching_session_overview` (
`class_level` varchar(50)
,`class_room` varchar(50)
,`created_at` timestamp
,`duration_hours` decimal(25,4)
,`end_time` time
,`file_count` bigint(21)
,`id` int(11)
,`lesson_plan_id` int(11)
,`lesson_plan_name` varchar(200)
,`lesson_topic` varchar(200)
,`self_rating` tinyint(1)
,`start_time` time
,`status` enum('draft','submitted','reviewed')
,`student_code` varchar(20)
,`student_count` int(11)
,`student_id` int(11)
,`student_name` varchar(201)
,`subject_code` varchar(20)
,`subject_id` int(11)
,`subject_name` varchar(200)
,`teaching_date` date
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `teaching_time_slots`
--

CREATE TABLE `teaching_time_slots` (
  `id` int(11) NOT NULL,
  `teaching_session_id` int(11) NOT NULL,
  `time_slot` enum('08:00-09:00','09:00-10:00','10:00-11:00','11:00-12:00','12:00-13:00','13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_selected` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student','teacher','supervisor','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'รหัสนักศึกษา (เฉพาะ role = student)',
  `faculty` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'คณะที่สังกัด (เฉพาะ role = student)',
  `major` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สาขาวิชา (เฉพาะ role = student)',
  `profile_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อไฟล์รูปโปรไฟล์',
  `advisor_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่ออาจารย์ที่ปรึกษา (เฉพาะ role = student)',
  `advisor_phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เบอร์โทรอาจารย์ที่ปรึกษา (เฉพาะ role = student)',
  `father_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อบิดา (เฉพาะ role = student)',
  `father_occupation` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'อาชีพบิดา (เฉพาะ role = student)',
  `father_phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เบอร์โทรบิดา (เฉพาะ role = student)',
  `mother_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อมารดา (เฉพาะ role = student)',
  `mother_occupation` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'อาชีพมารดา (เฉพาะ role = student)',
  `mother_phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เบอร์โทรมารดา (เฉพาะ role = student)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `user_id`, `role`, `first_name`, `last_name`, `phone`, `email`, `address`, `username`, `password`, `school_id`, `created_at`, `student_code`, `faculty`, `major`, `profile_image`, `advisor_name`, `advisor_phone`, `father_name`, `father_occupation`, `father_phone`, `mother_name`, `mother_occupation`, `mother_phone`) VALUES
(1, 'STD001', 'student', 'สมชาย', 'ใจดี', '081-234-5678', 'somchai@email.com', '123 หมู่ 1 ตำบลในเมือง อำเภอเมือง จังหวัดนครราชสีมา', 'somchai_std', '$2a$10$placeholder_hash_for_password123', 'SCH001', '2025-09-17 11:15:27', '6401234567', 'คณะวิทยาศาสตร์และเทคโนโลยี', 'วิทยาการคอมพิวเตอร์', 'default-student.jpg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'STD002', 'student', 'สมหญิง', 'รักเรียน', '082-345-6789', 'somying@email.com', '456 หมู่ 2 ตำบลสุรนารี อำเภอเมือง จังหวัดนครราชสีมา', 'somying_std', '$2b$10$zKdfB4ORFjwiYnLQALUFhesTvikyMnXwttr15AODvy0zs9xcUQer.', 'SCH002', '2025-09-17 11:15:27', '6401234568', 'คณะครุศาสตร์', 'การศึกษาปฐมวัย', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'STD003', 'student', 'วิชัย', 'ขยันเรียน', '083-456-7890', 'wichai@email.com', '789 หมู่ 3 ตำบลหนองกระทุ่ม อำเภอเมือง จังหวัดนครราชสีมา', 'wichai_std', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', 'SCH003', '2025-09-17 11:15:27', '6401234569', 'คณะบริหารธุรกิจ', 'การจัดการทั่วไป', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'TCH001', 'teacher', 'อาจารย์สมศักดิ์', 'ใจสอน', '081-111-2222', 'somsak.teacher@email.com', '111 ถนนครูไทย ตำบลในเมือง อำเภอเมือง จังหวัดนครราชสีมา', 'somsak_tch', '$2b$10$zKdfB4ORFjwiYnLQALUFhesTvikyMnXwttr15AODvy0zs9xcUQer.', 'SCH001', '2025-09-17 11:15:27', NULL, NULL, NULL, 'default-teacher.jpg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'TCH002', 'teacher', 'อาจารย์วรรณา', 'รักการสอน', '082-222-3333', 'wanna.teacher@email.com', '222 ถนนศึกษา ตำบลสุรนารี อำเภอเมือง จังหวัดนครราชสีมา', 'ddd', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', 'SCH002', '2025-09-17 11:15:27', NULL, NULL, NULL, 'user_TCH002_1758179699919.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'TCH003', 'teacher', 'อาจารย์ประยุทธ', 'ดีใจสอน', '083-333-4444', 'prayuth.teacher@email.com', '333 ถนนการศึกษา ตำบลหนองกระทุ่ม อำเภอเมือง จังหวัดนครราชสีมา', 'pppp', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', 'SCH003', '2025-09-17 11:15:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'SUP001', 'supervisor', 'ศาสตราจารย์ดร.วิโรจน์', 'นิเทศดี', '081-555-6666', 'wiroj.supervisor@email.com', '555 ถนนมหาวิทยาลัย ตำบลในเมือง อำเภอเมือง จังหวัดนครราชสีมา', 'www', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', NULL, '2025-09-17 11:15:27', NULL, NULL, NULL, 'user_SUP001_1758189240049.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'SUP002', 'supervisor', 'รองศาสตราจารย์ดร.สุนีย์', 'ดูแลดี', '082-666-7777', 'sunee.supervisor@email.com', '666 ถนนวิชาการ ตำบลสุรนารี อำเภอเมือง จังหวัดนครราชสีมา', 'sunee_sup', '$2b$10$zKdfB4ORFjwiYnLQALUFhesTvikyMnXwttr15AODvy0zs9xcUQer.', NULL, '2025-09-17 11:15:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'ADM001', 'admin', 'ผู้ดูแลระบบ', 'หลัก', '081-999-0000', 'admin@email.com', '999 ถนนเทคโนโลยี ตำบลในเมือง อำเภอเมือง จังหวัดนครราชสีมา', 'admin', '$2b$10$zKdfB4ORFjwiYnLQALUFhesTvikyMnXwttr15AODvy0zs9xcUQer.', NULL, '2025-09-17 11:15:27', NULL, NULL, NULL, 'user_ADM001_1758122215732.png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'ADM002', 'admin', 'ผู้ช่วยดูแลระบบ', 'รอง', '082-888-9999', 'admin2@email.com', '888 ถนนดิจิทัล ตำบลสุรนารี อำเภอเมือง จังหวัดนครราชสีมา', 'admin2', '$2b$10$zKdfB4ORFjwiYnLQALUFhesTvikyMnXwttr15AODvy0zs9xcUQer.', NULL, '2025-09-17 11:15:27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'STD004', 'student', 'asdad', 'asdasd', NULL, 'opee195@gmail.com', 'asdasdasdad', 'sss', '$2b$10$WboEs0yQ5o/1AAz2Ng0NUufZfr5usSycai4m5gQpy8IKkqVxZMAw6', NULL, '2025-09-17 21:29:35', '4564654564', 'asdasdad', 'asdasd', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'STD005', 'student', 'asd', 'asd', NULL, 'myemailkittiphat327@gmail.com', NULL, 'ssaa', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', NULL, '2025-09-17 22:43:29', '4585125852', 'asad', 'asd', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, '', 'teacher', 'ครูทดสอบ', 'ใจดี', '081-999-8888', 'test.teacher@email.com', NULL, '', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', NULL, '2025-09-18 08:29:57', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 'TCH999', 'teacher', 'ครูทดสอบ', 'ใจดี', '081-999-8888', 'test.teacher999@email.com', NULL, 'test.teacher999', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', NULL, '2025-09-18 08:30:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 'STU999', 'student', 'นักศึกษาทดสอบ', 'ใจดี', '081-777-6666', 'test.student999@email.com', NULL, '8785', '$2b$10$FRFGRkVaNkjnjS8aCtL/COScf6NR9fv5m4gRvhGHf4brl7ZZmy2kK', NULL, '2025-09-18 08:30:38', '6409999999', 'คณะวิทยาศาสตร์และเทคโนโลยี', 'วิทยาการคอมพิวเตอร์', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'STD1000', 'student', 'asdas', 'dasd', NULL, 'sadas@sss.sss', NULL, 'asw', '$2b$10$532zEXhB8T2vtLdu8D9JwOgxvdqdBkP5HLy0bTfeyzFWPoR.Yo17.', NULL, '2025-09-18 10:13:02', '0850150020', 'asdas', 'asd', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 'STD1001', 'student', 'เอกชัย', 'ศรีวิชัย', '0850150023', 'aek@aek.aek', NULL, 'aek', '$2b$10$xG0zlr9QiKwfRDUekvhCRO1gRgoJeQ.OXvUKSBIPB2UICIgzw5oLi', NULL, '2025-09-23 10:20:14', '4456456465', 'ครุศาสตร์', 'ภาษาอังกฤษ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 'STD1002', 'student', 'sad', 'asd', '0878975646', 'asd@sad.sss', NULL, 'swe', '$2b$10$Uo6Ni8eAjsFTFCGhG8xCye4KzhuKnmp8YPrEZAmNkj4rSw8nSCMye', NULL, '2025-09-23 11:40:57', '1234567456', 'ครุศาสตร์', 'บรรณารักษ์', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 'STD1003', 'student', 'ฟกฟก', 'ฟหกฟหก', '0851516213', 'aeke@aeke.aeke', NULL, 'aeke', '$2b$10$EBKDhk5oKjS6J3d3SJ5BGuEBwhJT3aODCKnEGx2uAR2nLuxRxkA6K', NULL, '2025-09-23 12:08:35', '1478945613', 'ครุศาสตร์', 'บรรณารักษ์', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'STD1004', 'student', 'ฟหกฟห', 'กฟหฟหก', '0879875612', 'yyy@yyy.yyy', NULL, '999', '$2b$10$yG38j7KqVHhChl/q/QRgN.L3B9RTmn3s/w12kxvSk8tdO5yBs0OxC', NULL, '2025-09-23 14:17:36', '1234564490', 'ครุศาสตร์', 'บรรณารักษ์', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure for view `available_schools`
--
DROP TABLE IF EXISTS `available_schools`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `available_schools`  AS  select `s`.`id` AS `id`,`s`.`school_id` AS `school_id`,`s`.`school_name` AS `school_name`,`s`.`address` AS `address`,`s`.`phone` AS `phone`,`sq`.`max_students` AS `max_students`,`sq`.`current_students` AS `current_students`,`sq`.`max_teachers` AS `max_teachers`,`sq`.`current_teachers` AS `current_teachers`,greatest(0,(`sq`.`max_students` - `sq`.`current_students`)) AS `available_slots`,(select group_concat(concat(`u`.`first_name`,' ',`u`.`last_name`) separator ', ') from (`school_teachers` `st` join `users` `u` on((`st`.`teacher_id` = `u`.`id`))) where ((`st`.`school_id` = `s`.`school_id`) and (`st`.`academic_year_id` = `sq`.`academic_year_id`))) AS `teachers`,(case when (`sq`.`is_open` = 0) then 'ปิดรับสมัคร' when (`sq`.`current_students` >= `sq`.`max_students`) then 'เต็มแล้ว' else 'เปิดรับสมัคร' end) AS `enrollment_status`,(case when ((`sq`.`is_open` = 1) and (`sq`.`current_students` < `sq`.`max_students`)) then true else false end) AS `can_apply` from ((`schools` `s` join `school_quotas` `sq` on((`s`.`school_id` = `sq`.`school_id`))) join `academic_years` `ay` on((`sq`.`academic_year_id` = `ay`.`id`))) where (`ay`.`is_active` = 1) order by `s`.`school_name` ;

-- --------------------------------------------------------

--
-- Structure for view `completion_request_overview`
--
DROP TABLE IF EXISTS `completion_request_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `completion_request_overview`  AS  select `cr`.`id` AS `id`,`cr`.`student_id` AS `student_id`,`cr`.`assignment_id` AS `assignment_id`,`cr`.`request_date` AS `request_date`,`cr`.`status` AS `status`,`cr`.`total_teaching_hours` AS `total_teaching_hours`,`cr`.`total_lesson_plans` AS `total_lesson_plans`,`cr`.`total_teaching_sessions` AS `total_teaching_sessions`,`cr`.`teacher_rating` AS `teacher_rating`,`cr`.`supervisor_rating` AS `supervisor_rating`,`cr`.`approved_date` AS `approved_date`,concat(`student`.`first_name`,' ',`student`.`last_name`) AS `student_name`,`student`.`student_code` AS `student_code`,`ia`.`school_id` AS `school_id`,`sch`.`school_name` AS `school_name`,concat(`teacher`.`first_name`,' ',`teacher`.`last_name`) AS `teacher_name`,concat(`approver`.`first_name`,' ',`approver`.`last_name`) AS `approved_by_name`,`cr`.`created_at` AS `created_at`,`cr`.`updated_at` AS `updated_at` from ((((((`completion_requests` `cr` join `users` `student` on((`cr`.`student_id` = `student`.`id`))) join `internship_assignments` `ia` on((`cr`.`assignment_id` = `ia`.`id`))) join `schools` `sch` on((`ia`.`school_id` = `sch`.`school_id`))) left join `school_teachers` `st` on(((`ia`.`school_id` = `st`.`school_id`) and (`ia`.`academic_year_id` = `st`.`academic_year_id`)))) left join `users` `teacher` on((`st`.`teacher_id` = `teacher`.`id`))) left join `users` `approver` on((`cr`.`approved_by` = `approver`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `lesson_plan_overview`
--
DROP TABLE IF EXISTS `lesson_plan_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `lesson_plan_overview`  AS  select `lp`.`id` AS `id`,`lp`.`student_id` AS `student_id`,`lp`.`lesson_plan_name` AS `lesson_plan_name`,`lp`.`subject_id` AS `subject_id`,`s`.`subject_name` AS `subject_name`,`s`.`subject_code` AS `subject_code`,`lp`.`status` AS `status`,`lp`.`created_at` AS `created_at`,`lp`.`updated_at` AS `updated_at`,count(distinct `lpd`.`id`) AS `document_count`,count(distinct `lpm`.`id`) AS `material_count`,concat(`u`.`first_name`,' ',`u`.`last_name`) AS `student_name` from ((((`lesson_plans` `lp` join `subjects` `s` on((`lp`.`subject_id` = `s`.`id`))) join `users` `u` on((`lp`.`student_id` = `u`.`id`))) left join `lesson_plan_documents` `lpd` on((`lp`.`id` = `lpd`.`lesson_plan_id`))) left join `lesson_plan_materials` `lpm` on((`lp`.`id` = `lpm`.`lesson_plan_id`))) group by `lp`.`id`,`lp`.`student_id`,`lp`.`lesson_plan_name`,`lp`.`subject_id`,`s`.`subject_name`,`s`.`subject_code`,`lp`.`status`,`lp`.`created_at`,`lp`.`updated_at`,`u`.`first_name`,`u`.`last_name` ;

-- --------------------------------------------------------

--
-- Structure for view `school_overview`
--
DROP TABLE IF EXISTS `school_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `school_overview`  AS  select `s`.`id` AS `id`,`s`.`school_id` AS `school_id`,`s`.`school_name` AS `school_name`,`s`.`address` AS `address`,`s`.`phone` AS `phone`,`ay`.`id` AS `academic_year_id`,`ay`.`year` AS `year`,`ay`.`semester` AS `semester`,`ay`.`start_date` AS `academic_start_date`,`ay`.`end_date` AS `academic_end_date`,coalesce(`sas`.`internship_start_date`,`ay`.`start_date`) AS `internship_start_date`,coalesce(`sas`.`internship_end_date`,`ay`.`end_date`) AS `internship_end_date`,`sas`.`preparation_start_date` AS `preparation_start_date`,`sas`.`orientation_date` AS `orientation_date`,`sas`.`evaluation_date` AS `evaluation_date`,`sas`.`notes` AS `schedule_notes`,coalesce(`sq`.`max_students`,0) AS `max_students`,coalesce(`sq`.`current_students`,0) AS `current_students`,coalesce(`sq`.`max_teachers`,0) AS `max_teachers`,coalesce(`sq`.`current_teachers`,0) AS `current_teachers`,coalesce(`sq`.`is_open`,false) AS `is_open`,(select count(0) from `internship_assignments` `ia` where ((`ia`.`school_id` = `s`.`school_id`) and (`ia`.`academic_year_id` = `ay`.`id`) and (`ia`.`status` = 'active'))) AS `active_students`,(select count(0) from `internship_assignments` `ia` where ((`ia`.`school_id` = `s`.`school_id`) and (`ia`.`academic_year_id` = `ay`.`id`) and (`ia`.`status` = 'completed'))) AS `completed_students`,(select count(0) from `internship_assignments` `ia` where ((`ia`.`school_id` = `s`.`school_id`) and (`ia`.`academic_year_id` = `ay`.`id`) and (`ia`.`status` = 'cancelled'))) AS `cancelled_students`,(select count(0) from `school_teachers` `st` where ((`st`.`school_id` = `s`.`school_id`) and (`st`.`academic_year_id` = `ay`.`id`))) AS `assigned_teachers`,(select count(0) from `school_teachers` `st` where ((`st`.`school_id` = `s`.`school_id`) and (`st`.`academic_year_id` = `ay`.`id`) and (`st`.`is_primary` = 1))) AS `primary_teachers`,greatest(0,(coalesce(`sq`.`max_students`,0) - coalesce(`sq`.`current_students`,0))) AS `available_slots` from (((`schools` `s` join `academic_years` `ay`) left join `school_quotas` `sq` on(((`s`.`school_id` = `sq`.`school_id`) and (`ay`.`id` = `sq`.`academic_year_id`)))) left join `school_academic_schedules` `sas` on(((`s`.`school_id` = `sas`.`school_id`) and (`ay`.`id` = `sas`.`academic_year_id`)))) order by `s`.`school_name`,`ay`.`year`,`ay`.`semester` ;

-- --------------------------------------------------------

--
-- Structure for view `school_schedule_overview`
--
DROP TABLE IF EXISTS `school_schedule_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `school_schedule_overview`  AS  select `s`.`school_id` AS `school_id`,`s`.`school_name` AS `school_name`,`ay`.`year` AS `year`,`ay`.`semester` AS `semester`,`ay`.`start_date` AS `academic_start`,`ay`.`end_date` AS `academic_end`,`sas`.`internship_start_date` AS `internship_start_date`,`sas`.`internship_end_date` AS `internship_end_date`,`sas`.`preparation_start_date` AS `preparation_start_date`,`sas`.`orientation_date` AS `orientation_date`,`sas`.`evaluation_date` AS `evaluation_date`,`sas`.`notes` AS `notes`,concat(`u1`.`first_name`,' ',`u1`.`last_name`) AS `created_by_name`,concat(`u2`.`first_name`,' ',`u2`.`last_name`) AS `updated_by_name`,`sas`.`created_at` AS `created_at`,`sas`.`updated_at` AS `updated_at` from ((((`schools` `s` join `academic_years` `ay` on((`ay`.`is_active` = 1))) left join `school_academic_schedules` `sas` on(((`s`.`school_id` = `sas`.`school_id`) and (`ay`.`id` = `sas`.`academic_year_id`)))) left join `users` `u1` on((`sas`.`created_by` = `u1`.`id`))) left join `users` `u2` on((`sas`.`updated_by` = `u2`.`id`))) order by `s`.`school_name` ;

-- --------------------------------------------------------

--
-- Structure for view `student_dashboard_overview`
--
DROP TABLE IF EXISTS `student_dashboard_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `student_dashboard_overview`  AS  select `u`.`id` AS `student_id`,`u`.`user_id` AS `student_code`,concat(`u`.`first_name`,' ',`u`.`last_name`) AS `student_name`,`u`.`faculty` AS `faculty`,`u`.`major` AS `major`,`srs`.`registration_status` AS `registration_status`,`srs`.`registration_date` AS `registration_date`,`srs`.`completion_request_date` AS `completion_request_date`,`ia`.`school_id` AS `school_id`,`s`.`school_name` AS `school_name`,`ay`.`year` AS `academic_year`,`ay`.`semester` AS `semester`,count(distinct `lp`.`id`) AS `total_lesson_plans`,count(distinct `ts`.`id`) AS `total_teaching_sessions`,coalesce(sum(timestampdiff(MINUTE,`ts`.`start_time`,`ts`.`end_time`)),0) AS `total_teaching_minutes`,coalesce((sum(timestampdiff(MINUTE,`ts`.`start_time`,`ts`.`end_time`)) / 60),0) AS `total_teaching_hours` from ((((((`users` `u` left join `student_registration_status` `srs` on((`u`.`id` = `srs`.`student_id`))) left join `internship_assignments` `ia` on((`u`.`id` = `ia`.`student_id`))) left join `schools` `s` on((`ia`.`school_id` = `s`.`school_id`))) left join `academic_years` `ay` on((`ia`.`academic_year_id` = `ay`.`id`))) left join `lesson_plans` `lp` on((`u`.`id` = `lp`.`student_id`))) left join `teaching_sessions` `ts` on((`u`.`id` = `ts`.`student_id`))) where (`u`.`role` = 'student') group by `u`.`id`,`u`.`user_id`,`u`.`first_name`,`u`.`last_name`,`u`.`faculty`,`u`.`major`,`srs`.`registration_status`,`srs`.`registration_date`,`srs`.`completion_request_date`,`ia`.`school_id`,`s`.`school_name`,`ay`.`year`,`ay`.`semester` ;

-- --------------------------------------------------------

--
-- Structure for view `student_teaching_statistics`
--
DROP TABLE IF EXISTS `student_teaching_statistics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `student_teaching_statistics`  AS  select `u`.`id` AS `student_id`,`u`.`student_code` AS `student_code`,concat(`u`.`first_name`,' ',`u`.`last_name`) AS `student_name`,`u`.`faculty` AS `faculty`,`u`.`major` AS `major`,`ia`.`school_id` AS `school_id`,`sch`.`school_name` AS `school_name`,count(distinct `lp`.`id`) AS `total_lesson_plans`,count(distinct `ts`.`id`) AS `total_teaching_sessions`,coalesce(sum((timestampdiff(MINUTE,concat(`ts`.`teaching_date`,' ',`ts`.`start_time`),concat(`ts`.`teaching_date`,' ',`ts`.`end_time`)) / 60.0)),0) AS `total_teaching_hours`,count(distinct `ts`.`subject_id`) AS `subjects_taught`,avg(`ts`.`self_rating`) AS `average_self_rating`,min(`ts`.`teaching_date`) AS `first_teaching_date`,max(`ts`.`teaching_date`) AS `last_teaching_date`,count(distinct date_format(`ts`.`teaching_date`,'%Y-%m')) AS `teaching_months` from ((((`users` `u` left join `internship_assignments` `ia` on(((`u`.`id` = `ia`.`student_id`) and (`ia`.`status` = 'active')))) left join `schools` `sch` on((`ia`.`school_id` = `sch`.`school_id`))) left join `lesson_plans` `lp` on((`u`.`id` = `lp`.`student_id`))) left join `teaching_sessions` `ts` on((`u`.`id` = `ts`.`student_id`))) where (`u`.`role` = 'student') group by `u`.`id`,`ia`.`school_id`,`sch`.`school_name` ;

-- --------------------------------------------------------

--
-- Structure for view `teacher_dashboard_overview`
--
DROP TABLE IF EXISTS `teacher_dashboard_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `teacher_dashboard_overview`  AS  select `u`.`id` AS `teacher_id`,`u`.`user_id` AS `teacher_code`,concat(`u`.`first_name`,' ',`u`.`last_name`) AS `teacher_name`,`st`.`school_id` AS `school_id`,`s`.`school_name` AS `school_name`,`st`.`is_primary` AS `is_primary`,count(distinct `ia`.`student_id`) AS `total_students`,count(distinct `lp`.`id`) AS `total_lesson_plans_reviewed`,count(distinct `ts`.`id`) AS `total_teaching_sessions_reviewed`,count(distinct `scr`.`id`) AS `total_completion_requests` from ((((((`users` `u` join `school_teachers` `st` on((`u`.`id` = `st`.`teacher_id`))) join `schools` `s` on((`st`.`school_id` = `s`.`school_id`))) left join `internship_assignments` `ia` on(((`st`.`school_id` = `ia`.`school_id`) and (`st`.`academic_year_id` = `ia`.`academic_year_id`)))) left join `lesson_plans` `lp` on((`ia`.`student_id` = `lp`.`student_id`))) left join `teaching_sessions` `ts` on((`ia`.`student_id` = `ts`.`student_id`))) left join `student_completion_requests` `scr` on((`ia`.`id` = `scr`.`assignment_id`))) where (`u`.`role` = 'teacher') group by `u`.`id`,`u`.`user_id`,`u`.`first_name`,`u`.`last_name`,`st`.`school_id`,`s`.`school_name`,`st`.`is_primary` ;

-- --------------------------------------------------------

--
-- Structure for view `teaching_session_overview`
--
DROP TABLE IF EXISTS `teaching_session_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `teaching_session_overview`  AS  select `ts`.`id` AS `id`,`ts`.`student_id` AS `student_id`,`ts`.`lesson_plan_id` AS `lesson_plan_id`,`ts`.`subject_id` AS `subject_id`,`ts`.`teaching_date` AS `teaching_date`,`ts`.`start_time` AS `start_time`,`ts`.`end_time` AS `end_time`,(timestampdiff(MINUTE,concat(`ts`.`teaching_date`,' ',`ts`.`start_time`),concat(`ts`.`teaching_date`,' ',`ts`.`end_time`)) / 60.0) AS `duration_hours`,`ts`.`class_level` AS `class_level`,`ts`.`class_room` AS `class_room`,`ts`.`student_count` AS `student_count`,`ts`.`lesson_topic` AS `lesson_topic`,`ts`.`self_rating` AS `self_rating`,`ts`.`status` AS `status`,`lp`.`lesson_plan_name` AS `lesson_plan_name`,`s`.`subject_code` AS `subject_code`,`s`.`subject_name` AS `subject_name`,concat(`u`.`first_name`,' ',`u`.`last_name`) AS `student_name`,`u`.`student_code` AS `student_code`,count(`tsf`.`id`) AS `file_count`,`ts`.`created_at` AS `created_at`,`ts`.`updated_at` AS `updated_at` from ((((`teaching_sessions` `ts` join `lesson_plans` `lp` on((`ts`.`lesson_plan_id` = `lp`.`id`))) join `subjects` `s` on((`ts`.`subject_id` = `s`.`id`))) join `users` `u` on((`ts`.`student_id` = `u`.`id`))) left join `teaching_session_files` `tsf` on((`ts`.`id` = `tsf`.`teaching_session_id`))) group by `ts`.`id`,`lp`.`id`,`s`.`id`,`u`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_year_semester` (`year`,`semester`),
  ADD KEY `idx_academic_years_active` (`is_active`),
  ADD KEY `idx_academic_years_year` (`year`);

--
-- Indexes for table `backup_logs`
--
ALTER TABLE `backup_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_backup_date` (`backup_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_messages_sender` (`sender_id`),
  ADD KEY `idx_chat_messages_receiver` (`receiver_id`),
  ADD KEY `idx_chat_messages_conversation` (`sender_id`,`receiver_id`),
  ADD KEY `idx_chat_messages_read` (`is_read`),
  ADD KEY `idx_chat_messages_sent_at` (`sent_at`),
  ADD KEY `idx_chat_messages_type` (`message_type`),
  ADD KEY `idx_conversation_sent_at` (`sender_id`,`receiver_id`,`sent_at`);

--
-- Indexes for table `completion_requests`
--
ALTER TABLE `completion_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_assignment_request` (`student_id`,`assignment_id`),
  ADD KEY `idx_completion_requests_student` (`student_id`),
  ADD KEY `idx_completion_requests_assignment` (`assignment_id`),
  ADD KEY `idx_completion_requests_status` (`status`),
  ADD KEY `idx_completion_requests_approved_by` (`approved_by`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation_participants` (`participant_1`,`participant_2`),
  ADD KEY `idx_conversations_participant_1` (`participant_1`),
  ADD KEY `idx_conversations_participant_2` (`participant_2`),
  ADD KEY `idx_conversations_last_message` (`last_message_id`),
  ADD KEY `idx_conversations_activity` (`last_activity`);

--
-- Indexes for table `evaluation_criteria`
--
ALTER TABLE `evaluation_criteria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluation_id` (`evaluation_id`);

--
-- Indexes for table `evaluation_details`
--
ALTER TABLE `evaluation_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_completion_request_id` (`completion_request_id`),
  ADD KEY `idx_criteria_sub_item` (`criteria_id`,`sub_item_id`);

--
-- Indexes for table `internship_assignments`
--
ALTER TABLE `internship_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_year` (`student_id`,`academic_year_id`),
  ADD KEY `idx_assignments_student` (`student_id`),
  ADD KEY `idx_assignments_school` (`school_id`),
  ADD KEY `idx_assignments_year` (`academic_year_id`),
  ADD KEY `idx_assignments_teacher` (`teacher_id`),
  ADD KEY `idx_assignments_status` (`status`);

--
-- Indexes for table `lesson_plans`
--
ALTER TABLE `lesson_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_plans_student` (`student_id`),
  ADD KEY `idx_lesson_plans_subject` (`subject_id`),
  ADD KEY `idx_lesson_plans_status` (`status`),
  ADD KEY `idx_lesson_plans_grade` (`target_grade`),
  ADD KEY `idx_student_subject_status` (`student_id`,`subject_id`,`status`),
  ADD KEY `idx_lesson_plans_student_status` (`student_id`,`status`),
  ADD KEY `idx_lesson_plans_subject_status` (`subject_id`,`status`);
ALTER TABLE `lesson_plans` ADD FULLTEXT KEY `lesson_plan_name` (`lesson_plan_name`);

--
-- Indexes for table `lesson_plan_documents`
--
ALTER TABLE `lesson_plan_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_docs_plan` (`lesson_plan_id`);

--
-- Indexes for table `lesson_plan_files`
--
ALTER TABLE `lesson_plan_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_files_plan` (`lesson_plan_id`),
  ADD KEY `idx_lesson_files_category` (`file_category`);

--
-- Indexes for table `lesson_plan_materials`
--
ALTER TABLE `lesson_plan_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_materials_plan` (`lesson_plan_id`),
  ADD KEY `idx_lesson_materials_category` (`file_category`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_settings` (`user_id`);

--
-- Indexes for table `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `school_id` (`school_id`),
  ADD KEY `idx_schools_school_id` (`school_id`);

--
-- Indexes for table `school_academic_schedules`
--
ALTER TABLE `school_academic_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_school_academic_year_schedule` (`school_id`,`academic_year_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_school_schedules_school` (`school_id`),
  ADD KEY `idx_school_schedules_year` (`academic_year_id`),
  ADD KEY `idx_school_schedules_dates` (`internship_start_date`,`internship_end_date`);

--
-- Indexes for table `school_quotas`
--
ALTER TABLE `school_quotas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_school_academic_year` (`school_id`,`academic_year_id`),
  ADD KEY `idx_school_quotas_school` (`school_id`),
  ADD KEY `idx_school_quotas_year` (`academic_year_id`),
  ADD KEY `idx_school_quotas_open` (`is_open`);

--
-- Indexes for table `school_teachers`
--
ALTER TABLE `school_teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_teacher_school_year` (`teacher_id`,`school_id`,`academic_year_id`),
  ADD KEY `idx_school_teachers_teacher` (`teacher_id`),
  ADD KEY `idx_school_teachers_school` (`school_id`),
  ADD KEY `idx_school_teachers_year` (`academic_year_id`);

--
-- Indexes for table `student_completion_requests`
--
ALTER TABLE `student_completion_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_assignment_id` (`assignment_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_reviewer_id` (`reviewer_id`);

--
-- Indexes for table `student_registration_status`
--
ALTER TABLE `student_registration_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_academic_year` (`student_id`,`academic_year_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_academic_year_id` (`academic_year_id`),
  ADD KEY `idx_registration_status` (`registration_status`);

--
-- Indexes for table `student_teacher_conversations`
--
ALTER TABLE `student_teacher_conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_teacher` (`student_id`,`teacher_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_teacher_id` (`teacher_id`),
  ADD KEY `idx_last_activity` (`last_activity`),
  ADD KEY `last_message_id` (`last_message_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subject_name` (`subject_name`),
  ADD UNIQUE KEY `uq_subjects_code` (`subject_code`),
  ADD KEY `idx_subjects_code` (`subject_code`),
  ADD KEY `idx_subjects_name` (`subject_name`),
  ADD KEY `idx_subjects_created_by` (`created_by`);
ALTER TABLE `subjects` ADD FULLTEXT KEY `subject_name` (`subject_name`,`description`);

--
-- Indexes for table `teaching_evaluations`
--
ALTER TABLE `teaching_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_teaching_session_id` (`teaching_session_id`),
  ADD KEY `idx_evaluator_id` (`evaluator_id`),
  ADD KEY `idx_evaluation_date` (`evaluation_date`);

--
-- Indexes for table `teaching_materials`
--
ALTER TABLE `teaching_materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_plan_id` (`lesson_plan_id`),
  ADD KEY `idx_file_category` (`file_category`);

--
-- Indexes for table `teaching_sessions`
--
ALTER TABLE `teaching_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_teaching_sessions_student` (`student_id`),
  ADD KEY `idx_teaching_sessions_plan` (`lesson_plan_id`),
  ADD KEY `idx_teaching_sessions_subject` (`subject_id`),
  ADD KEY `idx_teaching_sessions_date` (`teaching_date`),
  ADD KEY `idx_teaching_sessions_status` (`status`),
  ADD KEY `idx_teaching_sessions_class` (`class_level`),
  ADD KEY `idx_student_date_status` (`student_id`,`teaching_date`,`status`);
ALTER TABLE `teaching_sessions` ADD FULLTEXT KEY `lesson_topic` (`lesson_topic`,`learning_activities`);

--
-- Indexes for table `teaching_session_files`
--
ALTER TABLE `teaching_session_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_files_session` (`teaching_session_id`),
  ADD KEY `idx_session_files_category` (`file_category`);

--
-- Indexes for table `teaching_time_slots`
--
ALTER TABLE `teaching_time_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_teaching_session_id` (`teaching_session_id`),
  ADD KEY `idx_time_slot` (`time_slot`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `unique_student_code` (`student_code`),
  ADD KEY `school_id` (`school_id`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_student_code` (`student_code`),
  ADD KEY `idx_users_faculty` (`faculty`),
  ADD KEY `idx_users_major` (`major`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `backup_logs`
--
ALTER TABLE `backup_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `completion_requests`
--
ALTER TABLE `completion_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `evaluation_criteria`
--
ALTER TABLE `evaluation_criteria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `evaluation_details`
--
ALTER TABLE `evaluation_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `internship_assignments`
--
ALTER TABLE `internship_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `lesson_plans`
--
ALTER TABLE `lesson_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `lesson_plan_documents`
--
ALTER TABLE `lesson_plan_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_plan_files`
--
ALTER TABLE `lesson_plan_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `lesson_plan_materials`
--
ALTER TABLE `lesson_plan_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_settings`
--
ALTER TABLE `notification_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schools`
--
ALTER TABLE `schools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `school_academic_schedules`
--
ALTER TABLE `school_academic_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `school_quotas`
--
ALTER TABLE `school_quotas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `school_teachers`
--
ALTER TABLE `school_teachers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `student_completion_requests`
--
ALTER TABLE `student_completion_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_registration_status`
--
ALTER TABLE `student_registration_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_teacher_conversations`
--
ALTER TABLE `student_teacher_conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `teaching_evaluations`
--
ALTER TABLE `teaching_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `teaching_materials`
--
ALTER TABLE `teaching_materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teaching_sessions`
--
ALTER TABLE `teaching_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `teaching_session_files`
--
ALTER TABLE `teaching_session_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `teaching_time_slots`
--
ALTER TABLE `teaching_time_slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `completion_requests`
--
ALTER TABLE `completion_requests`
  ADD CONSTRAINT `completion_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `completion_requests_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `internship_assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `completion_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`participant_1`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`participant_2`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`last_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `evaluation_criteria`
--
ALTER TABLE `evaluation_criteria`
  ADD CONSTRAINT `evaluation_criteria_ibfk_1` FOREIGN KEY (`evaluation_id`) REFERENCES `teaching_evaluations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_details`
--
ALTER TABLE `evaluation_details`
  ADD CONSTRAINT `evaluation_details_ibfk_1` FOREIGN KEY (`completion_request_id`) REFERENCES `completion_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `internship_assignments`
--
ALTER TABLE `internship_assignments`
  ADD CONSTRAINT `internship_assignments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `internship_assignments_ibfk_2` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `internship_assignments_ibfk_3` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `internship_assignments_ibfk_4` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lesson_plans`
--
ALTER TABLE `lesson_plans`
  ADD CONSTRAINT `lesson_plans_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lesson_plans_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_plan_documents`
--
ALTER TABLE `lesson_plan_documents`
  ADD CONSTRAINT `fk_lpd_lp` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_plan_files`
--
ALTER TABLE `lesson_plan_files`
  ADD CONSTRAINT `lesson_plan_files_ibfk_1` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_plan_materials`
--
ALTER TABLE `lesson_plan_materials`
  ADD CONSTRAINT `fk_lpm_lp` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD CONSTRAINT `notification_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `school_academic_schedules`
--
ALTER TABLE `school_academic_schedules`
  ADD CONSTRAINT `school_academic_schedules_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_academic_schedules_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_academic_schedules_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_academic_schedules_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `school_quotas`
--
ALTER TABLE `school_quotas`
  ADD CONSTRAINT `school_quotas_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_quotas_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `school_teachers`
--
ALTER TABLE `school_teachers`
  ADD CONSTRAINT `school_teachers_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_teachers_ibfk_2` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `school_teachers_ibfk_3` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_completion_requests`
--
ALTER TABLE `student_completion_requests`
  ADD CONSTRAINT `student_completion_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_completion_requests_ibfk_2` FOREIGN KEY (`assignment_id`) REFERENCES `internship_assignments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_completion_requests_ibfk_3` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_registration_status`
--
ALTER TABLE `student_registration_status`
  ADD CONSTRAINT `student_registration_status_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_registration_status_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_teacher_conversations`
--
ALTER TABLE `student_teacher_conversations`
  ADD CONSTRAINT `student_teacher_conversations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_teacher_conversations_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_teacher_conversations_ibfk_3` FOREIGN KEY (`last_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teaching_evaluations`
--
ALTER TABLE `teaching_evaluations`
  ADD CONSTRAINT `teaching_evaluations_ibfk_1` FOREIGN KEY (`teaching_session_id`) REFERENCES `teaching_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teaching_evaluations_ibfk_2` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teaching_materials`
--
ALTER TABLE `teaching_materials`
  ADD CONSTRAINT `teaching_materials_ibfk_1` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teaching_sessions`
--
ALTER TABLE `teaching_sessions`
  ADD CONSTRAINT `teaching_sessions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teaching_sessions_ibfk_2` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `teaching_sessions_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teaching_session_files`
--
ALTER TABLE `teaching_session_files`
  ADD CONSTRAINT `teaching_session_files_ibfk_1` FOREIGN KEY (`teaching_session_id`) REFERENCES `teaching_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teaching_time_slots`
--
ALTER TABLE `teaching_time_slots`
  ADD CONSTRAINT `teaching_time_slots_ibfk_1` FOREIGN KEY (`teaching_session_id`) REFERENCES `teaching_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
