CREATE TABLE IF NOT EXISTS `videos` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `mascot_image_id` INT(11) DEFAULT NULL,
    `type` ENUM('highlight', 'mascot') NOT NULL,
    `name` VARCHAR(255) DEFAULT NULL,
    `url` TEXT NOT NULL,
    `duration` DOUBLE DEFAULT NULL,
    `highlight_metadata` JSON DEFAULT NULL,
    `raw_video_id` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_videos_user_type` (`user_id`, `type`),
    INDEX `idx_videos_user_highlight` (
        `user_id`,
        (
            CASE
                WHEN `type` = 'highlight' THEN 1
                ELSE NULL
            END
        )
    ),
    INDEX `idx_videos_user_mascot` (
        `user_id`,
        (
            CASE
                WHEN `type` = 'mascot' THEN 1
                ELSE NULL
            END
        )
    ),
    CONSTRAINT `fk_videos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_videos_mascot_image` FOREIGN KEY (`mascot_image_id`) REFERENCES `mascot_images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Migrate highlights -> videos(type=highlight)
INSERT INTO
    `videos` (
        `user_id`,
        `mascot_image_id`,
        `type`,
        `url`,
        `duration`,
        `created_at`,
        `updated_at`
    )
SELECT mi.`user_id`, mv.`image_id`, 'mascot', mv.`url`, mv.`duration`, COALESCE(
        mv.`createdAt`, CURRENT_TIMESTAMP
    ), COALESCE(
        mv.`updatedAt`, mv.`createdAt`, CURRENT_TIMESTAMP
    )
FROM
    `mascot_videos` mv
    JOIN `mascot_images` mi ON mi.`image_id` = mv.`image_id`
WHERE
    mi.`user_id` IS NOT NULL;

);

-- DROP TABLE IF EXISTS `Highlight_Videos`;
-- DROP TABLE IF EXISTS `mascot_videos`;