CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NULL,
    title VARCHAR(255) NOT NULL,
    contentType ENUM('video', 'text', 'quiz') NOT NULL,
    content JSON NULL,
    duration FLOAT NULL,
    status ENUM('active', 'removed', 'blocked') DEFAULT 'active',
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