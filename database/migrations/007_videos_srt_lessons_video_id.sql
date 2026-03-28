-- Highlight SRT transcript (can be very long)
ALTER TABLE `videos` ADD COLUMN `srt_highlight` LONGTEXT NULL;

-- Link lesson to source video (nullable)
ALTER TABLE `lessons`
ADD COLUMN `video_id` INT NULL,
ADD INDEX `idx_lessons_video_id` (`video_id`);

-- Optional FK (uncomment if you want referential integrity)
-- ALTER TABLE `lessons`
-- ADD CONSTRAINT `fk_lessons_video`
-- FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;