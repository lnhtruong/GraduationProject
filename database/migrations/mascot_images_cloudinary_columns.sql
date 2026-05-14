-- Extends mascot_images for Cloudinary direct uploads (webhook → handleCloudinaryImage).
-- Run after initial_schema.sql when deploying.

ALTER TABLE `mascot_images`
    ADD COLUMN `job_id` VARCHAR(64) NULL AFTER `url`,
    ADD COLUMN `thumbnail` VARCHAR(1024) NULL AFTER `job_id`,
    ADD COLUMN `public_id` VARCHAR(512) NULL AFTER `thumbnail`,
    ADD COLUMN `format` VARCHAR(32) NULL AFTER `public_id`,
    ADD COLUMN `name` VARCHAR(255) NULL AFTER `format`,
    ADD UNIQUE KEY `uq_mascot_images_job_id` (`job_id`);
