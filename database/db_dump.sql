CREATE TABLE IF NOT EXISTS `Users` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`email` VARCHAR(255) NOT NULL,
	`password_hash` VARCHAR(255) NOT NULL,
	`fname` VARCHAR(255) NOT NULL,
	`lname` VARCHAR(255),
	`role` INTEGER,
	`updated_at` DATETIME,
	`created_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Roles` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(255) NOT NULL,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Courses` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(255) NOT NULL,
	`description` VARCHAR(255),
	`categories` INTEGER NOT NULL COMMENT 'mảng key trỏ đến categories
',
	`level` ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner' COMMENT 'Beginner, Intermediate, Advanced',
	`duration` TIME NOT NULL,
	`language` VARCHAR(255) NOT NULL,
	`price` DOUBLE NOT NULL,
	`user_id` INTEGER NOT NULL,
	`status` ENUM('draft', 'pending', 'approved', 'rejected', 'publish') NOT NULL COMMENT 'draft, pending, approved, rejected, publish',
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `RoadMaps` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`user_id` INTEGER,
	`description` VARCHAR(255),
	`name` CHAR(1),
	`total_courses` INTEGER,
	`progress` INTEGER COMMENT 'total number courses finished',
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `RoadMap_Course` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`course_id` INTEGER,
	`roadmap_id` INTEGER,
	`index` INTEGER COMMENT 'learning order in roadmap',
	`status` ENUM('null', 'learning', 'finish') DEFAULT null COMMENT 'null, learning, finish',
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Lessons` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`couse_id` INTEGER NOT NULL,
	`title` VARCHAR(255) NOT NULL,
	`contentType` ENUM('video', 'text', 'quiz', 'assignment') NOT NULL DEFAULT 'video' COMMENT 'video, text, quiz, assignment',
	`content` JSON NOT NULL,
	`duration` FLOAT NOT NULL,
	`status` ENUM('active', 'removed', 'blocked') DEFAULT 'active',
	`description` VARCHAR(255) NOT NULL,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Enrolls` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`user_id` INTEGER,
	`course_id` INTEGER,
	`progress` DOUBLE,
	`status` ENUM('active', 'completed', 'dropped') DEFAULT 'active' COMMENT 'active, completed, dropped',
	`enrolled_at` DATETIME,
	`completed_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `LessonProgress` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`user_id` INTEGER,
	`course_id` INTEGER,
	`lesson_id` INTEGER,
	`progress` ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started' COMMENT 'not_started, in_progress, completed',
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Quizzes` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`lesson_activity_id` INTEGER,
	`name` VARCHAR(255),
	`shuffle_ques` BOOLEAN DEFAULT false,
	`shuffle_options` BOOLEAN DEFAULT false COMMENT 'đảo thứ tự câu trả lời',
	`passing_score` DOUBLE,
	`time_limit_minutes` INTEGER,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Assignments` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`lesson_activity_id` INTEGER,
	` assignment_type` ENUM('code', 'quiz') DEFAULT 'code' COMMENT 'code, quiz',
	`content` TEXT(65535),
	`expected_output` TEXT(65535),
	`max_score` DOUBLE,
	`pass_score` DOUBLE,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Quiz_Options` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`question_id` INTEGER,
	`option_text` TEXT(65535),
	`is_correct` BOOLEAN,
	`order_index` INTEGER,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Quiz_Questions` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`quiz_id` INTEGER NOT NULL,
	`ques_type` ENUM('MCQ', 'SHORT_TEXT', 'TRUE/FALSE') NOT NULL DEFAULT 'MCQ' COMMENT 'MCQ, SHORT_TEXT, TRUE/FALSE',
	`ques_text` TEXT(65535) NOT NULL,
	`point` DECIMAL NOT NULL,
	`correct_ans` TEXT(65535) NOT NULL,
	`order_index` INTEGER NOT NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Submissions` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`lesson_activity_id` INTEGER NOT NULL,
	`user_id` INTEGER NOT NULL,
	`status` ENUM('IN_PROGRESS', 'SUBMITTED', 'PASSED', 'FAILED') NOT NULL DEFAULT 'IN_PROGRESS' COMMENT 'IN_PROGRESS, SUBMITTED, PASSED, FAILED',
	`started_at` DATETIME NOT NULL,
	`submitted_at` DATETIME NOT NULL,
	`graded_at` DATETIME NOT NULL,
	`score` DOUBLE NOT NULL,
	`max_score` DOUBLE NOT NULL,
	`pass_flag` BOOLEAN NOT NULL,
	`grader_id` INTEGER NOT NULL,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Lesson_Activities` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`lesson_id` INTEGER,
	`activity_type` ENUM('QUIZ', 'ASSIGNMENT') DEFAULT 'QUIZ' COMMENT 'QUIZ, ASSIGNMENT',
	`title` TEXT(65535),
	`description` TEXT(65535),
	`order_index` INTEGER,
	`max_attempts` INTEGER,
	`status` ENUM('DRAFT', 'PUBLISH', 'ARCHIVED') DEFAULT 'DRAFT' COMMENT 'DRAFT, PUBLISH, ARCHIVED',
	`created_by` INTEGER,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Submission_Answers` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`submission_id` INTEGER,
	`question_id` INTEGER,
	`answer_type` ENUM('OPTION', 'TEXT', 'CODE', 'FILE') DEFAULT 'OPTION' COMMENT 'OPTION, TEXT, CODE, FILE',
	`select_option_id` INTEGER,
	`answer_text` TEXT(65535),
	`answer_json` JSON,
	`is_correct` BOOLEAN,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Categories` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` TEXT(65535) NOT NULL,
	`description` TEXT(65535) NOT NULL,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Reviews` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`course_id` INTEGER,
	`user_id` INTEGER,
	`rating` DOUBLE,
	`comment` TEXT(65535),
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Certificate_Templates` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` TEXT(65535) NOT NULL,
	`description` TEXT(65535) NOT NULL,
	`background_url` TEXT(65535) NOT NULL,
	`is_active` BOOLEAN NOT NULL,
	`created_by` INTEGER NOT NULL,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Course_Certificate_Templates` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`course_id` INTEGER NOT NULL,
	`certificate_id` INTEGER NOT NULL,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Issued_Certificates` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`user_id` INTEGER,
	`course_id` INTEGER,
	`certificate_template_id` INTEGER,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `Mascot_Image` (
	`image_id` INTEGER AUTO_INCREMENT,
	`user_id` INTEGER,
	`url` TEXT,
	`created_at` DATETIME,
	PRIMARY KEY(`image_id`)
);


CREATE TABLE IF NOT EXISTS `Mascot_Videos` (
	`mascot_video_id` INTEGER AUTO_INCREMENT,
	`image_id` INTEGER,
	`url` TEXT,
	`duration` FLOAT,
	`created_at` DATETIME,
	PRIMARY KEY(`mascot_video_id`)
);


CREATE TABLE IF NOT EXISTS `Mascot_Overlay` (
	`mascot_overlay_id` INTEGER AUTO_INCREMENT,
	`edit_id` INTEGER,
	`mascot_video_id` INTEGER,
	`position_x` FLOAT,
	`position_y` FLOAT,
	`scale` FLOAT,
	`start_time` FLOAT,
	`end_time` FLOAT,
	`layer_index` INTEGER,
	PRIMARY KEY(`mascot_overlay_id`)
);


CREATE TABLE IF NOT EXISTS `Highlight_Videos` (
	`highlight_id` INTEGER AUTO_INCREMENT,
	`user_id` INTEGER,
	`video_name` VARCHAR(255),
	`url` TEXT,
	`duration` FLOAT,
	`highlight_metadata` JSON,
	`raw_video_id` VARCHAR(255),
	`status` ENUM('processing', 'ready'),
	`created_at` DATETIME,
	PRIMARY KEY(`highlight_id`)
);


CREATE TABLE IF NOT EXISTS `Projects` (
	`edit_id` INTEGER AUTO_INCREMENT,
	`user_id` INTEGER,
	`highlight_id` INTEGER,
	`session_name` VARCHAR(255),
	`status` ENUM('draft', 'saved', 'finalized'),
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`edit_id`)
);


CREATE TABLE IF NOT EXISTS `Text_Overlay` (
	`text_id` INTEGER AUTO_INCREMENT,
	`edit_id` INTEGER,
	`content` TEXT,
	`font_family` VARCHAR(255),
	`font_size` INTEGER,
	`color` VARCHAR(50),
	`position_x` FLOAT,
	`position_y` FLOAT,
	`start_time` FLOAT,
	`end_time` FLOAT,
	`layer_index` INTEGER,
	PRIMARY KEY(`text_id`)
);


CREATE TABLE IF NOT EXISTS `Visual_Effects` (
	`effect_id` INTEGER AUTO_INCREMENT,
	`edit_id` INTEGER,
	`filter_type` VARCHAR(100),
	`bright` FLOAT,
	`contrast` FLOAT,
	`saturate` FLOAT,
	`hue` FLOAT,
	`start_time` FLOAT,
	`end_time` FLOAT,
	`layer_index` INTEGER,
	PRIMARY KEY(`effect_id`)
);


CREATE TABLE IF NOT EXISTS `Audio` (
	`audio_id` INTEGER AUTO_INCREMENT,
	`edit_id` INTEGER,
	`voice_profile_id` INTEGER,
	`url` TEXT,
	`start_time` FLOAT,
	`end_time` FLOAT,
	`volume` FLOAT,
	PRIMARY KEY(`audio_id`)
);


CREATE TABLE IF NOT EXISTS `Voice_Profile` (
	`voice_profile_id` INTEGER AUTO_INCREMENT,
	`user_id` INTEGER,
	`audio_url` TEXT,
	`voice_name` VARCHAR(255),
	`created_at` DATETIME,
	PRIMARY KEY(`voice_profile_id`)
);


CREATE TABLE IF NOT EXISTS `Final_Video` (
	`final_video_id` INTEGER AUTO_INCREMENT,
	`edit_id` INTEGER,
	`user_id` INTEGER,
	`video_name` VARCHAR(255),
	`url` TEXT,
	`status` ENUM('processing', 'done', 'failed'),
	`created_at` DATETIME,
	PRIMARY KEY(`final_video_id`)
);


CREATE TABLE IF NOT EXISTS `Payments` (
	`id` INTEGER AUTO_INCREMENT,
	`user_id` INTEGER,
	`course_id` INTEGER,
	`amount` DOUBLE,
	`provider` VARCHAR(50),
	`provider_order_id` VARCHAR(255),
	`status` ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
	`created_at` DATETIME,
	`paid_at` DATETIME,
	PRIMARY KEY(`id`)
);


CREATE TABLE IF NOT EXISTS `DiscussionForum` (
	`post_id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`course_id` INTEGER,
	`user_id` INTEGER,
	`content` INTEGER,
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`post_id`)
);


CREATE TABLE IF NOT EXISTS `Notifications` (
	`id` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`user_id` INTEGER,
	`message` TEXT(65535),
	`status` ENUM('READ', 'UNREAD') DEFAULT 'READ' COMMENT 'READ, UNREAD',
	`created_at` DATETIME,
	`updated_at` DATETIME,
	PRIMARY KEY(`id`)
);


ALTER TABLE `Users`
ADD FOREIGN KEY(`role`) REFERENCES `Roles`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Courses`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `RoadMaps`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `RoadMap_Course`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `RoadMap_Course`
ADD FOREIGN KEY(`roadmap_id`) REFERENCES `RoadMaps`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Lessons`
ADD FOREIGN KEY(`couse_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Enrolls`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Enrolls`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `LessonProgress`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `LessonProgress`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `LessonProgress`
ADD FOREIGN KEY(`lesson_id`) REFERENCES `Lessons`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Quiz_Questions`
ADD FOREIGN KEY(`quiz_id`) REFERENCES `Quizzes`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Quiz_Options`
ADD FOREIGN KEY(`question_id`) REFERENCES `Quiz_Questions`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Submissions`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Submissions`
ADD FOREIGN KEY(`grader_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Lesson_Activities`
ADD FOREIGN KEY(`created_by`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Submissions`
ADD FOREIGN KEY(`lesson_activity_id`) REFERENCES `Lesson_Activities`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Lesson_Activities`
ADD FOREIGN KEY(`lesson_id`) REFERENCES `Lessons`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Quizzes`
ADD FOREIGN KEY(`lesson_activity_id`) REFERENCES `Lesson_Activities`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Assignments`
ADD FOREIGN KEY(`lesson_activity_id`) REFERENCES `Lesson_Activities`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Submission_Answers`
ADD FOREIGN KEY(`submission_id`) REFERENCES `Submissions`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Submission_Answers`
ADD FOREIGN KEY(`question_id`) REFERENCES `Lesson_Activities`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Courses`
ADD FOREIGN KEY(`categories`) REFERENCES `Categories`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Reviews`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Reviews`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Course_Certificate_Templates`
ADD FOREIGN KEY(`certificate_id`) REFERENCES `Certificate_Templates`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Course_Certificate_Templates`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Issued_Certificates`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Issued_Certificates`
ADD FOREIGN KEY(`certificate_template_id`) REFERENCES `Certificate_Templates`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Issued_Certificates`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Mascot_Image`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Mascot_Videos`
ADD FOREIGN KEY(`image_id`) REFERENCES `Mascot_Image`(`image_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Mascot_Overlay`
ADD FOREIGN KEY(`mascot_video_id`) REFERENCES `Mascot_Videos`(`mascot_video_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Mascot_Overlay`
ADD FOREIGN KEY(`edit_id`) REFERENCES `Projects`(`edit_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Projects`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Highlight_Videos`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Projects`
ADD FOREIGN KEY(`highlight_id`) REFERENCES `Highlight_Videos`(`highlight_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Text_Overlay`
ADD FOREIGN KEY(`edit_id`) REFERENCES `Projects`(`edit_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Visual_Effects`
ADD FOREIGN KEY(`edit_id`) REFERENCES `Projects`(`edit_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Audio`
ADD FOREIGN KEY(`edit_id`) REFERENCES `Projects`(`edit_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Final_Video`
ADD FOREIGN KEY(`edit_id`) REFERENCES `Projects`(`edit_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Final_Video`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Voice_Profile`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Audio`
ADD FOREIGN KEY(`voice_profile_id`) REFERENCES `Voice_Profile`(`voice_profile_id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Payments`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Payments`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `DiscussionForum`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `DiscussionForum`
ADD FOREIGN KEY(`course_id`) REFERENCES `Courses`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `Notifications`
ADD FOREIGN KEY(`user_id`) REFERENCES `Users`(`id`)
ON UPDATE NO ACTION ON DELETE NO ACTION;