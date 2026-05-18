-- ============================================================================
-- SEED DATA for GraduationProject (LMS demo)
-- ----------------------------------------------------------------------------
-- Run AFTER `yarn migrate` (Knex migrations) so all tables already exist.
-- Covers every table EXCEPT the highlight_feed family:
--   - SKIPPED: highlight_feed, feed_comments, feed_interactions, feed_views
--
-- All users share the same demo password: "password"
-- (bcrypt: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate in reverse-dependency order so re-running the seed leaves no orphans
TRUNCATE TABLE reports;
TRUNCATE TABLE notifications;
TRUNCATE TABLE transaction_items;
TRUNCATE TABLE transactions;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE carts;
TRUNCATE TABLE feedback_reactions;
TRUNCATE TABLE feedbacks;
TRUNCATE TABLE roadmap_course;
TRUNCATE TABLE roadmaps;
TRUNCATE TABLE lesson_progress;
TRUNCATE TABLE enrolls;
TRUNCATE TABLE quiz_options;
TRUNCATE TABLE quiz_questions;
TRUNCATE TABLE quizzes;
TRUNCATE TABLE lesson_activities;
TRUNCATE TABLE lessons;
TRUNCATE TABLE courses;
TRUNCATE TABLE mascot_overlays;
TRUNCATE TABLE projects;
TRUNCATE TABLE videos;
TRUNCATE TABLE mascot_images;
TRUNCATE TABLE users;

-- ============================================================================
-- USERS (1 admin + 9 lecturers + 15 students = 25 users)
-- role: 1=ADMIN, 2=STUDENT, 3=LECTURER
-- ============================================================================
INSERT INTO users (id, email, password, firstName, lastName, role, avatarUrl, is_banned, createdAt, updatedAt) VALUES
-- Admin
( 1, 'admin@graduation.local',           '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin',    'System',        1, 'https://i.pravatar.cc/200?img=68', 0, '2025-09-01 08:00:00', '2025-09-01 08:00:00'),

-- Lecturers (id 2 → 10)
( 2, 'teacher.english@graduation.local',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Hương',    'Nguyễn',        3, 'https://i.pravatar.cc/200?img=47', 0, '2025-09-05 09:10:00', '2025-09-05 09:10:00'),
( 3, 'teacher.chinese@graduation.local',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Minh',     'Lý',            3, 'https://i.pravatar.cc/200?img=32', 0, '2025-09-06 10:00:00', '2025-09-06 10:00:00'),
( 4, 'teacher.webdev@graduation.local',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Khoa',     'Trần',          3, 'https://i.pravatar.cc/200?img=12', 0, '2025-09-07 10:20:00', '2025-09-07 10:20:00'),
( 5, 'teacher.system@graduation.local',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'An',       'Phạm',          3, 'https://i.pravatar.cc/200?img=15', 0, '2025-09-08 11:00:00', '2025-09-08 11:00:00'),
( 6, 'teacher.python@graduation.local',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Linh',     'Đặng',          3, 'https://i.pravatar.cc/200?img=24', 0, '2025-09-09 11:30:00', '2025-09-09 11:30:00'),
( 7, 'teacher.design@graduation.local',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thảo',     'Hoàng',         3, 'https://i.pravatar.cc/200?img=49', 0, '2025-09-10 12:00:00', '2025-09-10 12:00:00'),
( 8, 'teacher.marketing@graduation.local','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bảo',      'Vũ',            3, 'https://i.pravatar.cc/200?img=11', 0, '2025-09-11 12:30:00', '2025-09-11 12:30:00'),
( 9, 'teacher.video@graduation.local',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quân',     'Lê',            3, 'https://i.pravatar.cc/200?img=51', 0, '2025-09-12 13:00:00', '2025-09-12 13:00:00'),
(10, 'teacher.softskills@graduation.local','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Mai',      'Bùi',           3, 'https://i.pravatar.cc/200?img=44', 0, '2025-09-13 13:30:00', '2025-09-13 13:30:00'),

-- Students (id 11 → 25)
(11, 'student.alex@graduation.local',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alex',     'Tran',          2, 'https://i.pravatar.cc/200?img=13', 0, '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(12, 'student.bao@graduation.local',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bảo',      'Nguyễn',        2, 'https://i.pravatar.cc/200?img=14', 0, '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
(13, 'student.chi@graduation.local',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Chi',      'Phan',          2, 'https://i.pravatar.cc/200?img=20', 0, '2025-10-03 09:00:00', '2025-10-03 09:00:00'),
(14, 'student.dat@graduation.local',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Đạt',      'Vũ',            2, 'https://i.pravatar.cc/200?img=33', 0, '2025-10-04 09:00:00', '2025-10-04 09:00:00'),
(15, 'student.emily@graduation.local',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emily',    'Hoàng',         2, 'https://i.pravatar.cc/200?img=45', 0, '2025-10-05 09:00:00', '2025-10-05 09:00:00'),
(16, 'student.feng@graduation.local',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Phong',    'Đỗ',            2, 'https://i.pravatar.cc/200?img=16', 0, '2025-10-06 09:00:00', '2025-10-06 09:00:00'),
(17, 'student.giang@graduation.local',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Giang',    'Lê',            2, 'https://i.pravatar.cc/200?img=23', 0, '2025-10-07 09:00:00', '2025-10-07 09:00:00'),
(18, 'student.hanh@graduation.local',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Hạnh',     'Trương',        2, 'https://i.pravatar.cc/200?img=26', 0, '2025-10-08 09:00:00', '2025-10-08 09:00:00'),
(19, 'student.ivy@graduation.local',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ivy',      'Park',          2, 'https://i.pravatar.cc/200?img=48', 0, '2025-10-09 09:00:00', '2025-10-09 09:00:00'),
(20, 'student.john@graduation.local',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John',     'Reyes',         2, 'https://i.pravatar.cc/200?img=8',  0, '2025-10-10 09:00:00', '2025-10-10 09:00:00'),
(21, 'student.kim@graduation.local',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kim',      'Vũ',            2, 'https://i.pravatar.cc/200?img=29', 0, '2025-10-11 09:00:00', '2025-10-11 09:00:00'),
(22, 'student.long@graduation.local',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Long',     'Đoàn',          2, 'https://i.pravatar.cc/200?img=17', 0, '2025-10-12 09:00:00', '2025-10-12 09:00:00'),
(23, 'student.my@graduation.local',       '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'My',       'Bùi',           2, 'https://i.pravatar.cc/200?img=40', 0, '2025-10-13 09:00:00', '2025-10-13 09:00:00'),
(24, 'student.ngan@graduation.local',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ngân',     'Phạm',          2, 'https://i.pravatar.cc/200?img=21', 0, '2025-10-14 09:00:00', '2025-10-14 09:00:00'),
(25, 'student.oanh@graduation.local',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Oanh',     'Trịnh',         2, 'https://i.pravatar.cc/200?img=36', 0, '2025-10-15 09:00:00', '2025-10-15 09:00:00');

-- ============================================================================
-- MASCOT IMAGES (one stock mascot per teacher who uses the video editor)
-- ============================================================================
INSERT INTO mascot_images (image_id, user_id, url, job_id, thumbnail, public_id, format, name, createdAt, updatedAt) VALUES
(1, 2, 'https://res.cloudinary.com/demo/image/upload/v1700000001/mascot/english_owl.png',  'job-mascot-eng-001', 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_180/v1700000001/mascot/english_owl.png',  'mascot/english_owl',  'png', 'Owl Teacher',        '2025-09-20 10:00:00', '2025-09-20 10:00:00'),
(2, 4, 'https://res.cloudinary.com/demo/image/upload/v1700000002/mascot/web_robot.png',     'job-mascot-web-002', 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_180/v1700000002/mascot/web_robot.png',     'mascot/web_robot',    'png', 'Web Robot',          '2025-09-21 10:00:00', '2025-09-21 10:00:00'),
(3, 5, 'https://res.cloudinary.com/demo/image/upload/v1700000003/mascot/server_cat.png',    'job-mascot-sys-003', 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_180/v1700000003/mascot/server_cat.png',    'mascot/server_cat',   'png', 'Server Cat',         '2025-09-22 10:00:00', '2025-09-22 10:00:00'),
(4, 6, 'https://res.cloudinary.com/demo/image/upload/v1700000004/mascot/python_snake.png',  'job-mascot-py-004',  'https://res.cloudinary.com/demo/image/upload/c_thumb,w_180/v1700000004/mascot/python_snake.png',  'mascot/python_snake', 'png', 'Python Snake',       '2025-09-23 10:00:00', '2025-09-23 10:00:00'),
(5, 7, 'https://res.cloudinary.com/demo/image/upload/v1700000005/mascot/design_fox.png',    'job-mascot-des-005', 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_180/v1700000005/mascot/design_fox.png',    'mascot/design_fox',   'png', 'Designer Fox',       '2025-09-24 10:00:00', '2025-09-24 10:00:00'),
(6, 8, 'https://res.cloudinary.com/demo/image/upload/v1700000006/mascot/marketing_dog.png', 'job-mascot-mkt-006', 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_180/v1700000006/mascot/marketing_dog.png', 'mascot/marketing_dog','png', 'Marketing Dog',      '2025-09-25 10:00:00', '2025-09-25 10:00:00'),
(7, 9, 'https://res.cloudinary.com/demo/image/upload/v1700000007/mascot/editor_panda.png',  'job-mascot-vid-007', 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_180/v1700000007/mascot/editor_panda.png',  'mascot/editor_panda', 'png', 'Editor Panda',       '2025-09-26 10:00:00', '2025-09-26 10:00:00');

-- ============================================================================
-- VIDEOS (31 long-form course videos, all stored on Bunny Stream)
-- id 1..31 mapped to teachers as planned in the seed README at the top
-- ============================================================================
INSERT INTO videos (id, user_id, mascot_image_id, type, name, url, duration, thumbnail, srt_raw_url, bunny_video_guid, job_id, created_at, updated_at) VALUES
-- TOEIC English (teacher 2)
( 1, 2, 1, 'long', 'Phân Từ | TOEIC Grammar - Lesson 5: Participles',                  'https://vz-e17ee266-cac.b-cdn.net/01b1f404-4548-4004-b637-d788b9b3b6b3/playlist.m3u8', 2280, 'https://vz-e17ee266-cac.b-cdn.net/01b1f404-4548-4004-b637-d788b9b3b6b3/thumbnail.jpg', NULL, '01b1f404-4548-4004-b637-d788b9b3b6b3', 'job-vid-toeic-l5', '2025-09-20 10:00:00', '2025-09-20 10:00:00'),
( 2, 2, 1, 'long', 'To V1, V-ing, V1 | TOEIC Grammar - Lesson 4',                      'https://vz-e17ee266-cac.b-cdn.net/12e62e2f-c4e4-48c1-8eae-0ddeb8bdc138/playlist.m3u8', 2400, 'https://vz-e17ee266-cac.b-cdn.net/12e62e2f-c4e4-48c1-8eae-0ddeb8bdc138/thumbnail.jpg', NULL, '12e62e2f-c4e4-48c1-8eae-0ddeb8bdc138', 'job-vid-toeic-l4', '2025-09-20 10:05:00', '2025-09-20 10:05:00'),
( 3, 2, 1, 'long', 'Các Thì Trong Tiếng Anh | TOEIC Grammar - Lesson 3: Tenses',       'https://vz-e17ee266-cac.b-cdn.net/edbdcf57-c807-41a6-81d1-302c6ecdcaff/playlist.m3u8', 2640, 'https://vz-e17ee266-cac.b-cdn.net/edbdcf57-c807-41a6-81d1-302c6ecdcaff/thumbnail.jpg', NULL, 'edbdcf57-c807-41a6-81d1-302c6ecdcaff', 'job-vid-toeic-l3', '2025-09-20 10:10:00', '2025-09-20 10:10:00'),

-- System Design / DSA (teacher 5)
( 4, 5, 3, 'long', 'System Design Course - APIs, Databases, Caching, CDNs, Load Balancing & Production Infra', 'https://vz-e17ee266-cac.b-cdn.net/5cd2ec36-9b69-4c4d-962a-0c3719a08775/playlist.m3u8', 14400, 'https://vz-e17ee266-cac.b-cdn.net/5cd2ec36-9b69-4c4d-962a-0c3719a08775/thumbnail.jpg', NULL, '5cd2ec36-9b69-4c4d-962a-0c3719a08775', 'job-vid-sysdesign-01', '2025-09-22 09:00:00', '2025-09-22 09:00:00'),

-- Web Development (teacher 4)
( 5, 4, 2, 'long', 'Cài Đặt Môi Trường Lập Trình Cho Máy Windows Mới',                 'https://vz-e17ee266-cac.b-cdn.net/7e45f2ff-0d61-4394-87c2-b3410c3773e5/playlist.m3u8', 1800, 'https://vz-e17ee266-cac.b-cdn.net/7e45f2ff-0d61-4394-87c2-b3410c3773e5/thumbnail.jpg', NULL, '7e45f2ff-0d61-4394-87c2-b3410c3773e5', 'job-vid-setup-win',   '2025-09-21 09:00:00', '2025-09-21 09:00:00'),
( 6, 4, 2, 'long', 'CORS Policy Là Gì? | Cách Xử Lý Khi Bị Chặn Bởi CORS',              'https://vz-e17ee266-cac.b-cdn.net/631e8c58-4f26-47b5-91de-c9e65633aebe/playlist.m3u8', 1500, 'https://vz-e17ee266-cac.b-cdn.net/631e8c58-4f26-47b5-91de-c9e65633aebe/thumbnail.jpg', NULL, '631e8c58-4f26-47b5-91de-c9e65633aebe', 'job-vid-cors',        '2025-09-21 09:10:00', '2025-09-21 09:10:00'),
( 7, 4, 2, 'long', 'freeCodeCamp JavaScript Full Course',                              'https://vz-e17ee266-cac.b-cdn.net/aa94406d-6d06-4603-9803-3449db7e428f/playlist.m3u8', 12600, 'https://vz-e17ee266-cac.b-cdn.net/aa94406d-6d06-4603-9803-3449db7e428f/thumbnail.jpg', NULL, 'aa94406d-6d06-4603-9803-3449db7e428f', 'job-vid-fcc-js',      '2025-09-21 09:20:00', '2025-09-21 09:20:00'),

-- Python (teacher 6)
( 8, 6, 4, 'long', 'List trong Python',                                                'https://vz-e17ee266-cac.b-cdn.net/6e22d8aa-d67b-4ea8-b606-43cb9ae7d674/playlist.m3u8', 1980, 'https://vz-e17ee266-cac.b-cdn.net/6e22d8aa-d67b-4ea8-b606-43cb9ae7d674/thumbnail.jpg', NULL, '6e22d8aa-d67b-4ea8-b606-43cb9ae7d674', 'job-vid-py-list',     '2025-09-23 09:00:00', '2025-09-23 09:00:00'),

-- Web (teacher 4 continued)
( 9, 4, 2, 'long', 'HTML & CSS Full Course',                                           'https://vz-e17ee266-cac.b-cdn.net/22c1810f-2bab-43cc-9d27-b32b963add1a/playlist.m3u8', 9000, 'https://vz-e17ee266-cac.b-cdn.net/22c1810f-2bab-43cc-9d27-b32b963add1a/thumbnail.jpg', NULL, '22c1810f-2bab-43cc-9d27-b32b963add1a', 'job-vid-html-css',    '2025-09-21 09:30:00', '2025-09-21 09:30:00'),
(10, 4, 2, 'long', 'Node.js Full Course',                                              'https://vz-e17ee266-cac.b-cdn.net/c8fa145e-eb56-43d2-a8cc-2d6f95d52e8f/playlist.m3u8', 11400, 'https://vz-e17ee266-cac.b-cdn.net/c8fa145e-eb56-43d2-a8cc-2d6f95d52e8f/thumbnail.jpg', NULL, 'c8fa145e-eb56-43d2-a8cc-2d6f95d52e8f', 'job-vid-node',        '2025-09-21 09:40:00', '2025-09-21 09:40:00'),
(11, 4, 2, 'long', 'Programming with Mosh - JavaScript Tutorial',                      'https://vz-e17ee266-cac.b-cdn.net/5c692db7-c93c-4180-9bcf-264ffb30c0c5/playlist.m3u8', 4200, 'https://vz-e17ee266-cac.b-cdn.net/5c692db7-c93c-4180-9bcf-264ffb30c0c5/thumbnail.jpg', NULL, '5c692db7-c93c-4180-9bcf-264ffb30c0c5', 'job-vid-mosh-js',     '2025-09-21 09:50:00', '2025-09-21 09:50:00'),

-- Soft skills / music (teacher 10)
(12, 10, NULL, 'long', 'Seminar Tư Duy Phản Biện',                                     'https://vz-e17ee266-cac.b-cdn.net/9bb82bd4-65a5-420e-bff2-e6597dff0db1/playlist.m3u8', 5400, 'https://vz-e17ee266-cac.b-cdn.net/9bb82bd4-65a5-420e-bff2-e6597dff0db1/thumbnail.jpg', NULL, '9bb82bd4-65a5-420e-bff2-e6597dff0db1', 'job-vid-critical',    '2025-09-26 09:00:00', '2025-09-26 09:00:00'),

-- Design / Photography (teacher 7)
(13, 7, 5, 'long', 'Học Lightroom 2023 Chi Tiết - Nắm Vững Nguyên Lý',                  'https://vz-e17ee266-cac.b-cdn.net/8bdd2422-7ad8-4bdf-be70-54530a403cd3/playlist.m3u8', 7200, 'https://vz-e17ee266-cac.b-cdn.net/8bdd2422-7ad8-4bdf-be70-54530a403cd3/thumbnail.jpg', NULL, '8bdd2422-7ad8-4bdf-be70-54530a403cd3', 'job-vid-lightroom',   '2025-09-24 09:00:00', '2025-09-24 09:00:00'),
(14, 7, 5, 'long', 'Học Thiết Kế Đồ Họa Online - Từ Cơ Bản Đến Nâng Cao',               'https://vz-e17ee266-cac.b-cdn.net/2db79322-0de7-4447-9813-baf0a3897d98/playlist.m3u8', 9600, 'https://vz-e17ee266-cac.b-cdn.net/2db79322-0de7-4447-9813-baf0a3897d98/thumbnail.jpg', NULL, '2db79322-0de7-4447-9813-baf0a3897d98', 'job-vid-graphic',     '2025-09-24 09:10:00', '2025-09-24 09:10:00'),

-- Marketing / Data (teacher 8)
(15, 8, 6, 'long', 'Đừng Học Power BI Kiểu Kéo Chart Nữa',                              'https://vz-e17ee266-cac.b-cdn.net/04dab0b5-df87-4b55-b8de-8a89ce4e31db/playlist.m3u8', 4500, 'https://vz-e17ee266-cac.b-cdn.net/04dab0b5-df87-4b55-b8de-8a89ce4e31db/thumbnail.jpg', NULL, '04dab0b5-df87-4b55-b8de-8a89ce4e31db', 'job-vid-powerbi',     '2025-09-25 09:00:00', '2025-09-25 09:00:00'),
(16, 8, 6, 'long', 'Marketing - 35 Tuyệt Chiêu Khuyến Mãi Giúp Tăng Doanh Số',          'https://vz-e17ee266-cac.b-cdn.net/8046d13d-f323-4ec6-afec-5ce9cc5cee74/playlist.m3u8', 4800, 'https://vz-e17ee266-cac.b-cdn.net/8046d13d-f323-4ec6-afec-5ce9cc5cee74/thumbnail.jpg', NULL, '8046d13d-f323-4ec6-afec-5ce9cc5cee74', 'job-vid-promotion',   '2025-09-25 09:10:00', '2025-09-25 09:10:00'),
(17, 8, 6, 'long', 'Tổng Hợp Khóa Học Digital Marketing Cho Người Mới',                 'https://vz-e17ee266-cac.b-cdn.net/e50ae2c2-7d31-40c2-b02e-b8950c5249ce/play_1080p.mp4', 7800, 'https://vz-e17ee266-cac.b-cdn.net/e50ae2c2-7d31-40c2-b02e-b8950c5249ce/thumbnail.jpg', NULL, 'e50ae2c2-7d31-40c2-b02e-b8950c5249ce', 'job-vid-digi-mkt',    '2025-09-25 09:20:00', '2025-09-25 09:20:00'),

-- Video editing (teacher 9)
(18, 9, 7, 'long', '1 Tiếng Nâng Cấp Kỹ Năng CAPCUT',                                   'https://vz-e17ee266-cac.b-cdn.net/fd4bb15e-8d74-44b0-918d-0164628b0987/play_480p.mp4', 3600, 'https://vz-e17ee266-cac.b-cdn.net/fd4bb15e-8d74-44b0-918d-0164628b0987/thumbnail.jpg', NULL, 'fd4bb15e-8d74-44b0-918d-0164628b0987', 'job-vid-capcut',      '2025-09-27 09:00:00', '2025-09-27 09:00:00'),

-- AI tools (teacher 6 continued)
(19, 6, 4, 'long', 'Hướng Dẫn ChatGPT Cơ Bản Dành Cho Người Mới',                       'https://vz-e17ee266-cac.b-cdn.net/7716252a-f1c7-4587-be71-0388fdf0673c/play_1080p.mp4', 4200, 'https://vz-e17ee266-cac.b-cdn.net/7716252a-f1c7-4587-be71-0388fdf0673c/thumbnail.jpg', NULL, '7716252a-f1c7-4587-be71-0388fdf0673c', 'job-vid-chatgpt',     '2025-09-23 09:10:00', '2025-09-23 09:10:00'),

-- Video editing (teacher 9 continued)
(20, 9, 7, 'long', 'Premiere Pro Tutorial for Beginners - FULL',                        'https://vz-e17ee266-cac.b-cdn.net/1d2ef570-1d85-4ede-a967-9d2e9096519f/play_480p.mp4', 5400, 'https://vz-e17ee266-cac.b-cdn.net/1d2ef570-1d85-4ede-a967-9d2e9096519f/thumbnail.jpg', NULL, '1d2ef570-1d85-4ede-a967-9d2e9096519f', 'job-vid-premiere',    '2025-09-27 09:10:00', '2025-09-27 09:10:00'),

-- English conversation (teacher 2 continued)
(21, 2, 1, 'long', 'Learn English Conversation - Basic English',                       'https://vz-e17ee266-cac.b-cdn.net/09b924cf-1345-4b2a-9449-418590b46bc3/play_480p.mp4', 5400, 'https://vz-e17ee266-cac.b-cdn.net/09b924cf-1345-4b2a-9449-418590b46bc3/thumbnail.jpg', NULL, '09b924cf-1345-4b2a-9449-418590b46bc3', 'job-vid-eng-conv',    '2025-09-20 10:20:00', '2025-09-20 10:20:00'),

-- Project management (teacher 10)
(22, 10, NULL, 'long', 'Project Management 101 - Project Management Fundamentals',     'https://vz-e17ee266-cac.b-cdn.net/258b3024-b3ec-4f0f-890c-952575afad99/play_480p.mp4', 4500, 'https://vz-e17ee266-cac.b-cdn.net/258b3024-b3ec-4f0f-890c-952575afad99/thumbnail.jpg', NULL, '258b3024-b3ec-4f0f-890c-952575afad99', 'job-vid-pm-101',      '2025-09-26 09:10:00', '2025-09-26 09:10:00'),

-- Music (teacher 10)
(23, 10, NULL, 'long', 'Music Theory 101 for Guitar Players',                          'https://vz-e17ee266-cac.b-cdn.net/8b226049-e548-47e6-ac7c-d95fa92414fb/play_480p.mp4', 5100, 'https://vz-e17ee266-cac.b-cdn.net/8b226049-e548-47e6-ac7c-d95fa92414fb/thumbnail.jpg', NULL, '8b226049-e548-47e6-ac7c-d95fa92414fb', 'job-vid-music',       '2025-09-26 09:20:00', '2025-09-26 09:20:00'),

-- Design (teacher 7 continued)
(24, 7, 5, 'long', 'Learn Photography in 90 Minutes',                                  'https://vz-e17ee266-cac.b-cdn.net/c1ea4ee5-24b1-47e9-bdeb-07030409c895/playlist.m3u8', 5400, 'https://vz-e17ee266-cac.b-cdn.net/c1ea4ee5-24b1-47e9-bdeb-07030409c895/thumbnail.jpg', NULL, 'c1ea4ee5-24b1-47e9-bdeb-07030409c895', 'job-vid-photo-90',    '2025-09-24 09:20:00', '2025-09-24 09:20:00'),

-- Marketing (teacher 8 continued)
(25, 8, 6, 'long', 'Learn Copywriting in 76 Minutes',                                  'https://vz-e17ee266-cac.b-cdn.net/88537b3d-9e18-463e-8773-94be73ebf2e4/playlist.m3u8', 4560, 'https://vz-e17ee266-cac.b-cdn.net/88537b3d-9e18-463e-8773-94be73ebf2e4/thumbnail.jpg', NULL, '88537b3d-9e18-463e-8773-94be73ebf2e4', 'job-vid-copywriting', '2025-09-25 09:30:00', '2025-09-25 09:30:00'),
(26, 8, 6, 'long', 'The Ultimate SEO Checklist for 2026',                              'https://vz-e17ee266-cac.b-cdn.net/f0d9d5b6-12ad-4db9-be57-5c4374de6de9/playlist.m3u8', 4200, 'https://vz-e17ee266-cac.b-cdn.net/f0d9d5b6-12ad-4db9-be57-5c4374de6de9/thumbnail.jpg', NULL, 'f0d9d5b6-12ad-4db9-be57-5c4374de6de9', 'job-vid-seo-2026',    '2025-09-25 09:40:00', '2025-09-25 09:40:00'),

-- Design (teacher 7 continued)
(27, 7, 5, 'long', 'Figma Crash Course 2024 - FULL',                                   'https://vz-e17ee266-cac.b-cdn.net/0278ed11-608f-4daf-b1ec-c10fad64c023/play_720p.mp4', 6000, 'https://vz-e17ee266-cac.b-cdn.net/0278ed11-608f-4daf-b1ec-c10fad64c023/thumbnail.jpg', NULL, '0278ed11-608f-4daf-b1ec-c10fad64c023', 'job-vid-figma',       '2025-09-24 09:30:00', '2025-09-24 09:30:00'),

-- ML (teacher 6 continued)
(28, 6, 4, 'long', 'Machine Learning Fundamentals (1 Hour)',                           'https://vz-e17ee266-cac.b-cdn.net/71c77670-ef53-4a04-af91-3616a4541ad0/play_720p.mp4', 3600, 'https://vz-e17ee266-cac.b-cdn.net/71c77670-ef53-4a04-af91-3616a4541ad0/thumbnail.jpg', NULL, '71c77670-ef53-4a04-af91-3616a4541ad0', 'job-vid-ml-fund',     '2025-09-23 09:20:00', '2025-09-23 09:20:00'),

-- DSA (teacher 5 continued)
(29, 5, 3, 'long', 'Cấu Trúc Dữ Liệu & Giải Thuật - Bài 15: Cây Nhị Phân (Binary Tree)','https://vz-e17ee266-cac.b-cdn.net/5e9ff338-649f-4bd1-86b1-060c8921d027/play_720p.mp4', 2700, 'https://vz-e17ee266-cac.b-cdn.net/5e9ff338-649f-4bd1-86b1-060c8921d027/thumbnail.jpg', NULL, '5e9ff338-649f-4bd1-86b1-060c8921d027', 'job-vid-tree-bin',    '2025-09-22 09:10:00', '2025-09-22 09:10:00'),

-- Chinese (teacher 3)
(30, 3, NULL, 'long', 'Học Tiếng Trung - Giáo Trình HSK 1 Online',                     'https://vz-e17ee266-cac.b-cdn.net/4e6ebb9c-62c8-45a3-b56a-847216533df5/play_1080p.mp4', 6300, 'https://vz-e17ee266-cac.b-cdn.net/4e6ebb9c-62c8-45a3-b56a-847216533df5/thumbnail.jpg', NULL, '4e6ebb9c-62c8-45a3-b56a-847216533df5', 'job-vid-hsk1',        '2025-09-20 11:00:00', '2025-09-20 11:00:00'),

-- English vocabulary (teacher 2 continued)
(31, 2, 1, 'long', 'Tiếng Anh Khi Ngủ - Phần 1: Học 500 Cụm Từ Tiếng Anh Thông Dụng',  'https://vz-e17ee266-cac.b-cdn.net/7b2c7d42-8fcd-4221-b5e6-38dfea50f3da/play_720p.mp4', 7200, 'https://vz-e17ee266-cac.b-cdn.net/7b2c7d42-8fcd-4221-b5e6-38dfea50f3da/thumbnail.jpg', NULL, '7b2c7d42-8fcd-4221-b5e6-38dfea50f3da', 'job-vid-eng-sleep',   '2025-09-20 10:30:00', '2025-09-20 10:30:00');

-- ============================================================================
-- PROJECTS (video editor sessions) – a few teachers have draft projects
-- ============================================================================
INSERT INTO projects (edit_id, user_id, video_id, session_name, status, created_at, updated_at) VALUES
(1, 2, 3,  'TOEIC Tenses - intro overlay session', 'finalized', '2025-09-21 10:00:00', '2025-09-21 11:00:00'),
(2, 4, 7,  'JS Highlights - chapter markers',      'saved',     '2025-09-22 09:00:00', '2025-09-22 10:00:00'),
(3, 4, 9,  'HTML/CSS quick recap',                 'draft',     '2025-09-22 09:30:00', '2025-09-22 09:30:00'),
(4, 6, 8,  'Python list cheatsheet overlay',       'finalized', '2025-09-23 11:00:00', '2025-09-23 12:00:00'),
(5, 7, 13, 'Lightroom B-roll overlay project',     'saved',     '2025-09-24 14:00:00', '2025-09-24 15:00:00'),
(6, 8, 17, 'Digital Marketing intro hook',         'draft',     '2025-09-25 10:00:00', '2025-09-25 10:00:00');

-- ============================================================================
-- MASCOT OVERLAYS (overlays placed on the editor sessions above)
-- ============================================================================
INSERT INTO mascot_overlays (mascot_overlay_id, edit_id, image_id, position_x, position_y, scale, start_time, end_time, layer_index, created_at, updated_at) VALUES
(1, 1, 1, 0.78, 0.18, 0.35,    0.0,  18.0, 1, '2025-09-21 10:05:00', '2025-09-21 10:05:00'),
(2, 1, 1, 0.10, 0.82, 0.30, 1200.0, 1220.5, 2, '2025-09-21 10:08:00', '2025-09-21 10:08:00'),
(3, 2, 2, 0.82, 0.22, 0.40,    5.0,  35.0, 1, '2025-09-22 09:15:00', '2025-09-22 09:15:00'),
(4, 2, 2, 0.20, 0.80, 0.32,  900.0,  925.0, 2, '2025-09-22 09:20:00', '2025-09-22 09:20:00'),
(5, 4, 4, 0.85, 0.15, 0.38,    3.5,  20.0, 1, '2025-09-23 11:10:00', '2025-09-23 11:10:00'),
(6, 4, 4, 0.15, 0.78, 0.34,  600.0,  640.0, 2, '2025-09-23 11:20:00', '2025-09-23 11:20:00'),
(7, 5, 5, 0.80, 0.20, 0.42,    8.0,  40.0, 1, '2025-09-24 14:10:00', '2025-09-24 14:10:00'),
(8, 6, 6, 0.75, 0.20, 0.45,    2.0,  25.0, 1, '2025-09-25 10:05:00', '2025-09-25 10:05:00');

-- ============================================================================
-- COURSES (24 courses; categories is JSON array)
-- ============================================================================
INSERT INTO courses (id, name, description, categories, level, duration, language, price, user_id, status, video_id, created_at, updated_at) VALUES
( 1, 'TOEIC Grammar Mastery: Foundations',
     'Khóa học ngữ pháp TOEIC cô đọng cho band 450+, gồm 3 buổi: Thì (Tenses), Động từ nguyên mẫu/V-ing, và Phân từ (Participles).',
     '["Languages","English","TOEIC","Grammar"]', 'Beginner', '02:15:00.000', 'Vietnamese',      0, 2, 'publish',  3, '2025-09-20 12:00:00', '2025-09-20 12:00:00'),
( 2, 'English Conversation for Beginners',
     'Hội thoại tiếng Anh giao tiếp cơ bản: 500 cụm từ thông dụng và các tình huống hàng ngày.',
     '["Languages","English","Conversation"]',   'Beginner', '03:30:00.000', 'English',     199000, 2, 'publish', 21, '2025-09-20 12:30:00', '2025-09-20 12:30:00'),
( 3, 'Hán Ngữ HSK 1 - Tiếng Trung Sơ Cấp',
     'Khoá học tiếng Trung theo giáo trình HSK 1 - phát âm, bộ thủ, hội thoại cơ bản.',
     '["Languages","Chinese","HSK"]',            'Beginner', '01:45:00.000', 'Vietnamese',      0, 3, 'publish', 30, '2025-09-20 13:00:00', '2025-09-20 13:00:00'),
( 4, 'Cài Đặt Môi Trường & Khắc Phục CORS',
     'Setup môi trường dev Windows từ A-Z và xử lý các tình huống CORS hay gặp khi build full-stack app.',
     '["Programming","Web","DevTools"]',         'Beginner', '00:55:00.000', 'Vietnamese', 199000, 4, 'publish',  5, '2025-09-21 12:00:00', '2025-09-21 12:00:00'),
( 5, 'JavaScript Toàn Tập',
     'Bootcamp JavaScript từ căn bản đến hiện đại - 2 kho tài nguyên: freeCodeCamp và Mosh.',
     '["Programming","JavaScript","Web"]',       'Intermediate', '04:40:00.000', 'English', 399000, 4, 'publish', 7, '2025-09-21 12:30:00', '2025-09-21 12:30:00'),
( 6, 'HTML, CSS & Node.js Full Stack Starter',
     'Một path duy nhất để bạn chuyển từ frontend HTML/CSS sang backend Node.js.',
     '["Programming","Web","HTML","CSS","Node.js"]', 'Intermediate', '05:40:00.000', 'English', 499000, 4, 'publish', 9, '2025-09-21 13:00:00', '2025-09-21 13:00:00'),
( 7, 'System Design Production Infrastructure',
     'Khoá học hệ thống lớn - APIs, Database, Caching, CDN, Load Balancing & Production Infra.',
     '["Programming","System Design","Backend"]','Advanced',   '04:00:00.000', 'English', 599000, 5, 'publish',  4, '2025-09-22 12:00:00', '2025-09-22 12:00:00'),
( 8, 'Cấu Trúc Dữ Liệu: Cây Nhị Phân',
     'Bài chuyên đề về Binary Tree - duyệt cây, BST, ứng dụng thực tế.',
     '["Programming","Data Structures","Algorithms"]','Intermediate','00:45:00.000','Vietnamese', 299000, 5, 'publish', 29, '2025-09-22 12:30:00', '2025-09-22 12:30:00'),
( 9, 'Python Cơ Bản - Làm Chủ Danh Sách (List)',
     'Tất cả về list trong Python: slicing, list comprehension, các phương thức và mẹo tối ưu.',
     '["Programming","Python"]',                  'Beginner', '00:33:00.000', 'Vietnamese',      0, 6, 'publish',  8, '2025-09-23 12:00:00', '2025-09-23 12:00:00'),
(10, 'Machine Learning Fundamentals',
     'Tổng quan ML cho người mới - các khái niệm cốt lõi, vòng đời ML và demo nhỏ.',
     '["AI","Machine Learning","Python","Data Science"]','Intermediate','01:00:00.000','English', 399000, 6, 'publish', 28, '2025-09-23 12:30:00', '2025-09-23 12:30:00'),
(11, 'Khai Thác ChatGPT Hiệu Quả',
     'Hướng dẫn dùng ChatGPT từ cơ bản - prompt engineering, workflow công việc, an toàn dữ liệu.',
     '["AI","Productivity","Prompt Engineering"]','Beginner','01:10:00.000','Vietnamese', 149000, 6, 'banned', 19, '2025-09-23 13:00:00', '2025-09-23 13:00:00'),
(12, 'Lightroom 2023 - Nắm Vững Nguyên Lý',
     'Hậu kỳ ảnh trong Lightroom Classic 2023 - hiểu nguyên lý sâu hơn so với preset.',
     '["Design","Photography","Lightroom"]',     'Intermediate', '02:00:00.000', 'Vietnamese', 299000, 7, 'publish', 13, '2025-09-24 12:00:00', '2025-09-24 12:00:00'),
(13, 'Thiết Kế Đồ Họa Online từ Cơ Bản Đến Nâng Cao',
     'Khoá graphic design tổng quát - bố cục, màu sắc, typography, brand identity.',
     '["Design","Graphic Design"]',              'Beginner', '02:40:00.000', 'Vietnamese', 349000, 7, 'publish', 14, '2025-09-24 12:30:00', '2025-09-24 12:30:00'),
(14, 'Học Nhiếp Ảnh Cơ Bản Trong 90 Phút',
     'Khoá nhiếp ảnh nhập môn: tam giác phơi sáng, bố cục, ánh sáng và workflow chụp căn bản.',
     '["Design","Photography"]',                 'Beginner', '01:30:00.000', 'English',     199000, 7, 'publish', 24, '2025-09-24 13:00:00', '2025-09-24 13:00:00'),
(15, 'Figma 2024 Crash Course',
     'Học Figma từ con số 0 - frame, auto-layout, components, variant và prototype.',
     '["Design","UI/UX","Figma"]',               'Beginner', '01:40:00.000', 'English',     249000, 7, 'publish', 27, '2025-09-24 13:30:00', '2025-09-24 13:30:00'),
(16, 'Digital Marketing Cho Người Mới',
     'Tổng quan digital marketing - kênh, phễu, và 35 tuyệt chiêu khuyến mãi tăng doanh số.',
     '["Marketing","Digital Marketing"]',        'Beginner', '03:30:00.000', 'Vietnamese', 299000, 8, 'publish', 17, '2025-09-25 12:00:00', '2025-09-25 12:00:00'),
(17, 'Copywriting Trong 76 Phút',
     'Crash course copywriting bán hàng - headline, USP, CTA và checklist viết content.',
     '["Marketing","Copywriting"]',              'Intermediate','01:16:00.000','English',     199000, 8, 'publish', 25, '2025-09-25 12:30:00', '2025-09-25 12:30:00'),
(18, 'SEO Mastery 2026',
     'Checklist SEO mới nhất 2026 - on-page, technical, EEAT, AI search optimization.',
     '["Marketing","SEO"]',                      'Advanced','01:10:00.000','English',     499000, 8, 'publish', 26, '2025-09-25 13:00:00', '2025-09-25 13:00:00'),
(19, 'Power BI - Beyond Drag & Drop',
     'Khoá phân tích dữ liệu với Power BI - data model, DAX cơ bản, thiết kế dashboard story-driven.',
     '["Data","Business Intelligence","Power BI"]','Intermediate','01:15:00.000','Vietnamese', 349000, 8, 'pending', 15, '2025-09-25 13:30:00', '2025-09-25 13:30:00'),
(20, 'Học CapCut Trong 1 Giờ',
     'Nâng cấp kỹ năng CapCut: edit, audio, trending effects và preset export đa nền tảng.',
     '["Video","Editing","CapCut"]',             'Beginner', '01:00:00.000', 'Vietnamese', 199000, 9, 'publish', 18, '2025-09-27 12:00:00', '2025-09-27 12:00:00'),
(21, 'Premiere Pro Cho Người Mới',
     'Premiere Pro full beginner tutorial - timeline, transition, color grading, audio polish.',
     '["Video","Editing","Premiere Pro"]',       'Beginner', '01:30:00.000', 'English',     249000, 9, 'publish', 20, '2025-09-27 12:30:00', '2025-09-27 12:30:00'),
(22, 'Tư Duy Phản Biện',
     'Seminar tư duy phản biện - mô hình lập luận, fallacy thường gặp và thực hành.',
     '["Soft Skills","Critical Thinking"]',      'Beginner', '01:30:00.000', 'Vietnamese', 149000, 10, 'publish', 12, '2025-09-26 12:00:00', '2025-09-26 12:00:00'),
(23, 'Project Management 101',
     'Project management nền tảng cho người mới - vòng đời dự án, scope, risk, tools.',
     '["Soft Skills","Project Management"]',     'Beginner', '01:15:00.000', 'English',     199000, 10, 'publish', 22, '2025-09-26 12:30:00', '2025-09-26 12:30:00'),
(24, 'Music Theory 101 for Guitar Players',
     'Nhạc lý cơ bản dành riêng cho guitar - quãng, hợp âm, scale và ứng dụng improvise.',
     '["Music","Guitar"]',                       'Beginner', '01:25:00.000', 'English',     179000, 10, 'pending', 23, '2025-09-26 13:00:00', '2025-09-26 13:00:00');

-- ============================================================================
-- LESSONS  (36 lessons - mostly 1 video per lesson + a few text & quiz lessons)
-- ============================================================================
INSERT INTO lessons (id, course_id, title, contentType, content, duration, status, description, video_id, created_at, updated_at) VALUES
-- Course 1: TOEIC Grammar Mastery (5 lessons)
( 1, 1, 'Welcome - Roadmap & cách học hiệu quả',     'text',  '{"body":"Xin chào! Bạn sẽ học 3 mảng ngữ pháp lớn nhất TOEIC: Tenses, To-V/V-ing, Participles. Hãy chuẩn bị giấy bút, học theo thứ tự bài và làm quiz sau mỗi phần."}',  '00:05:00.000', 'active', 'Giới thiệu lộ trình khoá học', NULL, '2025-09-20 12:05:00','2025-09-20 12:05:00'),
( 2, 1, 'Các Thì Trong Tiếng Anh (Tenses)',           'video', '{"video_id":3}',                                                                                                            '00:44:00.000', 'active', 'Bài 3: Tenses',                3,    '2025-09-20 12:10:00','2025-09-20 12:10:00'),
( 3, 1, 'To V1, V-ing, V1 (Verb Patterns)',           'video', '{"video_id":2}',                                                                                                            '00:40:00.000', 'active', 'Bài 4: Verb patterns',         2,    '2025-09-20 12:15:00','2025-09-20 12:15:00'),
( 4, 1, 'Phân Từ (Participles)',                      'video', '{"video_id":1}',                                                                                                            '00:38:00.000', 'active', 'Bài 5: Participles',           1,    '2025-09-20 12:20:00','2025-09-20 12:20:00'),
( 5, 1, 'Quiz tổng kết Grammar',                      'quiz',  '{"description":"Quiz tổng hợp 3 bài"}',                                                                                     '00:08:00.000', 'active', 'Quiz tổng kết',                NULL, '2025-09-20 12:25:00','2025-09-20 12:25:00'),

-- Course 2: English Conversation (2 lessons)
( 6, 2, 'Basic English Conversation',                 'video', '{"video_id":21}',                                                                                                           '01:30:00.000', 'active', 'Hội thoại tiếng Anh cơ bản',  21,   '2025-09-20 12:35:00','2025-09-20 12:35:00'),
( 7, 2, '500 Cụm Từ Tiếng Anh Khi Ngủ',               'video', '{"video_id":31}',                                                                                                           '02:00:00.000', 'active', '500 cụm từ thông dụng',       31,   '2025-09-20 12:40:00','2025-09-20 12:40:00'),

-- Course 3: HSK 1 (1 lesson)
( 8, 3, 'HSK 1 - Giáo Trình Online',                  'video', '{"video_id":30}',                                                                                                           '01:45:00.000', 'active', 'Giáo trình HSK 1',            30,   '2025-09-20 13:05:00','2025-09-20 13:05:00'),

-- Course 4: Setup môi trường + CORS (2 lessons)
( 9, 4, 'Cài Đặt Môi Trường Windows Mới',             'video', '{"video_id":5}',                                                                                                            '00:30:00.000', 'active', 'Setup dev tools',              5,    '2025-09-21 12:05:00','2025-09-21 12:05:00'),
(10, 4, 'CORS Policy & Cách Xử Lý',                   'video', '{"video_id":6}',                                                                                                            '00:25:00.000', 'active', 'CORS hands-on',                6,    '2025-09-21 12:10:00','2025-09-21 12:10:00'),

-- Course 5: JavaScript Toàn Tập (3 lessons - 2 video + 1 quiz)
(11, 5, 'JavaScript Full Course (freeCodeCamp)',      'video', '{"video_id":7}',                                                                                                            '03:30:00.000', 'active', 'JS toàn diện từ freeCodeCamp', 7,   '2025-09-21 12:35:00','2025-09-21 12:35:00'),
(12, 5, 'JavaScript Tutorial (Programming with Mosh)','video', '{"video_id":11}',                                                                                                           '01:10:00.000', 'active', 'JS súc tích với Mosh',        11,   '2025-09-21 12:40:00','2025-09-21 12:40:00'),
(13, 5, 'Quiz JavaScript Fundamentals',               'quiz',  '{"description":"Test kiến thức JS"}',                                                                                       '00:10:00.000', 'active', 'Quiz cuối khoá',              NULL, '2025-09-21 12:45:00','2025-09-21 12:45:00'),

-- Course 6: HTML/CSS + Node.js (2 lessons)
(14, 6, 'HTML & CSS Full Course',                     'video', '{"video_id":9}',                                                                                                            '02:30:00.000', 'active', 'Frontend foundation',          9,   '2025-09-21 13:05:00','2025-09-21 13:05:00'),
(15, 6, 'Node.js Full Course',                        'video', '{"video_id":10}',                                                                                                           '03:10:00.000', 'active', 'Backend với Node.js',         10,   '2025-09-21 13:10:00','2025-09-21 13:10:00'),

-- Course 7: System Design (2 lessons - 1 text + 1 video)
(16, 7, 'Big-Picture: Khi nào cần System Design?',    'text',  '{"body":"Trước khi vào kỹ thuật, ta cần định nghĩa khi nào cần scale: usage pattern, hot key, SLA. Bài học này giới thiệu mental model."}',  '00:08:00.000', 'active', 'Mindset trước khi học',   NULL, '2025-09-22 12:05:00','2025-09-22 12:05:00'),
(17, 7, 'System Design Full Course',                  'video', '{"video_id":4}',                                                                                                            '04:00:00.000', 'active', 'Toàn bộ khoá System Design',  4,   '2025-09-22 12:10:00','2025-09-22 12:10:00'),

-- Course 8: Binary Tree (1 lesson)
(18, 8, 'Cây Nhị Phân (Binary Tree)',                 'video', '{"video_id":29}',                                                                                                           '00:45:00.000', 'active', 'Lý thuyết + bài tập',         29,   '2025-09-22 12:35:00','2025-09-22 12:35:00'),

-- Course 9: Python List (2 lessons - 1 video + 1 quiz)
(19, 9, 'List trong Python',                          'video', '{"video_id":8}',                                                                                                            '00:33:00.000', 'active', 'Tất cả về list',               8,   '2025-09-23 12:05:00','2025-09-23 12:05:00'),
(20, 9, 'Quiz nhanh Python List',                     'quiz',  '{"description":"Quiz củng cố"}',                                                                                            '00:05:00.000', 'active', 'Quiz tổng kết',               NULL, '2025-09-23 12:10:00','2025-09-23 12:10:00'),

-- Course 10: ML (1 lesson)
(21, 10,'Machine Learning Fundamentals',              'video', '{"video_id":28}',                                                                                                           '01:00:00.000', 'active', 'ML nhập môn',                 28,   '2025-09-23 12:35:00','2025-09-23 12:35:00'),

-- Course 11: ChatGPT (1 lesson)
(22, 11,'Hướng Dẫn ChatGPT Cơ Bản',                   'video', '{"video_id":19}',                                                                                                           '01:10:00.000', 'active', 'ChatGPT cho người mới',       19,   '2025-09-23 13:05:00','2025-09-23 13:05:00'),

-- Course 12: Lightroom (1 lesson)
(23, 12,'Học Lightroom 2023 - Nắm Vững Nguyên Lý',    'video', '{"video_id":13}',                                                                                                           '02:00:00.000', 'active', 'Lightroom toàn tập',          13,   '2025-09-24 12:05:00','2025-09-24 12:05:00'),

-- Course 13: Thiết kế đồ họa (1 lesson)
(24, 13,'Thiết Kế Đồ Họa Online - Toàn Bộ',           'video', '{"video_id":14}',                                                                                                           '02:40:00.000', 'active', 'Graphic design A-Z',          14,   '2025-09-24 12:35:00','2025-09-24 12:35:00'),

-- Course 14: Nhiếp ảnh (1 lesson)
(25, 14,'Learn Photography in 90 Minutes',            'video', '{"video_id":24}',                                                                                                           '01:30:00.000', 'active', 'Nhiếp ảnh 90 phút',           24,   '2025-09-24 13:05:00','2025-09-24 13:05:00'),

-- Course 15: Figma (1 lesson)
(26, 15,'Figma Crash Course 2024',                    'video', '{"video_id":27}',                                                                                                           '01:40:00.000', 'active', 'Crash course Figma',          27,   '2025-09-24 13:35:00','2025-09-24 13:35:00'),

-- Course 16: Digital Marketing (2 lessons)
(27, 16,'Tổng Hợp Khóa Học Digital Marketing',        'video', '{"video_id":17}',                                                                                                           '02:10:00.000', 'active', 'Tổng quan Digital Marketing', 17,   '2025-09-25 12:05:00','2025-09-25 12:05:00'),
(28, 16,'35 Tuyệt Chiêu Khuyến Mãi Tăng Doanh Số',    'video', '{"video_id":16}',                                                                                                           '01:20:00.000', 'active', 'Promotion playbook',          16,   '2025-09-25 12:10:00','2025-09-25 12:10:00'),

-- Course 17: Copywriting (1 lesson)
(29, 17,'Learn Copywriting in 76 Minutes',            'video', '{"video_id":25}',                                                                                                           '01:16:00.000', 'active', 'Copywriting crash course',    25,   '2025-09-25 12:35:00','2025-09-25 12:35:00'),

-- Course 18: SEO 2026 (1 lesson)
(30, 18,'Ultimate SEO Checklist 2026',                'video', '{"video_id":26}',                                                                                                           '01:10:00.000', 'active', 'SEO checklist mới nhất',      26,   '2025-09-25 13:05:00','2025-09-25 13:05:00'),

-- Course 19: Power BI (1 lesson)
(31, 19,'Đừng Học Power BI Kiểu Kéo Chart Nữa',       'video', '{"video_id":15}',                                                                                                           '01:15:00.000', 'active', 'Power BI từ data model',      15,   '2025-09-25 13:35:00','2025-09-25 13:35:00'),

-- Course 20: CapCut (1 lesson)
(32, 20,'1 Tiếng Nâng Cấp Kỹ Năng CapCut',            'video', '{"video_id":18}',                                                                                                           '01:00:00.000', 'active', 'CapCut intensive',            18,   '2025-09-27 12:05:00','2025-09-27 12:05:00'),

-- Course 21: Premiere Pro (1 lesson)
(33, 21,'Premiere Pro for Beginners - FULL',          'video', '{"video_id":20}',                                                                                                           '01:30:00.000', 'active', 'Premiere Pro toàn tập',       20,   '2025-09-27 12:35:00','2025-09-27 12:35:00'),

-- Course 22: Tư duy phản biện (1 lesson)
(34, 22,'Seminar Tư Duy Phản Biện',                   'video', '{"video_id":12}',                                                                                                           '01:30:00.000', 'active', 'Critical thinking seminar',   12,   '2025-09-26 12:05:00','2025-09-26 12:05:00'),

-- Course 23: PM 101 (1 lesson)
(35, 23,'Project Management Fundamentals',            'video', '{"video_id":22}',                                                                                                           '01:15:00.000', 'active', 'PM 101 nền tảng',             22,   '2025-09-26 12:35:00','2025-09-26 12:35:00'),

-- Course 24: Music Theory (1 lesson)
(36, 24,'Music Theory 101 for Guitar Players',        'video', '{"video_id":23}',                                                                                                           '01:25:00.000', 'active', 'Nhạc lý cho guitarist',       23,   '2025-09-26 13:05:00','2025-09-26 13:05:00');

-- ============================================================================
-- LESSON_ACTIVITIES  (quiz containers - standalone + 1 in-video quiz)
-- ============================================================================
INSERT INTO lesson_activities (id, lesson_id, activity_type, title, description, order_index, max_attempts, status, created_by, created_at, updated_at) VALUES
(1, 5,  'quiz', 'TOEIC Grammar Comprehensive Quiz',     'Quiz tổng kết 3 bài Tenses, Verb Patterns, Participles.', 1, 3, 'public', 2, '2025-09-20 12:26:00', '2025-09-20 12:26:00'),
(2, 13, 'quiz', 'JavaScript Fundamentals Quiz',         'Kiểm tra kiến thức JavaScript căn bản.',                  1, 5, 'public', 4, '2025-09-21 12:46:00', '2025-09-21 12:46:00'),
(3, 20, 'quiz', 'Python List Quick Quiz',               'Quiz nhanh củng cố kiến thức list trong Python.',         1, 3, 'public', 6, '2025-09-23 12:11:00', '2025-09-23 12:11:00'),
(4, 2,  'quiz', 'In-Video Quiz: Tenses Spot-Check',     'Câu hỏi gắn vào video Tenses ở giây thứ 600.',            1, 2, 'public', 2, '2025-09-20 12:11:00', '2025-09-20 12:11:00'),
(5, 35, 'assignment', 'Bài tập: Lập kế hoạch dự án mẫu',  'Vẽ Gantt chart sơ lược cho 1 dự án ra mắt sản phẩm.',    1, 1, 'public', 10, '2025-09-26 12:40:00', '2025-09-26 12:40:00');

-- ============================================================================
-- QUIZZES
-- ============================================================================
INSERT INTO quizzes (id, lesson_activity_id, name, shuffle_question, shuffle_option, passing_score, time_limit_minutes, is_in_video, created_at, updated_at) VALUES
(1, 1, 'TOEIC Grammar Comprehensive Quiz', 1, 1, 70, 15, 0, '2025-09-20 12:27:00', '2025-09-20 12:27:00'),
(2, 2, 'JavaScript Fundamentals Quiz',     1, 1, 60, 12, 0, '2025-09-21 12:47:00', '2025-09-21 12:47:00'),
(3, 3, 'Python List Quick Quiz',           0, 1, 70,  6, 0, '2025-09-23 12:12:00', '2025-09-23 12:12:00'),
(4, 4, 'Tenses Spot-Check',                0, 0, 80,  2, 1, '2025-09-20 12:12:00', '2025-09-20 12:12:00');

-- ============================================================================
-- QUIZ_QUESTIONS
-- ============================================================================
INSERT INTO quiz_questions (id, quiz_id, ques_type, ques_text, point, correct_ans, order_index, video_timestamp, created_at, updated_at) VALUES
-- Quiz 1 (TOEIC Grammar comprehensive)
( 1, 1, 'mcq',         'Câu nào dưới đây dùng đúng thì Present Perfect?',                                  2.00, 'I have lived in Hanoi since 2018.', 1, NULL, '2025-09-20 12:28:00','2025-09-20 12:28:00'),
( 2, 1, 'mcq',         'Chọn dạng đúng: "She enjoys ___ to classical music."',                            2.00, 'listening',                          2, NULL, '2025-09-20 12:28:10','2025-09-20 12:28:10'),
( 3, 1, 'true/false',  '"To V1" thường đi sau các động từ như want, decide, plan.',                       1.00, 'true',                               3, NULL, '2025-09-20 12:28:20','2025-09-20 12:28:20'),
( 4, 1, 'mcq',         '"The man ___ over there is my manager." - chọn participle đúng.',                  2.00, 'standing',                           4, NULL, '2025-09-20 12:28:30','2025-09-20 12:28:30'),
( 5, 1, 'short_text',  'Viết lại: "It started raining at 8AM, and it is still raining now." (dùng PPC)', 3.00, 'It has been raining since 8AM.',     5, NULL, '2025-09-20 12:28:40','2025-09-20 12:28:40'),

-- Quiz 2 (JavaScript fundamentals)
( 6, 2, 'mcq',         'Toán tử nào kiểm tra giá trị VÀ kiểu dữ liệu trong JavaScript?',                  1.00, '===',                                1, NULL, '2025-09-21 12:48:00','2025-09-21 12:48:00'),
( 7, 2, 'mcq',         'Kết quả của `typeof null` là gì?',                                                  1.00, 'object',                            2, NULL, '2025-09-21 12:48:10','2025-09-21 12:48:10'),
( 8, 2, 'true/false',  '`let` cho phép re-declare trong cùng một scope.',                                  1.00, 'false',                             3, NULL, '2025-09-21 12:48:20','2025-09-21 12:48:20'),
( 9, 2, 'short_text',  'Method nào của Array dùng để biến đổi từng phần tử và trả về array mới?',         2.00, 'map',                                4, NULL, '2025-09-21 12:48:30','2025-09-21 12:48:30'),

-- Quiz 3 (Python list)
(10, 3, 'mcq',         'Kết quả của `[1, 2, 3][::-1]` là gì?',                                              1.00, '[3, 2, 1]',                          1, NULL, '2025-09-23 12:13:00','2025-09-23 12:13:00'),
(11, 3, 'mcq',         'Method nào thêm phần tử vào CUỐI list?',                                            1.00, 'append',                             2, NULL, '2025-09-23 12:13:10','2025-09-23 12:13:10'),
(12, 3, 'true/false',  'List trong Python là immutable.',                                                   1.00, 'false',                              3, NULL, '2025-09-23 12:13:20','2025-09-23 12:13:20'),

-- Quiz 4 (In-video TOEIC Tenses spot-check)
(13, 4, 'mcq',         'Theo bài: chọn thì đúng cho "By next year, she ___ here for 10 years."',           2.00, 'will have lived',                    1, '00:10:00.000', '2025-09-20 12:13:00','2025-09-20 12:13:00'),
(14, 4, 'true/false',  'Present Perfect dùng cho hành động có mốc thời gian cụ thể trong quá khứ.',        1.00, 'false',                              2, '00:18:30.000', '2025-09-20 12:13:10','2025-09-20 12:13:10');

-- ============================================================================
-- QUIZ_OPTIONS  (only for MCQ / TF questions; short_text has no options)
-- ============================================================================
INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index, created_at, updated_at) VALUES
-- Q1 (MCQ): Present Perfect
( 1, 1, 'I lived in Hanoi since 2018.',                       0, 1, '2025-09-20 12:29:00','2025-09-20 12:29:00'),
( 2, 1, 'I have lived in Hanoi since 2018.',                  1, 2, '2025-09-20 12:29:00','2025-09-20 12:29:00'),
( 3, 1, 'I am living in Hanoi since 2018.',                   0, 3, '2025-09-20 12:29:00','2025-09-20 12:29:00'),
( 4, 1, 'I have been lived in Hanoi since 2018.',             0, 4, '2025-09-20 12:29:00','2025-09-20 12:29:00'),
-- Q2 (MCQ): enjoy + V-ing
( 5, 2, 'to listen',                                          0, 1, '2025-09-20 12:29:10','2025-09-20 12:29:10'),
( 6, 2, 'listening',                                          1, 2, '2025-09-20 12:29:10','2025-09-20 12:29:10'),
( 7, 2, 'listen',                                             0, 3, '2025-09-20 12:29:10','2025-09-20 12:29:10'),
( 8, 2, 'listened',                                           0, 4, '2025-09-20 12:29:10','2025-09-20 12:29:10'),
-- Q3 (TF): To V1 verbs
( 9, 3, 'true',                                               1, 1, '2025-09-20 12:29:20','2025-09-20 12:29:20'),
(10, 3, 'false',                                              0, 2, '2025-09-20 12:29:20','2025-09-20 12:29:20'),
-- Q4 (MCQ): standing participle
(11, 4, 'stood',                                              0, 1, '2025-09-20 12:29:30','2025-09-20 12:29:30'),
(12, 4, 'standing',                                           1, 2, '2025-09-20 12:29:30','2025-09-20 12:29:30'),
(13, 4, 'to stand',                                           0, 3, '2025-09-20 12:29:30','2025-09-20 12:29:30'),
(14, 4, 'stands',                                             0, 4, '2025-09-20 12:29:30','2025-09-20 12:29:30'),
-- Q6 (MCQ): strict equals
(15, 6, '==',                                                 0, 1, '2025-09-21 12:49:00','2025-09-21 12:49:00'),
(16, 6, '===',                                                1, 2, '2025-09-21 12:49:00','2025-09-21 12:49:00'),
(17, 6, '=',                                                  0, 3, '2025-09-21 12:49:00','2025-09-21 12:49:00'),
(18, 6, '!==',                                                0, 4, '2025-09-21 12:49:00','2025-09-21 12:49:00'),
-- Q7 (MCQ): typeof null
(19, 7, 'null',                                               0, 1, '2025-09-21 12:49:10','2025-09-21 12:49:10'),
(20, 7, 'undefined',                                          0, 2, '2025-09-21 12:49:10','2025-09-21 12:49:10'),
(21, 7, 'object',                                             1, 3, '2025-09-21 12:49:10','2025-09-21 12:49:10'),
(22, 7, 'number',                                             0, 4, '2025-09-21 12:49:10','2025-09-21 12:49:10'),
-- Q8 (TF): let re-declare
(23, 8, 'true',                                               0, 1, '2025-09-21 12:49:20','2025-09-21 12:49:20'),
(24, 8, 'false',                                              1, 2, '2025-09-21 12:49:20','2025-09-21 12:49:20'),
-- Q10 (MCQ): list slicing reverse
(25, 10,'[1, 2, 3]',                                          0, 1, '2025-09-23 12:14:00','2025-09-23 12:14:00'),
(26, 10,'[3, 2, 1]',                                          1, 2, '2025-09-23 12:14:00','2025-09-23 12:14:00'),
(27, 10,'[3, 2]',                                             0, 3, '2025-09-23 12:14:00','2025-09-23 12:14:00'),
(28, 10,'Error',                                              0, 4, '2025-09-23 12:14:00','2025-09-23 12:14:00'),
-- Q11 (MCQ): append
(29, 11,'append',                                             1, 1, '2025-09-23 12:14:10','2025-09-23 12:14:10'),
(30, 11,'push',                                               0, 2, '2025-09-23 12:14:10','2025-09-23 12:14:10'),
(31, 11,'add',                                                0, 3, '2025-09-23 12:14:10','2025-09-23 12:14:10'),
(32, 11,'insert',                                             0, 4, '2025-09-23 12:14:10','2025-09-23 12:14:10'),
-- Q12 (TF): list immutable
(33, 12,'true',                                               0, 1, '2025-09-23 12:14:20','2025-09-23 12:14:20'),
(34, 12,'false',                                              1, 2, '2025-09-23 12:14:20','2025-09-23 12:14:20'),
-- Q13 (MCQ): Future Perfect Continuous
(35, 13,'will live',                                          0, 1, '2025-09-20 12:14:00','2025-09-20 12:14:00'),
(36, 13,'will be living',                                     0, 2, '2025-09-20 12:14:00','2025-09-20 12:14:00'),
(37, 13,'will have lived',                                    1, 3, '2025-09-20 12:14:00','2025-09-20 12:14:00'),
(38, 13,'lived',                                              0, 4, '2025-09-20 12:14:00','2025-09-20 12:14:00'),
-- Q14 (TF): present perfect mốc thời gian
(39, 14,'true',                                               0, 1, '2025-09-20 12:14:10','2025-09-20 12:14:10'),
(40, 14,'false',                                              1, 2, '2025-09-20 12:14:10','2025-09-20 12:14:10');

-- ============================================================================
-- ENROLLS  (~60 enrollments across 15 students, only into publish courses)
-- ============================================================================
INSERT INTO enrolls (user_id, course_id, progress, status, enrolled_at, completed_at) VALUES
-- student 11 (Alex - web dev focus)
(11,  1, 100, 'completed', '2025-10-05 10:00:00', '2025-10-10 21:30:00'),
(11,  4, 100, 'completed', '2025-10-06 10:00:00', '2025-10-12 19:00:00'),
(11,  5,  60, 'active',    '2025-10-08 10:00:00', NULL),
(11,  6,  20, 'active',    '2025-10-14 10:00:00', NULL),
(11,  9, 100, 'completed', '2025-10-08 12:00:00', '2025-10-09 20:00:00'),

-- student 12 (Bao - language)
(12,  1, 100, 'completed', '2025-10-05 11:00:00', '2025-10-12 22:00:00'),
(12,  2,  75, 'active',    '2025-10-13 11:00:00', NULL),
(12,  3,  50, 'active',    '2025-10-15 11:00:00', NULL),
(12, 22,  30, 'active',    '2025-10-20 11:00:00', NULL),

-- student 13 (Chi - design/marketing)
(13, 12, 100, 'completed', '2025-10-06 09:00:00', '2025-10-15 19:00:00'),
(13, 13,  80, 'active',    '2025-10-16 09:00:00', NULL),
(13, 14, 100, 'completed', '2025-10-06 09:30:00', '2025-10-07 18:00:00'),
(13, 15,  40, 'active',    '2025-10-20 09:00:00', NULL),
(13, 16,  10, 'active',    '2025-11-01 09:00:00', NULL),

-- student 14 (Dat - programming)
(14,  4, 100, 'completed', '2025-10-07 14:00:00', '2025-10-08 23:00:00'),
(14,  5,  90, 'active',    '2025-10-09 14:00:00', NULL),
(14,  7,  35, 'active',    '2025-10-15 14:00:00', NULL),
(14,  8,  60, 'active',    '2025-10-19 14:00:00', NULL),
(14,  9, 100, 'completed', '2025-10-08 14:00:00', '2025-10-09 23:00:00'),

-- student 15 (Emily - english + design)
(15,  1, 100, 'completed', '2025-10-05 09:00:00', '2025-10-11 18:00:00'),
(15,  2, 100, 'completed', '2025-10-12 09:00:00', '2025-10-20 18:00:00'),
(15, 14, 100, 'completed', '2025-10-08 09:00:00', '2025-10-09 17:00:00'),
(15, 15,  60, 'active',    '2025-10-21 09:00:00', NULL),

-- student 16 (Feng - tech)
(16,  4,  50, 'active',    '2025-10-09 14:00:00', NULL),
(16,  5,  10, 'active',    '2025-10-11 14:00:00', NULL),
(16,  9, 100, 'completed', '2025-10-08 14:00:00', '2025-10-09 22:00:00'),
(16, 10,  20, 'active',    '2025-10-20 14:00:00', NULL),
(16, 11,  90, 'active',    '2025-10-10 14:00:00', NULL),

-- student 17 (Giang - marketing)
(17, 16, 100, 'completed', '2025-10-12 10:00:00', '2025-10-22 18:00:00'),
(17, 17,  70, 'active',    '2025-10-23 10:00:00', NULL),
(17, 18,  40, 'active',    '2025-10-26 10:00:00', NULL),
(17, 23,  20, 'active',    '2025-11-02 10:00:00', NULL),

-- student 18 (Hanh - video editing)
(18, 20, 100, 'completed', '2025-10-12 16:00:00', '2025-10-13 22:00:00'),
(18, 21,  60, 'active',    '2025-10-14 16:00:00', NULL),
(18, 13,  20, 'active',    '2025-10-22 16:00:00', NULL),

-- student 19 (Ivy - design + ML)
(19, 10, 100, 'completed', '2025-10-09 15:00:00', '2025-10-10 18:30:00'),
(19, 12, 100, 'completed', '2025-10-11 15:00:00', '2025-10-20 19:00:00'),
(19, 15, 100, 'completed', '2025-10-12 15:00:00', '2025-10-15 18:00:00'),

-- student 20 (John - english + system design)
(20,  1, 100, 'completed', '2025-10-06 09:00:00', '2025-10-12 19:00:00'),
(20,  2, 100, 'completed', '2025-10-14 09:00:00', '2025-10-20 19:00:00'),
(20,  7,  80, 'active',    '2025-10-22 09:00:00', NULL),

-- student 21 (Kim - python/AI path)
(21,  9, 100, 'completed', '2025-10-10 09:00:00', '2025-10-11 21:00:00'),
(21, 10, 100, 'completed', '2025-10-12 09:00:00', '2025-10-13 19:00:00'),
(21, 11,  50, 'active',    '2025-10-15 09:00:00', NULL),

-- student 22 (Long - photography)
(22, 12,  40, 'active',    '2025-10-12 14:00:00', NULL),
(22, 14, 100, 'completed', '2025-10-15 14:00:00', '2025-10-16 17:00:00'),
(22, 22,  10, 'active',    '2025-11-01 14:00:00', NULL),

-- student 23 (My - soft skills)
(23, 22, 100, 'completed', '2025-10-15 09:00:00', '2025-10-18 20:00:00'),
(23, 23,  90, 'active',    '2025-10-19 09:00:00', NULL),
(23, 24,  30, 'active',    '2025-11-05 09:00:00', NULL),

-- student 24 (Ngan - SEO + copywriting)
(24, 16, 100, 'completed', '2025-10-10 11:00:00', '2025-10-19 20:00:00'),
(24, 17, 100, 'completed', '2025-10-20 11:00:00', '2025-10-22 20:00:00'),
(24, 18, 100, 'completed', '2025-10-23 11:00:00', '2025-10-25 20:00:00'),

-- student 25 (Oanh - mix)
(25,  3, 100, 'completed', '2025-10-15 10:00:00', '2025-10-20 18:00:00'),
(25,  9, 100, 'completed', '2025-10-21 10:00:00', '2025-10-22 21:00:00'),
(25, 20,  50, 'active',    '2025-10-25 10:00:00', NULL),
(25, 24,  10, 'active',    '2025-11-06 10:00:00', NULL);

-- ============================================================================
-- LESSON_PROGRESS  (for each enroll, sample lesson completions)
-- ============================================================================
INSERT INTO lesson_progress (user_id, course_id, lesson_id, progress) VALUES
-- student 11
(11, 1, 1, 'completed'),(11, 1, 2, 'completed'),(11, 1, 3, 'completed'),(11, 1, 4, 'completed'),(11, 1, 5, 'completed'),
(11, 4, 9, 'completed'),(11, 4,10, 'completed'),
(11, 5,11, 'completed'),(11, 5,12, 'in_progress'),(11, 5,13, 'not_started'),
(11, 6,14, 'in_progress'),(11, 6,15, 'not_started'),
(11, 9,19, 'completed'),(11, 9,20, 'completed'),

-- student 12
(12, 1, 1, 'completed'),(12, 1, 2, 'completed'),(12, 1, 3, 'completed'),(12, 1, 4, 'completed'),(12, 1, 5, 'completed'),
(12, 2, 6, 'completed'),(12, 2, 7, 'in_progress'),
(12, 3, 8, 'in_progress'),
(12,22,34, 'in_progress'),

-- student 13
(13,12,23, 'completed'),
(13,13,24, 'in_progress'),
(13,14,25, 'completed'),
(13,15,26, 'in_progress'),
(13,16,27, 'in_progress'),(13,16,28, 'not_started'),

-- student 14
(14, 4, 9, 'completed'),(14, 4,10, 'completed'),
(14, 5,11, 'completed'),(14, 5,12, 'completed'),(14, 5,13, 'in_progress'),
(14, 7,16, 'completed'),(14, 7,17, 'in_progress'),
(14, 8,18, 'in_progress'),
(14, 9,19, 'completed'),(14, 9,20, 'completed'),

-- student 15
(15, 1, 1, 'completed'),(15, 1, 2, 'completed'),(15, 1, 3, 'completed'),(15, 1, 4, 'completed'),(15, 1, 5, 'completed'),
(15, 2, 6, 'completed'),(15, 2, 7, 'completed'),
(15,14,25, 'completed'),
(15,15,26, 'in_progress'),

-- student 16
(16, 4, 9, 'completed'),(16, 4,10, 'in_progress'),
(16, 5,11, 'in_progress'),
(16, 9,19, 'completed'),(16, 9,20, 'completed'),
(16,10,21, 'in_progress'),
(16,11,22, 'video-completed'),

-- student 17
(17,16,27, 'completed'),(17,16,28, 'completed'),
(17,17,29, 'in_progress'),
(17,18,30, 'in_progress'),
(17,23,35, 'in_progress'),

-- student 18
(18,20,32, 'completed'),
(18,21,33, 'in_progress'),
(18,13,24, 'in_progress'),

-- student 19
(19,10,21, 'completed'),
(19,12,23, 'completed'),
(19,15,26, 'completed'),

-- student 20
(20, 1, 1, 'completed'),(20, 1, 2, 'completed'),(20, 1, 3, 'completed'),(20, 1, 4, 'completed'),(20, 1, 5, 'completed'),
(20, 2, 6, 'completed'),(20, 2, 7, 'completed'),
(20, 7,16, 'completed'),(20, 7,17, 'video-completed'),

-- student 21
(21, 9,19, 'completed'),(21, 9,20, 'completed'),
(21,10,21, 'completed'),
(21,11,22, 'in_progress'),

-- student 22
(22,12,23, 'in_progress'),
(22,14,25, 'completed'),
(22,22,34, 'in_progress'),

-- student 23
(23,22,34, 'completed'),
(23,23,35, 'in_progress'),
(23,24,36, 'in_progress'),

-- student 24
(24,16,27, 'completed'),(24,16,28, 'completed'),
(24,17,29, 'completed'),
(24,18,30, 'completed'),

-- student 25
(25, 3, 8, 'completed'),
(25, 9,19, 'completed'),(25, 9,20, 'completed'),
(25,20,32, 'in_progress'),
(25,24,36, 'in_progress');

-- ============================================================================
-- ROADMAPS  (5 curated paths grouping multiple courses)
-- ============================================================================
INSERT INTO roadmaps (id, user_id, description, name, total_courses, progress) VALUES
(1, 4, 'Roadmap full-stack web cho beginner - HTML/CSS → JavaScript → Node.js + setup môi trường.', 'Web Developer Path',  3, 0),
(2, 8, 'Roadmap Marketing Online từ tổng quan đến SEO và Copywriting.',                            'Digital Marketing Path', 3, 0),
(3, 2, 'Master tiếng Anh từ ngữ pháp TOEIC tới giao tiếp.',                                         'English Mastery Path',   2, 0),
(4, 7, 'Path designer toàn diện - photography, graphic, Lightroom & Figma.',                       'Designer Path',          4, 0),
(5, 6, 'Lộ trình AI & Data - từ Python tới ML và ChatGPT.',                                         'AI & Data Foundations',  3, 0);

-- ============================================================================
-- ROADMAP_COURSE  (M:N between roadmaps and courses)
-- ============================================================================
INSERT INTO roadmap_course (id, course_id, roadmap_id, `index`, status) VALUES
-- Roadmap 1 (Web Developer Path)
(1,  4, 1, 1, 'finish'),
(2,  6, 1, 2, 'learning'),
(3,  5, 1, 3, 'null'),
-- Roadmap 2 (Digital Marketing Path)
(4, 16, 2, 1, 'finish'),
(5, 17, 2, 2, 'learning'),
(6, 18, 2, 3, 'null'),
-- Roadmap 3 (English Mastery Path)
(7,  1, 3, 1, 'finish'),
(8,  2, 3, 2, 'learning'),
-- Roadmap 4 (Designer Path)
(9, 14, 4, 1, 'finish'),
(10,15, 4, 2, 'learning'),
(11,12, 4, 3, 'null'),
(12,13, 4, 4, 'null'),
-- Roadmap 5 (AI & Data Foundations)
(13, 9, 5, 1, 'finish'),
(14,10, 5, 2, 'learning'),
(15,11, 5, 3, 'null');

-- ============================================================================
-- FEEDBACKS  (course reviews - unique per (course_id, user_id))
-- ============================================================================
INSERT INTO feedbacks (id, course_id, user_id, rating, review_text, is_visible, created_at, updated_at, deleted_at) VALUES
( 1, 1, 11, 5, 'Khoá ngữ pháp TOEIC quá rõ ràng, bài tham gia quiz cuối rất hữu ích!',                            1, '2025-10-11 20:00:00','2025-10-11 20:00:00', NULL),
( 2, 1, 12, 4, 'Phần Tenses giảng rất kỹ, nhưng phần Participles có thể thêm ví dụ thực tế.',                     1, '2025-10-12 20:00:00','2025-10-12 20:00:00', NULL),
( 3, 1, 15, 5, 'Học xong tự tin hẳn lên khi làm bài part 5/6.',                                                    1, '2025-10-11 21:00:00','2025-10-11 21:00:00', NULL),
( 4, 1, 20, 4, 'Audio rõ, slide đẹp. Sẽ học tiếp các khoá khác của teacher.',                                      1, '2025-10-12 21:00:00','2025-10-12 21:00:00', NULL),
( 5, 2, 12, 4, 'Hội thoại bám sát thực tế, hơi nhanh ở phần đầu.',                                                  1, '2025-10-15 20:00:00','2025-10-15 20:00:00', NULL),
( 6, 2, 15, 5, '500 cụm từ rất thực dụng, đã thuộc gần hết sau 1 tuần.',                                            1, '2025-10-20 19:00:00','2025-10-20 19:00:00', NULL),
( 7, 2, 20, 4, 'Khoá tốt nhưng nên có thêm subtitle Tiếng Việt cho người mới.',                                     1, '2025-10-20 20:00:00','2025-10-20 20:00:00', NULL),
( 8, 3, 25, 5, 'Cô Minh dạy phát âm chuẩn, dễ theo dõi với người Việt.',                                            1, '2025-10-20 19:30:00','2025-10-20 19:30:00', NULL),
( 9, 4, 11, 5, 'Setup môi trường đầy đủ trong 30 phút, cứu cánh máy mới!',                                          1, '2025-10-12 20:00:00','2025-10-12 20:00:00', NULL),
(10, 4, 14, 4, 'Bài CORS rất dễ hiểu, có vẽ sơ đồ minh hoạ thì sẽ tuyệt.',                                          1, '2025-10-08 21:00:00','2025-10-08 21:00:00', NULL),
(11, 5, 11, 4, 'freeCodeCamp + Mosh combo hợp lý, học xong cảm thấy chắc tay JS.',                                  1, '2025-10-14 20:00:00','2025-10-14 20:00:00', NULL),
(12, 5, 14, 5, 'Quiz cuối kì bám sát nội dung, rất đáng học.',                                                       1, '2025-10-18 20:00:00','2025-10-18 20:00:00', NULL),
(13, 7, 14, 5, 'System Design trên đời chưa thấy course nào đầy đủ thế này.',                                       1, '2025-10-20 20:00:00','2025-10-20 20:00:00', NULL),
(14, 7, 20, 4, 'Phần caching và CDN cực hữu ích, mong có thêm bài tập thực hành.',                                  1, '2025-10-24 20:00:00','2025-10-24 20:00:00', NULL),
(15, 8, 14, 4, 'Bài tree giải thích rõ, code mẫu hơi ngắn.',                                                         1, '2025-10-25 20:00:00','2025-10-25 20:00:00', NULL),
(16, 9, 11, 5, 'Cô Linh truyền cảm hứng cho người mới học Python, list xài quá ngon!',                              1, '2025-10-09 20:00:00','2025-10-09 20:00:00', NULL),
(17, 9, 16, 4, 'Quiz cuối hay, sẽ chờ tiếp tutorial về dict.',                                                        1, '2025-10-09 21:00:00','2025-10-09 21:00:00', NULL),
(18, 9, 21, 5, 'Đúng cái mình cần để bứt phá Python, recommend.',                                                     1, '2025-10-11 20:00:00','2025-10-11 20:00:00', NULL),
(19, 9, 25, 5, 'Học xong làm leetcode array dễ hơn nhiều!',                                                            1, '2025-10-22 20:00:00','2025-10-22 20:00:00', NULL),
(20,10, 19, 5, 'ML 101 cô đọng, giải thích pipeline rõ ràng.',                                                         1, '2025-10-10 19:00:00','2025-10-10 19:00:00', NULL),
(21,10, 21, 4, 'Mình cần thêm bài về dataset chuẩn bị, nhưng intro thì 10 điểm.',                                       1, '2025-10-13 19:00:00','2025-10-13 19:00:00', NULL),
(22,12, 13, 5, 'Học Lightroom xong ảnh đẹp hẳn, cô giảng nguyên lý dễ hiểu.',                                          1, '2025-10-15 20:00:00','2025-10-15 20:00:00', NULL),
(23,12, 19, 5, 'Cách tiếp cận khoa học, không lệ thuộc preset như khoá khác.',                                          1, '2025-10-20 19:30:00','2025-10-20 19:30:00', NULL),
(24,13, 13, 4, 'Phần typography cực kỳ thực dụng, ví dụ phong phú.',                                                    1, '2025-10-16 19:00:00','2025-10-16 19:00:00', NULL),
(25,14, 13, 5, 'Hợp với người mới chụp ảnh, gọn nhẹ trong 90 phút.',                                                    1, '2025-10-07 19:00:00','2025-10-07 19:00:00', NULL),
(26,14, 15, 5, 'Học xong là đủ tự tin cầm máy ra phố chụp.',                                                              1, '2025-10-09 19:00:00','2025-10-09 19:00:00', NULL),
(27,14, 22, 4, 'Nội dung tốt, chỉ tiếc bài tập chụp thực hành chưa nhiều.',                                                1, '2025-10-16 18:00:00','2025-10-16 18:00:00', NULL),
(28,15, 19, 5, 'Figma intensive trong vài tiếng nhưng đủ skill để làm landing page.',                                       1, '2025-10-15 19:00:00','2025-10-15 19:00:00', NULL),
(29,16, 17, 5, 'Khoá Digital Marketing tổng quan rất bài bản, áp dụng được ngay vào shop nhỏ.',                              1, '2025-10-22 19:00:00','2025-10-22 19:00:00', NULL),
(30,16, 24, 5, 'Promotion 35 chiêu chính là cái mình cần.',                                                                   1, '2025-10-19 19:30:00','2025-10-19 19:30:00', NULL),
(31,17, 24, 4, 'Copywriting trong 76 phút - rất dày kiến thức, cần xem lại nhiều lần.',                                       1, '2025-10-22 19:30:00','2025-10-22 19:30:00', NULL),
(32,18, 24, 5, 'SEO 2026 update rất sát thị trường AI search.',                                                                1, '2025-10-25 19:30:00','2025-10-25 19:30:00', NULL),
(33,20, 18, 5, 'CapCut 1 tiếng là đủ để upload đều TikTok!',                                                                    1, '2025-10-13 21:30:00','2025-10-13 21:30:00', NULL),
(34,22, 23, 5, 'Tư duy phản biện - thay đổi cách mình tiếp cận tranh luận trong công việc.',                                    1, '2025-10-18 19:30:00','2025-10-18 19:30:00', NULL);

-- ============================================================================
-- FEEDBACK_REACTIONS  (helpful/dislike on feedbacks)
-- ============================================================================
INSERT INTO feedback_reactions (feedback_id, user_id, reaction_type) VALUES
( 1, 13, 'help_ful'),
( 1, 14, 'help_ful'),
( 1, 15, 'help_ful'),
( 2, 20, 'help_ful'),
( 3, 11, 'help_ful'),
( 3, 12, 'help_ful'),
( 4, 13, 'help_ful'),
( 5, 11, 'help_ful'),
( 6, 20, 'help_ful'),
( 9, 14, 'help_ful'),
(10, 16, 'help_ful'),
(11, 14, 'help_ful'),
(11, 16, 'dislike'),
(13, 11, 'help_ful'),
(13, 20, 'help_ful'),
(13, 21, 'help_ful'),
(16, 12, 'help_ful'),
(16, 21, 'help_ful'),
(20, 21, 'help_ful'),
(22, 15, 'help_ful'),
(22, 19, 'help_ful'),
(25, 19, 'help_ful'),
(29, 18, 'help_ful'),
(29, 24, 'help_ful'),
(32, 17, 'help_ful'),
(34, 22, 'help_ful');

-- ============================================================================
-- CARTS (1 cart per student - we'll only create for students with cart items)
-- ============================================================================
INSERT INTO carts (id, user_id, total_quantity, total_amount, created_at, updated_at) VALUES
(1, 11, 2,  898000, '2025-10-20 10:00:00','2025-10-20 10:00:00'),
(2, 12, 1,  199000, '2025-10-21 10:00:00','2025-10-21 10:00:00'),
(3, 14, 2,  998000, '2025-10-22 10:00:00','2025-10-22 10:00:00'),
(4, 15, 1,  249000, '2025-10-25 10:00:00','2025-10-25 10:00:00'),
(5, 17, 2,  398000, '2025-11-02 10:00:00','2025-11-02 10:00:00'),
(6, 21, 1,  349000, '2025-11-04 10:00:00','2025-11-04 10:00:00'),
(7, 23, 1,  199000, '2025-11-05 10:00:00','2025-11-05 10:00:00');

-- ============================================================================
-- CART_ITEMS  (items currently in those carts - not yet checked out)
-- ============================================================================
INSERT INTO cart_items (id, cart_id, course_id, created_at, updated_at) VALUES
(1, 1, 10,'2025-10-20 10:00:00','2025-10-20 10:00:00'),  -- ML
(2, 1, 21,'2025-10-20 10:05:00','2025-10-20 10:05:00'),  -- Premiere Pro
(3, 2,  4,'2025-10-21 10:00:00','2025-10-21 10:00:00'),  -- Setup môi trường
(4, 3,  7,'2025-10-22 10:00:00','2025-10-22 10:00:00'),  -- System Design
(5, 3, 10,'2025-10-22 10:05:00','2025-10-22 10:05:00'),  -- ML
(6, 4, 15,'2025-10-25 10:00:00','2025-10-25 10:00:00'),  -- Figma
(7, 5, 23,'2025-11-02 10:00:00','2025-11-02 10:00:00'),  -- PM
(8, 5, 17,'2025-11-02 10:05:00','2025-11-02 10:05:00'),  -- Copywriting
(9, 6, 19,'2025-11-04 10:00:00','2025-11-04 10:00:00'),  -- Power BI
(10,7, 21,'2025-11-05 10:00:00','2025-11-05 10:00:00');  -- Premiere Pro

-- ============================================================================
-- TRANSACTIONS  (PayOS orders - paid / pending / failed)
-- ============================================================================
INSERT INTO transactions (id, user_id, total_amount, status, provider, provider_order_id, created_at, paid_at) VALUES
( 1, 11, 199000, 'paid',   'payos', 'PAYOS-2025-1001', '2025-10-06 09:55:00', '2025-10-06 09:57:00'),
( 2, 11, 399000, 'paid',   'payos', 'PAYOS-2025-1002', '2025-10-08 09:55:00', '2025-10-08 09:58:00'),
( 3, 11, 499000, 'paid',   'payos', 'PAYOS-2025-1003', '2025-10-14 09:55:00', '2025-10-14 09:57:00'),
( 4, 12, 199000, 'paid',   'payos', 'PAYOS-2025-1004', '2025-10-13 10:55:00', '2025-10-13 10:57:00'),
( 5, 12, 149000, 'paid',   'payos', 'PAYOS-2025-1005', '2025-10-20 10:55:00', '2025-10-20 10:57:00'),
( 6, 13, 299000, 'paid',   'payos', 'PAYOS-2025-1006', '2025-10-06 08:55:00', '2025-10-06 08:57:00'),
( 7, 13, 349000, 'paid',   'payos', 'PAYOS-2025-1007', '2025-10-16 08:55:00', '2025-10-16 08:57:00'),
( 8, 13, 449000, 'paid',   'payos', 'PAYOS-2025-1008', '2025-10-20 08:55:00', '2025-10-20 08:57:00'),
( 9, 14, 998000, 'paid',   'payos', 'PAYOS-2025-1009', '2025-10-08 13:55:00', '2025-10-08 13:58:00'),
(10, 14, 599000, 'paid',   'payos', 'PAYOS-2025-1010', '2025-10-15 13:55:00', '2025-10-15 13:57:00'),
(11, 15, 398000, 'paid',   'payos', 'PAYOS-2025-1011', '2025-10-12 08:55:00', '2025-10-12 08:57:00'),
(12, 15, 249000, 'paid',   'payos', 'PAYOS-2025-1012', '2025-10-21 08:55:00', '2025-10-21 08:57:00'),
(13, 16, 199000, 'paid',   'payos', 'PAYOS-2025-1013', '2025-10-09 13:55:00', '2025-10-09 13:57:00'),
(14, 16, 549000, 'paid',   'payos', 'PAYOS-2025-1014', '2025-10-20 13:55:00', '2025-10-20 13:57:00'),
(15, 17, 697000, 'paid',   'payos', 'PAYOS-2025-1015', '2025-10-12 09:55:00', '2025-10-12 09:57:00'),
(16, 17, 499000, 'paid',   'payos', 'PAYOS-2025-1016', '2025-10-26 09:55:00', '2025-10-26 09:57:00'),
(17, 18, 448000, 'paid',   'payos', 'PAYOS-2025-1017', '2025-10-12 15:55:00', '2025-10-12 15:58:00'),
(18, 19, 698000, 'paid',   'payos', 'PAYOS-2025-1018', '2025-10-09 14:55:00', '2025-10-09 14:58:00'),
(19, 20, 199000, 'paid',   'payos', 'PAYOS-2025-1019', '2025-10-14 08:55:00', '2025-10-14 08:57:00'),
(20, 21, 399000, 'paid',   'payos', 'PAYOS-2025-1020', '2025-10-12 08:55:00', '2025-10-12 08:57:00'),
(21, 24, 997000, 'paid',   'payos', 'PAYOS-2025-1021', '2025-10-20 10:55:00', '2025-10-20 10:57:00'),
(22, 25, 199000, 'paid',   'payos', 'PAYOS-2025-1022', '2025-10-25 09:55:00', '2025-10-25 09:57:00'),
(23, 22, 199000, 'paid',   'payos', 'PAYOS-2025-1023', '2025-10-15 13:55:00', '2025-10-15 13:57:00'),
(24, 11, 399000, 'pending','payos', 'PAYOS-2025-1024', '2025-11-10 10:55:00', NULL),
(25, 22, 299000, 'failed', 'payos', 'PAYOS-2025-1025', '2025-11-09 10:55:00', NULL);

-- ============================================================================
-- TRANSACTION_ITEMS  (snapshot of price at purchase time)
-- ============================================================================
INSERT INTO transaction_items (id, transaction_id, course_id, price) VALUES
( 1,  1,  4, 199000),
( 2,  2,  5, 399000),
( 3,  3,  6, 499000),
( 4,  4,  2, 199000),
( 5,  5, 22, 149000),
( 6,  6, 12, 299000),
( 7,  7, 13, 349000),
( 8,  8, 14, 199000),
( 9,  8, 15, 249000),
(10,  9,  4, 199000),
(11,  9,  5, 399000),
(12,  9,  8, 299000),
(13, 10,  7, 599000),  -- treat as separate single-item, total 599k
(14, 11,  2, 199000),
(15, 11, 14, 199000),
(16, 12, 15, 249000),
(17, 13,  4, 199000),
(18, 14, 10, 399000),
(19, 14, 11, 149000),
(20, 15, 16, 299000),
(21, 15, 17, 199000),
(22, 15, 23, 199000),
(23, 16, 18, 499000),
(24, 17, 20, 199000),
(25, 17, 21, 249000),
(26, 18, 10, 399000),
(27, 18, 12, 299000),
(28, 19,  2, 199000),
(29, 20, 10, 399000),
(30, 21, 16, 299000),
(31, 21, 17, 199000),
(32, 21, 18, 499000),
(33, 22, 20, 199000),
(34, 23, 14, 199000),
(35, 24, 21, 249000),
(36, 24, 23, 199000),
(37, 25, 12, 299000);

-- ============================================================================
-- NOTIFICATIONS  (mix of read / unread, across teachers + students + admin)
-- ============================================================================
INSERT INTO notifications (id, user_id, event_type, title, message, payload, is_read, source_type, source_id, created_at, updated_at) VALUES
-- For teachers about course status / new enrollments / feedback
( 1, 2,  'COURSE_APPROVED',      'Khoá học đã được duyệt', 'Khoá "TOEIC Grammar Mastery: Foundations" của bạn đã publish.',  '{"course_id":1}',                        1, 'course',   1, '2025-09-21 09:00:00','2025-09-21 09:05:00'),
( 2, 4,  'COURSE_APPROVED',      'Khoá học đã được duyệt', 'Khoá "JavaScript Toàn Tập" của bạn đã publish.',                  '{"course_id":5}',                        1, 'course',   5, '2025-09-22 09:00:00','2025-09-22 09:05:00'),
( 3, 5,  'COURSE_APPROVED',      'Khoá học đã được duyệt', 'Khoá "System Design Production Infrastructure" đã publish.',     '{"course_id":7}',                        1, 'course',   7, '2025-09-23 09:00:00','2025-09-23 09:05:00'),
( 4, 8,  'COURSE_PENDING_REVIEW','Khoá học chờ duyệt',     'Khoá "Power BI - Beyond Drag & Drop" đang chờ admin xem xét.',     '{"course_id":19}',                       0, 'course',  19, '2025-09-26 09:00:00','2025-09-26 09:00:00'),
( 5, 10, 'COURSE_PENDING_REVIEW','Khoá học chờ duyệt',     'Khoá "Music Theory 101 for Guitar Players" chờ admin duyệt.',      '{"course_id":24}',                       0, 'course',  24, '2025-09-27 09:00:00','2025-09-27 09:00:00'),
( 6, 6,  'COURSE_BANNED',        'Khoá học bị khoá',       'Khoá "Khai Thác ChatGPT Hiệu Quả" đã bị admin khoá tạm thời.',     '{"course_id":11,"reason":"Vi phạm chính sách nội dung AI."}', 0, 'course', 11, '2025-11-05 10:00:00','2025-11-05 10:00:00'),
( 7, 2,  'NEW_ENROLLMENT',       'Có học viên mới ghi danh','Alex Tran vừa ghi danh khoá "TOEIC Grammar Mastery".',             '{"user_id":11,"course_id":1}',            1, 'enroll',   0, '2025-10-05 10:01:00','2025-10-05 10:01:00'),
( 8, 4,  'NEW_ENROLLMENT',       'Có học viên mới ghi danh','Đạt Vũ vừa mua khoá "JavaScript Toàn Tập".',                       '{"user_id":14,"course_id":5}',            1, 'enroll',   0, '2025-10-09 14:01:00','2025-10-09 14:01:00'),
( 9, 6,  'NEW_ENROLLMENT',       'Có học viên mới ghi danh','Kim Vũ vừa ghi danh khoá "Python Cơ Bản - Làm Chủ Danh Sách".',     '{"user_id":21,"course_id":9}',            0, 'enroll',   0, '2025-10-10 09:01:00','2025-10-10 09:01:00'),
(10, 7,  'NEW_ENROLLMENT',       'Có học viên mới ghi danh','Chi Phan vừa mua khoá "Lightroom 2023".',                          '{"user_id":13,"course_id":12}',           1, 'enroll',   0, '2025-10-06 09:01:00','2025-10-06 09:01:00'),
(11, 8,  'NEW_ENROLLMENT',       'Có học viên mới ghi danh','Giang Lê vừa ghi danh "Digital Marketing Cho Người Mới".',          '{"user_id":17,"course_id":16}',           1, 'enroll',   0, '2025-10-12 10:01:00','2025-10-12 10:01:00'),
(12, 9,  'NEW_ENROLLMENT',       'Có học viên mới ghi danh','Hạnh Trương vừa ghi danh "Học CapCut Trong 1 Giờ".',               '{"user_id":18,"course_id":20}',           0, 'enroll',   0, '2025-10-12 16:01:00','2025-10-12 16:01:00'),
(13, 2,  'NEW_FEEDBACK',         'Có đánh giá mới',        'Alex Tran đánh giá 5★ cho TOEIC Grammar Mastery.',                  '{"feedback_id":1}',                       1, 'feedback', 1, '2025-10-11 20:01:00','2025-10-11 20:01:00'),
(14, 4,  'NEW_FEEDBACK',         'Có đánh giá mới',        'Alex Tran đánh giá 4★ cho JavaScript Toàn Tập.',                    '{"feedback_id":11}',                      1, 'feedback',11, '2025-10-14 20:01:00','2025-10-14 20:01:00'),
(15, 5,  'NEW_FEEDBACK',         'Có đánh giá mới',        'Đạt Vũ đánh giá 5★ cho System Design.',                              '{"feedback_id":13}',                      0, 'feedback',13, '2025-10-20 20:01:00','2025-10-20 20:01:00'),
(16, 6,  'NEW_FEEDBACK',         'Có đánh giá mới',        'Alex Tran đánh giá 5★ cho Python Cơ Bản.',                          '{"feedback_id":16}',                      1, 'feedback',16, '2025-10-09 20:01:00','2025-10-09 20:01:00'),

-- For students about payment / enroll / progress
(17, 11, 'PAYMENT_SUCCESS',      'Thanh toán thành công',  'Bạn đã thanh toán 199.000đ cho khoá "Cài Đặt Môi Trường & CORS".',  '{"transaction_id":1,"amount":199000}',   1, 'transaction', 1, '2025-10-06 09:58:00','2025-10-06 09:58:00'),
(18, 11, 'COURSE_COMPLETED',     'Hoàn thành khoá học',    'Chúc mừng bạn đã hoàn thành "TOEIC Grammar Mastery".',              '{"course_id":1}',                        1, 'course',   1, '2025-10-10 22:00:00','2025-10-10 22:00:00'),
(19, 11, 'PAYMENT_PENDING',      'Thanh toán đang chờ',    'Đơn PAYOS-2025-1024 đang chờ thanh toán, link sẽ hết hạn sau 15 phút.','{"transaction_id":24}',                0, 'transaction',24, '2025-11-10 10:55:00','2025-11-10 10:55:00'),
(20, 13, 'PAYMENT_SUCCESS',      'Thanh toán thành công',  'Bạn đã mua khoá "Lightroom 2023" thành công.',                       '{"transaction_id":6,"amount":299000}',  1, 'transaction', 6, '2025-10-06 08:58:00','2025-10-06 08:58:00'),
(21, 14, 'PAYMENT_SUCCESS',      'Thanh toán thành công',  'Đơn 998.000đ cho 3 khoá đã thanh toán thành công.',                  '{"transaction_id":9,"amount":998000}',  1, 'transaction', 9, '2025-10-08 13:59:00','2025-10-08 13:59:00'),
(22, 17, 'PAYMENT_SUCCESS',      'Thanh toán thành công',  'Bạn đã mua bundle Digital Marketing.',                               '{"transaction_id":15,"amount":697000}', 1, 'transaction',15, '2025-10-12 09:58:00','2025-10-12 09:58:00'),
(23, 22, 'PAYMENT_FAILED',       'Thanh toán thất bại',    'Đơn PAYOS-2025-1025 thất bại - vui lòng thử lại.',                    '{"transaction_id":25}',                  0, 'transaction',25, '2025-11-09 11:00:00','2025-11-09 11:00:00'),
(24, 12, 'NEW_LESSON',           'Bài học mới',            'Khoá "English Conversation" vừa thêm bài "500 Cụm Từ".',             '{"course_id":2,"lesson_id":7}',          0, 'lesson',   7, '2025-10-20 12:01:00','2025-10-20 12:01:00'),
(25, 19, 'COURSE_COMPLETED',     'Hoàn thành khoá học',    'Bạn đã hoàn thành "Machine Learning Fundamentals".',                 '{"course_id":10}',                        1, 'course',  10, '2025-10-10 19:00:00','2025-10-10 19:00:00'),

-- For admin (reports + signups)
(26, 1,  'REPORT_NEW',           'Có report mới',          '1 report mới cần xem xét: course #11.',                              '{"report_id":1}',                        0, 'report',   1, '2025-11-04 09:00:00','2025-11-04 09:00:00'),
(27, 1,  'REPORT_NEW',           'Có report mới',          '1 report mới cần xem xét: lesson #11 - giá tiền quá cao.',           '{"report_id":3}',                        0, 'report',   3, '2025-11-05 09:00:00','2025-11-05 09:00:00'),
(28, 1,  'COURSE_PENDING_REVIEW','Khoá học chờ duyệt',     'Có 2 khoá học mới chờ duyệt (Power BI, Music Theory).',              '{"course_ids":[19,24]}',                 0, 'course',   0, '2025-09-27 09:30:00','2025-09-27 09:30:00'),
(29, 1,  'NEW_TEACHER_SIGNUP',   'Có lecturer mới',        'Teacher mới đăng ký nền tảng (Quân Lê - Video editing).',            '{"user_id":9}',                          1, 'user',     9, '2025-09-12 13:01:00','2025-09-12 13:01:00'),
(30, 11, 'NEW_LESSON',           'Bài học mới',            'Khoá "JavaScript Toàn Tập" có quiz mới.',                            '{"course_id":5,"lesson_id":13}',         0, 'lesson',  13, '2025-10-21 09:00:00','2025-10-21 09:00:00');

-- ============================================================================
-- REPORTS  (admin moderation - target_type in [teacher, course, lesson])
-- ============================================================================
INSERT INTO reports (id, target_type, target_id, reason, status, reporter_id, approver_id, review_note, reviewed_at, created_at, updated_at) VALUES
(1, 'course', 11, 'Nội dung khoá ChatGPT sử dụng prompt không an toàn, ví dụ jailbreak có khả năng vi phạm chính sách.', 'approved', 17, 1, 'Đã ẩn khoá học. Yêu cầu lecturer chỉnh sửa nội dung trước khi tái duyệt.', '2025-11-05 09:30:00', '2025-11-04 08:30:00','2025-11-05 09:30:00'),
(2, 'course',  5, 'Khoá học JavaScript có 1 đoạn nói nhanh khó nghe, có sub tiếng Anh nhưng không có VN.',                'rejected', 16, 1, 'Không phạm chính sách - chỉ là feedback chất lượng. Đã chuyển feedback cho lecturer.','2025-10-28 09:00:00','2025-10-27 14:00:00','2025-10-28 09:00:00'),
(3, 'lesson', 11, 'Nội dung khoá ChatGPT bài 1 - giá hơi cao so với thời lượng.',                                          'pending',  18, NULL, NULL, NULL, '2025-11-05 08:00:00','2025-11-05 08:00:00'),
(4, 'teacher', 8, 'Mong lecturer cải thiện chất lượng audio bài SEO, có nhiễu nền.',                                       'pending',  24, NULL, NULL, NULL, '2025-11-06 10:00:00','2025-11-06 10:00:00'),
(5, 'course', 19, 'Khoá Power BI cần thêm dataset thực tế để tải về làm bài tập.',                                          'pending',  21, NULL, NULL, NULL, '2025-11-07 09:00:00','2025-11-07 09:00:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SEED
-- ============================================================================
