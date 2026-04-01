CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NULL,
    title VARCHAR(255) NOT NULL,
    contentType ENUM('video', 'text', 'quiz') NOT NULL,
    content JSON NULL,
    duration FLOAT NULL,
    status ENUM(
        'active',
        'removed',
        'blocked'
    ) DEFAULT 'active',
    description VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lessons_course_id (course_id)
);

CREATE TABLE lesson_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NULL,
    activity_type ENUM('quiz', 'assignment') NULL,
    title TEXT NULL,
    description TEXT NULL,
    order_index INT NULL,
    max_attempts INT NULL,
    status ENUM('draft', 'public', 'archived', 'removed') DEFAULT 'draft',
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

-- Tạo index cho các trường hay dùng để query/filter
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