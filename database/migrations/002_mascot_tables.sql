CREATE TABLE IF NOT EXISTS `mascot_images` (
    `image_id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`image_id`),
    INDEX `idx_mascot_images_user_id` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mascot_videos` (
    `mascot_video_id` INT(11) NOT NULL AUTO_INCREMENT,
    `image_id` INT(11) DEFAULT NULL,
    `url` VARCHAR(255) NOT NULL,
    `duration` INT(11) NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`mascot_video_id`),
    INDEX `idx_mascot_videos_image_id` (`image_id`),
    CONSTRAINT `fk_mascot_videos_image` FOREIGN KEY (`image_id`) REFERENCES `mascot_images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mascot_overlays` (
    `mascot_overlay_id` INT(11) NOT NULL AUTO_INCREMENT,
    `edit_id` INT(11) NOT NULL,
    `position_x` FLOAT NOT NULL,
    `position_y` FLOAT NOT NULL,
    `scale` FLOAT NOT NULL,
    `start_time` FLOAT NOT NULL,
    `end_time` FLOAT NOT NULL,
    `layer_index` INT(11) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`mascot_overlay_id`),
    INDEX `idx_mascot_overlay_edit_id` (`edit_id`),
    CONSTRAINT `fk_mascot_overlay_project` FOREIGN KEY (`edit_id`) REFERENCES `projects` (`edit_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;