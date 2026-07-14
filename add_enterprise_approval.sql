-- Bổ sung cột cho luồng duyệt DN đối tác (chạy khi server để DB_SYNC=false).
-- An toàn với dữ liệu cũ: mặc định status='approved' nên mọi DN hiện có vẫn hợp lệ.

ALTER TABLE `enterprises`
  ADD COLUMN `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' AFTER `partner_status`,
  ADD COLUMN `rejection_reason` TEXT NULL AFTER `status`,
  ADD COLUMN `contact_person` VARCHAR(255) NULL AFTER `rejection_reason`;

-- (Tuỳ chọn) đánh index để lọc hàng đợi chờ duyệt nhanh hơn:
ALTER TABLE `enterprises` ADD INDEX `idx_enterprises_status` (`status`);
