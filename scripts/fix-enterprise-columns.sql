-- Bổ sung các cột còn thiếu của bảng `enterprises` trên server (DB_SYNC=false nên
-- không tự tạo). Idempotent: chỉ ADD nếu cột chưa tồn tại → chạy lại nhiều lần vô hại.
-- Chạy: mysql -u root -p survey_alumni_v3 < scripts/fix-enterprise-columns.sql

-- partner_status
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enterprises' AND COLUMN_NAME = 'partner_status');
SET @s := IF(@c = 0,
  "ALTER TABLE `enterprises` ADD COLUMN `partner_status` ENUM('active','inactive') NOT NULL DEFAULT 'active'",
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- status (cột đang gây lỗi 500)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enterprises' AND COLUMN_NAME = 'status');
SET @s := IF(@c = 0,
  "ALTER TABLE `enterprises` ADD COLUMN `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved'",
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- rejection_reason
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enterprises' AND COLUMN_NAME = 'rejection_reason');
SET @s := IF(@c = 0,
  "ALTER TABLE `enterprises` ADD COLUMN `rejection_reason` TEXT NULL",
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- contact_person
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enterprises' AND COLUMN_NAME = 'contact_person');
SET @s := IF(@c = 0,
  "ALTER TABLE `enterprises` ADD COLUMN `contact_person` VARCHAR(255) NULL",
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- joined_date
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enterprises' AND COLUMN_NAME = 'joined_date');
SET @s := IF(@c = 0,
  "ALTER TABLE `enterprises` ADD COLUMN `joined_date` VARCHAR(20) NULL",
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Kiểm tra kết quả
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enterprises'
  AND COLUMN_NAME IN ('partner_status','status','rejection_reason','contact_person','joined_date');
