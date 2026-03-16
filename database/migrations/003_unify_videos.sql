-- Unify Highlight_Videos + mascot_videos into a single `videos` table.
-- Dialect: MySQL (InnoDB)
--
-- New table: `videos`
-- - type: ENUM('highlight','mascot')
-- - composite index: (user_id, type)
--

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
  `status` ENUM('processing', 'ready') DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_videos_user_type` (`user_id`, `type`),
  INDEX `idx_videos_user_type_status` (`user_id`, `type`, `status`),
  INDEX `idx_videos_mascot_image_id` (`mascot_image_id`),
  CONSTRAINT `fk_videos_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_videos_mascot_image`
    FOREIGN KEY (`mascot_image_id`) REFERENCES `mascot_images` (`image_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- Data migration (safe to run only if legacy tables exist).
-- If your DB already dropped legacy tables, you can skip these.
--
-- Migrate highlights -> videos(type=highlight)
INSERT INTO `videos` (`user_id`, `type`, `name`, `url`, `duration`, `highlight_metadata`, `raw_video_id`, `status`, `created_at`, `updated_at`)
SELECT
  hv.`user_id`,
  'highlight' AS `type`,
  hv.`video_name` AS `name`,
  hv.`url`,
  hv.`duration`,
  hv.`highlight_metadata`,
  hv.`raw_video_id`,
  hv.`status`,
  COALESCE(hv.`created_at`, CURRENT_TIMESTAMP) AS `created_at`,
  COALESCE(hv.`created_at`, CURRENT_TIMESTAMP) AS `updated_at`
FROM `Highlight_Videos` hv
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables t
  WHERE t.table_schema = DATABASE() AND t.table_name = 'Highlight_Videos'
);

-- Migrate mascot videos -> videos(type=mascot)
-- user_id derived from mascot_images.user_id
INSERT INTO `videos` (`user_id`, `mascot_image_id`, `type`, `url`, `duration`, `created_at`, `updated_at`)
SELECT
  mi.`user_id`,
  mv.`image_id` AS `mascot_image_id`,
  'mascot' AS `type`,
  mv.`url`,
  mv.`duration`,
  COALESCE(mv.`createdAt`, CURRENT_TIMESTAMP) AS `created_at`,
  COALESCE(mv.`updatedAt`, COALESCE(mv.`createdAt`, CURRENT_TIMESTAMP)) AS `updated_at`
FROM `mascot_videos` mv
LEFT JOIN `mascot_images` mi ON mi.`image_id` = mv.`image_id`
WHERE EXISTS (
  SELECT 1
  FROM information_schema.tables t
  WHERE t.table_schema = DATABASE() AND t.table_name = 'mascot_videos'
);

-- Optional: You may drop legacy tables after verifying data
-- DROP TABLE IF EXISTS `Highlight_Videos`;
-- DROP TABLE IF EXISTS `mascot_videos`;


