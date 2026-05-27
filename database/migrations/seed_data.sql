-- ============================================================================
-- SEED DATA for GraduationProject (LMS demo)
-- ----------------------------------------------------------------------------
-- Run AFTER `yarn migrate` (Knex migrations) so all tables already exist.
-- Covers every table including the highlight_feed family:
--   - highlight_feed entries seeded from imported course highlight data
--   - feed_comments, feed_interactions, feed_views: realistic demo engagement data
--
-- All users share the same demo password: "password"
-- (bcrypt: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate in reverse-dependency order so re-running the seed leaves no orphans
TRUNCATE TABLE feed_views;
TRUNCATE TABLE feed_interactions;
TRUNCATE TABLE feed_comments;
TRUNCATE TABLE highlight_feed;
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
-- VIDEOS - LONG FORM (31 long-form course videos, all stored on Bunny Stream)
-- id 1..31 mapped to teachers as planned in the seed README at the top
-- (highlight-type videos are inserted in a separate INSERT below, ids 32+)
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
-- HIGHLIGHT VIDEOS (type='highlight') - short clips on Cloudinary
-- Generated from courses_data uploads; linked to long videos & courses below.
-- ============================================================================
INSERT INTO videos (id, user_id, mascot_image_id, type, name, url, duration, thumbnail, srt_raw_url, bunny_video_guid, job_id, created_at, updated_at) VALUES
(  32, 2, NULL, 'highlight', 'Introduction to Participles + Types of Participles + Present Participle Usage', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4', 119.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg', NULL, NULL, 'highlight-7470b5e8-t1', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  33, 2, NULL, 'highlight', 'Active vs. Passive Meaning + Past Participle Usage + Examples of Participles in Context', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542388/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/2/highlight_topic2_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4', 119.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542388/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/2/highlight_topic2_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg', NULL, NULL, 'highlight-7470b5e8-t2', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  34, 2, NULL, 'highlight', 'Practice Exercises + Common Mistakes with Participles + Conclusion and Recap', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542427/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/3/highlight_topic3_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4', 197.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542427/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/3/highlight_topic3_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg', NULL, NULL, 'highlight-7470b5e8-t3', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  35, 2, NULL, 'highlight', 'Introduction to Two-Verb Structures + First Usage of Two-Verb + Second Usage of Two-Verb', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543612/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/1/highlight_topic1_f451598a-dde9-448f-ac7e-2cc54a453379.mp4', 120.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543612/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/1/highlight_topic1_f451598a-dde9-448f-ac7e-2cc54a453379.jpg', NULL, NULL, 'highlight-f451598a-t1', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  36, 2, NULL, 'highlight', 'Third Usage of Two-Verb + Fourth Usage of Two-Verb + Common Structures with Two-Verb', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543619/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/2/highlight_topic2_f451598a-dde9-448f-ac7e-2cc54a453379.mp4', 175.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543619/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/2/highlight_topic2_f451598a-dde9-448f-ac7e-2cc54a453379.jpg', NULL, NULL, 'highlight-f451598a-t2', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  37, 2, NULL, 'highlight', 'Usage of Verb In + Common Verbs with Verb In', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543649/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/3/highlight_topic3_f451598a-dde9-448f-ac7e-2cc54a453379.mp4', 195.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543649/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/3/highlight_topic3_f451598a-dde9-448f-ac7e-2cc54a453379.jpg', NULL, NULL, 'highlight-f451598a-t3', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  38, 2, NULL, 'highlight', 'Introduction to Base Form Verbs + Explanation of ''Can'' and ''May'' + Difference Between ''Have to'' and ''Must''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543651/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/4/highlight_topic4_f451598a-dde9-448f-ac7e-2cc54a453379.mp4', 184.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543651/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/4/highlight_topic4_f451598a-dde9-448f-ac7e-2cc54a453379.jpg', NULL, NULL, 'highlight-f451598a-t4', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  39, 2, NULL, 'highlight', 'Understanding ''Should'' and ''Ought to'' + Using ''Let'' and ''Make''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/5/highlight_topic5_f451598a-dde9-448f-ac7e-2cc54a453379.mp4', 159.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/5/highlight_topic5_f451598a-dde9-448f-ac7e-2cc54a453379.jpg', NULL, NULL, 'highlight-f451598a-t5', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  40, 2, NULL, 'highlight', 'Explaining ''Help'' and Its Structure + Introduction to ''Have'' in Context + Using ''Please'' in Requests', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/6/highlight_topic6_f451598a-dde9-448f-ac7e-2cc54a453379.mp4', 139.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/6/highlight_topic6_f451598a-dde9-448f-ac7e-2cc54a453379.jpg', NULL, NULL, 'highlight-f451598a-t6', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  41, 2, NULL, 'highlight', 'Conclusion and Practice + Understanding ''In Order To'' + Review of Modal Verbs and Their Applications', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543703/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/7/highlight_topic7_f451598a-dde9-448f-ac7e-2cc54a453379.mp4', 193.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543703/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/7/highlight_topic7_f451598a-dde9-448f-ac7e-2cc54a453379.jpg', NULL, NULL, 'highlight-f451598a-t7', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  42, 2, NULL, 'highlight', 'Introduction to English Tenses + Present Simple Tense Overview', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544415/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/1/highlight_topic1_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 194.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544415/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/1/highlight_topic1_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t1', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  43, 2, NULL, 'highlight', 'Forming Questions in Present Simple', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544400/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/2/highlight_topic2_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 126.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544400/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/2/highlight_topic2_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t2', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
(  44, 2, NULL, 'highlight', 'Usage of Present Simple Tense + Common Time Expressions for Present Simple', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544444/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/3/highlight_topic3_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 181.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544444/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/3/highlight_topic3_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t3', '2025-10-01 21:00:00', '2025-10-01 21:00:00'),
(  45, 2, NULL, 'highlight', 'Introduction to Past Simple Tense + Forming Questions in Past Simple', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544454/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/4/highlight_topic4_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 185.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544454/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/4/highlight_topic4_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t4', '2025-10-01 22:00:00', '2025-10-01 22:00:00'),
(  46, 2, NULL, 'highlight', 'Usage of Past Simple Tense + Common Time Expressions for Past Simple', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544475/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/5/highlight_topic5_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 166.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544475/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/5/highlight_topic5_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t5', '2025-10-01 23:00:00', '2025-10-01 23:00:00'),
(  47, 2, NULL, 'highlight', 'Introduction to Future Simple Tense + Introduction to Tenses in English + Future Simple Tense Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544479/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/6/highlight_topic6_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 137.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544479/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/6/highlight_topic6_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t6', '2025-10-02 00:00:00', '2025-10-02 00:00:00'),
(  48, 2, NULL, 'highlight', 'Examples of Future Simple Tense', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544494/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/7/highlight_topic7_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 127.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544494/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/7/highlight_topic7_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t7', '2025-10-02 01:00:00', '2025-10-02 01:00:00'),
(  49, 2, NULL, 'highlight', 'Usage of Future Simple Tense', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544513/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/8/highlight_topic8_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 158.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544513/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/8/highlight_topic8_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t8', '2025-10-02 02:00:00', '2025-10-02 02:00:00'),
(  50, 2, NULL, 'highlight', 'Common Time Expressions for Future Simple + Present Continuous and Past Continuous Tenses', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544524/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/9/highlight_topic9_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 168.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544524/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/9/highlight_topic9_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t9', '2025-10-02 03:00:00', '2025-10-02 03:00:00'),
(  51, 2, NULL, 'highlight', 'Forming Questions in Continuous Tenses + Usage of Continuous Tenses + Present Continuous for Future Plans', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544538/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/10/highlight_topic10_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 134.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544538/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/10/highlight_topic10_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t10', '2025-10-02 04:00:00', '2025-10-02 04:00:00'),
(  52, 2, NULL, 'highlight', 'Past Continuous Tense Overview + Examples of Past Continuous Tense + Past Continuous Tense', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544556/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/11/highlight_topic11_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 193.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544556/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/11/highlight_topic11_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t11', '2025-10-02 05:00:00', '2025-10-02 05:00:00'),
(  53, 2, NULL, 'highlight', 'Examples of Past Continuous Tense + Present Perfect Tense + Present Perfect Tense Usage', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544588/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/12/highlight_topic12_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 195.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544588/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/12/highlight_topic12_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t12', '2025-10-02 06:00:00', '2025-10-02 06:00:00'),
(  54, 2, NULL, 'highlight', 'Hiện Tại Hoàn Thành + Ví dụ về Hiện Tại Hoàn Thành + Cách Dùng Hiện Tại Hoàn Thành Tiếp Diễn + Công Thức Quá Khứ Hoàn Thành', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544590/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/13/highlight_topic13_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 177.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544590/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/13/highlight_topic13_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t13', '2025-10-02 07:00:00', '2025-10-02 07:00:00'),
(  55, 2, NULL, 'highlight', 'Ví dụ về Quá Khứ Hoàn Thành + Examples of Past Perfect Tense + Quá Khứ Hoàn Thành Tiếp Diễn', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544629/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/14/highlight_topic14_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 195.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544629/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/14/highlight_topic14_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t14', '2025-10-02 08:00:00', '2025-10-02 08:00:00'),
(  56, 2, NULL, 'highlight', 'Examples of Past Perfect Continuous Tense + Thực Hành với Các Thì + Câu Hỏi Thực Hành về Hiện Tại và Quá Khứ', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544628/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/15/highlight_topic15_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 189.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544628/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/15/highlight_topic15_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t15', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
(  57, 2, NULL, 'highlight', 'Câu Hỏi Thực Hành Khó + Tổng Kết và Lời Khuyên', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544656/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/16/highlight_topic16_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4', 195.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544656/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/16/highlight_topic16_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg', NULL, NULL, 'highlight-2e069ab1-t16', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
(  58, 2, NULL, 'highlight', 'Understanding the Phrase ''Nice to Meet You''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542700/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/1/highlight_topic1_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 165.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542700/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/1/highlight_topic1_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t1', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
(  59, 2, NULL, 'highlight', 'Correct Usage of ''Nice to Meet You''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542688/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/2/highlight_topic2_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 124.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542688/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/2/highlight_topic2_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t2', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
(  60, 2, NULL, 'highlight', 'Alternative Expressions for Asking About Toilets', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542743/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/3/highlight_topic3_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 146.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542743/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/3/highlight_topic3_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t3', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
(  61, 2, NULL, 'highlight', 'Using ''I Like'' and ''I Like To''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542747/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/4/highlight_topic4_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 124.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542747/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/4/highlight_topic4_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t4', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
(  62, 2, NULL, 'highlight', 'Expressing Dislikes with ''I Don''t Like''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542824/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/5/highlight_topic5_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 197.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542824/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/5/highlight_topic5_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t5', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
(  63, 2, NULL, 'highlight', 'Understanding Western Names', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542832/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/6/highlight_topic6_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 196.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542832/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/6/highlight_topic6_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t6', '2025-10-02 16:00:00', '2025-10-02 16:00:00'),
(  64, 2, NULL, 'highlight', 'Common Pet Names in English + Expressions for Leaving a Conversation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542906/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/7/highlight_topic7_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 192.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542906/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/7/highlight_topic7_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t7', '2025-10-02 17:00:00', '2025-10-02 17:00:00'),
(  65, 2, NULL, 'highlight', 'Expressing Head Injuries or Sickness', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542903/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/8/highlight_topic8_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 162.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542903/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/8/highlight_topic8_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t8', '2025-10-02 18:00:00', '2025-10-02 18:00:00'),
(  66, 2, NULL, 'highlight', 'Asking for Permission', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542987/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/9/highlight_topic9_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 198.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542987/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/9/highlight_topic9_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t9', '2025-10-02 19:00:00', '2025-10-02 19:00:00'),
(  67, 2, NULL, 'highlight', 'Expressing Emotions in English', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542978/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/10/highlight_topic10_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 169.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542978/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/10/highlight_topic10_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t10', '2025-10-02 20:00:00', '2025-10-02 20:00:00'),
(  68, 2, NULL, 'highlight', 'Asking for Directions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543062/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/11/highlight_topic11_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 198.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543062/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/11/highlight_topic11_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t11', '2025-10-02 21:00:00', '2025-10-02 21:00:00'),
(  69, 2, NULL, 'highlight', 'Words of Encouragement', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543067/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/12/highlight_topic12_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 195.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543067/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/12/highlight_topic12_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t12', '2025-10-02 22:00:00', '2025-10-02 22:00:00'),
(  70, 2, NULL, 'highlight', 'Expressing Language Proficiency', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543136/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/13/highlight_topic13_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 187.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543136/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/13/highlight_topic13_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t13', '2025-10-02 23:00:00', '2025-10-02 23:00:00'),
(  71, 2, NULL, 'highlight', 'Apologizing in English', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543131/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/14/highlight_topic14_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 144.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543131/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/14/highlight_topic14_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t14', '2025-10-03 00:00:00', '2025-10-03 00:00:00'),
(  72, 2, NULL, 'highlight', 'Pointing Out Embarrassing Situations', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543203/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/15/highlight_topic15_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 180.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543203/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/15/highlight_topic15_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t15', '2025-10-03 01:00:00', '2025-10-03 01:00:00'),
(  73, 2, NULL, 'highlight', 'Discussing the Weather', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543219/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/16/highlight_topic16_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 194.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543219/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/16/highlight_topic16_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t16', '2025-10-03 02:00:00', '2025-10-03 02:00:00'),
(  74, 2, NULL, 'highlight', 'Asking for Repetition', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543281/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/17/highlight_topic17_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 184.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543281/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/17/highlight_topic17_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t17', '2025-10-03 03:00:00', '2025-10-03 03:00:00'),
(  75, 2, NULL, 'highlight', 'Inquiring About Weekends', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543306/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/18/highlight_topic18_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 197.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543306/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/18/highlight_topic18_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t18', '2025-10-03 04:00:00', '2025-10-03 04:00:00'),
(  76, 2, NULL, 'highlight', 'Expressing Forgetfulness', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543328/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/19/highlight_topic19_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4', 161.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543328/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/19/highlight_topic19_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg', NULL, NULL, 'highlight-24036968-t19', '2025-10-03 05:00:00', '2025-10-03 05:00:00'),
(  77, 4, NULL, 'highlight', 'Introduction to HTML + Setting Up the Development Environment', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456998/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/1/highlight_topic1_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 154.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456998/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/1/highlight_topic1_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t1', '2025-10-03 06:00:00', '2025-10-03 06:00:00'),
(  78, 4, NULL, 'highlight', 'Creating the index.html File + Basic HTML Document Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457007/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/2/highlight_topic2_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 198.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457007/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/2/highlight_topic2_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t2', '2025-10-03 07:00:00', '2025-10-03 07:00:00'),
(  79, 4, NULL, 'highlight', 'Using Header Tags + Paragraph Elements + Line Breaks and Horizontal Rules', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457039/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/3/highlight_topic3_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 179.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457039/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/3/highlight_topic3_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t3', '2025-10-03 08:00:00', '2025-10-03 08:00:00'),
(  80, 4, NULL, 'highlight', 'Adding Comments in HTML + Creating Hyperlinks', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457052/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/4/highlight_topic4_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 196.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457052/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/4/highlight_topic4_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t4', '2025-10-03 09:00:00', '2025-10-03 09:00:00'),
(  81, 4, NULL, 'highlight', 'Adding Images to a Web Page', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/5/highlight_topic5_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 196.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/5/highlight_topic5_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t5', '2025-10-03 10:00:00', '2025-10-03 10:00:00'),
(  82, 4, NULL, 'highlight', 'Embedding Audio in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/6/highlight_topic6_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 129.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/6/highlight_topic6_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t6', '2025-10-03 11:00:00', '2025-10-03 11:00:00'),
(  83, 4, NULL, 'highlight', 'Embedding Video in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457116/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/7/highlight_topic7_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 131.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457116/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/7/highlight_topic7_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t7', '2025-10-03 12:00:00', '2025-10-03 12:00:00'),
(  84, 4, NULL, 'highlight', 'Text Formatting Tags + Creating Lists in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457134/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/8/highlight_topic8_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 195.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457134/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/8/highlight_topic8_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t8', '2025-10-03 13:00:00', '2025-10-03 13:00:00'),
(  85, 4, NULL, 'highlight', 'Creating Tables in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457160/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/9/highlight_topic9_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 197.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457160/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/9/highlight_topic9_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t9', '2025-10-03 14:00:00', '2025-10-03 14:00:00'),
(  86, 4, NULL, 'highlight', 'Adding Color to a Web Page', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457179/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/10/highlight_topic10_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 195.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457179/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/10/highlight_topic10_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t10', '2025-10-03 15:00:00', '2025-10-03 15:00:00'),
(  87, 4, NULL, 'highlight', 'Using Span and Div Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457192/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/11/highlight_topic11_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 137.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457192/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/11/highlight_topic11_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t11', '2025-10-03 16:00:00', '2025-10-03 16:00:00'),
(  88, 4, NULL, 'highlight', 'Understanding Meta Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457223/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/12/highlight_topic12_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 196.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457223/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/12/highlight_topic12_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t12', '2025-10-03 17:00:00', '2025-10-03 17:00:00'),
(  89, 4, NULL, 'highlight', 'Using iFrames', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457238/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/13/highlight_topic13_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 199.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457238/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/13/highlight_topic13_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t13', '2025-10-03 18:00:00', '2025-10-03 18:00:00'),
(  90, 4, NULL, 'highlight', 'Creating Buttons in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457270/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/14/highlight_topic14_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 195.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457270/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/14/highlight_topic14_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t14', '2025-10-03 19:00:00', '2025-10-03 19:00:00'),
(  91, 4, NULL, 'highlight', 'Creating Forms in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457282/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/15/highlight_topic15_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4', 195.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457282/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/15/highlight_topic15_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg', NULL, NULL, 'highlight-04a43ccf-t15', '2025-10-03 20:00:00', '2025-10-03 20:00:00'),
(  92, 6, NULL, 'highlight', 'Registering for ChatGPT', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779454956/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/1/highlight_topic1_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4', 195.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779454956/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/1/highlight_topic1_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg', NULL, NULL, 'highlight-e0a50157-t1', '2025-10-03 21:00:00', '2025-10-03 21:00:00'),
(  93, 6, NULL, 'highlight', 'Advanced Usage of ChatGPT + Using ChatGPT for Content Creation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779454962/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/2/highlight_topic2_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4', 184.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779454962/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/2/highlight_topic2_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg', NULL, NULL, 'highlight-e0a50157-t2', '2025-10-03 22:00:00', '2025-10-03 22:00:00'),
(  94, 6, NULL, 'highlight', 'Future of ChatGPT and AI Tools + Introduction to Upgrading ChatGPT Accounts', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455184/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/3/highlight_topic3_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4', 177.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455184/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/3/highlight_topic3_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg', NULL, NULL, 'highlight-e0a50157-t3', '2025-10-03 23:00:00', '2025-10-03 23:00:00'),
(  95, 6, NULL, 'highlight', 'Differences Between Free and Paid Accounts + Benefits of Upgrading to ChatGPT Plus + How to Upgrade Your Account', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455141/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/4/highlight_topic4_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4', 160.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455141/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/4/highlight_topic4_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg', NULL, NULL, 'highlight-e0a50157-t4', '2025-10-04 00:00:00', '2025-10-04 00:00:00'),
(  96, 6, NULL, 'highlight', 'Demonstration of Data Summarization', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455401/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/5/highlight_topic5_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4', 196.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455401/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/5/highlight_topic5_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg', NULL, NULL, 'highlight-e0a50157-t5', '2025-10-04 01:00:00', '2025-10-04 01:00:00'),
(  97, 6, NULL, 'highlight', 'Interacting with ChatGPT for Data Insights + Limitations and Considerations', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455491/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/6/highlight_topic6_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4', 190.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455491/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/6/highlight_topic6_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg', NULL, NULL, 'highlight-e0a50157-t6', '2025-10-04 02:00:00', '2025-10-04 02:00:00'),
(  98, 6, NULL, 'highlight', 'Using ChatGPT for Image Analysis + Creating Custom Chatbots with ChatGPT + Conclusion and Future Applications', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455730/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/7/highlight_topic7_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4', 194.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455730/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/7/highlight_topic7_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg', NULL, NULL, 'highlight-e0a50157-t7', '2025-10-04 03:00:00', '2025-10-04 03:00:00'),
(  99, 6, NULL, 'highlight', 'Introduction to Data Science and Machine Learning + Multidisciplinary Nature of Data Science', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456016/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/1/highlight_topic1_42eee861-53be-4c03-a7f8-244f236666eb.mp4', 125.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456016/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/1/highlight_topic1_42eee861-53be-4c03-a7f8-244f236666eb.jpg', NULL, NULL, 'highlight-42eee861-t1', '2025-10-04 04:00:00', '2025-10-04 04:00:00'),
( 100, 6, NULL, 'highlight', 'Difference Between Data Science, Data Analytics, and Big Data + Why Data Science is Relevant Now + Applications of Data Science and Machine Learning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456069/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/2/highlight_topic2_42eee861-53be-4c03-a7f8-244f236666eb.mp4', 197.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456069/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/2/highlight_topic2_42eee861-53be-4c03-a7f8-244f236666eb.jpg', NULL, NULL, 'highlight-42eee861-t2', '2025-10-04 05:00:00', '2025-10-04 05:00:00'),
( 101, 6, NULL, 'highlight', 'History and Future of Data Science + Understanding Data and Variables', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456160/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/3/highlight_topic3_42eee861-53be-4c03-a7f8-244f236666eb.mp4', 196.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456160/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/3/highlight_topic3_42eee861-53be-4c03-a7f8-244f236666eb.jpg', NULL, NULL, 'highlight-42eee861-t3', '2025-10-04 06:00:00', '2025-10-04 06:00:00'),
( 102, 6, NULL, 'highlight', 'Handling Outliers and Missing Data + Types of Machine Learning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456226/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/4/highlight_topic4_42eee861-53be-4c03-a7f8-244f236666eb.mp4', 197.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456226/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/4/highlight_topic4_42eee861-53be-4c03-a7f8-244f236666eb.jpg', NULL, NULL, 'highlight-42eee861-t4', '2025-10-04 07:00:00', '2025-10-04 07:00:00'),
( 103, 6, NULL, 'highlight', 'Model Evaluation and Performance Indicators', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456318/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/5/highlight_topic5_42eee861-53be-4c03-a7f8-244f236666eb.mp4', 198.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456318/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/5/highlight_topic5_42eee861-53be-4c03-a7f8-244f236666eb.jpg', NULL, NULL, 'highlight-42eee861-t5', '2025-10-04 08:00:00', '2025-10-04 08:00:00'),
( 104, 6, NULL, 'highlight', 'Best Practices in Data Science and Machine Learning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456352/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/6/highlight_topic6_42eee861-53be-4c03-a7f8-244f236666eb.mp4', 199.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456352/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/6/highlight_topic6_42eee861-53be-4c03-a7f8-244f236666eb.jpg', NULL, NULL, 'highlight-42eee861-t6', '2025-10-04 09:00:00', '2025-10-04 09:00:00'),
( 105, 5, NULL, 'highlight', 'Introduction to System Design + Foundational Concepts in System Design', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456631/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/1/highlight_topic1_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 194.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456631/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/1/highlight_topic1_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t1', '2025-10-04 10:00:00', '2025-10-04 10:00:00'),
( 106, 5, NULL, 'highlight', 'Database Selection: SQL vs NoSQL', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456629/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/2/highlight_topic2_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 189.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456629/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/2/highlight_topic2_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t2', '2025-10-04 11:00:00', '2025-10-04 11:00:00'),
( 107, 5, NULL, 'highlight', 'Scaling Strategies: Vertical vs Horizontal', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456668/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/3/highlight_topic3_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 185.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456668/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/3/highlight_topic3_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t3', '2025-10-04 12:00:00', '2025-10-04 12:00:00'),
( 108, 5, NULL, 'highlight', 'Load Balancing Techniques', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456679/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/4/highlight_topic4_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 194.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456679/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/4/highlight_topic4_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t4', '2025-10-04 13:00:00', '2025-10-04 13:00:00'),
( 109, 5, NULL, 'highlight', 'Avoiding Single Points of Failure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456710/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/5/highlight_topic5_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 193.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456710/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/5/highlight_topic5_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t5', '2025-10-04 14:00:00', '2025-10-04 14:00:00'),
( 110, 5, NULL, 'highlight', 'API Design Principles + Understanding REST, GraphQL, and GRPC', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456726/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/6/highlight_topic6_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 195.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456726/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/6/highlight_topic6_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t6', '2025-10-04 15:00:00', '2025-10-04 15:00:00'),
( 111, 5, NULL, 'highlight', 'Authentication vs Authorization', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456782/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/7/highlight_topic7_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 196.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456782/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/7/highlight_topic7_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t7', '2025-10-04 16:00:00', '2025-10-04 16:00:00'),
( 112, 5, NULL, 'highlight', 'API Security Best Practices', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456780/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/8/highlight_topic8_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4', 198.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456780/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/8/highlight_topic8_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg', NULL, NULL, 'highlight-dc1014ed-t8', '2025-10-04 17:00:00', '2025-10-04 17:00:00'),
( 113, 5, NULL, 'highlight', 'Giới thiệu về cây nhị phân và cây nhị phân tìm kiếm + Cấu trúc của cây nhị phân', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385167/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/1/highlight_topic1_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 128.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385167/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/1/highlight_topic1_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t1', '2025-10-04 18:00:00', '2025-10-04 18:00:00'),
( 114, 5, NULL, 'highlight', 'Các loại cây nhị phân + Cây nhị phân tìm kiếm (BST)', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385221/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/2/highlight_topic2_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 195.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385221/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/2/highlight_topic2_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t2', '2025-10-04 19:00:00', '2025-10-04 19:00:00'),
( 115, 5, NULL, 'highlight', 'Thao tác thêm nút vào cây nhị phân tìm kiếm', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/3/highlight_topic3_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 143.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/3/highlight_topic3_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t3', '2025-10-04 20:00:00', '2025-10-04 20:00:00'),
( 116, 5, NULL, 'highlight', 'Introduction to Binary Search Tree Insertion + Iterative vs Recursive Insertion Methods + Creating a New Root Node + Handling Existing Nodes + Node Comparison and Traversal + Finalizing the Insertion ', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385488/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/4/highlight_topic4_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 184.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385488/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/4/highlight_topic4_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t4', '2025-10-04 21:00:00', '2025-10-04 21:00:00'),
( 117, 5, NULL, 'highlight', 'Thao tác xóa nút trong cây nhị phân tìm kiếm', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385437/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/5/highlight_topic5_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 155.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385437/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/5/highlight_topic5_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t5', '2025-10-04 22:00:00', '2025-10-04 22:00:00'),
( 118, 5, NULL, 'highlight', 'Giới thiệu về cây nhị phân và các thao tác cơ bản + Implementing the Deletion Function', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385628/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/6/highlight_topic6_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 196.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385628/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/6/highlight_topic6_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t6', '2025-10-04 23:00:00', '2025-10-04 23:00:00'),
( 119, 5, NULL, 'highlight', 'Cách thực hiện hàm xóa nút + Trường hợp xóa nút có hai con', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385604/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/7/highlight_topic7_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 125.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385604/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/7/highlight_topic7_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t7', '2025-10-05 00:00:00', '2025-10-05 00:00:00'),
( 120, 5, NULL, 'highlight', 'Trường hợp xóa nút có một con + Trường hợp xóa nút không có con + Tìm kiếm nút trong cây nhị phân', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385858/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/8/highlight_topic8_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 195.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385858/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/8/highlight_topic8_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t8', '2025-10-05 01:00:00', '2025-10-05 01:00:00'),
( 121, 5, NULL, 'highlight', 'Duyệt cây nhị phân', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385829/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/9/highlight_topic9_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 197.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385829/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/9/highlight_topic9_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t9', '2025-10-05 02:00:00', '2025-10-05 02:00:00'),
( 122, 5, NULL, 'highlight', 'Phân tích độ phức tạp của các thuật toán', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779386147/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/10/highlight_topic10_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 198.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779386147/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/10/highlight_topic10_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t10', '2025-10-05 03:00:00', '2025-10-05 03:00:00'),
( 123, 5, NULL, 'highlight', 'Tính chiều cao của cây nhị phân', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385997/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/11/highlight_topic11_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 140.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385997/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/11/highlight_topic11_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t11', '2025-10-05 04:00:00', '2025-10-05 04:00:00'),
( 124, 5, NULL, 'highlight', 'Kiểm tra tổng đường đi trong cây', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779386179/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/12/highlight_topic12_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 192.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779386179/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/12/highlight_topic12_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t12', '2025-10-05 05:00:00', '2025-10-05 05:00:00'),
( 125, 5, NULL, 'highlight', 'Thực hiện giải thuật kiểm tra tổng + Kết luận và tổng kết', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779386285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/13/highlight_topic13_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4', 196.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779386285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/13/highlight_topic13_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg', NULL, NULL, 'highlight-39c9391e-t13', '2025-10-05 06:00:00', '2025-10-05 06:00:00'),
( 126, 4, NULL, 'highlight', 'Cài đặt môi trường lập trình cho máy Windows mới + Cấu hình máy tính mới + Cài đặt Visual Studio Code', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545322/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/1/highlight_topic1_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4', 194.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545322/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/1/highlight_topic1_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg', NULL, NULL, 'highlight-c5c84a09-t1', '2025-10-05 07:00:00', '2025-10-05 07:00:00'),
( 127, 4, NULL, 'highlight', 'Thiết lập terminal + Cài đặt Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545327/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/2/highlight_topic2_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4', 195.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545327/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/2/highlight_topic2_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg', NULL, NULL, 'highlight-c5c84a09-t2', '2025-10-05 08:00:00', '2025-10-05 08:00:00'),
( 128, 4, NULL, 'highlight', 'Hướng dẫn cài đặt môi trường lập trình cho Windows + Cài đặt Visual Studio Code', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545346/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/3/highlight_topic3_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4', 139.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545346/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/3/highlight_topic3_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg', NULL, NULL, 'highlight-c5c84a09-t3', '2025-10-05 09:00:00', '2025-10-05 09:00:00'),
( 129, 4, NULL, 'highlight', 'Cài đặt extensions cho Visual Studio Code + Kiểm tra cài đặt thành công + Cài đặt Node.js + Cài đặt Git + Thiết lập terminal + Cấu hình PATH', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545365/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/4/highlight_topic4_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4', 196.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545365/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/4/highlight_topic4_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg', NULL, NULL, 'highlight-c5c84a09-t4', '2025-10-05 10:00:00', '2025-10-05 10:00:00'),
( 130, 4, NULL, 'highlight', 'Cài đặt môi trường lập trình cho máy Windows mới + Hướng dẫn cài đặt môi trường lập trình cho Windows', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545411/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/5/highlight_topic5_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4', 196.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545411/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/5/highlight_topic5_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg', NULL, NULL, 'highlight-c5c84a09-t5', '2025-10-05 11:00:00', '2025-10-05 11:00:00'),
( 131, 4, NULL, 'highlight', 'Cài đặt Visual Studio Code + Cài đặt Git + Cài đặt Node.js + Thiết lập terminal + Cài đặt extensions cho Visual Studio Code + Cấu hình PATH + Kiểm tra cài đặt thành công + Cài đặt và cấu hình Apache +', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545406/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/6/highlight_topic6_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4', 188.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545406/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/6/highlight_topic6_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg', NULL, NULL, 'highlight-c5c84a09-t6', '2025-10-05 12:00:00', '2025-10-05 12:00:00'),
( 132, 4, NULL, 'highlight', 'Giới thiệu về CORS Policy + Khái niệm nguồn gốc (Origin)', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546460/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/1/highlight_topic1_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4', 196.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546460/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/1/highlight_topic1_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg', NULL, NULL, 'highlight-04dc92fc-t1', '2025-10-05 13:00:00', '2025-10-05 13:00:00'),
( 133, 4, NULL, 'highlight', 'Chính sách CORS + Access-Control-Allow-Origin', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546439/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/2/highlight_topic2_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4', 91.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546439/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/2/highlight_topic2_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg', NULL, NULL, 'highlight-04dc92fc-t2', '2025-10-05 14:00:00', '2025-10-05 14:00:00'),
( 134, 4, NULL, 'highlight', 'Xử lý lỗi CORS + Access-Control-Allow-Origin + Cấu hình CORS', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546466/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/3/highlight_topic3_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4', 144.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546466/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/3/highlight_topic3_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg', NULL, NULL, 'highlight-04dc92fc-t3', '2025-10-05 15:00:00', '2025-10-05 15:00:00'),
( 135, 4, NULL, 'highlight', 'Tình huống thực tế với CORS + Thực tiễn sử dụng CORS + Tương lai của CORS', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546497/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/4/highlight_topic4_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4', 198.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546497/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/4/highlight_topic4_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg', NULL, NULL, 'highlight-04dc92fc-t4', '2025-10-05 16:00:00', '2025-10-05 16:00:00'),
( 136, 4, NULL, 'highlight', 'Introduction to HTML + Setting Up the Development Environment', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546911/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/1/highlight_topic1_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 154.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546911/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/1/highlight_topic1_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t1', '2025-10-05 17:00:00', '2025-10-05 17:00:00'),
( 137, 4, NULL, 'highlight', 'Creating the Basic HTML Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546917/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/2/highlight_topic2_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 199.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546917/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/2/highlight_topic2_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t2', '2025-10-05 18:00:00', '2025-10-05 18:00:00'),
( 138, 4, NULL, 'highlight', 'Using HTML Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546955/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/3/highlight_topic3_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 195.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546955/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/3/highlight_topic3_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t3', '2025-10-05 19:00:00', '2025-10-05 19:00:00'),
( 139, 4, NULL, 'highlight', 'Adding Comments in HTML + Creating Hyperlinks', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546962/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/4/highlight_topic4_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 195.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546962/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/4/highlight_topic4_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t4', '2025-10-05 20:00:00', '2025-10-05 20:00:00'),
( 140, 4, NULL, 'highlight', 'Inserting Images', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546997/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/5/highlight_topic5_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 196.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546997/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/5/highlight_topic5_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t5', '2025-10-05 21:00:00', '2025-10-05 21:00:00'),
( 141, 4, NULL, 'highlight', 'Adding Audio to a Web Page', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546992/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/6/highlight_topic6_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 129.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546992/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/6/highlight_topic6_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t6', '2025-10-05 22:00:00', '2025-10-05 22:00:00'),
( 142, 4, NULL, 'highlight', 'Embedding Videos', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547021/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/7/highlight_topic7_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 131.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547021/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/7/highlight_topic7_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t7', '2025-10-05 23:00:00', '2025-10-05 23:00:00'),
( 143, 4, NULL, 'highlight', 'Text Formatting Tags + Creating Lists in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547046/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/8/highlight_topic8_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 195.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547046/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/8/highlight_topic8_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t8', '2025-10-06 00:00:00', '2025-10-06 00:00:00'),
( 144, 4, NULL, 'highlight', 'Creating Tables in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547065/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/9/highlight_topic9_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 197.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547065/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/9/highlight_topic9_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t9', '2025-10-06 01:00:00', '2025-10-06 01:00:00'),
( 145, 4, NULL, 'highlight', 'Adding Color to Web Pages', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547090/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/10/highlight_topic10_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 195.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547090/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/10/highlight_topic10_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t10', '2025-10-06 02:00:00', '2025-10-06 02:00:00'),
( 146, 4, NULL, 'highlight', 'Understanding Span and Div Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547096/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/11/highlight_topic11_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 137.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547096/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/11/highlight_topic11_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t11', '2025-10-06 03:00:00', '2025-10-06 03:00:00'),
( 147, 4, NULL, 'highlight', 'Using Meta Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547134/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/12/highlight_topic12_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 195.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547134/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/12/highlight_topic12_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t12', '2025-10-06 04:00:00', '2025-10-06 04:00:00'),
( 148, 4, NULL, 'highlight', 'Embedding iFrames', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547141/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/13/highlight_topic13_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 199.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547141/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/13/highlight_topic13_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t13', '2025-10-06 05:00:00', '2025-10-06 05:00:00'),
( 149, 4, NULL, 'highlight', 'Creating Buttons in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547180/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/14/highlight_topic14_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 198.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547180/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/14/highlight_topic14_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t14', '2025-10-06 06:00:00', '2025-10-06 06:00:00'),
( 150, 4, NULL, 'highlight', 'Building Forms in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547188/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/15/highlight_topic15_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4', 198.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547188/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/15/highlight_topic15_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg', NULL, NULL, 'highlight-fe447cb7-t15', '2025-10-06 07:00:00', '2025-10-06 07:00:00'),
( 151, 4, NULL, 'highlight', 'Introduction to Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547744/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/1/highlight_topic1_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 157.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547744/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/1/highlight_topic1_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t1', '2025-10-06 08:00:00', '2025-10-06 08:00:00'),
( 152, 4, NULL, 'highlight', 'Node.js Architecture', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547746/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/2/highlight_topic2_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 173.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547746/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/2/highlight_topic2_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t2', '2025-10-06 09:00:00', '2025-10-06 09:00:00'),
( 153, 4, NULL, 'highlight', 'Asynchronous Nature of Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547787/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/3/highlight_topic3_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 193.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547787/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/3/highlight_topic3_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t3', '2025-10-06 10:00:00', '2025-10-06 10:00:00'),
( 154, 4, NULL, 'highlight', 'Installing Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547784/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/4/highlight_topic4_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 156.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547784/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/4/highlight_topic4_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t4', '2025-10-06 11:00:00', '2025-10-06 11:00:00'),
( 155, 4, NULL, 'highlight', 'Creating Your First Node.js Application', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547816/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/5/highlight_topic5_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 134.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547816/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/5/highlight_topic5_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t5', '2025-10-06 12:00:00', '2025-10-06 12:00:00'),
( 156, 4, NULL, 'highlight', 'Node.js Module System', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547834/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/6/highlight_topic6_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 198.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547834/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/6/highlight_topic6_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t6', '2025-10-06 13:00:00', '2025-10-06 13:00:00'),
( 157, 4, NULL, 'highlight', 'Working with Global Objects in Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547862/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/7/highlight_topic7_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 195.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547862/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/7/highlight_topic7_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t7', '2025-10-06 14:00:00', '2025-10-06 14:00:00'),
( 158, 4, NULL, 'highlight', 'Event Handling in Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547907/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/8/highlight_topic8_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 197.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547907/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/8/highlight_topic8_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t8', '2025-10-06 15:00:00', '2025-10-06 15:00:00'),
( 159, 4, NULL, 'highlight', 'Building an HTTP Server', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547912/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/9/highlight_topic9_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4', 198.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547912/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/9/highlight_topic9_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg', NULL, NULL, 'highlight-8db9bec9-t9', '2025-10-06 16:00:00', '2025-10-06 16:00:00'),
( 160, 4, NULL, 'highlight', 'Introduction to JavaScript + Capabilities of JavaScript + JavaScript Execution Environments', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548209/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/1/highlight_topic1_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 129.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548209/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/1/highlight_topic1_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t1', '2025-10-06 17:00:00', '2025-10-06 17:00:00'),
( 161, 4, NULL, 'highlight', 'ECMAScript and ES6 Features + Setting Up Development Environment', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548220/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/2/highlight_topic2_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 184.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548220/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/2/highlight_topic2_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t2', '2025-10-06 18:00:00', '2025-10-06 18:00:00'),
( 162, 4, NULL, 'highlight', 'Creating and Linking JavaScript Files', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548260/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/3/highlight_topic3_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 199.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548260/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/3/highlight_topic3_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t3', '2025-10-06 19:00:00', '2025-10-06 19:00:00'),
( 163, 4, NULL, 'highlight', 'Understanding Variables', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548253/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/4/highlight_topic4_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 135.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548253/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/4/highlight_topic4_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t4', '2025-10-06 20:00:00', '2025-10-06 20:00:00'),
( 164, 4, NULL, 'highlight', 'Constants in JavaScript + Primitive Data Types', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548299/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/5/highlight_topic5_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 195.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548299/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/5/highlight_topic5_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t5', '2025-10-06 21:00:00', '2025-10-06 21:00:00'),
( 165, 4, NULL, 'highlight', 'Dynamic Typing in JavaScript', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548301/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/6/highlight_topic6_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 178.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548301/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/6/highlight_topic6_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t6', '2025-10-06 22:00:00', '2025-10-06 22:00:00'),
( 166, 4, NULL, 'highlight', 'Introduction to Objects', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548331/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/7/highlight_topic7_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 132.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548331/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/7/highlight_topic7_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t7', '2025-10-06 23:00:00', '2025-10-06 23:00:00'),
( 167, 4, NULL, 'highlight', 'Accessing Object Properties', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548332/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/8/highlight_topic8_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 130.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548332/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/8/highlight_topic8_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t8', '2025-10-07 00:00:00', '2025-10-07 00:00:00'),
( 168, 4, NULL, 'highlight', 'Working with Arrays', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548378/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/9/highlight_topic9_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 193.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548378/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/9/highlight_topic9_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t9', '2025-10-07 01:00:00', '2025-10-07 01:00:00'),
( 169, 4, NULL, 'highlight', 'Functions in JavaScript', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548383/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/10/highlight_topic10_f8389269-4531-41f4-9d61-ca27393c75ff.mp4', 199.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548383/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/10/highlight_topic10_f8389269-4531-41f4-9d61-ca27393c75ff.jpg', NULL, NULL, 'highlight-f8389269-t10', '2025-10-07 02:00:00', '2025-10-07 02:00:00'),
( 170, 10, NULL, 'highlight', 'Introduction to Critical Thinking + Current Educational Challenges + The Importance of Questioning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557615/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/1/highlight_topic1_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 120.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557615/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/1/highlight_topic1_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t1', '2025-10-07 03:00:00', '2025-10-07 03:00:00'),
( 171, 10, NULL, 'highlight', 'Consequences of Lack of Critical Thinking + Skills Needed for the Future', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557614/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/2/highlight_topic2_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 196.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557614/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/2/highlight_topic2_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t2', '2025-10-07 04:00:00', '2025-10-07 04:00:00'),
( 172, 10, NULL, 'highlight', 'Understanding Critical Thinking + The Process of Critical Thinking', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557648/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/3/highlight_topic3_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 191.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557648/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/3/highlight_topic3_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t3', '2025-10-07 05:00:00', '2025-10-07 05:00:00'),
( 173, 10, NULL, 'highlight', 'Describing and Articulating Thoughts + Self-Reflection and Acceptance of Mistakes', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557651/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/4/highlight_topic4_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 194.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557651/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/4/highlight_topic4_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t4', '2025-10-07 06:00:00', '2025-10-07 06:00:00'),
( 174, 10, NULL, 'highlight', 'Acquiring Knowledge in the Digital Age', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557672/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/5/highlight_topic5_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 146.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557672/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/5/highlight_topic5_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t5', '2025-10-07 07:00:00', '2025-10-07 07:00:00'),
( 175, 10, NULL, 'highlight', 'Challenges in Information Processing + Encouragement to Take Action + Application of Critical Thinking', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557686/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/6/highlight_topic6_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 186.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557686/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/6/highlight_topic6_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t6', '2025-10-07 08:00:00', '2025-10-07 08:00:00'),
( 176, 10, NULL, 'highlight', 'Analyzing Information + Understanding Critical Thinking', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557695/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/7/highlight_topic7_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 138.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557695/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/7/highlight_topic7_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t7', '2025-10-07 09:00:00', '2025-10-07 09:00:00'),
( 177, 10, NULL, 'highlight', 'Synthesis and Creativity in Critical Thinking + The Importance of Internalizing Knowledge + The Role of Critical Thinking in the Modern World', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557734/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/8/highlight_topic8_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 191.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557734/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/8/highlight_topic8_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t8', '2025-10-07 10:00:00', '2025-10-07 10:00:00'),
( 178, 10, NULL, 'highlight', 'AI and Human Skills + Emotional Intelligence in Communication', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557737/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/9/highlight_topic9_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 196.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557737/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/9/highlight_topic9_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t9', '2025-10-07 11:00:00', '2025-10-07 11:00:00'),
( 179, 10, NULL, 'highlight', 'Applying Critical Thinking in Dialogue', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557761/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/10/highlight_topic10_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 130.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557761/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/10/highlight_topic10_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t10', '2025-10-07 12:00:00', '2025-10-07 12:00:00'),
( 180, 10, NULL, 'highlight', 'Overcoming Challenges in Group Work', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557765/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/11/highlight_topic11_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 154.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557765/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/11/highlight_topic11_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t11', '2025-10-07 13:00:00', '2025-10-07 13:00:00'),
( 181, 10, NULL, 'highlight', 'The Value of Personal Reflection + The Role of Emotional Intelligence in Communication', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557798/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/12/highlight_topic12_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 187.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557798/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/12/highlight_topic12_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t12', '2025-10-07 14:00:00', '2025-10-07 14:00:00'),
( 182, 10, NULL, 'highlight', 'The Future of Learning and Adaptation + Collaboration and Teamwork in Critical Thinking', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557802/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/13/highlight_topic13_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4', 198.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557802/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/13/highlight_topic13_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg', NULL, NULL, 'highlight-50f3636d-t13', '2025-10-07 15:00:00', '2025-10-07 15:00:00'),
( 183, 10, NULL, 'highlight', 'Introduction to Project Management + History of Project Management + Project Management Lifecycle', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557164/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/1/highlight_topic1_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4', 121.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557164/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/1/highlight_topic1_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg', NULL, NULL, 'highlight-51bfe570-t1', '2025-10-07 16:00:00', '2025-10-07 16:00:00'),
( 184, 10, NULL, 'highlight', 'Project Initiation Phase + Project Planning Phase + Project Execution Phase', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557126/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/2/highlight_topic2_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4', 134.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557126/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/2/highlight_topic2_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg', NULL, NULL, 'highlight-51bfe570-t2', '2025-10-07 17:00:00', '2025-10-07 17:00:00'),
( 185, 10, NULL, 'highlight', 'Monitoring and Control Phase + Project Closure Phase + Project Management Knowledge Areas + Project Management Methodologies', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557213/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/3/highlight_topic3_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4', 197.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557213/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/3/highlight_topic3_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg', NULL, NULL, 'highlight-51bfe570-t3', '2025-10-07 18:00:00', '2025-10-07 18:00:00'),
( 186, 10, NULL, 'highlight', 'Project Management Tools', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557228/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/4/highlight_topic4_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4', 195.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557228/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/4/highlight_topic4_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg', NULL, NULL, 'highlight-51bfe570-t4', '2025-10-07 19:00:00', '2025-10-07 19:00:00'),
( 187, 10, NULL, 'highlight', 'Project Management Certifications', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/5/highlight_topic5_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4', 195.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/5/highlight_topic5_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg', NULL, NULL, 'highlight-51bfe570-t5', '2025-10-07 20:00:00', '2025-10-07 20:00:00'),
( 188, 10, NULL, 'highlight', 'Demo: Creating a Project Plan with Asana', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/6/highlight_topic6_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4', 187.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/6/highlight_topic6_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg', NULL, NULL, 'highlight-51bfe570-t6', '2025-10-07 21:00:00', '2025-10-07 21:00:00'),
( 189, 10, NULL, 'highlight', 'Introduction to Music Theory for Guitar Players + The First Assignment: Note Cards', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558092/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/1/highlight_topic1_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 163.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558092/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/1/highlight_topic1_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t1', '2025-10-07 22:00:00', '2025-10-07 22:00:00'),
( 190, 10, NULL, 'highlight', 'Creating Major Triads + Understanding Major Triads and Chords', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558079/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/2/highlight_topic2_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 158.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558079/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/2/highlight_topic2_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t2', '2025-10-07 23:00:00', '2025-10-07 23:00:00'),
( 191, 10, NULL, 'highlight', 'Memorizing Sharps and Flats + The Circle of Fifths and Key Signatures + Introduction to Chord Theory', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558208/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/3/highlight_topic3_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 198.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558208/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/3/highlight_topic3_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t3', '2025-10-08 00:00:00', '2025-10-08 00:00:00'),
( 192, 10, NULL, 'highlight', 'Understanding Chord Inversions + Playing Chord Inversions on Guitar', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558162/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/4/highlight_topic4_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 199.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558162/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/4/highlight_topic4_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t4', '2025-10-08 01:00:00', '2025-10-08 01:00:00'),
( 193, 10, NULL, 'highlight', 'Transitioning Between Chords', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558205/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/5/highlight_topic5_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 135.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558205/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/5/highlight_topic5_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t5', '2025-10-08 02:00:00', '2025-10-08 02:00:00'),
( 194, 10, NULL, 'highlight', 'Exploring Second Inversion Chords', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558266/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/6/highlight_topic6_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 189.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558266/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/6/highlight_topic6_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t6', '2025-10-08 03:00:00', '2025-10-08 03:00:00'),
( 195, 10, NULL, 'highlight', 'Building Major and Minor Chords', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558311/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/7/highlight_topic7_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 198.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558311/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/7/highlight_topic7_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t7', '2025-10-08 04:00:00', '2025-10-08 04:00:00'),
( 196, 10, NULL, 'highlight', 'Understanding the Circle of Fifths + Recap of Music Theory Concepts', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558320/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/8/highlight_topic8_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4', 197.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558320/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/8/highlight_topic8_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg', NULL, NULL, 'highlight-7275bf24-t8', '2025-10-08 05:00:00', '2025-10-08 05:00:00'),
( 197, 9, NULL, 'highlight', 'Introduction to Video Editing with CapCut + Video Editing Workflow Steps', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558604/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/1/highlight_topic1_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 198.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558604/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/1/highlight_topic1_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t1', '2025-10-08 06:00:00', '2025-10-08 06:00:00'),
( 198, 9, NULL, 'highlight', 'Understanding the Timeline and Layer Management + Masking Techniques in Video Editing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558606/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/2/highlight_topic2_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 196.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558606/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/2/highlight_topic2_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t2', '2025-10-08 07:00:00', '2025-10-08 07:00:00'),
( 199, 9, NULL, 'highlight', 'Color Grading Essentials + Introduction to CapCut Video Editing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558682/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/3/highlight_topic3_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 198.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558682/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/3/highlight_topic3_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t3', '2025-10-08 08:00:00', '2025-10-08 08:00:00'),
( 200, 9, NULL, 'highlight', 'Masking Techniques in CapCut + Using Multiple Masks + Adjusting Video Frames + Creating Fade Effects', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558647/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/4/highlight_topic4_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 142.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558647/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/4/highlight_topic4_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t4', '2025-10-08 09:00:00', '2025-10-08 09:00:00'),
( 201, 9, NULL, 'highlight', 'Layering Effects + Advanced Transitions and Effects', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558681/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/5/highlight_topic5_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 125.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558681/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/5/highlight_topic5_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t5', '2025-10-08 10:00:00', '2025-10-08 10:00:00'),
( 202, 9, NULL, 'highlight', 'Speed Adjustment Techniques + Audio Mixing Fundamentals', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558737/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/6/highlight_topic6_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 193.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558737/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/6/highlight_topic6_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t6', '2025-10-08 11:00:00', '2025-10-08 11:00:00'),
( 203, 9, NULL, 'highlight', 'Adding Background Music + Creating Subtitles Automatically', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558768/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/7/highlight_topic7_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 197.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558768/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/7/highlight_topic7_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t7', '2025-10-08 12:00:00', '2025-10-08 12:00:00'),
( 204, 9, NULL, 'highlight', 'Finalizing and Rendering Videos', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558766/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/8/highlight_topic8_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4', 121.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558766/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/8/highlight_topic8_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg', NULL, NULL, 'highlight-2f2a0cf0-t8', '2025-10-08 13:00:00', '2025-10-08 13:00:00'),
( 205, 9, NULL, 'highlight', 'Introduction to Premiere Pro Basics + Setting Up Project Files', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558972/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/1/highlight_topic1_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 126.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558972/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/1/highlight_topic1_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t1', '2025-10-08 14:00:00', '2025-10-08 14:00:00'),
( 206, 9, NULL, 'highlight', 'Premiere Pro Workspace Setup', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558997/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/2/highlight_topic2_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 196.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558997/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/2/highlight_topic2_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t2', '2025-10-08 15:00:00', '2025-10-08 15:00:00'),
( 207, 9, NULL, 'highlight', 'Importing Media and Creating a Sequence', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559014/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/3/highlight_topic3_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 120.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559014/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/3/highlight_topic3_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t3', '2025-10-08 16:00:00', '2025-10-08 16:00:00'),
( 208, 9, NULL, 'highlight', 'Timeline Fundamentals: Cutting and Trimming Clips', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559059/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/4/highlight_topic4_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 179.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559059/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/4/highlight_topic4_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t4', '2025-10-08 17:00:00', '2025-10-08 17:00:00'),
( 209, 9, NULL, 'highlight', 'Adding Transitions Between Clips', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559081/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/5/highlight_topic5_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 191.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559081/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/5/highlight_topic5_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t5', '2025-10-08 18:00:00', '2025-10-08 18:00:00'),
( 210, 9, NULL, 'highlight', 'Incorporating Text Titles', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559122/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/6/highlight_topic6_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 184.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559122/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/6/highlight_topic6_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t6', '2025-10-08 19:00:00', '2025-10-08 19:00:00'),
( 211, 9, NULL, 'highlight', 'Audio Adjustment Techniques', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559249/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/7/highlight_topic7_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 198.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559249/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/7/highlight_topic7_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t7', '2025-10-08 20:00:00', '2025-10-08 20:00:00'),
( 212, 9, NULL, 'highlight', 'Exporting Your Final Project + Color Correction and Grading Basics', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559228/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/8/highlight_topic8_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 198.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559228/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/8/highlight_topic8_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t8', '2025-10-08 21:00:00', '2025-10-08 21:00:00'),
( 213, 9, NULL, 'highlight', 'Keyframing for Motion Graphics', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559285/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/9/highlight_topic9_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4', 199.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559285/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/9/highlight_topic9_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg', NULL, NULL, 'highlight-b03dcdef-t9', '2025-10-08 22:00:00', '2025-10-08 22:00:00'),
( 214, 7, NULL, 'highlight', 'Giới thiệu về Lightroom + Nguyên tắc hoạt động của Lightroom + Chọn và nhập hình ảnh', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470377/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/1/highlight_topic1_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 153.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470377/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/1/highlight_topic1_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t1', '2025-10-08 23:00:00', '2025-10-08 23:00:00'),
( 215, 7, NULL, 'highlight', 'Quản lý thư viện hình ảnh + Xuất hình ảnh + Chỉnh sửa hình ảnh cơ bản + Công cụ khử mắt đỏ và chỉnh màu', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470435/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/2/highlight_topic2_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 195.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470435/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/2/highlight_topic2_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t2', '2025-10-09 00:00:00', '2025-10-09 00:00:00'),
( 216, 7, NULL, 'highlight', 'Giới thiệu về công cụ AI trong Lightroom + Chọn chủ thể trong hình ảnh + Chọn vùng trời và xóa nền + Công cụ chọn vùng không gian + Sử dụng công cụ Blood để tạo mặt nạ', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470428/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/3/highlight_topic3_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 177.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470428/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/3/highlight_topic3_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t3', '2025-10-09 01:00:00', '2025-10-09 01:00:00'),
( 217, 7, NULL, 'highlight', 'Công cụ Lainer Gradient + Công cụ Radio Gradient + Công cụ Color Ren và Luminon Ren', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470467/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/4/highlight_topic4_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 143.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470467/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/4/highlight_topic4_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t4', '2025-10-09 02:00:00', '2025-10-09 02:00:00'),
( 218, 7, NULL, 'highlight', 'Cân bằng trắng và các chế độ màu + Công cụ chỉnh sáng tối', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470474/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/5/highlight_topic5_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 166.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470474/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/5/highlight_topic5_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t5', '2025-10-09 03:00:00', '2025-10-09 03:00:00'),
( 219, 7, NULL, 'highlight', 'Công cụ tăng giảm chi tiết + Công cụ điều chỉnh màu sắc + Công cụ tông cất', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470513/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/6/highlight_topic6_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 173.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470513/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/6/highlight_topic6_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t6', '2025-10-09 04:00:00', '2025-10-09 04:00:00'),
( 220, 7, NULL, 'highlight', 'Công cụ vòng tròn điều chỉnh + Công cụ chỉnh sửa màu sắc nâng cao', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470542/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/7/highlight_topic7_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 183.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470542/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/7/highlight_topic7_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t7', '2025-10-09 05:00:00', '2025-10-09 05:00:00'),
( 221, 7, NULL, 'highlight', 'Giới thiệu về nguyên lý sử dụng Lightroom + Công cụ điều chỉnh độ sáng và độ tương phản + Công cụ khử noise', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470556/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/8/highlight_topic8_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 171.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470556/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/8/highlight_topic8_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t8', '2025-10-09 06:00:00', '2025-10-09 06:00:00'),
( 222, 7, NULL, 'highlight', 'Sử dụng công cụ Transform + Sử dụng công cụ Crop và Straighten + Công cụ crop và điều chỉnh hình ảnh + Tổng kết và hướng dẫn sử dụng', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470592/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/9/highlight_topic9_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4', 189.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470592/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/9/highlight_topic9_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg', NULL, NULL, 'highlight-50b18e9c-t9', '2025-10-09 07:00:00', '2025-10-09 07:00:00'),
( 223, 7, NULL, 'highlight', 'Introduction to Graphic Design Basics + Setting Up the Workspace in Photoshop', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469389/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/1/highlight_topic1_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 160.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469389/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/1/highlight_topic1_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t1', '2025-10-09 08:00:00', '2025-10-09 08:00:00'),
( 224, 7, NULL, 'highlight', 'Creating a New Document + Understanding Image Resolution', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469392/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/2/highlight_topic2_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 194.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469392/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/2/highlight_topic2_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t2', '2025-10-09 09:00:00', '2025-10-09 09:00:00'),
( 225, 7, NULL, 'highlight', 'Choosing Color Modes + Using Layers in Design', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469428/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/3/highlight_topic3_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 198.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469428/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/3/highlight_topic3_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t3', '2025-10-09 10:00:00', '2025-10-09 10:00:00'),
( 226, 7, NULL, 'highlight', 'Chọn Mẫu Màu Trong Thiết Kế Đồ Họa + Phân Biệt Các Mẫu Màu + Quy Trình Chọn Mẫu Màu', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469426/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/4/highlight_topic4_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 194.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469426/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/4/highlight_topic4_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t4', '2025-10-09 11:00:00', '2025-10-09 11:00:00'),
( 227, 7, NULL, 'highlight', 'Cách Đổ Màu Trong Thiết Kế + Nguyên Tắc Sử Dụng Màu Sắc', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469456/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/5/highlight_topic5_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 193.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469456/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/5/highlight_topic5_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t5', '2025-10-09 12:00:00', '2025-10-09 12:00:00'),
( 228, 7, NULL, 'highlight', 'Tạo Bố Cục Trong Thiết Kế + Sử Dụng Hình Dạng Trong Thiết Kế', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469452/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/6/highlight_topic6_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 151.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469452/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/6/highlight_topic6_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t6', '2025-10-09 13:00:00', '2025-10-09 13:00:00'),
( 229, 7, NULL, 'highlight', 'Kỹ Thuật Tạo Hình Trong Thiết Kế', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469487/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/7/highlight_topic7_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 193.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469487/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/7/highlight_topic7_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t7', '2025-10-09 14:00:00', '2025-10-09 14:00:00'),
( 230, 7, NULL, 'highlight', 'Quản Lý Đối Tượng Trong Thiết Kế', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469494/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/8/highlight_topic8_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 194.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469494/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/8/highlight_topic8_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t8', '2025-10-09 15:00:00', '2025-10-09 15:00:00'),
( 231, 7, NULL, 'highlight', 'Xuất Bản Thiết Kế', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469530/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/9/highlight_topic9_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 195.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469530/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/9/highlight_topic9_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t9', '2025-10-09 16:00:00', '2025-10-09 16:00:00'),
( 232, 7, NULL, 'highlight', 'Creating Layouts with Shapes + Tạo Hiệu Ứng Trong Thiết Kế', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469542/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/10/highlight_topic10_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 193.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469542/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/10/highlight_topic10_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t10', '2025-10-09 17:00:00', '2025-10-09 17:00:00'),
( 233, 7, NULL, 'highlight', 'Kết Luận và Bài Tập Thực Hành', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469573/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/11/highlight_topic11_45661857-e4b3-47d1-9010-a3c04b782a40.mp4', 197.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469573/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/11/highlight_topic11_45661857-e4b3-47d1-9010-a3c04b782a40.jpg', NULL, NULL, 'highlight-45661857-t11', '2025-10-09 18:00:00', '2025-10-09 18:00:00'),
( 234, 7, NULL, 'highlight', 'Understanding Exposure + The Three Camera Settings for Exposure + ISO Explained', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469799/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/1/highlight_topic1_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 123.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469799/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/1/highlight_topic1_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t1', '2025-10-09 19:00:00', '2025-10-09 19:00:00'),
( 235, 7, NULL, 'highlight', 'Understanding Aperture + Demonstrating Aperture Effects', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469826/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/2/highlight_topic2_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 196.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469826/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/2/highlight_topic2_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t2', '2025-10-09 20:00:00', '2025-10-09 20:00:00'),
( 236, 7, NULL, 'highlight', 'Creative Use of Shutter Speed', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469837/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/3/highlight_topic3_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 192.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469837/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/3/highlight_topic3_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t3', '2025-10-09 21:00:00', '2025-10-09 21:00:00'),
( 237, 7, NULL, 'highlight', 'Understanding Camera Exposure + How Cameras Measure Light', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469857/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/4/highlight_topic4_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 174.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469857/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/4/highlight_topic4_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t4', '2025-10-09 22:00:00', '2025-10-09 22:00:00'),
( 238, 7, NULL, 'highlight', 'Common Exposure Problems + Solutions for Better Exposure + Metering Modes and Exposure Compensation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469893/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/5/highlight_topic5_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 197.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469893/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/5/highlight_topic5_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t5', '2025-10-09 23:00:00', '2025-10-09 23:00:00'),
( 239, 7, NULL, 'highlight', 'The Concept of Stops in Photography + Dynamic and Tonal Ranges', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469902/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/6/highlight_topic6_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 194.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469902/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/6/highlight_topic6_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t6', '2025-10-10 00:00:00', '2025-10-10 00:00:00'),
( 240, 7, NULL, 'highlight', 'Techniques to Control Light + Understanding Histograms', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/7/highlight_topic7_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 195.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/7/highlight_topic7_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t7', '2025-10-10 01:00:00', '2025-10-10 01:00:00'),
( 241, 7, NULL, 'highlight', 'Analyzing Histograms for Proper Exposure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/8/highlight_topic8_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 192.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/8/highlight_topic8_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t8', '2025-10-10 02:00:00', '2025-10-10 02:00:00'),
( 242, 7, NULL, 'highlight', 'Transitioning to Manual Mode', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469980/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/9/highlight_topic9_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4', 194.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469980/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/9/highlight_topic9_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg', NULL, NULL, 'highlight-c31518a2-t9', '2025-10-10 03:00:00', '2025-10-10 03:00:00'),
( 243, 7, NULL, 'highlight', 'Introduction to Figma and Course Overview + Creating a Desktop Frame', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470855/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/1/highlight_topic1_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 129.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470855/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/1/highlight_topic1_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t1', '2025-10-10 04:00:00', '2025-10-10 04:00:00'),
( 244, 7, NULL, 'highlight', 'Understanding Color Properties + Adding Structure with Lines and Dividers', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470893/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/2/highlight_topic2_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 198.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470893/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/2/highlight_topic2_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t2', '2025-10-10 05:00:00', '2025-10-10 05:00:00'),
( 245, 7, NULL, 'highlight', 'Using Rulers and Grids for Layout + Working with Text in Figma', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471025/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/3/highlight_topic3_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 197.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471025/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/3/highlight_topic3_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t3', '2025-10-10 06:00:00', '2025-10-10 06:00:00'),
( 246, 7, NULL, 'highlight', 'Creating Shapes and Icons', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471062/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/4/highlight_topic4_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 196.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471062/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/4/highlight_topic4_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t4', '2025-10-10 07:00:00', '2025-10-10 07:00:00'),
( 247, 7, NULL, 'highlight', 'Implementing Gradients and Shadows', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471190/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/5/highlight_topic5_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 198.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471190/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/5/highlight_topic5_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t5', '2025-10-10 08:00:00', '2025-10-10 08:00:00'),
( 248, 7, NULL, 'highlight', 'Utilizing Auto Layout for Flexibility', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471179/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/6/highlight_topic6_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 152.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471179/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/6/highlight_topic6_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t6', '2025-10-10 09:00:00', '2025-10-10 09:00:00'),
( 249, 7, NULL, 'highlight', 'Creating Components for Reusability', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471353/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/7/highlight_topic7_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 199.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471353/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/7/highlight_topic7_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t7', '2025-10-10 10:00:00', '2025-10-10 10:00:00'),
( 250, 7, NULL, 'highlight', 'Prototyping and Interaction Design', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471348/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/8/highlight_topic8_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 198.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471348/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/8/highlight_topic8_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t8', '2025-10-10 11:00:00', '2025-10-10 11:00:00'),
( 251, 7, NULL, 'highlight', 'Dev Handoff and Collaboration', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471433/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/9/highlight_topic9_07224cce-efb9-4b79-af32-7e0c0717b967.mp4', 195.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471433/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/9/highlight_topic9_07224cce-efb9-4b79-af32-7e0c0717b967.jpg', NULL, NULL, 'highlight-07224cce-t9', '2025-10-10 12:00:00', '2025-10-10 12:00:00'),
( 252, 8, NULL, 'highlight', 'Introduction to Power BI and Its Importance + Understanding Power BI''s Role in Data Analysis + Comparison with Other BI Tools', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612138/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/1/highlight_topic1_0d07a77f-a834-410e-b341-7738419b971f.mp4', 184.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612138/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/1/highlight_topic1_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t1', '2025-10-10 13:00:00', '2025-10-10 13:00:00'),
( 253, 8, NULL, 'highlight', 'Components of Power BI + Data Transformation with Power Query', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612131/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/2/highlight_topic2_0d07a77f-a834-410e-b341-7738419b971f.mp4', 154.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612131/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/2/highlight_topic2_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t2', '2025-10-10 14:00:00', '2025-10-10 14:00:00'),
( 254, 8, NULL, 'highlight', 'Creating Data Models in Power BI + Using DAX for Data Analysis + Building Effective Dashboards', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612192/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/3/highlight_topic3_0d07a77f-a834-410e-b341-7738419b971f.mp4', 196.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612192/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/3/highlight_topic3_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t3', '2025-10-10 15:00:00', '2025-10-10 15:00:00'),
( 255, 8, NULL, 'highlight', 'Automating Data Refresh and Reporting + The Five-Step Process for Reporting + Practical Project Implementation + Introduction to Power BI Data Modeling', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612195/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/4/highlight_topic4_0d07a77f-a834-410e-b341-7738419b971f.mp4', 196.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612195/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/4/highlight_topic4_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t4', '2025-10-10 16:00:00', '2025-10-10 16:00:00'),
( 256, 8, NULL, 'highlight', 'Connecting Data to Power BI + Understanding Data Files and Their Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612225/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/5/highlight_topic5_0d07a77f-a834-410e-b341-7738419b971f.mp4', 126.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612225/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/5/highlight_topic5_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t5', '2025-10-10 17:00:00', '2025-10-10 17:00:00'),
( 257, 8, NULL, 'highlight', 'Using AI for Data Analysis + Creating Analytical Dashboards + Data Transformation Techniques', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612267/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/6/highlight_topic6_0d07a77f-a834-410e-b341-7738419b971f.mp4', 198.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612267/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/6/highlight_topic6_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t6', '2025-10-10 18:00:00', '2025-10-10 18:00:00'),
( 258, 8, NULL, 'highlight', 'Building Relationships in Data Models + Understanding Data Model Normalization + Introduction to Power BI Reporting Features', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612264/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/7/highlight_topic7_0d07a77f-a834-410e-b341-7738419b971f.mp4', 134.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612264/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/7/highlight_topic7_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t7', '2025-10-10 19:00:00', '2025-10-10 19:00:00'),
( 259, 8, NULL, 'highlight', 'Creating Effective Dashboards', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612311/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/8/highlight_topic8_0d07a77f-a834-410e-b341-7738419b971f.mp4', 194.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612311/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/8/highlight_topic8_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t8', '2025-10-10 20:00:00', '2025-10-10 20:00:00'),
( 260, 8, NULL, 'highlight', 'Key Performance Indicators (KPIs) in Power BI + Using DAX for Calculating KPIs', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612337/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/9/highlight_topic9_0d07a77f-a834-410e-b341-7738419b971f.mp4', 199.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612337/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/9/highlight_topic9_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t9', '2025-10-10 21:00:00', '2025-10-10 21:00:00'),
( 261, 8, NULL, 'highlight', 'Using AI to Assist with DAX + Understanding DAX Syntax + Creating Revenue Measures + Building Effective Dashboards', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612350/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/10/highlight_topic10_0d07a77f-a834-410e-b341-7738419b971f.mp4', 156.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612350/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/10/highlight_topic10_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t10', '2025-10-10 22:00:00', '2025-10-10 22:00:00'),
( 262, 8, NULL, 'highlight', 'Visualizing Data with Charts', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612387/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/11/highlight_topic11_0d07a77f-a834-410e-b341-7738419b971f.mp4', 195.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612387/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/11/highlight_topic11_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t11', '2025-10-10 23:00:00', '2025-10-10 23:00:00'),
( 263, 8, NULL, 'highlight', 'Visualizing Data with Charts', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612408/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/12/highlight_topic12_0d07a77f-a834-410e-b341-7738419b971f.mp4', 195.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612408/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/12/highlight_topic12_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t12', '2025-10-11 00:00:00', '2025-10-11 00:00:00'),
( 264, 8, NULL, 'highlight', 'Finalizing the Dashboard', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612427/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/13/highlight_topic13_0d07a77f-a834-410e-b341-7738419b971f.mp4', 161.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612427/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/13/highlight_topic13_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t13', '2025-10-11 01:00:00', '2025-10-11 01:00:00'),
( 265, 8, NULL, 'highlight', 'Using Slicers for Data Filtering + Publishing and Sharing Reports', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612478/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/14/highlight_topic14_0d07a77f-a834-410e-b341-7738419b971f.mp4', 195.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612478/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/14/highlight_topic14_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t14', '2025-10-11 02:00:00', '2025-10-11 02:00:00'),
( 266, 8, NULL, 'highlight', 'Refreshing Data in Power BI + Conclusion and Future Learning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612488/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/15/highlight_topic15_0d07a77f-a834-410e-b341-7738419b971f.mp4', 181.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612488/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/15/highlight_topic15_0d07a77f-a834-410e-b341-7738419b971f.jpg', NULL, NULL, 'highlight-0d07a77f-t15', '2025-10-11 03:00:00', '2025-10-11 03:00:00'),
( 267, 8, NULL, 'highlight', 'Introduction to Promotion Strategies + Discount Techniques Overview', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613254/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/1/highlight_topic1_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4', 122.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613254/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/1/highlight_topic1_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg', NULL, NULL, 'highlight-8266f076-t1', '2025-10-11 04:00:00', '2025-10-11 04:00:00'),
( 268, 8, NULL, 'highlight', 'Using Psychological Pricing + Time-Based Discounts + Lucky Draw Promotions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613259/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/2/highlight_topic2_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4', 117.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613259/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/2/highlight_topic2_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg', NULL, NULL, 'highlight-8266f076-t2', '2025-10-11 05:00:00', '2025-10-11 05:00:00'),
( 269, 8, NULL, 'highlight', 'Customer-Driven Pricing + Happy Hour Promotions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613326/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/3/highlight_topic3_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4', 117.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613326/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/3/highlight_topic3_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg', NULL, NULL, 'highlight-8266f076-t3', '2025-10-11 06:00:00', '2025-10-11 06:00:00'),
( 270, 8, NULL, 'highlight', 'Flash Sales + Loyalty Programs', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613349/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/4/highlight_topic4_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4', 126.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613349/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/4/highlight_topic4_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg', NULL, NULL, 'highlight-8266f076-t4', '2025-10-11 07:00:00', '2025-10-11 07:00:00'),
( 271, 8, NULL, 'highlight', 'Overview of Promotion Strategies + Discount Techniques + Sales Boosting Tactics', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613389/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/5/highlight_topic5_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4', 116.1, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613389/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/5/highlight_topic5_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg', NULL, NULL, 'highlight-8266f076-t5', '2025-10-11 08:00:00', '2025-10-11 08:00:00'),
( 272, 8, NULL, 'highlight', 'Effective Upselling and Cross-Selling + Marketing Campaign Planning + Revenue Growth Tips + Bundling Products', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613413/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/6/highlight_topic6_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4', 115.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613413/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/6/highlight_topic6_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg', NULL, NULL, 'highlight-8266f076-t6', '2025-10-11 09:00:00', '2025-10-11 09:00:00'),
( 273, 8, NULL, 'highlight', 'Promotional Partnerships + Promotional Strategies for New Products + Creating Value Through Promotions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613431/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/7/highlight_topic7_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4', 194.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613431/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/7/highlight_topic7_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg', NULL, NULL, 'highlight-8266f076-t7', '2025-10-11 10:00:00', '2025-10-11 10:00:00'),
( 274, 8, NULL, 'highlight', 'Overcoming Fear of Starting + Introduction to Digital Marketing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614462/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/1/highlight_topic1_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 120.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614462/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/1/highlight_topic1_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t1', '2025-10-11 11:00:00', '2025-10-11 11:00:00'),
( 275, 8, NULL, 'highlight', 'Differences Between Digital and Traditional Marketing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614372/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/2/highlight_topic2_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 122.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614372/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/2/highlight_topic2_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t2', '2025-10-11 12:00:00', '2025-10-11 12:00:00'),
( 276, 8, NULL, 'highlight', 'The Role of Digital Marketing in Business + Types of Digital Marketing Strategies', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614640/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/3/highlight_topic3_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 199.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614640/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/3/highlight_topic3_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t3', '2025-10-11 13:00:00', '2025-10-11 13:00:00'),
( 277, 8, NULL, 'highlight', 'Introduction to Digital Marketing Fundamentals + Understanding Traffic Management + Paid Advertising in Digital Marketing + On Media and Owned Media', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614679/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/4/highlight_topic4_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 198.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614679/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/4/highlight_topic4_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t4', '2025-10-11 14:00:00', '2025-10-11 14:00:00'),
( 278, 8, NULL, 'highlight', 'Understanding Customer Journey Stages + The Role of Multi-Channel Marketing + Customer Experience and Emotional Connection + Mapping Customer Actions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614827/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/6/highlight_topic6_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 125.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614827/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/6/highlight_topic6_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t6', '2025-10-11 15:00:00', '2025-10-11 15:00:00'),
( 279, 8, NULL, 'highlight', 'Creating Engaging Content + Utilizing Social Media for Marketing + Post-Purchase Customer Engagement', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614970/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/7/highlight_topic7_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 153.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614970/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/7/highlight_topic7_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t7', '2025-10-11 16:00:00', '2025-10-11 16:00:00'),
( 280, 8, NULL, 'highlight', 'Building a Community Around Your Brand + Final Thoughts on Digital Marketing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615138/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/8/highlight_topic8_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 192.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615138/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/8/highlight_topic8_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t8', '2025-10-11 17:00:00', '2025-10-11 17:00:00'),
( 281, 8, NULL, 'highlight', 'Content Marketing Essentials + Choosing the Right Content Format', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615198/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/9/highlight_topic9_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 197.6, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615198/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/9/highlight_topic9_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t9', '2025-10-11 18:00:00', '2025-10-11 18:00:00'),
( 282, 8, NULL, 'highlight', 'Introduction to Digital Marketing + Choosing the Right Marketing Channels', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615285/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/10/highlight_topic10_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 131.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615285/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/10/highlight_topic10_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t10', '2025-10-11 19:00:00', '2025-10-11 19:00:00'),
( 283, 8, NULL, 'highlight', 'Understanding Customer Behavior + Measuring Marketing Effectiveness', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615430/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/11/highlight_topic11_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 195.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615430/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/11/highlight_topic11_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t11', '2025-10-11 20:00:00', '2025-10-11 20:00:00'),
( 284, 8, NULL, 'highlight', 'Setting Clear Marketing Goals + Understanding the Customer Journey', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615624/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/13/highlight_topic13_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 125.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615624/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/13/highlight_topic13_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t13', '2025-10-11 21:00:00', '2025-10-11 21:00:00'),
( 285, 8, NULL, 'highlight', 'Content Types and Delivery Methods + Continuous Improvement in Marketing Strategies + Measuring Marketing Effectiveness', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615785/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/14/highlight_topic14_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4', 186.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615785/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/14/highlight_topic14_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg', NULL, NULL, 'highlight-a282c57b-t14', '2025-10-11 22:00:00', '2025-10-11 22:00:00'),
( 286, 8, NULL, 'highlight', 'Introduction to Copywriting + Three Rules of Effective Copy + Visualizing Copy', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616656/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/1/highlight_topic1_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 115.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616656/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/1/highlight_topic1_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t1', '2025-10-11 23:00:00', '2025-10-11 23:00:00'),
( 287, 8, NULL, 'highlight', 'Falsifiability in Copy + Uniqueness in Copywriting', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616660/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/2/highlight_topic2_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 117.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616660/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/2/highlight_topic2_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t2', '2025-10-12 00:00:00', '2025-10-12 00:00:00'),
( 288, 8, NULL, 'highlight', 'The Importance of Learning Copywriting + Crafting Memorable Copy', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616717/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/3/highlight_topic3_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 114.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616717/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/3/highlight_topic3_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t3', '2025-10-12 01:00:00', '2025-10-12 01:00:00'),
( 289, 8, NULL, 'highlight', 'The Process of Writing Copy', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616728/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/4/highlight_topic4_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 116.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616728/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/4/highlight_topic4_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t4', '2025-10-12 02:00:00', '2025-10-12 02:00:00'),
( 290, 8, NULL, 'highlight', 'The Process of Writing an Ad + Understanding Conflict in Copywriting + The Interaction of Writing and Design', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616775/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/5/highlight_topic5_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 119.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616775/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/5/highlight_topic5_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t5', '2025-10-12 03:00:00', '2025-10-12 03:00:00'),
( 291, 8, NULL, 'highlight', 'Using Facts in Copywriting', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616793/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/6/highlight_topic6_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 114.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616793/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/6/highlight_topic6_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t6', '2025-10-12 04:00:00', '2025-10-12 04:00:00'),
( 292, 8, NULL, 'highlight', 'Engagement in Newsletters + Writing with Simplicity', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616847/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/7/highlight_topic7_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 116.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616847/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/7/highlight_topic7_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t7', '2025-10-12 05:00:00', '2025-10-12 05:00:00'),
( 293, 8, NULL, 'highlight', 'The Importance of Structure in Writing + The Impact of AI on Writing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616849/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/8/highlight_topic8_5b1401e2-bc34-4054-8336-63480979cb0e.mp4', 189.4, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616849/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/8/highlight_topic8_5b1401e2-bc34-4054-8336-63480979cb0e.jpg', NULL, NULL, 'highlight-5b1401e2-t8', '2025-10-12 06:00:00', '2025-10-12 06:00:00'),
( 294, 8, NULL, 'highlight', 'Introduction to the Ultimate SEO Checklist + Tracking SEO Performance + Key SEO KPIs to Track', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617775/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/1/highlight_topic1_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 188.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617775/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/1/highlight_topic1_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t1', '2025-10-12 07:00:00', '2025-10-12 07:00:00'),
( 295, 8, NULL, 'highlight', 'Running a Screaming Frog Crawl + Crawlability and Indexability of Your Website + Mobile Friendliness of Your Website + Website Loading Speed + SSL Certificate Verification', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617770/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/2/highlight_topic2_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 146.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617770/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/2/highlight_topic2_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t2', '2025-10-12 08:00:00', '2025-10-12 08:00:00'),
( 296, 8, NULL, 'highlight', 'Modern Website Design + Impact of Interstitial Pop-ups on SEO', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617803/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/3/highlight_topic3_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 157.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617803/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/3/highlight_topic3_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t3', '2025-10-12 09:00:00', '2025-10-12 09:00:00'),
( 297, 8, NULL, 'highlight', 'Ad Placement and User Experience + Trust Pages on Your Website + Author Bios and Expertise', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617813/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/4/highlight_topic4_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 187.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617813/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/4/highlight_topic4_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t4', '2025-10-12 10:00:00', '2025-10-12 10:00:00'),
( 298, 8, NULL, 'highlight', 'Managing Non-Indexable Pages + Website Bloat and Pruning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617842/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/5/highlight_topic5_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 190.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617842/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/5/highlight_topic5_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t5', '2025-10-12 11:00:00', '2025-10-12 11:00:00'),
( 299, 8, NULL, 'highlight', 'Thin Content Issues + Outdated Content Management + Engagement Rate Analysis', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617847/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/6/highlight_topic6_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 166.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617847/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/6/highlight_topic6_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t6', '2025-10-12 12:00:00', '2025-10-12 12:00:00'),
( 300, 8, NULL, 'highlight', 'Title and H1 Tag Optimization + Spelling and Grammar Checks + Backlink Analysis for Traffic', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617884/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/7/highlight_topic7_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 189.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617884/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/7/highlight_topic7_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t7', '2025-10-12 13:00:00', '2025-10-12 13:00:00'),
( 301, 8, NULL, 'highlight', 'Redirect Management', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617898/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/8/highlight_topic8_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 193.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617898/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/8/highlight_topic8_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t8', '2025-10-12 14:00:00', '2025-10-12 14:00:00'),
( 302, 8, NULL, 'highlight', 'Duplicate Content Issues + Broken Links Management + AI Content Considerations', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617916/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/9/highlight_topic9_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 166.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617916/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/9/highlight_topic9_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t9', '2025-10-12 15:00:00', '2025-10-12 15:00:00'),
( 303, 8, NULL, 'highlight', 'H1 Tag and Heading Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617928/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/10/highlight_topic10_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 141.2, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617928/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/10/highlight_topic10_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t10', '2025-10-12 16:00:00', '2025-10-12 16:00:00'),
( 304, 8, NULL, 'highlight', 'Keyword Placement in URLs and Meta Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617944/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/11/highlight_topic11_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 136.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617944/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/11/highlight_topic11_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t11', '2025-10-12 17:00:00', '2025-10-12 17:00:00'),
( 305, 8, NULL, 'highlight', 'Content Originality and Quality', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617967/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/12/highlight_topic12_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 189.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617967/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/12/highlight_topic12_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t12', '2025-10-12 18:00:00', '2025-10-12 18:00:00'),
( 306, 8, NULL, 'highlight', 'Satisfying Search Intent', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617970/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/13/highlight_topic13_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 128.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617970/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/13/highlight_topic13_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t13', '2025-10-12 19:00:00', '2025-10-12 19:00:00'),
( 307, 8, NULL, 'highlight', 'Differentiating Content Strategy + Introduction to SEO Fundamentals + Effort Lever in Content Creation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618003/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/14/highlight_topic14_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 186.8, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618003/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/14/highlight_topic14_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t14', '2025-10-12 20:00:00', '2025-10-12 20:00:00'),
( 308, 8, NULL, 'highlight', 'The Uniqueness and Data Lever + Updating Existing Content', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618009/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/15/highlight_topic15_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 189.0, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618009/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/15/highlight_topic15_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t15', '2025-10-12 21:00:00', '2025-10-12 21:00:00'),
( 309, 8, NULL, 'highlight', 'Readability and User Experience + Visual Assets in Content', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618043/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/16/highlight_topic16_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 189.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618043/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/16/highlight_topic16_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t16', '2025-10-12 22:00:00', '2025-10-12 22:00:00'),
( 310, 8, NULL, 'highlight', 'Creating Helpful Content + Originality in Content Creation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618048/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/17/highlight_topic17_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 187.7, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618048/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/17/highlight_topic17_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t17', '2025-10-12 23:00:00', '2025-10-12 23:00:00'),
( 311, 8, NULL, 'highlight', 'Accuracy and Trustworthiness + Demonstrating Expertise', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618093/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/18/highlight_topic18_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 195.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618093/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/18/highlight_topic18_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t18', '2025-10-13 00:00:00', '2025-10-13 00:00:00'),
( 312, 8, NULL, 'highlight', 'Demonstrating Expertise and Credibility', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618089/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/19/highlight_topic19_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 188.3, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618089/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/19/highlight_topic19_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t19', '2025-10-13 01:00:00', '2025-10-13 01:00:00'),
( 313, 8, NULL, 'highlight', 'Schema Markup and Technical SEO', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618125/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/20/highlight_topic20_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 189.9, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618125/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/20/highlight_topic20_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t20', '2025-10-13 02:00:00', '2025-10-13 02:00:00'),
( 314, 8, NULL, 'highlight', 'Internal Linking Strategies', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618137/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/21/highlight_topic21_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4', 193.5, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618137/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/21/highlight_topic21_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg', NULL, NULL, 'highlight-a3ca9391-t21', '2025-10-13 03:00:00', '2025-10-13 03:00:00');


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
-- NOTIFICATIONS  (chỉ dùng event_type/source_type trong ENUM media_service)
-- ENUM event_type:  feed.comment.created | feed.comment.reply
--                   video.upload.completed | video.job.completed | video.job.failed
--                   image.upload.completed
-- ENUM source_type: feed_comment | video | video_job | image
-- (video.job.progress KHÔNG insert DB - service skip)
-- ============================================================================
INSERT INTO notifications (id, user_id, event_type, title, message, payload, is_read, source_type, source_id, created_at, updated_at) VALUES
-- VIDEO UPLOAD COMPLETED (teacher nhận khi long-form upload xong)
( 1,  2, 'video.upload.completed', 'Video uploaded',   'Video "Participles in TOEIC Grammar" đã upload xong.',           '{"video_id":1}',                                   1, 'video',        1,  '2025-09-21 09:00:00','2025-09-21 09:05:00'),
( 2,  2, 'video.upload.completed', 'Video uploaded',   'Video "English Conversation Lesson 1" đã upload xong.',         '{"video_id":2}',                                   1, 'video',        2,  '2025-09-22 09:00:00','2025-09-22 09:05:00'),
( 3,  4, 'video.upload.completed', 'Video uploaded',   'Video "JavaScript Toàn Tập - Intro" đã upload xong.',           '{"video_id":5}',                                   1, 'video',        5,  '2025-09-23 09:00:00','2025-09-23 09:05:00'),
( 4,  5, 'video.upload.completed', 'Video uploaded',   'Video "System Design Foundations" đã upload xong.',             '{"video_id":4}',                                   0, 'video',        4,  '2025-09-24 09:00:00','2025-09-24 09:00:00'),
( 5,  6, 'video.upload.completed', 'Video uploaded',   'Video "Python Cơ Bản - Mở đầu" đã upload xong.',                '{"video_id":10}',                                  0, 'video',       10,  '2025-09-25 09:00:00','2025-09-25 09:00:00'),
( 6,  7, 'video.upload.completed', 'Video uploaded',   'Video "Lightroom 2023 - Workflow" đã upload xong.',             '{"video_id":12}',                                  1, 'video',       12,  '2025-09-26 09:00:00','2025-09-26 09:05:00'),
( 7,  8, 'video.upload.completed', 'Video uploaded',   'Video "Power BI - Beyond Drag & Drop" đã upload xong.',         '{"video_id":14}',                                  0, 'video',       14,  '2025-09-27 09:00:00','2025-09-27 09:00:00'),
( 8,  9, 'video.upload.completed', 'Video uploaded',   'Video "Học CapCut Trong 1 Giờ" đã upload xong.',                '{"video_id":20}',                                  1, 'video',       20,  '2025-09-28 09:00:00','2025-09-28 09:05:00'),
( 9, 10, 'video.upload.completed', 'Video uploaded',   'Video "Music Theory 101" đã upload xong.',                      '{"video_id":22}',                                  0, 'video',       22,  '2025-09-29 09:00:00','2025-09-29 09:00:00'),
(10,  3, 'video.upload.completed', 'Video uploaded',   'Video "Chinese for Beginners" đã upload xong.',                 '{"video_id":23}',                                  1, 'video',       23,  '2025-09-30 09:00:00','2025-09-30 09:05:00'),

-- VIDEO JOB COMPLETED / FAILED (kết quả render mascot + transcript)
(11,  2, 'video.job.completed',    'Render hoàn tất',  'Mascot render cho video TOEIC #1 đã xong.',                     '{"video_id":1,"job_id":"toeic-render-001"}',       1, 'video_job',    1,  '2025-09-21 10:00:00','2025-09-21 10:00:00'),
(12,  4, 'video.job.completed',    'Render hoàn tất',  'Mascot render cho video JS #5 đã xong.',                        '{"video_id":5,"job_id":"js-render-005"}',          1, 'video_job',    5,  '2025-09-23 10:00:00','2025-09-23 10:00:00'),
(13,  5, 'video.job.completed',    'Render hoàn tất',  'Mascot render cho System Design video #4 đã xong.',             '{"video_id":4,"job_id":"sysd-render-004"}',        0, 'video_job',    4,  '2025-09-24 10:00:00','2025-09-24 10:00:00'),
(14,  6, 'video.job.failed',       'Render thất bại',  'Job mascot render cho Python video #9 lỗi, vui lòng thử lại.',  '{"video_id":9,"job_id":"py-render-009","reason":"Worker timeout"}',          0, 'video_job',    9,  '2025-09-25 12:00:00','2025-09-25 12:00:00'),
(15,  7, 'video.job.completed',    'Render hoàn tất',  'Mascot render cho Lightroom video #12 đã xong.',                '{"video_id":12,"job_id":"lr-render-012"}',         1, 'video_job',   12,  '2025-09-26 10:00:00','2025-09-26 10:00:00'),
(16,  8, 'video.job.failed',       'Render thất bại',  'Job mascot render cho Power BI video #14 lỗi do GPU OOM.',      '{"video_id":14,"job_id":"pbi-render-014","reason":"GPU OOM"}',               0, 'video_job',   14,  '2025-09-27 12:00:00','2025-09-27 12:00:00'),
(17,  9, 'video.job.completed',    'Render hoàn tất',  'Mascot render cho CapCut video #20 đã xong.',                   '{"video_id":20,"job_id":"cap-render-020"}',        1, 'video_job',   20,  '2025-09-28 10:00:00','2025-09-28 10:00:00'),

-- IMAGE UPLOAD COMPLETED (teacher upload mascot ảnh nhân vật)
(18,  2, 'image.upload.completed', 'Mascot đã upload', 'Mascot "Owl Teacher" đã upload xong và sẵn sàng để dùng.',      '{"image_id":1}',                                   1, 'image',        1,  '2025-09-20 10:05:00','2025-09-20 10:05:00'),
(19,  4, 'image.upload.completed', 'Mascot đã upload', 'Mascot "Web Robot" đã upload xong.',                            '{"image_id":2}',                                   1, 'image',        2,  '2025-09-21 10:05:00','2025-09-21 10:05:00'),
(20,  5, 'image.upload.completed', 'Mascot đã upload', 'Mascot "Server Cat" đã upload xong.',                           '{"image_id":3}',                                   1, 'image',        3,  '2025-09-22 10:05:00','2025-09-22 10:05:00'),
(21,  6, 'image.upload.completed', 'Mascot đã upload', 'Mascot "Python Snake" đã upload xong.',                         '{"image_id":4}',                                   0, 'image',        4,  '2025-09-23 10:05:00','2025-09-23 10:05:00'),
(22,  7, 'image.upload.completed', 'Mascot đã upload', 'Mascot "Designer Fox" đã upload xong.',                         '{"image_id":5}',                                   1, 'image',        5,  '2025-09-24 10:05:00','2025-09-24 10:05:00'),

-- FEED COMMENT CREATED (chủ highlight nhận khi có user comment top-level)
(23,  2, 'feed.comment.created',   'Bình luận mới',    'Giang Lê vừa bình luận trên highlight TOEIC của bạn.',          '{"feed_id":5,"comment_id":1,"user_id":17}',        1, 'feed_comment', 1,  '2025-10-05 12:01:00','2025-10-05 12:01:00'),
(24,  2, 'feed.comment.created',   'Bình luận mới',    'Bảo Nguyễn vừa bình luận trên highlight TOEIC của bạn.',        '{"feed_id":16,"comment_id":2,"user_id":12}',       1, 'feed_comment', 2,  '2025-10-05 14:01:00','2025-10-05 14:01:00'),
(25,  2, 'feed.comment.created',   'Bình luận mới',    'Long Đoàn vừa bình luận trên highlight TOEIC của bạn.',         '{"feed_id":18,"comment_id":3,"user_id":22}',       0, 'feed_comment', 3,  '2025-10-05 16:01:00','2025-10-05 16:01:00'),
(26,  4, 'feed.comment.created',   'Bình luận mới',    'Chi Phan vừa bình luận trên highlight HTML/JS của bạn.',        '{"feed_id":20,"comment_id":5,"user_id":13}',       0, 'feed_comment', 5,  '2025-10-05 20:01:00','2025-10-05 20:01:00'),
(27,  2, 'feed.comment.created',   'Bình luận mới',    'Emily Hoàng vừa bình luận trên highlight English Conversation.', '{"feed_id":28,"comment_id":7,"user_id":15}',       1, 'feed_comment', 7,  '2025-10-06 00:01:00','2025-10-06 00:01:00'),

-- FEED COMMENT REPLY (chủ comment cha nhận khi có người reply)
(28, 22, 'feed.comment.reply',     'Có người trả lời', 'Alex Tran vừa trả lời bình luận của bạn trên highlight TOEIC.', '{"feed_id":18,"reply_id":4,"parent_id":3,"user_id":11}',  1, 'feed_comment', 4,  '2025-10-05 18:31:00','2025-10-05 18:31:00'),
(29, 18, 'feed.comment.reply',     'Có người trả lời', 'Emily Hoàng vừa trả lời bình luận của bạn trên highlight TOEIC.','{"feed_id":30,"reply_id":10,"parent_id":9,"user_id":15}', 0, 'feed_comment',10,  '2025-10-06 06:31:00','2025-10-06 06:31:00'),
(30, 16, 'feed.comment.reply',     'Có người trả lời', 'Ngân Phạm vừa trả lời bình luận của bạn trên highlight TOEIC.', '{"feed_id":35,"reply_id":12,"parent_id":11,"user_id":24}',1, 'feed_comment',12,  '2025-10-06 10:31:00','2025-10-06 10:31:00');

-- ============================================================================
-- REPORTS  (admin moderation - target_type in [teacher, course, lesson])
-- ============================================================================
INSERT INTO reports (id, target_type, target_id, reason, status, reporter_id, approver_id, review_note, reviewed_at, created_at, updated_at) VALUES
(1, 'course', 11, 'Nội dung khoá ChatGPT sử dụng prompt không an toàn, ví dụ jailbreak có khả năng vi phạm chính sách.', 'approved', 17, 1, 'Đã ẩn khoá học. Yêu cầu lecturer chỉnh sửa nội dung trước khi tái duyệt.', '2025-11-05 09:30:00', '2025-11-04 08:30:00','2025-11-05 09:30:00'),
(2, 'course',  5, 'Khoá học JavaScript có 1 đoạn nói nhanh khó nghe, có sub tiếng Anh nhưng không có VN.',                'rejected', 16, 1, 'Không phạm chính sách - chỉ là feedback chất lượng. Đã chuyển feedback cho lecturer.','2025-10-28 09:00:00','2025-10-27 14:00:00','2025-10-28 09:00:00'),
(3, 'lesson', 11, 'Nội dung khoá ChatGPT bài 1 - giá hơi cao so với thời lượng.',                                          'pending',  18, NULL, NULL, NULL, '2025-11-05 08:00:00','2025-11-05 08:00:00'),
(4, 'teacher', 8, 'Mong lecturer cải thiện chất lượng audio bài SEO, có nhiễu nền.',                                       'pending',  24, NULL, NULL, NULL, '2025-11-06 10:00:00','2025-11-06 10:00:00'),
(5, 'course', 19, 'Khoá Power BI cần thêm dataset thực tế để tải về làm bài tập.',                                          'pending',  21, NULL, NULL, NULL, '2025-11-07 09:00:00','2025-11-07 09:00:00');
-- HIGHLIGHT_FEED (newsfeed entries; one per highlight video)
-- ============================================================================
INSERT INTO highlight_feed (id, video_id, course_id, title, caption, hashtags, status, created_at, updated_at) VALUES
(   1, 32, 1, 'Introduction to Participles + Types of Participles + Present Participle Usage', 'The speaker introduces the concept of participles, explaining their importance in grammar and how they are commonly encountered in English.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(   2, 33, 1, 'Active vs. Passive Meaning + Past Participle Usage + Examples of Participles in Context', 'Clarification of the difference between active and passive meanings when using present and past participles.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(   3, 34, 1, 'Practice Exercises + Common Mistakes with Participles + Conclusion and Recap', 'Engagement with practice exercises to apply the knowledge of participles, encouraging active learning and self-assessment.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(   4, 35, 1, 'Introduction to Two-Verb Structures + First Usage of Two-Verb + Second Usage of Two-Verb', 'The speaker introduces the concept of Two-Verb structures, explaining their roles in sentences and how they function as either main verbs or complements.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(   5, 36, 1, 'Third Usage of Two-Verb + Fourth Usage of Two-Verb + Common Structures with Two-Verb', 'The third usage of Two-Verb is introduced, where it follows a subject and indicates purpose, often synonymous with ''in order to''.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(   6, 37, 1, 'Usage of Verb In + Common Verbs with Verb In', 'The various usages of Verb In are explored, including its position in sentences and how it interacts with other verbs.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(   7, 38, 1, 'Introduction to Base Form Verbs + Explanation of ''Can'' and ''May'' + Difference Between ''Have to'' and ''Must''', 'The speaker introduces the concept of base form verbs, explaining their position and function in sentences.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(   8, 39, 1, 'Understanding ''Should'' and ''Ought to'' + Using ''Let'' and ''Make''', 'An explanation of ''should'' and ''ought to'', focusing on their use in giving advice and recommendations.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(   9, 40, 1, 'Explaining ''Help'' and Its Structure + Introduction to ''Have'' in Context + Using ''Please'' in Requests', 'The speaker elaborates on the verb ''help'' and its structure when used with other verbs.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  10, 41, 1, 'Conclusion and Practice + Understanding ''In Order To'' + Review of Modal Verbs and Their Applications', 'The speaker concludes the lesson by encouraging practice with the discussed structures and providing tips for effective learning.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  11, 42, 1, 'Introduction to English Tenses + Present Simple Tense Overview', 'The speaker introduces the topic of English tenses, focusing on the most commonly used ones in TOEIC exams.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  12, 43, 1, 'Forming Questions in Present Simple', 'How to form questions in the Present Simple tense, including examples.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
(  13, 44, 1, 'Usage of Present Simple Tense + Common Time Expressions for Present Simple', 'Situations where the Present Simple tense is used, such as describing habits and general truths.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 21:00:00', '2025-10-01 21:00:00'),
(  14, 45, 1, 'Introduction to Past Simple Tense + Forming Questions in Past Simple', 'Overview of the Past Simple tense, including its structure and rules for regular and irregular verbs.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 22:00:00', '2025-10-01 22:00:00'),
(  15, 46, 1, 'Usage of Past Simple Tense + Common Time Expressions for Past Simple', 'Situations where the Past Simple tense is used, including actions completed at a specific time in the past.', '["TOEIC","Grammar","English"]', 'active', '2025-10-01 23:00:00', '2025-10-01 23:00:00'),
(  16, 47, 1, 'Introduction to Future Simple Tense + Introduction to Tenses in English + Future Simple Tense Structure', 'Overview of the Future Simple tense, including its structure and common usage.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 00:00:00', '2025-10-02 00:00:00'),
(  17, 48, 1, 'Examples of Future Simple Tense', 'The speaker provides examples of sentences using the future simple tense, illustrating its application in everyday language.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 01:00:00', '2025-10-02 01:00:00'),
(  18, 49, 1, 'Usage of Future Simple Tense', 'Situations where the Future Simple tense is used, including making promises and decisions.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 02:00:00', '2025-10-02 02:00:00'),
(  19, 50, 1, 'Common Time Expressions for Future Simple + Present Continuous and Past Continuous Tenses', 'Key time expressions that indicate the use of the Future Simple tense.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 03:00:00', '2025-10-02 03:00:00'),
(  20, 51, 1, 'Forming Questions in Continuous Tenses + Usage of Continuous Tenses + Present Continuous for Future Plans', 'How to form questions in Present Continuous and Past Continuous tenses.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 04:00:00', '2025-10-02 04:00:00'),
(  21, 52, 1, 'Past Continuous Tense Overview + Examples of Past Continuous Tense + Past Continuous Tense', 'Introduction to the past continuous tense, including its structure and usage.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 05:00:00', '2025-10-02 05:00:00'),
(  22, 53, 1, 'Examples of Past Continuous Tense + Present Perfect Tense + Present Perfect Tense Usage', 'The speaker shares examples of the past continuous tense, highlighting its application in real-life situations.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 06:00:00', '2025-10-02 06:00:00'),
(  23, 54, 1, 'Hiện Tại Hoàn Thành + Ví dụ về Hiện Tại Hoàn Thành + Cách Dùng Hiện Tại Hoàn Thành Tiếp Diễn + Công Thức Quá Khứ Hoàn Thành', 'Giới thiệu về thì hiện tại hoàn thành, công thức và cách sử dụng của nó.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 07:00:00', '2025-10-02 07:00:00'),
(  24, 55, 1, 'Ví dụ về Quá Khứ Hoàn Thành + Examples of Past Perfect Tense + Quá Khứ Hoàn Thành Tiếp Diễn', 'Cung cấp ví dụ minh họa cho thì quá khứ hoàn thành và cách diễn đạt.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 08:00:00', '2025-10-02 08:00:00'),
(  25, 56, 1, 'Examples of Past Perfect Continuous Tense + Thực Hành với Các Thì + Câu Hỏi Thực Hành về Hiện Tại và Quá Khứ', 'The speaker provides examples to illustrate the use of the past perfect continuous tense in various contexts.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
(  26, 57, 1, 'Câu Hỏi Thực Hành Khó + Tổng Kết và Lời Khuyên', 'Giới thiệu các câu hỏi thực hành khó hơn để kiểm tra kiến thức về các thì.', '["TOEIC","Grammar","English"]', 'active', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
(  27, 58, 2, 'Understanding the Phrase ''Nice to Meet You''', 'This topic covers the common misunderstanding of when to use the phrase ''nice to meet you'' in English, emphasizing the importance of exchanging names before using the phrase.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
(  28, 59, 2, 'Correct Usage of ''Nice to Meet You''', 'An explanation of the correct context for using ''nice to meet you'' and the distinction between first-time meetings and subsequent encounters.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
(  29, 60, 2, 'Alternative Expressions for Asking About Toilets', 'This section introduces alternative phrases to use instead of ''toilet,'' such as ''restroom,'' ''washroom,'' and ''bathroom,'' and explains their appropriate contexts.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
(  30, 61, 2, 'Using ''I Like'' and ''I Like To''', 'An explanation of how to use ''I like'' and ''I like to'' with examples, focusing on the structure and common activities associated with these phrases.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
(  31, 62, 2, 'Expressing Dislikes with ''I Don''t Like''', 'This topic covers how to express dislikes using ''I don''t like'' and ''I don''t like to,'' along with examples of common dislikes.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
(  32, 63, 2, 'Understanding Western Names', 'An overview of the structure of Western names, including given names, family names, and middle names, and their significance.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 16:00:00', '2025-10-02 16:00:00'),
(  33, 64, 2, 'Common Pet Names in English + Expressions for Leaving a Conversation', 'A discussion on common pet names used in English, including their meanings and contexts for use.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 17:00:00', '2025-10-02 17:00:00'),
(  34, 65, 2, 'Expressing Head Injuries or Sickness', 'An explanation of how to express various head-related issues in English, including headaches and concussions.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 18:00:00', '2025-10-02 18:00:00'),
(  35, 66, 2, 'Asking for Permission', 'A guide on how to ask for permission in English using phrases like ''can I,'' ''could I,'' and ''may I,'' along with examples.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 19:00:00', '2025-10-02 19:00:00'),
(  36, 67, 2, 'Expressing Emotions in English', 'This topic covers how to express basic emotions in English, including happy, sad, angry, and scared, with examples.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 20:00:00', '2025-10-02 20:00:00'),
(  37, 68, 2, 'Asking for Directions', 'An introduction to common phrases used when asking for directions, including polite ways to request help.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 21:00:00', '2025-10-02 21:00:00'),
(  38, 69, 2, 'Words of Encouragement', 'A discussion on common expressions of encouragement in English, including ''good luck'' and ''you can do it.''', '["English","Conversation","Speaking"]', 'active', '2025-10-02 22:00:00', '2025-10-02 22:00:00'),
(  39, 70, 2, 'Expressing Language Proficiency', 'This section teaches how to express one''s proficiency in another language using various phrases.', '["English","Conversation","Speaking"]', 'active', '2025-10-02 23:00:00', '2025-10-02 23:00:00'),
(  40, 71, 2, 'Apologizing in English', 'An overview of common expressions used to apologize in English, including formal and informal options.', '["English","Conversation","Speaking"]', 'active', '2025-10-03 00:00:00', '2025-10-03 00:00:00'),
(  41, 72, 2, 'Pointing Out Embarrassing Situations', 'A guide on how to politely inform someone about an embarrassing situation, such as having something on their face.', '["English","Conversation","Speaking"]', 'active', '2025-10-03 01:00:00', '2025-10-03 01:00:00'),
(  42, 73, 2, 'Discussing the Weather', 'An introduction to common questions and answers about the weather, including various descriptive terms.', '["English","Conversation","Speaking"]', 'active', '2025-10-03 02:00:00', '2025-10-03 02:00:00'),
(  43, 74, 2, 'Asking for Repetition', 'A guide on expressions to use when asking someone to repeat what they said, including polite and informal options.', '["English","Conversation","Speaking"]', 'active', '2025-10-03 03:00:00', '2025-10-03 03:00:00'),
(  44, 75, 2, 'Inquiring About Weekends', 'This topic covers how to ask someone about their weekend and how to respond to such inquiries.', '["English","Conversation","Speaking"]', 'active', '2025-10-03 04:00:00', '2025-10-03 04:00:00'),
(  45, 76, 2, 'Expressing Forgetfulness', 'An explanation of common phrases and idioms used to express forgetfulness in English.', '["English","Conversation","Speaking"]', 'active', '2025-10-03 05:00:00', '2025-10-03 05:00:00'),
(  46, 77, 6, 'Introduction to HTML + Setting Up the Development Environment', 'An overview of HTML as the foundational language for web development, its importance, and the basic structure of a web page.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 06:00:00', '2025-10-03 06:00:00'),
(  47, 78, 6, 'Creating the index.html File + Basic HTML Document Structure', 'Steps to create the main HTML file for a website, including the importance of naming it index.html.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 07:00:00', '2025-10-03 07:00:00'),
(  48, 79, 6, 'Using Header Tags + Paragraph Elements + Line Breaks and Horizontal Rules', 'How to use header tags (H1 to H6) to create headings in an HTML document.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 08:00:00', '2025-10-03 08:00:00'),
(  49, 80, 6, 'Adding Comments in HTML + Creating Hyperlinks', 'How to add comments in HTML for documentation purposes, which are not displayed in the browser.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 09:00:00', '2025-10-03 09:00:00'),
(  50, 81, 6, 'Adding Images to a Web Page', 'Instructions on how to add images using the IMG tag, including attributes for source, alt text, and title.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 10:00:00', '2025-10-03 10:00:00'),
(  51, 82, 6, 'Embedding Audio in HTML', 'How to embed audio files using the audio element, including attributes for controls and autoplay.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 11:00:00', '2025-10-03 11:00:00'),
(  52, 83, 6, 'Embedding Video in HTML', 'Instructions on how to embed video files using the video element, including attributes for controls and multiple sources.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 12:00:00', '2025-10-03 12:00:00'),
(  53, 84, 6, 'Text Formatting Tags + Creating Lists in HTML', 'Overview of various text formatting tags in HTML, including bold, italic, and others.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 13:00:00', '2025-10-03 13:00:00'),
(  54, 85, 6, 'Creating Tables in HTML', 'Instructions on how to create tables using table, tr, th, and td tags.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 14:00:00', '2025-10-03 14:00:00'),
(  55, 86, 6, 'Adding Color to a Web Page', 'How to add color to elements using inline CSS styles within HTML tags.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 15:00:00', '2025-10-03 15:00:00'),
(  56, 87, 6, 'Using Span and Div Tags', 'Explanation of the span and div tags for applying styles and organizing content in HTML.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 16:00:00', '2025-10-03 16:00:00'),
(  57, 88, 6, 'Understanding Meta Tags', 'Overview of meta tags and their importance for providing metadata about a web page.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 17:00:00', '2025-10-03 17:00:00'),
(  58, 89, 6, 'Using iFrames', 'How to use iFrames to embed other web pages or documents within an HTML document.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 18:00:00', '2025-10-03 18:00:00'),
(  59, 90, 6, 'Creating Buttons in HTML', 'Instructions on how to create buttons using button tags and how to add functionality with JavaScript.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 19:00:00', '2025-10-03 19:00:00'),
(  60, 91, 6, 'Creating Forms in HTML', 'How to create forms for user input, including various input types and attributes.', '["HTML","CSS","WebDev"]', 'active', '2025-10-03 20:00:00', '2025-10-03 20:00:00'),
(  61, 92, 11, 'Registering for ChatGPT', 'Step-by-step guide on how to register for a ChatGPT account, including the requirements and process involved.', '["ChatGPT","AI","Productivity"]', 'active', '2025-10-03 21:00:00', '2025-10-03 21:00:00'),
(  62, 93, 11, 'Advanced Usage of ChatGPT + Using ChatGPT for Content Creation', 'Exploration of more advanced features and applications of ChatGPT, including creative writing and data analysis.', '["ChatGPT","AI","Productivity"]', 'active', '2025-10-03 22:00:00', '2025-10-03 22:00:00'),
(  63, 94, 11, 'Future of ChatGPT and AI Tools + Introduction to Upgrading ChatGPT Accounts', 'Insights into the future developments of ChatGPT and similar AI tools, including potential enhancements and applications.', '["ChatGPT","AI","Productivity"]', 'active', '2025-10-03 23:00:00', '2025-10-03 23:00:00'),
(  64, 95, 11, 'Differences Between Free and Paid Accounts + Benefits of Upgrading to ChatGPT Plus + How to Upgrade Your Account', 'An explanation of the limitations of free accounts compared to paid accounts, including access to different models and features.', '["ChatGPT","AI","Productivity"]', 'active', '2025-10-04 00:00:00', '2025-10-04 00:00:00'),
(  65, 96, 11, 'Demonstration of Data Summarization', 'A practical demonstration of how to use ChatGPT to summarize a complex dataset, including a sample file related to real estate.', '["ChatGPT","AI","Productivity"]', 'active', '2025-10-04 01:00:00', '2025-10-04 01:00:00'),
(  66, 97, 11, 'Interacting with ChatGPT for Data Insights + Limitations and Considerations', 'Explaining how to interact with ChatGPT to ask questions about the dataset and receive summarized information.', '["ChatGPT","AI","Productivity"]', 'active', '2025-10-04 02:00:00', '2025-10-04 02:00:00'),
(  67, 98, 11, 'Using ChatGPT for Image Analysis + Creating Custom Chatbots with ChatGPT + Conclusion and Future Applications', 'Discussion on how to use ChatGPT to analyze and generate content based on images, including a demonstration.', '["ChatGPT","AI","Productivity"]', 'active', '2025-10-04 03:00:00', '2025-10-04 03:00:00'),
(  68, 99, 10, 'Introduction to Data Science and Machine Learning + Multidisciplinary Nature of Data Science', 'An overview of what Data Science and Machine Learning are, their importance, and the structure of the course.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-04 04:00:00', '2025-10-04 04:00:00'),
(  69, 100, 10, 'Difference Between Data Science, Data Analytics, and Big Data + Why Data Science is Relevant Now + Applications of Data Science and Machine Learning', 'Clarifies the distinctions between these terms and introduces the four Vs of Big Data.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-04 05:00:00', '2025-10-04 05:00:00'),
(  70, 101, 10, 'History and Future of Data Science + Understanding Data and Variables', 'Provides a brief history of Data Science and discusses its promising future, including the impact of cloud services.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-04 06:00:00', '2025-10-04 06:00:00'),
(  71, 102, 10, 'Handling Outliers and Missing Data + Types of Machine Learning', 'Discusses the concepts of outliers and missing data, and various techniques to handle them.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-04 07:00:00', '2025-10-04 07:00:00'),
(  72, 103, 10, 'Model Evaluation and Performance Indicators', 'Covers how to evaluate machine learning models using metrics like R squared, confusion matrix, and cross-validation.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-04 08:00:00', '2025-10-04 08:00:00'),
(  73, 104, 10, 'Best Practices in Data Science and Machine Learning', 'Discusses essential practices for data cleaning, feature engineering, and scaling to improve model performance.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-04 09:00:00', '2025-10-04 09:00:00'),
(  74, 105, 7, 'Introduction to System Design + Foundational Concepts in System Design', 'Overview of the course and the importance of mastering system design for career advancement.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 10:00:00', '2025-10-04 10:00:00'),
(  75, 106, 7, 'Database Selection: SQL vs NoSQL', 'Guidance on choosing the right database type based on application needs, including relational and non-relational databases.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 11:00:00', '2025-10-04 11:00:00'),
(  76, 107, 7, 'Scaling Strategies: Vertical vs Horizontal', 'Discussion on the two primary approaches to scaling systems and their implications for performance and reliability.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 12:00:00', '2025-10-04 12:00:00'),
(  77, 108, 7, 'Load Balancing Techniques', 'Explanation of load balancing, its importance, and various algorithms used to distribute traffic across servers.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 13:00:00', '2025-10-04 13:00:00'),
(  78, 109, 7, 'Avoiding Single Points of Failure', 'Strategies to prevent single points of failure in system design, focusing on redundancy and health checks.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 14:00:00', '2025-10-04 14:00:00'),
(  79, 110, 7, 'API Design Principles + Understanding REST, GraphQL, and GRPC', 'Exploration of how to design APIs that are scalable and developer-friendly.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 15:00:00', '2025-10-04 15:00:00'),
(  80, 111, 7, 'Authentication vs Authorization', 'Clarification of the differences between authentication and authorization, including various methods and frameworks.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 16:00:00', '2025-10-04 16:00:00'),
(  81, 112, 7, 'API Security Best Practices', 'Overview of techniques to secure APIs against common vulnerabilities and attacks.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-04 17:00:00', '2025-10-04 17:00:00'),
(  82, 113, 8, 'Giới thiệu về cây nhị phân và cây nhị phân tìm kiếm + Cấu trúc của cây nhị phân', 'Bắt đầu với định nghĩa và khái niệm cơ bản về cây nhị phân và cây nhị phân tìm kiếm, cùng với các loại cây khác nhau.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-04 18:00:00', '2025-10-04 18:00:00'),
(  83, 114, 8, 'Các loại cây nhị phân + Cây nhị phân tìm kiếm (BST)', 'Phân loại cây nhị phân dựa trên số lượng con của mỗi nút và các đặc điểm của chúng.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-04 19:00:00', '2025-10-04 19:00:00'),
(  84, 115, 8, 'Thao tác thêm nút vào cây nhị phân tìm kiếm', 'Hướng dẫn chi tiết về cách thêm một nút vào cây nhị phân tìm kiếm, bao gồm các trường hợp khác nhau.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-04 20:00:00', '2025-10-04 20:00:00'),
(  85, 116, 8, 'Introduction to Binary Search Tree Insertion + Iterative vs Recursive Insertion Methods + Creating a New Root Node + Handling Existing Nodes + Node Comparison and Traversal + Finalizing the Insertion ', 'The speaker introduces the concept of inserting a node into a binary search tree, explaining the basic structure and the need for a root node.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-04 21:00:00', '2025-10-04 21:00:00'),
(  86, 117, 8, 'Thao tác xóa nút trong cây nhị phân tìm kiếm', 'Giải thích các trường hợp khác nhau khi xóa một nút trong cây nhị phân tìm kiếm và cách xử lý chúng.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-04 22:00:00', '2025-10-04 22:00:00'),
(  87, 118, 8, 'Giới thiệu về cây nhị phân và các thao tác cơ bản + Implementing the Deletion Function', 'Bắt đầu với khái niệm cây nhị phân và các thao tác cơ bản như xóa nút trong cây.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-04 23:00:00', '2025-10-04 23:00:00'),
(  88, 119, 8, 'Cách thực hiện hàm xóa nút + Trường hợp xóa nút có hai con', 'Hướng dẫn từng bước để thực hiện hàm xóa nút trong cây nhị phân tìm kiếm.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-05 00:00:00', '2025-10-05 00:00:00'),
(  89, 120, 8, 'Trường hợp xóa nút có một con + Trường hợp xóa nút không có con + Tìm kiếm nút trong cây nhị phân', 'Giải thích cách xử lý khi xóa nút chỉ có một con.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-05 01:00:00', '2025-10-05 01:00:00'),
(  90, 121, 8, 'Duyệt cây nhị phân', 'Giới thiệu các phương pháp duyệt cây nhị phân như pre-order, in-order và post-order.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-05 02:00:00', '2025-10-05 02:00:00'),
(  91, 122, 8, 'Phân tích độ phức tạp của các thuật toán', 'Thảo luận về độ phức tạp thời gian và không gian của các thuật toán liên quan đến cây nhị phân.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-05 03:00:00', '2025-10-05 03:00:00'),
(  92, 123, 8, 'Tính chiều cao của cây nhị phân', 'Hướng dẫn cách tính chiều cao của cây nhị phân bằng phương pháp đệ quy.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-05 04:00:00', '2025-10-05 04:00:00'),
(  93, 124, 8, 'Kiểm tra tổng đường đi trong cây', 'Giới thiệu bài toán kiểm tra xem có đường đi nào trong cây có tổng bằng một giá trị cho trước.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-05 05:00:00', '2025-10-05 05:00:00'),
(  94, 125, 8, 'Thực hiện giải thuật kiểm tra tổng + Kết luận và tổng kết', 'Chi tiết cách thực hiện giải thuật kiểm tra tổng đường đi trong cây nhị phân.', '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-05 06:00:00', '2025-10-05 06:00:00'),
(  95, 126, 4, 'Cài đặt môi trường lập trình cho máy Windows mới + Cấu hình máy tính mới + Cài đặt Visual Studio Code', 'Hướng dẫn từng bước để cài đặt và cấu hình môi trường lập trình trên máy tính Windows mới, bao gồm các phần mềm cần thiết.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 07:00:00', '2025-10-05 07:00:00'),
(  96, 127, 4, 'Thiết lập terminal + Cài đặt Node.js', 'Hướng dẫn cách thiết lập Windows Terminal để sử dụng hiệu quả hơn trong quá trình lập trình.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 08:00:00', '2025-10-05 08:00:00'),
(  97, 128, 4, 'Hướng dẫn cài đặt môi trường lập trình cho Windows + Cài đặt Visual Studio Code', 'Giới thiệu về quy trình cài đặt môi trường lập trình trên máy Windows mới, bao gồm các bước cần thiết để thiết lập và cấu hình.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 09:00:00', '2025-10-05 09:00:00'),
(  98, 129, 4, 'Cài đặt extensions cho Visual Studio Code + Kiểm tra cài đặt thành công + Cài đặt Node.js + Cài đặt Git + Thiết lập terminal + Cấu hình PATH', 'Hướng dẫn cách cài đặt các extensions cần thiết cho Visual Studio Code để hỗ trợ lập trình.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 10:00:00', '2025-10-05 10:00:00'),
(  99, 130, 4, 'Cài đặt môi trường lập trình cho máy Windows mới + Hướng dẫn cài đặt môi trường lập trình cho Windows', 'Hướng dẫn chi tiết từng bước để cài đặt môi trường lập trình trên máy Windows mới, bao gồm các công cụ cần thiết.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 11:00:00', '2025-10-05 11:00:00'),
( 100, 131, 4, 'Cài đặt Visual Studio Code + Cài đặt Git + Cài đặt Node.js + Thiết lập terminal + Cài đặt extensions cho Visual Studio Code + Cấu hình PATH + Kiểm tra cài đặt thành công + Cài đặt và cấu hình Apache +', 'Hướng dẫn chi tiết cách cài đặt Visual Studio Code, một công cụ lập trình phổ biến.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 12:00:00', '2025-10-05 12:00:00'),
( 101, 132, 4, 'Giới thiệu về CORS Policy + Khái niệm nguồn gốc (Origin)', 'Giới thiệu về chính sách CORS và tầm quan trọng của nó trong việc bảo mật dữ liệu giữa các nguồn gốc khác nhau.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 13:00:00', '2025-10-05 13:00:00'),
( 102, 133, 4, 'Chính sách CORS + Access-Control-Allow-Origin', 'Mô tả chính sách CORS và cách nó bảo vệ dữ liệu giữa các nguồn gốc khác nhau.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 14:00:00', '2025-10-05 14:00:00'),
( 103, 134, 4, 'Xử lý lỗi CORS + Access-Control-Allow-Origin + Cấu hình CORS', 'Cách xử lý các lỗi liên quan đến CORS khi thực hiện các yêu cầu từ nguồn gốc khác.', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 15:00:00', '2025-10-05 15:00:00'),
( 104, 135, 4, 'Tình huống thực tế với CORS + Thực tiễn sử dụng CORS + Tương lai của CORS', 'Trong thực tế, khi làm việc với các API từ các nguồn khác nhau, việc hiểu và cấu hình CORS là rất quan trọng để đảm bảo rằng ứng dụng hoạt động đúng cách mà không gặp phải các lỗi liên quan đến chính ', '["DevTools","Windows","Programming"]', 'active', '2025-10-05 16:00:00', '2025-10-05 16:00:00'),
( 105, 136, 6, 'Introduction to HTML + Setting Up the Development Environment', 'An overview of HTML, its importance, and its role as the foundational building block of web development.', '["HTML","CSS","WebDev"]', 'active', '2025-10-05 17:00:00', '2025-10-05 17:00:00'),
( 106, 137, 6, 'Creating the Basic HTML Structure', 'How to create a basic HTML document structure, including the doctype declaration, HTML tags, head, and body sections.', '["HTML","CSS","WebDev"]', 'active', '2025-10-05 18:00:00', '2025-10-05 18:00:00'),
( 107, 138, 6, 'Using HTML Tags', 'Explanation of HTML tags, including header tags (H1-H6), paragraph tags (P), line breaks (BR), and horizontal rules (HR).', '["HTML","CSS","WebDev"]', 'active', '2025-10-05 19:00:00', '2025-10-05 19:00:00'),
( 108, 139, 6, 'Adding Comments in HTML + Creating Hyperlinks', 'How to add comments in HTML code for documentation purposes, which are not displayed in the browser.', '["HTML","CSS","WebDev"]', 'active', '2025-10-05 20:00:00', '2025-10-05 20:00:00'),
( 109, 140, 6, 'Inserting Images', 'How to add images to a webpage using the IMG tag, including setting the source and alternative text attributes.', '["HTML","CSS","WebDev"]', 'active', '2025-10-05 21:00:00', '2025-10-05 21:00:00'),
( 110, 141, 6, 'Adding Audio to a Web Page', 'Instructions on how to embed audio files in a webpage using the audio element, including attributes for controls and autoplay.', '["HTML","CSS","WebDev"]', 'active', '2025-10-05 22:00:00', '2025-10-05 22:00:00'),
( 111, 142, 6, 'Embedding Videos', 'How to add video content to a webpage using the video element, including attributes for controls and multiple sources.', '["HTML","CSS","WebDev"]', 'active', '2025-10-05 23:00:00', '2025-10-05 23:00:00'),
( 112, 143, 6, 'Text Formatting Tags + Creating Lists in HTML', 'Overview of various text formatting tags in HTML, including bold, italic, and other text styles.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 00:00:00', '2025-10-06 00:00:00'),
( 113, 144, 6, 'Creating Tables in HTML', 'Instructions on how to create tables in HTML, including table rows, headers, and data cells.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 01:00:00', '2025-10-06 01:00:00'),
( 114, 145, 6, 'Adding Color to Web Pages', 'Introduction to CSS for adding color to web pages, including inline styles for background and font colors.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 02:00:00', '2025-10-06 02:00:00'),
( 115, 146, 6, 'Understanding Span and Div Tags', 'Explanation of the span and div tags in HTML, their purposes, and how to use them for styling.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 03:00:00', '2025-10-06 03:00:00'),
( 116, 147, 6, 'Using Meta Tags', 'Overview of meta tags in HTML, their purpose for providing metadata about the webpage, and common examples.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 04:00:00', '2025-10-06 04:00:00'),
( 117, 148, 6, 'Embedding iFrames', 'How to use iFrames to embed other web pages or documents within an HTML document.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 05:00:00', '2025-10-06 05:00:00'),
( 118, 149, 6, 'Creating Buttons in HTML', 'Instructions on how to create buttons using HTML, including attributes for linking and styling.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 06:00:00', '2025-10-06 06:00:00'),
( 119, 150, 6, 'Building Forms in HTML', 'Comprehensive guide on creating forms in HTML, including input types, labels, and form attributes.', '["HTML","CSS","WebDev"]', 'active', '2025-10-06 07:00:00', '2025-10-06 07:00:00'),
( 120, 151, 6, 'Introduction to Node.js', 'An overview of Node.js as a runtime environment for executing JavaScript outside of a browser, its purpose in building backend services, and its advantages over other frameworks.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 08:00:00', '2025-10-06 08:00:00'),
( 121, 152, 6, 'Node.js Architecture', 'Explanation of what a runtime environment is, how Node.js uses the V8 engine, and the differences between browser and Node.js environments.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 09:00:00', '2025-10-06 09:00:00'),
( 122, 153, 6, 'Asynchronous Nature of Node.js', 'Understanding the non-blocking architecture of Node.js through a restaurant metaphor, comparing it to synchronous architecture and its implications for scalability.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 10:00:00', '2025-10-06 10:00:00'),
( 123, 154, 6, 'Installing Node.js', 'Step-by-step guide on how to install Node.js on different operating systems and verify the installation.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 11:00:00', '2025-10-06 11:00:00'),
( 124, 155, 6, 'Creating Your First Node.js Application', 'Demonstration of creating a simple Node.js application, including writing JavaScript code and executing it using Node.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 12:00:00', '2025-10-06 12:00:00'),
( 125, 156, 6, 'Node.js Module System', 'Introduction to the module system in Node.js, explaining the concept of modules, their scope, and how to create and use them.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 13:00:00', '2025-10-06 13:00:00'),
( 126, 157, 6, 'Working with Global Objects in Node.js', 'Discussion on global objects in Node.js, how they differ from browser global objects, and the implications for variable scope.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 14:00:00', '2025-10-06 14:00:00'),
( 127, 158, 6, 'Event Handling in Node.js', 'Explaining the concept of events in Node.js, how to create and handle events using the EventEmitter class.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 15:00:00', '2025-10-06 15:00:00'),
( 128, 159, 6, 'Building an HTTP Server', 'Creating a simple HTTP server using Node.js, handling requests, and sending responses, including routing examples.', '["NodeJS","JavaScript","Backend"]', 'active', '2025-10-06 16:00:00', '2025-10-06 16:00:00'),
( 129, 160, 5, 'Introduction to JavaScript + Capabilities of JavaScript + JavaScript Execution Environments', 'An overview of JavaScript, its popularity, and job opportunities.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-06 17:00:00', '2025-10-06 17:00:00'),
( 130, 161, 5, 'ECMAScript and ES6 Features + Setting Up Development Environment', 'Introduction to ECMAScript, its specifications, and the features introduced in ES6.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-06 18:00:00', '2025-10-06 18:00:00'),
( 131, 162, 5, 'Creating and Linking JavaScript Files', 'Demonstrates how to create an HTML file and link it to a JavaScript file.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-06 19:00:00', '2025-10-06 19:00:00'),
( 132, 163, 5, 'Understanding Variables', 'Explains the concept of variables in JavaScript, including declaration and initialization.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-06 20:00:00', '2025-10-06 20:00:00'),
( 133, 164, 5, 'Constants in JavaScript + Primitive Data Types', 'Discusses the use of constants and the difference between variables and constants.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-06 21:00:00', '2025-10-06 21:00:00'),
( 134, 165, 5, 'Dynamic Typing in JavaScript', 'Explains the concept of dynamic typing and how variable types can change at runtime.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-06 22:00:00', '2025-10-06 22:00:00'),
( 135, 166, 5, 'Introduction to Objects', 'Defines objects in JavaScript and how they can be used to group related variables.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-06 23:00:00', '2025-10-06 23:00:00'),
( 136, 167, 5, 'Accessing Object Properties', 'Demonstrates how to access and modify object properties using dot and bracket notation.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-07 00:00:00', '2025-10-07 00:00:00'),
( 137, 168, 5, 'Working with Arrays', 'Introduces arrays, how to create them, and their dynamic nature in JavaScript.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-07 01:00:00', '2025-10-07 01:00:00'),
( 138, 169, 5, 'Functions in JavaScript', 'Explains the concept of functions, how to declare them, and their parameters and arguments.', '["JavaScript","ES6","Programming"]', 'active', '2025-10-07 02:00:00', '2025-10-07 02:00:00'),
( 139, 170, 22, 'Introduction to Critical Thinking + Current Educational Challenges + The Importance of Questioning', 'The speaker introduces critical thinking as an essential skill for the 21st century, emphasizing its importance for young people to adapt to the 4.0 industrial revolution.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 03:00:00', '2025-10-07 03:00:00'),
( 140, 171, 22, 'Consequences of Lack of Critical Thinking + Skills Needed for the Future', 'Exploration of the serious implications for young people who do not develop critical thinking skills, particularly in the context of AI and automation.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 04:00:00', '2025-10-07 04:00:00'),
( 141, 172, 22, 'Understanding Critical Thinking + The Process of Critical Thinking', 'Definition and explanation of critical thinking, emphasizing its role in analyzing, evaluating, and synthesizing information.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 05:00:00', '2025-10-07 05:00:00'),
( 142, 173, 22, 'Describing and Articulating Thoughts + Self-Reflection and Acceptance of Mistakes', 'The need to articulate thoughts clearly to avoid misunderstandings and to validate one''s reasoning.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 06:00:00', '2025-10-07 06:00:00'),
( 143, 174, 22, 'Acquiring Knowledge in the Digital Age', 'How to effectively acquire knowledge and information in the context of modern technology and its implications.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 07:00:00', '2025-10-07 07:00:00'),
( 144, 175, 22, 'Challenges in Information Processing + Encouragement to Take Action + Application of Critical Thinking', 'The speaker addresses the difficulties young people face in processing and understanding information in the digital age.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 08:00:00', '2025-10-07 08:00:00'),
( 145, 176, 22, 'Analyzing Information + Understanding Critical Thinking', 'The process of analyzing information critically to determine its validity and relevance.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 09:00:00', '2025-10-07 09:00:00'),
( 146, 177, 22, 'Synthesis and Creativity in Critical Thinking + The Importance of Internalizing Knowledge + The Role of Critical Thinking in the Modern World', 'The importance of synthesizing information and using creativity to develop new ideas and solutions.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 10:00:00', '2025-10-07 10:00:00'),
( 147, 178, 22, 'AI and Human Skills + Emotional Intelligence in Communication', 'The speaker discusses the relationship between AI development and the need for human skills such as critical thinking and creativity.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 11:00:00', '2025-10-07 11:00:00'),
( 148, 179, 22, 'Applying Critical Thinking in Dialogue', 'Strategies for applying critical thinking in conversations without making others uncomfortable.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 12:00:00', '2025-10-07 12:00:00'),
( 149, 180, 22, 'Overcoming Challenges in Group Work', 'Advice on improving group dynamics and collaboration through critical thinking and respect for diverse opinions.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 13:00:00', '2025-10-07 13:00:00'),
( 150, 181, 22, 'The Value of Personal Reflection + The Role of Emotional Intelligence in Communication', 'Encouragement for individuals to reflect on their own thoughts and contributions before engaging with others.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 14:00:00', '2025-10-07 14:00:00'),
( 151, 182, 22, 'The Future of Learning and Adaptation + Collaboration and Teamwork in Critical Thinking', 'The necessity of continuous learning and adaptation in a rapidly changing world, emphasizing the importance of critical thinking.', '["CriticalThinking","SoftSkills","Education"]', 'active', '2025-10-07 15:00:00', '2025-10-07 15:00:00'),
( 152, 183, 23, 'Introduction to Project Management + History of Project Management + Project Management Lifecycle', 'An overview of project management, its importance, and the objectives of the tutorial.', '["ProjectManagement","Agile","SoftSkills"]', 'active', '2025-10-07 16:00:00', '2025-10-07 16:00:00'),
( 153, 184, 23, 'Project Initiation Phase + Project Planning Phase + Project Execution Phase', 'Details on the initiation phase, focusing on feasibility, project charter creation, and stakeholder involvement.', '["ProjectManagement","Agile","SoftSkills"]', 'active', '2025-10-07 17:00:00', '2025-10-07 17:00:00'),
( 154, 185, 23, 'Monitoring and Control Phase + Project Closure Phase + Project Management Knowledge Areas + Project Management Methodologies', 'Overview of the monitoring and control phase, focusing on quality assurance, budget management, and project tracking.', '["ProjectManagement","Agile","SoftSkills"]', 'active', '2025-10-07 18:00:00', '2025-10-07 18:00:00'),
( 155, 186, 23, 'Project Management Tools', 'Discussion on the importance of project management tools and their features that aid in project execution.', '["ProjectManagement","Agile","SoftSkills"]', 'active', '2025-10-07 19:00:00', '2025-10-07 19:00:00'),
( 156, 187, 23, 'Project Management Certifications', 'Overview of popular project management certifications available in 2021 and their significance in career advancement.', '["ProjectManagement","Agile","SoftSkills"]', 'active', '2025-10-07 20:00:00', '2025-10-07 20:00:00'),
( 157, 188, 23, 'Demo: Creating a Project Plan with Asana', 'A practical demonstration of using Asana to create a project plan, covering essential steps and features.', '["ProjectManagement","Agile","SoftSkills"]', 'active', '2025-10-07 21:00:00', '2025-10-07 21:00:00'),
( 158, 189, 24, 'Introduction to Music Theory for Guitar Players + The First Assignment: Note Cards', 'The speaker shares their personal journey with music theory and introduces the concept of using note cards to learn music theory fundamentals.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-07 22:00:00', '2025-10-07 22:00:00'),
( 159, 190, 24, 'Creating Major Triads + Understanding Major Triads and Chords', 'The speaker guides the audience through writing out major triads on the note cards, explaining the notes associated with each card.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-07 23:00:00', '2025-10-07 23:00:00'),
( 160, 191, 24, 'Memorizing Sharps and Flats + The Circle of Fifths and Key Signatures + Introduction to Chord Theory', 'The speaker emphasizes the importance of memorizing sharps and flats using acronyms and explains how they relate to major chords.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-08 00:00:00', '2025-10-08 00:00:00'),
( 161, 192, 24, 'Understanding Chord Inversions + Playing Chord Inversions on Guitar', 'An explanation of chord inversions, detailing root position, first inversion, and second inversion of the G major chord.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-08 01:00:00', '2025-10-08 01:00:00'),
( 162, 193, 24, 'Transitioning Between Chords', 'Discussion on how first inversion chords resolve and how to transition smoothly between chords like G over B and C.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-08 02:00:00', '2025-10-08 02:00:00'),
( 163, 194, 24, 'Exploring Second Inversion Chords', 'Explanation of second inversion chords, their characteristics, and how they resolve to the root chord.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-08 03:00:00', '2025-10-08 03:00:00'),
( 164, 195, 24, 'Building Major and Minor Chords', 'How to construct major and minor chords from the G major scale, including examples of A minor and B minor chords.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-08 04:00:00', '2025-10-08 04:00:00'),
( 165, 196, 24, 'Understanding the Circle of Fifths + Recap of Music Theory Concepts', 'Introduction to the circle of fifths and its application in identifying key signatures and chord relationships.', '["MusicTheory","Guitar","Music"]', 'active', '2025-10-08 05:00:00', '2025-10-08 05:00:00'),
( 166, 197, 20, 'Introduction to Video Editing with CapCut + Video Editing Workflow Steps', 'An overview of the video editing process using CapCut, including the importance of understanding the software for effective video creation.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 06:00:00', '2025-10-08 06:00:00'),
( 167, 198, 20, 'Understanding the Timeline and Layer Management + Masking Techniques in Video Editing', 'An explanation of how to manage layers within the timeline, including moving and adjusting layers for effective video editing.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 07:00:00', '2025-10-08 07:00:00'),
( 168, 199, 20, 'Color Grading Essentials + Introduction to CapCut Video Editing', 'A complete breakdown of color grading techniques to enhance the visual appeal of videos.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 08:00:00', '2025-10-08 08:00:00'),
( 169, 200, 20, 'Masking Techniques in CapCut + Using Multiple Masks + Adjusting Video Frames + Creating Fade Effects', 'A detailed explanation of how to create and adjust masks using the pen tool for precise video editing.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 09:00:00', '2025-10-08 09:00:00'),
( 170, 201, 20, 'Layering Effects + Advanced Transitions and Effects', 'Explaining how to layer effects in CapCut and adjust their parameters for desired outcomes.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 10:00:00', '2025-10-08 10:00:00'),
( 171, 202, 20, 'Speed Adjustment Techniques + Audio Mixing Fundamentals', 'Methods for adjusting video speed and duration to create dynamic content.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 11:00:00', '2025-10-08 11:00:00'),
( 172, 203, 20, 'Adding Background Music + Creating Subtitles Automatically', 'Instructions on how to add and adjust background music in video projects.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 12:00:00', '2025-10-08 12:00:00'),
( 173, 204, 20, 'Finalizing and Rendering Videos', 'Steps to render videos in CapCut, including settings for quality and format.', '["CapCut","VideoEditing","CreatorEconomy"]', 'active', '2025-10-08 13:00:00', '2025-10-08 13:00:00'),
( 174, 205, 21, 'Introduction to Premiere Pro Basics + Setting Up Project Files', 'Overview of the tutorial''s goals and structure, focusing on essential features for beginners.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 14:00:00', '2025-10-08 14:00:00'),
( 175, 206, 21, 'Premiere Pro Workspace Setup', 'Guide to configuring Premiere Pro settings for optimal performance and user experience.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 15:00:00', '2025-10-08 15:00:00'),
( 176, 207, 21, 'Importing Media and Creating a Sequence', 'Steps to import media files and create a sequence for video editing.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 16:00:00', '2025-10-08 16:00:00'),
( 177, 208, 21, 'Timeline Fundamentals: Cutting and Trimming Clips', 'Techniques for arranging clips on the timeline, including cutting and trimming methods.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 17:00:00', '2025-10-08 17:00:00'),
( 178, 209, 21, 'Adding Transitions Between Clips', 'How to apply and customize transitions to enhance video flow.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 18:00:00', '2025-10-08 18:00:00'),
( 179, 210, 21, 'Incorporating Text Titles', 'Instructions for adding and customizing text titles in the video.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 19:00:00', '2025-10-08 19:00:00'),
( 180, 211, 21, 'Audio Adjustment Techniques', 'Methods for adjusting audio levels and adding sound effects to enhance the video.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 20:00:00', '2025-10-08 20:00:00'),
( 181, 212, 21, 'Exporting Your Final Project + Color Correction and Grading Basics', 'Steps to export the completed video project with the desired settings.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 21:00:00', '2025-10-08 21:00:00'),
( 182, 213, 21, 'Keyframing for Motion Graphics', 'How to use keyframing to create animations and enhance visual engagement.', '["PremierePro","VideoEditing","CreativeTools"]', 'active', '2025-10-08 22:00:00', '2025-10-08 22:00:00'),
( 183, 214, 12, 'Giới thiệu về Lightroom + Nguyên tắc hoạt động của Lightroom + Chọn và nhập hình ảnh', 'Nội dung này giới thiệu về Lightroom, lịch sử phát triển và các phiên bản của phần mềm này, cùng với những lợi ích mà nó mang lại cho người dùng.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-08 23:00:00', '2025-10-08 23:00:00'),
( 184, 215, 12, 'Quản lý thư viện hình ảnh + Xuất hình ảnh + Chỉnh sửa hình ảnh cơ bản + Công cụ khử mắt đỏ và chỉnh màu', 'Giới thiệu về cách quản lý thư viện hình ảnh trong Lightroom, bao gồm việc tạo collection và tổ chức hình ảnh.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 00:00:00', '2025-10-09 00:00:00'),
( 185, 216, 12, 'Giới thiệu về công cụ AI trong Lightroom + Chọn chủ thể trong hình ảnh + Chọn vùng trời và xóa nền + Công cụ chọn vùng không gian + Sử dụng công cụ Blood để tạo mặt nạ', 'Phân tích về công cụ AI trong Lightroom và cách nó giúp tiết kiệm thời gian trong quá trình hậu kỳ.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 01:00:00', '2025-10-09 01:00:00'),
( 186, 217, 12, 'Công cụ Lainer Gradient + Công cụ Radio Gradient + Công cụ Color Ren và Luminon Ren', 'Cách sử dụng công cụ Lainer Gradient để tạo lớp chuyển màu từ đậm đến nhẹ trong hình ảnh.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 02:00:00', '2025-10-09 02:00:00'),
( 187, 218, 12, 'Cân bằng trắng và các chế độ màu + Công cụ chỉnh sáng tối', 'Giải thích về cách sử dụng công cụ cân bằng trắng và các chế độ màu sắc khác nhau trong Lightroom.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 03:00:00', '2025-10-09 03:00:00'),
( 188, 219, 12, 'Công cụ tăng giảm chi tiết + Công cụ điều chỉnh màu sắc + Công cụ tông cất', 'Hướng dẫn cách sử dụng công cụ để tăng hoặc giảm chi tiết trong hình ảnh.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 04:00:00', '2025-10-09 04:00:00'),
( 189, 220, 12, 'Công cụ vòng tròn điều chỉnh + Công cụ chỉnh sửa màu sắc nâng cao', 'Hướng dẫn cách sử dụng công cụ vòng tròn để điều chỉnh độ sáng tối và màu sắc cho nhiều vùng khác nhau.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 05:00:00', '2025-10-09 05:00:00'),
( 190, 221, 12, 'Giới thiệu về nguyên lý sử dụng Lightroom + Công cụ điều chỉnh độ sáng và độ tương phản + Công cụ khử noise', 'Bắt đầu với các nguyên lý cơ bản trong Lightroom và cách sử dụng các công cụ chỉnh sửa hình ảnh.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 06:00:00', '2025-10-09 06:00:00'),
( 191, 222, 12, 'Sử dụng công cụ Transform + Sử dụng công cụ Crop và Straighten + Công cụ crop và điều chỉnh hình ảnh + Tổng kết và hướng dẫn sử dụng', 'Hướng dẫn cách sử dụng công cụ Transform để chỉnh sửa hình ảnh bị méo hoặc nghiêng.', '["Lightroom","Photography","Editing"]', 'active', '2025-10-09 07:00:00', '2025-10-09 07:00:00'),
( 192, 223, 13, 'Introduction to Graphic Design Basics + Setting Up the Workspace in Photoshop', 'The speaker introduces the course on graphic design, emphasizing the importance of starting from the basics to build a strong foundation.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 08:00:00', '2025-10-09 08:00:00'),
( 193, 224, 13, 'Creating a New Document + Understanding Image Resolution', 'Step-by-step guide on how to create a new document in Photoshop, including selecting dimensions and resolution.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 09:00:00', '2025-10-09 09:00:00'),
( 194, 225, 13, 'Choosing Color Modes + Using Layers in Design', 'Discussion on different color modes in Photoshop, including RGB for online use and CMYK for print, and their implications for design.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 10:00:00', '2025-10-09 10:00:00'),
( 195, 226, 13, 'Chọn Mẫu Màu Trong Thiết Kế Đồ Họa + Phân Biệt Các Mẫu Màu + Quy Trình Chọn Mẫu Màu', 'Giới thiệu về cách chọn mẫu màu trong thiết kế đồ họa, bao gồm các bước và nguyên tắc cơ bản để lựa chọn màu sắc phù hợp.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 11:00:00', '2025-10-09 11:00:00'),
( 196, 227, 13, 'Cách Đổ Màu Trong Thiết Kế + Nguyên Tắc Sử Dụng Màu Sắc', 'Chi tiết về cách đổ màu trong thiết kế đồ họa, bao gồm các công cụ và kỹ thuật sử dụng.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 12:00:00', '2025-10-09 12:00:00'),
( 197, 228, 13, 'Tạo Bố Cục Trong Thiết Kế + Sử Dụng Hình Dạng Trong Thiết Kế', 'Hướng dẫn cách tạo bố cục trong thiết kế đồ họa, bao gồm việc sử dụng hình dạng và không gian.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 13:00:00', '2025-10-09 13:00:00'),
( 198, 229, 13, 'Kỹ Thuật Tạo Hình Trong Thiết Kế', 'Giới thiệu các kỹ thuật tạo hình trong thiết kế đồ họa, bao gồm việc sử dụng các công cụ và phần mềm.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 14:00:00', '2025-10-09 14:00:00'),
( 199, 230, 13, 'Quản Lý Đối Tượng Trong Thiết Kế', 'Hướng dẫn cách quản lý và sắp xếp các đối tượng trong thiết kế, bao gồm việc sử dụng các lớp và nhóm.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 15:00:00', '2025-10-09 15:00:00'),
( 200, 231, 13, 'Xuất Bản Thiết Kế', 'Chi tiết về quy trình xuất bản thiết kế, bao gồm các định dạng file và cách lưu trữ.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 16:00:00', '2025-10-09 16:00:00'),
( 201, 232, 13, 'Creating Layouts with Shapes + Tạo Hiệu Ứng Trong Thiết Kế', 'The speaker explains how to create layouts using different shapes and the importance of understanding these shapes for effective design.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 17:00:00', '2025-10-09 17:00:00'),
( 202, 233, 13, 'Kết Luận và Bài Tập Thực Hành', 'Tóm tắt các kiến thức đã học và đưa ra bài tập thực hành để củng cố kỹ năng thiết kế.', '["GraphicDesign","Photoshop","Design"]', 'active', '2025-10-09 18:00:00', '2025-10-09 18:00:00'),
( 203, 234, 14, 'Understanding Exposure + The Three Camera Settings for Exposure + ISO Explained', 'This topic introduces the concept of exposure in photography, explaining its importance and how it affects the brightness of images.', '["Photography","Exposure","Composition"]', 'active', '2025-10-09 19:00:00', '2025-10-09 19:00:00'),
( 204, 235, 14, 'Understanding Aperture + Demonstrating Aperture Effects', 'An explanation of aperture, its function in controlling light entry, and how it is measured with F-numbers.', '["Photography","Exposure","Composition"]', 'active', '2025-10-09 20:00:00', '2025-10-09 20:00:00'),
( 205, 236, 14, 'Creative Use of Shutter Speed', 'Exploration of creative options with shutter speed, including freezing and blurring motion, and how to choose the right speed.', '["Photography","Exposure","Composition"]', 'active', '2025-10-09 21:00:00', '2025-10-09 21:00:00'),
( 206, 237, 14, 'Understanding Camera Exposure + How Cameras Measure Light', 'This topic introduces the concept of camera exposure and the common issues faced by photographers when using automatic modes. It sets the stage for understanding how to achieve perfect exposures.', '["Photography","Exposure","Composition"]', 'active', '2025-10-09 22:00:00', '2025-10-09 22:00:00'),
( 207, 238, 14, 'Common Exposure Problems + Solutions for Better Exposure + Metering Modes and Exposure Compensation', 'The speaker discusses common exposure issues, such as underexposure and overexposure, and how they relate to the camera''s light measurement.', '["Photography","Exposure","Composition"]', 'active', '2025-10-09 23:00:00', '2025-10-09 23:00:00'),
( 208, 239, 14, 'The Concept of Stops in Photography + Dynamic and Tonal Ranges', 'An explanation of what ''stops'' mean in photography, how they relate to light exposure, and their significance in adjusting camera settings.', '["Photography","Exposure","Composition"]', 'active', '2025-10-10 00:00:00', '2025-10-10 00:00:00'),
( 209, 240, 14, 'Techniques to Control Light + Understanding Histograms', 'The speaker discusses various techniques to control light in photography, including the use of filters and HDR photography.', '["Photography","Exposure","Composition"]', 'active', '2025-10-10 01:00:00', '2025-10-10 01:00:00'),
( 210, 241, 14, 'Analyzing Histograms for Proper Exposure', 'This section dives deeper into analyzing histograms to determine if an image is properly exposed, including practical examples.', '["Photography","Exposure","Composition"]', 'active', '2025-10-10 02:00:00', '2025-10-10 02:00:00'),
( 211, 242, 14, 'Transitioning to Manual Mode', 'The speaker discusses the importance of understanding camera settings and introduces the concept of shooting in manual mode for full creative control.', '["Photography","Exposure","Composition"]', 'active', '2025-10-10 03:00:00', '2025-10-10 03:00:00'),
( 212, 243, 15, 'Introduction to Figma and Course Overview + Creating a Desktop Frame', 'The speaker introduces Figma as a leading design tool and outlines the goals of the crash course, emphasizing hands-on learning and speed.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 04:00:00', '2025-10-10 04:00:00'),
( 213, 244, 15, 'Understanding Color Properties + Adding Structure with Lines and Dividers', 'Explanation of fill and stroke properties in Figma, including how to use hex and HSB color systems for better color management.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 05:00:00', '2025-10-10 05:00:00'),
( 214, 245, 15, 'Using Rulers and Grids for Layout + Working with Text in Figma', 'Instructions on how to use rulers and grids in Figma to create a structured layout, including adding and adjusting grid systems.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 06:00:00', '2025-10-10 06:00:00'),
( 215, 246, 15, 'Creating Shapes and Icons', 'Demonstration of adding shapes and icons to the design, including using plugins to find and insert icons efficiently.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 07:00:00', '2025-10-10 07:00:00'),
( 216, 247, 15, 'Implementing Gradients and Shadows', 'Explanation of how to apply gradients and shadows to elements in Figma, enhancing the visual appeal of the design.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 08:00:00', '2025-10-10 08:00:00'),
( 217, 248, 15, 'Utilizing Auto Layout for Flexibility', 'Introduction to auto layout in Figma, demonstrating how to create responsive designs that adjust automatically to content changes.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 09:00:00', '2025-10-10 09:00:00'),
( 218, 249, 15, 'Creating Components for Reusability', 'Guide on how to create components in Figma for consistent design elements across multiple screens, including managing variants.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 10:00:00', '2025-10-10 10:00:00'),
( 219, 250, 15, 'Prototyping and Interaction Design', 'Overview of prototyping features in Figma, including setting up hover states and interactions for a more dynamic user experience.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 11:00:00', '2025-10-10 11:00:00'),
( 220, 251, 15, 'Dev Handoff and Collaboration', 'Discussion on the process of handing off designs to developers, including the use of Dev Mode and the importance of consistency in design.', '["Figma","UIUX","Design"]', 'active', '2025-10-10 12:00:00', '2025-10-10 12:00:00'),
( 221, 252, 19, 'Introduction to Power BI and Its Importance + Understanding Power BI''s Role in Data Analysis + Comparison with Other BI Tools', 'An overview of Power BI as a critical tool for data analysis and its relevance in the industry.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 13:00:00', '2025-10-10 13:00:00'),
( 222, 253, 19, 'Components of Power BI + Data Transformation with Power Query', 'Breakdown of the three main components of Power BI: Power BI Desktop, Power BI Service, and Power BI Mobile.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 14:00:00', '2025-10-10 14:00:00'),
( 223, 254, 19, 'Creating Data Models in Power BI + Using DAX for Data Analysis + Building Effective Dashboards', 'Explains the concept of data models in Power BI and how to establish relationships between different data sets.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 15:00:00', '2025-10-10 15:00:00'),
( 224, 255, 19, 'Automating Data Refresh and Reporting + The Five-Step Process for Reporting + Practical Project Implementation + Introduction to Power BI Data Modeling', 'Discusses the importance of setting up automated data refreshes and how to manage data flows in Power BI.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 16:00:00', '2025-10-10 16:00:00'),
( 225, 256, 19, 'Connecting Data to Power BI + Understanding Data Files and Their Structure', 'A step-by-step guide on how to connect data sources to Power BI, including practical examples of data files.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 17:00:00', '2025-10-10 17:00:00'),
( 226, 257, 19, 'Using AI for Data Analysis + Creating Analytical Dashboards + Data Transformation Techniques', 'Demonstrating how to utilize AI tools to analyze data files quickly and efficiently, enhancing productivity.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 18:00:00', '2025-10-10 18:00:00'),
( 227, 258, 19, 'Building Relationships in Data Models + Understanding Data Model Normalization + Introduction to Power BI Reporting Features', 'Explaining how to establish relationships between different data tables in Power BI to ensure accurate data analysis.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 19:00:00', '2025-10-10 19:00:00'),
( 228, 259, 19, 'Creating Effective Dashboards', 'This section discusses the process of creating dashboards in Power BI, including inserting text boxes and customizing visual elements for better presentation.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 20:00:00', '2025-10-10 20:00:00'),
( 229, 260, 19, 'Key Performance Indicators (KPIs) in Power BI + Using DAX for Calculating KPIs', 'An overview of how to create and display KPIs in Power BI, including the calculation of order quantities and revenue metrics.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 21:00:00', '2025-10-10 21:00:00'),
( 230, 261, 19, 'Using AI to Assist with DAX + Understanding DAX Syntax + Creating Revenue Measures + Building Effective Dashboards', 'Discussion on how AI can assist users in generating DAX code quickly and efficiently, while also stressing the importance of learning DAX fundamentals.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 22:00:00', '2025-10-10 22:00:00'),
( 231, 262, 19, 'Visualizing Data with Charts', 'A step-by-step guide on how to create and customize various types of charts in Power BI to visualize data effectively.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-10 23:00:00', '2025-10-10 23:00:00'),
( 232, 263, 19, 'Visualizing Data with Charts', 'An exploration of different chart types available in Power BI for visualizing data, including bar charts and donut charts, and how to customize their appearance.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-11 00:00:00', '2025-10-11 00:00:00'),
( 233, 264, 19, 'Finalizing the Dashboard', 'A summary of the steps taken to finalize the dashboard, including adjustments to visual elements and ensuring all KPIs are accurately represented.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-11 01:00:00', '2025-10-11 01:00:00'),
( 234, 265, 19, 'Using Slicers for Data Filtering + Publishing and Sharing Reports', 'Explanation of how to use slicers in Power BI to filter data dynamically based on user selections, enhancing interactivity in dashboards.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-11 02:00:00', '2025-10-11 02:00:00'),
( 235, 266, 19, 'Refreshing Data in Power BI + Conclusion and Future Learning', 'Discussion on how to set up data refresh in Power BI, including the necessary configurations to ensure data is up-to-date.', '["PowerBI","DataAnalytics","Dashboard"]', 'active', '2025-10-11 03:00:00', '2025-10-11 03:00:00'),
( 236, 267, 16, 'Introduction to Promotion Strategies + Discount Techniques Overview', 'The speaker introduces the importance of promotion strategies in increasing sales and customer engagement, particularly in the Vietnamese market.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 04:00:00', '2025-10-11 04:00:00'),
( 237, 268, 16, 'Using Psychological Pricing + Time-Based Discounts + Lucky Draw Promotions', 'The speaker explains the technique of psychological pricing, such as setting prices just below a round number to make them appear more attractive.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 05:00:00', '2025-10-11 05:00:00'),
( 238, 269, 16, 'Customer-Driven Pricing + Happy Hour Promotions', 'Introducing a program where customers can set their own prices within a certain range, fostering a sense of control and satisfaction.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 06:00:00', '2025-10-11 06:00:00'),
( 239, 270, 16, 'Flash Sales + Loyalty Programs', 'Explaining flash sales as a strategy to create urgency and excitement among customers, often involving significant discounts for a limited time.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 07:00:00', '2025-10-11 07:00:00'),
( 240, 271, 16, 'Overview of Promotion Strategies + Discount Techniques + Sales Boosting Tactics', 'An introduction to various promotion strategies that can enhance sales and customer engagement.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 08:00:00', '2025-10-11 08:00:00'),
( 241, 272, 16, 'Effective Upselling and Cross-Selling + Marketing Campaign Planning + Revenue Growth Tips + Bundling Products', 'In-depth explanation of upselling and cross-selling methods to increase average order value.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 09:00:00', '2025-10-11 09:00:00'),
( 242, 273, 16, 'Promotional Partnerships + Promotional Strategies for New Products + Creating Value Through Promotions', 'Leveraging partnerships with other businesses to offer joint promotions, enhancing value for customers without significant cost.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 10:00:00', '2025-10-11 10:00:00'),
( 243, 274, 16, 'Overcoming Fear of Starting + Introduction to Digital Marketing', 'Discusses the common fears faced by beginners in digital marketing and how to overcome them.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 11:00:00', '2025-10-11 11:00:00'),
( 244, 275, 16, 'Differences Between Digital and Traditional Marketing', 'Compares digital marketing with traditional marketing methods, highlighting key differences.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 12:00:00', '2025-10-11 12:00:00'),
( 245, 276, 16, 'The Role of Digital Marketing in Business + Types of Digital Marketing Strategies', 'Discusses how digital marketing aids in research, planning, and execution of marketing strategies.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 13:00:00', '2025-10-11 13:00:00'),
( 246, 277, 16, 'Introduction to Digital Marketing Fundamentals + Understanding Traffic Management + Paid Advertising in Digital Marketing + On Media and Owned Media', 'An overview of the essential concepts in digital marketing, emphasizing the importance of understanding basic knowledge and taking action.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 14:00:00', '2025-10-11 14:00:00'),
( 247, 278, 16, 'Understanding Customer Journey Stages + The Role of Multi-Channel Marketing + Customer Experience and Emotional Connection + Mapping Customer Actions', 'Explains the different stages of the customer journey, including Z-mode, F-mode, and S-mode, and how customers interact with brands.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 15:00:00', '2025-10-11 15:00:00'),
( 248, 279, 16, 'Creating Engaging Content + Utilizing Social Media for Marketing + Post-Purchase Customer Engagement', 'Discusses the importance of creating engaging content across various platforms to attract and retain customers.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 16:00:00', '2025-10-11 16:00:00'),
( 249, 280, 16, 'Building a Community Around Your Brand + Final Thoughts on Digital Marketing', 'Discusses the importance of creating a community and engaging customers to foster brand loyalty.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 17:00:00', '2025-10-11 17:00:00'),
( 250, 281, 16, 'Content Marketing Essentials + Choosing the Right Content Format', 'An introduction to content marketing, emphasizing the importance of delivering valuable content to attract and retain customers.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 18:00:00', '2025-10-11 18:00:00'),
( 251, 282, 16, 'Introduction to Digital Marketing + Choosing the Right Marketing Channels', 'An overview of digital marketing and its importance in today''s business landscape.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 19:00:00', '2025-10-11 19:00:00'),
( 252, 283, 16, 'Understanding Customer Behavior + Measuring Marketing Effectiveness', 'The importance of analyzing customer behavior to effectively target marketing efforts.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 20:00:00', '2025-10-11 20:00:00'),
( 253, 284, 16, 'Setting Clear Marketing Goals + Understanding the Customer Journey', 'The necessity of establishing clear and measurable marketing goals to guide campaigns.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 21:00:00', '2025-10-11 21:00:00'),
( 254, 285, 16, 'Content Types and Delivery Methods + Continuous Improvement in Marketing Strategies + Measuring Marketing Effectiveness', 'Discussion on various content types and the best methods for delivering them to the audience.', '["DigitalMarketing","Marketing","Promotions"]', 'active', '2025-10-11 22:00:00', '2025-10-11 22:00:00'),
( 255, 286, 17, 'Introduction to Copywriting + Three Rules of Effective Copy + Visualizing Copy', 'The speaker introduces the importance of copywriting as a fundamental skill in marketing, emphasizing its role in effective communication.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-11 23:00:00', '2025-10-11 23:00:00'),
( 256, 287, 17, 'Falsifiability in Copy + Uniqueness in Copywriting', 'Discussion on the significance of writing falsifiable statements in copy, enhancing credibility and engagement by presenting verifiable claims.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-12 00:00:00', '2025-10-12 00:00:00'),
( 257, 288, 17, 'The Importance of Learning Copywriting + Crafting Memorable Copy', 'A compelling argument for why individuals should learn copywriting, highlighting its impact on marketing success and business growth.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-12 01:00:00', '2025-10-12 01:00:00'),
( 258, 289, 17, 'The Process of Writing Copy', 'An overview of the speaker''s process for writing copy, including understanding the audience, having a clear message, and the iterative nature of writing.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-12 02:00:00', '2025-10-12 02:00:00'),
( 259, 290, 17, 'The Process of Writing an Ad + Understanding Conflict in Copywriting + The Interaction of Writing and Design', 'The speaker shares their personal process of writing an ad, including the importance of multiple rewrites and the role of design in copywriting.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-12 03:00:00', '2025-10-12 03:00:00'),
( 260, 291, 17, 'Using Facts in Copywriting', 'The speaker discusses the role of facts in copywriting, emphasizing their importance in grounding arguments and enhancing credibility.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-12 04:00:00', '2025-10-12 04:00:00'),
( 261, 292, 17, 'Engagement in Newsletters + Writing with Simplicity', 'A discussion on the speaker''s approach to writing newsletters, focusing on engagement and the importance of connecting with the audience.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-12 05:00:00', '2025-10-12 05:00:00'),
( 262, 293, 17, 'The Importance of Structure in Writing + The Impact of AI on Writing', 'A discussion on the significance of structure in writing, including how to break down ideas into manageable parts for clarity and impact.', '["Copywriting","Marketing","ContentWriting"]', 'active', '2025-10-12 06:00:00', '2025-10-12 06:00:00'),
( 263, 294, 18, 'Introduction to the Ultimate SEO Checklist + Tracking SEO Performance + Key SEO KPIs to Track', 'Overview of the importance of SEO and the checklist that will be covered in the video.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 07:00:00', '2025-10-12 07:00:00'),
( 264, 295, 18, 'Running a Screaming Frog Crawl + Crawlability and Indexability of Your Website + Mobile Friendliness of Your Website + Website Loading Speed + SSL Certificate Verification', 'Instructions on how to run a crawl using Screaming Frog and the importance of this step in the SEO checklist.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 08:00:00', '2025-10-12 08:00:00'),
( 265, 296, 18, 'Modern Website Design + Impact of Interstitial Pop-ups on SEO', 'The impact of website design on user trust and SEO performance.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 09:00:00', '2025-10-12 09:00:00'),
( 266, 297, 18, 'Ad Placement and User Experience + Trust Pages on Your Website + Author Bios and Expertise', 'The effects of aggressive ad placements on user engagement and SEO performance.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 10:00:00', '2025-10-12 10:00:00'),
( 267, 298, 18, 'Managing Non-Indexable Pages + Website Bloat and Pruning', 'How to identify and manage pages that are non-indexable and their impact on SEO.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 11:00:00', '2025-10-12 11:00:00'),
( 268, 299, 18, 'Thin Content Issues + Outdated Content Management + Engagement Rate Analysis', 'How to identify and address pages with thin content that may harm SEO.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 12:00:00', '2025-10-12 12:00:00'),
( 269, 300, 18, 'Title and H1 Tag Optimization + Spelling and Grammar Checks + Backlink Analysis for Traffic', 'Ensuring each page has a unique title tag and H1 tag for better SEO.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 13:00:00', '2025-10-12 13:00:00'),
( 270, 301, 18, 'Redirect Management', 'Managing redirect chains and ensuring efficient redirects for SEO.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 14:00:00', '2025-10-12 14:00:00'),
( 271, 302, 18, 'Duplicate Content Issues + Broken Links Management + AI Content Considerations', 'Identifying and resolving duplicate content to improve SEO performance.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 15:00:00', '2025-10-12 15:00:00'),
( 272, 303, 18, 'H1 Tag and Heading Structure', 'Ensuring proper structure of H1 and heading tags for SEO optimization.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 16:00:00', '2025-10-12 16:00:00'),
( 273, 304, 18, 'Keyword Placement in URLs and Meta Tags', 'Discusses the significance of including target keywords in URLs, title tags, and meta descriptions.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 17:00:00', '2025-10-12 17:00:00'),
( 274, 305, 18, 'Content Originality and Quality', 'Assessing content originality and ensuring it meets quality standards.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 18:00:00', '2025-10-12 18:00:00'),
( 275, 306, 18, 'Satisfying Search Intent', 'Understanding and optimizing content to satisfy user search intent.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 19:00:00', '2025-10-12 19:00:00'),
( 276, 307, 18, 'Differentiating Content Strategy + Introduction to SEO Fundamentals + Effort Lever in Content Creation', 'Creating unique content strategies that stand out from competitors.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 20:00:00', '2025-10-12 20:00:00'),
( 277, 308, 18, 'The Uniqueness and Data Lever + Updating Existing Content', 'Explaining how using unique data and insights can help create original content that stands out in search results.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 21:00:00', '2025-10-12 21:00:00'),
( 278, 309, 18, 'Readability and User Experience + Visual Assets in Content', 'The significance of content readability and structure in enhancing user experience and engagement.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 22:00:00', '2025-10-12 22:00:00'),
( 279, 310, 18, 'Creating Helpful Content + Originality in Content Creation', 'Defining helpful content and how it should fulfill user intent to be considered valuable.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-12 23:00:00', '2025-10-12 23:00:00'),
( 280, 311, 18, 'Accuracy and Trustworthiness + Demonstrating Expertise', 'Discussing the need for accurate information and citing sources to build trust with the audience.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-13 00:00:00', '2025-10-13 00:00:00'),
( 281, 312, 18, 'Demonstrating Expertise and Credibility', 'Discusses the importance of showcasing expertise and providing credible sources to enhance content trustworthiness.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-13 01:00:00', '2025-10-13 01:00:00'),
( 282, 313, 18, 'Schema Markup and Technical SEO', 'Explaining the role of schema markup in improving search visibility and click-through rates.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-13 02:00:00', '2025-10-13 02:00:00'),
( 283, 314, 18, 'Internal Linking Strategies', 'The importance of internal linking for SEO and how to optimize it for better performance.', '["SEO","TechnicalSEO","ContentStrategy"]', 'active', '2025-10-13 03:00:00', '2025-10-13 03:00:00');

-- ============================================================================
-- FEED COMMENTS
-- ============================================================================
INSERT INTO feed_comments (id, highlight_id, user_id, origin_cmt, content, created_at, updated_at) VALUES
(   1, 5, 17, NULL, 'Tuyệt vời! Tôi đã áp dụng ngay vào dự án.', '2025-10-05 12:00:00', '2025-10-05 12:00:00'),
(   2, 16, 12, NULL, 'Cảm ơn, đây chính xác là thứ tôi cần!', '2025-10-05 14:00:00', '2025-10-05 14:00:00'),
(   3, 18, 22, NULL, 'Learned so much in just a few minutes!', '2025-10-05 16:00:00', '2025-10-05 16:00:00'),
(   4, 18, 11, 3, 'Totally agree!', '2025-10-05 18:30:00', '2025-10-05 18:30:00'),
(   5, 20, 13, NULL, 'This saved me hours of reading documentation.', '2025-10-05 20:00:00', '2025-10-05 20:00:00'),
(   6, 22, 24, NULL, 'Rất hay, mong có thêm video như thế này!', '2025-10-05 22:00:00', '2025-10-05 22:00:00'),
(   7, 28, 15, NULL, 'The examples really helped me understand.', '2025-10-06 00:00:00', '2025-10-06 00:00:00'),
(   8, 29, 15, NULL, 'Great explanation! Very clear and concise.', '2025-10-06 02:00:00', '2025-10-06 02:00:00'),
(   9, 30, 18, NULL, 'This is exactly what I was looking for!', '2025-10-06 04:00:00', '2025-10-06 04:00:00'),
(  10, 30, 15, 9, 'Cảm ơn bạn đã chia sẻ!', '2025-10-06 06:30:00', '2025-10-06 06:30:00'),
(  11, 35, 16, NULL, 'Tôi đã học được rất nhiều từ đoạn clip này.', '2025-10-06 08:00:00', '2025-10-06 08:00:00'),
(  12, 35, 24, 11, 'Totally agree!', '2025-10-06 10:30:00', '2025-10-06 10:30:00'),
(  13, 36, 24, NULL, 'Giải thích rất dễ hiểu, tiếp tục phát huy nhé!', '2025-10-06 12:00:00', '2025-10-06 12:00:00'),
(  14, 38, 23, NULL, 'Video này giải thích rõ ràng, dễ hiểu!', '2025-10-06 14:00:00', '2025-10-06 14:00:00'),
(  15, 38, 12, 14, 'Same here, very helpful!', '2025-10-06 16:30:00', '2025-10-06 16:30:00'),
(  16, 54, 15, NULL, 'Thật sự rất hữu ích, cảm ơn giảng viên!', '2025-10-06 18:00:00', '2025-10-06 18:00:00'),
(  17, 56, 18, NULL, 'Nội dung súc tích, đúng trọng tâm!', '2025-10-06 20:00:00', '2025-10-06 20:00:00'),
(  18, 56, 19, 17, 'Mình cũng nghĩ vậy!', '2025-10-06 22:30:00', '2025-10-06 22:30:00'),
(  19, 64, 11, NULL, 'Giải thích rất dễ hiểu, tiếp tục phát huy nhé!', '2025-10-07 00:00:00', '2025-10-07 00:00:00'),
(  20, 64, 21, 19, 'Totally agree!', '2025-10-07 02:30:00', '2025-10-07 02:30:00'),
(  21, 66, 14, NULL, 'This is exactly what I was looking for!', '2025-10-07 04:00:00', '2025-10-07 04:00:00'),
(  22, 70, 23, NULL, 'Thật sự rất hữu ích, cảm ơn giảng viên!', '2025-10-07 06:00:00', '2025-10-07 06:00:00'),
(  23, 70, 17, 22, 'Cảm ơn bạn đã chia sẻ!', '2025-10-07 08:30:00', '2025-10-07 08:30:00'),
(  24, 72, 23, NULL, 'Cần thêm ví dụ thực tế hơn.', '2025-10-07 10:00:00', '2025-10-07 10:00:00'),
(  25, 72, 18, 24, 'Totally agree!', '2025-10-07 12:30:00', '2025-10-07 12:30:00'),
(  26, 74, 18, NULL, 'Great explanation! Very clear and concise.', '2025-10-07 14:00:00', '2025-10-07 14:00:00'),
(  27, 76, 24, NULL, 'This is exactly what I was looking for!', '2025-10-07 16:00:00', '2025-10-07 16:00:00'),
(  28, 82, 11, NULL, 'Thật sự rất hữu ích, cảm ơn giảng viên!', '2025-10-07 18:00:00', '2025-10-07 18:00:00'),
(  29, 84, 23, NULL, 'Nội dung súc tích, đúng trọng tâm!', '2025-10-07 20:00:00', '2025-10-07 20:00:00'),
(  30, 90, 11, NULL, 'Tuyệt vời! Tôi đã áp dụng ngay vào dự án.', '2025-10-07 22:00:00', '2025-10-07 22:00:00'),
(  31, 92, 22, NULL, 'Cảm ơn, đây chính xác là thứ tôi cần!', '2025-10-08 00:00:00', '2025-10-08 00:00:00'),
(  32, 92, 12, 31, 'Mình cũng nghĩ vậy!', '2025-10-08 02:30:00', '2025-10-08 02:30:00'),
(  33, 94, 24, NULL, 'Very well structured, easy to follow.', '2025-10-08 04:00:00', '2025-10-08 04:00:00'),
(  34, 94, 14, 33, 'Đúng rồi, phần này hay lắm!', '2025-10-08 06:30:00', '2025-10-08 06:30:00'),
(  35, 100, 18, NULL, 'Nội dung súc tích, đúng trọng tâm!', '2025-10-08 08:00:00', '2025-10-08 08:00:00'),
(  36, 110, 16, NULL, 'Tuyệt vời! Tôi đã áp dụng ngay vào dự án.', '2025-10-08 10:00:00', '2025-10-08 10:00:00'),
(  37, 112, 21, NULL, 'Cảm ơn, đây chính xác là thứ tôi cần!', '2025-10-08 12:00:00', '2025-10-08 12:00:00'),
(  38, 114, 13, NULL, 'Learned so much in just a few minutes!', '2025-10-08 14:00:00', '2025-10-08 14:00:00'),
(  39, 114, 14, 38, 'Totally agree!', '2025-10-08 16:30:00', '2025-10-08 16:30:00'),
(  40, 122, 24, NULL, 'This saved me hours of reading documentation.', '2025-10-08 18:00:00', '2025-10-08 18:00:00'),
(  41, 122, 25, 40, 'Totally agree!', '2025-10-08 20:30:00', '2025-10-08 20:30:00'),
(  42, 125, 11, NULL, 'Tuyệt vời! Tôi đã áp dụng ngay vào dự án.', '2025-10-08 22:00:00', '2025-10-08 22:00:00'),
(  43, 126, 23, NULL, 'Cảm ơn, đây chính xác là thứ tôi cần!', '2025-10-09 00:00:00', '2025-10-09 00:00:00'),
(  44, 132, 21, NULL, 'Learned so much in just a few minutes!', '2025-10-09 02:00:00', '2025-10-09 02:00:00'),
(  45, 132, 11, 44, 'Đúng rồi, phần này hay lắm!', '2025-10-09 04:30:00', '2025-10-09 04:30:00'),
(  46, 133, 21, NULL, 'This saved me hours of reading documentation.', '2025-10-09 06:00:00', '2025-10-09 06:00:00'),
(  47, 133, 19, 46, 'Totally agree!', '2025-10-09 08:30:00', '2025-10-09 08:30:00'),
(  48, 140, 11, NULL, 'Tuyệt vời! Tôi đã áp dụng ngay vào dự án.', '2025-10-09 10:00:00', '2025-10-09 10:00:00'),
(  49, 148, 13, NULL, 'Cảm ơn, đây chính xác là thứ tôi cần!', '2025-10-09 12:00:00', '2025-10-09 12:00:00'),
(  50, 148, 16, 49, 'Totally agree!', '2025-10-09 14:30:00', '2025-10-09 14:30:00'),
(  51, 150, 22, NULL, 'Very well structured, easy to follow.', '2025-10-09 16:00:00', '2025-10-09 16:00:00'),
(  52, 150, 25, 51, 'Totally agree!', '2025-10-09 18:30:00', '2025-10-09 18:30:00'),
(  53, 151, 13, NULL, 'Cần thêm ví dụ thực tế hơn.', '2025-10-09 20:00:00', '2025-10-09 20:00:00'),
(  54, 155, 22, NULL, 'Giải thích rất dễ hiểu, tiếp tục phát huy nhé!', '2025-10-09 22:00:00', '2025-10-09 22:00:00'),
(  55, 163, 19, NULL, 'Video này giải thích rõ ràng, dễ hiểu!', '2025-10-10 00:00:00', '2025-10-10 00:00:00'),
(  56, 165, 18, NULL, 'Very well structured, easy to follow.', '2025-10-10 02:00:00', '2025-10-10 02:00:00'),
(  57, 166, 12, NULL, 'This saved me hours of reading documentation.', '2025-10-10 04:00:00', '2025-10-10 04:00:00'),
(  58, 169, 13, NULL, 'Rất hay, mong có thêm video như thế này!', '2025-10-10 06:00:00', '2025-10-10 06:00:00'),
(  59, 170, 24, NULL, 'The examples really helped me understand.', '2025-10-10 08:00:00', '2025-10-10 08:00:00'),
(  60, 171, 24, NULL, 'Great explanation! Very clear and concise.', '2025-10-10 10:00:00', '2025-10-10 10:00:00'),
(  61, 171, 20, 60, 'Totally agree!', '2025-10-10 12:30:00', '2025-10-10 12:30:00'),
(  62, 172, 14, NULL, 'Phần này khó hiểu một chút, bạn nào giải thích thêm không?', '2025-10-10 14:00:00', '2025-10-10 14:00:00'),
(  63, 173, 23, NULL, 'Tôi đã học được rất nhiều từ đoạn clip này.', '2025-10-10 16:00:00', '2025-10-10 16:00:00'),
(  64, 173, 21, 63, 'Totally agree!', '2025-10-10 18:30:00', '2025-10-10 18:30:00'),
(  65, 178, 20, NULL, 'The examples really helped me understand.', '2025-10-10 20:00:00', '2025-10-10 20:00:00'),
(  66, 182, 22, NULL, 'Great explanation! Very clear and concise.', '2025-10-10 22:00:00', '2025-10-10 22:00:00'),
(  67, 195, 20, NULL, 'This is exactly what I was looking for!', '2025-10-11 00:00:00', '2025-10-11 00:00:00'),
(  68, 205, 25, NULL, 'Thật sự rất hữu ích, cảm ơn giảng viên!', '2025-10-11 02:00:00', '2025-10-11 02:00:00'),
(  69, 215, 15, NULL, 'Nội dung súc tích, đúng trọng tâm!', '2025-10-11 04:00:00', '2025-10-11 04:00:00'),
(  70, 215, 14, 69, 'Cảm ơn bạn đã chia sẻ!', '2025-10-11 06:30:00', '2025-10-11 06:30:00'),
(  71, 221, 21, NULL, 'Giải thích rất dễ hiểu, tiếp tục phát huy nhé!', '2025-10-11 08:00:00', '2025-10-11 08:00:00'),
(  72, 221, 20, 71, 'Totally agree!', '2025-10-11 10:30:00', '2025-10-11 10:30:00'),
(  73, 246, 21, NULL, 'This is exactly what I was looking for!', '2025-10-11 12:00:00', '2025-10-11 12:00:00'),
(  74, 249, 23, NULL, 'Thật sự rất hữu ích, cảm ơn giảng viên!', '2025-10-11 14:00:00', '2025-10-11 14:00:00'),
(  75, 249, 21, 74, 'Same here, very helpful!', '2025-10-11 16:30:00', '2025-10-11 16:30:00'),
(  76, 253, 18, NULL, 'Cần thêm ví dụ thực tế hơn.', '2025-10-11 18:00:00', '2025-10-11 18:00:00'),
(  77, 253, 21, 76, 'Totally agree!', '2025-10-11 20:30:00', '2025-10-11 20:30:00'),
(  78, 258, 16, NULL, 'Great explanation! Very clear and concise.', '2025-10-11 22:00:00', '2025-10-11 22:00:00'),
(  79, 258, 22, 78, 'Cảm ơn bạn đã chia sẻ!', '2025-10-12 00:30:00', '2025-10-12 00:30:00'),
(  80, 261, 14, NULL, 'Phần này khó hiểu một chút, bạn nào giải thích thêm không?', '2025-10-12 02:00:00', '2025-10-12 02:00:00'),
(  81, 261, 24, 80, 'Mình cũng nghĩ vậy!', '2025-10-12 04:30:00', '2025-10-12 04:30:00'),
(  82, 262, 11, NULL, 'Rất hay, mong có thêm video như thế này!', '2025-10-12 06:00:00', '2025-10-12 06:00:00'),
(  83, 263, 20, NULL, 'The examples really helped me understand.', '2025-10-12 08:00:00', '2025-10-12 08:00:00'),
(  84, 269, 15, NULL, 'Great explanation! Very clear and concise.', '2025-10-12 10:00:00', '2025-10-12 10:00:00'),
(  85, 269, 12, 84, 'Totally agree!', '2025-10-12 12:30:00', '2025-10-12 12:30:00');

-- ============================================================================
-- FEED INTERACTIONS (like / save / share; unique per user+highlight+type)
-- ============================================================================
INSERT INTO feed_interactions (id, user_id, highlight_id, type, created_at) VALUES
(   1, 24, 48, 'like', '2025-10-03 11:00:00'),
(   2, 23, 178, 'save', '2025-10-03 14:00:00'),
(   3, 23, 54, 'share', '2025-10-03 17:00:00'),
(   4, 11, 185, 'save', '2025-10-03 20:00:00'),
(   5, 20, 76, 'like', '2025-10-03 23:00:00'),
(   6, 18, 124, 'like', '2025-10-04 02:00:00'),
(   7, 23, 247, 'like', '2025-10-04 05:00:00'),
(   8, 13, 128, 'save', '2025-10-04 08:00:00'),
(   9, 21, 168, 'share', '2025-10-04 11:00:00'),
(  10, 13, 114, 'save', '2025-10-04 14:00:00'),
(  11, 11, 122, 'share', '2025-10-04 17:00:00'),
(  12, 14, 134, 'like', '2025-10-04 20:00:00'),
(  13, 11, 96, 'save', '2025-10-04 23:00:00'),
(  14, 25, 185, 'like', '2025-10-05 02:00:00'),
(  15, 16, 221, 'share', '2025-10-05 05:00:00'),
(  16, 11, 118, 'share', '2025-10-05 08:00:00'),
(  17, 14, 136, 'save', '2025-10-05 11:00:00'),
(  18, 21, 22, 'save', '2025-10-05 14:00:00'),
(  19, 15, 206, 'like', '2025-10-05 17:00:00'),
(  20, 20, 206, 'share', '2025-10-05 20:00:00'),
(  21, 17, 122, 'like', '2025-10-05 23:00:00'),
(  22, 24, 223, 'share', '2025-10-06 02:00:00'),
(  23, 23, 85, 'like', '2025-10-06 05:00:00'),
(  24, 21, 26, 'save', '2025-10-06 08:00:00'),
(  25, 19, 233, 'share', '2025-10-06 11:00:00'),
(  26, 17, 103, 'share', '2025-10-06 14:00:00'),
(  27, 16, 13, 'share', '2025-10-06 17:00:00'),
(  28, 21, 206, 'save', '2025-10-06 20:00:00'),
(  29, 14, 215, 'like', '2025-10-06 23:00:00'),
(  30, 14, 251, 'share', '2025-10-07 02:00:00'),
(  31, 20, 238, 'share', '2025-10-07 05:00:00'),
(  32, 13, 259, 'like', '2025-10-07 08:00:00'),
(  33, 22, 94, 'save', '2025-10-07 11:00:00'),
(  34, 15, 202, 'like', '2025-10-07 14:00:00'),
(  35, 24, 240, 'like', '2025-10-07 17:00:00'),
(  36, 22, 219, 'save', '2025-10-07 20:00:00'),
(  37, 12, 42, 'save', '2025-10-07 23:00:00'),
(  38, 17, 96, 'like', '2025-10-08 02:00:00'),
(  39, 23, 248, 'share', '2025-10-08 05:00:00'),
(  40, 16, 215, 'save', '2025-10-08 08:00:00'),
(  41, 23, 280, 'share', '2025-10-08 11:00:00'),
(  42, 23, 108, 'like', '2025-10-08 14:00:00'),
(  43, 19, 200, 'like', '2025-10-08 17:00:00'),
(  44, 15, 213, 'save', '2025-10-08 20:00:00'),
(  45, 15, 168, 'save', '2025-10-08 23:00:00'),
(  46, 12, 99, 'like', '2025-10-09 02:00:00'),
(  47, 18, 107, 'like', '2025-10-09 05:00:00'),
(  48, 14, 195, 'like', '2025-10-09 08:00:00'),
(  49, 15, 255, 'save', '2025-10-09 11:00:00'),
(  50, 16, 95, 'share', '2025-10-09 14:00:00'),
(  51, 24, 1, 'share', '2025-10-09 17:00:00'),
(  52, 19, 187, 'save', '2025-10-09 20:00:00'),
(  53, 23, 88, 'like', '2025-10-09 23:00:00'),
(  54, 12, 70, 'save', '2025-10-10 02:00:00'),
(  55, 23, 214, 'save', '2025-10-10 05:00:00'),
(  56, 25, 228, 'share', '2025-10-10 08:00:00'),
(  57, 23, 258, 'like', '2025-10-10 11:00:00'),
(  58, 24, 199, 'save', '2025-10-10 14:00:00'),
(  59, 13, 71, 'share', '2025-10-10 17:00:00'),
(  60, 15, 232, 'share', '2025-10-10 20:00:00'),
(  61, 12, 121, 'share', '2025-10-10 23:00:00'),
(  62, 21, 31, 'save', '2025-10-11 02:00:00'),
(  63, 12, 1, 'save', '2025-10-11 05:00:00'),
(  64, 19, 12, 'share', '2025-10-11 08:00:00'),
(  65, 17, 33, 'save', '2025-10-11 11:00:00'),
(  66, 14, 170, 'share', '2025-10-11 14:00:00'),
(  67, 13, 260, 'like', '2025-10-11 17:00:00'),
(  68, 15, 208, 'share', '2025-10-11 20:00:00'),
(  69, 11, 110, 'share', '2025-10-11 23:00:00'),
(  70, 20, 148, 'like', '2025-10-12 02:00:00'),
(  71, 15, 65, 'like', '2025-10-12 05:00:00'),
(  72, 14, 150, 'save', '2025-10-12 08:00:00'),
(  73, 23, 152, 'save', '2025-10-12 11:00:00'),
(  74, 15, 259, 'save', '2025-10-12 14:00:00'),
(  75, 11, 165, 'share', '2025-10-12 17:00:00'),
(  76, 13, 216, 'save', '2025-10-12 20:00:00'),
(  77, 16, 69, 'like', '2025-10-12 23:00:00'),
(  78, 16, 69, 'share', '2025-10-13 02:00:00'),
(  79, 22, 165, 'save', '2025-10-13 05:00:00'),
(  80, 25, 16, 'like', '2025-10-13 08:00:00'),
(  81, 11, 149, 'share', '2025-10-13 11:00:00'),
(  82, 14, 213, 'like', '2025-10-13 14:00:00'),
(  83, 14, 51, 'share', '2025-10-13 17:00:00'),
(  84, 14, 49, 'save', '2025-10-13 20:00:00'),
(  85, 13, 84, 'share', '2025-10-13 23:00:00'),
(  86, 13, 149, 'like', '2025-10-14 02:00:00'),
(  87, 22, 239, 'like', '2025-10-14 05:00:00'),
(  88, 25, 53, 'save', '2025-10-14 08:00:00'),
(  89, 21, 11, 'share', '2025-10-14 11:00:00'),
(  90, 19, 124, 'share', '2025-10-14 14:00:00'),
(  91, 25, 94, 'save', '2025-10-14 17:00:00'),
(  92, 14, 127, 'save', '2025-10-14 20:00:00'),
(  93, 20, 213, 'save', '2025-10-14 23:00:00'),
(  94, 19, 114, 'like', '2025-10-15 02:00:00'),
(  95, 14, 3, 'share', '2025-10-15 05:00:00'),
(  96, 16, 149, 'like', '2025-10-15 08:00:00'),
(  97, 24, 145, 'share', '2025-10-15 11:00:00'),
(  98, 22, 283, 'like', '2025-10-15 14:00:00'),
(  99, 15, 272, 'save', '2025-10-15 17:00:00'),
( 100, 17, 109, 'share', '2025-10-15 20:00:00'),
( 101, 20, 239, 'share', '2025-10-15 23:00:00'),
( 102, 23, 32, 'like', '2025-10-16 02:00:00'),
( 103, 12, 202, 'save', '2025-10-16 05:00:00'),
( 104, 13, 261, 'like', '2025-10-16 08:00:00'),
( 105, 14, 259, 'save', '2025-10-16 11:00:00'),
( 106, 20, 124, 'like', '2025-10-16 14:00:00'),
( 107, 23, 111, 'share', '2025-10-16 17:00:00'),
( 108, 18, 69, 'share', '2025-10-16 20:00:00'),
( 109, 12, 172, 'save', '2025-10-16 23:00:00'),
( 110, 14, 185, 'save', '2025-10-17 02:00:00'),
( 111, 12, 113, 'like', '2025-10-17 05:00:00'),
( 112, 19, 254, 'like', '2025-10-17 08:00:00'),
( 113, 22, 44, 'like', '2025-10-17 11:00:00'),
( 114, 21, 154, 'share', '2025-10-17 14:00:00'),
( 115, 12, 8, 'save', '2025-10-17 17:00:00'),
( 116, 16, 137, 'save', '2025-10-17 20:00:00'),
( 117, 23, 170, 'share', '2025-10-17 23:00:00'),
( 118, 20, 3, 'save', '2025-10-18 02:00:00'),
( 119, 15, 115, 'save', '2025-10-18 05:00:00'),
( 120, 14, 266, 'share', '2025-10-18 08:00:00'),
( 121, 23, 91, 'save', '2025-10-18 11:00:00'),
( 122, 20, 157, 'save', '2025-10-18 14:00:00'),
( 123, 21, 65, 'like', '2025-10-18 17:00:00'),
( 124, 24, 185, 'like', '2025-10-18 20:00:00'),
( 125, 21, 11, 'save', '2025-10-18 23:00:00'),
( 126, 24, 111, 'like', '2025-10-19 02:00:00'),
( 127, 17, 25, 'share', '2025-10-19 05:00:00'),
( 128, 24, 175, 'save', '2025-10-19 08:00:00'),
( 129, 14, 227, 'like', '2025-10-19 11:00:00'),
( 130, 14, 87, 'share', '2025-10-19 14:00:00'),
( 131, 22, 14, 'save', '2025-10-19 17:00:00'),
( 132, 18, 96, 'save', '2025-10-19 20:00:00'),
( 133, 12, 248, 'save', '2025-10-19 23:00:00'),
( 134, 24, 240, 'share', '2025-10-20 02:00:00'),
( 135, 17, 39, 'save', '2025-10-20 05:00:00'),
( 136, 17, 59, 'save', '2025-10-20 08:00:00'),
( 137, 19, 133, 'share', '2025-10-20 11:00:00'),
( 138, 20, 13, 'save', '2025-10-20 14:00:00'),
( 139, 16, 219, 'share', '2025-10-20 17:00:00'),
( 140, 19, 92, 'save', '2025-10-20 20:00:00'),
( 141, 24, 52, 'share', '2025-10-20 23:00:00'),
( 142, 23, 270, 'share', '2025-10-21 02:00:00'),
( 143, 13, 269, 'like', '2025-10-21 05:00:00'),
( 144, 23, 55, 'share', '2025-10-21 08:00:00'),
( 145, 24, 197, 'save', '2025-10-21 11:00:00'),
( 146, 17, 173, 'like', '2025-10-21 14:00:00'),
( 147, 24, 137, 'save', '2025-10-21 17:00:00'),
( 148, 25, 263, 'share', '2025-10-21 20:00:00'),
( 149, 15, 266, 'like', '2025-10-21 23:00:00'),
( 150, 12, 33, 'like', '2025-10-22 02:00:00'),
( 151, 19, 121, 'save', '2025-10-22 05:00:00'),
( 152, 17, 263, 'share', '2025-10-22 08:00:00'),
( 153, 24, 154, 'save', '2025-10-22 11:00:00'),
( 154, 13, 14, 'like', '2025-10-22 14:00:00'),
( 155, 21, 238, 'like', '2025-10-22 17:00:00'),
( 156, 12, 193, 'save', '2025-10-22 20:00:00'),
( 157, 19, 53, 'save', '2025-10-22 23:00:00'),
( 158, 14, 215, 'save', '2025-10-23 02:00:00'),
( 159, 13, 264, 'share', '2025-10-23 05:00:00'),
( 160, 23, 68, 'like', '2025-10-23 08:00:00'),
( 161, 23, 239, 'save', '2025-10-23 11:00:00'),
( 162, 14, 72, 'share', '2025-10-23 14:00:00'),
( 163, 16, 219, 'save', '2025-10-23 17:00:00'),
( 164, 19, 145, 'like', '2025-10-23 20:00:00'),
( 165, 17, 217, 'share', '2025-10-23 23:00:00'),
( 166, 20, 273, 'share', '2025-10-24 02:00:00'),
( 167, 22, 247, 'like', '2025-10-24 05:00:00'),
( 168, 14, 200, 'share', '2025-10-24 08:00:00'),
( 169, 24, 245, 'like', '2025-10-24 11:00:00'),
( 170, 11, 239, 'share', '2025-10-24 14:00:00'),
( 171, 13, 125, 'save', '2025-10-24 17:00:00'),
( 172, 17, 197, 'share', '2025-10-24 20:00:00'),
( 173, 17, 269, 'share', '2025-10-24 23:00:00'),
( 174, 19, 163, 'save', '2025-10-25 02:00:00'),
( 175, 17, 202, 'like', '2025-10-25 05:00:00'),
( 176, 23, 269, 'like', '2025-10-25 08:00:00'),
( 177, 13, 231, 'like', '2025-10-25 11:00:00'),
( 178, 20, 21, 'like', '2025-10-25 14:00:00'),
( 179, 18, 66, 'save', '2025-10-25 17:00:00'),
( 180, 11, 192, 'share', '2025-10-25 20:00:00');

-- ============================================================================
-- FEED VIEWS
-- ============================================================================
INSERT INTO feed_views (id, user_id, highlight_id, watch_duration, completed, viewed_at) VALUES
(   1, 24, 129, 26.1, 0, '2025-10-02 11:00:00'),
(   2, 14, 14, 198.7, 1, '2025-10-02 15:00:00'),
(   3, 21, 148, 136.0, 0, '2025-10-02 19:00:00'),
(   4, 25, 271, 196.8, 1, '2025-10-02 23:00:00'),
(   5, 21, 116, 54.5, 0, '2025-10-03 03:00:00'),
(   6, 12, 18, 19.3, 0, '2025-10-03 07:00:00'),
(   7, 11, 118, 61.0, 0, '2025-10-03 11:00:00'),
(   8, 17, 122, 180.8, 1, '2025-10-03 15:00:00'),
(   9, 21, 237, 51.0, 0, '2025-10-03 19:00:00'),
(  10, 15, 209, 117.9, 0, '2025-10-03 23:00:00'),
(  11, 22, 32, 111.8, 0, '2025-10-04 03:00:00'),
(  12, 16, 48, 87.2, 0, '2025-10-04 07:00:00'),
(  13, 16, 117, 61.1, 0, '2025-10-04 11:00:00'),
(  14, 15, 172, 76.0, 0, '2025-10-04 15:00:00'),
(  15, 16, 128, 21.5, 0, '2025-10-04 19:00:00'),
(  16, 12, 216, 34.3, 0, '2025-10-04 23:00:00'),
(  17, 22, 59, 197.4, 1, '2025-10-05 03:00:00'),
(  18, 16, 217, 57.5, 0, '2025-10-05 07:00:00'),
(  19, 24, 75, 80.4, 0, '2025-10-05 11:00:00'),
(  20, 24, 236, 69.0, 0, '2025-10-05 15:00:00'),
(  21, 14, 191, 52.3, 0, '2025-10-05 19:00:00'),
(  22, 19, 99, 33.2, 0, '2025-10-05 23:00:00'),
(  23, 21, 213, 60.2, 0, '2025-10-06 03:00:00'),
(  24, 12, 64, 61.3, 0, '2025-10-06 07:00:00'),
(  25, 21, 239, 74.9, 0, '2025-10-06 11:00:00'),
(  26, 16, 132, 109.7, 0, '2025-10-06 15:00:00'),
(  27, 20, 146, 39.4, 0, '2025-10-06 19:00:00'),
(  28, 15, 99, 180.1, 1, '2025-10-06 23:00:00'),
(  29, 16, 203, 55.5, 0, '2025-10-07 03:00:00'),
(  30, 19, 19, 32.2, 0, '2025-10-07 07:00:00'),
(  31, 13, 49, 64.1, 0, '2025-10-07 11:00:00'),
(  32, 14, 100, 84.4, 0, '2025-10-07 15:00:00'),
(  33, 15, 206, 72.5, 0, '2025-10-07 19:00:00'),
(  34, 22, 116, 109.8, 0, '2025-10-07 23:00:00'),
(  35, 13, 78, 116.3, 0, '2025-10-08 03:00:00'),
(  36, 12, 158, 159.4, 0, '2025-10-08 07:00:00'),
(  37, 24, 84, 102.8, 0, '2025-10-08 11:00:00'),
(  38, 25, 196, 85.4, 0, '2025-10-08 15:00:00'),
(  39, 14, 252, 69.3, 0, '2025-10-08 19:00:00'),
(  40, 11, 41, 177.8, 1, '2025-10-08 23:00:00'),
(  41, 25, 30, 143.2, 0, '2025-10-09 03:00:00'),
(  42, 18, 266, 105.3, 0, '2025-10-09 07:00:00'),
(  43, 16, 4, 167.1, 1, '2025-10-09 11:00:00'),
(  44, 19, 198, 87.8, 0, '2025-10-09 15:00:00'),
(  45, 25, 181, 80.3, 0, '2025-10-09 19:00:00'),
(  46, 16, 139, 97.7, 0, '2025-10-09 23:00:00'),
(  47, 23, 152, 139.4, 0, '2025-10-10 03:00:00'),
(  48, 15, 233, 72.7, 0, '2025-10-10 07:00:00'),
(  49, 25, 51, 106.5, 0, '2025-10-10 11:00:00'),
(  50, 23, 157, 90.7, 0, '2025-10-10 15:00:00'),
(  51, 13, 133, 191.3, 1, '2025-10-10 19:00:00'),
(  52, 25, 222, 32.7, 0, '2025-10-10 23:00:00'),
(  53, 17, 146, 45.3, 0, '2025-10-11 03:00:00'),
(  54, 17, 5, 85.1, 0, '2025-10-11 07:00:00'),
(  55, 17, 169, 40.9, 0, '2025-10-11 11:00:00'),
(  56, 13, 7, 101.9, 0, '2025-10-11 15:00:00'),
(  57, 12, 137, 179.5, 1, '2025-10-11 19:00:00'),
(  58, 16, 85, 62.2, 0, '2025-10-11 23:00:00'),
(  59, 15, 173, 144.3, 0, '2025-10-12 03:00:00'),
(  60, 18, 31, 44.2, 0, '2025-10-12 07:00:00'),
(  61, 22, 9, 119.6, 0, '2025-10-12 11:00:00'),
(  62, 17, 265, 119.4, 0, '2025-10-12 15:00:00'),
(  63, 16, 19, 161.8, 1, '2025-10-12 19:00:00'),
(  64, 12, 171, 169.9, 1, '2025-10-12 23:00:00'),
(  65, 17, 23, 61.5, 0, '2025-10-13 03:00:00'),
(  66, 23, 47, 42.1, 0, '2025-10-13 07:00:00'),
(  67, 18, 61, 37.0, 0, '2025-10-13 11:00:00'),
(  68, 24, 7, 126.5, 0, '2025-10-13 15:00:00'),
(  69, 13, 129, 48.8, 0, '2025-10-13 19:00:00'),
(  70, 11, 210, 107.7, 0, '2025-10-13 23:00:00'),
(  71, 21, 106, 30.4, 0, '2025-10-14 03:00:00'),
(  72, 12, 264, 114.1, 0, '2025-10-14 07:00:00'),
(  73, 12, 154, 139.0, 0, '2025-10-14 11:00:00'),
(  74, 21, 269, 134.6, 0, '2025-10-14 15:00:00'),
(  75, 19, 175, 168.8, 1, '2025-10-14 19:00:00'),
(  76, 15, 273, 81.8, 0, '2025-10-14 23:00:00'),
(  77, 25, 195, 173.4, 1, '2025-10-15 03:00:00'),
(  78, 12, 48, 144.1, 0, '2025-10-15 07:00:00'),
(  79, 18, 64, 44.3, 0, '2025-10-15 11:00:00'),
(  80, 21, 199, 172.7, 1, '2025-10-15 15:00:00'),
(  81, 16, 192, 172.0, 1, '2025-10-15 19:00:00'),
(  82, 16, 111, 72.2, 0, '2025-10-15 23:00:00'),
(  83, 21, 209, 76.7, 0, '2025-10-16 03:00:00'),
(  84, 25, 216, 77.8, 0, '2025-10-16 07:00:00'),
(  85, 14, 246, 153.5, 0, '2025-10-16 11:00:00'),
(  86, 18, 174, 116.3, 0, '2025-10-16 15:00:00'),
(  87, 12, 112, 173.1, 1, '2025-10-16 19:00:00'),
(  88, 21, 21, 106.9, 0, '2025-10-16 23:00:00'),
(  89, 24, 265, 23.8, 0, '2025-10-17 03:00:00'),
(  90, 23, 41, 160.9, 1, '2025-10-17 07:00:00'),
(  91, 14, 148, 144.9, 0, '2025-10-17 11:00:00'),
(  92, 20, 209, 154.3, 0, '2025-10-17 15:00:00'),
(  93, 12, 229, 146.8, 0, '2025-10-17 19:00:00'),
(  94, 24, 145, 40.8, 0, '2025-10-17 23:00:00'),
(  95, 22, 90, 118.3, 0, '2025-10-18 03:00:00'),
(  96, 11, 15, 173.6, 1, '2025-10-18 07:00:00'),
(  97, 19, 83, 65.1, 0, '2025-10-18 11:00:00'),
(  98, 16, 238, 126.8, 0, '2025-10-18 15:00:00'),
(  99, 17, 189, 197.5, 1, '2025-10-18 19:00:00'),
( 100, 16, 170, 54.6, 0, '2025-10-18 23:00:00'),
( 101, 20, 89, 45.2, 0, '2025-10-19 03:00:00'),
( 102, 16, 167, 133.0, 0, '2025-10-19 07:00:00'),
( 103, 16, 265, 66.0, 0, '2025-10-19 11:00:00'),
( 104, 14, 277, 153.1, 0, '2025-10-19 15:00:00'),
( 105, 12, 191, 75.8, 0, '2025-10-19 19:00:00'),
( 106, 15, 70, 92.6, 0, '2025-10-19 23:00:00'),
( 107, 16, 166, 58.8, 0, '2025-10-20 03:00:00'),
( 108, 24, 121, 99.0, 0, '2025-10-20 07:00:00'),
( 109, 15, 55, 150.4, 0, '2025-10-20 11:00:00'),
( 110, 21, 157, 102.3, 0, '2025-10-20 15:00:00'),
( 111, 19, 60, 34.7, 0, '2025-10-20 19:00:00'),
( 112, 12, 36, 172.4, 1, '2025-10-20 23:00:00'),
( 113, 13, 236, 188.2, 1, '2025-10-21 03:00:00'),
( 114, 19, 188, 139.9, 0, '2025-10-21 07:00:00'),
( 115, 16, 49, 141.7, 0, '2025-10-21 11:00:00'),
( 116, 15, 160, 51.6, 0, '2025-10-21 15:00:00'),
( 117, 17, 114, 125.6, 0, '2025-10-21 19:00:00'),
( 118, 25, 137, 147.8, 0, '2025-10-21 23:00:00'),
( 119, 20, 278, 139.1, 0, '2025-10-22 03:00:00'),
( 120, 18, 137, 152.2, 0, '2025-10-22 07:00:00'),
( 121, 14, 276, 71.0, 0, '2025-10-22 11:00:00'),
( 122, 19, 207, 123.0, 0, '2025-10-22 15:00:00'),
( 123, 15, 50, 160.4, 1, '2025-10-22 19:00:00'),
( 124, 23, 164, 53.6, 0, '2025-10-22 23:00:00'),
( 125, 24, 251, 65.9, 0, '2025-10-23 03:00:00'),
( 126, 25, 17, 123.6, 0, '2025-10-23 07:00:00'),
( 127, 14, 24, 94.2, 0, '2025-10-23 11:00:00'),
( 128, 21, 127, 35.1, 0, '2025-10-23 15:00:00'),
( 129, 16, 270, 124.3, 0, '2025-10-23 19:00:00'),
( 130, 22, 242, 163.7, 1, '2025-10-23 23:00:00'),
( 131, 14, 88, 193.4, 1, '2025-10-24 03:00:00'),
( 132, 12, 150, 162.3, 1, '2025-10-24 07:00:00'),
( 133, 18, 4, 152.1, 0, '2025-10-24 11:00:00'),
( 134, 17, 244, 123.6, 0, '2025-10-24 15:00:00'),
( 135, 13, 240, 77.4, 0, '2025-10-24 19:00:00'),
( 136, 16, 209, 73.8, 0, '2025-10-24 23:00:00'),
( 137, 23, 140, 72.8, 0, '2025-10-25 03:00:00'),
( 138, 21, 100, 102.5, 0, '2025-10-25 07:00:00'),
( 139, 22, 71, 134.0, 0, '2025-10-25 11:00:00'),
( 140, 14, 237, 116.6, 0, '2025-10-25 15:00:00');


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SEED
-- ============================================================================
