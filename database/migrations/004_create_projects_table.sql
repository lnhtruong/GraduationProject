CREATE TABLE IF NOT EXISTS `projects` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `origin_video_id` INT(11) DEFAULT NULL,
    `session_name` VARCHAR(255) NOT NULL,
    `status` ENUM('draft', 'saved', 'finalized') DEFAULT 'draft',
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_projects_user_id` (`user_id`),
    CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_projects_video` FOREIGN KEY (`origin_video_id`) REFERENCES `videos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE `projects`
DROP FOREIGN KEY `fk_projects_video`,
DROP FOREIGN KEY `fk_projects_user`;

ALTER TABLE `projects`
CHANGE COLUMN `id` `edit_id` INT(11) NOT NULL AUTO_INCREMENT,
CHANGE COLUMN `origin_video_id` `video_id` INT(11) DEFAULT NULL,
CHANGE COLUMN `createdAt` `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
CHANGE COLUMN `updatedAt` `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `projects`
DROP INDEX `idx_projects_user_id`,
ADD INDEX `idx_projects_user_id` (`user_id`),
ADD INDEX `idx_projects_video_id` (`video_id`);

ALTER TABLE `projects`
ADD CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `fk_projects_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;