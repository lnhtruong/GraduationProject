-- job_id: cùng một giá trị cho webhook video + webhook raw SRT (Colab)
ALTER TABLE `videos` ADD COLUMN `job_id` VARCHAR(255) NULL;

CREATE INDEX `idx_videos_job_id` ON `videos` (`job_id`);

-- Cho phép bản ghi “chờ” khi webhook raw tới trước video
ALTER TABLE `videos` MODIFY COLUMN `url` TEXT NULL;

-- --- Legacy: nếu DB cũ vẫn còn cột `srt_highlight` (trước khi đổi tên trong 007), chạy tay:
-- ALTER TABLE `videos` CHANGE COLUMN `srt_highlight` `srt_raw_url` TEXT NULL;