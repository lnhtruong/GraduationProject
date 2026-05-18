-- ============================================================================
-- SEED DATA for GraduationProject (LMS demo)
-- ----------------------------------------------------------------------------
-- Run AFTER `yarn migrate` (Knex migrations) so all tables already exist.
-- Covers every table including the highlight_feed family:
--   - highlight_feed entries seeded from imported course highlight data
--   - feed_comments / feed_interactions / feed_views are left empty (user-generated)
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
(  32, 6, NULL, 'highlight', 'Creating the First HTML Document', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779001782/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/3/highlight_topic3_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 197.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779001782/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/3/highlight_topic3_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t3', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  33, 6, NULL, 'highlight', 'Creating Hyperlinks', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779001953/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/7/highlight_topic7_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 159.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779001953/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/7/highlight_topic7_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t7', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  34, 6, NULL, 'highlight', 'Inserting Images into HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002132/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/8/highlight_topic8_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 196.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002132/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/8/highlight_topic8_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t8', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  35, 6, NULL, 'highlight', 'Adding Audio to a Web Page', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002290/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/9/highlight_topic9_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 129.80, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002290/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/9/highlight_topic9_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t9', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  36, 6, NULL, 'highlight', 'Embedding Videos in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002454/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/10/highlight_topic10_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 131.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002454/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/10/highlight_topic10_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t10', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  37, 6, NULL, 'highlight', 'Creating Lists in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002631/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/12/highlight_topic12_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 195.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002631/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/12/highlight_topic12_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t12', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  38, 6, NULL, 'highlight', 'Creating Tables in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002811/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/13/highlight_topic13_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 197.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002811/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/13/highlight_topic13_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t13', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  39, 6, NULL, 'highlight', 'Adding Color to Web Pages', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002988/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/14/highlight_topic14_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 196.40, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002988/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/14/highlight_topic14_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t14', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  40, 6, NULL, 'highlight', 'Using Span and Div Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779003151/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/15/highlight_topic15_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 137.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779003151/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/15/highlight_topic15_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t15', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  41, 6, NULL, 'highlight', 'Understanding Meta Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779003329/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/16/highlight_topic16_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 197.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779003329/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/16/highlight_topic16_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t16', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  42, 6, NULL, 'highlight', 'Using iFrames in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779003516/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/17/highlight_topic17_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 196.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779003516/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/17/highlight_topic17_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t17', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  43, 6, NULL, 'highlight', 'Creating Buttons in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779003692/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/18/highlight_topic18_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 196.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779003692/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/18/highlight_topic18_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t18', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
(  44, 6, NULL, 'highlight', 'Building Forms in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779003877/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/19/highlight_topic19_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.mp4', 199.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779003877/jobs/70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1/topics/19/highlight_topic19_70f119e7-2b55-46b5-8a9c-3b48f0c6c6e1.jpg', NULL, NULL, 'highlight-70f119e7-t19', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
(  45, 6, NULL, 'highlight', 'Step-by-Step Guide to Registering for ChatGPT', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1778939391/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/5/highlight_topic5_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1778939391/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/5/highlight_topic5_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.jpg', NULL, NULL, 'highlight-89666a6b-t5', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  46, 6, NULL, 'highlight', 'Analyzing Data with ChatGPT', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1778940085/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/11/highlight_topic11_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1778940085/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/11/highlight_topic11_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.jpg', NULL, NULL, 'highlight-89666a6b-t11', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  47, 6, NULL, 'highlight', 'Creating Content with ChatGPT', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1778940796/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/14/highlight_topic14_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1778940796/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/14/highlight_topic14_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.jpg', NULL, NULL, 'highlight-89666a6b-t14', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  48, 6, NULL, 'highlight', 'Building a Chatbot with ChatGPT', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1778941482/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/15/highlight_topic15_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1778941482/jobs/89666a6b-d23c-4b06-a941-ce90dcf1ce6d/topics/15/highlight_topic15_89666a6b-d23c-4b06-a941-ce90dcf1ce6d.jpg', NULL, NULL, 'highlight-89666a6b-t15', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  49, 6, NULL, 'highlight', 'Applications of Machine Learning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002211/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/5/highlight_topic5_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 133.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002211/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/5/highlight_topic5_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t5', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  50, 6, NULL, 'highlight', 'Key Terms in Data Science', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002892/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/7/highlight_topic7_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 197.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002892/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/7/highlight_topic7_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t7', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  51, 6, NULL, 'highlight', 'Types of Machine Learning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779003567/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/8/highlight_topic8_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 194.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779003567/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/8/highlight_topic8_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t8', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  52, 6, NULL, 'highlight', 'Common Machine Learning Models', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779004094/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/12/highlight_topic12_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 197.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779004094/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/12/highlight_topic12_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t12', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  53, 6, NULL, 'highlight', 'Linear Regression Explained', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779004510/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/13/highlight_topic13_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 197.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779004510/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/13/highlight_topic13_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t13', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  54, 6, NULL, 'highlight', 'Decision Trees', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779005146/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/14/highlight_topic14_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 199.40, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779005146/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/14/highlight_topic14_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t14', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  55, 6, NULL, 'highlight', 'Ensemble Methods: Bagging and Random Forest', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779005859/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/15/highlight_topic15_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 194.40, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779005859/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/15/highlight_topic15_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t15', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  56, 6, NULL, 'highlight', 'Boosting Techniques', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779006546/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/16/highlight_topic16_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 137.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779006546/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/16/highlight_topic16_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t16', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  57, 6, NULL, 'highlight', 'Support Vector Machines', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779007250/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/17/highlight_topic17_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 196.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779007250/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/17/highlight_topic17_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t17', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  58, 6, NULL, 'highlight', 'K-Nearest Neighbors Algorithm', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779007754/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/18/highlight_topic18_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 186.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779007754/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/18/highlight_topic18_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t18', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  59, 6, NULL, 'highlight', 'Logistic Regression', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779008132/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/19/highlight_topic19_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 197.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779008132/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/19/highlight_topic19_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t19', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  60, 6, NULL, 'highlight', 'Neural Networks Overview', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779008515/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/20/highlight_topic20_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 197.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779008515/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/20/highlight_topic20_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t20', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
(  61, 6, NULL, 'highlight', 'Clustering and K-Means', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779008898/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/21/highlight_topic21_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 195.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779008898/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/21/highlight_topic21_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t21', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
(  62, 6, NULL, 'highlight', 'Model Performance Evaluation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779009285/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/22/highlight_topic22_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 199.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779009285/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/22/highlight_topic22_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t22', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
(  63, 6, NULL, 'highlight', 'Best Practices in Data Science', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779009672/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/23/highlight_topic23_77e55434-4acf-4746-90e9-cdcc74f7e77b.mp4', 194.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779009672/jobs/77e55434-4acf-4746-90e9-cdcc74f7e77b/topics/23/highlight_topic23_77e55434-4acf-4746-90e9-cdcc74f7e77b.jpg', NULL, NULL, 'highlight-77e55434-t23', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
(  64, 5, NULL, 'highlight', 'Building a Single Server Setup', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779005202/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/3/highlight_topic3_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 194.80, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779005202/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/3/highlight_topic3_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t3', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  65, 5, NULL, 'highlight', 'Database Selection: SQL vs NoSQL', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779005500/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/5/highlight_topic5_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 192.40, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779005500/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/5/highlight_topic5_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t5', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  66, 5, NULL, 'highlight', 'Scaling Strategies: Vertical vs Horizontal', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779005794/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/6/highlight_topic6_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 185.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779005794/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/6/highlight_topic6_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t6', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  67, 5, NULL, 'highlight', 'Load Balancing Techniques', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779006088/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/7/highlight_topic7_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 199.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779006088/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/7/highlight_topic7_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t7', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  68, 5, NULL, 'highlight', 'Avoiding Single Points of Failure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779006386/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/8/highlight_topic8_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 198.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779006386/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/8/highlight_topic8_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t8', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  69, 5, NULL, 'highlight', 'API Design Principles', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779006687/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/9/highlight_topic9_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 200.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779006687/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/9/highlight_topic9_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t9', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  70, 5, NULL, 'highlight', 'RESTful APIs vs GraphQL', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779006986/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/10/highlight_topic10_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 195.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779006986/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/10/highlight_topic10_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t10', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  71, 5, NULL, 'highlight', 'Authentication and Authorization', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779007269/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/11/highlight_topic11_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 195.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779007269/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/11/highlight_topic11_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t11', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  72, 5, NULL, 'highlight', 'Securing APIs', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779007558/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/12/highlight_topic12_a56e3dc5-c6d4-489a-ac54-a231625435e1.mp4', 199.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779007558/jobs/a56e3dc5-c6d4-489a-ac54-a231625435e1/topics/12/highlight_topic12_a56e3dc5-c6d4-489a-ac54-a231625435e1.jpg', NULL, NULL, 'highlight-a56e3dc5-t12', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  73, 5, NULL, 'highlight', 'Thao tác xóa nút trong cây nhị phân tìm kiếm', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779014626/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/7/highlight_topic7_ff372b14-88f6-43cd-9fd3-c1d983003829.mp4', 197.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779014626/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/7/highlight_topic7_ff372b14-88f6-43cd-9fd3-c1d983003829.jpg', NULL, NULL, 'highlight-ff372b14-t7', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  74, 5, NULL, 'highlight', 'Các trường hợp xóa nút trong cây nhị phân', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779015383/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/9/highlight_topic9_ff372b14-88f6-43cd-9fd3-c1d983003829.mp4', 195.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779015383/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/9/highlight_topic9_ff372b14-88f6-43cd-9fd3-c1d983003829.jpg', NULL, NULL, 'highlight-ff372b14-t9', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  75, 5, NULL, 'highlight', 'Cách thực hiện xóa nút', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016155/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/10/highlight_topic10_ff372b14-88f6-43cd-9fd3-c1d983003829.mp4', 196.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016155/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/10/highlight_topic10_ff372b14-88f6-43cd-9fd3-c1d983003829.jpg', NULL, NULL, 'highlight-ff372b14-t10', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  76, 5, NULL, 'highlight', 'Thực hiện xóa nút trong mã nguồn', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016917/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/11/highlight_topic11_ff372b14-88f6-43cd-9fd3-c1d983003829.mp4', 197.80, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016917/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/11/highlight_topic11_ff372b14-88f6-43cd-9fd3-c1d983003829.jpg', NULL, NULL, 'highlight-ff372b14-t11', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  77, 5, NULL, 'highlight', 'Duyệt cây nhị phân', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779017678/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/13/highlight_topic13_ff372b14-88f6-43cd-9fd3-c1d983003829.mp4', 198.20, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779017678/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/13/highlight_topic13_ff372b14-88f6-43cd-9fd3-c1d983003829.jpg', NULL, NULL, 'highlight-ff372b14-t13', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  78, 5, NULL, 'highlight', 'Tìm chiều cao của cây nhị phân', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018424/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/14/highlight_topic14_ff372b14-88f6-43cd-9fd3-c1d983003829.mp4', 192.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018424/jobs/ff372b14-88f6-43cd-9fd3-c1d983003829/topics/14/highlight_topic14_ff372b14-88f6-43cd-9fd3-c1d983003829.jpg', NULL, NULL, 'highlight-ff372b14-t14', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  79, 7, NULL, 'highlight', 'Section 1-1500', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002490/jobs/53c8e078-5988-4971-aaf2-19a72464d631/topics/1/highlight_topic1_53c8e078-5988-4971-aaf2-19a72464d631.mp4', 199.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002490/jobs/53c8e078-5988-4971-aaf2-19a72464d631/topics/1/highlight_topic1_53c8e078-5988-4971-aaf2-19a72464d631.jpg', NULL, NULL, 'highlight-53c8e078-t1', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  80, 7, NULL, 'highlight', 'Section 1501-3000', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002657/jobs/53c8e078-5988-4971-aaf2-19a72464d631/topics/2/highlight_topic2_53c8e078-5988-4971-aaf2-19a72464d631.mp4', 196.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002657/jobs/53c8e078-5988-4971-aaf2-19a72464d631/topics/2/highlight_topic2_53c8e078-5988-4971-aaf2-19a72464d631.jpg', NULL, NULL, 'highlight-53c8e078-t2', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  81, 7, NULL, 'highlight', 'Section 3001-3537', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779002821/jobs/53c8e078-5988-4971-aaf2-19a72464d631/topics/3/highlight_topic3_53c8e078-5988-4971-aaf2-19a72464d631.mp4', 198.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779002821/jobs/53c8e078-5988-4971-aaf2-19a72464d631/topics/3/highlight_topic3_53c8e078-5988-4971-aaf2-19a72464d631.jpg', NULL, NULL, 'highlight-53c8e078-t3', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  82, 7, NULL, 'highlight', 'Section 1-1500', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027005/jobs/8bbc76d7-8789-4f81-83a0-812f25bec6b8/topics/1/highlight_topic1_8bbc76d7-8789-4f81-83a0-812f25bec6b8.mp4', 199.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027005/jobs/8bbc76d7-8789-4f81-83a0-812f25bec6b8/topics/1/highlight_topic1_8bbc76d7-8789-4f81-83a0-812f25bec6b8.jpg', NULL, NULL, 'highlight-8bbc76d7-t1', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  83, 7, NULL, 'highlight', 'Section 1501-2064', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027120/jobs/8bbc76d7-8789-4f81-83a0-812f25bec6b8/topics/2/highlight_topic2_8bbc76d7-8789-4f81-83a0-812f25bec6b8.mp4', 199.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027120/jobs/8bbc76d7-8789-4f81-83a0-812f25bec6b8/topics/2/highlight_topic2_8bbc76d7-8789-4f81-83a0-812f25bec6b8.jpg', NULL, NULL, 'highlight-8bbc76d7-t2', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  84, 7, NULL, 'highlight', 'Section 1-1500', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027666/jobs/628101cc-20cd-4204-9c78-2f59dd70c249/topics/1/highlight_topic1_628101cc-20cd-4204-9c78-2f59dd70c249.mp4', 200.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027666/jobs/628101cc-20cd-4204-9c78-2f59dd70c249/topics/1/highlight_topic1_628101cc-20cd-4204-9c78-2f59dd70c249.jpg', NULL, NULL, 'highlight-628101cc-t1', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  85, 7, NULL, 'highlight', 'Section 1501-1739', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027803/jobs/628101cc-20cd-4204-9c78-2f59dd70c249/topics/2/highlight_topic2_628101cc-20cd-4204-9c78-2f59dd70c249.mp4', 195.20, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027803/jobs/628101cc-20cd-4204-9c78-2f59dd70c249/topics/2/highlight_topic2_628101cc-20cd-4204-9c78-2f59dd70c249.jpg', NULL, NULL, 'highlight-628101cc-t2', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  86, 8, NULL, 'highlight', 'Setting Up Power BI Desktop', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018798/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/6/highlight_topic6_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018798/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/6/highlight_topic6_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t6', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  87, 8, NULL, 'highlight', 'Connecting Data to Power BI', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018963/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/8/highlight_topic8_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018963/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/8/highlight_topic8_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t8', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  88, 8, NULL, 'highlight', 'Data Transformation and Cleaning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779019135/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/9/highlight_topic9_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779019135/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/9/highlight_topic9_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t9', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  89, 8, NULL, 'highlight', 'Understanding Data Types', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779019302/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/11/highlight_topic11_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779019302/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/11/highlight_topic11_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t11', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  90, 8, NULL, 'highlight', 'Connecting and Transforming Data', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779019468/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/12/highlight_topic12_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779019468/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/12/highlight_topic12_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t12', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  91, 8, NULL, 'highlight', 'Designing a Business Dashboard', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779019641/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/14/highlight_topic14_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779019641/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/14/highlight_topic14_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t14', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  92, 8, NULL, 'highlight', 'Key Performance Indicators (KPIs) Setup', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779019814/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/15/highlight_topic15_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779019814/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/15/highlight_topic15_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t15', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  93, 8, NULL, 'highlight', 'Advanced Visualization Techniques', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779019986/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/16/highlight_topic16_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779019986/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/16/highlight_topic16_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t16', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  94, 8, NULL, 'highlight', 'Implementing Slicers for Data Filtering', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779020151/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/22/highlight_topic22_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779020151/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/22/highlight_topic22_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t22', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  95, 8, NULL, 'highlight', 'Exporting and Sharing Reports', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779020320/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/24/highlight_topic24_c14d7d01-aa96-4e6f-9462-efa6051acade.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779020320/jobs/c14d7d01-aa96-4e6f-9462-efa6051acade/topics/24/highlight_topic24_c14d7d01-aa96-4e6f-9462-efa6051acade.jpg', NULL, NULL, 'highlight-c14d7d01-t24', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  96, 8, NULL, 'highlight', 'Customer Attraction Techniques', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022524/jobs/44c01718-043c-4a7c-ad03-6afa4d676b89/topics/15/highlight_topic15_44c01718-043c-4a7c-ad03-6afa4d676b89.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022524/jobs/44c01718-043c-4a7c-ad03-6afa4d676b89/topics/15/highlight_topic15_44c01718-043c-4a7c-ad03-6afa4d676b89.jpg', NULL, NULL, 'highlight-44c01718-t15', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  97, 8, NULL, 'highlight', 'Discount Techniques and Pricing Strategies', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022625/jobs/44c01718-043c-4a7c-ad03-6afa4d676b89/topics/18/highlight_topic18_44c01718-043c-4a7c-ad03-6afa4d676b89.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022625/jobs/44c01718-043c-4a7c-ad03-6afa4d676b89/topics/18/highlight_topic18_44c01718-043c-4a7c-ad03-6afa4d676b89.jpg', NULL, NULL, 'highlight-44c01718-t18', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  98, 8, NULL, 'highlight', 'Differences Between Digital and Traditional Marketing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023906/jobs/2c3a12bd-5d1d-45e1-b4ba-d55c85409720/topics/4/highlight_topic4_2c3a12bd-5d1d-45e1-b4ba-d55c85409720.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023906/jobs/2c3a12bd-5d1d-45e1-b4ba-d55c85409720/topics/4/highlight_topic4_2c3a12bd-5d1d-45e1-b4ba-d55c85409720.jpg', NULL, NULL, 'highlight-2c3a12bd-t4', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  99, 8, NULL, 'highlight', 'Using Facts to Enhance Credibility', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779025542/jobs/2997f0b2-d456-4be0-85af-ab2d97323a9f/topics/9/highlight_topic9_2997f0b2-d456-4be0-85af-ab2d97323a9f.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779025542/jobs/2997f0b2-d456-4be0-85af-ab2d97323a9f/topics/9/highlight_topic9_2997f0b2-d456-4be0-85af-ab2d97323a9f.jpg', NULL, NULL, 'highlight-2997f0b2-t9', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 100, 8, NULL, 'highlight', 'The Role of Experience in Writing', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779025652/jobs/2997f0b2-d456-4be0-85af-ab2d97323a9f/topics/20/highlight_topic20_2997f0b2-d456-4be0-85af-ab2d97323a9f.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779025652/jobs/2997f0b2-d456-4be0-85af-ab2d97323a9f/topics/20/highlight_topic20_2997f0b2-d456-4be0-85af-ab2d97323a9f.jpg', NULL, NULL, 'highlight-2997f0b2-t20', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 101, 8, NULL, 'highlight', 'Website Bloat and Pruning', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779026861/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/15/highlight_topic15_aa46b9d9-5e62-4761-93ec-b09b94d0510b.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779026861/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/15/highlight_topic15_aa46b9d9-5e62-4761-93ec-b09b94d0510b.jpg', NULL, NULL, 'highlight-aa46b9d9-t15', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 102, 8, NULL, 'highlight', 'Updating Existing Content', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027009/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/47/highlight_topic47_aa46b9d9-5e62-4761-93ec-b09b94d0510b.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027009/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/47/highlight_topic47_aa46b9d9-5e62-4761-93ec-b09b94d0510b.jpg', NULL, NULL, 'highlight-aa46b9d9-t47', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 103, 8, NULL, 'highlight', 'Originality and Accuracy in Content', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027162/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/51/highlight_topic51_aa46b9d9-5e62-4761-93ec-b09b94d0510b.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027162/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/51/highlight_topic51_aa46b9d9-5e62-4761-93ec-b09b94d0510b.jpg', NULL, NULL, 'highlight-aa46b9d9-t51', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 104, 8, NULL, 'highlight', 'Trust and Safety of Content', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027313/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/52/highlight_topic52_aa46b9d9-5e62-4761-93ec-b09b94d0510b.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027313/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/52/highlight_topic52_aa46b9d9-5e62-4761-93ec-b09b94d0510b.jpg', NULL, NULL, 'highlight-aa46b9d9-t52', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 105, 8, NULL, 'highlight', 'Citing Sources and First-Hand Experience', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027462/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/54/highlight_topic54_aa46b9d9-5e62-4761-93ec-b09b94d0510b.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027462/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/54/highlight_topic54_aa46b9d9-5e62-4761-93ec-b09b94d0510b.jpg', NULL, NULL, 'highlight-aa46b9d9-t54', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 106, 8, NULL, 'highlight', 'Schema Markup and Its Importance', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027610/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/56/highlight_topic56_aa46b9d9-5e62-4761-93ec-b09b94d0510b.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027610/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/56/highlight_topic56_aa46b9d9-5e62-4761-93ec-b09b94d0510b.jpg', NULL, NULL, 'highlight-aa46b9d9-t56', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 107, 8, NULL, 'highlight', 'Internal Linking Strategies', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027758/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/57/highlight_topic57_aa46b9d9-5e62-4761-93ec-b09b94d0510b.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027758/jobs/aa46b9d9-5e62-4761-93ec-b09b94d0510b/topics/57/highlight_topic57_aa46b9d9-5e62-4761-93ec-b09b94d0510b.jpg', NULL, NULL, 'highlight-aa46b9d9-t57', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
( 108, 4, NULL, 'highlight', 'Cấu hình desktop và phân vùng ổ cứng', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022549/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/2/highlight_topic2_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 109.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022549/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/2/highlight_topic2_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t2', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 109, 4, NULL, 'highlight', 'Cài đặt WSL (Windows Subsystem for Linux)', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022666/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/4/highlight_topic4_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 129.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022666/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/4/highlight_topic4_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t4', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 110, 4, NULL, 'highlight', 'Cài đặt Chocolatey', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022780/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/8/highlight_topic8_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 82.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022780/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/8/highlight_topic8_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t8', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 111, 4, NULL, 'highlight', 'Cấu hình file hosts cho dự án', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022891/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/9/highlight_topic9_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 60.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022891/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/9/highlight_topic9_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t9', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 112, 4, NULL, 'highlight', 'Cài đặt và cấu hình Anionic', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023010/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/16/highlight_topic16_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 136.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023010/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/16/highlight_topic16_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t16', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 113, 4, NULL, 'highlight', 'Cấu hình Nginx', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023137/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/17/highlight_topic17_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 195.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023137/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/17/highlight_topic17_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t17', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 114, 4, NULL, 'highlight', 'Cài đặt PHP và cấu hình', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023261/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/18/highlight_topic18_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 196.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023261/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/18/highlight_topic18_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t18', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
( 115, 4, NULL, 'highlight', 'Cấu hình tài khoản admin', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023376/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/26/highlight_topic26_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 87.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023376/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/26/highlight_topic26_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t26', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
( 116, 4, NULL, 'highlight', 'Tạo script khởi động', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023489/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/29/highlight_topic29_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 74.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023489/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/29/highlight_topic29_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t29', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
( 117, 4, NULL, 'highlight', 'Tổng kết và hướng dẫn tiếp theo', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023600/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/30/highlight_topic30_e535f160-7048-4af7-b70d-b481bb57707e.mp4', 60.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023600/jobs/e535f160-7048-4af7-b70d-b481bb57707e/topics/30/highlight_topic30_e535f160-7048-4af7-b70d-b481bb57707e.jpg', NULL, NULL, 'highlight-e535f160-t30', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
( 118, 4, NULL, 'highlight', 'Sự thay đổi trong chính sách bảo mật của trình duyệt', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779024572/jobs/7eba012f-98c7-4b03-8b7f-f157c907d3f5/topics/12/highlight_topic12_7eba012f-98c7-4b03-8b7f-f157c907d3f5.mp4', 182.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779024572/jobs/7eba012f-98c7-4b03-8b7f-f157c907d3f5/topics/12/highlight_topic12_7eba012f-98c7-4b03-8b7f-f157c907d3f5.jpg', NULL, NULL, 'highlight-7eba012f-t12', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
( 119, 4, NULL, 'highlight', 'Setting Up Your Development Environment', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027639/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/2/highlight_topic2_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 83.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027639/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/2/highlight_topic2_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t2', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 120, 4, NULL, 'highlight', 'Basic HTML Document Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027723/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/3/highlight_topic3_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 199.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027723/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/3/highlight_topic3_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t3', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 121, 4, NULL, 'highlight', 'HTML Tags and Elements', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027807/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/4/highlight_topic4_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 183.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027807/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/4/highlight_topic4_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t4', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 122, 4, NULL, 'highlight', 'Creating Hyperlinks', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027886/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/6/highlight_topic6_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 159.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027886/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/6/highlight_topic6_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t6', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 123, 4, NULL, 'highlight', 'Inserting Images', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779027968/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/7/highlight_topic7_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 196.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779027968/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/7/highlight_topic7_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t7', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 124, 4, NULL, 'highlight', 'Adding Audio to a Web Page', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028044/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/8/highlight_topic8_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 129.80, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028044/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/8/highlight_topic8_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t8', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 125, 4, NULL, 'highlight', 'Embedding Videos', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028121/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/9/highlight_topic9_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 131.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028121/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/9/highlight_topic9_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t9', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
( 126, 4, NULL, 'highlight', 'Text Formatting Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028196/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/10/highlight_topic10_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 112.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028196/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/10/highlight_topic10_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t10', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
( 127, 4, NULL, 'highlight', 'Creating Lists in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028279/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/11/highlight_topic11_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 195.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028279/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/11/highlight_topic11_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t11', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
( 128, 4, NULL, 'highlight', 'Creating Tables in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028367/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/12/highlight_topic12_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 197.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028367/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/12/highlight_topic12_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t12', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
( 129, 4, NULL, 'highlight', 'Adding Color to Web Pages', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028452/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/13/highlight_topic13_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 196.40, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028452/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/13/highlight_topic13_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t13', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
( 130, 4, NULL, 'highlight', 'Understanding Span and Div Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028533/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/14/highlight_topic14_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 137.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028533/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/14/highlight_topic14_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t14', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
( 131, 4, NULL, 'highlight', 'Using Meta Tags', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028618/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/15/highlight_topic15_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 196.20, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028618/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/15/highlight_topic15_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t15', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
( 132, 4, NULL, 'highlight', 'Embedding Content with iFrames', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028704/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/16/highlight_topic16_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 196.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028704/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/16/highlight_topic16_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t16', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
( 133, 4, NULL, 'highlight', 'Creating Buttons in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028789/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/17/highlight_topic17_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 195.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028789/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/17/highlight_topic17_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t17', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
( 134, 4, NULL, 'highlight', 'Building Forms in HTML', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779028874/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/18/highlight_topic18_dec92041-b410-483f-b4ab-0c8e073752f6.mp4', 199.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779028874/jobs/dec92041-b410-483f-b4ab-0c8e073752f6/topics/18/highlight_topic18_dec92041-b410-483f-b4ab-0c8e073752f6.jpg', NULL, NULL, 'highlight-dec92041-t18', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
( 135, 4, NULL, 'highlight', 'Introduction to Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779029364/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/1/highlight_topic1_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 157.20, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779029364/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/1/highlight_topic1_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t1', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
( 136, 4, NULL, 'highlight', 'Node.js Architecture', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779029462/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/2/highlight_topic2_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 173.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779029462/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/2/highlight_topic2_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t2', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
( 137, 4, NULL, 'highlight', 'Asynchronous Nature of Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779029559/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/3/highlight_topic3_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 196.60, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779029559/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/3/highlight_topic3_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t3', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
( 138, 4, NULL, 'highlight', 'Installing Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779029653/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/4/highlight_topic4_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 156.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779029653/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/4/highlight_topic4_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t4', '2025-10-02 16:00:00', '2025-10-02 16:00:00'),
( 139, 4, NULL, 'highlight', 'Creating Your First Node.js Application', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779029746/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/5/highlight_topic5_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 134.20, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779029746/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/5/highlight_topic5_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t5', '2025-10-02 17:00:00', '2025-10-02 17:00:00'),
( 140, 4, NULL, 'highlight', 'Node.js Module System', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779029849/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/6/highlight_topic6_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 197.20, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779029849/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/6/highlight_topic6_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t6', '2025-10-02 18:00:00', '2025-10-02 18:00:00'),
( 141, 4, NULL, 'highlight', 'Creating and Using Modules', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779029952/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/7/highlight_topic7_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 198.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779029952/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/7/highlight_topic7_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t7', '2025-10-02 19:00:00', '2025-10-02 19:00:00'),
( 142, 4, NULL, 'highlight', 'Built-in Modules in Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779030050/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/8/highlight_topic8_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 198.40, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779030050/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/8/highlight_topic8_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t8', '2025-10-02 20:00:00', '2025-10-02 20:00:00'),
( 143, 4, NULL, 'highlight', 'Working with the File System', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779030149/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/9/highlight_topic9_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 198.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779030149/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/9/highlight_topic9_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t9', '2025-10-03 09:00:00', '2025-10-03 09:00:00'),
( 144, 4, NULL, 'highlight', 'Event Handling in Node.js', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779030248/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/10/highlight_topic10_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 198.90, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779030248/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/10/highlight_topic10_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t10', '2025-10-03 10:00:00', '2025-10-03 10:00:00'),
( 145, 4, NULL, 'highlight', 'Creating an HTTP Server', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779030350/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/11/highlight_topic11_38d38183-f5b0-4a6d-a09e-0f04f8988013.mp4', 199.10, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779030350/jobs/38d38183-f5b0-4a6d-a09e-0f04f8988013/topics/11/highlight_topic11_38d38183-f5b0-4a6d-a09e-0f04f8988013.jpg', NULL, NULL, 'highlight-38d38183-t11', '2025-10-03 11:00:00', '2025-10-03 11:00:00'),
( 146, 4, NULL, 'highlight', 'Primitive Data Types', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779030938/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/7/highlight_topic7_6e35b605-83e3-46ae-99fb-151957e208df.mp4', 154.70, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779030938/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/7/highlight_topic7_6e35b605-83e3-46ae-99fb-151957e208df.jpg', NULL, NULL, 'highlight-6e35b605-t7', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 147, 4, NULL, 'highlight', 'Dynamic Typing in JavaScript', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779031000/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/8/highlight_topic8_6e35b605-83e3-46ae-99fb-151957e208df.mp4', 122.80, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779031000/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/8/highlight_topic8_6e35b605-83e3-46ae-99fb-151957e208df.jpg', NULL, NULL, 'highlight-6e35b605-t8', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 148, 4, NULL, 'highlight', 'Introduction to Objects', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779031065/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/9/highlight_topic9_6e35b605-83e3-46ae-99fb-151957e208df.mp4', 132.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779031065/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/9/highlight_topic9_6e35b605-83e3-46ae-99fb-151957e208df.jpg', NULL, NULL, 'highlight-6e35b605-t9', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 149, 4, NULL, 'highlight', 'Accessing Object Properties', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779031129/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/10/highlight_topic10_6e35b605-83e3-46ae-99fb-151957e208df.mp4', 130.00, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779031129/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/10/highlight_topic10_6e35b605-83e3-46ae-99fb-151957e208df.jpg', NULL, NULL, 'highlight-6e35b605-t10', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 150, 4, NULL, 'highlight', 'Introduction to Arrays', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779031200/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/11/highlight_topic11_6e35b605-83e3-46ae-99fb-151957e208df.mp4', 195.50, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779031200/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/11/highlight_topic11_6e35b605-83e3-46ae-99fb-151957e208df.jpg', NULL, NULL, 'highlight-6e35b605-t11', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 151, 4, NULL, 'highlight', 'Functions in JavaScript', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779031272/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/12/highlight_topic12_6e35b605-83e3-46ae-99fb-151957e208df.mp4', 199.30, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779031272/jobs/6e35b605-83e3-46ae-99fb-151957e208df/topics/12/highlight_topic12_6e35b605-83e3-46ae-99fb-151957e208df.jpg', NULL, NULL, 'highlight-6e35b605-t12', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 152, 2, NULL, 'highlight', 'Adjective Functions of Participles', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779015007/jobs/c52a18f1-520e-4958-a921-f61d60e95ebe/topics/6/highlight_topic6_c52a18f1-520e-4958-a921-f61d60e95ebe.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779015007/jobs/c52a18f1-520e-4958-a921-f61d60e95ebe/topics/6/highlight_topic6_c52a18f1-520e-4958-a921-f61d60e95ebe.jpg', NULL, NULL, 'highlight-c52a18f1-t6', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 153, 2, NULL, 'highlight', 'First Role of Two-Verb: Infinitive as a Complement', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016315/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/2/highlight_topic2_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016315/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/2/highlight_topic2_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t2', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 154, 2, NULL, 'highlight', 'Second Role of Two-Verb: Infinitive as a Subject', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016383/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/3/highlight_topic3_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016383/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/3/highlight_topic3_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t3', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 155, 2, NULL, 'highlight', 'Third Role of Two-Verb: Expressing Purpose', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016449/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/4/highlight_topic4_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016449/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/4/highlight_topic4_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t4', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 156, 2, NULL, 'highlight', 'Fourth Role of Two-Verb: Following Adjectives', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016516/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/5/highlight_topic5_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016516/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/5/highlight_topic5_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t5', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 157, 2, NULL, 'highlight', 'Understanding Verb Patterns', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016581/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/13/highlight_topic13_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016581/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/13/highlight_topic13_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t13', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 158, 2, NULL, 'highlight', 'Examples of Verb Usage', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016649/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/14/highlight_topic14_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016649/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/14/highlight_topic14_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t14', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
( 159, 2, NULL, 'highlight', 'Special Verb Forms', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016715/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/15/highlight_topic15_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016715/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/15/highlight_topic15_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t15', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
( 160, 2, NULL, 'highlight', 'Common Mistakes with Verb Forms', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016784/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/16/highlight_topic16_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016784/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/16/highlight_topic16_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t16', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
( 161, 2, NULL, 'highlight', 'Practice Exercises Introduction', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016850/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/17/highlight_topic17_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016850/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/17/highlight_topic17_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t17', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
( 162, 2, NULL, 'highlight', 'Analyzing Practice Questions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779016934/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/18/highlight_topic18_9f78b24e-efa8-4d67-9e40-526318944dbc.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779016934/jobs/9f78b24e-efa8-4d67-9e40-526318944dbc/topics/18/highlight_topic18_9f78b24e-efa8-4d67-9e40-526318944dbc.jpg', NULL, NULL, 'highlight-9f78b24e-t18', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
( 163, 2, NULL, 'highlight', 'Introduction to English Tenses', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779017896/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/1/highlight_topic1_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779017896/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/1/highlight_topic1_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t1', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
( 164, 2, NULL, 'highlight', 'Present Simple Tense: Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018005/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/2/highlight_topic2_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018005/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/2/highlight_topic2_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t2', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
( 165, 2, NULL, 'highlight', 'Present Simple Tense: Examples', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018110/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/3/highlight_topic3_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018110/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/3/highlight_topic3_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t3', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
( 166, 2, NULL, 'highlight', 'Present Simple Tense: Question Formation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018217/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/4/highlight_topic4_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018217/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/4/highlight_topic4_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t4', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
( 167, 2, NULL, 'highlight', 'Usage of Present Simple Tense', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018329/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/5/highlight_topic5_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018329/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/5/highlight_topic5_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t5', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
( 168, 2, NULL, 'highlight', 'Present Simple Tense: Time Expressions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018437/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/6/highlight_topic6_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018437/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/6/highlight_topic6_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t6', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
( 169, 2, NULL, 'highlight', 'Past Simple Tense: Structure', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018542/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/7/highlight_topic7_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018542/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/7/highlight_topic7_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t7', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
( 170, 2, NULL, 'highlight', 'Usage of Past Simple Tense', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779018646/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/8/highlight_topic8_07a22983-c8ed-4085-8343-cbbd588d1684.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779018646/jobs/07a22983-c8ed-4085-8343-cbbd588d1684/topics/8/highlight_topic8_07a22983-c8ed-4085-8343-cbbd588d1684.jpg', NULL, NULL, 'highlight-07a22983-t8', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
( 171, 2, NULL, 'highlight', 'Understanding the Phrase ''Nice to Meet You''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779020402/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/1/highlight_topic1_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779020402/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/1/highlight_topic1_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t1', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 172, 2, NULL, 'highlight', 'Correct Usage of ''Nice to Meet You''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779020581/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/2/highlight_topic2_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779020581/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/2/highlight_topic2_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t2', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 173, 2, NULL, 'highlight', 'Alternative Expressions for Asking About Toilets', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779020769/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/3/highlight_topic3_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779020769/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/3/highlight_topic3_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t3', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 174, 2, NULL, 'highlight', 'Using ''I Like'' and ''I Like To''', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779020953/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/4/highlight_topic4_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779020953/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/4/highlight_topic4_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t4', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 175, 2, NULL, 'highlight', 'Expressing Dislikes', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779021150/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/5/highlight_topic5_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779021150/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/5/highlight_topic5_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t5', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 176, 2, NULL, 'highlight', 'Understanding Western Names', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779021351/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/6/highlight_topic6_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779021351/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/6/highlight_topic6_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t6', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 177, 2, NULL, 'highlight', 'Common Pet Names in English', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779021532/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/7/highlight_topic7_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779021532/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/7/highlight_topic7_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t7', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
( 178, 2, NULL, 'highlight', 'Expressions for Leaving a Conversation', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779021723/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/8/highlight_topic8_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779021723/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/8/highlight_topic8_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t8', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
( 179, 2, NULL, 'highlight', 'Expressing Head Injuries or Sickness', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779021915/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/9/highlight_topic9_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779021915/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/9/highlight_topic9_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t9', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
( 180, 2, NULL, 'highlight', 'Asking for Permission', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022116/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/10/highlight_topic10_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022116/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/10/highlight_topic10_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t10', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
( 181, 2, NULL, 'highlight', 'Expressing Emotions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022309/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/11/highlight_topic11_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022309/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/11/highlight_topic11_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t11', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
( 182, 2, NULL, 'highlight', 'Asking for Directions', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022503/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/12/highlight_topic12_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022503/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/12/highlight_topic12_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t12', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
( 183, 2, NULL, 'highlight', 'Words of Encouragement', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022699/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/13/highlight_topic13_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022699/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/13/highlight_topic13_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t13', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
( 184, 2, NULL, 'highlight', 'Expressing Language Proficiency', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779022897/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/14/highlight_topic14_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779022897/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/14/highlight_topic14_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t14', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
( 185, 2, NULL, 'highlight', 'Apologizing in English', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023085/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/15/highlight_topic15_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023085/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/15/highlight_topic15_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t15', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
( 186, 2, NULL, 'highlight', 'Addressing Embarrassing Situations', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023287/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/16/highlight_topic16_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023287/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/16/highlight_topic16_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t16', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
( 187, 2, NULL, 'highlight', 'Discussing the Weather', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023492/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/17/highlight_topic17_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023492/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/17/highlight_topic17_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t17', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
( 188, 2, NULL, 'highlight', 'Asking for Repetition', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023688/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/18/highlight_topic18_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023688/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/18/highlight_topic18_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t18', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
( 189, 2, NULL, 'highlight', 'Inquiring About Weekends', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779023883/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/19/highlight_topic19_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779023883/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/19/highlight_topic19_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t19', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
( 190, 2, NULL, 'highlight', 'Expressing Forgetfulness', 'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779024073/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/20/highlight_topic20_30e08f19-e8fe-412a-b4fa-39964324a204.mp4', NULL, 'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779024073/jobs/30e08f19-e8fe-412a-b4fa-39964324a204/topics/20/highlight_topic20_30e08f19-e8fe-412a-b4fa-39964324a204.jpg', NULL, NULL, 'highlight-30e08f19-t20', '2025-10-02 16:00:00', '2025-10-02 16:00:00');


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

-- HIGHLIGHT_FEED (newsfeed entries; one per highlight video)
-- ============================================================================
INSERT INTO highlight_feed (id, video_id, course_id, title, caption, hashtags, status, created_at, updated_at) VALUES
(   1, 32, 9, 'Creating the First HTML Document', 'Step-by-step guide on creating an HTML document, including the doctype declaration, HTML tags, head and body sections.', '["Python","List","Beginner"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(   2, 33, 9, 'Creating Hyperlinks', 'Instructions on how to create hyperlinks using A tags, including attributes like href and target.', '["Python","List","Beginner"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(   3, 34, 9, 'Inserting Images into HTML', 'How to add images to a web page using the IMG tag, including setting the source and alternative text.', '["Python","List","Beginner"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(   4, 35, 9, 'Adding Audio to a Web Page', 'Instructions on how to embed audio files in HTML using the audio element and its attributes.', '["Python","List","Beginner"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(   5, 36, 9, 'Embedding Videos in HTML', 'How to add video content to a web page using the video element, including attributes for controls and sources.', '["Python","List","Beginner"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(   6, 37, 9, 'Creating Lists in HTML', 'How to create unordered, ordered, and description lists using appropriate HTML tags.', '["Python","List","Beginner"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(   7, 38, 9, 'Creating Tables in HTML', 'Instructions on how to create tables using HTML, including table, tr, th, and td tags.', '["Python","List","Beginner"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(   8, 39, 9, 'Adding Color to Web Pages', 'How to add color to web pages using inline CSS styles within HTML elements.', '["Python","List","Beginner"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(   9, 40, 9, 'Using Span and Div Tags', 'Explanation of span and div tags for applying styles and organizing content in HTML.', '["Python","List","Beginner"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  10, 41, 9, 'Understanding Meta Tags', 'Overview of meta tags in HTML, their purpose, and how to use them for metadata.', '["Python","List","Beginner"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  11, 42, 9, 'Using iFrames in HTML', 'How to embed other web pages or documents within an HTML document using iFrames.', '["Python","List","Beginner"]', 'active', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  12, 43, 9, 'Creating Buttons in HTML', 'Instructions on how to create buttons using HTML, including attributes for functionality and styling.', '["Python","List","Beginner"]', 'active', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
(  13, 44, 9, 'Building Forms in HTML', 'Comprehensive guide on creating forms in HTML, including input types, labels, and form attributes.', '["Python","List","Beginner"]', 'active', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
(  14, 45, 11, 'Step-by-Step Guide to Registering for ChatGPT', NULL, '["ChatGPT","AI","Productivity"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  15, 46, 11, 'Analyzing Data with ChatGPT', NULL, '["ChatGPT","AI","Productivity"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  16, 47, 11, 'Creating Content with ChatGPT', NULL, '["ChatGPT","AI","Productivity"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  17, 48, 11, 'Building a Chatbot with ChatGPT', NULL, '["ChatGPT","AI","Productivity"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  18, 49, 10, 'Applications of Machine Learning', 'Highlights various real-world applications of Machine Learning in fields such as healthcare, finance, and e-commerce.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  19, 50, 10, 'Key Terms in Data Science', 'Introduces important terms such as data, variables, dependent and independent variables, and their significance in Data Science.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  20, 51, 10, 'Types of Machine Learning', 'Explains the main types of learning in Machine Learning: supervised, unsupervised, and reinforcement learning.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  21, 52, 10, 'Common Machine Learning Models', 'Introduces various machine learning models used for regression, classification, and clustering, including their applications.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  22, 53, 10, 'Linear Regression Explained', 'Details the concept of linear regression, its formula, and how it is used to make predictions.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  23, 54, 10, 'Decision Trees', 'Explains how decision trees work, their structure, and the process of building and pruning them.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  24, 55, 10, 'Ensemble Methods: Bagging and Random Forest', 'Discusses ensemble methods, particularly bagging and random forest, and their advantages in improving model accuracy.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  25, 56, 10, 'Boosting Techniques', 'Introduces boosting methods, including AdaBoost and Gradient Boosting, and their role in enhancing model performance.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  26, 57, 10, 'Support Vector Machines', 'Describes the support vector machine algorithm, its application in classification tasks, and its advantages and disadvantages.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  27, 58, 10, 'K-Nearest Neighbors Algorithm', 'Explains the K-NN algorithm, its working mechanism, and how it classifies new data points based on proximity.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  28, 59, 10, 'Logistic Regression', 'Covers logistic regression, its purpose in classification problems, and how it differs from linear regression.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  29, 60, 10, 'Neural Networks Overview', 'Introduces the concept of neural networks, their structure, and how they learn from data.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
(  30, 61, 10, 'Clustering and K-Means', 'Explains clustering techniques, particularly K-means clustering, and its application in grouping similar data points.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
(  31, 62, 10, 'Model Performance Evaluation', 'Discusses various performance indicators for evaluating machine learning models, including R squared and confusion matrix.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
(  32, 63, 10, 'Best Practices in Data Science', 'Provides best practices for data cleaning, feature engineering, and scaling to improve model performance.', '["MachineLearning","AI","DataScience"]', 'active', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
(  33, 64, 7, 'Building a Single Server Setup', 'Step-by-step explanation of setting up a basic system architecture that supports a single user, including how user requests are handled.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  34, 65, 7, 'Database Selection: SQL vs NoSQL', 'Comparison of relational databases and non-relational databases, discussing their structures, advantages, and use cases.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  35, 66, 7, 'Scaling Strategies: Vertical vs Horizontal', 'Detailed discussion on vertical and horizontal scaling approaches, including the use of load balancers to manage traffic across multiple servers.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  36, 67, 7, 'Load Balancing Techniques', 'Overview of various load balancing algorithms and strategies, including round robin, least connections, and IP hashing.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  37, 68, 7, 'Avoiding Single Points of Failure', 'Discussion on the concept of single points of failure in system design and strategies to mitigate these risks, particularly in load balancers.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  38, 69, 7, 'API Design Principles', 'Fundamental principles of API design, including the importance of consistency, simplicity, security, and performance.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  39, 70, 7, 'RESTful APIs vs GraphQL', 'Comparison of RESTful APIs and GraphQL, discussing their structures, advantages, and use cases.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  40, 71, 7, 'Authentication and Authorization', 'Overview of authentication methods and authorization frameworks, including JWT, OAuth 2, and their roles in securing APIs.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  41, 72, 7, 'Securing APIs', 'Techniques for protecting APIs from attacks, including rate limiting, CORS, SQL injection prevention, and the use of firewalls.', '["SystemDesign","Backend","Scaling"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  42, 73, 8, 'Thao tác xóa nút trong cây nhị phân tìm kiếm', NULL, '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  43, 74, 8, 'Các trường hợp xóa nút trong cây nhị phân', NULL, '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  44, 75, 8, 'Cách thực hiện xóa nút', NULL, '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  45, 76, 8, 'Thực hiện xóa nút trong mã nguồn', NULL, '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  46, 77, 8, 'Duyệt cây nhị phân', NULL, '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  47, 78, 8, 'Tìm chiều cao của cây nhị phân', NULL, '["DSA","BinaryTree","Algorithms"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  48, 79, 12, 'Section 1-1500', 'Auto-generated fallback (LLM outline failed for this chunk)', '["Lightroom","Photography","Editing"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  49, 80, 12, 'Section 1501-3000', 'Auto-generated fallback (LLM outline failed for this chunk)', '["Lightroom","Photography","Editing"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  50, 81, 12, 'Section 3001-3537', 'Auto-generated fallback (LLM outline failed for this chunk)', '["Lightroom","Photography","Editing"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  51, 82, 13, 'Section 1-1500', 'Auto-generated fallback (LLM outline failed for this chunk)', '["Design","GraphicDesign","Creative"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  52, 83, 13, 'Section 1501-2064', 'Auto-generated fallback (LLM outline failed for this chunk)', '["Design","GraphicDesign","Creative"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  53, 84, 14, 'Section 1-1500', 'Auto-generated fallback (LLM outline failed for this chunk)', '["Photography","Beginner","Camera"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  54, 85, 14, 'Section 1501-1739', 'Auto-generated fallback (LLM outline failed for this chunk)', '["Photography","Beginner","Camera"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  55, 86, 19, 'Setting Up Power BI Desktop', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  56, 87, 19, 'Connecting Data to Power BI', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  57, 88, 19, 'Data Transformation and Cleaning', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  58, 89, 19, 'Understanding Data Types', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  59, 90, 19, 'Connecting and Transforming Data', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  60, 91, 19, 'Designing a Business Dashboard', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  61, 92, 19, 'Key Performance Indicators (KPIs) Setup', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  62, 93, 19, 'Advanced Visualization Techniques', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  63, 94, 19, 'Implementing Slicers for Data Filtering', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  64, 95, 19, 'Exporting and Sharing Reports', NULL, '["PowerBI","DataViz","BI"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  65, 96, 16, 'Customer Attraction Techniques', NULL, '["DigitalMarketing","Marketing","Promotion"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  66, 97, 16, 'Discount Techniques and Pricing Strategies', NULL, '["DigitalMarketing","Marketing","Promotion"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  67, 98, 16, 'Differences Between Digital and Traditional Marketing', NULL, '["DigitalMarketing","Marketing","Promotion"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  68, 99, 17, 'Using Facts to Enhance Credibility', NULL, '["Copywriting","Marketing","Content"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  69, 100, 17, 'The Role of Experience in Writing', NULL, '["Copywriting","Marketing","Content"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  70, 101, 18, 'Website Bloat and Pruning', NULL, '["SEO","Marketing","AI"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  71, 102, 18, 'Updating Existing Content', NULL, '["SEO","Marketing","AI"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  72, 103, 18, 'Originality and Accuracy in Content', NULL, '["SEO","Marketing","AI"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  73, 104, 18, 'Trust and Safety of Content', NULL, '["SEO","Marketing","AI"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  74, 105, 18, 'Citing Sources and First-Hand Experience', NULL, '["SEO","Marketing","AI"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  75, 106, 18, 'Schema Markup and Its Importance', NULL, '["SEO","Marketing","AI"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  76, 107, 18, 'Internal Linking Strategies', NULL, '["SEO","Marketing","AI"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  77, 108, 4, 'Cấu hình desktop và phân vùng ổ cứng', 'Hướng dẫn cách cấu hình desktop và phân chia ổ cứng để tối ưu hóa không gian lưu trữ cho công việc lập trình.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  78, 109, 4, 'Cài đặt WSL (Windows Subsystem for Linux)', 'Hướng dẫn cài đặt WSL để sử dụng Ubuntu trên Windows, bao gồm các bước cần thiết và lệnh sử dụng.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  79, 110, 4, 'Cài đặt Chocolatey', 'Hướng dẫn cài đặt Chocolatey, trình quản lý gói cho Windows, và cách sử dụng nó để cài đặt phần mềm.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  80, 111, 4, 'Cấu hình file hosts cho dự án', 'Hướng dẫn cách cấu hình file hosts để sử dụng tên miền tùy chỉnh cho dự án phát triển.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  81, 112, 4, 'Cài đặt và cấu hình Anionic', 'Hướng dẫn cài đặt và cấu hình Anionic để chạy ứng dụng web.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  82, 113, 4, 'Cấu hình Nginx', 'Hướng dẫn cấu hình Nginx để phục vụ ứng dụng web, bao gồm các bước điều hướng và xử lý yêu cầu.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  83, 114, 4, 'Cài đặt PHP và cấu hình', 'Hướng dẫn cài đặt PHP và cấu hình các thông số cần thiết để chạy ứng dụng PHP.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  84, 115, 4, 'Cấu hình tài khoản admin', 'Hướng dẫn tạo tài khoản admin cho MariaDB và cấu hình mật khẩu.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  85, 116, 4, 'Tạo script khởi động', 'Hướng dẫn tạo một script để tự động khởi động các dịch vụ khi cần thiết.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  86, 117, 4, 'Tổng kết và hướng dẫn tiếp theo', 'Tổng kết các bước đã thực hiện và hướng dẫn các bước tiếp theo để hoàn thiện môi trường lập trình.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  87, 118, 4, 'Sự thay đổi trong chính sách bảo mật của trình duyệt', 'Thảo luận về các thay đổi trong chính sách bảo mật của trình duyệt, đặc biệt là việc ngăn chặn cookie từ bên thứ ba và cách mà điều này ảnh hưởng đến các nhà quảng cáo.', '["Web","DevTools","CORS"]', 'active', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  88, 119, 6, 'Setting Up Your Development Environment', 'Instructions on how to set up a web browser and text editor for writing HTML code, including downloading VS Code and installing the Live Server extension.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
(  89, 120, 6, 'Basic HTML Document Structure', 'Creating a basic HTML document structure, including the doctype declaration, HTML tags, head and body sections.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(  90, 121, 6, 'HTML Tags and Elements', 'Understanding HTML tags and elements, including header tags (H1-H6), paragraph tags (P), line breaks (BR), and horizontal rules (HR).', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
(  91, 122, 6, 'Creating Hyperlinks', 'How to create hyperlinks using anchor tags (A), including attributes like href, target, and title.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
(  92, 123, 6, 'Inserting Images', 'Instructions on how to add images to a webpage using the IMG tag, including setting the source and alternative text.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
(  93, 124, 6, 'Adding Audio to a Web Page', 'How to embed audio files in a webpage using the audio element, including attributes for controls and autoplay.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
(  94, 125, 6, 'Embedding Videos', 'Instructions on how to add video content to a webpage using the video element, including attributes for controls and multiple sources.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
(  95, 126, 6, 'Text Formatting Tags', 'Overview of various text formatting tags in HTML, including bold, italic, subscript, superscript, and more.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
(  96, 127, 6, 'Creating Lists in HTML', 'How to create unordered, ordered, and description lists using appropriate HTML tags.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
(  97, 128, 6, 'Creating Tables in HTML', 'Instructions on how to create tables using HTML, including table, tr, th, and td tags.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
(  98, 129, 6, 'Adding Color to Web Pages', 'Introduction to CSS for adding color to web pages, including inline styles for background and font colors.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
(  99, 130, 6, 'Understanding Span and Div Tags', 'Explanation of the span and div tags in HTML for applying styles and organizing content.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
( 100, 131, 6, 'Using Meta Tags', 'Overview of meta tags for providing metadata about a webpage, including description, keywords, and viewport settings.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
( 101, 132, 6, 'Embedding Content with iFrames', 'How to use iFrames to embed other web pages or documents within an HTML document.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
( 102, 133, 6, 'Creating Buttons in HTML', 'Instructions on how to create buttons using HTML, including attributes for linking and styling.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
( 103, 134, 6, 'Building Forms in HTML', 'Comprehensive guide on creating forms in HTML, including input types, labels, and form attributes.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
( 104, 135, 6, 'Introduction to Node.js', 'An overview of Node.js as a runtime environment for executing JavaScript outside of a browser, its use in building backend services, and its advantages over other frameworks.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
( 105, 136, 6, 'Node.js Architecture', 'Explanation of Node.js architecture, including the V8 engine and the differences between browser and Node.js environments.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
( 106, 137, 6, 'Asynchronous Nature of Node.js', 'Understanding the non-blocking architecture of Node.js through a restaurant metaphor, comparing it to synchronous architecture.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
( 107, 138, 6, 'Installing Node.js', 'Step-by-step guide on how to install Node.js on different operating systems and verify the installation.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 16:00:00', '2025-10-02 16:00:00'),
( 108, 139, 6, 'Creating Your First Node.js Application', 'Demonstration of creating a simple Node.js application, including writing JavaScript code and executing it using Node.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 17:00:00', '2025-10-02 17:00:00'),
( 109, 140, 6, 'Node.js Module System', 'Introduction to the module system in Node.js, explaining how modules work, their scope, and the importance of modularity.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 18:00:00', '2025-10-02 18:00:00'),
( 110, 141, 6, 'Creating and Using Modules', 'How to create custom modules in Node.js, export functions, and use them in other files.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 19:00:00', '2025-10-02 19:00:00'),
( 111, 142, 6, 'Built-in Modules in Node.js', 'Overview of built-in modules in Node.js, including the file system, OS, and HTTP modules, and their functionalities.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-02 20:00:00', '2025-10-02 20:00:00'),
( 112, 143, 6, 'Working with the File System', 'Demonstration of how to work with files and directories using the file system module, including synchronous and asynchronous methods.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-03 09:00:00', '2025-10-03 09:00:00'),
( 113, 144, 6, 'Event Handling in Node.js', 'Introduction to the event-driven architecture of Node.js, focusing on the EventEmitter class and how to handle events.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-03 10:00:00', '2025-10-03 10:00:00'),
( 114, 145, 6, 'Creating an HTTP Server', 'How to create a simple HTTP server using the HTTP module, handling requests and responses, and serving data.', '["HTML","CSS","NodeJS","WebDev"]', 'active', '2025-10-03 11:00:00', '2025-10-03 11:00:00'),
( 115, 146, 5, 'Primitive Data Types', 'Overview of primitive data types in JavaScript, including strings, numbers, and booleans.', '["JavaScript","WebDev","Programming"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 116, 147, 5, 'Dynamic Typing in JavaScript', 'Explains the concept of dynamic typing and how variable types can change at runtime.', '["JavaScript","WebDev","Programming"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 117, 148, 5, 'Introduction to Objects', 'Defines objects in JavaScript and how to create and manipulate them.', '["JavaScript","WebDev","Programming"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 118, 149, 5, 'Accessing Object Properties', 'Demonstrates how to access and modify object properties using dot and bracket notation.', '["JavaScript","WebDev","Programming"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 119, 150, 5, 'Introduction to Arrays', 'Explains arrays in JavaScript, how to create them, and their dynamic nature.', '["JavaScript","WebDev","Programming"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 120, 151, 5, 'Functions in JavaScript', 'Introduction to functions, their declaration, parameters, and return values.', '["JavaScript","WebDev","Programming"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 121, 152, 1, 'Adjective Functions of Participles', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 122, 153, 1, 'First Role of Two-Verb: Infinitive as a Complement', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 123, 154, 1, 'Second Role of Two-Verb: Infinitive as a Subject', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 124, 155, 1, 'Third Role of Two-Verb: Expressing Purpose', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 125, 156, 1, 'Fourth Role of Two-Verb: Following Adjectives', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 126, 157, 1, 'Understanding Verb Patterns', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 127, 158, 1, 'Examples of Verb Usage', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
( 128, 159, 1, 'Special Verb Forms', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
( 129, 160, 1, 'Common Mistakes with Verb Forms', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
( 130, 161, 1, 'Practice Exercises Introduction', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
( 131, 162, 1, 'Analyzing Practice Questions', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
( 132, 163, 1, 'Introduction to English Tenses', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
( 133, 164, 1, 'Present Simple Tense: Structure', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
( 134, 165, 1, 'Present Simple Tense: Examples', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
( 135, 166, 1, 'Present Simple Tense: Question Formation', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
( 136, 167, 1, 'Usage of Present Simple Tense', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
( 137, 168, 1, 'Present Simple Tense: Time Expressions', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
( 138, 169, 1, 'Past Simple Tense: Structure', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
( 139, 170, 1, 'Usage of Past Simple Tense', NULL, '["TOEIC","Grammar","English"]', 'active', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
( 140, 171, 2, 'Understanding the Phrase ''Nice to Meet You''', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 09:00:00', '2025-10-01 09:00:00'),
( 141, 172, 2, 'Correct Usage of ''Nice to Meet You''', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
( 142, 173, 2, 'Alternative Expressions for Asking About Toilets', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 11:00:00', '2025-10-01 11:00:00'),
( 143, 174, 2, 'Using ''I Like'' and ''I Like To''', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 12:00:00', '2025-10-01 12:00:00'),
( 144, 175, 2, 'Expressing Dislikes', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 13:00:00', '2025-10-01 13:00:00'),
( 145, 176, 2, 'Understanding Western Names', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 14:00:00', '2025-10-01 14:00:00'),
( 146, 177, 2, 'Common Pet Names in English', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 15:00:00', '2025-10-01 15:00:00'),
( 147, 178, 2, 'Expressions for Leaving a Conversation', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 16:00:00', '2025-10-01 16:00:00'),
( 148, 179, 2, 'Expressing Head Injuries or Sickness', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 17:00:00', '2025-10-01 17:00:00'),
( 149, 180, 2, 'Asking for Permission', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 18:00:00', '2025-10-01 18:00:00'),
( 150, 181, 2, 'Expressing Emotions', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 19:00:00', '2025-10-01 19:00:00'),
( 151, 182, 2, 'Asking for Directions', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-01 20:00:00', '2025-10-01 20:00:00'),
( 152, 183, 2, 'Words of Encouragement', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 09:00:00', '2025-10-02 09:00:00'),
( 153, 184, 2, 'Expressing Language Proficiency', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
( 154, 185, 2, 'Apologizing in English', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 11:00:00', '2025-10-02 11:00:00'),
( 155, 186, 2, 'Addressing Embarrassing Situations', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 12:00:00', '2025-10-02 12:00:00'),
( 156, 187, 2, 'Discussing the Weather', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 13:00:00', '2025-10-02 13:00:00'),
( 157, 188, 2, 'Asking for Repetition', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 14:00:00', '2025-10-02 14:00:00'),
( 158, 189, 2, 'Inquiring About Weekends', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 15:00:00', '2025-10-02 15:00:00'),
( 159, 190, 2, 'Expressing Forgetfulness', NULL, '["English","Conversation","Speaking"]', 'active', '2025-10-02 16:00:00', '2025-10-02 16:00:00');
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SEED
-- ============================================================================
