-- GraduationProject: schema đầy đủ hiện tại (gộp từ legacy migrations 001–008).
-- Dùng cho: DB mới — chạy một lần (qua Knex migration `initial_schema`) hoặc import tay.
-- Các thay đổi sau này: thêm file mới trong `database/knex_migrations/`.

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- ========== 001 ==========
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO
    `roles` (`name`)
VALUES ('ADMIN'),
    ('STUDENT'),
    ('LECTURER');

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) DEFAULT NULL,
    `lastName` VARCHAR(100) DEFAULT NULL,
    `role` INT DEFAULT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ========== 002 (mascot; projects tạo sau videos — xem thứ tự bên dưới) ==========
CREATE TABLE IF NOT EXISTS `mascot_images` (
    `image_id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `job_id` VARCHAR(64) NULL,
    `thumbnail` VARCHAR(1024) NULL,
    `public_id` VARCHAR(512) NULL,
    `format` VARCHAR(32) NULL,
    `name` VARCHAR(255) NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`image_id`),
    INDEX `idx_mascot_images_user_id` (`user_id`),
    UNIQUE KEY `uq_mascot_images_job_id` (`job_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mascot_overlays` (
    `mascot_overlay_id` INT(11) NOT NULL AUTO_INCREMENT,
    `edit_id` INT(11) NOT NULL,
    `image_id` INT(11) DEFAULT NULL,
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
    INDEX `idx_mascot_overlay_image_id` (`image_id`),
    CONSTRAINT `fk_mascot_overlay_project` FOREIGN KEY (`edit_id`) REFERENCES `projects` (`edit_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_mascot_overlay_image` FOREIGN KEY (`image_id`) REFERENCES `mascot_images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ========== 003 + 005 + 007 + 008 (videos — trạng thái cuối) ==========
CREATE TABLE IF NOT EXISTS `videos` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `mascot_image_id` INT(11) DEFAULT NULL,
    `type` ENUM('highlight', 'mascot', 'long') NOT NULL,
    `name` VARCHAR(255) DEFAULT NULL,
    `url` TEXT NULL,
    `duration` DOUBLE DEFAULT NULL,
    `thumbnail` VARCHAR(512) NOT NULL DEFAULT 'https://placehold.co/320x180/png?text=thumbnail',
    `srt_raw_url` TEXT NULL,
    `bunny_video_guid` VARCHAR(64) NULL,
    `job_id` VARCHAR(255) NULL,
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
    UNIQUE INDEX `uq_videos_job_id` (`job_id`),
    UNIQUE INDEX `uq_videos_bunny_video_guid` (`bunny_video_guid`),
    CONSTRAINT `fk_videos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_videos_mascot_image` FOREIGN KEY (`mascot_image_id`) REFERENCES `mascot_images` (`image_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ========== 004 (projects — dạng cuối sau các ALTER) ==========
CREATE TABLE IF NOT EXISTS `projects` (
    `edit_id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `video_id` INT(11) DEFAULT NULL,
    `session_name` VARCHAR(255) NOT NULL,
    `status` ENUM('draft', 'saved', 'finalized') DEFAULT 'draft',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`edit_id`),
    INDEX `idx_projects_user_id` (`user_id`),
    INDEX `idx_projects_video_id` (`video_id`),
    CONSTRAINT `fk_projects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_projects_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ========== 006 + 007 (lessons có video_id) ==========
CREATE TABLE `lessons` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NULL,
    title VARCHAR(255) NOT NULL,
    contentType ENUM('video', 'text', 'quiz') NOT NULL,
    content JSON NULL,
    duration TIME(3) NULL,
    status ENUM(
        'active',
        'removed',
        'blocked'
    ) DEFAULT 'active',
    description VARCHAR(255) NULL,
    video_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lessons_course_id (course_id),
    INDEX idx_lessons_video_id (video_id)
);

CREATE TABLE lesson_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NULL,
    activity_type ENUM('quiz', 'assignment') NULL,
    title TEXT NULL,
    description TEXT NULL,
    order_index INT NULL,
    max_attempts INT NULL,
    status ENUM(
        'draft',
        'public',
        'archived',
        'removed'
    ) DEFAULT 'draft',
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lesson_activities_lesson_id (lesson_id),
    INDEX idx_lesson_activities_created_by (created_by)
);

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_activity_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    shuffle_question BOOLEAN DEFAULT FALSE,
    shuffle_option BOOLEAN DEFAULT FALSE,
    passing_score DOUBLE NULL,
    time_limit_minutes INT NULL,
    is_in_video BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quizzes_lesson_activity_id (lesson_activity_id),
    CONSTRAINT fk_quizzes_lesson_activity FOREIGN KEY (lesson_activity_id) REFERENCES lesson_activities (id) ON DELETE CASCADE
);

CREATE TABLE quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    ques_type ENUM(
        'short_text',
        'mcq',
        'true/false'
    ) NOT NULL,
    ques_text TEXT NOT NULL,
    point DECIMAL(10, 2) NULL,
    correct_ans TEXT NULL,
    order_index INT NULL,
    video_timestamp TIME(3) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_questions_quiz_id (quiz_id),
    CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
);

CREATE TABLE quiz_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_options_question_id (question_id),
    CONSTRAINT fk_quiz_options_question FOREIGN KEY (question_id) REFERENCES quiz_questions (id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;