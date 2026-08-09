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
TRUNCATE TABLE discussion_upvotes;

TRUNCATE TABLE discussion_posts;

TRUNCATE TABLE feed_views;

TRUNCATE TABLE feed_interactions;

TRUNCATE TABLE feed_comments;

TRUNCATE TABLE highlight_feed;

TRUNCATE TABLE audit_logs;

TRUNCATE TABLE reports;

TRUNCATE TABLE course_change_requests;

TRUNCATE TABLE lecturer_upgrade_requests;

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

TRUNCATE TABLE quiz_submissions;

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
-- USERS (1 admin + 11 lecturers + 13 students = 25 users)
-- role: 1=ADMIN, 2=STUDENT, 3=LECTURER
-- ============================================================================
INSERT INTO
    users (
        id,
        email,
        password,
        firstName,
        lastName,
        role,
        avatarUrl,
        is_banned,
        createdAt,
        updatedAt
    )
VALUES (
        1,
        'admin@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Hệ thống',
        'Quản trị',
        1,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785658353/admin_system_extfst.png',
        0,
        '2025-12-02 16:00:00',
        '2026-07-02 09:35:00'
    ),
    (
        2,
        'teacher.english@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Thu Hương',
        'Nguyễn',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576626/nguyen-thu-huong_tte4jp.jpg',
        0,
        '2025-12-03 16:00:00',
        '2026-07-01 14:30:00'
    ),
    (
        3,
        'teacher.chinese@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Minh Châu',
        'Lý',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576626/ly-minh-chau_gndnkm.jpg',
        0,
        '2025-12-04 16:00:00',
        '2026-06-23 14:30:00'
    ),
    (
        4,
        'teacher.webdev@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Đăng Khoa',
        'Trần',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576626/tran-dang-khoa_jmfwby.jpg',
        0,
        '2025-12-05 16:00:00',
        '2026-07-03 14:30:00'
    ),
    (
        5,
        'teacher.system@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Minh An',
        'Phạm',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576626/pham-minh-an_ldyc3n.jpg',
        0,
        '2025-12-06 16:00:00',
        '2026-06-23 14:30:00'
    ),
    (
        6,
        'teacher.python@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Khánh Linh',
        'Đặng',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576625/dang-khanh-linh_ufsjpf.jpg',
        0,
        '2025-12-07 16:00:00',
        '2026-07-05 14:30:00'
    ),
    (
        7,
        'teacher.design@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Anh Thảo',
        'Hoàng',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576625/hoang-anh-thao_anb4oc.jpg',
        0,
        '2025-12-08 16:00:00',
        '2026-06-25 14:30:00'
    ),
    (
        8,
        'teacher.marketing@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Gia Bảo',
        'Vũ',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576626/vu-gia-bao_u6puhb.jpg',
        0,
        '2025-12-09 16:00:00',
        '2026-07-07 14:30:00'
    ),
    (
        9,
        'teacher.video@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Quang Quân',
        'Lê',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576625/le-quang-quan_i8e8ju.jpg',
        0,
        '2025-12-10 16:00:00',
        '2026-06-27 14:30:00'
    ),
    (
        10,
        'teacher.softskills@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Mai Phương',
        'Bùi',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785576625/bui-mai-phuong_orobar.jpg',
        0,
        '2025-12-11 16:00:00',
        '2026-07-09 14:30:00'
    ),
    (
        11,
        'tran.anhtu@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Anh Tú',
        'Trần',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648161/tran-anh-tu_uqsb6n.png',
        0,
        '2025-12-12 16:00:00',
        '2025-12-23 09:55:00'
    ),
    (
        12,
        'nguyen.baongoc@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Bảo Ngọc',
        'Nguyễn',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648160/nguyen-bao-ngoc_t0jkvf.png',
        0,
        '2025-12-13 16:00:00',
        '2025-12-30 10:20:00'
    ),
    (
        13,
        'phan.minhchi@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Minh Chi',
        'Phan',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648161/phan-minh-chi_c9w8i3.png',
        0,
        '2025-12-14 16:00:00',
        '2026-07-20 09:00:00'
    ),
    (
        14,
        'vu.ducdat@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Đức Đạt',
        'Vũ',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648162/vu-duc-dat_bbedyc.png',
        0,
        '2025-12-15 16:00:00',
        '2026-01-14 16:10:00'
    ),
    (
        15,
        'hoang.thuyduong@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Thùy Dương',
        'Hoàng',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648165/hoang-thuy-duong_mw92w0.png',
        0,
        '2025-12-16 16:00:00',
        '2026-07-22 10:00:00'
    ),
    (
        16,
        'do.giaphong@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Gia Phong',
        'Đỗ',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648159/do-gia-phong_zj9lfl.png',
        0,
        '2025-12-17 16:00:00',
        '2026-01-28 15:10:00'
    ),
    (
        17,
        'le.hagiang@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Hà Giang',
        'Lê',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648168/le-ha-giang_cpi9ka.png',
        0,
        '2025-12-18 16:00:00',
        '2026-02-04 11:20:00'
    ),
    (
        18,
        'truong.ngochanh@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Ngọc Hạnh',
        'Trương',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648162/truong-ngoc-hanh_wcnwxs.png',
        0,
        '2025-12-19 16:00:00',
        '2026-07-05 10:15:00'
    ),
    (
        19,
        'pham.hainam@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Hải Nam',
        'Phạm',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648160/pham-hai-nam_bgkp88.png',
        0,
        '2025-12-20 16:00:00',
        '2026-02-17 09:15:00'
    ),
    (
        20,
        'nguyen.minhkhoi@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Minh Khôi',
        'Nguyễn',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648159/nguyen-minh-khoi_fpafzp.png',
        0,
        '2025-12-21 16:00:00',
        '2026-02-26 11:40:00'
    ),
    (
        21,
        'vu.giakhang@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Gia Khang',
        'Vũ',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648163/vu-gia-khang_tlj29e.png',
        0,
        '2025-12-22 16:00:00',
        '2026-07-16 09:00:00'
    ),
    (
        22,
        'doan.thanhlong@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Thành Long',
        'Đoàn',
        3,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648159/doan-thanh-long_wwzpbl.png',
        0,
        '2025-12-23 16:00:00',
        '2026-07-25 09:30:00'
    ),
    (
        23,
        'bui.tramy@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Trà My',
        'Bùi',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648159/bui-tra-my_gt2t7m.png',
        0,
        '2025-12-24 16:00:00',
        '2026-03-19 10:15:00'
    ),
    (
        24,
        'pham.kimngan@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Kim Ngân',
        'Phạm',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648160/pham-kim-ngan_zz5kes.png',
        0,
        '2025-12-25 16:00:00',
        '2026-03-26 13:25:00'
    ),
    (
        25,
        'trinh.minhoanh@graduation.local',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Minh Oanh',
        'Trịnh',
        2,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1785648162/trinh-minh-oanh_wbii5m.png',
        0,
        '2025-12-26 16:00:00',
        '2026-04-04 20:10:00'
    );

-- ============================================================================
-- MASCOT IMAGES (one stock mascot per teacher who uses the video editor)
-- ============================================================================
INSERT INTO
    mascot_images (
        image_id,
        user_id,
        url,
        job_id,
        thumbnail,
        public_id,
        format,
        name,
        type,
        createdAt,
        updatedAt
    )
VALUES (
        1,
        2,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953276/png_bddk0a.png',
        'job-mascot-eng-001',
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953276/png_bddk0a.png',
        'mascot/english_owl',
        'png',
        'Owl Teacher',
        'thumbnail_video',
        '2026-06-20 10:00:00',
        '2026-06-20 10:00:00'
    ),
    (
        2,
        4,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953339/png_loer8y.png',
        'job-mascot-web-002',
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953339/png_loer8y.png',
        'mascot/web_robot',
        'png',
        'Web Robot',
        'thumbnail_video',
        '2026-06-21 10:00:00',
        '2026-06-21 10:00:00'
    ),
    (
        3,
        5,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953354/png_zi24hq.png',
        'job-mascot-sys-003',
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953354/png_zi24hq.png',
        'mascot/server_cat',
        'png',
        'Server Cat',
        'thumbnail_video',
        '2026-06-22 10:00:00',
        '2026-06-22 10:00:00'
    ),
    (
        4,
        6,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953363/png_xckpdj.png',
        'job-mascot-py-004',
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953363/png_xckpdj.png',
        'mascot/python_snake',
        'png',
        'Python Snake',
        'thumbnail_video',
        '2026-06-23 10:00:00',
        '2026-06-23 10:00:00'
    ),
    (
        5,
        7,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953373/png_tkka1b.png',
        'job-mascot-des-005',
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953373/png_tkka1b.png',
        'mascot/design_fox',
        'png',
        'Designer Fox',
        'thumbnail_video',
        '2026-06-24 10:00:00',
        '2026-06-24 10:00:00'
    ),
    (
        6,
        8,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953391/png_sv3uxc.png',
        'job-mascot-mkt-006',
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953391/png_sv3uxc.png',
        'mascot/marketing_dog',
        'png',
        'Marketing Dog',
        'thumbnail_video',
        '2026-06-25 10:00:00',
        '2026-06-25 10:00:00'
    ),
    (
        7,
        9,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953404/png_i4acit.png',
        'job-mascot-vid-007',
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783953404/png_i4acit.png',
        'mascot/editor_panda',
        'png',
        'Editor Panda',
        'thumbnail_video',
        '2026-06-26 10:00:00',
        '2026-06-26 10:00:00'
    ),
    (
        8,
        18,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/08_role_upgrade_pronunciation_outline_tcxqxf.png',
        'seed-role-upgrade-008',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/08_role_upgrade_pronunciation_outline_tcxqxf.png',
        '08_role_upgrade_pronunciation_outline_tcxqxf',
        'png',
        'Pronunciation course outline evidence',
        'role_upgrade',
        '2026-07-03 14:20:00',
        '2026-07-03 14:20:00'
    ),
    (
        9,
        18,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/09_role_upgrade_teaching_certificate_dk544o.png',
        'seed-role-upgrade-009',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/09_role_upgrade_teaching_certificate_dk544o.png',
        '09_role_upgrade_teaching_certificate_dk544o',
        'png',
        'Teaching certificate evidence',
        'role_upgrade',
        '2026-07-03 14:20:00',
        '2026-07-03 14:20:00'
    ),
    (
        10,
        23,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086097/10_role_upgrade_excel_lesson_plan_ohvw2w.png',
        'seed-role-upgrade-010',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086097/10_role_upgrade_excel_lesson_plan_ohvw2w.png',
        '10_role_upgrade_excel_lesson_plan_ohvw2w',
        'png',
        'Excel lesson plan evidence',
        'role_upgrade',
        '2026-07-28 08:45:00',
        '2026-07-28 08:45:00'
    ),
    (
        11,
        24,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/11_role_upgrade_figma_portfolio_nm6yoh.png',
        'seed-role-upgrade-011',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/11_role_upgrade_figma_portfolio_nm6yoh.png',
        '11_role_upgrade_figma_portfolio_nm6yoh',
        'png',
        'Figma portfolio evidence',
        'role_upgrade',
        '2026-07-30 11:20:00',
        '2026-07-30 11:20:00'
    ),
    (
        12,
        21,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/12_role_upgrade_flutter_syllabus_pi2ydc.png',
        'seed-role-upgrade-012',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/12_role_upgrade_flutter_syllabus_pi2ydc.png',
        '12_role_upgrade_flutter_syllabus_pi2ydc',
        'png',
        'Flutter syllabus evidence',
        'role_upgrade',
        '2026-07-14 15:10:00',
        '2026-07-14 15:10:00'
    ),
    (
        18,
        12,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/18_role_upgrade_english_teaching_resume_nvvcle.png',
        'seed-role-upgrade-018',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/18_role_upgrade_english_teaching_resume_nvvcle.png',
        '18_role_upgrade_english_teaching_resume_nvvcle',
        'png',
        'English teaching resume evidence',
        'role_upgrade',
        '2026-07-18 09:10:00',
        '2026-07-18 09:10:00'
    ),
    (
        19,
        12,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/19_role_upgrade_live_class_screenshot_js4diq.png',
        'seed-role-upgrade-019',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/19_role_upgrade_live_class_screenshot_js4diq.png',
        '19_role_upgrade_live_class_screenshot_js4diq',
        'png',
        'Live class screenshot evidence',
        'role_upgrade',
        '2026-07-18 09:10:00',
        '2026-07-18 09:10:00'
    ),
    (
        20,
        13,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086101/20_role_upgrade_data_analysis_certificate_aublda.png',
        'seed-role-upgrade-020',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086101/20_role_upgrade_data_analysis_certificate_aublda.png',
        '20_role_upgrade_data_analysis_certificate_aublda',
        'png',
        'Data analysis certificate evidence',
        'role_upgrade',
        '2026-07-19 13:30:00',
        '2026-07-19 13:30:00'
    ),
    (
        21,
        13,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086101/21_role_upgrade_sql_lesson_plan_dhzivq.png',
        'seed-role-upgrade-021',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086101/21_role_upgrade_sql_lesson_plan_dhzivq.png',
        '21_role_upgrade_sql_lesson_plan_dhzivq',
        'png',
        'SQL lesson plan evidence',
        'role_upgrade',
        '2026-07-19 13:30:00',
        '2026-07-19 13:30:00'
    ),
    (
        22,
        14,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086101/22_role_upgrade_uiux_case_study_w6mpfo.png',
        'seed-role-upgrade-022',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086101/22_role_upgrade_uiux_case_study_w6mpfo.png',
        '22_role_upgrade_uiux_case_study_w6mpfo',
        'png',
        'UI UX case study evidence',
        'role_upgrade',
        '2026-07-20 10:05:00',
        '2026-07-20 10:05:00'
    ),
    (
        23,
        14,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086127/23_role_upgrade_figma_prototype_review_tsxq0k.png',
        'seed-role-upgrade-023',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086127/23_role_upgrade_figma_prototype_review_tsxq0k.png',
        '23_role_upgrade_figma_prototype_review_tsxq0k',
        'png',
        'Figma prototype review evidence',
        'role_upgrade',
        '2026-07-20 10:05:00',
        '2026-07-20 10:05:00'
    ),
    (
        24,
        15,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086137/24_role_upgrade_devops_workshop_certificate_dqk30y.png',
        'seed-role-upgrade-024',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086137/24_role_upgrade_devops_workshop_certificate_dqk30y.png',
        '24_role_upgrade_devops_workshop_certificate_dqk30y',
        'png',
        'DevOps workshop certificate evidence',
        'role_upgrade',
        '2026-07-21 08:40:00',
        '2026-07-21 08:40:00'
    ),
    (
        25,
        15,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086138/25_role_upgrade_docker_syllabus_ikwtxm.png',
        'seed-role-upgrade-025',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086138/25_role_upgrade_docker_syllabus_ikwtxm.png',
        '25_role_upgrade_docker_syllabus_ikwtxm',
        'png',
        'Docker syllabus evidence',
        'role_upgrade',
        '2026-07-21 08:40:00',
        '2026-07-21 08:40:00'
    ),
    (
        26,
        16,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086138/26_role_upgrade_ielts_speaking_feedback_lgeues.png',
        'seed-role-upgrade-026',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086138/26_role_upgrade_ielts_speaking_feedback_lgeues.png',
        '26_role_upgrade_ielts_speaking_feedback_lgeues',
        'png',
        'IELTS speaking feedback evidence',
        'role_upgrade',
        '2026-07-22 15:20:00',
        '2026-07-22 15:20:00'
    ),
    (
        27,
        16,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/27_role_upgrade_sample_video_lesson_jombfg.png',
        'seed-role-upgrade-027',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/27_role_upgrade_sample_video_lesson_jombfg.png',
        '27_role_upgrade_sample_video_lesson_jombfg',
        'png',
        'Sample video lesson evidence',
        'role_upgrade',
        '2026-07-22 15:20:00',
        '2026-07-22 15:20:00'
    ),
    (
        28,
        20,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/28_role_upgrade_cybersecurity_outline_hzgi63.png',
        'seed-role-upgrade-028',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/28_role_upgrade_cybersecurity_outline_hzgi63.png',
        '28_role_upgrade_cybersecurity_outline_hzgi63',
        'png',
        'Cybersecurity outline evidence',
        'role_upgrade',
        '2026-07-23 11:25:00',
        '2026-07-23 11:25:00'
    ),
    (
        29,
        20,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/29_role_upgrade_security_lab_result_jobf7o.png',
        'seed-role-upgrade-029',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/29_role_upgrade_security_lab_result_jobf7o.png',
        '29_role_upgrade_security_lab_result_jobf7o',
        'png',
        'Security lab result evidence',
        'role_upgrade',
        '2026-07-23 11:25:00',
        '2026-07-23 11:25:00'
    ),
    (
        30,
        22,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/30_role_upgrade_marketing_campaign_portfolio_lyfeua.png',
        'seed-role-upgrade-030',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086154/30_role_upgrade_marketing_campaign_portfolio_lyfeua.png',
        '30_role_upgrade_marketing_campaign_portfolio_lyfeua',
        'png',
        'Marketing campaign portfolio evidence',
        'role_upgrade',
        '2026-07-24 16:00:00',
        '2026-07-24 16:00:00'
    ),
    (
        31,
        22,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/31_role_upgrade_content_calendar_sample_kz7bgs.png',
        'seed-role-upgrade-031',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/31_role_upgrade_content_calendar_sample_kz7bgs.png',
        '31_role_upgrade_content_calendar_sample_kz7bgs',
        'png',
        'Content calendar evidence',
        'role_upgrade',
        '2026-07-24 16:00:00',
        '2026-07-24 16:00:00'
    ),
    (
        32,
        25,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/32_role_upgrade_python_notebook_sample_mdyiem.png',
        'seed-role-upgrade-032',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/32_role_upgrade_python_notebook_sample_mdyiem.png',
        '32_role_upgrade_python_notebook_sample_mdyiem',
        'png',
        'Python notebook sample evidence',
        'role_upgrade',
        '2026-07-31 09:35:00',
        '2026-07-31 09:35:00'
    ),
    (
        33,
        25,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/33_role_upgrade_teaching_rubric_oypg67.png',
        'seed-role-upgrade-033',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/33_role_upgrade_teaching_rubric_oypg67.png',
        '33_role_upgrade_teaching_rubric_oypg67',
        'png',
        'Teaching rubric evidence',
        'role_upgrade',
        '2026-07-31 09:35:00',
        '2026-07-31 09:35:00'
    ),
    (
        13,
        17,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/13_report_course_ml_detail_qncrwc.png',
        'seed-report-013',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/13_report_course_ml_detail_qncrwc.png',
        '13_report_course_ml_detail_qncrwc',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-07-04 08:30:00',
        '2026-07-04 08:30:00'
    ),
    (
        14,
        16,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/14_report_course_javascript_detail_vk3spz.png',
        'seed-report-014',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/14_report_course_javascript_detail_vk3spz.png',
        '14_report_course_javascript_detail_vk3spz',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-06-27 14:00:00',
        '2026-06-27 14:00:00'
    ),
    (
        15,
        18,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/15_report_lesson_javascript_learn_hw2lfu.png',
        'seed-report-015',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086098/15_report_lesson_javascript_learn_hw2lfu.png',
        '15_report_lesson_javascript_learn_hw2lfu',
        'png',
        'Lesson learning page screenshot for report',
        'report',
        '2026-07-25 08:00:00',
        '2026-07-25 08:00:00'
    ),
    (
        16,
        24,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/16_report_teacher_marketing_section_x5euma.png',
        'seed-report-016',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/16_report_teacher_marketing_section_x5euma.png',
        '16_report_teacher_marketing_section_x5euma',
        'png',
        'Teacher section screenshot for report',
        'report',
        '2026-07-26 10:00:00',
        '2026-07-26 10:00:00'
    ),
    (
        17,
        21,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/17_report_course_powerbi_detail_hsskzp.png',
        'seed-report-017',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086099/17_report_course_powerbi_detail_hsskzp.png',
        '17_report_course_powerbi_detail_hsskzp',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-07-27 09:00:00',
        '2026-07-27 09:00:00'
    ),
    (
        34,
        11,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/34_report_course_figma_detail_q4vkku.png',
        'seed-report-034',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086155/34_report_course_figma_detail_q4vkku.png',
        '34_report_course_figma_detail_q4vkku',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-07-28 10:20:00',
        '2026-07-28 10:20:00'
    ),
    (
        35,
        12,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086156/35_report_course_webdev_detail_hmiv0x.png',
        'seed-report-035',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086156/35_report_course_webdev_detail_hmiv0x.png',
        '35_report_course_webdev_detail_hmiv0x',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-07-28 15:15:00',
        '2026-07-28 15:15:00'
    ),
    (
        36,
        13,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086156/36_report_teacher_design_section_htedxx.png',
        'seed-report-036',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086156/36_report_teacher_design_section_htedxx.png',
        '36_report_teacher_design_section_htedxx',
        'png',
        'Teacher section screenshot for report',
        'report',
        '2026-07-29 08:25:00',
        '2026-07-29 08:25:00'
    ),
    (
        37,
        14,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/37_report_lesson_toeic_learn_r22sr6.png',
        'seed-report-037',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/37_report_lesson_toeic_learn_r22sr6.png',
        '37_report_lesson_toeic_learn_r22sr6',
        'png',
        'Lesson learning page screenshot for report',
        'report',
        '2026-07-29 13:50:00',
        '2026-07-29 13:50:00'
    ),
    (
        38,
        15,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086156/38_report_course_excel_detail_xhbxje.png',
        'seed-report-038',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086156/38_report_course_excel_detail_xhbxje.png',
        '38_report_course_excel_detail_xhbxje',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-07-30 09:05:00',
        '2026-07-30 09:05:00'
    ),
    (
        39,
        20,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/39_report_course_capcut_detail_bc5cih.png',
        'seed-report-039',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/39_report_course_capcut_detail_bc5cih.png',
        '39_report_course_capcut_detail_bc5cih',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-07-30 14:30:00',
        '2026-07-30 14:30:00'
    ),
    (
        40,
        22,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/40_report_lesson_seo_learn_wqosor.png',
        'seed-report-040',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/40_report_lesson_seo_learn_wqosor.png',
        '40_report_lesson_seo_learn_wqosor',
        'png',
        'Lesson learning page screenshot for report',
        'report',
        '2026-07-31 10:10:00',
        '2026-07-31 10:10:00'
    ),
    (
        41,
        23,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/41_report_teacher_video_section_hfsstw.png',
        'seed-report-041',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/41_report_teacher_video_section_hfsstw.png',
        '41_report_teacher_video_section_hfsstw',
        'png',
        'Teacher section screenshot for report',
        'report',
        '2026-07-31 11:40:00',
        '2026-07-31 11:40:00'
    ),
    (
        42,
        24,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/42_report_lesson_critical_thinking_learn_opg4g3.png',
        'seed-report-042',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086157/42_report_lesson_critical_thinking_learn_opg4g3.png',
        '42_report_lesson_critical_thinking_learn_opg4g3',
        'png',
        'Lesson learning page screenshot for report',
        'report',
        '2026-08-01 08:35:00',
        '2026-08-01 08:35:00'
    ),
    (
        43,
        25,
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086158/43_report_course_project_management_detail_ssrxva.png',
        'seed-report-043',
        'https://res.cloudinary.com/iudiaynp/image/upload/v1786086158/43_report_course_project_management_detail_ssrxva.png',
        '43_report_course_project_management_detail_ssrxva',
        'png',
        'Course detail screenshot for report',
        'report',
        '2026-08-01 13:15:00',
        '2026-08-01 13:15:00'
    );

-- ============================================================================
-- ============================================================================
-- VIDEOS - LONG FORM (31 long-form course videos, all stored on Bunny Stream)
-- id 1..31 mapped to teachers as planned in the seed README at the top
-- (highlight-type videos are inserted in a separate INSERT below, ids 32+)
-- ============================================================================
INSERT INTO
    videos (
        id,
        user_id,
        mascot_image_id,
        type,
        name,
        url,
        duration,
        thumbnail,
        srt_raw_url,
        bunny_video_guid,
        job_id,
        created_at,
        updated_at
    )
VALUES (
        1,
        2,
        1,
        'long',
        'Phân Từ | TOEIC Grammar - Lesson 5: Participles',
        'https://vz-e0f2a12f-935.b-cdn.net/10506623-c382-4062-bb6c-27c8185fed19/play_360p.mp4',
        2478.312,
        'https://vz-e0f2a12f-935.b-cdn.net/10506623-c382-4062-bb6c-27c8185fed19/thumbnail.jpg',
        NULL,
        '10506623-c382-4062-bb6c-27c8185fed19',
        'job-vid-toeic-l5',
        '2026-06-20 10:00:00',
        '2026-06-20 10:00:00'
    ),
    (
        2,
        2,
        1,
        'long',
        'To V1, V-ing, V1 | TOEIC Grammar - Lesson 4',
        'https://vz-e0f2a12f-935.b-cdn.net/f3377768-3355-469c-9f1e-f6d010f9969f/play_360p.mp4',
        2993.679,
        'https://vz-e0f2a12f-935.b-cdn.net/f3377768-3355-469c-9f1e-f6d010f9969f/thumbnail.jpg',
        NULL,
        'f3377768-3355-469c-9f1e-f6d010f9969f',
        'job-vid-toeic-l4',
        '2026-06-20 10:05:00',
        '2026-06-20 10:05:00'
    ),
    (
        3,
        2,
        1,
        'long',
        'Các Thì Trong Tiếng Anh | TOEIC Grammar - Lesson 3: Tenses',
        'https://vz-e0f2a12f-935.b-cdn.net/f53ee3cc-c963-43dd-883b-99fcd55c07cf/play_360p.mp4',
        4833.884,
        'https://vz-e0f2a12f-935.b-cdn.net/f53ee3cc-c963-43dd-883b-99fcd55c07cf/thumbnail.jpg',
        NULL,
        'f53ee3cc-c963-43dd-883b-99fcd55c07cf',
        'job-vid-toeic-l3-tenses',
        '2026-05-28 09:00:00',
        '2026-06-20 10:00:00'
    ),
    (
        4,
        5,
        3,
        'long',
        'System Design Course - APIs, Databases, Caching, CDNs, Load Balancing & Production Infra',
        'https://vz-e0f2a12f-935.b-cdn.net/9b9fce3e-8870-40ca-8292-91d2081e11fd/play_360p.mp4',
        7521.965,
        'https://vz-e0f2a12f-935.b-cdn.net/9b9fce3e-8870-40ca-8292-91d2081e11fd/thumbnail.jpg',
        NULL,
        '9b9fce3e-8870-40ca-8292-91d2081e11fd',
        'job-vid-system-design-full',
        '2026-03-11 14:50:00',
        '2026-06-22 10:00:00'
    ),
    (
        5,
        4,
        2,
        'long',
        'Cài Đặt Môi Trường Lập Trình Cho Máy Windows Mới',
        'https://vz-e0f2a12f-935.b-cdn.net/3d7e6002-fd31-44ea-bdaf-b4a702720757/play_360p.mp4',
        6257.336,
        'https://vz-e0f2a12f-935.b-cdn.net/3d7e6002-fd31-44ea-bdaf-b4a702720757/thumbnail.jpg',
        NULL,
        '3d7e6002-fd31-44ea-bdaf-b4a702720757',
        'job-vid-windows-dev-env',
        '2026-07-24 08:45:00',
        '2026-07-24 08:45:00'
    ),
    (
        6,
        4,
        2,
        'long',
        'CORS Policy Là Gì? | Cách Xử Lý Khi Bị Chặn Bởi CORS',
        'https://vz-e0f2a12f-935.b-cdn.net/c21ee067-4787-4cad-b1da-98f95a7bc8bd/play_360p.mp4',
        4122.447,
        'https://vz-e0f2a12f-935.b-cdn.net/c21ee067-4787-4cad-b1da-98f95a7bc8bd/thumbnail.jpg',
        NULL,
        'c21ee067-4787-4cad-b1da-98f95a7bc8bd',
        'job-vid-cors-policy',
        '2026-06-21 09:10:00',
        '2026-06-21 10:00:00'
    ),
    (
        7,
        4,
        2,
        'long',
        'freeCodeCamp JavaScript Full Course',
        'https://vz-e0f2a12f-935.b-cdn.net/7ca69b77-e55f-4b96-b5be-1d67cc614200/play_360p.mp4',
        12402.660,
        'https://vz-e0f2a12f-935.b-cdn.net/7ca69b77-e55f-4b96-b5be-1d67cc614200/thumbnail.jpg',
        NULL,
        '7ca69b77-e55f-4b96-b5be-1d67cc614200',
        'job-vid-fcc-js-full',
        '2026-01-20 16:10:00',
        '2026-06-21 10:00:00'
    ),
    (
        8,
        6,
        4,
        'long',
        'List trong Python',
        'https://vz-e0f2a12f-935.b-cdn.net/b7ce2e24-3022-40f5-bf3e-34017683c8eb/play_360p.mp4',
        2595.805,
        'https://vz-e0f2a12f-935.b-cdn.net/b7ce2e24-3022-40f5-bf3e-34017683c8eb/thumbnail.jpg',
        NULL,
        'b7ce2e24-3022-40f5-bf3e-34017683c8eb',
        'job-vid-python-list',
        '2026-05-31 12:00:00',
        '2026-06-23 10:00:00'
    ),
    (
        9,
        4,
        2,
        'long',
        'HTML & CSS Full Course',
        'https://vz-e0f2a12f-935.b-cdn.net/0da816d7-8532-453b-b7cb-9364a44d7bbf/play_360p.mp4',
        23475.676,
        'https://vz-e0f2a12f-935.b-cdn.net/0da816d7-8532-453b-b7cb-9364a44d7bbf/thumbnail.jpg',
        NULL,
        '0da816d7-8532-453b-b7cb-9364a44d7bbf',
        'job-vid-fcc-htmlcss-full',
        '2026-06-06 10:00:00',
        '2026-06-21 10:00:00'
    ),
    (
        10,
        4,
        2,
        'long',
        'Node.js Full Course',
        'https://vz-e0f2a12f-935.b-cdn.net/a419b9d9-b235-40f4-8583-cca01d44051c/play_360p.mp4',
        21633.892,
        'https://vz-e0f2a12f-935.b-cdn.net/a419b9d9-b235-40f4-8583-cca01d44051c/thumbnail.jpg',
        NULL,
        'a419b9d9-b235-40f4-8583-cca01d44051c',
        'job-vid-node',
        '2026-06-21 09:40:00',
        '2026-06-21 10:00:00'
    ),
    (
        11,
        4,
        2,
        'long',
        'Programming with Mosh - JavaScript Tutorial',
        'https://vz-e0f2a12f-935.b-cdn.net/3a818287-c33a-4b1e-b4a5-bc2bbd4ab0e8/play_360p.mp4',
        2896.689,
        'https://vz-e0f2a12f-935.b-cdn.net/3a818287-c33a-4b1e-b4a5-bc2bbd4ab0e8/thumbnail.jpg',
        NULL,
        '3a818287-c33a-4b1e-b4a5-bc2bbd4ab0e8',
        'job-vid-mosh-js',
        '2026-06-21 09:50:00',
        '2026-06-21 10:00:00'
    ),
    (
        12,
        10,
        NULL,
        'long',
        'Seminar Tư Duy Phản Biện',
        'https://vz-e0f2a12f-935.b-cdn.net/877026ee-d126-4dbc-aa47-8792accdd421/play_360p.mp4',
        4369.299,
        'https://vz-e0f2a12f-935.b-cdn.net/877026ee-d126-4dbc-aa47-8792accdd421/thumbnail.jpg',
        NULL,
        '877026ee-d126-4dbc-aa47-8792accdd421',
        'job-vid-critical',
        '2026-01-05 10:20:00',
        '2026-01-05 10:20:00'
    ),
    (
        13,
        7,
        5,
        'long',
        'Học Lightroom Chi Tiết - Nắm Vững Nguyên Lý',
        'https://vz-e0f2a12f-935.b-cdn.net/dd6fffa0-1906-44f7-8580-d7adcd841855/play_480p.mp4',
        5366.101,
        'https://vz-e0f2a12f-935.b-cdn.net/dd6fffa0-1906-44f7-8580-d7adcd841855/thumbnail.jpg',
        NULL,
        'dd6fffa0-1906-44f7-8580-d7adcd841855',
        'job-vid-lightroom',
        '2026-01-13 14:35:00',
        '2026-06-24 10:00:00'
    ),
    (
        14,
        7,
        5,
        'long',
        'Học Thiết Kế Đồ Họa Online - Từ Cơ Bản Đến Nâng Cao',
        'https://vz-e0f2a12f-935.b-cdn.net/1cc8bbcd-35f3-4d1d-bbf9-5c2066f6e035/play_360p.mp4',
        4815.424,
        'https://vz-e0f2a12f-935.b-cdn.net/1cc8bbcd-35f3-4d1d-bbf9-5c2066f6e035/thumbnail.jpg',
        NULL,
        '1cc8bbcd-35f3-4d1d-bbf9-5c2066f6e035',
        'job-vid-graphic',
        '2026-02-03 15:10:00',
        '2026-06-24 10:00:00'
    ),
    (
        15,
        8,
        6,
        'long',
        'Power BI - Beyond Drag & Drop',
        'https://vz-e0f2a12f-935.b-cdn.net/953dfac9-d026-419f-8783-64f398e59ea1/play_480p.mp4',
        4721.344,
        'https://vz-e0f2a12f-935.b-cdn.net/953dfac9-d026-419f-8783-64f398e59ea1/thumbnail.jpg',
        NULL,
        '953dfac9-d026-419f-8783-64f398e59ea1',
        'job-vid-powerbi',
        '2026-05-13 16:15:00',
        '2026-06-25 10:00:00'
    ),
    (
        16,
        8,
        6,
        'long',
        'Marketing - 35 Tuyệt Chiêu Khuyến Mãi Giúp Tăng Doanh Số',
        'https://vz-e0f2a12f-935.b-cdn.net/b3dbffc1-4666-4674-b3a1-38cee815290d/play_360p.mp4',
        4475.948,
        'https://vz-e0f2a12f-935.b-cdn.net/b3dbffc1-4666-4674-b3a1-38cee815290d/thumbnail.jpg',
        NULL,
        'b3dbffc1-4666-4674-b3a1-38cee815290d',
        'job-vid-promotion',
        '2026-06-23 09:00:00',
        '2026-06-25 10:00:00'
    ),
    (
        17,
        8,
        6,
        'long',
        'Tổng Hợp Khóa Học Digital Marketing Cho Người Mới',
        'https://vz-e0f2a12f-935.b-cdn.net/861e515e-38a0-42d0-be13-1ce405b9f2f2/play_1080p.mp4',
        5102.891,
        'https://vz-e0f2a12f-935.b-cdn.net/861e515e-38a0-42d0-be13-1ce405b9f2f2/thumbnail.jpg',
        NULL,
        '861e515e-38a0-42d0-be13-1ce405b9f2f2',
        'job-vid-mkt-beginner',
        '2026-01-13 14:35:00',
        '2026-06-25 10:00:00'
    ),
    (
        18,
        9,
        7,
        'long',
        '1 Tiếng Nâng Cấp Kỹ Năng CAPCUT',
        'https://vz-e0f2a12f-935.b-cdn.net/3c2d27ff-0018-4086-be6e-6a514b92997b/play_480p.mp4',
        3818.709,
        'https://vz-e0f2a12f-935.b-cdn.net/3c2d27ff-0018-4086-be6e-6a514b92997b/thumbnail.jpg',
        NULL,
        '3c2d27ff-0018-4086-be6e-6a514b92997b',
        'job-vid-capcut-1h',
        '2026-02-23 09:15:00',
        '2026-06-26 10:00:00'
    ),
    (
        19,
        6,
        4,
        'long',
        'Hướng Dẫn ChatGPT Cơ Bản Dành Cho Người Mới',
        'https://vz-e0f2a12f-935.b-cdn.net/cf8a16d4-5068-4589-acbe-bdf1f9223fb4/play_1080p.mp4',
        4884.203,
        'https://vz-e0f2a12f-935.b-cdn.net/cf8a16d4-5068-4589-acbe-bdf1f9223fb4/thumbnail.jpg',
        NULL,
        'cf8a16d4-5068-4589-acbe-bdf1f9223fb4',
        'job-vid-chatgpt-intro',
        '2026-06-02 14:00:00',
        '2026-06-23 10:00:00'
    ),
    (
        20,
        9,
        7,
        'long',
        'Premiere Pro Tutorial for Beginners - FULL',
        'https://vz-e0f2a12f-935.b-cdn.net/de09e532-9e4b-4825-9d2c-cc4c2dd237ac/play_480p.mp4',
        4566.741,
        'https://vz-e0f2a12f-935.b-cdn.net/de09e532-9e4b-4825-9d2c-cc4c2dd237ac/thumbnail.jpg',
        NULL,
        'de09e532-9e4b-4825-9d2c-cc4c2dd237ac',
        'job-vid-premiere-full',
        '2026-02-23 09:15:00',
        '2026-06-26 10:00:00'
    ),
    (
        21,
        2,
        1,
        'long',
        'Learn English Conversation - Basic English',
        'https://vz-e0f2a12f-935.b-cdn.net/051f4a88-1090-43fe-8bd9-e2fc2ba56b4c/play_480p.mp4',
        4433.493,
        'https://vz-e0f2a12f-935.b-cdn.net/051f4a88-1090-43fe-8bd9-e2fc2ba56b4c/thumbnail.jpg',
        NULL,
        '051f4a88-1090-43fe-8bd9-e2fc2ba56b4c',
        'job-vid-eng-basic',
        '2026-01-05 10:20:00',
        '2026-06-20 10:00:00'
    ),
    (
        22,
        10,
        NULL,
        'long',
        'Project Management 101 - Project Management Fundamentals',
        'https://vz-e0f2a12f-935.b-cdn.net/d7822231-af15-4b63-8a48-cb3d1887401b/play_480p.mp4',
        3623.808,
        'https://vz-e0f2a12f-935.b-cdn.net/d7822231-af15-4b63-8a48-cb3d1887401b/thumbnail.jpg',
        NULL,
        'd7822231-af15-4b63-8a48-cb3d1887401b',
        'job-vid-pm101',
        '2026-03-17 16:30:00',
        '2026-03-17 16:30:00'
    ),
    (
        23,
        10,
        NULL,
        'long',
        'Music Theory 101 for Guitar Players',
        'https://vz-e0f2a12f-935.b-cdn.net/6b9660b4-d42a-478b-bc0b-d7f78356ad8e/play_480p.mp4',
        5439.979,
        'https://vz-e0f2a12f-935.b-cdn.net/6b9660b4-d42a-478b-bc0b-d7f78356ad8e/thumbnail.jpg',
        NULL,
        '6b9660b4-d42a-478b-bc0b-d7f78356ad8e',
        'job-vid-music101',
        '2026-04-01 13:25:00',
        '2026-04-01 13:25:00'
    ),
    (
        24,
        7,
        5,
        'long',
        'Learn Photography in 90 Minutes',
        'https://vz-e0f2a12f-935.b-cdn.net/7369a811-6b91-4e67-ab30-24c1df19bed0/play_360p.mp4',
        5309.126,
        'https://vz-e0f2a12f-935.b-cdn.net/7369a811-6b91-4e67-ab30-24c1df19bed0/thumbnail.jpg',
        NULL,
        '7369a811-6b91-4e67-ab30-24c1df19bed0',
        'job-vid-photo90m',
        '2026-05-29 09:30:00',
        '2026-06-24 10:00:00'
    ),
    (
        25,
        8,
        6,
        'long',
        'Learn Copywriting in 76 Minutes',
        'https://vz-e0f2a12f-935.b-cdn.net/89d7ad9b-f9e4-473a-90b0-3206f1688733/play_360p.mp4',
        4296.713,
        'https://vz-e0f2a12f-935.b-cdn.net/89d7ad9b-f9e4-473a-90b0-3206f1688733/thumbnail.jpg',
        NULL,
        '89d7ad9b-f9e4-473a-90b0-3206f1688733',
        'job-vid-copywriting76m',
        '2026-05-06 12:20:00',
        '2026-06-25 10:00:00'
    ),
    (
        26,
        8,
        6,
        'long',
        'The Ultimate SEO Checklist for 2026',
        'https://vz-e0f2a12f-935.b-cdn.net/4e6560f6-f4e8-4753-85ed-82050ad928cc/play_360p.mp4',
        6713.771,
        'https://vz-e0f2a12f-935.b-cdn.net/4e6560f6-f4e8-4753-85ed-82050ad928cc/thumbnail.jpg',
        NULL,
        '4e6560f6-f4e8-4753-85ed-82050ad928cc',
        'job-vid-seochecklist',
        '2026-02-16 19:05:00',
        '2026-06-25 10:00:00'
    ),
    (
        27,
        7,
        5,
        'long',
        'Figma Crash Course - Auto Layout & Prototype',
        'https://vz-e0f2a12f-935.b-cdn.net/b7cb9243-d0da-4703-9a9a-fc6b0a8f8704/play_720p.mp4',
        3953.792,
        'https://vz-e0f2a12f-935.b-cdn.net/b7cb9243-d0da-4703-9a9a-fc6b0a8f8704/thumbnail.jpg',
        NULL,
        'b7cb9243-d0da-4703-9a9a-fc6b0a8f8704',
        'job-vid-figma-crash',
        '2026-07-24 10:10:00',
        '2026-07-24 10:10:00'
    ),
    (
        28,
        6,
        4,
        'long',
        'Machine Learning Fundamentals (1 Hour)',
        'https://vz-e0f2a12f-935.b-cdn.net/8553822c-dde6-4d56-b221-bff436fa03e2/play_720p.mp4',
        5860.885,
        'https://vz-e0f2a12f-935.b-cdn.net/8553822c-dde6-4d56-b221-bff436fa03e2/thumbnail.jpg',
        NULL,
        '8553822c-dde6-4d56-b221-bff436fa03e2',
        'job-vid-ml-1h',
        '2026-03-04 11:40:00',
        '2026-06-23 10:00:00'
    ),
    (
        29,
        5,
        3,
        'long',
        'Cấu Trúc Dữ Liệu & Giải Thuật - Bài 15: Cây Nhị Phân (Binary Tree)',
        'https://vz-e0f2a12f-935.b-cdn.net/2e1de040-92e4-4202-a077-52650cd8051f/play_720p.mp4',
        6605.291,
        'https://vz-e0f2a12f-935.b-cdn.net/2e1de040-92e4-4202-a077-52650cd8051f/thumbnail.jpg',
        NULL,
        '2e1de040-92e4-4202-a077-52650cd8051f',
        'job-vid-dsa-binarytree',
        '2026-02-03 15:10:00',
        '2026-06-22 10:00:00'
    ),
    (
        30,
        3,
        NULL,
        'long',
        'Học Tiếng Trung - Giáo Trình HSK 1 Online',
        'https://vz-e0f2a12f-935.b-cdn.net/18b78c57-1143-427a-8303-22066e72549c/play_1080p.mp4',
        4713.643,
        'https://vz-e0f2a12f-935.b-cdn.net/18b78c57-1143-427a-8303-22066e72549c/thumbnail.jpg',
        NULL,
        '18b78c57-1143-427a-8303-22066e72549c',
        'job-vid-hsk1-full',
        '2026-02-10 11:20:00',
        '2026-02-10 11:20:00'
    ),
    (
        31,
        2,
        1,
        'long',
        'Tiếng Anh Khi Ngủ - Phần 1: Học 500 Cụm Từ Tiếng Anh Thông Dụng',
        'https://vz-e0f2a12f-935.b-cdn.net/c38a9de2-55a6-409f-b109-6fca3f7ac266/play_720p.mp4',
        6070.037,
        'https://vz-e0f2a12f-935.b-cdn.net/c38a9de2-55a6-409f-b109-6fca3f7ac266/thumbnail.jpg',
        NULL,
        'c38a9de2-55a6-409f-b109-6fca3f7ac266',
        'job-vid-sleep-english-phrases',
        '2026-06-20 10:30:00',
        '2026-06-20 10:30:00'
    );

-- Generated from courses_data uploads; linked to long videos & courses below.
-- ============================================================================
INSERT INTO
    videos (
        id,
        user_id,
        mascot_image_id,
        type,
        name,
        url,
        duration,
        thumbnail,
        srt_raw_url,
        bunny_video_guid,
        job_id,
        created_at,
        updated_at
    )
VALUES (
        32,
        2,
        NULL,
        'highlight',
        'Introduction to Participles + Types of Participles + Present Participle Usage',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4',
        120.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg',
        NULL,
        NULL,
        'highlight-7470b5e8-t1',
        '2026-07-07 09:00:00',
        '2026-07-07 09:00:00'
    ),
    (
        33,
        2,
        NULL,
        'highlight',
        'Active vs. Passive Meaning + Past Participle Usage + Examples of Participles in Context',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542388/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/2/highlight_topic2_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4',
        119.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542388/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/2/highlight_topic2_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg',
        NULL,
        NULL,
        'highlight-7470b5e8-t2',
        '2026-07-07 10:00:00',
        '2026-07-07 10:00:00'
    ),
    (
        34,
        2,
        NULL,
        'highlight',
        'Practice Exercises + Common Mistakes with Participles + Conclusion and Recap',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542427/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/3/highlight_topic3_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4',
        199.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542427/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/3/highlight_topic3_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg',
        NULL,
        NULL,
        'highlight-7470b5e8-t3',
        '2026-07-07 11:00:00',
        '2026-07-07 11:00:00'
    ),
    (
        35,
        2,
        NULL,
        'highlight',
        'Introduction to Two-Verb Structures + First Usage of Two-Verb + Second Usage of Two-Verb',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543612/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/1/highlight_topic1_f451598a-dde9-448f-ac7e-2cc54a453379.mp4',
        125,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543612/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/1/highlight_topic1_f451598a-dde9-448f-ac7e-2cc54a453379.jpg',
        NULL,
        NULL,
        'highlight-f451598a-t1',
        '2026-07-07 12:00:00',
        '2026-07-07 12:00:00'
    ),
    (
        36,
        2,
        NULL,
        'highlight',
        'Third Usage of Two-Verb + Fourth Usage of Two-Verb + Common Structures with Two-Verb',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543619/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/2/highlight_topic2_f451598a-dde9-448f-ac7e-2cc54a453379.mp4',
        187,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543619/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/2/highlight_topic2_f451598a-dde9-448f-ac7e-2cc54a453379.jpg',
        NULL,
        NULL,
        'highlight-f451598a-t2',
        '2026-07-07 13:00:00',
        '2026-07-07 13:00:00'
    ),
    (
        37,
        2,
        NULL,
        'highlight',
        'Usage of Verb In + Common Verbs with Verb In',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543649/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/3/highlight_topic3_f451598a-dde9-448f-ac7e-2cc54a453379.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543649/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/3/highlight_topic3_f451598a-dde9-448f-ac7e-2cc54a453379.jpg',
        NULL,
        NULL,
        'highlight-f451598a-t3',
        '2026-07-07 14:00:00',
        '2026-07-07 14:00:00'
    ),
    (
        38,
        2,
        NULL,
        'highlight',
        'Introduction to Base Form Verbs + Explanation of ''Can'' and ''May'' + Difference Between ''Have to'' and ''Must''',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543651/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/4/highlight_topic4_f451598a-dde9-448f-ac7e-2cc54a453379.mp4',
        190,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543651/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/4/highlight_topic4_f451598a-dde9-448f-ac7e-2cc54a453379.jpg',
        NULL,
        NULL,
        'highlight-f451598a-t4',
        '2026-07-07 15:00:00',
        '2026-07-07 15:00:00'
    ),
    (
        39,
        2,
        NULL,
        'highlight',
        'Understanding ''Should'' and ''Ought to'' + Using ''Let'' and ''Make''',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/5/highlight_topic5_f451598a-dde9-448f-ac7e-2cc54a453379.mp4',
        165,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/5/highlight_topic5_f451598a-dde9-448f-ac7e-2cc54a453379.jpg',
        NULL,
        NULL,
        'highlight-f451598a-t5',
        '2026-07-07 16:00:00',
        '2026-07-07 16:00:00'
    ),
    (
        40,
        2,
        NULL,
        'highlight',
        'Explaining ''Help'' and Its Structure + Introduction to ''Have'' in Context + Using ''Please'' in Requests',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/6/highlight_topic6_f451598a-dde9-448f-ac7e-2cc54a453379.mp4',
        144,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543678/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/6/highlight_topic6_f451598a-dde9-448f-ac7e-2cc54a453379.jpg',
        NULL,
        NULL,
        'highlight-f451598a-t6',
        '2026-07-07 17:00:00',
        '2026-07-07 17:00:00'
    ),
    (
        41,
        2,
        NULL,
        'highlight',
        'Conclusion and Practice + Understanding ''In Order To'' + Review of Modal Verbs and Their Applications',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543703/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/7/highlight_topic7_f451598a-dde9-448f-ac7e-2cc54a453379.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543703/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/7/highlight_topic7_f451598a-dde9-448f-ac7e-2cc54a453379.jpg',
        NULL,
        NULL,
        'highlight-f451598a-t7',
        '2026-07-07 18:00:00',
        '2026-07-07 18:00:00'
    ),
    (
        42,
        2,
        NULL,
        'highlight',
        'Introduction to English Tenses + Present Simple Tense Overview',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544415/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/1/highlight_topic1_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544415/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/1/highlight_topic1_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t1',
        '2026-07-07 19:00:00',
        '2026-07-07 19:00:00'
    ),
    (
        43,
        2,
        NULL,
        'highlight',
        'Forming Questions in Present Simple',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544400/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/2/highlight_topic2_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        133.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544400/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/2/highlight_topic2_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t2',
        '2026-07-07 20:00:00',
        '2026-07-07 20:00:00'
    ),
    (
        44,
        2,
        NULL,
        'highlight',
        'Usage of Present Simple Tense + Common Time Expressions for Present Simple',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544444/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/3/highlight_topic3_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        199.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544444/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/3/highlight_topic3_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t3',
        '2026-07-07 21:00:00',
        '2026-07-07 21:00:00'
    ),
    (
        45,
        2,
        NULL,
        'highlight',
        'Introduction to Past Simple Tense + Forming Questions in Past Simple',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544454/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/4/highlight_topic4_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544454/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/4/highlight_topic4_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t4',
        '2026-07-07 22:00:00',
        '2026-07-07 22:00:00'
    ),
    (
        46,
        2,
        NULL,
        'highlight',
        'Usage of Past Simple Tense + Common Time Expressions for Past Simple',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544475/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/5/highlight_topic5_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        171.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544475/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/5/highlight_topic5_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t5',
        '2026-07-07 23:00:00',
        '2026-07-07 23:00:00'
    ),
    (
        47,
        2,
        NULL,
        'highlight',
        'Introduction to Future Simple Tense + Introduction to Tenses in English + Future Simple Tense Structure',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544479/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/6/highlight_topic6_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        140.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544479/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/6/highlight_topic6_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t6',
        '2026-07-08 00:00:00',
        '2026-07-08 00:00:00'
    ),
    (
        48,
        2,
        NULL,
        'highlight',
        'Examples of Future Simple Tense',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544494/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/7/highlight_topic7_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        128,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544494/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/7/highlight_topic7_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t7',
        '2026-07-08 01:00:00',
        '2026-07-08 01:00:00'
    ),
    (
        49,
        2,
        NULL,
        'highlight',
        'Usage of Future Simple Tense',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544513/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/8/highlight_topic8_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        161,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544513/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/8/highlight_topic8_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t8',
        '2026-07-08 02:00:00',
        '2026-07-08 02:00:00'
    ),
    (
        50,
        2,
        NULL,
        'highlight',
        'Common Time Expressions for Future Simple + Present Continuous and Past Continuous Tenses',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544524/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/9/highlight_topic9_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        171,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544524/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/9/highlight_topic9_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t9',
        '2026-07-08 03:00:00',
        '2026-07-08 03:00:00'
    ),
    (
        51,
        2,
        NULL,
        'highlight',
        'Forming Questions in Continuous Tenses + Usage of Continuous Tenses + Present Continuous for Future Plans',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544538/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/10/highlight_topic10_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        138.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544538/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/10/highlight_topic10_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t10',
        '2026-07-08 04:00:00',
        '2026-07-08 04:00:00'
    ),
    (
        52,
        2,
        NULL,
        'highlight',
        'Past Continuous Tense Overview + Examples of Past Continuous Tense + Past Continuous Tense',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544556/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/11/highlight_topic11_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        198.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544556/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/11/highlight_topic11_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t11',
        '2026-07-08 05:00:00',
        '2026-07-08 05:00:00'
    ),
    (
        53,
        2,
        NULL,
        'highlight',
        'Examples of Past Continuous Tense + Present Perfect Tense + Present Perfect Tense Usage',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544588/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/12/highlight_topic12_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544588/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/12/highlight_topic12_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t12',
        '2026-07-08 06:00:00',
        '2026-07-08 06:00:00'
    ),
    (
        54,
        2,
        NULL,
        'highlight',
        'Hiện Tại Hoàn Thành + Ví dụ về Hiện Tại Hoàn Thành + Cách Dùng Hiện Tại Hoàn Thành Tiếp Diễn + Công Thức Quá Khứ Hoàn Thành',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544590/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/13/highlight_topic13_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        182,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544590/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/13/highlight_topic13_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t13',
        '2026-07-08 07:00:00',
        '2026-07-08 07:00:00'
    ),
    (
        55,
        2,
        NULL,
        'highlight',
        'Ví dụ về Quá Khứ Hoàn Thành + Examples of Past Perfect Tense + Quá Khứ Hoàn Thành Tiếp Diễn',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544629/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/14/highlight_topic14_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544629/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/14/highlight_topic14_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t14',
        '2026-07-08 08:00:00',
        '2026-07-08 08:00:00'
    ),
    (
        56,
        2,
        NULL,
        'highlight',
        'Examples of Past Perfect Continuous Tense + Thực Hành với Các Thì + Câu Hỏi Thực Hành về Hiện Tại và Quá Khứ',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544628/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/15/highlight_topic15_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        193.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544628/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/15/highlight_topic15_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t15',
        '2026-07-08 09:00:00',
        '2026-07-08 09:00:00'
    ),
    (
        57,
        2,
        NULL,
        'highlight',
        'Câu Hỏi Thực Hành Khó + Tổng Kết và Lời Khuyên',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544656/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/16/highlight_topic16_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4',
        200,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779544656/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/16/highlight_topic16_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg',
        NULL,
        NULL,
        'highlight-2e069ab1-t16',
        '2026-07-08 10:00:00',
        '2026-07-08 10:00:00'
    ),
    (
        58,
        2,
        NULL,
        'highlight',
        'Understanding the Phrase ''Nice to Meet You''',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542700/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/1/highlight_topic1_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        170,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542700/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/1/highlight_topic1_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t1',
        '2026-07-08 11:00:00',
        '2026-07-08 11:00:00'
    ),
    (
        59,
        2,
        NULL,
        'highlight',
        'Correct Usage of ''Nice to Meet You''',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542688/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/2/highlight_topic2_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        128,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542688/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/2/highlight_topic2_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t2',
        '2026-07-08 12:00:00',
        '2026-07-08 12:00:00'
    ),
    (
        60,
        2,
        NULL,
        'highlight',
        'Alternative Expressions for Asking About Toilets',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542743/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/3/highlight_topic3_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        153.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542743/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/3/highlight_topic3_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t3',
        '2026-07-08 13:00:00',
        '2026-07-08 13:00:00'
    ),
    (
        61,
        2,
        NULL,
        'highlight',
        'Using ''I Like'' and ''I Like To''',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542747/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/4/highlight_topic4_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        129,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542747/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/4/highlight_topic4_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t4',
        '2026-07-08 14:00:00',
        '2026-07-08 14:00:00'
    ),
    (
        62,
        2,
        NULL,
        'highlight',
        'Expressing Dislikes with ''I Don''t Like''',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542824/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/5/highlight_topic5_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542824/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/5/highlight_topic5_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t5',
        '2026-07-08 15:00:00',
        '2026-07-08 15:00:00'
    ),
    (
        63,
        2,
        NULL,
        'highlight',
        'Understanding Western Names',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542832/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/6/highlight_topic6_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        198.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542832/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/6/highlight_topic6_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t6',
        '2026-07-08 16:00:00',
        '2026-07-08 16:00:00'
    ),
    (
        64,
        2,
        NULL,
        'highlight',
        'Common Pet Names in English + Expressions for Leaving a Conversation',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542906/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/7/highlight_topic7_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        193.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542906/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/7/highlight_topic7_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t7',
        '2026-07-08 17:00:00',
        '2026-07-08 17:00:00'
    ),
    (
        65,
        2,
        NULL,
        'highlight',
        'Expressing Head Injuries or Sickness',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542903/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/8/highlight_topic8_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        163,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542903/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/8/highlight_topic8_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t8',
        '2026-07-08 18:00:00',
        '2026-07-08 18:00:00'
    ),
    (
        66,
        2,
        NULL,
        'highlight',
        'Asking for Permission',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542987/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/9/highlight_topic9_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        200,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542987/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/9/highlight_topic9_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t9',
        '2026-07-08 19:00:00',
        '2026-07-08 19:00:00'
    ),
    (
        67,
        2,
        NULL,
        'highlight',
        'Expressing Emotions in English',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542978/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/10/highlight_topic10_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        169.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779542978/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/10/highlight_topic10_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t10',
        '2026-07-08 20:00:00',
        '2026-07-08 20:00:00'
    ),
    (
        68,
        2,
        NULL,
        'highlight',
        'Asking for Directions',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543062/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/11/highlight_topic11_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        198.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543062/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/11/highlight_topic11_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t11',
        '2026-07-08 21:00:00',
        '2026-07-08 21:00:00'
    ),
    (
        69,
        2,
        NULL,
        'highlight',
        'Words of Encouragement',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543067/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/12/highlight_topic12_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        195.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543067/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/12/highlight_topic12_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t12',
        '2026-07-08 22:00:00',
        '2026-07-08 22:00:00'
    ),
    (
        70,
        2,
        NULL,
        'highlight',
        'Expressing Language Proficiency',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543136/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/13/highlight_topic13_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        189,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543136/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/13/highlight_topic13_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t13',
        '2026-07-08 23:00:00',
        '2026-07-08 23:00:00'
    ),
    (
        71,
        2,
        NULL,
        'highlight',
        'Apologizing in English',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543131/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/14/highlight_topic14_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        145.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543131/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/14/highlight_topic14_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t14',
        '2026-07-09 00:00:00',
        '2026-07-09 00:00:00'
    ),
    (
        72,
        2,
        NULL,
        'highlight',
        'Pointing Out Embarrassing Situations',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543203/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/15/highlight_topic15_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        181.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543203/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/15/highlight_topic15_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t15',
        '2026-07-09 01:00:00',
        '2026-07-09 01:00:00'
    ),
    (
        73,
        2,
        NULL,
        'highlight',
        'Discussing the Weather',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543219/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/16/highlight_topic16_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        194.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543219/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/16/highlight_topic16_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t16',
        '2026-07-09 02:00:00',
        '2026-07-09 02:00:00'
    ),
    (
        74,
        2,
        NULL,
        'highlight',
        'Asking for Repetition',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543281/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/17/highlight_topic17_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        186.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543281/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/17/highlight_topic17_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t17',
        '2026-07-09 03:00:00',
        '2026-07-09 03:00:00'
    ),
    (
        75,
        2,
        NULL,
        'highlight',
        'Inquiring About Weekends',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543306/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/18/highlight_topic18_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        198.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543306/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/18/highlight_topic18_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t18',
        '2026-07-09 04:00:00',
        '2026-07-09 04:00:00'
    ),
    (
        76,
        2,
        NULL,
        'highlight',
        'Expressing Forgetfulness',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543328/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/19/highlight_topic19_24036968-59e2-4c3f-ab0f-ad91d0677c33.mp4',
        162.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779543328/jobs/24036968-59e2-4c3f-ab0f-ad91d0677c33/topics/19/highlight_topic19_24036968-59e2-4c3f-ab0f-ad91d0677c33.jpg',
        NULL,
        NULL,
        'highlight-24036968-t19',
        '2026-07-09 05:00:00',
        '2026-07-09 05:00:00'
    ),
    (
        77,
        4,
        NULL,
        'highlight',
        'Introduction to HTML + Setting Up the Development Environment',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456998/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/1/highlight_topic1_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        156,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456998/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/1/highlight_topic1_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t1',
        '2026-07-09 06:00:00',
        '2026-07-09 06:00:00'
    ),
    (
        78,
        4,
        NULL,
        'highlight',
        'Creating the index.html File + Basic HTML Document Structure',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457007/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/2/highlight_topic2_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        198.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457007/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/2/highlight_topic2_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t2',
        '2026-07-09 07:00:00',
        '2026-07-09 07:00:00'
    ),
    (
        79,
        4,
        NULL,
        'highlight',
        'Using Header Tags + Paragraph Elements + Line Breaks and Horizontal Rules',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457039/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/3/highlight_topic3_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        180.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457039/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/3/highlight_topic3_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t3',
        '2026-07-09 08:00:00',
        '2026-07-09 08:00:00'
    ),
    (
        80,
        4,
        NULL,
        'highlight',
        'Adding Comments in HTML + Creating Hyperlinks',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457052/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/4/highlight_topic4_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457052/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/4/highlight_topic4_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t4',
        '2026-07-09 09:00:00',
        '2026-07-09 09:00:00'
    ),
    (
        81,
        4,
        NULL,
        'highlight',
        'Adding Images to a Web Page',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/5/highlight_topic5_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        197.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/5/highlight_topic5_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t5',
        '2026-07-09 10:00:00',
        '2026-07-09 10:00:00'
    ),
    (
        82,
        4,
        NULL,
        'highlight',
        'Embedding Audio in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/6/highlight_topic6_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        129.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457084/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/6/highlight_topic6_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t6',
        '2026-07-09 11:00:00',
        '2026-07-09 11:00:00'
    ),
    (
        83,
        4,
        NULL,
        'highlight',
        'Embedding Video in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457116/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/7/highlight_topic7_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        132.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457116/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/7/highlight_topic7_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t7',
        '2026-07-09 12:00:00',
        '2026-07-09 12:00:00'
    ),
    (
        84,
        4,
        NULL,
        'highlight',
        'Text Formatting Tags + Creating Lists in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457134/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/8/highlight_topic8_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        197.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457134/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/8/highlight_topic8_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t8',
        '2026-07-09 13:00:00',
        '2026-07-09 13:00:00'
    ),
    (
        85,
        4,
        NULL,
        'highlight',
        'Creating Tables in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457160/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/9/highlight_topic9_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457160/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/9/highlight_topic9_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t9',
        '2026-07-09 14:00:00',
        '2026-07-09 14:00:00'
    ),
    (
        86,
        4,
        NULL,
        'highlight',
        'Adding Color to a Web Page',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457179/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/10/highlight_topic10_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        196.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457179/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/10/highlight_topic10_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t10',
        '2026-07-09 15:00:00',
        '2026-07-09 15:00:00'
    ),
    (
        87,
        4,
        NULL,
        'highlight',
        'Using Span and Div Tags',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457192/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/11/highlight_topic11_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        138,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457192/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/11/highlight_topic11_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t11',
        '2026-07-09 16:00:00',
        '2026-07-09 16:00:00'
    ),
    (
        88,
        4,
        NULL,
        'highlight',
        'Understanding Meta Tags',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457223/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/12/highlight_topic12_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        196.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457223/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/12/highlight_topic12_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t12',
        '2026-07-09 17:00:00',
        '2026-07-09 17:00:00'
    ),
    (
        89,
        4,
        NULL,
        'highlight',
        'Using iFrames',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457238/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/13/highlight_topic13_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457238/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/13/highlight_topic13_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t13',
        '2026-07-09 18:00:00',
        '2026-07-09 18:00:00'
    ),
    (
        90,
        4,
        NULL,
        'highlight',
        'Creating Buttons in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457270/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/14/highlight_topic14_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        197,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457270/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/14/highlight_topic14_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t14',
        '2026-07-09 19:00:00',
        '2026-07-09 19:00:00'
    ),
    (
        91,
        4,
        NULL,
        'highlight',
        'Creating Forms in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779457282/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/15/highlight_topic15_04a43ccf-06fe-4798-932c-049e1f758a3e.mp4',
        195.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779457282/jobs/04a43ccf-06fe-4798-932c-049e1f758a3e/topics/15/highlight_topic15_04a43ccf-06fe-4798-932c-049e1f758a3e.jpg',
        NULL,
        NULL,
        'highlight-04a43ccf-t15',
        '2026-07-09 20:00:00',
        '2026-07-09 20:00:00'
    ),
    (
        92,
        6,
        NULL,
        'highlight',
        'Registering for ChatGPT',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779454956/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/1/highlight_topic1_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4',
        200,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779454956/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/1/highlight_topic1_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg',
        NULL,
        NULL,
        'highlight-e0a50157-t1',
        '2026-07-09 21:00:00',
        '2026-07-09 21:00:00'
    ),
    (
        93,
        6,
        NULL,
        'highlight',
        'Advanced Usage of ChatGPT + Using ChatGPT for Content Creation',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779454962/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/2/highlight_topic2_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779454962/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/2/highlight_topic2_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg',
        NULL,
        NULL,
        'highlight-e0a50157-t2',
        '2026-07-09 22:00:00',
        '2026-07-09 22:00:00'
    ),
    (
        94,
        6,
        NULL,
        'highlight',
        'Future of ChatGPT and AI Tools + Introduction to Upgrading ChatGPT Accounts',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455184/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/3/highlight_topic3_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4',
        198.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455184/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/3/highlight_topic3_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg',
        NULL,
        NULL,
        'highlight-e0a50157-t3',
        '2026-07-09 23:00:00',
        '2026-07-09 23:00:00'
    ),
    (
        95,
        6,
        NULL,
        'highlight',
        'Differences Between Free and Paid Accounts + Benefits of Upgrading to ChatGPT Plus + How to Upgrade Your Account',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455141/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/4/highlight_topic4_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4',
        184,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455141/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/4/highlight_topic4_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg',
        NULL,
        NULL,
        'highlight-e0a50157-t4',
        '2026-07-10 00:00:00',
        '2026-07-10 00:00:00'
    ),
    (
        96,
        6,
        NULL,
        'highlight',
        'Demonstration of Data Summarization',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455401/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/5/highlight_topic5_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4',
        199.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455401/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/5/highlight_topic5_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg',
        NULL,
        NULL,
        'highlight-e0a50157-t5',
        '2026-07-10 01:00:00',
        '2026-07-10 01:00:00'
    ),
    (
        97,
        6,
        NULL,
        'highlight',
        'Interacting with ChatGPT for Data Insights + Limitations and Considerations',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455491/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/6/highlight_topic6_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455491/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/6/highlight_topic6_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg',
        NULL,
        NULL,
        'highlight-e0a50157-t6',
        '2026-07-10 02:00:00',
        '2026-07-10 02:00:00'
    ),
    (
        98,
        6,
        NULL,
        'highlight',
        'Using ChatGPT for Image Analysis + Creating Custom Chatbots with ChatGPT + Conclusion and Future Applications',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779455730/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/7/highlight_topic7_e0a50157-99c9-4572-bd05-b8adaeddf98a.mp4',
        196,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779455730/jobs/e0a50157-99c9-4572-bd05-b8adaeddf98a/topics/7/highlight_topic7_e0a50157-99c9-4572-bd05-b8adaeddf98a.jpg',
        NULL,
        NULL,
        'highlight-e0a50157-t7',
        '2026-07-10 03:00:00',
        '2026-07-10 03:00:00'
    ),
    (
        99,
        6,
        NULL,
        'highlight',
        'Introduction to Data Science and Machine Learning + Multidisciplinary Nature of Data Science',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456016/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/1/highlight_topic1_42eee861-53be-4c03-a7f8-244f236666eb.mp4',
        128,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456016/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/1/highlight_topic1_42eee861-53be-4c03-a7f8-244f236666eb.jpg',
        NULL,
        NULL,
        'highlight-42eee861-t1',
        '2026-07-10 04:00:00',
        '2026-07-10 04:00:00'
    ),
    (
        100,
        6,
        NULL,
        'highlight',
        'Difference Between Data Science, Data Analytics, and Big Data + Why Data Science is Relevant Now + Applications of Data Science and Machine Learning',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456069/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/2/highlight_topic2_42eee861-53be-4c03-a7f8-244f236666eb.mp4',
        198.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456069/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/2/highlight_topic2_42eee861-53be-4c03-a7f8-244f236666eb.jpg',
        NULL,
        NULL,
        'highlight-42eee861-t2',
        '2026-07-10 05:00:00',
        '2026-07-10 05:00:00'
    ),
    (
        101,
        6,
        NULL,
        'highlight',
        'History and Future of Data Science + Understanding Data and Variables',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456160/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/3/highlight_topic3_42eee861-53be-4c03-a7f8-244f236666eb.mp4',
        197,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456160/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/3/highlight_topic3_42eee861-53be-4c03-a7f8-244f236666eb.jpg',
        NULL,
        NULL,
        'highlight-42eee861-t3',
        '2026-07-10 06:00:00',
        '2026-07-10 06:00:00'
    ),
    (
        102,
        6,
        NULL,
        'highlight',
        'Handling Outliers and Missing Data + Types of Machine Learning',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456226/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/4/highlight_topic4_42eee861-53be-4c03-a7f8-244f236666eb.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456226/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/4/highlight_topic4_42eee861-53be-4c03-a7f8-244f236666eb.jpg',
        NULL,
        NULL,
        'highlight-42eee861-t4',
        '2026-07-10 07:00:00',
        '2026-07-10 07:00:00'
    ),
    (
        103,
        6,
        NULL,
        'highlight',
        'Model Evaluation and Performance Indicators',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456318/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/5/highlight_topic5_42eee861-53be-4c03-a7f8-244f236666eb.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456318/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/5/highlight_topic5_42eee861-53be-4c03-a7f8-244f236666eb.jpg',
        NULL,
        NULL,
        'highlight-42eee861-t5',
        '2026-07-10 08:00:00',
        '2026-07-10 08:00:00'
    ),
    (
        104,
        6,
        NULL,
        'highlight',
        'Best Practices in Data Science and Machine Learning',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456352/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/6/highlight_topic6_42eee861-53be-4c03-a7f8-244f236666eb.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456352/jobs/42eee861-53be-4c03-a7f8-244f236666eb/topics/6/highlight_topic6_42eee861-53be-4c03-a7f8-244f236666eb.jpg',
        NULL,
        NULL,
        'highlight-42eee861-t6',
        '2026-07-10 09:00:00',
        '2026-07-10 09:00:00'
    ),
    (
        105,
        5,
        NULL,
        'highlight',
        'Introduction to System Design + Foundational Concepts in System Design',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456631/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/1/highlight_topic1_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456631/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/1/highlight_topic1_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t1',
        '2026-07-10 10:00:00',
        '2026-07-10 10:00:00'
    ),
    (
        106,
        5,
        NULL,
        'highlight',
        'Database Selection: SQL vs NoSQL',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456629/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/2/highlight_topic2_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        196,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456629/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/2/highlight_topic2_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t2',
        '2026-07-10 11:00:00',
        '2026-07-10 11:00:00'
    ),
    (
        107,
        5,
        NULL,
        'highlight',
        'Scaling Strategies: Vertical vs Horizontal',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456668/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/3/highlight_topic3_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        194.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456668/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/3/highlight_topic3_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t3',
        '2026-07-10 12:00:00',
        '2026-07-10 12:00:00'
    ),
    (
        108,
        5,
        NULL,
        'highlight',
        'Load Balancing Techniques',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456679/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/4/highlight_topic4_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        195,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456679/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/4/highlight_topic4_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t4',
        '2026-07-10 13:00:00',
        '2026-07-10 13:00:00'
    ),
    (
        109,
        5,
        NULL,
        'highlight',
        'Avoiding Single Points of Failure',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456710/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/5/highlight_topic5_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        195.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456710/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/5/highlight_topic5_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t5',
        '2026-07-10 14:00:00',
        '2026-07-10 14:00:00'
    ),
    (
        110,
        5,
        NULL,
        'highlight',
        'API Design Principles + Understanding REST, GraphQL, and GRPC',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456726/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/6/highlight_topic6_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        196,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456726/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/6/highlight_topic6_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t6',
        '2026-07-10 15:00:00',
        '2026-07-10 15:00:00'
    ),
    (
        111,
        5,
        NULL,
        'highlight',
        'Authentication vs Authorization',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456782/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/7/highlight_topic7_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        196.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456782/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/7/highlight_topic7_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t7',
        '2026-07-10 16:00:00',
        '2026-07-10 16:00:00'
    ),
    (
        112,
        5,
        NULL,
        'highlight',
        'API Security Best Practices',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779456780/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/8/highlight_topic8_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779456780/jobs/dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9/topics/8/highlight_topic8_dc1014ed-9192-4a0d-bc25-ec73ba0dbbd9.jpg',
        NULL,
        NULL,
        'highlight-dc1014ed-t8',
        '2026-07-10 17:00:00',
        '2026-07-10 17:00:00'
    ),
    (
        113,
        5,
        NULL,
        'highlight',
        'Giới thiệu về cây nhị phân và cây nhị phân tìm kiếm + Cấu trúc của cây nhị phân',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385167/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/1/highlight_topic1_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        131.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385167/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/1/highlight_topic1_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t1',
        '2026-07-10 18:00:00',
        '2026-07-10 18:00:00'
    ),
    (
        114,
        5,
        NULL,
        'highlight',
        'Các loại cây nhị phân + Cây nhị phân tìm kiếm (BST)',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385221/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/2/highlight_topic2_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        199.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385221/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/2/highlight_topic2_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t2',
        '2026-07-10 19:00:00',
        '2026-07-10 19:00:00'
    ),
    (
        115,
        5,
        NULL,
        'highlight',
        'Thao tác thêm nút vào cây nhị phân tìm kiếm',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/3/highlight_topic3_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        145.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/3/highlight_topic3_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t3',
        '2026-07-10 20:00:00',
        '2026-07-10 20:00:00'
    ),
    (
        116,
        5,
        NULL,
        'highlight',
        'Introduction to Binary Search Tree Insertion + Iterative vs Recursive Insertion Methods + Creating a New Root Node + Handling Existing Nodes + Node Comparison and Traversal + Finalizing the Insertion ',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385488/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/4/highlight_topic4_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        186.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385488/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/4/highlight_topic4_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t4',
        '2026-07-10 21:00:00',
        '2026-07-10 21:00:00'
    ),
    (
        117,
        5,
        NULL,
        'highlight',
        'Thao tác xóa nút trong cây nhị phân tìm kiếm',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385437/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/5/highlight_topic5_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        160.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385437/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/5/highlight_topic5_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t5',
        '2026-07-10 22:00:00',
        '2026-07-10 22:00:00'
    ),
    (
        118,
        5,
        NULL,
        'highlight',
        'Giới thiệu về cây nhị phân và các thao tác cơ bản + Implementing the Deletion Function',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385628/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/6/highlight_topic6_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        200.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385628/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/6/highlight_topic6_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t6',
        '2026-07-10 23:00:00',
        '2026-07-10 23:00:00'
    ),
    (
        119,
        5,
        NULL,
        'highlight',
        'Cách thực hiện hàm xóa nút + Trường hợp xóa nút có hai con',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385604/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/7/highlight_topic7_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        131,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385604/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/7/highlight_topic7_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t7',
        '2026-07-11 00:00:00',
        '2026-07-11 00:00:00'
    ),
    (
        120,
        5,
        NULL,
        'highlight',
        'Trường hợp xóa nút có một con + Trường hợp xóa nút không có con + Tìm kiếm nút trong cây nhị phân',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385858/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/8/highlight_topic8_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385858/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/8/highlight_topic8_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t8',
        '2026-07-11 01:00:00',
        '2026-07-11 01:00:00'
    ),
    (
        121,
        5,
        NULL,
        'highlight',
        'Duyệt cây nhị phân',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385829/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/9/highlight_topic9_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385829/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/9/highlight_topic9_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t9',
        '2026-07-11 02:00:00',
        '2026-07-11 02:00:00'
    ),
    (
        122,
        5,
        NULL,
        'highlight',
        'Phân tích độ phức tạp của các thuật toán',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779386147/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/10/highlight_topic10_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        198.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779386147/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/10/highlight_topic10_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t10',
        '2026-07-11 03:00:00',
        '2026-07-11 03:00:00'
    ),
    (
        123,
        5,
        NULL,
        'highlight',
        'Tính chiều cao của cây nhị phân',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779385997/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/11/highlight_topic11_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        146.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779385997/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/11/highlight_topic11_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t11',
        '2026-07-11 04:00:00',
        '2026-07-11 04:00:00'
    ),
    (
        124,
        5,
        NULL,
        'highlight',
        'Kiểm tra tổng đường đi trong cây',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779386179/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/12/highlight_topic12_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779386179/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/12/highlight_topic12_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t12',
        '2026-07-11 05:00:00',
        '2026-07-11 05:00:00'
    ),
    (
        125,
        5,
        NULL,
        'highlight',
        'Thực hiện giải thuật kiểm tra tổng + Kết luận và tổng kết',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779386285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/13/highlight_topic13_39c9391e-df70-4bbd-964c-04c32dade0ba.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779386285/jobs/39c9391e-df70-4bbd-964c-04c32dade0ba/topics/13/highlight_topic13_39c9391e-df70-4bbd-964c-04c32dade0ba.jpg',
        NULL,
        NULL,
        'highlight-39c9391e-t13',
        '2026-07-11 06:00:00',
        '2026-07-11 06:00:00'
    ),
    (
        126,
        4,
        NULL,
        'highlight',
        'Cài đặt môi trường lập trình cho máy Windows mới + Cấu hình máy tính mới + Cài đặt Visual Studio Code',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545322/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/1/highlight_topic1_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545322/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/1/highlight_topic1_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg',
        NULL,
        NULL,
        'highlight-c5c84a09-t1',
        '2026-07-11 07:00:00',
        '2026-07-11 07:00:00'
    ),
    (
        127,
        4,
        NULL,
        'highlight',
        'Thiết lập terminal + Cài đặt Node.js',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545327/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/2/highlight_topic2_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545327/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/2/highlight_topic2_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg',
        NULL,
        NULL,
        'highlight-c5c84a09-t2',
        '2026-07-11 08:00:00',
        '2026-07-11 08:00:00'
    ),
    (
        128,
        4,
        NULL,
        'highlight',
        'Hướng dẫn cài đặt môi trường lập trình cho Windows + Cài đặt Visual Studio Code',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545346/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/3/highlight_topic3_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4',
        144.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545346/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/3/highlight_topic3_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg',
        NULL,
        NULL,
        'highlight-c5c84a09-t3',
        '2026-07-11 09:00:00',
        '2026-07-11 09:00:00'
    ),
    (
        129,
        4,
        NULL,
        'highlight',
        'Cài đặt extensions cho Visual Studio Code + Kiểm tra cài đặt thành công + Cài đặt Node.js + Cài đặt Git + Thiết lập terminal + Cấu hình PATH',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545365/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/4/highlight_topic4_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545365/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/4/highlight_topic4_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg',
        NULL,
        NULL,
        'highlight-c5c84a09-t4',
        '2026-07-11 10:00:00',
        '2026-07-11 10:00:00'
    ),
    (
        130,
        4,
        NULL,
        'highlight',
        'Cài đặt môi trường lập trình cho máy Windows mới + Hướng dẫn cài đặt môi trường lập trình cho Windows',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545411/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/5/highlight_topic5_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545411/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/5/highlight_topic5_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg',
        NULL,
        NULL,
        'highlight-c5c84a09-t5',
        '2026-07-11 11:00:00',
        '2026-07-11 11:00:00'
    ),
    (
        131,
        4,
        NULL,
        'highlight',
        'Cài đặt Visual Studio Code + Cài đặt Git + Cài đặt Node.js + Thiết lập terminal + Cài đặt extensions cho Visual Studio Code + Cấu hình PATH + Kiểm tra cài đặt thành công + Cài đặt và cấu hình Apache +',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779545406/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/6/highlight_topic6_c5c84a09-31f8-4ca4-bb61-93e74496312e.mp4',
        199.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779545406/jobs/c5c84a09-31f8-4ca4-bb61-93e74496312e/topics/6/highlight_topic6_c5c84a09-31f8-4ca4-bb61-93e74496312e.jpg',
        NULL,
        NULL,
        'highlight-c5c84a09-t6',
        '2026-07-11 12:00:00',
        '2026-07-11 12:00:00'
    ),
    (
        132,
        4,
        NULL,
        'highlight',
        'Giới thiệu về CORS Policy + Khái niệm nguồn gốc (Origin)',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546460/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/1/highlight_topic1_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546460/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/1/highlight_topic1_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg',
        NULL,
        NULL,
        'highlight-04dc92fc-t1',
        '2026-07-11 13:00:00',
        '2026-07-11 13:00:00'
    ),
    (
        133,
        4,
        NULL,
        'highlight',
        'Chính sách CORS + Access-Control-Allow-Origin',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546439/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/2/highlight_topic2_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4',
        94.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546439/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/2/highlight_topic2_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg',
        NULL,
        NULL,
        'highlight-04dc92fc-t2',
        '2026-07-11 14:00:00',
        '2026-07-11 14:00:00'
    ),
    (
        134,
        4,
        NULL,
        'highlight',
        'Xử lý lỗi CORS + Access-Control-Allow-Origin + Cấu hình CORS',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546466/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/3/highlight_topic3_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4',
        147,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546466/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/3/highlight_topic3_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg',
        NULL,
        NULL,
        'highlight-04dc92fc-t3',
        '2026-07-11 15:00:00',
        '2026-07-11 15:00:00'
    ),
    (
        135,
        4,
        NULL,
        'highlight',
        'Tình huống thực tế với CORS + Thực tiễn sử dụng CORS + Tương lai của CORS',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546497/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/4/highlight_topic4_04dc92fc-5258-4571-ba23-32b6cf16c331.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546497/jobs/04dc92fc-5258-4571-ba23-32b6cf16c331/topics/4/highlight_topic4_04dc92fc-5258-4571-ba23-32b6cf16c331.jpg',
        NULL,
        NULL,
        'highlight-04dc92fc-t4',
        '2026-07-11 16:00:00',
        '2026-07-11 16:00:00'
    ),
    (
        136,
        4,
        NULL,
        'highlight',
        'Introduction to HTML + Setting Up the Development Environment',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546911/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/1/highlight_topic1_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        156,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546911/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/1/highlight_topic1_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t1',
        '2026-07-11 17:00:00',
        '2026-07-11 17:00:00'
    ),
    (
        137,
        4,
        NULL,
        'highlight',
        'Creating the Basic HTML Structure',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546917/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/2/highlight_topic2_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        199.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546917/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/2/highlight_topic2_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t2',
        '2026-07-11 18:00:00',
        '2026-07-11 18:00:00'
    ),
    (
        138,
        4,
        NULL,
        'highlight',
        'Using HTML Tags',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546955/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/3/highlight_topic3_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        196.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546955/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/3/highlight_topic3_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t3',
        '2026-07-11 19:00:00',
        '2026-07-11 19:00:00'
    ),
    (
        139,
        4,
        NULL,
        'highlight',
        'Adding Comments in HTML + Creating Hyperlinks',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546962/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/4/highlight_topic4_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        197,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546962/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/4/highlight_topic4_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t4',
        '2026-07-11 20:00:00',
        '2026-07-11 20:00:00'
    ),
    (
        140,
        4,
        NULL,
        'highlight',
        'Inserting Images',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546997/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/5/highlight_topic5_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        197.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546997/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/5/highlight_topic5_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t5',
        '2026-07-11 21:00:00',
        '2026-07-11 21:00:00'
    ),
    (
        141,
        4,
        NULL,
        'highlight',
        'Adding Audio to a Web Page',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779546992/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/6/highlight_topic6_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        129.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779546992/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/6/highlight_topic6_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t6',
        '2026-07-11 22:00:00',
        '2026-07-11 22:00:00'
    ),
    (
        142,
        4,
        NULL,
        'highlight',
        'Embedding Videos',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547021/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/7/highlight_topic7_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        133,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547021/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/7/highlight_topic7_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t7',
        '2026-07-11 23:00:00',
        '2026-07-11 23:00:00'
    ),
    (
        143,
        4,
        NULL,
        'highlight',
        'Text Formatting Tags + Creating Lists in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547046/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/8/highlight_topic8_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        196.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547046/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/8/highlight_topic8_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t8',
        '2026-07-12 00:00:00',
        '2026-07-12 00:00:00'
    ),
    (
        144,
        4,
        NULL,
        'highlight',
        'Creating Tables in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547065/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/9/highlight_topic9_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547065/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/9/highlight_topic9_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t9',
        '2026-07-12 01:00:00',
        '2026-07-12 01:00:00'
    ),
    (
        145,
        4,
        NULL,
        'highlight',
        'Adding Color to Web Pages',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547090/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/10/highlight_topic10_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        196,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547090/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/10/highlight_topic10_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t10',
        '2026-07-12 02:00:00',
        '2026-07-12 02:00:00'
    ),
    (
        146,
        4,
        NULL,
        'highlight',
        'Understanding Span and Div Tags',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547096/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/11/highlight_topic11_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        138,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547096/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/11/highlight_topic11_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t11',
        '2026-07-12 03:00:00',
        '2026-07-12 03:00:00'
    ),
    (
        147,
        4,
        NULL,
        'highlight',
        'Using Meta Tags',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547134/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/12/highlight_topic12_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        196,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547134/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/12/highlight_topic12_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t12',
        '2026-07-12 04:00:00',
        '2026-07-12 04:00:00'
    ),
    (
        148,
        4,
        NULL,
        'highlight',
        'Embedding iFrames',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547141/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/13/highlight_topic13_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        200,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547141/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/13/highlight_topic13_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t13',
        '2026-07-12 05:00:00',
        '2026-07-12 05:00:00'
    ),
    (
        149,
        4,
        NULL,
        'highlight',
        'Creating Buttons in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547180/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/14/highlight_topic14_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        199.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547180/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/14/highlight_topic14_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t14',
        '2026-07-12 06:00:00',
        '2026-07-12 06:00:00'
    ),
    (
        150,
        4,
        NULL,
        'highlight',
        'Building Forms in HTML',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547188/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/15/highlight_topic15_fe447cb7-7dcf-4b58-864a-a0cb653466df.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547188/jobs/fe447cb7-7dcf-4b58-864a-a0cb653466df/topics/15/highlight_topic15_fe447cb7-7dcf-4b58-864a-a0cb653466df.jpg',
        NULL,
        NULL,
        'highlight-fe447cb7-t15',
        '2026-07-12 07:00:00',
        '2026-07-12 07:00:00'
    ),
    (
        151,
        4,
        NULL,
        'highlight',
        'Introduction to Node.js',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547744/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/1/highlight_topic1_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        160.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547744/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/1/highlight_topic1_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t1',
        '2026-07-12 08:00:00',
        '2026-07-12 08:00:00'
    ),
    (
        152,
        4,
        NULL,
        'highlight',
        'Node.js Architecture',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547746/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/2/highlight_topic2_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        175,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547746/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/2/highlight_topic2_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t2',
        '2026-07-12 09:00:00',
        '2026-07-12 09:00:00'
    ),
    (
        153,
        4,
        NULL,
        'highlight',
        'Asynchronous Nature of Node.js',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547787/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/3/highlight_topic3_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        196,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547787/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/3/highlight_topic3_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t3',
        '2026-07-12 10:00:00',
        '2026-07-12 10:00:00'
    ),
    (
        154,
        4,
        NULL,
        'highlight',
        'Installing Node.js',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547784/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/4/highlight_topic4_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        157,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547784/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/4/highlight_topic4_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t4',
        '2026-07-12 11:00:00',
        '2026-07-12 11:00:00'
    ),
    (
        155,
        4,
        NULL,
        'highlight',
        'Creating Your First Node.js Application',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547816/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/5/highlight_topic5_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        134.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547816/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/5/highlight_topic5_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t5',
        '2026-07-12 12:00:00',
        '2026-07-12 12:00:00'
    ),
    (
        156,
        4,
        NULL,
        'highlight',
        'Node.js Module System',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547834/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/6/highlight_topic6_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        199.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547834/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/6/highlight_topic6_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t6',
        '2026-07-12 13:00:00',
        '2026-07-12 13:00:00'
    ),
    (
        157,
        4,
        NULL,
        'highlight',
        'Working with Global Objects in Node.js',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547862/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/7/highlight_topic7_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        197,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547862/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/7/highlight_topic7_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t7',
        '2026-07-12 14:00:00',
        '2026-07-12 14:00:00'
    ),
    (
        158,
        4,
        NULL,
        'highlight',
        'Event Handling in Node.js',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547907/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/8/highlight_topic8_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        197.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547907/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/8/highlight_topic8_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t8',
        '2026-07-12 15:00:00',
        '2026-07-12 15:00:00'
    ),
    (
        159,
        4,
        NULL,
        'highlight',
        'Building an HTTP Server',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779547912/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/9/highlight_topic9_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779547912/jobs/8db9bec9-27ed-4efe-88db-5c85c1fc24c7/topics/9/highlight_topic9_8db9bec9-27ed-4efe-88db-5c85c1fc24c7.jpg',
        NULL,
        NULL,
        'highlight-8db9bec9-t9',
        '2026-07-12 16:00:00',
        '2026-07-12 16:00:00'
    ),
    (
        160,
        4,
        NULL,
        'highlight',
        'Introduction to JavaScript + Capabilities of JavaScript + JavaScript Execution Environments',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548209/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/1/highlight_topic1_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        129.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548209/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/1/highlight_topic1_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t1',
        '2026-07-12 17:00:00',
        '2026-07-12 17:00:00'
    ),
    (
        161,
        4,
        NULL,
        'highlight',
        'ECMAScript and ES6 Features + Setting Up Development Environment',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548220/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/2/highlight_topic2_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        187.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548220/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/2/highlight_topic2_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t2',
        '2026-07-12 18:00:00',
        '2026-07-12 18:00:00'
    ),
    (
        162,
        4,
        NULL,
        'highlight',
        'Creating and Linking JavaScript Files',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548260/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/3/highlight_topic3_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        199.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548260/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/3/highlight_topic3_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t3',
        '2026-07-12 19:00:00',
        '2026-07-12 19:00:00'
    ),
    (
        163,
        4,
        NULL,
        'highlight',
        'Understanding Variables',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548253/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/4/highlight_topic4_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        137.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548253/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/4/highlight_topic4_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t4',
        '2026-07-12 20:00:00',
        '2026-07-12 20:00:00'
    ),
    (
        164,
        4,
        NULL,
        'highlight',
        'Constants in JavaScript + Primitive Data Types',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548299/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/5/highlight_topic5_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        197.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548299/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/5/highlight_topic5_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t5',
        '2026-07-12 21:00:00',
        '2026-07-12 21:00:00'
    ),
    (
        165,
        4,
        NULL,
        'highlight',
        'Dynamic Typing in JavaScript',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548301/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/6/highlight_topic6_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        180,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548301/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/6/highlight_topic6_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t6',
        '2026-07-12 22:00:00',
        '2026-07-12 22:00:00'
    ),
    (
        166,
        4,
        NULL,
        'highlight',
        'Introduction to Objects',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548331/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/7/highlight_topic7_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        132.3,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548331/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/7/highlight_topic7_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t7',
        '2026-07-12 23:00:00',
        '2026-07-12 23:00:00'
    ),
    (
        167,
        4,
        NULL,
        'highlight',
        'Accessing Object Properties',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548332/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/8/highlight_topic8_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        130.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548332/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/8/highlight_topic8_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t8',
        '2026-07-13 00:00:00',
        '2026-07-13 00:00:00'
    ),
    (
        168,
        4,
        NULL,
        'highlight',
        'Working with Arrays',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548378/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/9/highlight_topic9_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        195,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548378/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/9/highlight_topic9_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t9',
        '2026-07-13 01:00:00',
        '2026-07-13 01:00:00'
    ),
    (
        169,
        4,
        NULL,
        'highlight',
        'Functions in JavaScript',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779548383/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/10/highlight_topic10_f8389269-4531-41f4-9d61-ca27393c75ff.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779548383/jobs/f8389269-4531-41f4-9d61-ca27393c75ff/topics/10/highlight_topic10_f8389269-4531-41f4-9d61-ca27393c75ff.jpg',
        NULL,
        NULL,
        'highlight-f8389269-t10',
        '2026-07-13 02:00:00',
        '2026-07-13 02:00:00'
    ),
    (
        170,
        10,
        NULL,
        'highlight',
        'Introduction to Critical Thinking + Current Educational Challenges + The Importance of Questioning',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557615/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/1/highlight_topic1_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        120.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557615/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/1/highlight_topic1_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t1',
        '2026-07-13 03:00:00',
        '2026-07-13 03:00:00'
    ),
    (
        171,
        10,
        NULL,
        'highlight',
        'Consequences of Lack of Critical Thinking + Skills Needed for the Future',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557614/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/2/highlight_topic2_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        198.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557614/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/2/highlight_topic2_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t2',
        '2026-07-13 04:00:00',
        '2026-07-13 04:00:00'
    ),
    (
        172,
        10,
        NULL,
        'highlight',
        'Understanding Critical Thinking + The Process of Critical Thinking',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557648/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/3/highlight_topic3_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557648/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/3/highlight_topic3_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t3',
        '2026-07-13 05:00:00',
        '2026-07-13 05:00:00'
    ),
    (
        173,
        10,
        NULL,
        'highlight',
        'Describing and Articulating Thoughts + Self-Reflection and Acceptance of Mistakes',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557651/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/4/highlight_topic4_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557651/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/4/highlight_topic4_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t4',
        '2026-07-13 06:00:00',
        '2026-07-13 06:00:00'
    ),
    (
        174,
        10,
        NULL,
        'highlight',
        'Acquiring Knowledge in the Digital Age',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557672/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/5/highlight_topic5_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        149,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557672/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/5/highlight_topic5_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t5',
        '2026-07-13 07:00:00',
        '2026-07-13 07:00:00'
    ),
    (
        175,
        10,
        NULL,
        'highlight',
        'Challenges in Information Processing + Encouragement to Take Action + Application of Critical Thinking',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557686/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/6/highlight_topic6_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        199.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557686/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/6/highlight_topic6_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t6',
        '2026-07-13 08:00:00',
        '2026-07-13 08:00:00'
    ),
    (
        176,
        10,
        NULL,
        'highlight',
        'Analyzing Information + Understanding Critical Thinking',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557695/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/7/highlight_topic7_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        140.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557695/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/7/highlight_topic7_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t7',
        '2026-07-13 09:00:00',
        '2026-07-13 09:00:00'
    ),
    (
        177,
        10,
        NULL,
        'highlight',
        'Synthesis and Creativity in Critical Thinking + The Importance of Internalizing Knowledge + The Role of Critical Thinking in the Modern World',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557734/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/8/highlight_topic8_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557734/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/8/highlight_topic8_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t8',
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        178,
        10,
        NULL,
        'highlight',
        'AI and Human Skills + Emotional Intelligence in Communication',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557737/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/9/highlight_topic9_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        198.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557737/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/9/highlight_topic9_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t9',
        '2026-07-13 11:00:00',
        '2026-07-13 11:00:00'
    ),
    (
        179,
        10,
        NULL,
        'highlight',
        'Applying Critical Thinking in Dialogue',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557761/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/10/highlight_topic10_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        130.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557761/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/10/highlight_topic10_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t10',
        '2026-07-13 12:00:00',
        '2026-07-13 12:00:00'
    ),
    (
        180,
        10,
        NULL,
        'highlight',
        'Overcoming Challenges in Group Work',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557765/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/11/highlight_topic11_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        155,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557765/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/11/highlight_topic11_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t11',
        '2026-07-13 13:00:00',
        '2026-07-13 13:00:00'
    ),
    (
        181,
        10,
        NULL,
        'highlight',
        'The Value of Personal Reflection + The Role of Emotional Intelligence in Communication',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557798/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/12/highlight_topic12_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        189.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557798/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/12/highlight_topic12_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t12',
        '2026-07-13 14:00:00',
        '2026-07-13 14:00:00'
    ),
    (
        182,
        10,
        NULL,
        'highlight',
        'The Future of Learning and Adaptation + Collaboration and Teamwork in Critical Thinking',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557802/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/13/highlight_topic13_50f3636d-2950-4c57-a27c-48f1e3af6713.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557802/jobs/50f3636d-2950-4c57-a27c-48f1e3af6713/topics/13/highlight_topic13_50f3636d-2950-4c57-a27c-48f1e3af6713.jpg',
        NULL,
        NULL,
        'highlight-50f3636d-t13',
        '2026-07-13 15:00:00',
        '2026-07-13 15:00:00'
    ),
    (
        183,
        10,
        NULL,
        'highlight',
        'Introduction to Project Management + History of Project Management + Project Management Lifecycle',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557164/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/1/highlight_topic1_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4',
        122,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557164/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/1/highlight_topic1_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg',
        NULL,
        NULL,
        'highlight-51bfe570-t1',
        '2026-07-13 16:00:00',
        '2026-07-13 16:00:00'
    ),
    (
        184,
        10,
        NULL,
        'highlight',
        'Project Initiation Phase + Project Planning Phase + Project Execution Phase',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557126/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/2/highlight_topic2_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4',
        135,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557126/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/2/highlight_topic2_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg',
        NULL,
        NULL,
        'highlight-51bfe570-t2',
        '2026-07-13 17:00:00',
        '2026-07-13 17:00:00'
    ),
    (
        185,
        10,
        NULL,
        'highlight',
        'Monitoring and Control Phase + Project Closure Phase + Project Management Knowledge Areas + Project Management Methodologies',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557213/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/3/highlight_topic3_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4',
        198,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557213/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/3/highlight_topic3_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg',
        NULL,
        NULL,
        'highlight-51bfe570-t3',
        '2026-07-13 18:00:00',
        '2026-07-13 18:00:00'
    ),
    (
        186,
        10,
        NULL,
        'highlight',
        'Project Management Tools',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557228/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/4/highlight_topic4_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4',
        197,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557228/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/4/highlight_topic4_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg',
        NULL,
        NULL,
        'highlight-51bfe570-t4',
        '2026-07-13 19:00:00',
        '2026-07-13 19:00:00'
    ),
    (
        187,
        10,
        NULL,
        'highlight',
        'Project Management Certifications',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/5/highlight_topic5_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4',
        196,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/5/highlight_topic5_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg',
        NULL,
        NULL,
        'highlight-51bfe570-t5',
        '2026-07-13 20:00:00',
        '2026-07-13 20:00:00'
    ),
    (
        188,
        10,
        NULL,
        'highlight',
        'Demo: Creating a Project Plan with Asana',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/6/highlight_topic6_51bfe570-7409-4e04-8bd9-488a9e85bd55.mp4',
        191,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779557288/jobs/51bfe570-7409-4e04-8bd9-488a9e85bd55/topics/6/highlight_topic6_51bfe570-7409-4e04-8bd9-488a9e85bd55.jpg',
        NULL,
        NULL,
        'highlight-51bfe570-t6',
        '2026-07-13 21:00:00',
        '2026-07-13 21:00:00'
    ),
    (
        189,
        10,
        NULL,
        'highlight',
        'Introduction to Music Theory for Guitar Players + The First Assignment: Note Cards',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558092/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/1/highlight_topic1_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        163.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558092/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/1/highlight_topic1_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t1',
        '2026-07-13 22:00:00',
        '2026-07-13 22:00:00'
    ),
    (
        190,
        10,
        NULL,
        'highlight',
        'Creating Major Triads + Understanding Major Triads and Chords',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558079/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/2/highlight_topic2_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        159.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558079/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/2/highlight_topic2_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t2',
        '2026-07-13 23:00:00',
        '2026-07-13 23:00:00'
    ),
    (
        191,
        10,
        NULL,
        'highlight',
        'Memorizing Sharps and Flats + The Circle of Fifths and Key Signatures + Introduction to Chord Theory',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558208/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/3/highlight_topic3_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        198.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558208/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/3/highlight_topic3_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t3',
        '2026-07-14 00:00:00',
        '2026-07-14 00:00:00'
    ),
    (
        192,
        10,
        NULL,
        'highlight',
        'Understanding Chord Inversions + Playing Chord Inversions on Guitar',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558162/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/4/highlight_topic4_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        200,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558162/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/4/highlight_topic4_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t4',
        '2026-07-14 01:00:00',
        '2026-07-14 01:00:00'
    ),
    (
        193,
        10,
        NULL,
        'highlight',
        'Transitioning Between Chords',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558205/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/5/highlight_topic5_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        135.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558205/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/5/highlight_topic5_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t5',
        '2026-07-14 02:00:00',
        '2026-07-14 02:00:00'
    ),
    (
        194,
        10,
        NULL,
        'highlight',
        'Exploring Second Inversion Chords',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558266/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/6/highlight_topic6_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        189.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558266/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/6/highlight_topic6_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t6',
        '2026-07-14 03:00:00',
        '2026-07-14 03:00:00'
    ),
    (
        195,
        10,
        NULL,
        'highlight',
        'Building Major and Minor Chords',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558311/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/7/highlight_topic7_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        198.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558311/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/7/highlight_topic7_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t7',
        '2026-07-14 04:00:00',
        '2026-07-14 04:00:00'
    ),
    (
        196,
        10,
        NULL,
        'highlight',
        'Understanding the Circle of Fifths + Recap of Music Theory Concepts',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558320/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/8/highlight_topic8_7275bf24-627f-48de-9cbd-aa5d67d61701.mp4',
        198.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558320/jobs/7275bf24-627f-48de-9cbd-aa5d67d61701/topics/8/highlight_topic8_7275bf24-627f-48de-9cbd-aa5d67d61701.jpg',
        NULL,
        NULL,
        'highlight-7275bf24-t8',
        '2026-07-14 05:00:00',
        '2026-07-14 05:00:00'
    ),
    (
        197,
        9,
        NULL,
        'highlight',
        'Introduction to Video Editing with CapCut + Video Editing Workflow Steps',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558604/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/1/highlight_topic1_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        199.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558604/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/1/highlight_topic1_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t1',
        '2026-07-14 06:00:00',
        '2026-07-14 06:00:00'
    ),
    (
        198,
        9,
        NULL,
        'highlight',
        'Understanding the Timeline and Layer Management + Masking Techniques in Video Editing',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558606/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/2/highlight_topic2_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        197.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558606/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/2/highlight_topic2_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t2',
        '2026-07-14 07:00:00',
        '2026-07-14 07:00:00'
    ),
    (
        199,
        9,
        NULL,
        'highlight',
        'Color Grading Essentials + Introduction to CapCut Video Editing',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558682/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/3/highlight_topic3_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558682/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/3/highlight_topic3_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t3',
        '2026-07-14 08:00:00',
        '2026-07-14 08:00:00'
    ),
    (
        200,
        9,
        NULL,
        'highlight',
        'Masking Techniques in CapCut + Using Multiple Masks + Adjusting Video Frames + Creating Fade Effects',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558647/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/4/highlight_topic4_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        143.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558647/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/4/highlight_topic4_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t4',
        '2026-07-14 09:00:00',
        '2026-07-14 09:00:00'
    ),
    (
        201,
        9,
        NULL,
        'highlight',
        'Layering Effects + Advanced Transitions and Effects',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558681/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/5/highlight_topic5_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        128.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558681/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/5/highlight_topic5_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t5',
        '2026-07-14 10:00:00',
        '2026-07-14 10:00:00'
    ),
    (
        202,
        9,
        NULL,
        'highlight',
        'Speed Adjustment Techniques + Audio Mixing Fundamentals',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558737/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/6/highlight_topic6_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        198.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558737/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/6/highlight_topic6_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t6',
        '2026-07-14 11:00:00',
        '2026-07-14 11:00:00'
    ),
    (
        203,
        9,
        NULL,
        'highlight',
        'Adding Background Music + Creating Subtitles Automatically',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558768/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/7/highlight_topic7_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        197.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558768/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/7/highlight_topic7_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t7',
        '2026-07-14 12:00:00',
        '2026-07-14 12:00:00'
    ),
    (
        204,
        9,
        NULL,
        'highlight',
        'Finalizing and Rendering Videos',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558766/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/8/highlight_topic8_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.mp4',
        124,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558766/jobs/2f2a0cf0-5fdc-4890-863d-8a0893d46f99/topics/8/highlight_topic8_2f2a0cf0-5fdc-4890-863d-8a0893d46f99.jpg',
        NULL,
        NULL,
        'highlight-2f2a0cf0-t8',
        '2026-07-14 13:00:00',
        '2026-07-14 13:00:00'
    ),
    (
        205,
        9,
        NULL,
        'highlight',
        'Introduction to Premiere Pro Basics + Setting Up Project Files',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558972/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/1/highlight_topic1_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        126.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558972/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/1/highlight_topic1_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t1',
        '2026-07-14 14:00:00',
        '2026-07-14 14:00:00'
    ),
    (
        206,
        9,
        NULL,
        'highlight',
        'Premiere Pro Workspace Setup',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779558997/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/2/highlight_topic2_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        197,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779558997/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/2/highlight_topic2_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t2',
        '2026-07-14 15:00:00',
        '2026-07-14 15:00:00'
    ),
    (
        207,
        9,
        NULL,
        'highlight',
        'Importing Media and Creating a Sequence',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559014/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/3/highlight_topic3_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        121,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559014/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/3/highlight_topic3_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t3',
        '2026-07-14 16:00:00',
        '2026-07-14 16:00:00'
    ),
    (
        208,
        9,
        NULL,
        'highlight',
        'Timeline Fundamentals: Cutting and Trimming Clips',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559059/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/4/highlight_topic4_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        182,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559059/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/4/highlight_topic4_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t4',
        '2026-07-14 17:00:00',
        '2026-07-14 17:00:00'
    ),
    (
        209,
        9,
        NULL,
        'highlight',
        'Adding Transitions Between Clips',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559081/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/5/highlight_topic5_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        193,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559081/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/5/highlight_topic5_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t5',
        '2026-07-14 18:00:00',
        '2026-07-14 18:00:00'
    ),
    (
        210,
        9,
        NULL,
        'highlight',
        'Incorporating Text Titles',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559122/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/6/highlight_topic6_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        184.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559122/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/6/highlight_topic6_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t6',
        '2026-07-14 19:00:00',
        '2026-07-14 19:00:00'
    ),
    (
        211,
        9,
        NULL,
        'highlight',
        'Audio Adjustment Techniques',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559249/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/7/highlight_topic7_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        198.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559249/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/7/highlight_topic7_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t7',
        '2026-07-14 20:00:00',
        '2026-07-14 20:00:00'
    ),
    (
        212,
        9,
        NULL,
        'highlight',
        'Exporting Your Final Project + Color Correction and Grading Basics',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559228/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/8/highlight_topic8_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559228/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/8/highlight_topic8_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t8',
        '2026-07-14 21:00:00',
        '2026-07-14 21:00:00'
    ),
    (
        213,
        9,
        NULL,
        'highlight',
        'Keyframing for Motion Graphics',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779559285/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/9/highlight_topic9_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.mp4',
        199.3,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779559285/jobs/b03dcdef-6a1a-40aa-9d19-c3f42b94766c/topics/9/highlight_topic9_b03dcdef-6a1a-40aa-9d19-c3f42b94766c.jpg',
        NULL,
        NULL,
        'highlight-b03dcdef-t9',
        '2026-07-14 22:00:00',
        '2026-07-14 22:00:00'
    ),
    (
        214,
        7,
        NULL,
        'highlight',
        'Giới thiệu về Lightroom + Nguyên tắc hoạt động của Lightroom + Chọn và nhập hình ảnh',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470377/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/1/highlight_topic1_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        158,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470377/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/1/highlight_topic1_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t1',
        '2026-07-14 23:00:00',
        '2026-07-14 23:00:00'
    ),
    (
        215,
        7,
        NULL,
        'highlight',
        'Quản lý thư viện hình ảnh + Xuất hình ảnh + Chỉnh sửa hình ảnh cơ bản + Công cụ khử mắt đỏ và chỉnh màu',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470435/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/2/highlight_topic2_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470435/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/2/highlight_topic2_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t2',
        '2026-07-15 00:00:00',
        '2026-07-15 00:00:00'
    ),
    (
        216,
        7,
        NULL,
        'highlight',
        'Giới thiệu về công cụ AI trong Lightroom + Chọn chủ thể trong hình ảnh + Chọn vùng trời và xóa nền + Công cụ chọn vùng không gian + Sử dụng công cụ Blood để tạo mặt nạ',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470428/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/3/highlight_topic3_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        199.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470428/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/3/highlight_topic3_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t3',
        '2026-07-15 01:00:00',
        '2026-07-15 01:00:00'
    ),
    (
        217,
        7,
        NULL,
        'highlight',
        'Công cụ Lainer Gradient + Công cụ Radio Gradient + Công cụ Color Ren và Luminon Ren',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470467/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/4/highlight_topic4_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        170,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470467/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/4/highlight_topic4_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t4',
        '2026-07-15 02:00:00',
        '2026-07-15 02:00:00'
    ),
    (
        218,
        7,
        NULL,
        'highlight',
        'Cân bằng trắng và các chế độ màu + Công cụ chỉnh sáng tối',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470474/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/5/highlight_topic5_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        190.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470474/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/5/highlight_topic5_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t5',
        '2026-07-15 03:00:00',
        '2026-07-15 03:00:00'
    ),
    (
        219,
        7,
        NULL,
        'highlight',
        'Công cụ tăng giảm chi tiết + Công cụ điều chỉnh màu sắc + Công cụ tông cất',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470513/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/6/highlight_topic6_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        199,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470513/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/6/highlight_topic6_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t6',
        '2026-07-15 04:00:00',
        '2026-07-15 04:00:00'
    ),
    (
        220,
        7,
        NULL,
        'highlight',
        'Công cụ vòng tròn điều chỉnh + Công cụ chỉnh sửa màu sắc nâng cao',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470542/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/7/highlight_topic7_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470542/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/7/highlight_topic7_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t7',
        '2026-07-15 05:00:00',
        '2026-07-15 05:00:00'
    ),
    (
        221,
        7,
        NULL,
        'highlight',
        'Giới thiệu về nguyên lý sử dụng Lightroom + Công cụ điều chỉnh độ sáng và độ tương phản + Công cụ khử noise',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470556/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/8/highlight_topic8_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        198.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470556/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/8/highlight_topic8_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t8',
        '2026-07-15 06:00:00',
        '2026-07-15 06:00:00'
    ),
    (
        222,
        7,
        NULL,
        'highlight',
        'Sử dụng công cụ Transform + Sử dụng công cụ Crop và Straighten + Công cụ crop và điều chỉnh hình ảnh + Tổng kết và hướng dẫn sử dụng',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470592/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/9/highlight_topic9_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.mp4',
        199.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470592/jobs/50b18e9c-fe12-4c31-a4b6-f416b2b46fcf/topics/9/highlight_topic9_50b18e9c-fe12-4c31-a4b6-f416b2b46fcf.jpg',
        NULL,
        NULL,
        'highlight-50b18e9c-t9',
        '2026-07-15 07:00:00',
        '2026-07-15 07:00:00'
    ),
    (
        223,
        7,
        NULL,
        'highlight',
        'Introduction to Graphic Design Basics + Setting Up the Workspace in Photoshop',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469389/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/1/highlight_topic1_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        162.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469389/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/1/highlight_topic1_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t1',
        '2026-07-15 08:00:00',
        '2026-07-15 08:00:00'
    ),
    (
        224,
        7,
        NULL,
        'highlight',
        'Creating a New Document + Understanding Image Resolution',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469392/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/2/highlight_topic2_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        197.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469392/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/2/highlight_topic2_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t2',
        '2026-07-15 09:00:00',
        '2026-07-15 09:00:00'
    ),
    (
        225,
        7,
        NULL,
        'highlight',
        'Choosing Color Modes + Using Layers in Design',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469428/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/3/highlight_topic3_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        199.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469428/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/3/highlight_topic3_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t3',
        '2026-07-15 10:00:00',
        '2026-07-15 10:00:00'
    ),
    (
        226,
        7,
        NULL,
        'highlight',
        'Chọn Mẫu Màu Trong Thiết Kế Đồ Họa + Phân Biệt Các Mẫu Màu + Quy Trình Chọn Mẫu Màu',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469426/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/4/highlight_topic4_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        198.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469426/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/4/highlight_topic4_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t4',
        '2026-07-15 11:00:00',
        '2026-07-15 11:00:00'
    ),
    (
        227,
        7,
        NULL,
        'highlight',
        'Cách Đổ Màu Trong Thiết Kế + Nguyên Tắc Sử Dụng Màu Sắc',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469456/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/5/highlight_topic5_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        195.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469456/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/5/highlight_topic5_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t5',
        '2026-07-15 12:00:00',
        '2026-07-15 12:00:00'
    ),
    (
        228,
        7,
        NULL,
        'highlight',
        'Tạo Bố Cục Trong Thiết Kế + Sử Dụng Hình Dạng Trong Thiết Kế',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469452/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/6/highlight_topic6_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        151.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469452/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/6/highlight_topic6_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t6',
        '2026-07-15 13:00:00',
        '2026-07-15 13:00:00'
    ),
    (
        229,
        7,
        NULL,
        'highlight',
        'Kỹ Thuật Tạo Hình Trong Thiết Kế',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469487/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/7/highlight_topic7_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        198.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469487/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/7/highlight_topic7_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t7',
        '2026-07-15 14:00:00',
        '2026-07-15 14:00:00'
    ),
    (
        230,
        7,
        NULL,
        'highlight',
        'Quản Lý Đối Tượng Trong Thiết Kế',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469494/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/8/highlight_topic8_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        197.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469494/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/8/highlight_topic8_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t8',
        '2026-07-15 15:00:00',
        '2026-07-15 15:00:00'
    ),
    (
        231,
        7,
        NULL,
        'highlight',
        'Xuất Bản Thiết Kế',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469530/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/9/highlight_topic9_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        199.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469530/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/9/highlight_topic9_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t9',
        '2026-07-15 16:00:00',
        '2026-07-15 16:00:00'
    ),
    (
        232,
        7,
        NULL,
        'highlight',
        'Creating Layouts with Shapes + Tạo Hiệu Ứng Trong Thiết Kế',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469542/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/10/highlight_topic10_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        198.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469542/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/10/highlight_topic10_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t10',
        '2026-07-15 17:00:00',
        '2026-07-15 17:00:00'
    ),
    (
        233,
        7,
        NULL,
        'highlight',
        'Kết Luận và Bài Tập Thực Hành',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469573/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/11/highlight_topic11_45661857-e4b3-47d1-9010-a3c04b782a40.mp4',
        199.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469573/jobs/45661857-e4b3-47d1-9010-a3c04b782a40/topics/11/highlight_topic11_45661857-e4b3-47d1-9010-a3c04b782a40.jpg',
        NULL,
        NULL,
        'highlight-45661857-t11',
        '2026-07-15 18:00:00',
        '2026-07-15 18:00:00'
    ),
    (
        234,
        7,
        NULL,
        'highlight',
        'Understanding Exposure + The Three Camera Settings for Exposure + ISO Explained',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469799/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/1/highlight_topic1_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        128.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469799/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/1/highlight_topic1_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t1',
        '2026-07-15 19:00:00',
        '2026-07-15 19:00:00'
    ),
    (
        235,
        7,
        NULL,
        'highlight',
        'Understanding Aperture + Demonstrating Aperture Effects',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469826/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/2/highlight_topic2_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469826/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/2/highlight_topic2_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t2',
        '2026-07-15 20:00:00',
        '2026-07-15 20:00:00'
    ),
    (
        236,
        7,
        NULL,
        'highlight',
        'Creative Use of Shutter Speed',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469837/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/3/highlight_topic3_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        199.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469837/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/3/highlight_topic3_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t3',
        '2026-07-15 21:00:00',
        '2026-07-15 21:00:00'
    ),
    (
        237,
        7,
        NULL,
        'highlight',
        'Understanding Camera Exposure + How Cameras Measure Light',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469857/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/4/highlight_topic4_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        183.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469857/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/4/highlight_topic4_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t4',
        '2026-07-15 22:00:00',
        '2026-07-15 22:00:00'
    ),
    (
        238,
        7,
        NULL,
        'highlight',
        'Common Exposure Problems + Solutions for Better Exposure + Metering Modes and Exposure Compensation',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469893/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/5/highlight_topic5_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        200.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469893/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/5/highlight_topic5_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t5',
        '2026-07-15 23:00:00',
        '2026-07-15 23:00:00'
    ),
    (
        239,
        7,
        NULL,
        'highlight',
        'The Concept of Stops in Photography + Dynamic and Tonal Ranges',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469902/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/6/highlight_topic6_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        199.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469902/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/6/highlight_topic6_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t6',
        '2026-07-16 00:00:00',
        '2026-07-16 00:00:00'
    ),
    (
        240,
        7,
        NULL,
        'highlight',
        'Techniques to Control Light + Understanding Histograms',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/7/highlight_topic7_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        199.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/7/highlight_topic7_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t7',
        '2026-07-16 01:00:00',
        '2026-07-16 01:00:00'
    ),
    (
        241,
        7,
        NULL,
        'highlight',
        'Analyzing Histograms for Proper Exposure',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/8/highlight_topic8_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        198.3,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469947/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/8/highlight_topic8_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t8',
        '2026-07-16 02:00:00',
        '2026-07-16 02:00:00'
    ),
    (
        242,
        7,
        NULL,
        'highlight',
        'Transitioning to Manual Mode',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779469980/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/9/highlight_topic9_c31518a2-7cd9-4814-8d4a-f818b9549f23.mp4',
        198.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779469980/jobs/c31518a2-7cd9-4814-8d4a-f818b9549f23/topics/9/highlight_topic9_c31518a2-7cd9-4814-8d4a-f818b9549f23.jpg',
        NULL,
        NULL,
        'highlight-c31518a2-t9',
        '2026-07-16 03:00:00',
        '2026-07-16 03:00:00'
    ),
    (
        243,
        7,
        NULL,
        'highlight',
        'Introduction to Figma and Course Overview + Creating a Desktop Frame',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470855/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/1/highlight_topic1_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        130.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470855/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/1/highlight_topic1_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t1',
        '2026-07-16 04:00:00',
        '2026-07-16 04:00:00'
    ),
    (
        244,
        7,
        NULL,
        'highlight',
        'Understanding Color Properties + Adding Structure with Lines and Dividers',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779470893/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/2/highlight_topic2_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        198.3,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779470893/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/2/highlight_topic2_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t2',
        '2026-07-16 05:00:00',
        '2026-07-16 05:00:00'
    ),
    (
        245,
        7,
        NULL,
        'highlight',
        'Using Rulers and Grids for Layout + Working with Text in Figma',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471025/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/3/highlight_topic3_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471025/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/3/highlight_topic3_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t3',
        '2026-07-16 06:00:00',
        '2026-07-16 06:00:00'
    ),
    (
        246,
        7,
        NULL,
        'highlight',
        'Creating Shapes and Icons',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471062/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/4/highlight_topic4_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        196.3,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471062/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/4/highlight_topic4_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t4',
        '2026-07-16 07:00:00',
        '2026-07-16 07:00:00'
    ),
    (
        247,
        7,
        NULL,
        'highlight',
        'Implementing Gradients and Shadows',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471190/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/5/highlight_topic5_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        199.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471190/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/5/highlight_topic5_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t5',
        '2026-07-16 08:00:00',
        '2026-07-16 08:00:00'
    ),
    (
        248,
        7,
        NULL,
        'highlight',
        'Utilizing Auto Layout for Flexibility',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471179/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/6/highlight_topic6_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        153.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471179/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/6/highlight_topic6_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t6',
        '2026-07-16 09:00:00',
        '2026-07-16 09:00:00'
    ),
    (
        249,
        7,
        NULL,
        'highlight',
        'Creating Components for Reusability',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471353/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/7/highlight_topic7_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        199.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471353/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/7/highlight_topic7_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t7',
        '2026-07-16 10:00:00',
        '2026-07-16 10:00:00'
    ),
    (
        250,
        7,
        NULL,
        'highlight',
        'Prototyping and Interaction Design',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471348/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/8/highlight_topic8_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471348/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/8/highlight_topic8_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t8',
        '2026-07-16 11:00:00',
        '2026-07-16 11:00:00'
    ),
    (
        251,
        7,
        NULL,
        'highlight',
        'Dev Handoff and Collaboration',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779471433/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/9/highlight_topic9_07224cce-efb9-4b79-af32-7e0c0717b967.mp4',
        198.3,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779471433/jobs/07224cce-efb9-4b79-af32-7e0c0717b967/topics/9/highlight_topic9_07224cce-efb9-4b79-af32-7e0c0717b967.jpg',
        NULL,
        NULL,
        'highlight-07224cce-t9',
        '2026-07-16 12:00:00',
        '2026-07-16 12:00:00'
    ),
    (
        252,
        8,
        NULL,
        'highlight',
        'Introduction to Power BI and Its Importance + Understanding Power BI''s Role in Data Analysis + Comparison with Other BI Tools',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612138/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/1/highlight_topic1_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        184.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612138/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/1/highlight_topic1_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t1',
        '2026-07-16 13:00:00',
        '2026-07-16 13:00:00'
    ),
    (
        253,
        8,
        NULL,
        'highlight',
        'Components of Power BI + Data Transformation with Power Query',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612131/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/2/highlight_topic2_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        154.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612131/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/2/highlight_topic2_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t2',
        '2026-07-16 14:00:00',
        '2026-07-16 14:00:00'
    ),
    (
        254,
        8,
        NULL,
        'highlight',
        'Creating Data Models in Power BI + Using DAX for Data Analysis + Building Effective Dashboards',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612192/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/3/highlight_topic3_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612192/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/3/highlight_topic3_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t3',
        '2026-07-16 15:00:00',
        '2026-07-16 15:00:00'
    ),
    (
        255,
        8,
        NULL,
        'highlight',
        'Automating Data Refresh and Reporting + The Five-Step Process for Reporting + Practical Project Implementation + Introduction to Power BI Data Modeling',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612195/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/4/highlight_topic4_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612195/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/4/highlight_topic4_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t4',
        '2026-07-16 16:00:00',
        '2026-07-16 16:00:00'
    ),
    (
        256,
        8,
        NULL,
        'highlight',
        'Connecting Data to Power BI + Understanding Data Files and Their Structure',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612225/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/5/highlight_topic5_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        129.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612225/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/5/highlight_topic5_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t5',
        '2026-07-16 17:00:00',
        '2026-07-16 17:00:00'
    ),
    (
        257,
        8,
        NULL,
        'highlight',
        'Using AI for Data Analysis + Creating Analytical Dashboards + Data Transformation Techniques',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612267/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/6/highlight_topic6_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        198.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612267/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/6/highlight_topic6_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t6',
        '2026-07-16 18:00:00',
        '2026-07-16 18:00:00'
    ),
    (
        258,
        8,
        NULL,
        'highlight',
        'Building Relationships in Data Models + Understanding Data Model Normalization + Introduction to Power BI Reporting Features',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612264/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/7/highlight_topic7_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        136.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612264/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/7/highlight_topic7_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t7',
        '2026-07-16 19:00:00',
        '2026-07-16 19:00:00'
    ),
    (
        259,
        8,
        NULL,
        'highlight',
        'Creating Effective Dashboards',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612311/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/8/highlight_topic8_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612311/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/8/highlight_topic8_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t8',
        '2026-07-16 20:00:00',
        '2026-07-16 20:00:00'
    ),
    (
        260,
        8,
        NULL,
        'highlight',
        'Key Performance Indicators (KPIs) in Power BI + Using DAX for Calculating KPIs',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612337/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/9/highlight_topic9_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        200.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612337/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/9/highlight_topic9_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t9',
        '2026-07-16 21:00:00',
        '2026-07-16 21:00:00'
    ),
    (
        261,
        8,
        NULL,
        'highlight',
        'Using AI to Assist with DAX + Understanding DAX Syntax + Creating Revenue Measures + Building Effective Dashboards',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612350/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/10/highlight_topic10_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        156.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612350/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/10/highlight_topic10_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t10',
        '2026-07-16 22:00:00',
        '2026-07-16 22:00:00'
    ),
    (
        262,
        8,
        NULL,
        'highlight',
        'Visualizing Data with Charts',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612387/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/11/highlight_topic11_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        198.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612387/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/11/highlight_topic11_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t11',
        '2026-07-16 23:00:00',
        '2026-07-16 23:00:00'
    ),
    (
        263,
        8,
        NULL,
        'highlight',
        'Visualizing Data with Charts',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612408/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/12/highlight_topic12_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        199.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612408/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/12/highlight_topic12_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t12',
        '2026-07-17 00:00:00',
        '2026-07-17 00:00:00'
    ),
    (
        264,
        8,
        NULL,
        'highlight',
        'Finalizing the Dashboard',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612427/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/13/highlight_topic13_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        163.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612427/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/13/highlight_topic13_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t13',
        '2026-07-17 01:00:00',
        '2026-07-17 01:00:00'
    ),
    (
        265,
        8,
        NULL,
        'highlight',
        'Using Slicers for Data Filtering + Publishing and Sharing Reports',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612478/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/14/highlight_topic14_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        198.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612478/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/14/highlight_topic14_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t14',
        '2026-07-17 02:00:00',
        '2026-07-17 02:00:00'
    ),
    (
        266,
        8,
        NULL,
        'highlight',
        'Refreshing Data in Power BI + Conclusion and Future Learning',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779612488/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/15/highlight_topic15_0d07a77f-a834-410e-b341-7738419b971f.mp4',
        194.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779612488/jobs/0d07a77f-a834-410e-b341-7738419b971f/topics/15/highlight_topic15_0d07a77f-a834-410e-b341-7738419b971f.jpg',
        NULL,
        NULL,
        'highlight-0d07a77f-t15',
        '2026-07-17 03:00:00',
        '2026-07-17 03:00:00'
    ),
    (
        267,
        8,
        NULL,
        'highlight',
        'Introduction to Promotion Strategies + Discount Techniques Overview',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613254/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/1/highlight_topic1_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4',
        123.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613254/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/1/highlight_topic1_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg',
        NULL,
        NULL,
        'highlight-8266f076-t1',
        '2026-07-17 04:00:00',
        '2026-07-17 04:00:00'
    ),
    (
        268,
        8,
        NULL,
        'highlight',
        'Using Psychological Pricing + Time-Based Discounts + Lucky Draw Promotions',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613259/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/2/highlight_topic2_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4',
        122.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613259/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/2/highlight_topic2_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg',
        NULL,
        NULL,
        'highlight-8266f076-t2',
        '2026-07-17 05:00:00',
        '2026-07-17 05:00:00'
    ),
    (
        269,
        8,
        NULL,
        'highlight',
        'Customer-Driven Pricing + Happy Hour Promotions',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613326/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/3/highlight_topic3_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4',
        122.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613326/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/3/highlight_topic3_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg',
        NULL,
        NULL,
        'highlight-8266f076-t3',
        '2026-07-17 06:00:00',
        '2026-07-17 06:00:00'
    ),
    (
        270,
        8,
        NULL,
        'highlight',
        'Flash Sales + Loyalty Programs',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613349/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/4/highlight_topic4_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4',
        130.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613349/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/4/highlight_topic4_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg',
        NULL,
        NULL,
        'highlight-8266f076-t4',
        '2026-07-17 07:00:00',
        '2026-07-17 07:00:00'
    ),
    (
        271,
        8,
        NULL,
        'highlight',
        'Overview of Promotion Strategies + Discount Techniques + Sales Boosting Tactics',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613389/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/5/highlight_topic5_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4',
        121.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613389/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/5/highlight_topic5_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg',
        NULL,
        NULL,
        'highlight-8266f076-t5',
        '2026-07-17 08:00:00',
        '2026-07-17 08:00:00'
    ),
    (
        272,
        8,
        NULL,
        'highlight',
        'Effective Upselling and Cross-Selling + Marketing Campaign Planning + Revenue Growth Tips + Bundling Products',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613413/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/6/highlight_topic6_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4',
        121.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613413/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/6/highlight_topic6_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg',
        NULL,
        NULL,
        'highlight-8266f076-t6',
        '2026-07-17 09:00:00',
        '2026-07-17 09:00:00'
    ),
    (
        273,
        8,
        NULL,
        'highlight',
        'Promotional Partnerships + Promotional Strategies for New Products + Creating Value Through Promotions',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779613431/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/7/highlight_topic7_8266f076-808c-4688-ab31-e9bf9044e1fe.mp4',
        199.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779613431/jobs/8266f076-808c-4688-ab31-e9bf9044e1fe/topics/7/highlight_topic7_8266f076-808c-4688-ab31-e9bf9044e1fe.jpg',
        NULL,
        NULL,
        'highlight-8266f076-t7',
        '2026-07-17 10:00:00',
        '2026-07-17 10:00:00'
    ),
    (
        274,
        8,
        NULL,
        'highlight',
        'Overcoming Fear of Starting + Introduction to Digital Marketing',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614462/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/1/highlight_topic1_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        120.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614462/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/1/highlight_topic1_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t1',
        '2026-07-17 11:00:00',
        '2026-07-17 11:00:00'
    ),
    (
        275,
        8,
        NULL,
        'highlight',
        'Differences Between Digital and Traditional Marketing',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614372/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/2/highlight_topic2_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        122.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614372/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/2/highlight_topic2_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t2',
        '2026-07-17 12:00:00',
        '2026-07-17 12:00:00'
    ),
    (
        276,
        8,
        NULL,
        'highlight',
        'The Role of Digital Marketing in Business + Types of Digital Marketing Strategies',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614640/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/3/highlight_topic3_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        199.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614640/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/3/highlight_topic3_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t3',
        '2026-07-17 13:00:00',
        '2026-07-17 13:00:00'
    ),
    (
        277,
        8,
        NULL,
        'highlight',
        'Introduction to Digital Marketing Fundamentals + Understanding Traffic Management + Paid Advertising in Digital Marketing + On Media and Owned Media',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614679/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/4/highlight_topic4_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        200.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614679/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/4/highlight_topic4_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t4',
        '2026-07-17 14:00:00',
        '2026-07-17 14:00:00'
    ),
    (
        278,
        8,
        NULL,
        'highlight',
        'Understanding Customer Journey Stages + The Role of Multi-Channel Marketing + Customer Experience and Emotional Connection + Mapping Customer Actions',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614827/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/6/highlight_topic6_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        125.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614827/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/6/highlight_topic6_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t6',
        '2026-07-17 15:00:00',
        '2026-07-17 15:00:00'
    ),
    (
        279,
        8,
        NULL,
        'highlight',
        'Creating Engaging Content + Utilizing Social Media for Marketing + Post-Purchase Customer Engagement',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779614970/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/7/highlight_topic7_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        155.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779614970/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/7/highlight_topic7_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t7',
        '2026-07-17 16:00:00',
        '2026-07-17 16:00:00'
    ),
    (
        280,
        8,
        NULL,
        'highlight',
        'Building a Community Around Your Brand + Final Thoughts on Digital Marketing',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615138/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/8/highlight_topic8_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        193.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615138/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/8/highlight_topic8_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t8',
        '2026-07-17 17:00:00',
        '2026-07-17 17:00:00'
    ),
    (
        281,
        8,
        NULL,
        'highlight',
        'Content Marketing Essentials + Choosing the Right Content Format',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615198/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/9/highlight_topic9_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        199.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615198/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/9/highlight_topic9_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t9',
        '2026-07-17 18:00:00',
        '2026-07-17 18:00:00'
    ),
    (
        282,
        8,
        NULL,
        'highlight',
        'Introduction to Digital Marketing + Choosing the Right Marketing Channels',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615285/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/10/highlight_topic10_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        131.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615285/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/10/highlight_topic10_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t10',
        '2026-07-17 19:00:00',
        '2026-07-17 19:00:00'
    ),
    (
        283,
        8,
        NULL,
        'highlight',
        'Understanding Customer Behavior + Measuring Marketing Effectiveness',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615430/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/11/highlight_topic11_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        195.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615430/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/11/highlight_topic11_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t11',
        '2026-07-17 20:00:00',
        '2026-07-17 20:00:00'
    ),
    (
        284,
        8,
        NULL,
        'highlight',
        'Setting Clear Marketing Goals + Understanding the Customer Journey',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615624/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/13/highlight_topic13_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        132.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615624/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/13/highlight_topic13_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t13',
        '2026-07-17 21:00:00',
        '2026-07-17 21:00:00'
    ),
    (
        285,
        8,
        NULL,
        'highlight',
        'Content Types and Delivery Methods + Continuous Improvement in Marketing Strategies + Measuring Marketing Effectiveness',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779615785/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/14/highlight_topic14_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779615785/jobs/a282c57b-f6e0-4cd8-8f02-29c0b736a5ed/topics/14/highlight_topic14_a282c57b-f6e0-4cd8-8f02-29c0b736a5ed.jpg',
        NULL,
        NULL,
        'highlight-a282c57b-t14',
        '2026-07-17 22:00:00',
        '2026-07-17 22:00:00'
    ),
    (
        286,
        8,
        NULL,
        'highlight',
        'Introduction to Copywriting + Three Rules of Effective Copy + Visualizing Copy',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616656/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/1/highlight_topic1_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        120.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616656/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/1/highlight_topic1_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t1',
        '2026-07-17 23:00:00',
        '2026-07-17 23:00:00'
    ),
    (
        287,
        8,
        NULL,
        'highlight',
        'Falsifiability in Copy + Uniqueness in Copywriting',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616660/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/2/highlight_topic2_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        120.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616660/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/2/highlight_topic2_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t2',
        '2026-07-18 00:00:00',
        '2026-07-18 00:00:00'
    ),
    (
        288,
        8,
        NULL,
        'highlight',
        'The Importance of Learning Copywriting + Crafting Memorable Copy',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616717/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/3/highlight_topic3_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        120.3,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616717/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/3/highlight_topic3_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t3',
        '2026-07-18 01:00:00',
        '2026-07-18 01:00:00'
    ),
    (
        289,
        8,
        NULL,
        'highlight',
        'The Process of Writing Copy',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616728/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/4/highlight_topic4_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        120.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616728/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/4/highlight_topic4_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t4',
        '2026-07-18 02:00:00',
        '2026-07-18 02:00:00'
    ),
    (
        290,
        8,
        NULL,
        'highlight',
        'The Process of Writing an Ad + Understanding Conflict in Copywriting + The Interaction of Writing and Design',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616775/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/5/highlight_topic5_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        123.0,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616775/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/5/highlight_topic5_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t5',
        '2026-07-18 03:00:00',
        '2026-07-18 03:00:00'
    ),
    (
        291,
        8,
        NULL,
        'highlight',
        'Using Facts in Copywriting',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616793/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/6/highlight_topic6_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        120.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616793/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/6/highlight_topic6_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t6',
        '2026-07-18 04:00:00',
        '2026-07-18 04:00:00'
    ),
    (
        292,
        8,
        NULL,
        'highlight',
        'Engagement in Newsletters + Writing with Simplicity',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616847/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/7/highlight_topic7_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        120.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616847/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/7/highlight_topic7_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t7',
        '2026-07-18 05:00:00',
        '2026-07-18 05:00:00'
    ),
    (
        293,
        8,
        NULL,
        'highlight',
        'The Importance of Structure in Writing + The Impact of AI on Writing',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779616849/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/8/highlight_topic8_5b1401e2-bc34-4054-8336-63480979cb0e.mp4',
        197.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779616849/jobs/5b1401e2-bc34-4054-8336-63480979cb0e/topics/8/highlight_topic8_5b1401e2-bc34-4054-8336-63480979cb0e.jpg',
        NULL,
        NULL,
        'highlight-5b1401e2-t8',
        '2026-07-18 06:00:00',
        '2026-07-18 06:00:00'
    ),
    (
        294,
        8,
        NULL,
        'highlight',
        'Introduction to the Ultimate SEO Checklist + Tracking SEO Performance + Key SEO KPIs to Track',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617775/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/1/highlight_topic1_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        198.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617775/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/1/highlight_topic1_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t1',
        '2026-07-18 07:00:00',
        '2026-07-18 07:00:00'
    ),
    (
        295,
        8,
        NULL,
        'highlight',
        'Running a Screaming Frog Crawl + Crawlability and Indexability of Your Website + Mobile Friendliness of Your Website + Website Loading Speed + SSL Certificate Verification',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617770/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/2/highlight_topic2_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        153.5,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617770/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/2/highlight_topic2_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t2',
        '2026-07-18 08:00:00',
        '2026-07-18 08:00:00'
    ),
    (
        296,
        8,
        NULL,
        'highlight',
        'Modern Website Design + Impact of Interstitial Pop-ups on SEO',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617803/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/3/highlight_topic3_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        164.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617803/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/3/highlight_topic3_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t3',
        '2026-07-18 09:00:00',
        '2026-07-18 09:00:00'
    ),
    (
        297,
        8,
        NULL,
        'highlight',
        'Ad Placement and User Experience + Trust Pages on Your Website + Author Bios and Expertise',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617813/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/4/highlight_topic4_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        197.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617813/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/4/highlight_topic4_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t4',
        '2026-07-18 10:00:00',
        '2026-07-18 10:00:00'
    ),
    (
        298,
        8,
        NULL,
        'highlight',
        'Managing Non-Indexable Pages + Website Bloat and Pruning',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617842/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/5/highlight_topic5_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        197.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617842/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/5/highlight_topic5_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t5',
        '2026-07-18 11:00:00',
        '2026-07-18 11:00:00'
    ),
    (
        299,
        8,
        NULL,
        'highlight',
        'Thin Content Issues + Outdated Content Management + Engagement Rate Analysis',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617847/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/6/highlight_topic6_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        177.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617847/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/6/highlight_topic6_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t6',
        '2026-07-18 12:00:00',
        '2026-07-18 12:00:00'
    ),
    (
        300,
        8,
        NULL,
        'highlight',
        'Title and H1 Tag Optimization + Spelling and Grammar Checks + Backlink Analysis for Traffic',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617884/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/7/highlight_topic7_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        199.9,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617884/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/7/highlight_topic7_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t7',
        '2026-07-18 13:00:00',
        '2026-07-18 13:00:00'
    ),
    (
        301,
        8,
        NULL,
        'highlight',
        'Redirect Management',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617898/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/8/highlight_topic8_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        198.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617898/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/8/highlight_topic8_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t8',
        '2026-07-18 14:00:00',
        '2026-07-18 14:00:00'
    ),
    (
        302,
        8,
        NULL,
        'highlight',
        'Duplicate Content Issues + Broken Links Management + AI Content Considerations',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617916/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/9/highlight_topic9_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        173.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617916/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/9/highlight_topic9_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t9',
        '2026-07-18 15:00:00',
        '2026-07-18 15:00:00'
    ),
    (
        303,
        8,
        NULL,
        'highlight',
        'H1 Tag and Heading Structure',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617928/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/10/highlight_topic10_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        148.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617928/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/10/highlight_topic10_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t10',
        '2026-07-18 16:00:00',
        '2026-07-18 16:00:00'
    ),
    (
        304,
        8,
        NULL,
        'highlight',
        'Keyword Placement in URLs and Meta Tags',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617944/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/11/highlight_topic11_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        145.7,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617944/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/11/highlight_topic11_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t11',
        '2026-07-18 17:00:00',
        '2026-07-18 17:00:00'
    ),
    (
        305,
        8,
        NULL,
        'highlight',
        'Content Originality and Quality',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617967/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/12/highlight_topic12_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        199.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617967/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/12/highlight_topic12_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t12',
        '2026-07-18 18:00:00',
        '2026-07-18 18:00:00'
    ),
    (
        306,
        8,
        NULL,
        'highlight',
        'Satisfying Search Intent',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779617970/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/13/highlight_topic13_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        135.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779617970/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/13/highlight_topic13_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t13',
        '2026-07-18 19:00:00',
        '2026-07-18 19:00:00'
    ),
    (
        307,
        8,
        NULL,
        'highlight',
        'Differentiating Content Strategy + Introduction to SEO Fundamentals + Effort Lever in Content Creation',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618003/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/14/highlight_topic14_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        198.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618003/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/14/highlight_topic14_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t14',
        '2026-07-18 20:00:00',
        '2026-07-18 20:00:00'
    ),
    (
        308,
        8,
        NULL,
        'highlight',
        'The Uniqueness and Data Lever + Updating Existing Content',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618009/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/15/highlight_topic15_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        199.6,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618009/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/15/highlight_topic15_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t15',
        '2026-07-18 21:00:00',
        '2026-07-18 21:00:00'
    ),
    (
        309,
        8,
        NULL,
        'highlight',
        'Readability and User Experience + Visual Assets in Content',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618043/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/16/highlight_topic16_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        198.4,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618043/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/16/highlight_topic16_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t16',
        '2026-07-18 22:00:00',
        '2026-07-18 22:00:00'
    ),
    (
        310,
        8,
        NULL,
        'highlight',
        'Creating Helpful Content + Originality in Content Creation',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618048/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/17/highlight_topic17_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        199.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618048/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/17/highlight_topic17_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t17',
        '2026-07-18 23:00:00',
        '2026-07-18 23:00:00'
    ),
    (
        311,
        8,
        NULL,
        'highlight',
        'Accuracy and Trustworthiness + Demonstrating Expertise',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618093/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/18/highlight_topic18_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        199.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618093/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/18/highlight_topic18_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t18',
        '2026-07-19 00:00:00',
        '2026-07-19 00:00:00'
    ),
    (
        312,
        8,
        NULL,
        'highlight',
        'Demonstrating Expertise and Credibility',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618089/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/19/highlight_topic19_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        198.8,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618089/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/19/highlight_topic19_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t19',
        '2026-07-19 01:00:00',
        '2026-07-19 01:00:00'
    ),
    (
        313,
        8,
        NULL,
        'highlight',
        'Schema Markup and Technical SEO',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618125/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/20/highlight_topic20_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        199.1,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618125/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/20/highlight_topic20_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t20',
        '2026-07-19 02:00:00',
        '2026-07-19 02:00:00'
    ),
    (
        314,
        8,
        NULL,
        'highlight',
        'Internal Linking Strategies',
        'https://res.cloudinary.com/dbwqzrbur/video/upload/v1779618137/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/21/highlight_topic21_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.mp4',
        198.2,
        'https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_320,h_180/v1779618137/jobs/a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e/topics/21/highlight_topic21_a3ca9391-82e8-43bb-a6d2-4bf8be6a4e9e.jpg',
        NULL,
        NULL,
        'highlight-a3ca9391-t21',
        '2026-07-19 03:00:00',
        '2026-07-19 03:00:00'
    );

-- PROJECTS (video editor sessions) – a few teachers have draft projects
-- ============================================================================
INSERT INTO
    projects (
        edit_id,
        user_id,
        video_id,
        session_name,
        status,
        created_at,
        updated_at
    )
VALUES (
        1,
        2,
        3,
        'TOEIC Tenses - intro overlay session',
        'finalized',
        '2026-06-21 10:00:00',
        '2026-06-21 11:00:00'
    ),
    (
        2,
        4,
        7,
        'JS Highlights - chapter markers',
        'saved',
        '2026-06-22 09:00:00',
        '2026-06-22 10:00:00'
    ),
    (
        3,
        4,
        9,
        'HTML/CSS quick recap',
        'draft',
        '2026-06-22 09:30:00',
        '2026-06-22 09:30:00'
    ),
    (
        4,
        6,
        8,
        'Python list cheatsheet overlay',
        'finalized',
        '2026-06-23 11:00:00',
        '2026-06-23 12:00:00'
    ),
    (
        5,
        7,
        13,
        'Lightroom B-roll overlay project',
        'saved',
        '2026-06-24 14:00:00',
        '2026-06-24 15:00:00'
    ),
    (
        6,
        8,
        17,
        'Digital Marketing intro hook',
        'draft',
        '2026-06-25 10:00:00',
        '2026-06-25 10:00:00'
    );

-- ============================================================================
-- MASCOT OVERLAYS (overlays placed on the editor sessions above)
-- ============================================================================
INSERT INTO
    mascot_overlays (
        mascot_overlay_id,
        edit_id,
        image_id,
        position_x,
        position_y,
        scale,
        start_time,
        end_time,
        layer_index,
        created_at,
        updated_at
    )
VALUES (
        1,
        1,
        1,
        0.78,
        0.18,
        0.35,
        0.0,
        18.0,
        1,
        '2026-06-21 10:05:00',
        '2026-06-21 10:05:00'
    ),
    (
        2,
        1,
        1,
        0.10,
        0.82,
        0.30,
        1200.0,
        1220.5,
        2,
        '2026-06-21 10:08:00',
        '2026-06-21 10:08:00'
    ),
    (
        3,
        2,
        2,
        0.82,
        0.22,
        0.40,
        5.0,
        35.0,
        1,
        '2026-06-22 09:15:00',
        '2026-06-22 09:15:00'
    ),
    (
        4,
        2,
        2,
        0.20,
        0.80,
        0.32,
        900.0,
        925.0,
        2,
        '2026-06-22 09:20:00',
        '2026-06-22 09:20:00'
    ),
    (
        5,
        4,
        4,
        0.85,
        0.15,
        0.38,
        3.5,
        20.0,
        1,
        '2026-06-23 11:10:00',
        '2026-06-23 11:10:00'
    ),
    (
        6,
        4,
        4,
        0.15,
        0.78,
        0.34,
        600.0,
        640.0,
        2,
        '2026-06-23 11:20:00',
        '2026-06-23 11:20:00'
    ),
    (
        7,
        5,
        5,
        0.80,
        0.20,
        0.42,
        8.0,
        40.0,
        1,
        '2026-06-24 14:10:00',
        '2026-06-24 14:10:00'
    ),
    (
        8,
        6,
        6,
        0.75,
        0.20,
        0.45,
        2.0,
        25.0,
        1,
        '2026-06-25 10:05:00',
        '2026-06-25 10:05:00'
    );

-- ============================================================================
-- COURSES (29 courses; categories is JSON array)
-- ============================================================================
INSERT INTO
    courses (
        id,
        name,
        description,
        categories,
        level,
        duration,
        language,
        price,
        user_id,
        status,
        video_id,
        thumbnail_url,
        created_at,
        updated_at
    )
VALUES (
        1,
        'TOEIC Grammar Mastery 2026',
        'Khóa học ngữ pháp TOEIC toàn diện cho người mới bắt đầu.',
        '["TOEIC","Grammar","English"]',
        'Beginner',
        '02:51:45.875',
        'vi',
        399000,
        2,
        'publish',
        3,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783949711/pexels-photo-31666035_t5mara.jpg',
        '2026-05-29 09:00:00',
        '2026-07-29 16:00:00'
    ),
    (
        2,
        'English Conversation & Listening Practice',
        'Hội thoại tiếng Anh cơ bản kết hợp luyện nghe cụm từ thông dụng hằng ngày.',
        '["Languages","English","Conversation"]',
        'Beginner',
        '02:55:03.530',
        'en',
        199000,
        2,
        'publish',
        21,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783949766/pexels-photo-3182765_bxqrz1.jpg',
        '2026-01-06 10:20:00',
        '2026-01-06 10:20:00'
    ),
    (
        3,
        'Hán Ngữ HSK 1 - Tiếng Trung Sơ Cấp',
        'Khóa học tiếng Trung theo giáo trình HSK 1 - phát âm, bộ thủ, hội thoại cơ bản.',
        '["Languages","Chinese","HSK"]',
        'Beginner',
        '01:18:33.643',
        'vi',
        149000,
        3,
        'publish',
        30,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783949822/pexels-photo-6893112_ee7vkx.jpg',
        '2026-02-11 11:20:00',
        '2026-02-11 11:20:00'
    ),
    (
        4,
        'Cài Đặt Môi Trường & Khắc Phục CORS',
        'Setup môi trường dev Windows từ A-Z và xử lý các tình huống CORS hay gặp khi build full-stack app.',
        '["Programming","Web","DevTools"]',
        'Beginner',
        '02:52:59.783',
        'vi',
        199000,
        4,
        'publish',
        5,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1786024241/cors-la-gi_mhocop.jpg',
        '2025-12-30 09:55:00',
        '2026-07-24 08:45:00'
    ),
    (
        5,
        'JavaScript Toàn Tập - Từ Zero Đến Hero',
        'Học JavaScript từ nền tảng đến nâng cao: ES2015+, Closure, Async/Await, Event Loop và DOM manipulation.',
        '["Programming","Web","JavaScript"]',
        'Intermediate',
        '04:14:59.349',
        'en',
        499000,
        4,
        'publish',
        7,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1786272140/sddefault_b1cfmf.jpg',
        '2026-01-21 16:10:00',
        '2026-07-30 10:30:00'
    ),
    (
        6,
        'HTML, CSS & Node.js Full Stack Starter',
        'Một path duy nhất để bạn chuyển từ frontend HTML/CSS sang backend Node.js.',
        '["Programming","Web","HTML","CSS","Node.js"]',
        'Intermediate',
        '12:31:49.568',
        'en',
        499000,
        4,
        'publish',
        9,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1786272248/3793268_b8ac_4_j7jwub.jpg',
        '2026-06-07 10:00:00',
        '2026-06-07 10:00:00'
    ),
    (
        7,
        'System Design Production Infrastructure',
        'Khóa học về APIs, Database, Caching, CDN, Load Balancing và Production Infrastructure.',
        '["Programming","System Design","DevOps"]',
        'Advanced',
        '02:05:21.965',
        'en',
        699000,
        5,
        'publish',
        4,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783949976/pexels-photo-4508751_msegn9.jpg',
        '2026-03-12 14:50:00',
        '2026-03-12 14:50:00'
    ),
    (
        8,
        'Cấu Trúc Dữ Liệu: Cây Nhị Phân',
        'Bài chuyên đề về Binary Tree - duyệt cây, BST, ứng dụng thực tế.',
        '["Programming","Data Structures","Algorithms"]',
        'Intermediate',
        '01:50:05.291',
        'vi',
        299000,
        5,
        'publish',
        29,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950082/images_y4wuu0.jpg',
        '2026-02-04 15:10:00',
        '2026-02-04 15:10:00'
    ),
    (
        9,
        'Python Cơ Bản - Làm Chủ Danh Sách (List)',
        'Tất cả về list trong Python: slicing, list comprehension, các phương thức và mẹo tối ưu.',
        '["Programming","Python"]',
        'Beginner',
        '00:43:15.805',
        'vi',
        0,
        6,
        'publish',
        8,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950118/pexels-photo-1181359_wus48n.jpg',
        '2026-06-01 12:00:00',
        '2026-06-01 12:00:00'
    ),
    (
        10,
        'Machine Learning Fundamentals',
        'Tổng quan ML cho người mới - các khái niệm cốt lõi, vòng đời ML và demo nhỏ.',
        '["AI","Machine Learning","Python","Data Science"]',
        'Intermediate',
        '01:37:40.885',
        'en',
        399000,
        6,
        'publish',
        28,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950146/pexels-photo-17483868_p8cpd0.jpg',
        '2026-03-05 11:40:00',
        '2026-03-05 11:40:00'
    ),
    (
        11,
        'Khai Thác ChatGPT Hiệu Quả',
        'Học cách viết prompt chuẩn và khai thác sức mạnh của AI trong công việc hàng ngày.',
        '["AI","ChatGPT","Prompt"]',
        'Beginner',
        '01:21:24.203',
        'vi',
        149000,
        6,
        'banned',
        19,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950262/images_fvov6g.jpg',
        '2026-06-03 14:00:00',
        '2026-07-05 09:30:00'
    ),
    (
        12,
        'Lightroom Căn Bản - Nắm Vững Nguyên Lý',
        'Hậu kỳ ảnh trong Lightroom Classic - hiểu nguyên lý sâu hơn so với preset.',
        '["Design","Photography","Lightroom"]',
        'Intermediate',
        '01:29:26.101',
        'vi',
        299000,
        7,
        'publish',
        13,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950262/images_fvov6g.jpg',
        '2026-01-14 14:35:00',
        '2026-01-14 14:35:00'
    ),
    (
        13,
        'Thiết Kế Đồ Họa Online từ Cơ Bản Đến Nâng Cao',
        'Khóa graphic design tổng quát - bố cục, màu sắc, typography, brand identity.',
        '["Design","Graphic Design"]',
        'Beginner',
        '01:20:15.424',
        'vi',
        349000,
        7,
        'publish',
        14,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950298/pexels-photo-7598019_lhl8an.jpg',
        '2026-02-04 15:10:00',
        '2026-02-04 15:10:00'
    ),
    (
        14,
        'Học Nhiếp Ảnh Cơ Bản Trong 90 Phút',
        'Khóa nhiếp ảnh nhập môn: tam giác phơi sáng, bố cục, ánh sáng và workflow chụp căn bản.',
        '["Design","Photography"]',
        'Beginner',
        '01:28:29.126',
        'en',
        199000,
        7,
        'publish',
        24,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950343/images_gyr4qx.jpg',
        '2026-05-30 09:30:00',
        '2026-05-30 09:30:00'
    ),
    (
        15,
        'Figma Crash Course - Auto Layout & Prototype',
        'Học Figma từ con số 0 - frame, auto-layout, components, variant và prototype.',
        '["Design","UI/UX","Figma"]',
        'Beginner',
        '01:05:53.792',
        'en',
        249000,
        7,
        'publish',
        27,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950412/images_k2cwt8.jpg',
        '2026-06-05 15:00:00',
        '2026-07-30 15:00:00'
    ),
    (
        16,
        'Digital Marketing Cho Người Mới',
        'Tổng quan digital marketing - kênh, phễu, và 35 tuyệt chiêu khuyến mãi tăng doanh số.',
        '["Marketing","Digital Marketing"]',
        'Beginner',
        '02:39:38.839',
        'vi',
        299000,
        8,
        'publish',
        17,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950461/images_czrlfe.jpg',
        '2026-01-14 14:35:00',
        '2026-01-14 14:35:00'
    ),
    (
        17,
        'Copywriting Trong 76 Phút',
        'Crash course copywriting bán hàng - headline, USP, CTA và checklist viết content.',
        '["Marketing","Copywriting"]',
        'Intermediate',
        '01:11:36.713',
        'en',
        199000,
        8,
        'publish',
        25,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950504/pexels-photo-4067126_czsunn.jpg',
        '2026-05-07 12:20:00',
        '2026-05-07 12:20:00'
    ),
    (
        18,
        'SEO Mastery 2026',
        'Checklist SEO mới nhất 2026 - on-page, technical, EEAT, AI search optimization.',
        '["Marketing","SEO"]',
        'Advanced',
        '01:51:53.771',
        'en',
        499000,
        8,
        'publish',
        26,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950539/images_ilthxk.png',
        '2026-02-17 19:05:00',
        '2026-02-17 19:05:00'
    ),
    (
        19,
        'Power BI - Beyond Drag & Drop',
        'Khóa phân tích dữ liệu với Power BI - data model, DAX cơ bản, thiết kế dashboard story-driven.',
        '["Data","Business Intelligence","Power BI"]',
        'Intermediate',
        '01:18:41.344',
        'vi',
        349000,
        8,
        'publish',
        15,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950600/images_j6mesq.jpg',
        '2026-05-14 16:15:00',
        '2026-05-14 16:15:00'
    ),
    (
        20,
        'Học CapCut Trong 1 Giờ',
        'Nâng cấp kỹ năng CapCut: edit, audio, trending effects và preset export đa nền tảng.',
        '["Video","Editing","CapCut"]',
        'Beginner',
        '01:03:38.709',
        'vi',
        199000,
        9,
        'publish',
        18,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950655/images_ntkgvm.jpg',
        '2026-02-24 09:15:00',
        '2026-02-24 09:15:00'
    ),
    (
        21,
        'Premiere Pro Cho Người Mới',
        'Premiere Pro full beginner tutorial - timeline, transition, color grading, audio polish.',
        '["Video","Editing","Premiere Pro"]',
        'Beginner',
        '01:16:06.741',
        'en',
        249000,
        9,
        'publish',
        20,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950694/images_griys7.jpg',
        '2026-02-24 09:15:00',
        '2026-02-24 09:15:00'
    ),
    (
        22,
        'Tư Duy Phản Biện',
        'Seminar tư duy phản biện - mô hình lập luận, fallacy thường gặp và thực hành.',
        '["Soft Skills","Critical Thinking"]',
        'Beginner',
        '01:12:49.299',
        'vi',
        149000,
        10,
        'publish',
        12,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950737/images_ybtmjm.jpg',
        '2026-01-06 10:20:00',
        '2026-01-06 10:20:00'
    ),
    (
        23,
        'Project Management 101',
        'Project management nền tảng cho người mới - vòng đời dự án, scope, risk, tools.',
        '["Soft Skills","Project Management"]',
        'Beginner',
        '01:00:23.808',
        'en',
        199000,
        10,
        'publish',
        22,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950784/images_vztls4.jpg',
        '2026-03-18 16:30:00',
        '2026-03-18 16:30:00'
    ),
    (
        24,
        'Music Theory 101 for Guitar Players',
        'Nhạc lý cơ bản dành riêng cho guitar - quãng, hợp âm, scale và ứng dụng improvise.',
        '["Music","Guitar"]',
        'Beginner',
        '01:30:39.979',
        'en',
        179000,
        10,
        'publish',
        23,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950823/images_h4ymhq.jpg',
        '2026-04-02 13:25:00',
        '2026-04-02 13:25:00'
    ),
    (
        25,
        'Flutter & Dart Cross-Platform Mobile Apps',
        'Xây dựng ứng dụng di động iOS & Android đa nền tảng với Flutter từ cơ bản đến nâng cao.',
        '["Programming","Mobile","Flutter"]',
        'Intermediate',
        '03:45:00.000',
        'vi',
        349000,
        4,
        'pending',
        NULL,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1786272391/Flutter-1.2-Dart-2.2-Googles-Treat-to-Cross-Platform-App-Development-Segment_aufbq4.webp',
        '2026-07-25 08:45:00',
        '2026-07-25 08:45:00'
    ),
    (
        26,
        'Next.js App Router & Server Actions',
        'Lập trình web hiện đại với Next.js, SSR, SSG, Server Actions và Tailwind CSS.',
        '["Programming","Web","Next.js"]',
        'Advanced',
        '04:10:00.000',
        'vi',
        499000,
        4,
        'pending',
        NULL,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1786272560/images_aza2k3.jpg',
        '2026-07-29 10:30:00',
        '2026-07-29 10:30:00'
    ),
    (
        27,
        'UI/UX Research & Usability Testing',
        'Quy trình nghiên cứu người dùng, phỏng vấn chuyên sâu và kiểm thử giao diện người dùng.',
        '["Design","UI/UX","Research"]',
        'Intermediate',
        '02:15:00.000',
        'en',
        299000,
        7,
        'pending',
        NULL,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950412/images_k2cwt8.jpg',
        '2026-07-25 10:10:00',
        '2026-07-25 10:10:00'
    ),
    (
        28,
        'Docker & Kubernetes Production Deployment',
        'Đóng gói container với Docker và quản trị cụm Kubernetes cho các ứng dụng microservices.',
        '["Programming","DevOps","Docker"]',
        'Advanced',
        '05:20:00.000',
        'en',
        599000,
        5,
        'rejected',
        NULL,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783949976/pexels-photo-4508751_msegn9.jpg',
        '2026-07-20 11:00:00',
        '2026-07-22 16:30:00'
    ),
    (
        29,
        'Deep Learning với PyTorch & Computer Vision',
        'Nhập môn học sâu với PyTorch, mạng nơ-ron CNN và ứng dụng nhận diện hình ảnh.',
        '["AI","Deep Learning","Python"]',
        'Advanced',
        '06:00:00.000',
        'vi',
        699000,
        6,
        'draft',
        NULL,
        'https://res.cloudinary.com/dbwqzrbur/image/upload/v1783950146/pexels-photo-17483868_p8cpd0.jpg',
        '2026-07-25 15:00:00',
        '2026-07-25 15:00:00'
    );

-- ============================================================================
-- LESSONS  (31 video lessons supported by the learner UI)
-- ============================================================================
INSERT INTO
    lessons (
        id,
        course_id,
        title,
        contentType,
        content,
        duration,
        status,
        description,
        video_id,
        created_at,
        updated_at
    )
VALUES (
        2,
        1,
        'Các Thì Trong Tiếng Anh (Tenses)',
        'video',
        '{"video_id":3}',
        '01:20:33.884',
        'active',
        'Bài 3: Tenses',
        3,
        '2026-06-20 12:10:00',
        '2026-06-20 12:10:00'
    ),
    (
        3,
        1,
        'To V1, V-ing, V1 (Verb Patterns)',
        'video',
        '{"video_id":2}',
        '00:49:53.679',
        'active',
        'Bài 4: Verb patterns',
        2,
        '2026-06-20 12:15:00',
        '2026-06-20 12:15:00'
    ),
    (
        4,
        1,
        'Phân Từ (Participles)',
        'video',
        '{"video_id":1}',
        '00:41:18.312',
        'active',
        'Bài 5: Participles',
        1,
        '2026-06-20 12:20:00',
        '2026-06-20 12:20:00'
    ),
    (
        6,
        2,
        'Basic English Conversation',
        'video',
        '{"video_id":21}',
        '01:13:53.493',
        'active',
        'Hội thoại tiếng Anh cơ bản',
        21,
        '2026-06-20 12:35:00',
        '2026-06-20 12:35:00'
    ),
    (
        7,
        2,
        'Tiếng Anh Khi Ngủ - 500 Cụm Từ Thông Dụng',
        'video',
        '{"video_id":31}',
        '01:41:10.037',
        'active',
        'Luyện nghe các cụm từ tiếng Anh thông dụng khi ngủ.',
        31,
        '2026-06-20 12:40:00',
        '2026-06-20 12:40:00'
    ),
    (
        8,
        3,
        'HSK 1 - Giáo Trình Online',
        'video',
        '{"video_id":30}',
        '01:18:33.643',
        'active',
        'Giáo trình HSK 1',
        30,
        '2026-06-20 13:05:00',
        '2026-06-20 13:05:00'
    ),
    (
        9,
        4,
        'Cài Đặt Môi Trường Windows Mới',
        'video',
        '{"video_id":5}',
        '01:44:17.336',
        'active',
        'Setup dev tools',
        5,
        '2026-06-21 12:05:00',
        '2026-07-24 08:45:00'
    ),
    (
        10,
        4,
        'CORS Policy & Cách Xử Lý',
        'video',
        '{"video_id":6}',
        '01:08:42.447',
        'active',
        'CORS hands-on',
        6,
        '2026-06-21 12:10:00',
        '2026-06-21 12:10:00'
    ),
    (
        11,
        5,
        'JavaScript Full Course (freeCodeCamp)',
        'video',
        '{"video_id":7}',
        '03:26:42.660',
        'active',
        'JS toàn diện từ freeCodeCamp',
        7,
        '2026-06-21 12:35:00',
        '2026-06-21 12:35:00'
    ),
    (
        12,
        5,
        'JavaScript Tutorial (Programming with Mosh)',
        'video',
        '{"video_id":11}',
        '00:48:16.689',
        'active',
        'JS súc tích với Mosh',
        11,
        '2026-06-21 12:40:00',
        '2026-06-21 12:40:00'
    ),
    (
        14,
        6,
        'HTML & CSS Full Course',
        'video',
        '{"video_id":9}',
        '06:31:15.676',
        'active',
        'Frontend foundation',
        9,
        '2026-06-21 13:05:00',
        '2026-06-21 13:05:00'
    ),
    (
        15,
        6,
        'Node.js Full Course',
        'video',
        '{"video_id":10}',
        '06:00:33.892',
        'active',
        'Backend với Node.js',
        10,
        '2026-06-21 13:10:00',
        '2026-06-21 13:10:00'
    ),
    (
        17,
        7,
        'System Design Full Course',
        'video',
        '{"video_id":4}',
        '02:05:21.965',
        'active',
        'Toàn bộ khóa System Design',
        4,
        '2026-06-22 12:10:00',
        '2026-06-22 12:10:00'
    ),
    (
        18,
        8,
        'Cây Nhị Phân (Binary Tree)',
        'video',
        '{"video_id":29}',
        '01:50:05.291',
        'active',
        'Lý thuyết + bài tập',
        29,
        '2026-06-22 12:35:00',
        '2026-06-22 12:35:00'
    ),
    (
        19,
        9,
        'List trong Python',
        'video',
        '{"video_id":8}',
        '00:43:15.805',
        'active',
        'Tất cả về list',
        8,
        '2026-06-23 12:05:00',
        '2026-06-23 12:05:00'
    ),
    (
        21,
        10,
        'Machine Learning Fundamentals',
        'video',
        '{"video_id":28}',
        '01:37:40.885',
        'active',
        'ML nhập môn',
        28,
        '2026-06-23 12:35:00',
        '2026-06-23 12:35:00'
    ),
    (
        22,
        11,
        'Hướng Dẫn ChatGPT Cơ Bản',
        'video',
        '{"video_id":19}',
        '01:21:24.203',
        'active',
        'ChatGPT cho người mới',
        19,
        '2026-06-23 13:05:00',
        '2026-06-23 13:05:00'
    ),
    (
        23,
        12,
        'Học Lightroom Căn Bản - Nắm Vững Nguyên Lý',
        'video',
        '{"video_id":13}',
        '01:29:26.101',
        'active',
        'Lightroom toàn tập',
        13,
        '2026-06-24 12:05:00',
        '2026-06-24 12:05:00'
    ),
    (
        24,
        13,
        'Thiết Kế Đồ Họa Online - Toàn Bộ',
        'video',
        '{"video_id":14}',
        '01:20:15.424',
        'active',
        'Graphic design A-Z',
        14,
        '2026-06-24 12:35:00',
        '2026-06-24 12:35:00'
    ),
    (
        25,
        14,
        'Learn Photography in 90 Minutes',
        'video',
        '{"video_id":24}',
        '01:28:29.126',
        'active',
        'Nhiếp ảnh 90 phút',
        24,
        '2026-06-24 13:05:00',
        '2026-06-24 13:05:00'
    ),
    (
        26,
        15,
        'Figma Crash Course - Auto Layout & Prototype',
        'video',
        '{"video_id":27}',
        '01:05:53.792',
        'active',
        'Crash course Figma',
        27,
        '2026-06-24 13:35:00',
        '2026-07-24 10:10:00'
    ),
    (
        27,
        16,
        'Tổng Hợp Khóa Học Digital Marketing',
        'video',
        '{"video_id":17}',
        '01:25:02.891',
        'active',
        'Tổng quan Digital Marketing',
        17,
        '2026-06-25 12:05:00',
        '2026-06-25 12:05:00'
    ),
    (
        28,
        16,
        '35 Tuyệt Chiêu Khuyến Mãi Tăng Doanh Số',
        'video',
        '{"video_id":16}',
        '01:14:35.948',
        'active',
        'Promotion playbook',
        16,
        '2026-06-25 12:10:00',
        '2026-06-25 12:10:00'
    ),
    (
        29,
        17,
        'Learn Copywriting in 76 Minutes',
        'video',
        '{"video_id":25}',
        '01:11:36.713',
        'active',
        'Copywriting crash course',
        25,
        '2026-06-25 12:35:00',
        '2026-06-25 12:35:00'
    ),
    (
        30,
        18,
        'Ultimate SEO Checklist 2026',
        'video',
        '{"video_id":26}',
        '01:51:53.771',
        'active',
        'SEO checklist mới nhất',
        26,
        '2026-06-25 13:05:00',
        '2026-06-25 13:05:00'
    ),
    (
        31,
        19,
        'Đừng Học Power BI Kiểu Kéo Chart Nữa',
        'video',
        '{"video_id":15}',
        '01:18:41.344',
        'active',
        'Power BI từ data model',
        15,
        '2026-06-25 13:35:00',
        '2026-06-25 13:35:00'
    ),
    (
        32,
        20,
        '1 Tiếng Nâng Cấp Kỹ Năng CapCut',
        'video',
        '{"video_id":18}',
        '01:03:38.709',
        'active',
        'CapCut intensive',
        18,
        '2026-06-27 12:05:00',
        '2026-06-27 12:05:00'
    ),
    (
        33,
        21,
        'Premiere Pro for Beginners - FULL',
        'video',
        '{"video_id":20}',
        '01:16:06.741',
        'active',
        'Premiere Pro toàn tập',
        20,
        '2026-06-27 12:35:00',
        '2026-06-27 12:35:00'
    ),
    (
        34,
        22,
        'Seminar Tư Duy Phản Biện',
        'video',
        '{"video_id":12}',
        '01:12:49.299',
        'active',
        'Critical thinking seminar',
        12,
        '2026-06-26 12:05:00',
        '2026-06-26 12:05:00'
    ),
    (
        35,
        23,
        'Project Management Fundamentals',
        'video',
        '{"video_id":22}',
        '01:00:23.808',
        'active',
        'PM 101 nền tảng',
        22,
        '2026-06-26 12:35:00',
        '2026-06-26 12:35:00'
    ),
    (
        36,
        24,
        'Music Theory 101 for Guitar Players',
        'video',
        '{"video_id":23}',
        '01:30:39.979',
        'active',
        'Nhạc lý cho guitarist',
        23,
        '2026-06-26 13:05:00',
        '2026-06-26 13:05:00'
    );

-- ============================================================================
-- LESSON_ACTIVITIES  (3 quiz containers on video lessons + 1 assignment)
-- ============================================================================
INSERT INTO
    lesson_activities (
        id,
        lesson_id,
        activity_type,
        title,
        description,
        order_index,
        max_attempts,
        status,
        created_by,
        created_at,
        updated_at
    )
VALUES (
        4,
        2,
        'quiz',
        'In-Video Quiz: Tenses Spot-Check',
        'Câu hỏi gắn vào video Tenses ở giây thứ 600.',
        1,
        2,
        'public',
        2,
        '2026-06-20 12:11:00',
        '2026-06-20 12:11:00'
    ),
    (
        5,
        35,
        'assignment',
        'Bài tập: Lập kế hoạch dự án mẫu',
        'Vẽ Gantt chart sơ lược cho 1 dự án ra mắt sản phẩm.',
        1,
        1,
        'public',
        10,
        '2026-06-26 12:40:00',
        '2026-06-26 12:40:00'
    ),
    (
        6,
        18,
        'quiz',
        'Quiz Cây Nhị Phân Cơ Bản',
        'Kiểm tra kiến thức cốt lõi về cấu trúc, phép duyệt và các dạng cây nhị phân.',
        1,
        3,
        'public',
        5,
        '2026-06-22 12:36:00',
        '2026-06-22 12:36:00'
    ),
    (
        7,
        25,
        'quiz',
        'Quiz từ video - Learn Photography in 90 Minutes',
        'AI Quiz generated from lesson video',
        1,
        NULL,
        'public',
        7,
        '2026-08-08 16:03:23',
        '2026-08-08 16:06:28'
    ),
    (
        8,
        9,
        'quiz',
        'Quiz từ video - Cài Đặt Môi Trường Windows Mới',
        'AI Quiz generated from lesson video',
        2,
        NULL,
        'public',
        4,
        '2026-08-08 16:39:42',
        '2026-08-08 16:40:16'
    );

-- ============================================================================
-- QUIZZES (all attached to supported video lessons)
-- ============================================================================
INSERT INTO
    quizzes (
        id,
        lesson_activity_id,
        name,
        shuffle_question,
        shuffle_option,
        passing_score,
        time_limit_minutes,
        is_in_video,
        created_at,
        updated_at
    )
VALUES (
        4,
        4,
        'Tenses Spot-Check',
        0,
        0,
        80,
        2,
        1,
        '2026-06-20 12:12:00',
        '2026-06-20 12:12:00'
    ),
    (
        5,
        6,
        'Quiz Cây Nhị Phân Cơ Bản',
        1,
        1,
        70,
        10,
        0,
        '2026-06-22 12:37:00',
        '2026-06-22 12:37:00'
    ),
    (
        6,
        7,
        'Quiz từ video - Learn Photography in 90 Minutes',
        0,
        0,
        80,
        0,
        1,
        '2026-08-08 16:05:59',
        '2026-08-08 16:06:43'
    ),
    (
        7,
        8,
        'Quiz từ video - Cài Đặt Môi Trường Windows Mới',
        0,
        0,
        80,
        0,
        1,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        8,
        8,
        'Quiz từ video - Cài Đặt Môi Trường Windows Mới',
        0,
        0,
        80,
        0,
        1,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    );

-- ============================================================================
-- QUIZ_QUESTIONS
-- ============================================================================
INSERT INTO
    quiz_questions (
        id,
        quiz_id,
        ques_type,
        ques_text,
        point,
        explanation,
        order_index,
        video_timestamp,
        evidence_timestamp,
        created_at,
        updated_at
    )
VALUES
    -- Quiz 4 (In-video TOEIC Tenses spot-check)
    -- video_timestamp giống nhau cho mọi câu trong 1 quiz "trong video": UI chỉ cho chọn 1 mốc chung cho cả quiz
    -- (ActivityQuizForm.tsx dùng chung 1 sharedVideoTimestamp), không có mốc riêng theo từng câu khi tạo thủ công.
    (
        13,
        4,
        'mcq',
        'Theo bài: chọn thì đúng cho "By next year, she ___ here for 10 years."',
        2.00,
        'Dùng Future Perfect ("will have lived") vì hành động sống ở đây sẽ hoàn thành tính đến một mốc trong tương lai (by next year).',
        1,
        '00:10:00.000',
        NULL,
        '2026-06-20 12:13:00',
        '2026-06-20 12:13:00'
    ),
    (
        14,
        4,
        'true/false',
        'Present Perfect dùng cho hành động có mốc thời gian cụ thể trong quá khứ.',
        1.00,
        'Sai. Present Perfect dùng cho hành động không có mốc thời gian cụ thể (đã xảy ra nhưng không rõ khi nào, hoặc còn liên quan đến hiện tại) — có mốc cụ thể phải dùng Simple Past.',
        2,
        '00:10:00.000',
        NULL,
        '2026-06-20 12:13:10',
        '2026-06-20 12:13:10'
    ),

-- Quiz 5 (Binary Tree fundamentals - standalone after-lesson quiz)
-- evidence_timestamp = NULL: quiz thủ công "ngoài video" hiện tại không có ô nhập bằng chứng khi tạo mới.
(
    15,
    5,
    'mcq',
    'Trong một cây nhị phân, nút gốc được xác định như thế nào?',
    1.00,
    'Nút gốc (root) là nút duy nhất không có nút cha; mọi nút khác trong cây đều có đúng một nút cha.',
    1,
    NULL,
    NULL,
    '2026-06-22 12:38:00',
    '2026-06-22 12:38:00'
),
(
    16,
    5,
    'mcq',
    'Mỗi nút trong cây nhị phân có tối đa bao nhiêu nút con?',
    1.00,
    'Theo định nghĩa, mỗi nút của cây nhị phân có tối đa 2 nút con (con trái và con phải).',
    2,
    NULL,
    NULL,
    '2026-06-22 12:38:10',
    '2026-06-22 12:38:10'
),
(
    17,
    5,
    'mcq',
    'Nút lá trong cây nhị phân là nút như thế nào?',
    1.00,
    'Nút lá là nút không có nút con nào (khác với nút gốc là nút không có nút cha).',
    3,
    NULL,
    NULL,
    '2026-06-22 12:38:20',
    '2026-06-22 12:38:20'
),
(
    18,
    5,
    'mcq',
    'Thứ tự duyệt Preorder của cây nhị phân là gì?',
    1.00,
    'Preorder duyệt theo thứ tự Gốc → Trái → Phải: xử lý nút gốc trước, rồi mới duyệt cây con trái, sau đó cây con phải.',
    4,
    NULL,
    NULL,
    '2026-06-22 12:38:30',
    '2026-06-22 12:38:30'
),
(
    19,
    5,
    'mcq',
    'Thứ tự duyệt Inorder của cây nhị phân là gì?',
    1.00,
    'Inorder duyệt theo thứ tự Trái → Gốc → Phải: duyệt cây con trái trước, xử lý nút gốc, rồi duyệt cây con phải.',
    5,
    NULL,
    NULL,
    '2026-06-22 12:38:40',
    '2026-06-22 12:38:40'
),
(
    20,
    5,
    'mcq',
    'Thứ tự duyệt Postorder của cây nhị phân là gì?',
    1.00,
    'Postorder duyệt theo thứ tự Trái → Phải → Gốc: duyệt cả hai cây con trước, xử lý nút gốc sau cùng.',
    6,
    NULL,
    NULL,
    '2026-06-22 12:38:50',
    '2026-06-22 12:38:50'
),
(
    21,
    5,
    'mcq',
    'Với cây tìm kiếm nhị phân có các khóa phân biệt, tính chất nào luôn đúng?',
    1.00,
    'Đây là tính chất định nghĩa của cây tìm kiếm nhị phân (BST): tại mọi nút, toàn bộ khóa ở cây con trái nhỏ hơn khóa của nút đó, và toàn bộ khóa ở cây con phải lớn hơn.',
    7,
    NULL,
    NULL,
    '2026-06-22 12:39:00',
    '2026-06-22 12:39:00'
),
(
    22,
    5,
    'mcq',
    'Đặc điểm của cây nhị phân đầy đủ (full binary tree) là gì?',
    1.00,
    'Cây nhị phân đầy đủ (full binary tree) yêu cầu mỗi nút có đúng 0 hoặc 2 nút con — không có nút nào chỉ có 1 nút con.',
    8,
    NULL,
    NULL,
    '2026-06-22 12:39:10',
    '2026-06-22 12:39:10'
),
(
    23,
    5,
    'mcq',
    'Mô tả nào đúng về cây nhị phân hoàn chỉnh (complete binary tree)?',
    1.00,
    'Cây nhị phân hoàn chỉnh (complete binary tree) yêu cầu mọi tầng đều đầy đủ trừ tầng cuối, và tầng cuối được điền các nút từ trái sang phải, không để trống ở giữa.',
    9,
    NULL,
    NULL,
    '2026-06-22 12:39:20',
    '2026-06-22 12:39:20'
),
(
    24,
    5,
    'mcq',
    'Trong trường hợp xấu nhất, tìm kiếm trên một cây tìm kiếm nhị phân bị lệch có độ phức tạp thời gian là bao nhiêu?',
    1.00,
    'Khi cây bị lệch hoàn toàn (suy biến thành danh sách liên kết), chiều cao cây bằng n, nên tìm kiếm trong trường hợp xấu nhất tốn O(n) thay vì O(log n) như cây cân bằng.',
    10,
    NULL,
    NULL,
    '2026-06-22 12:39:30',
    '2026-06-22 12:39:30'
),

-- Quiz 6 (AI-generated quiz, thay bằng dữ liệu THẬT lấy từ quiz id=9 do AI sinh qua pipeline thật
-- — course "Học Nhiếp Ảnh Cơ Bản Trong 90 Phút" / lesson "Learn Photography in 90 Minutes".
-- Giữ nguyên id nội bộ 25-29 (5 câu, đúng số câu thật của quiz 9) để không phải renumber gì khác.
(
    25,
    6,
    'mcq',
    'What does a higher ISO setting in photography result in?',
    1.00,
    'A higher ISO setting leads to more digital noise in the image.',
    1,
    '00:14:34.440',
    '00:02:49.760',
    '2026-08-08 16:05:59',
    '2026-08-08 16:06:43'
),
(
    26,
    6,
    'true/false',
    'The aperture is referred to as a hole in the lens.',
    1.00,
    'The transcript states that the aperture is a fancy name for a hole in your lens.',
    2,
    '00:14:34.440',
    '00:03:44.640',
    '2026-08-08 16:05:59',
    '2026-08-08 16:06:43'
),
(
    27,
    6,
    'mcq',
    'What is the effect of using a larger aperture like F1.4 compared to a smaller aperture like F16?',
    1.00,
    'A larger aperture like F1.4 results in a smaller depth of field.',
    3,
    '00:14:34.440',
    '00:14:34.440',
    '2026-08-08 16:05:59',
    '2026-08-08 16:06:43'
),
(
    28,
    6,
    'true/false',
    'ISO settings do not provide any creative options in photography.',
    1.00,
    'The transcript states that ISO does not provide any creative options.',
    4,
    '00:14:34.440',
    '00:07:13.240',
    '2026-08-08 16:05:59',
    '2026-08-08 16:06:43'
),
(
    29,
    6,
    'mcq',
    'What is the recommended ISO setting for shooting outdoors on a bright sunny day?',
    1.00,
    'The transcript recommends using the lowest ISO available, like 100 or 200, on a bright sunny day.',
    5,
    '00:14:34.440',
    '00:08:28.280',
    '2026-08-08 16:05:59',
    '2026-08-08 16:06:43'
),

-- Quiz 7 (AI-generated, dữ liệu thật lấy từ quiz id=7) — course "Cài Đặt Môi Trường & Khắc Phục CORS" / lesson "Cài Đặt Môi Trường Windows Mới"
(
    30,
    7,
    'mcq',
    'What is the first step to move the Downloads folder to drive D?',
    1.00,
    'The first step is to select the Downloads folder to move it.',
    1,
    '00:05:41.650',
    '00:03:23.350',
    '2026-08-08 16:39:42',
    '2026-08-08 16:39:42'
),
(
    31,
    7,
    'mcq',
    'What should be done after selecting ''Move'' in the Properties of the Downloads folder?',
    1.00,
    'After selecting ''Move'', the new location on drive D must be selected.',
    2,
    '00:05:41.650',
    '00:03:30.350',
    '2026-08-08 16:39:42',
    '2026-08-08 16:39:42'
),
(
    32,
    7,
    'true/false',
    'The video suggests creating a folder named ''workspace'' in drive D.',
    1.00,
    'The video explicitly states to create a folder named ''workspace'' in drive D.',
    3,
    '00:05:41.650',
    '00:04:20.950',
    '2026-08-08 16:39:42',
    '2026-08-08 16:39:42'
),
(
    33,
    7,
    'mcq',
    'What option should be selected to pin a folder to Quick Access?',
    1.00,
    'To pin a folder to Quick Access, right-click the folder and select ''Pin to Quick Access''.',
    4,
    '00:05:41.650',
    '00:04:29.650',
    '2026-08-08 16:39:42',
    '2026-08-08 16:39:42'
),
(
    34,
    7,
    'true/false',
    'The video mentions that users should keep all pinned items in Quick Access.',
    1.00,
    'The video suggests removing items from Quick Access that are not frequently used.',
    5,
    '00:05:41.650',
    '00:05:41.650',
    '2026-08-08 16:39:42',
    '2026-08-08 16:39:42'
),

-- Quiz 8 (AI-generated, dữ liệu thật lấy từ quiz id=8) — cùng lesson_activity với Quiz 7 (2 lần chạy AI cách nhau ~34s, giữ nguyên như dữ liệu thật)
(
    35,
    8,
    'mcq',
    'What should a user do to pin a folder to quick access?',
    1.00,
    'The correct action to pin a folder to quick access is to right-click the folder and select ''Pin to quick access''.',
    1,
    '00:09:49.750',
    '00:04:27.550',
    '2026-08-08 16:40:16',
    '2026-08-08 16:40:16'
),
(
    36,
    8,
    'true/false',
    'A user can remove items from quick access by right-clicking and selecting ''Remove''.',
    1.00,
    'The transcript states that users can remove items from quick access by right-clicking and selecting ''Remove''.',
    2,
    '00:09:49.750',
    '00:06:54.650',
    '2026-08-08 16:40:16',
    '2026-08-08 16:40:16'
),
(
    37,
    8,
    'mcq',
    'What should be done to set a default web browser after installing it?',
    1.00,
    'To set a default web browser, the user should open the start menu and search for ''default web browser''.',
    3,
    '00:09:49.750',
    '00:08:21.200',
    '2026-08-08 16:40:16',
    '2026-08-08 16:40:16'
),
(
    38,
    8,
    'mcq',
    'Which terminal is mentioned as commonly used for programming?',
    1.00,
    'The transcript mentions that Windows Terminal is commonly used for programming.',
    4,
    '00:09:49.750',
    '00:07:25.650',
    '2026-08-08 16:40:16',
    '2026-08-08 16:40:16'
),
(
    39,
    8,
    'true/false',
    'Installing the VKF-L2 requires restarting the computer.',
    1.00,
    'The transcript states that after installing VKF-L2, a restart is required for the changes to take effect.',
    5,
    '00:09:49.750',
    '00:09:49.750',
    '2026-08-08 16:40:16',
    '2026-08-08 16:40:16'
);

-- ============================================================================
-- QUIZ_OPTIONS  (only for MCQ / TF questions; short_text has no options)
-- ============================================================================
INSERT INTO
    quiz_options (
        id,
        question_id,
        option_text,
        is_correct,
        order_index,
        created_at,
        updated_at
    )
VALUES
    -- Q13 (MCQ): Future Perfect Continuous
    (
        35,
        13,
        'will live',
        0,
        1,
        '2026-06-20 12:14:00',
        '2026-06-20 12:14:00'
    ),
    (
        36,
        13,
        'will be living',
        0,
        2,
        '2026-06-20 12:14:00',
        '2026-06-20 12:14:00'
    ),
    (
        37,
        13,
        'will have lived',
        1,
        3,
        '2026-06-20 12:14:00',
        '2026-06-20 12:14:00'
    ),
    (
        38,
        13,
        'lived',
        0,
        4,
        '2026-06-20 12:14:00',
        '2026-06-20 12:14:00'
    ),
    -- Q14 (TF): present perfect mốc thời gian
    (
        39,
        14,
        'true',
        0,
        1,
        '2026-06-20 12:14:10',
        '2026-06-20 12:14:10'
    ),
    (
        40,
        14,
        'false',
        1,
        2,
        '2026-06-20 12:14:10',
        '2026-06-20 12:14:10'
    ),
    -- Q15: root node
    (
        41,
        15,
        'Nút có đúng hai nút con',
        0,
        1,
        '2026-06-22 12:40:00',
        '2026-06-22 12:40:00'
    ),
    (
        42,
        15,
        'Nút không có nút cha',
        1,
        2,
        '2026-06-22 12:40:00',
        '2026-06-22 12:40:00'
    ),
    (
        43,
        15,
        'Nút không có nút con',
        0,
        3,
        '2026-06-22 12:40:00',
        '2026-06-22 12:40:00'
    ),
    (
        44,
        15,
        'Nút có giá trị lớn nhất',
        0,
        4,
        '2026-06-22 12:40:00',
        '2026-06-22 12:40:00'
    ),
    -- Q16: maximum children
    (
        45,
        16,
        '1',
        0,
        1,
        '2026-06-22 12:40:10',
        '2026-06-22 12:40:10'
    ),
    (
        46,
        16,
        '2',
        1,
        2,
        '2026-06-22 12:40:10',
        '2026-06-22 12:40:10'
    ),
    (
        47,
        16,
        '3',
        0,
        3,
        '2026-06-22 12:40:10',
        '2026-06-22 12:40:10'
    ),
    (
        48,
        16,
        'Không giới hạn',
        0,
        4,
        '2026-06-22 12:40:10',
        '2026-06-22 12:40:10'
    ),
    -- Q17: leaf node
    (
        49,
        17,
        'Nút không có nút cha',
        0,
        1,
        '2026-06-22 12:40:20',
        '2026-06-22 12:40:20'
    ),
    (
        50,
        17,
        'Nút chỉ có một nút con',
        0,
        2,
        '2026-06-22 12:40:20',
        '2026-06-22 12:40:20'
    ),
    (
        51,
        17,
        'Nút không có nút con',
        1,
        3,
        '2026-06-22 12:40:20',
        '2026-06-22 12:40:20'
    ),
    (
        52,
        17,
        'Nút nằm ở bên trái nút gốc',
        0,
        4,
        '2026-06-22 12:40:20',
        '2026-06-22 12:40:20'
    ),
    -- Q18: preorder
    (
        53,
        18,
        'Trái → Gốc → Phải',
        0,
        1,
        '2026-06-22 12:40:30',
        '2026-06-22 12:40:30'
    ),
    (
        54,
        18,
        'Gốc → Trái → Phải',
        1,
        2,
        '2026-06-22 12:40:30',
        '2026-06-22 12:40:30'
    ),
    (
        55,
        18,
        'Trái → Phải → Gốc',
        0,
        3,
        '2026-06-22 12:40:30',
        '2026-06-22 12:40:30'
    ),
    (
        56,
        18,
        'Gốc → Phải → Trái',
        0,
        4,
        '2026-06-22 12:40:30',
        '2026-06-22 12:40:30'
    ),
    -- Q19: inorder
    (
        57,
        19,
        'Gốc → Trái → Phải',
        0,
        1,
        '2026-06-22 12:40:40',
        '2026-06-22 12:40:40'
    ),
    (
        58,
        19,
        'Trái → Gốc → Phải',
        1,
        2,
        '2026-06-22 12:40:40',
        '2026-06-22 12:40:40'
    ),
    (
        59,
        19,
        'Trái → Phải → Gốc',
        0,
        3,
        '2026-06-22 12:40:40',
        '2026-06-22 12:40:40'
    ),
    (
        60,
        19,
        'Phải → Gốc → Trái',
        0,
        4,
        '2026-06-22 12:40:40',
        '2026-06-22 12:40:40'
    ),
    -- Q20: postorder
    (
        61,
        20,
        'Gốc → Trái → Phải',
        0,
        1,
        '2026-06-22 12:40:50',
        '2026-06-22 12:40:50'
    ),
    (
        62,
        20,
        'Trái → Gốc → Phải',
        0,
        2,
        '2026-06-22 12:40:50',
        '2026-06-22 12:40:50'
    ),
    (
        63,
        20,
        'Trái → Phải → Gốc',
        1,
        3,
        '2026-06-22 12:40:50',
        '2026-06-22 12:40:50'
    ),
    (
        64,
        20,
        'Phải → Trái → Gốc',
        0,
        4,
        '2026-06-22 12:40:50',
        '2026-06-22 12:40:50'
    ),
    -- Q21: binary search tree property
    (
        65,
        21,
        'Mọi khóa ở cây con trái nhỏ hơn nút, cây con phải lớn hơn nút',
        1,
        1,
        '2026-06-22 12:41:00',
        '2026-06-22 12:41:00'
    ),
    (
        66,
        21,
        'Mọi khóa ở cây con trái lớn hơn nút, cây con phải nhỏ hơn nút',
        0,
        2,
        '2026-06-22 12:41:00',
        '2026-06-22 12:41:00'
    ),
    (
        67,
        21,
        'Mọi nút đều phải có đúng hai nút con',
        0,
        3,
        '2026-06-22 12:41:00',
        '2026-06-22 12:41:00'
    ),
    (
        68,
        21,
        'Các khóa phải tăng dần theo từng tầng',
        0,
        4,
        '2026-06-22 12:41:00',
        '2026-06-22 12:41:00'
    ),
    -- Q22: full binary tree
    (
        69,
        22,
        'Mỗi nút có đúng 0 hoặc 2 nút con',
        1,
        1,
        '2026-06-22 12:41:10',
        '2026-06-22 12:41:10'
    ),
    (
        70,
        22,
        'Mọi nút lá phải nằm cùng một tầng',
        0,
        2,
        '2026-06-22 12:41:10',
        '2026-06-22 12:41:10'
    ),
    (
        71,
        22,
        'Mỗi nút bắt buộc có hai nút con',
        0,
        3,
        '2026-06-22 12:41:10',
        '2026-06-22 12:41:10'
    ),
    (
        72,
        22,
        'Chỉ tầng cuối mới được có nút lá',
        0,
        4,
        '2026-06-22 12:41:10',
        '2026-06-22 12:41:10'
    ),
    -- Q23: complete binary tree
    (
        73,
        23,
        'Mọi tầng đều phải đầy đủ tuyệt đối',
        0,
        1,
        '2026-06-22 12:41:20',
        '2026-06-22 12:41:20'
    ),
    (
        74,
        23,
        'Mọi tầng trừ tầng cuối đều đầy đủ; tầng cuối được điền từ trái sang phải',
        1,
        2,
        '2026-06-22 12:41:20',
        '2026-06-22 12:41:20'
    ),
    (
        75,
        23,
        'Mỗi nút phải có đúng 0 hoặc 2 nút con',
        0,
        3,
        '2026-06-22 12:41:20',
        '2026-06-22 12:41:20'
    ),
    (
        76,
        23,
        'Các khóa luôn thỏa mãn tính chất của cây tìm kiếm nhị phân',
        0,
        4,
        '2026-06-22 12:41:20',
        '2026-06-22 12:41:20'
    ),
    -- Q24: worst-case BST search
    (
        77,
        24,
        'O(1)',
        0,
        1,
        '2026-06-22 12:41:30',
        '2026-06-22 12:41:30'
    ),
    (
        78,
        24,
        'O(log n)',
        0,
        2,
        '2026-06-22 12:41:30',
        '2026-06-22 12:41:30'
    ),
    (
        79,
        24,
        'O(n)',
        1,
        3,
        '2026-06-22 12:41:30',
        '2026-06-22 12:41:30'
    ),
    (
        80,
        24,
        'O(n log n)',
        0,
        4,
        '2026-06-22 12:41:30',
        '2026-06-22 12:41:30'
    ),
    -- Q25 (thật, quiz AI id=9): higher ISO effect
    (
        81,
        25,
        'A brighter image with less noise',
        0,
        1,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        82,
        25,
        'More digital noise in the image',
        1,
        2,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        83,
        25,
        'A darker image with more detail',
        0,
        3,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        84,
        25,
        'Less sensitivity to light',
        0,
        4,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    -- Q26 (thật): aperture is a hole in the lens
    (
        85,
        26,
        'True',
        1,
        1,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        86,
        26,
        'False',
        0,
        2,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    -- Q27 (thật): larger aperture F1.4 vs smaller F16
    (
        87,
        27,
        'More elements in focus with F1.4',
        0,
        1,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        88,
        27,
        'Less light entering the camera with F1.4',
        0,
        2,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        89,
        27,
        'A smaller depth of field with F1.4',
        1,
        3,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        90,
        27,
        'Increased exposure time with F1.4',
        0,
        4,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    -- Q28 (thật): ISO provides no creative options
    (
        91,
        28,
        'True',
        1,
        1,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        92,
        28,
        'False',
        0,
        2,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    -- Q29 (thật): recommended ISO on a bright sunny day
    (
        93,
        29,
        'ISO 400 to 800',
        0,
        1,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        94,
        29,
        'ISO 800 to 1600',
        0,
        2,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        95,
        29,
        'ISO 100 or 200',
        1,
        3,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    (
        96,
        29,
        'ISO 1600 or higher',
        0,
        4,
        '2026-08-08 16:05:59',
        '2026-08-08 16:05:59'
    ),
    -- Q30: move Downloads folder, step 1
    (
        97,
        30,
        'Select the Downloads folder',
        1,
        1,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        98,
        30,
        'Create a new folder in drive D',
        0,
        2,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        99,
        30,
        'Delete the Downloads folder',
        0,
        3,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        100,
        30,
        'Rename the Downloads folder',
        0,
        4,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    -- Q31: move Downloads folder, step 2
    (
        101,
        31,
        'Select the new location on drive D',
        1,
        1,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        102,
        31,
        'Delete the Downloads folder',
        0,
        2,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        103,
        31,
        'Rename the Downloads folder',
        0,
        3,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        104,
        31,
        'Create a new folder in drive D',
        0,
        4,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    -- Q32: workspace folder on drive D
    (
        105,
        32,
        'True',
        1,
        1,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        106,
        32,
        'False',
        0,
        2,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    -- Q33: pin folder to Quick Access
    (
        107,
        33,
        'Right-click the folder and select ''Pin to Quick Access''',
        1,
        1,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        108,
        33,
        'Drag the folder to Quick Access',
        0,
        2,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        109,
        33,
        'Delete the folder',
        0,
        3,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        110,
        33,
        'Rename the folder',
        0,
        4,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    -- Q34: keep all pinned items in Quick Access
    (
        111,
        34,
        'True',
        0,
        1,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    (
        112,
        34,
        'False',
        1,
        2,
        '2026-08-08 16:39:42',
        '2026-08-08 16:39:42'
    ),
    -- Q35: pin folder to quick access (Quiz 8)
    (
        113,
        35,
        'Right-click the folder and select ''Pin to quick access''',
        1,
        1,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        114,
        35,
        'Drag the folder to the desktop',
        0,
        2,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        115,
        35,
        'Open the folder and click ''Add to quick access''',
        0,
        3,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        116,
        35,
        'Select the folder and press Ctrl + P',
        0,
        4,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    -- Q36: remove items from quick access
    (
        117,
        36,
        'True',
        1,
        1,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        118,
        36,
        'False',
        0,
        2,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    -- Q37: set default web browser
    (
        119,
        37,
        'Open the start menu and search for ''default web browser''',
        1,
        1,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        120,
        37,
        'Access browser settings and select ''Make default''',
        0,
        2,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        121,
        37,
        'Right-click the browser icon and select ''Set as default''',
        0,
        3,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        122,
        37,
        'Open the browser and click ''Set as default'' in the homepage',
        0,
        4,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    -- Q38: terminal commonly used for programming
    (
        123,
        38,
        'Windows Terminal',
        1,
        1,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        124,
        38,
        'Command Prompt',
        0,
        2,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        125,
        38,
        'Git Bash',
        0,
        3,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        126,
        38,
        'PowerShell',
        0,
        4,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    -- Q39: installing VKF-L2 requires restart
    (
        127,
        39,
        'True',
        1,
        1,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    ),
    (
        128,
        39,
        'False',
        0,
        2,
        '2026-08-08 16:40:16',
        '2026-08-08 16:40:16'
    );

-- ============================================================================
-- ENROLLS (Course Enrollment Records)
-- ============================================================================
INSERT INTO
    enrolls (
        user_id,
        course_id,
        progress,
        status,
        enrolled_at,
        completed_at
    )
VALUES (
        11,
        1,
        100,
        'completed',
        '2026-06-05 10:00:00',
        '2026-06-10 21:30:00'
    ),
    (
        11,
        4,
        100,
        'completed',
        '2026-01-06 09:59:00',
        '2026-06-12 19:00:00'
    ),
    (
        11,
        5,
        50,
        'active',
        '2026-06-08 10:00:00',
        NULL
    ),
    (
        11,
        6,
        30,
        'active',
        '2026-07-26 14:25:00',
        NULL
    ),
    (
        11,
        9,
        100,
        'completed',
        '2026-06-08 12:00:00',
        '2026-06-09 20:00:00'
    ),
    (
        12,
        1,
        100,
        'completed',
        '2026-06-05 11:00:00',
        '2026-06-12 22:00:00'
    ),
    (
        12,
        2,
        60,
        'active',
        '2026-01-13 10:24:00',
        NULL
    ),
    (
        12,
        3,
        25,
        'active',
        '2026-06-15 11:00:00',
        NULL
    ),
    (
        12,
        22,
        50,
        'active',
        '2026-01-13 10:24:00',
        NULL
    ),
    (
        13,
        12,
        100,
        'completed',
        '2026-01-21 14:40:00',
        '2026-06-15 19:00:00'
    ),
    (
        13,
        13,
        40,
        'active',
        '2026-05-14 12:24:00',
        NULL
    ),
    (
        13,
        14,
        100,
        'completed',
        '2026-06-06 09:30:00',
        '2026-06-07 18:00:00'
    ),
    (
        13,
        15,
        75,
        'active',
        '2026-06-20 09:00:00',
        NULL
    ),
    (
        13,
        16,
        20,
        'active',
        '2026-01-21 14:40:00',
        NULL
    ),
    (
        14,
        4,
        100,
        'completed',
        '2026-06-07 14:00:00',
        '2026-06-08 23:00:00'
    ),
    (
        14,
        5,
        100,
        'completed',
        '2026-01-28 16:14:00',
        '2026-06-22 20:30:00'
    ),
    (
        14,
        7,
        0,
        'active',
        '2026-06-15 14:00:00',
        NULL
    ),
    (
        14,
        8,
        55,
        'active',
        '2026-06-19 14:00:00',
        NULL
    ),
    (
        14,
        9,
        100,
        'completed',
        '2026-06-08 14:00:00',
        '2026-06-09 23:00:00'
    ),
    (
        15,
        1,
        100,
        'completed',
        '2026-06-05 09:00:00',
        '2026-06-11 18:00:00'
    ),
    (
        15,
        2,
        100,
        'completed',
        '2026-06-12 09:00:00',
        '2026-06-20 18:00:00'
    ),
    (
        15,
        14,
        100,
        'completed',
        '2026-06-08 09:00:00',
        '2026-06-09 17:00:00'
    ),
    (
        15,
        15,
        65,
        'active',
        '2026-06-21 09:00:00',
        NULL
    ),
    (
        16,
        4,
        85,
        'active',
        '2026-06-09 14:00:00',
        NULL
    ),
    (
        16,
        5,
        0,
        'active',
        '2026-06-03 08:39:00',
        NULL
    ),
    (
        16,
        9,
        100,
        'completed',
        '2026-06-08 14:00:00',
        '2026-06-09 22:00:00'
    ),
    (
        16,
        10,
        70,
        'active',
        '2026-06-20 14:00:00',
        NULL
    ),
    (
        16,
        11,
        30,
        'active',
        '2026-06-10 14:00:00',
        NULL
    ),
    (
        17,
        16,
        100,
        'completed',
        '2026-06-12 10:00:00',
        '2026-06-22 18:00:00'
    ),
    (
        17,
        17,
        50,
        'active',
        '2026-06-23 10:00:00',
        NULL
    ),
    (
        17,
        18,
        45,
        'active',
        '2026-06-26 10:00:00',
        NULL
    ),
    (
        17,
        23,
        15,
        'active',
        '2026-07-27 10:00:00',
        NULL
    ),
    (
        18,
        3,
        70,
        'active',
        '2026-07-24 09:30:00',
        NULL
    ),
    (
        18,
        13,
        60,
        'active',
        '2026-06-22 16:00:00',
        NULL
    ),
    (
        18,
        20,
        100,
        'completed',
        '2026-06-12 16:00:00',
        '2026-06-13 22:00:00'
    ),
    (
        18,
        21,
        35,
        'active',
        '2026-06-14 16:00:00',
        NULL
    ),
    (
        19,
        10,
        100,
        'completed',
        '2026-06-09 15:00:00',
        '2026-06-10 18:30:00'
    ),
    (
        19,
        12,
        100,
        'completed',
        '2026-06-11 15:00:00',
        '2026-06-20 19:00:00'
    ),
    (
        19,
        15,
        100,
        'completed',
        '2026-06-25 17:30:00',
        '2026-07-02 18:00:00'
    ),
    (
        20,
        1,
        100,
        'completed',
        '2026-06-06 09:00:00',
        '2026-06-12 19:00:00'
    ),
    (
        20,
        2,
        100,
        'completed',
        '2026-06-14 09:00:00',
        '2026-06-20 19:00:00'
    ),
    (
        20,
        7,
        0,
        'active',
        '2026-06-22 09:00:00',
        NULL
    ),
    (
        21,
        3,
        35,
        'active',
        '2026-07-28 20:15:00',
        NULL
    ),
    (
        21,
        9,
        100,
        'completed',
        '2026-06-10 09:00:00',
        '2026-06-11 21:00:00'
    ),
    (
        21,
        10,
        100,
        'completed',
        '2026-06-12 09:00:00',
        '2026-06-13 19:00:00'
    ),
    (
        21,
        11,
        25,
        'active',
        '2026-06-15 09:00:00',
        NULL
    ),
    (
        22,
        12,
        55,
        'active',
        '2026-06-12 14:00:00',
        NULL
    ),
    (
        22,
        14,
        100,
        'completed',
        '2026-06-15 14:00:00',
        '2026-06-16 17:00:00'
    ),
    (
        22,
        22,
        20,
        'active',
        '2026-07-26 14:00:00',
        NULL
    ),
    (
        23,
        22,
        100,
        'completed',
        '2026-04-02 10:19:00',
        '2026-06-18 20:00:00'
    ),
    (
        23,
        23,
        60,
        'active',
        '2026-06-19 09:00:00',
        NULL
    ),
    (
        23,
        24,
        45,
        'active',
        '2026-07-30 09:00:00',
        NULL
    ),
    (
        24,
        3,
        100,
        'completed',
        '2026-08-01 09:05:00',
        '2026-08-01 16:20:00'
    ),
    (
        24,
        16,
        100,
        'completed',
        '2026-06-10 11:00:00',
        '2026-06-19 20:00:00'
    ),
    (
        24,
        17,
        100,
        'completed',
        '2026-06-20 11:00:00',
        '2026-06-22 20:00:00'
    ),
    (
        24,
        18,
        100,
        'completed',
        '2026-06-23 11:00:00',
        '2026-06-25 20:00:00'
    ),
    (
        25,
        3,
        100,
        'completed',
        '2026-06-15 10:00:00',
        '2026-06-20 18:00:00'
    ),
    (
        25,
        9,
        100,
        'completed',
        '2026-06-21 10:00:00',
        '2026-06-22 21:00:00'
    ),
    (
        25,
        20,
        50,
        'active',
        '2026-06-25 10:00:00',
        NULL
    ),
    (
        25,
        24,
        30,
        'active',
        '2026-07-31 10:00:00',
        NULL
    ),
    (
        15,
        5,
        0,
        'active',
        '2026-02-04 08:47:00',
        NULL
    ),
    (
        16,
        13,
        0,
        'active',
        '2026-02-11 15:13:00',
        NULL
    ),
    (
        16,
        8,
        0,
        'active',
        '2026-02-11 15:13:00',
        NULL
    ),
    (
        17,
        3,
        0,
        'active',
        '2026-02-18 11:22:00',
        NULL
    ),
    (
        18,
        18,
        0,
        'active',
        '2026-02-24 19:07:00',
        NULL
    ),
    (
        19,
        20,
        0,
        'active',
        '2026-03-03 09:18:00',
        NULL
    ),
    (
        19,
        21,
        0,
        'active',
        '2026-03-03 09:18:00',
        NULL
    ),
    (
        20,
        10,
        0,
        'active',
        '2026-03-12 11:42:00',
        NULL
    ),
    (
        20,
        22,
        0,
        'active',
        '2026-03-12 11:42:00',
        NULL
    ),
    (
        21,
        7,
        0,
        'active',
        '2026-03-19 14:52:00',
        NULL
    ),
    (
        22,
        16,
        0,
        'active',
        '2026-03-25 16:33:00',
        NULL
    ),
    (
        22,
        23,
        0,
        'active',
        '2026-03-25 16:33:00',
        NULL
    ),
    (
        23,
        16,
        0,
        'active',
        '2026-04-02 10:17:00',
        NULL
    ),
    (
        24,
        7,
        0,
        'active',
        '2026-04-09 13:28:00',
        NULL
    ),
    (
        24,
        24,
        0,
        'active',
        '2026-04-09 13:28:00',
        NULL
    ),
    (
        25,
        21,
        0,
        'active',
        '2026-04-18 20:12:00',
        NULL
    ),
    (
        11,
        18,
        0,
        'active',
        '2026-04-26 15:43:00',
        NULL
    ),
    (
        12,
        18,
        0,
        'active',
        '2026-05-05 09:53:00',
        NULL
    ),
    (
        13,
        17,
        0,
        'active',
        '2026-05-14 12:22:00',
        NULL
    ),
    (
        14,
        10,
        0,
        'active',
        '2026-05-21 16:18:00',
        NULL
    ),
    (
        14,
        19,
        0,
        'active',
        '2026-05-21 16:18:00',
        NULL
    ),
    (
        15,
        7,
        0,
        'active',
        '2026-05-27 18:49:00',
        NULL
    ),
    (
        17,
        13,
        0,
        'active',
        '2026-06-10 10:58:00',
        NULL
    ),
    (
        17,
        8,
        0,
        'active',
        '2026-06-10 10:58:00',
        NULL
    ),
    (
        18,
        7,
        0,
        'active',
        '2026-06-19 14:08:00',
        NULL
    ),
    (
        18,
        10,
        0,
        'active',
        '2026-06-19 14:08:00',
        NULL
    ),
    (
        19,
        14,
        0,
        'active',
        '2026-06-25 17:28:00',
        NULL
    ),
    (
        20,
        18,
        0,
        'active',
        '2026-07-02 09:08:00',
        NULL
    ),
    (
        20,
        15,
        0,
        'active',
        '2026-07-02 09:08:00',
        NULL
    ),
    (
        21,
        6,
        0,
        'active',
        '2026-07-08 11:33:00',
        NULL
    ),
    (
        21,
        17,
        0,
        'active',
        '2026-07-08 11:33:00',
        NULL
    ),
    (
        22,
        7,
        0,
        'active',
        '2026-07-14 15:43:00',
        NULL
    ),
    (
        22,
        17,
        0,
        'active',
        '2026-07-14 15:43:00',
        NULL
    ),
    (
        23,
        8,
        0,
        'active',
        '2026-07-21 19:17:00',
        NULL
    ),
    (
        23,
        7,
        0,
        'active',
        '2026-07-21 19:17:00',
        NULL
    ),
    (
        24,
        10,
        0,
        'active',
        '2026-07-24 09:12:00',
        NULL
    ),
    (
        25,
        19,
        0,
        'active',
        '2026-07-25 10:32:00',
        NULL
    ),
    (
        25,
        14,
        0,
        'active',
        '2026-07-25 10:32:00',
        NULL
    ),
    (
        11,
        21,
        0,
        'active',
        '2026-07-26 14:23:00',
        NULL
    ),
    (
        12,
        12,
        0,
        'active',
        '2026-07-27 20:07:00',
        NULL
    ),
    (
        13,
        18,
        0,
        'active',
        '2026-07-31 19:28:00',
        NULL
    ),
    (
        16,
        21,
        0,
        'active',
        '2026-08-01 10:37:00',
        NULL
    ),
    (
        18,
        15,
        0,
        'active',
        '2026-08-01 15:33:00',
        NULL
    ),
    (
        22,
        20,
        0,
        'active',
        '2026-07-14 15:43:00',
        NULL
    ),
    (
        13,
        19,
        0,
        'active',
        '2026-07-31 19:28:00',
        NULL
    ),
    (
        15,
        10,
        0,
        'active',
        '2026-08-01 09:47:00',
        NULL
    ),
    (
        17,
        19,
        0,
        'active',
        '2026-08-01 13:12:00',
        NULL
    ),
    (
        18,
        6,
        0,
        'active',
        '2026-08-01 15:33:00',
        NULL
    ),
    (
        14,
        1,
        0,
        'active',
        '2026-08-01 08:22:00',
        NULL
    ),
    -- Additional paid enrollments backing the admin revenue demo history.
    (
        13,
        4,
        0,
        'active',
        '2025-12-31 18:44:00',
        NULL
    ),
    (
        19,
        2,
        0,
        'active',
        '2026-01-09 09:21:00',
        NULL
    ),
    (
        25,
        4,
        0,
        'active',
        '2026-01-17 20:10:00',
        NULL
    ),
    (
        25,
        16,
        0,
        'active',
        '2026-01-17 20:10:00',
        NULL
    ),
    (
        15,
        12,
        0,
        'active',
        '2026-01-24 10:39:00',
        NULL
    ),
    (
        22,
        2,
        0,
        'active',
        '2026-01-30 14:29:00',
        NULL
    ),
    (
        12,
        4,
        0,
        'active',
        '2026-02-02 08:55:00',
        NULL
    ),
    (
        12,
        5,
        0,
        'active',
        '2026-02-02 08:55:00',
        NULL
    ),
    (
        17,
        12,
        0,
        'active',
        '2026-02-07 19:20:00',
        NULL
    ),
    (
        24,
        2,
        0,
        'active',
        '2026-02-14 10:13:00',
        NULL
    ),
    (
        24,
        4,
        0,
        'active',
        '2026-02-14 10:13:00',
        NULL
    ),
    (
        14,
        18,
        0,
        'active',
        '2026-02-20 13:46:00',
        NULL
    ),
    (
        20,
        5,
        0,
        'active',
        '2026-02-27 21:06:00',
        NULL
    ),
    (
        11,
        8,
        0,
        'active',
        '2026-03-01 09:45:00',
        NULL
    ),
    (
        16,
        2,
        0,
        'active',
        '2026-03-07 16:30:00',
        NULL
    ),
    (
        23,
        4,
        0,
        'active',
        '2026-03-15 11:14:00',
        NULL
    ),
    (
        23,
        18,
        0,
        'active',
        '2026-03-15 11:14:00',
        NULL
    ),
    (
        13,
        5,
        0,
        'active',
        '2026-03-22 20:34:00',
        NULL
    ),
    (
        19,
        8,
        0,
        'active',
        '2026-03-29 14:10:00',
        NULL
    ),
    (
        19,
        23,
        0,
        'active',
        '2026-03-29 14:10:00',
        NULL
    ),
    (
        25,
        22,
        0,
        'active',
        '2026-04-05 10:22:00',
        NULL
    ),
    (
        15,
        18,
        0,
        'active',
        '2026-04-12 19:40:00',
        NULL
    ),
    (
        22,
        5,
        0,
        'active',
        '2026-04-16 08:49:00',
        NULL
    ),
    (
        22,
        8,
        0,
        'active',
        '2026-04-16 08:49:00',
        NULL
    ),
    (
        12,
        21,
        0,
        'active',
        '2026-04-22 15:33:00',
        NULL
    ),
    (
        17,
        20,
        0,
        'active',
        '2026-04-29 20:19:00',
        NULL
    ),
    (
        24,
        22,
        0,
        'active',
        '2026-05-02 09:25:00',
        NULL
    ),
    (
        14,
        13,
        0,
        'active',
        '2026-05-09 18:54:00',
        NULL
    ),
    (
        20,
        13,
        0,
        'active',
        '2026-05-12 12:11:00',
        NULL
    ),
    (
        20,
        21,
        0,
        'active',
        '2026-05-12 12:11:00',
        NULL
    ),
    (
        11,
        20,
        0,
        'active',
        '2026-05-18 20:41:00',
        NULL
    ),
    (
        11,
        3,
        0,
        'active',
        '2026-05-18 20:41:00',
        NULL
    ),
    (
        16,
        7,
        0,
        'active',
        '2026-05-24 10:44:00',
        NULL
    ),
    (
        23,
        5,
        0,
        'active',
        '2026-05-30 16:21:00',
        NULL
    ),
    (
        13,
        8,
        0,
        'active',
        '2026-06-01 08:43:00',
        NULL
    ),
    (
        19,
        17,
        0,
        'active',
        '2026-06-06 19:32:00',
        NULL
    ),
    (
        19,
        4,
        0,
        'active',
        '2026-06-06 19:32:00',
        NULL
    ),
    (
        25,
        7,
        0,
        'active',
        '2026-06-08 11:18:00',
        NULL
    ),
    (
        15,
        6,
        0,
        'active',
        '2026-06-13 20:07:00',
        NULL
    ),
    (
        22,
        19,
        0,
        'active',
        '2026-06-16 09:36:00',
        NULL
    ),
    (
        12,
        15,
        0,
        'active',
        '2026-06-22 14:53:00',
        NULL
    ),
    (
        17,
        14,
        0,
        'active',
        '2026-06-28 18:13:00',
        NULL
    ),
    (
        17,
        22,
        0,
        'active',
        '2026-06-28 18:13:00',
        NULL
    ),
    (
        24,
        6,
        0,
        'active',
        '2026-06-30 21:10:00',
        NULL
    ),
    (
        14,
        16,
        0,
        'active',
        '2026-07-04 09:30:00',
        NULL
    ),
    (
        20,
        12,
        0,
        'active',
        '2026-07-06 20:18:00',
        NULL
    ),
    (
        11,
        2,
        0,
        'active',
        '2026-07-09 08:56:00',
        NULL
    ),
    (
        16,
        14,
        0,
        'active',
        '2026-07-10 14:25:00',
        NULL
    ),
    (
        16,
        3,
        0,
        'active',
        '2026-07-10 14:25:00',
        NULL
    ),
    (
        23,
        10,
        0,
        'active',
        '2026-07-11 19:51:00',
        NULL
    ),
    (
        13,
        1,
        0,
        'active',
        '2026-07-13 10:36:00',
        NULL
    ),
    (
        19,
        3,
        0,
        'active',
        '2026-07-15 15:20:00',
        NULL
    ),
    (
        25,
        18,
        0,
        'active',
        '2026-07-16 09:46:00',
        NULL
    ),
    (
        25,
        5,
        0,
        'active',
        '2026-07-16 09:46:00',
        NULL
    ),
    (
        15,
        19,
        0,
        'active',
        '2026-07-17 20:30:00',
        NULL
    ),
    (
        15,
        21,
        0,
        'active',
        '2026-07-17 20:30:00',
        NULL
    ),
    (
        22,
        4,
        0,
        'active',
        '2026-07-18 11:44:00',
        NULL
    ),
    (
        12,
        24,
        0,
        'active',
        '2026-07-20 18:54:00',
        NULL
    ),
    (
        17,
        10,
        0,
        'active',
        '2026-07-22 10:17:00',
        NULL
    ),
    (
        24,
        13,
        0,
        'active',
        '2026-07-23 16:41:00',
        NULL
    ),
    (
        14,
        12,
        0,
        'active',
        '2026-07-28 09:26:00',
        NULL
    ),
    (
        14,
        2,
        0,
        'active',
        '2026-07-28 09:26:00',
        NULL
    ),
    (
        20,
        14,
        0,
        'active',
        '2026-07-29 19:10:00',
        NULL
    ),
    (
        11,
        22,
        0,
        'active',
        '2026-07-30 13:49:00',
        NULL
    ),
    (
        16,
        18,
        0,
        'active',
        '2026-08-02 10:16:00',
        NULL
    ),
    (
        16,
        16,
        0,
        'active',
        '2026-08-02 10:16:00',
        NULL
    ),
    (
        19,
        22,
        0,
        'active',
        '2026-08-05 20:19:00',
        NULL
    ),
    (
        25,
        10,
        0,
        'active',
        '2026-08-06 11:32:00',
        NULL
    );

-- ============================================================================
-- DISCUSSION POSTS
-- Three realistic student questions for lecturer 4 (Trần Đăng Khoa).
-- Every student below has role=2 and is enrolled in the course containing the
-- referenced lesson. One lecturer reply keeps the instructor Q&A dashboard
-- useful for demo: 3 total, 2 unanswered, 1 answered.
-- ============================================================================
INSERT INTO
    discussion_posts (
        id,
        lesson_id,
        user_id,
        parent_id,
        content,
        is_best_answer,
        upvotes,
        created_at,
        updated_at
    )
VALUES (
        1,
        11,
        11,
        NULL,
        'Ở phần Event Loop, em thử chạy setTimeout với thời gian 0 ms cùng Promise.resolve().then() thì callback của Promise luôn chạy trước. Có phải microtask queue luôn được xử lý hết trước khi sang macrotask không ạ, và có trường hợp nào thứ tự này thay đổi không thầy?',
        0,
        0,
        '2026-08-06 08:35:00',
        '2026-08-06 08:35:00'
    ),
    (
        2,
        10,
        14,
        NULL,
        'Em đã cấu hình Access-Control-Allow-Origin nhưng request đăng nhập kèm cookie vẫn bị trình duyệt chặn CORS. Nếu frontend và API khác domain thì có phải backend phải bật credentials, phía fetch dùng credentials: include và origin không được để dấu * không thầy?',
        0,
        0,
        '2026-08-05 20:18:00',
        '2026-08-05 20:18:00'
    ),
    (
        3,
        9,
        12,
        NULL,
        'Sau khi cài Node.js trên Windows, terminal PowerShell mở mới đã chạy được npm nhưng terminal đang mở trong VS Code vẫn báo npm is not recognized. Trường hợp này em chỉ cần reload VS Code hay phải cấu hình lại biến môi trường PATH ạ?',
        0,
        0,
        '2026-08-05 15:42:00',
        '2026-08-05 15:42:00'
    ),
    (
        4,
        10,
        4,
        2,
        'Đúng rồi em. Với request có cookie, backend phải trả về đúng origin cụ thể và bật credentials; frontend cũng cần gửi credentials: include. Sau khi sửa, em kiểm tra thêm preflight OPTIONS và thuộc tính SameSite, Secure của cookie nhé.',
        0,
        0,
        '2026-08-05 21:03:00',
        '2026-08-05 21:03:00'
    );

-- ============================================================================
-- LESSON_PROGRESS  (sample progress for supported video lessons only)
-- ============================================================================
INSERT INTO
    lesson_progress (
        user_id,
        course_id,
        lesson_id,
        progress
    )
VALUES
    -- student 11
    (11, 1, 2, 'completed'),
    (11, 1, 3, 'completed'),
    (11, 1, 4, 'completed'),
    (11, 4, 9, 'completed'),
    (11, 4, 10, 'completed'),
    (11, 5, 11, 'completed'),
    (11, 5, 12, 'in_progress'),
    (11, 6, 14, 'in_progress'),
    (11, 6, 15, 'not_started'),
    (11, 9, 19, 'completed'),

-- student 12
(12, 1, 2, 'completed'),
(12, 1, 3, 'completed'),
(12, 1, 4, 'completed'),
(12, 2, 6, 'completed'),
(12, 2, 7, 'in_progress'),
(12, 3, 8, 'in_progress'),
(12, 22, 34, 'in_progress'),

-- student 13
(13, 12, 23, 'completed'),
(13, 13, 24, 'in_progress'),
(13, 14, 25, 'completed'),
(13, 15, 26, 'in_progress'),
(13, 16, 27, 'in_progress'),
(13, 16, 28, 'not_started'),

-- student 14
(14, 4, 9, 'completed'),
(14, 4, 10, 'completed'),
(14, 5, 11, 'completed'),
(14, 5, 12, 'completed'),
(14, 7, 17, 'in_progress'),
(14, 8, 18, 'in_progress'),
(14, 9, 19, 'completed'),

-- student 15
(15, 1, 2, 'completed'),
(15, 1, 3, 'completed'),
(15, 1, 4, 'completed'),
(15, 2, 6, 'completed'),
(15, 2, 7, 'completed'),
(15, 14, 25, 'completed'),
(15, 15, 26, 'in_progress'),

-- student 16
(16, 4, 9, 'completed'),
(16, 4, 10, 'in_progress'),
(16, 5, 11, 'in_progress'),
(16, 9, 19, 'completed'),
(16, 10, 21, 'in_progress'),
(16, 11, 22, 'video-completed'),

-- student 17
(17, 16, 27, 'completed'),
(17, 16, 28, 'completed'),
(17, 17, 29, 'in_progress'),
(17, 18, 30, 'in_progress'),
(17, 23, 35, 'in_progress'),

-- student 18
(18, 20, 32, 'completed'),
(18, 21, 33, 'in_progress'),
(18, 13, 24, 'in_progress'),

-- student 19
(19, 10, 21, 'completed'),
(19, 12, 23, 'completed'),
(19, 15, 26, 'completed'),

-- student 20
(20, 1, 2, 'completed'),
(20, 1, 3, 'completed'),
(20, 1, 4, 'completed'),
(20, 2, 6, 'completed'),
(20, 2, 7, 'completed'),
(20, 7, 17, 'video-completed'),

-- student 21
(21, 9, 19, 'completed'),
(21, 10, 21, 'completed'),
(21, 11, 22, 'in_progress'),

-- student 22
(22, 12, 23, 'in_progress'),
(22, 14, 25, 'completed'),
(22, 22, 34, 'in_progress'),

-- student 23
(23, 22, 34, 'completed'),
(23, 23, 35, 'in_progress'),
(23, 24, 36, 'in_progress'),

-- student 24
(24, 3, 8, 'completed'),
(24, 16, 27, 'completed'),
(24, 16, 28, 'completed'),
(24, 17, 29, 'completed'),
(24, 18, 30, 'completed'),

-- student 25
(25, 3, 8, 'completed'),
(25, 9, 19, 'completed'),
(25, 20, 32, 'in_progress'),
(25, 24, 36, 'in_progress');

-- ============================================================================
-- ROADMAPS  (5 curated paths grouping multiple courses)
-- ============================================================================
INSERT INTO
    roadmaps (
        id,
        user_id,
        description,
        name,
        total_courses,
        progress
    )
VALUES (
        1,
        4,
        'Roadmap full-stack web cho beginner - HTML/CSS → JavaScript → Node.js + setup môi trường.',
        'Web Developer Path',
        3,
        33.33
    ),
    (
        2,
        8,
        'Roadmap Marketing Online từ tổng quan đến SEO và Copywriting.',
        'Digital Marketing Path',
        3,
        33.33
    ),
    (
        3,
        2,
        'Master tiếng Anh từ ngữ pháp TOEIC tới giao tiếp.',
        'English Mastery Path',
        2,
        50
    ),
    (
        4,
        7,
        'Path designer toàn diện - photography, graphic, Lightroom & Figma.',
        'Designer Path',
        4,
        25
    ),
    (
        5,
        6,
        'Lộ trình AI & Data - từ Python tới ML và ChatGPT.',
        'AI & Data Foundations',
        3,
        33.33
    );

-- ============================================================================
-- ROADMAP_COURSE  (M:N between roadmaps and courses)
-- ============================================================================
INSERT INTO
    roadmap_course (
        id,
        course_id,
        roadmap_id,
        `index`,
        status
    )
VALUES
    -- Roadmap 1 (Web Developer Path)
    (1, 4, 1, 1, 'finish'),
    (2, 6, 1, 2, 'learning'),
    (3, 5, 1, 3, 'null'),
    -- Roadmap 2 (Digital Marketing Path)
    (4, 16, 2, 1, 'finish'),
    (5, 17, 2, 2, 'learning'),
    (6, 18, 2, 3, 'null'),
    -- Roadmap 3 (English Mastery Path)
    (7, 1, 3, 1, 'finish'),
    (8, 2, 3, 2, 'learning'),
    -- Roadmap 4 (Designer Path)
    (9, 14, 4, 1, 'finish'),
    (10, 15, 4, 2, 'learning'),
    (11, 12, 4, 3, 'null'),
    (12, 13, 4, 4, 'null'),
    -- Roadmap 5 (AI & Data Foundations)
    (13, 9, 5, 1, 'finish'),
    (14, 10, 5, 2, 'learning'),
    (15, 11, 5, 3, 'null');

-- ============================================================================
-- FEEDBACKS  (course reviews - unique per (course_id, user_id))
-- ============================================================================
INSERT INTO
    feedbacks (
        id,
        course_id,
        user_id,
        rating,
        review_text,
        is_visible,
        created_at,
        updated_at,
        deleted_at
    )
VALUES (
        1,
        1,
        11,
        5,
        'Khóa ngữ pháp TOEIC rất rõ ràng, bài quiz cuối khóa rất hữu ích!',
        1,
        '2026-07-11 20:00:00',
        '2026-07-11 20:00:00',
        NULL
    ),
    (
        2,
        1,
        12,
        4,
        'Phần Tenses giảng rất kỹ, nhưng phần Participles có thể thêm ví dụ thực tế.',
        1,
        '2026-07-12 20:00:00',
        '2026-07-12 20:00:00',
        NULL
    ),
    (
        3,
        1,
        15,
        5,
        'Học xong tự tin hẳn lên khi làm bài part 5/6.',
        1,
        '2026-07-11 21:00:00',
        '2026-07-11 21:00:00',
        NULL
    ),
    (
        4,
        1,
        20,
        4,
        'Audio rõ, slide đẹp. Mình sẽ học tiếp các khóa khác của giảng viên này.',
        1,
        '2026-07-12 21:00:00',
        '2026-07-12 21:00:00',
        NULL
    ),
    (
        5,
        2,
        12,
        4,
        'Hội thoại bám sát thực tế, hơi nhanh ở phần đầu.',
        1,
        '2026-07-15 20:00:00',
        '2026-07-15 20:00:00',
        NULL
    ),
    (
        6,
        2,
        15,
        5,
        '500 cụm từ rất thực dụng, đã thuộc gần hết sau 1 tuần.',
        1,
        '2026-07-20 19:00:00',
        '2026-07-20 19:00:00',
        NULL
    ),
    (
        7,
        2,
        20,
        4,
        'Khóa tốt nhưng nên có thêm phụ đề tiếng Việt cho người mới.',
        1,
        '2026-07-20 20:00:00',
        '2026-07-20 20:00:00',
        NULL
    ),
    (
        8,
        3,
        25,
        5,
        'Cô Châu dạy phát âm chuẩn, dễ theo dõi với người Việt.',
        1,
        '2026-07-20 19:30:00',
        '2026-07-20 19:30:00',
        NULL
    ),
    (
        9,
        4,
        11,
        5,
        'Setup môi trường đầy đủ trong 30 phút, cứu cánh máy mới!',
        1,
        '2026-07-12 20:00:00',
        '2026-07-12 20:00:00',
        NULL
    ),
    (
        10,
        4,
        14,
        4,
        'Bài CORS rất dễ hiểu, có vẽ sơ đồ minh hoạ thì sẽ tuyệt.',
        1,
        '2026-07-08 21:00:00',
        '2026-07-08 21:00:00',
        NULL
    ),
    (
        11,
        5,
        11,
        4,
        'freeCodeCamp + Mosh combo hợp lý, học xong cảm thấy chắc tay JS.',
        1,
        '2026-07-14 20:00:00',
        '2026-07-14 20:00:00',
        NULL
    ),
    (
        12,
        5,
        14,
        5,
        'Quiz cuối kì bám sát nội dung, rất đáng học.',
        1,
        '2026-07-18 20:00:00',
        '2026-07-18 20:00:00',
        NULL
    ),
    (
        13,
        7,
        14,
        5,
        'System Design trên đời chưa thấy course nào đầy đủ thế này.',
        1,
        '2026-07-20 20:00:00',
        '2026-07-20 20:00:00',
        NULL
    ),
    (
        14,
        7,
        20,
        4,
        'Phần caching và CDN cực hữu ích, mong có thêm bài tập thực hành.',
        1,
        '2026-07-24 20:00:00',
        '2026-07-24 20:00:00',
        NULL
    ),
    (
        15,
        8,
        14,
        4,
        'Bài tree giải thích rõ, code mẫu hơi ngắn.',
        1,
        '2026-07-25 20:00:00',
        '2026-07-25 20:00:00',
        NULL
    ),
    (
        16,
        9,
        11,
        5,
        'Cô Linh truyền cảm hứng cho người mới học Python, list xài quá ngon!',
        1,
        '2026-07-09 20:00:00',
        '2026-07-09 20:00:00',
        NULL
    ),
    (
        17,
        9,
        16,
        4,
        'Quiz cuối hay, sẽ chờ tiếp tutorial về dict.',
        1,
        '2026-07-09 21:00:00',
        '2026-07-09 21:00:00',
        NULL
    ),
    (
        18,
        9,
        21,
        5,
        'Đúng cái mình cần để bứt phá Python, recommend.',
        1,
        '2026-07-11 20:00:00',
        '2026-07-11 20:00:00',
        NULL
    ),
    (
        19,
        9,
        25,
        5,
        'Học xong làm leetcode array dễ hơn nhiều!',
        1,
        '2026-07-22 20:00:00',
        '2026-07-22 20:00:00',
        NULL
    ),
    (
        20,
        10,
        19,
        5,
        'ML 101 cô đọng, giải thích pipeline rõ ràng.',
        1,
        '2026-07-10 19:00:00',
        '2026-07-10 19:00:00',
        NULL
    ),
    (
        21,
        10,
        21,
        4,
        'Mình cần thêm bài về cách chuẩn bị bộ dữ liệu, nhưng phần giới thiệu thì 10 điểm.',
        1,
        '2026-07-13 19:00:00',
        '2026-07-13 19:00:00',
        NULL
    ),
    (
        22,
        12,
        13,
        5,
        'Học Lightroom xong ảnh đẹp hẳn, cô giảng nguyên lý dễ hiểu.',
        1,
        '2026-07-15 20:00:00',
        '2026-07-15 20:00:00',
        NULL
    ),
    (
        23,
        12,
        19,
        5,
        'Cách tiếp cận khoa học, không lệ thuộc preset như khóa khác.',
        1,
        '2026-07-20 19:30:00',
        '2026-07-20 19:30:00',
        NULL
    ),
    (
        24,
        13,
        13,
        4,
        'Phần typography cực kỳ thực dụng, ví dụ phong phú.',
        1,
        '2026-07-16 19:00:00',
        '2026-07-16 19:00:00',
        NULL
    ),
    (
        25,
        14,
        13,
        5,
        'Hợp với người mới chụp ảnh, gọn nhẹ trong 90 phút.',
        1,
        '2026-07-07 19:00:00',
        '2026-07-07 19:00:00',
        NULL
    ),
    (
        26,
        14,
        15,
        5,
        'Học xong là đủ tự tin cầm máy ra phố chụp.',
        1,
        '2026-07-09 19:00:00',
        '2026-07-09 19:00:00',
        NULL
    ),
    (
        27,
        14,
        22,
        4,
        'Nội dung tốt, chỉ tiếc bài tập chụp thực hành chưa nhiều.',
        1,
        '2026-07-16 18:00:00',
        '2026-07-16 18:00:00',
        NULL
    ),
    (
        28,
        15,
        19,
        5,
        'Figma intensive trong vài tiếng nhưng đủ skill để làm landing page.',
        1,
        '2026-07-15 19:00:00',
        '2026-07-15 19:00:00',
        NULL
    ),
    (
        29,
        16,
        17,
        5,
        'Khóa Digital Marketing tổng quan rất bài bản, áp dụng được ngay vào shop nhỏ.',
        1,
        '2026-07-22 19:00:00',
        '2026-07-22 19:00:00',
        NULL
    ),
    (
        30,
        16,
        24,
        5,
        'Promotion 35 chiêu chính là cái mình cần.',
        1,
        '2026-07-19 19:30:00',
        '2026-07-19 19:30:00',
        NULL
    ),
    (
        31,
        17,
        24,
        4,
        'Copywriting trong 76 phút - rất dày kiến thức, cần xem lại nhiều lần.',
        1,
        '2026-07-22 19:30:00',
        '2026-07-22 19:30:00',
        NULL
    ),
    (
        32,
        18,
        24,
        5,
        'SEO 2026 update rất sát thị trường AI search.',
        1,
        '2026-07-25 19:30:00',
        '2026-07-25 19:30:00',
        NULL
    ),
    (
        33,
        20,
        18,
        5,
        'CapCut 1 tiếng là đủ để upload đều TikTok!',
        1,
        '2026-07-13 21:30:00',
        '2026-07-13 21:30:00',
        NULL
    ),
    (
        34,
        22,
        23,
        5,
        'Tư duy phản biện - thay đổi cách mình tiếp cận tranh luận trong công việc.',
        1,
        '2026-07-18 19:30:00',
        '2026-07-18 19:30:00',
        NULL
    ),
    (
        35,
        3,
        18,
        4,
        'Bài phát âm HSK 1 rõ ràng, nghe lại highlight rất tiện khi ôn từ vựng.',
        1,
        '2026-07-29 20:10:00',
        '2026-07-29 20:10:00',
        NULL
    ),
    (
        36,
        3,
        24,
        5,
        'Cách cô Châu chia nhóm chủ đề giúp mình nhớ hội thoại cơ bản nhanh hơn.',
        1,
        '2026-08-01 17:00:00',
        '2026-08-01 17:00:00',
        NULL
    );

-- ============================================================================
-- FEEDBACK_REACTIONS  (helpful/dislike on feedbacks)
-- ============================================================================
INSERT INTO
    feedback_reactions (
        feedback_id,
        user_id,
        reaction_type
    )
VALUES (1, 13, 'help_ful'),
    (1, 14, 'help_ful'),
    (1, 15, 'help_ful'),
    (2, 20, 'help_ful'),
    (3, 11, 'help_ful'),
    (3, 12, 'help_ful'),
    (4, 13, 'help_ful'),
    (5, 11, 'help_ful'),
    (6, 20, 'help_ful'),
    (9, 14, 'help_ful'),
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
-- CARTS (1 cart per student - we will only create for students with cart items)
-- ============================================================================
INSERT INTO
    carts (
        id,
        user_id,
        total_quantity,
        total_amount,
        created_at,
        updated_at
    )
VALUES (
        1,
        11,
        2,
        698000,
        '2026-07-20 10:00:00',
        '2026-07-20 10:00:00'
    ),
    (
        2,
        12,
        1,
        199000,
        '2026-07-21 10:00:00',
        '2026-07-21 10:00:00'
    ),
    (
        3,
        13,
        2,
        1098000,
        '2026-07-22 10:00:00',
        '2026-07-22 10:00:00'
    ),
    (
        4,
        15,
        1,
        249000,
        '2026-07-25 10:00:00',
        '2026-07-25 10:00:00'
    ),
    (
        5,
        17,
        2,
        398000,
        '2026-07-29 10:00:00',
        '2026-07-29 10:00:00'
    ),
    (
        6,
        21,
        1,
        349000,
        '2026-07-30 10:00:00',
        '2026-07-30 10:00:00'
    ),
    (
        7,
        23,
        1,
        249000,
        '2026-07-31 10:00:00',
        '2026-07-31 10:00:00'
    );

-- ============================================================================
-- CART_ITEMS  (items currently in those carts - not yet checked out)
-- ============================================================================
INSERT INTO
    cart_items (
        id,
        cart_id,
        course_id,
        saved_for_later,
        created_at,
        updated_at
    )
VALUES (
        1,
        1,
        10,
        0,
        '2026-07-20 10:00:00',
        '2026-07-20 10:00:00'
    ), -- ML
    (
        2,
        1,
        12,
        0,
        '2026-07-20 10:05:00',
        '2026-07-20 10:05:00'
    ), -- Lightroom
    (
        3,
        2,
        4,
        0,
        '2026-07-21 10:00:00',
        '2026-07-21 10:00:00'
    ), -- Setup môi trường
    (
        4,
        3,
        7,
        0,
        '2026-07-22 10:00:00',
        '2026-07-22 10:00:00'
    ), -- System Design
    (
        5,
        3,
        10,
        0,
        '2026-07-22 10:05:00',
        '2026-07-22 10:05:00'
    ), -- ML
    (
        6,
        4,
        21,
        0,
        '2026-07-25 10:00:00',
        '2026-07-25 10:00:00'
    ), -- Premiere Pro
    (
        7,
        5,
        21,
        0,
        '2026-07-29 10:00:00',
        '2026-07-29 10:00:00'
    ), -- Premiere Pro
    (
        8,
        5,
        22,
        0,
        '2026-07-29 10:05:00',
        '2026-07-29 10:05:00'
    ), -- Critical thinking
    (
        9,
        6,
        19,
        0,
        '2026-07-30 10:00:00',
        '2026-07-30 10:00:00'
    ), -- Power BI
    (
        10,
        7,
        21,
        0,
        '2026-07-31 10:00:00',
        '2026-07-31 10:00:00'
    );
-- Premiere Pro

-- ============================================================================
-- ============================================================================
-- NOTIFICATIONS (30 Strict Notifications matching Backend ENUMs & Frontend routes)
-- ============================================================================
INSERT INTO
    notifications (
        id,
        user_id,
        event_type,
        title,
        message,
        payload,
        is_read,
        source_type,
        source_id,
        created_at,
        updated_at
    )
VALUES (
        1,
        1,
        'course.publish.new_from_instructor',
        'Khóa học mới xuất bản chờ rà soát',
        'Giảng viên Trần Đăng Khoa vừa xuất bản khóa học Cài Đặt Môi Trường & CORS.',
        '{"courseId":4}',
        0,
        'course',
        4,
        '2026-07-28 09:00:00',
        '2026-07-28 09:00:00'
    ),
    (
        2,
        1,
        'discussion.reply.created',
        'Thảo luận bài học mới trên hệ thống',
        'Có thảo luận mới trong bài giảng System Design Production Infrastructure.',
        '{"courseId":7,"lessonId":17}',
        1,
        'discussion_post',
        17,
        '2026-07-29 11:15:00',
        '2026-07-29 11:15:00'
    ),
    (
        3,
        1,
        'course.publish.new_from_instructor',
        'Khóa học mới chờ phê duyệt',
        'Giảng viên Trần Đăng Khoa vừa gửi khóa Flutter & Dart để quản trị viên xét duyệt.',
        '{"courseId":25}',
        0,
        'course',
        25,
        '2026-07-25 08:50:00',
        '2026-07-25 08:50:00'
    ),
    (
        4,
        2,
        'course.change_request.approved',
        'Yêu cầu cập nhật khóa học đã được duyệt',
        'Yêu cầu đổi tên khóa TOEIC Grammar Mastery 2026 đã được quản trị viên phê duyệt.',
        '{"courseId":1,"requestId":1}',
        1,
        'course',
        1,
        '2026-07-29 16:10:00',
        '2026-07-29 16:10:00'
    ),
    (
        5,
        4,
        'course.change_request.approved',
        'Cập nhật khóa học thành công',
        'Yêu cầu bổ sung mô tả khóa JavaScript Toàn Tập đã được chấp thuận.',
        '{"courseId":5,"requestId":2}',
        0,
        'course',
        5,
        '2026-07-30 10:40:00',
        '2026-07-30 10:40:00'
    ),
    (
        6,
        5,
        'course.updated',
        'Khóa học System Design đã cập nhật nội dung',
        'Khóa học System Design Production Infrastructure vừa cập nhật nội dung về hạ tầng production.',
        '{"courseId":7}',
        1,
        'course',
        7,
        '2026-07-21 11:00:00',
        '2026-07-21 11:00:00'
    ),
    (
        7,
        8,
        'course.updated',
        'Khóa Digital Marketing cần bổ sung tài liệu',
        'Admin ghi chú khóa Digital Marketing cần bổ sung file tài liệu đính kèm trước khi gửi duyệt lại.',
        '{"courseId":16,"note":"Cần bổ sung file tài liệu đính kèm"}',
        0,
        'course',
        16,
        '2026-07-23 10:15:00',
        '2026-07-23 10:15:00'
    ),
    (
        8,
        4,
        'feed.comment.created',
        'Bình luận mới trên highlight HTML/CSS',
        'Học viên Bùi Trà My vừa bình luận trên video bài học HTML Tables của bạn.',
        '{"feedId":54,"commentId":12}',
        0,
        'feed',
        54,
        '2026-07-20 14:30:00',
        '2026-07-20 14:30:00'
    ),
    (
        9,
        2,
        'feed.like.created',
        'Highlight TOEIC có lượt thích mới',
        'Học viên Phan Minh Chi vừa thích video bài học ngắn TOEIC của bạn.',
        '{"feedId":13}',
        1,
        'feed',
        13,
        '2026-07-20 15:10:00',
        '2026-07-20 15:10:00'
    ),
    (
        10,
        9,
        'instructor.follow.new',
        'Lượt theo dõi giảng viên mới',
        'Học viên Đỗ Gia Phong đã nhấn theo dõi kênh giảng dạy CapCut & Premiere Pro của bạn.',
        '{"studentId":16}',
        0,
        'instructor_follow',
        16,
        '2026-07-25 09:40:00',
        '2026-07-25 09:40:00'
    ),
    (
        11,
        11,
        'course.updated',
        'Khóa học JavaScript có bài học mới',
        'Bài giảng mới về ES2015+ Async/Await vừa được cập nhật vào khóa học bạn đang tham gia.',
        '{"courseId":5,"lessonId":11}',
        0,
        'course',
        5,
        '2026-07-28 11:30:00',
        '2026-07-28 11:30:00'
    ),
    (
        12,
        12,
        'discussion.reply.created',
        'Giảng viên đã phản hồi câu hỏi của bạn',
        'Cô Lý Minh Châu đã trả lời thắc mắc của bạn về bài phát âm HSK 1.',
        '{"courseId":3,"lessonId":8}',
        1,
        'discussion_post',
        8,
        '2026-07-20 20:00:00',
        '2026-07-20 20:00:00'
    ),
    (
        13,
        13,
        'course.updated',
        'Khóa học SEO Mastery 2026 vừa cập nhật',
        'Bài học The Ultimate SEO Checklist for 2026 đã được bổ sung tài liệu thực hành.',
        '{"courseId":18,"lessonId":30}',
        0,
        'course',
        18,
        '2026-07-22 10:45:00',
        '2026-07-22 10:45:00'
    ),
    (
        14,
        14,
        'course.publish.new_from_instructor',
        'Khóa học mới từ Giảng viên Trần Đăng Khoa',
        'Giảng viên bạn theo dõi vừa ra mắt khóa học mới HTML, CSS & Node.js Full Stack Starter.',
        '{"courseId":6}',
        1,
        'course',
        6,
        '2026-07-15 10:00:00',
        '2026-07-15 10:00:00'
    ),
    (
        15,
        13,
        'feed.comment.reply',
        'Giảng viên đã trả lời bình luận của bạn',
        'Giảng viên đã trả lời bình luận của bạn trên highlight bài học.',
        '{"feedId":14,"commentId":61,"originCommentId":2}',
        0,
        'feed_comment',
        61,
        '2026-07-07 14:45:00',
        '2026-07-07 14:45:00'
    ),
    (
        16,
        18,
        'lecturer_request.approved',
        'Hồ sơ Nâng cấp Giảng viên đã được Duyệt',
        'Chúc mừng bạn! Yêu cầu trở thành giảng viên của bạn đã được Admin chấp thuận.',
        '{"requestId":1}',
        0,
        'lecturer_request',
        1,
        '2026-07-05 10:15:00',
        '2026-07-05 10:15:00'
    ),
    (
        17,
        19,
        'lecturer_request.rejected',
        'Thông báo về hồ sơ Đăng ký Giảng viên',
        'Hồ sơ nâng cấp giảng viên của bạn cần bổ sung thêm minh chứng giảng dạy trước khi duyệt.',
        '{"requestId":2}',
        1,
        'lecturer_request',
        2,
        '2026-07-11 16:40:00',
        '2026-07-11 16:40:00'
    ),
    (
        18,
        21,
        'lecturer_request.approved',
        'Hồ sơ Nâng cấp Giảng viên đã được Duyệt',
        'Tài khoản của bạn đã được nâng cấp lên vai trò Giảng viên thành công.',
        '{"requestId":5}',
        1,
        'lecturer_request',
        5,
        '2026-07-16 09:00:00',
        '2026-07-16 09:00:00'
    ),
    (
        19,
        20,
        'course.updated',
        'Nội dung bài học TOEIC vừa cập nhật',
        'Bài tập thực hành Participles đã được bổ sung thêm đáp án chi tiết.',
        '{"courseId":1,"lessonId":4}',
        0,
        'course',
        1,
        '2026-07-22 14:00:00',
        '2026-07-22 14:00:00'
    ),
    (
        20,
        22,
        'course.publish.new_from_instructor',
        'Khóa học mới từ Giảng viên Lê Quang Quân',
        'Khóa học Premiere Pro Cho Người Mới vừa mở đăng ký.',
        '{"courseId":21}',
        0,
        'course',
        21,
        '2026-07-27 11:20:00',
        '2026-07-27 11:20:00'
    ),
    (
        21,
        23,
        'discussion.reply.created',
        'Bạn có câu trả lời mới trong thảo luận',
        'Bạn có câu trả lời mới trong thảo luận bài học Project Management Fundamentals.',
        '{"courseId":23,"lessonId":35}',
        0,
        'discussion_post',
        35,
        '2026-07-29 09:00:00',
        '2026-07-29 09:00:00'
    ),
    (
        22,
        2,
        'feed.like.created',
        'Highlight TOEIC có lượt thích mới',
        'Video bài học ngắn TOEIC của bạn nhận được một lượt thả tim mới.',
        '{"feedId":12}',
        1,
        'feed',
        12,
        '2026-07-29 11:20:00',
        '2026-07-29 11:20:00'
    ),
    (
        23,
        15,
        'course.updated',
        'Khóa học UI/UX có bài học mới',
        'Khóa học UI/UX Design vừa được cập nhật bài tập thực hành Figma.',
        '{"courseId":15,"lessonId":26}',
        1,
        'course',
        15,
        '2026-07-30 14:00:00',
        '2026-07-30 14:00:00'
    ),
    (
        24,
        21,
        'feed.comment.reply',
        'Giảng viên đã phản hồi bình luận của bạn',
        'Giảng viên đã phản hồi bình luận của bạn trên highlight HTML Tables.',
        '{"feedId":46,"commentId":65,"originCommentId":10}',
        0,
        'feed_comment',
        65,
        '2026-07-30 08:40:00',
        '2026-07-30 08:40:00'
    ),
    (
        25,
        17,
        'course.updated',
        'Bài học Digital Marketing được cập nhật',
        'Nội dung bài học Google Ads đã được tối ưu.',
        '{"courseId":17,"lessonId":29}',
        0,
        'course',
        17,
        '2026-07-31 08:45:00',
        '2026-07-31 08:45:00'
    ),
    (
        26,
        11,
        'instructor.follow.new',
        'Thông báo giảng viên mới',
        'Giảng viên Trần Đăng Khoa đã cập nhật danh sách bài giảng mới.',
        '{"studentId":11}',
        1,
        'instructor_follow',
        11,
        '2026-07-31 10:00:00',
        '2026-07-31 10:00:00'
    ),
    (
        27,
        12,
        'course.updated',
        'Bài học SEO vừa cập nhật',
        'Bài học The Ultimate SEO Checklist for 2026 đã được cập nhật ví dụ mới.',
        '{"courseId":18,"lessonId":30}',
        0,
        'course',
        18,
        '2026-07-31 15:30:00',
        '2026-07-31 15:30:00'
    ),
    (
        28,
        2,
        'feed.like.created',
        'Highlight TOEIC có lượt thích mới',
        'Video bài học ngắn TOEIC của bạn nhận được 1 lượt thả tim mới.',
        '{"feedId":18}',
        0,
        'feed',
        18,
        '2026-08-01 09:10:00',
        '2026-08-01 09:10:00'
    ),
    (
        29,
        14,
        'discussion.reply.created',
        'Giảng viên đã trả lời câu hỏi của bạn',
        'Giảng viên đã trả lời câu hỏi bài học Basic English Conversation của bạn.',
        '{"courseId":2,"lessonId":6}',
        0,
        'discussion_post',
        6,
        '2026-08-01 13:45:00',
        '2026-08-01 13:45:00'
    ),
    (
        30,
        15,
        'course.updated',
        'Cập nhật tài liệu khóa System Design',
        'Tài liệu tổng quan kiến trúc hệ thống đã được cập nhật.',
        '{"courseId":7,"lessonId":17}',
        0,
        'course',
        7,
        '2026-08-01 14:00:00',
        '2026-08-01 14:00:00'
    );

-- ============================================================================
-- REPORTS (Content & User Reports queue for Admin)
-- ============================================================================
INSERT INTO
    reports (
        id,
        target_type,
        target_id,
        report_category,
        reason,
        evidence_image_ids,
        status,
        reporter_id,
        approver_id,
        review_note,
        reviewed_at,
        created_at,
        updated_at
    )
VALUES (
        1,
        'course',
        10,
        'misleading',
        'Tên khóa và mô tả Machine Learning ghi hướng đến người mới, nhưng level đang để Intermediate; cần giảng viên làm rõ tiên quyết và độ khó.',
        '[13]',
        'approved',
        17,
        1,
        'Đã yêu cầu giảng viên cập nhật mô tả, tiên quyết và độ khó để tránh gây hiểu nhầm.',
        '2026-07-05 09:30:00',
        '2026-07-04 08:30:00',
        '2026-07-05 09:30:00'
    ),
    (
        2,
        'course',
        5,
        'misleading',
        'Khóa JavaScript ghi Từ Zero Đến Hero nhưng level đang là Intermediate; người học mới có thể hiểu nhầm về mức độ đầu vào.',
        '[14]',
        'approved',
        16,
        1,
        'Đã yêu cầu bổ sung mục kiến thức nền tảng và điều chỉnh thông điệp cho đúng level.',
        '2026-06-28 09:00:00',
        '2026-06-27 14:00:00',
        '2026-06-28 09:00:00'
    ),
    (
        3,
        'lesson',
        11,
        'copyright',
        'Lesson JavaScript Full Course ghi nguồn freeCodeCamp; cần đối chiếu quyền sử dụng video/tài nguyên trước khi hiển thị trong khóa có phí.',
        '[15]',
        'pending',
        18,
        NULL,
        NULL,
        NULL,
        '2026-07-25 08:00:00',
        '2026-07-25 08:00:00'
    ),
    (
        4,
        'teacher',
        8,
        'other',
        'Hồ sơ giảng viên Marketing hiện trong course section còn thiếu thông tin kinh nghiệm/chứng chỉ để đối chiếu với nội dung khóa đang bán.',
        '[16]',
        'pending',
        24,
        NULL,
        NULL,
        NULL,
        '2026-07-26 10:00:00',
        '2026-07-26 10:00:00'
    ),
    (
        5,
        'course',
        19,
        'other',
        'Trang khóa Power BI chưa thể hiện rõ dataset thực hành và tài liệu kèm theo, trong khi mô tả nhấn mạnh data model và dashboard.',
        '[17]',
        'pending',
        21,
        NULL,
        NULL,
        NULL,
        '2026-07-27 09:00:00',
        '2026-07-27 09:00:00'
    ),
    (
        6,
        'course',
        15,
        'copyright',
        'Khóa Figma có nội dung demo/prototype cần bổ sung nguồn hoặc xác nhận tài nguyên tự tạo trước khi tiếp tục quảng bá.',
        '[34]',
        'approved',
        11,
        1,
        'Đã yêu cầu giảng viên bổ sung nguồn asset và ghi chú quyền sử dụng trong nội dung khóa.',
        '2026-07-29 09:10:00',
        '2026-07-28 10:20:00',
        '2026-07-29 09:10:00'
    ),
    (
        7,
        'course',
        6,
        'misleading',
        'Trang khóa Full Stack ghi một path duy nhất từ HTML/CSS sang Node.js, cần làm rõ phạm vi backend và thời lượng học để tránh hiểu nhầm.',
        '[35]',
        'approved',
        12,
        1,
        'Đã yêu cầu chỉnh lại mô tả phạm vi khóa học và thêm outline chi tiết.',
        '2026-07-29 11:30:00',
        '2026-07-28 15:15:00',
        '2026-07-29 11:30:00'
    ),
    (
        8,
        'teacher',
        7,
        'other',
        'Người học report profile giảng viên Design vì phần giới thiệu chưa đủ thông tin về kinh nghiệm dạy Figma/Auto Layout.',
        '[36]',
        'pending',
        13,
        NULL,
        NULL,
        NULL,
        '2026-07-29 08:25:00',
        '2026-07-29 08:25:00'
    ),
    (
        9,
        'lesson',
        4,
        'misleading',
        'Lesson TOEIC Participles cần bổ sung mục tiêu và ví dụ minh họa rõ hơn; ảnh evidence chụp đúng lesson đang bị report.',
        '[37]',
        'pending',
        14,
        NULL,
        NULL,
        NULL,
        '2026-07-29 13:50:00',
        '2026-07-29 13:50:00'
    ),
    (
        10,
        'course',
        6,
        'other',
        'Course detail Full Stack cần bổ sung thông tin tài nguyên thực hành và yêu cầu môi trường cài đặt trước khi học.',
        '[38]',
        'approved',
        15,
        1,
        'Đã ghi nhận là yêu cầu cải thiện thông tin khóa học, không phải vi phạm nghiêm trọng.',
        '2026-07-30 12:00:00',
        '2026-07-30 09:05:00',
        '2026-07-30 12:00:00'
    ),
    (
        11,
        'course',
        20,
        'misleading',
        'Khóa CapCut ghi Học trong 1 giờ, cần đối chiếu với kết quả đầu ra và phạm vi nội dung để tránh quảng cáo quá mức.',
        '[39]',
        'rejected',
        20,
        1,
        'Chưa đủ căn cứ xử lý report; giữ lại như feedback về cách đặt tiêu đề khóa học.',
        '2026-07-31 09:20:00',
        '2026-07-30 14:30:00',
        '2026-07-31 09:20:00'
    ),
    (
        12,
        'lesson',
        30,
        'other',
        'Lesson SEO checklist cần thêm link tài liệu hoặc file thực hành vì người học không thấy tài nguyên kèm theo trong trang học.',
        '[40]',
        'pending',
        22,
        NULL,
        NULL,
        NULL,
        '2026-07-31 10:10:00',
        '2026-07-31 10:10:00'
    ),
    (
        13,
        'teacher',
        9,
        'other',
        'Profile giảng viên Video/CapCut trong trang khóa học còn ngắn, cần bổ sung kinh nghiệm sản xuất video hoặc portfolio mẫu.',
        '[41]',
        'rejected',
        23,
        1,
        'Đây là feedback hồ sơ giảng viên, chưa phải report vi phạm nên không xử lý khóa học.',
        '2026-07-31 15:30:00',
        '2026-07-31 11:40:00',
        '2026-07-31 15:30:00'
    ),
    (
        14,
        'lesson',
        34,
        'inappropriate',
        'Lesson Tư duy phản biện cần admin xem lại ví dụ nội dung trong video/seminar có thể không phù hợp với nhóm học sinh nhỏ tuổi.',
        '[42]',
        'pending',
        24,
        NULL,
        NULL,
        NULL,
        '2026-08-01 08:35:00',
        '2026-08-01 08:35:00'
    ),
    (
        15,
        'course',
        23,
        'misleading',
        'Khóa Project Management 101 cần làm rõ kết quả đầu ra và công cụ sử dụng; mô tả hiện tại quá rộng so với course beginner giá thấp.',
        '[43]',
        'pending',
        25,
        NULL,
        NULL,
        NULL,
        '2026-08-01 13:15:00',
        '2026-08-01 13:15:00'
    );

-- ============================================================================
-- COURSE CHANGE REQUESTS (Teacher updates queue for Admin approval)
-- ============================================================================
INSERT INTO
    course_change_requests (
        id,
        course_id,
        requested_by,
        kind,
        target_id,
        status,
        payload,
        prev_data,
        reviewed_by,
        review_note,
        created_at,
        updated_at
    )
VALUES (
        1,
        1,
        2,
        'course.update',
        NULL,
        'approved',
        '{"name":"TOEIC Grammar Mastery 2026","price":399000}',
        '{"name":"TOEIC Grammar Mastery","price":399000}',
        1,
        'Đã duyệt cập nhật tên khóa học cho phù hợp demo 2026.',
        '2026-07-29 14:00:00',
        '2026-07-29 16:00:00'
    ),
    (
        2,
        5,
        4,
        'course.update',
        NULL,
        'approved',
        '{"description":"Học JavaScript từ nền tảng đến nâng cao: ES2015+, Closure, Async/Await, Event Loop và DOM manipulation."}',
        '{"description":"Khóa JavaScript từ nền tảng đến nâng cao."}',
        1,
        'Đã duyệt nội dung bổ sung, không thay đổi giá khóa học.',
        '2026-07-30 09:00:00',
        '2026-07-30 10:30:00'
    ),
    (
        3,
        15,
        7,
        'course.update',
        NULL,
        'approved',
        '{"name":"Figma Crash Course - Auto Layout & Prototype"}',
        '{"name":"Figma Crash Course 2024 - FULL"}',
        1,
        'Đã duyệt đổi tên, bỏ mốc năm cũ.',
        '2026-07-30 13:20:00',
        '2026-07-30 15:00:00'
    ),
    (
        4,
        8,
        5,
        'course.update',
        NULL,
        'rejected',
        '{"price":399000}',
        '{"price":299000}',
        1,
        'Chưa đủ căn cứ tăng giá: nội dung khóa học chưa được cập nhật thêm so với lần duyệt trước.',
        '2026-07-31 09:30:00',
        '2026-07-31 11:00:00'
    ),
    (
        5,
        12,
        7,
        'course.update',
        NULL,
        'pending',
        '{"description":"Hậu kỳ ảnh trong Lightroom Classic - hiểu nguyên lý sâu hơn so với preset, bổ sung 2 bài thực hành màu da và phong cảnh.","price":349000}',
        '{"description":"Hậu kỳ ảnh trong Lightroom Classic - hiểu nguyên lý sâu hơn so với preset.","price":299000}',
        NULL,
        NULL,
        '2026-08-01 08:45:00',
        '2026-08-01 08:45:00'
    ),
    (
        6,
        20,
        9,
        'course.update',
        NULL,
        'pending',
        '{"name":"Học CapCut Trong 1 Giờ - Bản Cập Nhật 2026","price":249000}',
        '{"name":"Học CapCut Trong 1 Giờ","price":199000}',
        NULL,
        NULL,
        '2026-08-01 10:10:00',
        '2026-08-01 10:10:00'
    );

-- LECTURER UPGRADE REQUESTS (admin review queue)
-- ============================================================================
INSERT INTO
    lecturer_upgrade_requests (
        id,
        user_id,
        confirm,
        teaching_topics,
        evidence_image_ids,
        status,
        reviewer_id,
        review_note,
        reviewed_at,
        created_at,
        updated_at
    )
VALUES (
        1,
        18,
        'Tôi có ba năm kinh nghiệm trợ giảng tiếng Anh và đã chuẩn bị đề cương phát âm cho người mới bắt đầu. Tôi từng trợ giảng cho các lớp phát âm tại một trung tâm Anh ngữ ở Hà Nội, chuyên hỗ trợ học viên mất gốc luyện âm IPA và ngữ điệu câu. Lộ trình tôi xây dựng gồm 8 buổi, mỗi buổi có bài tập nghe – nhại và hướng dẫn khẩu hình cụ thể. Tôi cũng đã hoàn thành khóa nghiệp vụ sư phạm tiếng Anh để trang bị thêm phương pháp giảng dạy bài bản.',
        'English pronunciation, beginner speaking',
        '[8,9]',
        'approved',
        1,
        'Hồ sơ rõ ràng, minh chứng phù hợp và đề cương khóa học đạt tiêu chuẩn nền tảng.',
        '2026-07-05 10:15:00',
        '2026-07-03 14:20:00',
        '2026-07-05 10:15:00'
    ),
    (
        2,
        19,
        'Tôi muốn chia sẻ phương pháp ghi chú và học nhóm đã áp dụng trong các lớp đại học. Trong 2 năm học đại học, tôi từng tổ chức nhóm học 5-6 người ôn thi giữa kỳ bằng phương pháp Cornell Notes và sơ đồ tư duy, giúp cả nhóm cải thiện điểm số rõ rệt. Tôi mong muốn đóng gói lại kinh nghiệm này thành một khóa học ngắn cho sinh viên năm nhất mới vào trường.',
        'Study skills, note taking, group learning',
        '[]',
        'rejected',
        1,
        'Cần bổ sung minh chứng giảng dạy hoặc đề cương khóa học chi tiết hơn trước khi duyệt.',
        '2026-07-11 16:40:00',
        '2026-07-10 09:30:00',
        '2026-07-11 16:40:00'
    ),
    (
        3,
        23,
        'Tôi đang chuẩn bị khóa Excel nhập môn cho sinh viên năm nhất, đã có đề cương và video mẫu. Tôi hiện làm trợ lý hành chính và sử dụng Excel xử lý báo cáo hàng ngày, từ hàm cơ bản đến bảng tổng hợp Pivot Table. Đề cương tôi xây dựng chia thành 6 buổi, đi từ thao tác nhập liệu, công thức tính toán đến cách trình bày bảng biểu chuyên nghiệp. Tôi muốn giúp các bạn sinh viên năm nhất tự tin làm báo cáo ngay từ những môn học đầu tiên.',
        'Excel basics, spreadsheet productivity',
        '[10]',
        'pending',
        NULL,
        NULL,
        NULL,
        '2026-07-28 08:45:00',
        '2026-07-28 08:45:00'
    ),
    (
        4,
        24,
        'Tôi có 4 năm kinh nghiệm làm UI/UX Designer tại công ty công nghệ và mong muốn chia sẻ quy trình thiết kế Figma chuyên nghiệp. Trong công việc, tôi phụ trách thiết kế giao diện cho các ứng dụng di động từ giai đoạn wireframe đến prototype tương tác. Tôi từng dẫn dắt vài dự án từ bước nghiên cứu người dùng đến khi bàn giao thiết kế cho lập trình viên. Tôi muốn hướng dẫn học viên mới bắt đầu làm quen với Figma theo đúng quy trình thực tế mà các công ty đang áp dụng.',
        'UI/UX design, Figma prototyping',
        '[11]',
        'pending',
        NULL,
        NULL,
        NULL,
        '2026-07-30 11:20:00',
        '2026-07-30 11:20:00'
    ),
    (
        5,
        21,
        'Tôi từng giảng dạy lập trình Mobile Flutter và đã hoàn thành giáo trình bài giảng ngắn gọn. Tôi từng hướng dẫn một nhóm sinh viên thực tập xây dựng ứng dụng quản lý chi tiêu bằng Flutter trong 6 tuần, từ dựng giao diện đến kết nối API. Giáo trình tôi xây dựng được chia theo từng buổi, mỗi buổi có bài tập thực hành nhỏ để học viên áp dụng ngay kiến thức vừa học.',
        'Flutter mobile development',
        '[12]',
        'approved',
        1,
        'Kinh nghiệm thực tế tốt, minh chứng video bài học ngắn sắc nét.',
        '2026-07-16 09:00:00',
        '2026-07-14 15:10:00',
        '2026-07-16 09:00:00'
    ),
    (
        6,
        12,
        'Tôi đã thiết kế chương trình luyện nghe nói tiếng Anh cho lớp 20 học viên và có video dạy thử cùng rubric đánh giá. Tôi từng dạy kèm nhóm luyện thi IELTS Speaking tại nhà, tập trung vào cách triển khai ý tưởng và sửa lỗi phát âm cho từng học viên. Rubric đánh giá tôi xây dựng dựa theo 4 tiêu chí chấm điểm IELTS Speaking chính thức để học viên dễ hình dung điểm mạnh, điểm yếu của mình.',
        'English communication, IELTS speaking, pronunciation coaching',
        '[18,19]',
        'pending',
        NULL,
        NULL,
        NULL,
        '2026-07-18 09:10:00',
        '2026-07-18 09:10:00'
    ),
    (
        7,
        13,
        'Tôi có kinh nghiệm làm data analyst và muốn mở lớp SQL cho người mới, kèm bài tập truy vấn và dashboard mẫu. Công việc hiện tại của tôi là viết truy vấn SQL và xây dựng dashboard báo cáo doanh số hàng tuần cho bộ phận kinh doanh. Tôi cũng vừa hoàn thành một khóa phân tích dữ liệu nâng cao để cập nhật thêm kiến thức trước khi nộp hồ sơ. Bài tập tôi chuẩn bị đi từ câu lệnh SELECT cơ bản đến JOIN nhiều bảng và tổng hợp dữ liệu cho dashboard thực tế.',
        'SQL foundations, data analysis, dashboard practice',
        '[20,21]',
        'approved',
        1,
        'Hồ sơ đầy đủ, minh chứng chứng chỉ và đề cương bài tập rõ ràng.',
        '2026-07-20 09:00:00',
        '2026-07-19 13:30:00',
        '2026-07-20 09:00:00'
    ),
    (
        8,
        14,
        'Tôi từng làm product designer, có portfolio case study và prototype Figma cho quy trình research đến handoff. Tôi từng tham gia một dự án từ giai đoạn phỏng vấn người dùng, vẽ luồng thao tác đến thiết kế chi tiết. Tôi cũng thường xuyên review prototype cùng đội lập trình và chú thích rõ specs khi bàn giao thiết kế. Tôi muốn chia sẻ lại đúng quy trình làm việc thực tế này cho những bạn mới bắt đầu với UI/UX.',
        'Product design, UX research, Figma handoff',
        '[22,23]',
        'pending',
        NULL,
        NULL,
        NULL,
        '2026-07-20 10:05:00',
        '2026-07-20 10:05:00'
    ),
    (
        9,
        15,
        'Tôi muốn dạy Docker và CI cơ bản dựa trên workshop nội bộ đã tổ chức, gồm slide, lab và checklist chấm bài. Trước đây tôi từng tổ chức một buổi workshop nội bộ chia sẻ cách đóng gói ứng dụng bằng Docker và thiết lập pipeline CI đơn giản cho đồng nghiệp mới. Buổi chia sẻ đó nhận được phản hồi tích cực nên tôi muốn phát triển thành một khóa học bài bản hơn. Nội dung tôi chuẩn bị chia thành các lab thực hành từ viết Dockerfile cơ bản đến cấu hình pipeline tự động build và test.',
        'Docker basics, CI pipeline, DevOps lab',
        '[24,25]',
        'approved',
        1,
        'Minh chứng workshop và syllabus đáp ứng yêu cầu mở khóa thực hành.',
        '2026-07-22 10:00:00',
        '2026-07-21 08:40:00',
        '2026-07-22 10:00:00'
    ),
    (
        10,
        16,
        'Tôi đã huấn luyện IELTS speaking cho nhóm sinh viên và có feedback mẫu, nhưng chưa có đề cương học phần hoàn chỉnh. Tôi từng kèm 1-1 cho vài người bạn ôn thi IELTS Speaking, chủ yếu góp ý qua các bản ghi âm luyện nói của họ. Tôi có thói quen viết nhận xét chi tiết cho từng học viên sau mỗi buổi luyện nói. Tôi biết phần đề cương và tiêu chí chấm điểm của mình chưa đầy đủ nên sẽ bổ sung thêm nếu được admin góp ý cụ thể hơn.',
        'IELTS speaking, feedback coaching',
        '[26,27]',
        'rejected',
        1,
        'Cần bổ sung đề cương khóa học và quy định chấm điểm trước khi mở quyền giảng viên.',
        '2026-07-23 15:00:00',
        '2026-07-22 15:20:00',
        '2026-07-23 15:00:00'
    ),
    (
        11,
        20,
        'Tôi đang xây dựng khóa nhập môn an toàn thông tin với lab thực hành phòng thủ và checklist đạo đức nghề nghiệp. Tôi tự học và thực hành an toàn thông tin qua các phòng lab ảo hợp pháp, tập trung vào kỹ năng phòng thủ hệ thống thay vì tấn công. Checklist đạo đức nghề nghiệp tôi xây dựng nhằm nhắc học viên chỉ thực hành trên môi trường được cấp phép, tránh vi phạm pháp luật.',
        'Cybersecurity fundamentals, safe lab practice',
        '[28,29]',
        'pending',
        NULL,
        NULL,
        NULL,
        '2026-07-23 11:25:00',
        '2026-07-23 11:25:00'
    ),
    (
        12,
        22,
        'Tôi có portfolio các chiến dịch content marketing và muốn dạy lập kế hoạch nội dung theo tháng cho sinh viên. Tôi từng lên kế hoạch và theo dõi số liệu tương tác cho một vài chiến dịch của khách hàng nhỏ. Tôi có thói quen phân bổ chủ đề bài đăng theo tuần, cân đối giữa nội dung bán hàng và nội dung tương tác. Tôi muốn hướng dẫn học viên cách lập kế hoạch nội dung có mục tiêu rõ ràng thay vì đăng bài ngẫu hứng.',
        'Content marketing, campaign planning, analytics',
        '[30,31]',
        'approved',
        1,
        'Portfolio và lịch nội dung mẫu rõ ràng, phù hợp nhóm khóa marketing.',
        '2026-07-25 09:30:00',
        '2026-07-24 16:00:00',
        '2026-07-25 09:30:00'
    ),
    (
        13,
        25,
        'Tôi đã chuẩn bị notebook Python và rubric chấm bài cho khóa tự động hóa báo cáo bằng pandas. Công việc hiện tại của tôi có phần tự động hóa tổng hợp báo cáo Excel bằng Python và thư viện pandas, giúp giảm đáng kể thời gian làm thủ công mỗi tuần. Tôi thiết kế bài thực hành đi từ đọc dữ liệu, xử lý đến xuất báo cáo để học viên dễ hình dung quy trình. Rubric chấm bài tôi xây dựng theo từng bước: đọc dữ liệu đúng, xử lý đúng logic và trình bày báo cáo rõ ràng.',
        'Python automation, pandas reporting, notebook workflow',
        '[32,33]',
        'pending',
        NULL,
        NULL,
        NULL,
        '2026-07-31 09:35:00',
        '2026-07-31 09:35:00'
    );

-- ============================================================================
-- TRANSACTIONS (PayOS orders - paid / pending / failed)
-- ============================================================================
INSERT INTO
    transactions (
        id,
        user_id,
        total_amount,
        status,
        provider,
        provider_order_id,
        created_at,
        paid_at
    )
VALUES (
        1,
        11,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1001',
        '2026-01-06 09:55:00',
        '2026-01-06 09:57:00'
    ),
    (
        2,
        12,
        348000,
        'paid',
        'payos',
        'PAYOS-2026-1002',
        '2026-01-13 10:20:00',
        '2026-01-13 10:22:00'
    ),
    (
        3,
        13,
        598000,
        'paid',
        'payos',
        'PAYOS-2026-1003',
        '2026-01-21 14:35:00',
        '2026-01-21 14:38:00'
    ),
    (
        4,
        14,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1004',
        '2026-01-28 16:10:00',
        '2026-01-28 16:12:00'
    ),
    (
        5,
        15,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1005',
        '2026-02-04 08:45:00',
        '2026-02-04 08:47:00'
    ),
    (
        6,
        16,
        648000,
        'paid',
        'payos',
        'PAYOS-2026-1006',
        '2026-02-11 15:10:00',
        '2026-02-11 15:13:00'
    ),
    (
        7,
        17,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1007',
        '2026-02-18 11:20:00',
        '2026-02-18 11:22:00'
    ),
    (
        8,
        18,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1008',
        '2026-02-24 19:05:00',
        '2026-02-24 19:07:00'
    ),
    (
        9,
        19,
        448000,
        'paid',
        'payos',
        'PAYOS-2026-1009',
        '2026-03-03 09:15:00',
        '2026-03-03 09:18:00'
    ),
    (
        10,
        20,
        548000,
        'paid',
        'payos',
        'PAYOS-2026-1010',
        '2026-03-12 11:40:00',
        '2026-03-12 11:42:00'
    ),
    (
        11,
        21,
        699000,
        'paid',
        'payos',
        'PAYOS-2026-1011',
        '2026-03-19 14:50:00',
        '2026-03-19 14:52:00'
    ),
    (
        12,
        22,
        498000,
        'paid',
        'payos',
        'PAYOS-2026-1012',
        '2026-03-25 16:30:00',
        '2026-03-25 16:33:00'
    ),
    (
        13,
        23,
        448000,
        'paid',
        'payos',
        'PAYOS-2026-1013',
        '2026-04-02 10:15:00',
        '2026-04-02 10:17:00'
    ),
    (
        14,
        24,
        878000,
        'paid',
        'payos',
        'PAYOS-2026-1014',
        '2026-04-09 13:25:00',
        '2026-04-09 13:28:00'
    ),
    (
        15,
        25,
        249000,
        'paid',
        'payos',
        'PAYOS-2026-1015',
        '2026-04-18 20:10:00',
        '2026-04-18 20:12:00'
    ),
    (
        16,
        11,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1016',
        '2026-04-26 15:40:00',
        '2026-04-26 15:43:00'
    ),
    (
        17,
        12,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1017',
        '2026-05-05 09:50:00',
        '2026-05-05 09:53:00'
    ),
    (
        18,
        13,
        548000,
        'paid',
        'payos',
        'PAYOS-2026-1018',
        '2026-05-14 12:20:00',
        '2026-05-14 12:22:00'
    ),
    (
        19,
        14,
        748000,
        'paid',
        'payos',
        'PAYOS-2026-1019',
        '2026-05-21 16:15:00',
        '2026-05-21 16:18:00'
    ),
    (
        20,
        15,
        699000,
        'paid',
        'payos',
        'PAYOS-2026-1020',
        '2026-05-27 18:45:00',
        '2026-05-27 18:49:00'
    ),
    (
        21,
        16,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1021',
        '2026-06-03 08:35:00',
        '2026-06-03 08:37:00'
    ),
    (
        22,
        17,
        648000,
        'paid',
        'payos',
        'PAYOS-2026-1022',
        '2026-06-10 10:55:00',
        '2026-06-10 10:58:00'
    ),
    (
        23,
        18,
        1098000,
        'paid',
        'payos',
        'PAYOS-2026-1023',
        '2026-06-19 14:05:00',
        '2026-06-19 14:08:00'
    ),
    (
        24,
        19,
        448000,
        'paid',
        'payos',
        'PAYOS-2026-1024',
        '2026-06-25 17:25:00',
        '2026-06-25 17:28:00'
    ),
    (
        25,
        20,
        748000,
        'paid',
        'payos',
        'PAYOS-2026-1025',
        '2026-07-02 09:05:00',
        '2026-07-02 09:08:00'
    ),
    (
        26,
        21,
        698000,
        'paid',
        'payos',
        'PAYOS-2026-1026',
        '2026-07-08 11:30:00',
        '2026-07-08 11:33:00'
    ),
    (
        27,
        22,
        1097000,
        'paid',
        'payos',
        'PAYOS-2026-1027',
        '2026-07-14 15:40:00',
        '2026-07-14 15:43:00'
    ),
    (
        28,
        23,
        998000,
        'paid',
        'payos',
        'PAYOS-2026-1028',
        '2026-07-21 19:15:00',
        '2026-07-21 19:17:00'
    ),
    (
        29,
        24,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1029',
        '2026-07-24 09:10:00',
        '2026-07-24 09:12:00'
    ),
    (
        30,
        25,
        548000,
        'paid',
        'payos',
        'PAYOS-2026-1030',
        '2026-07-25 10:30:00',
        '2026-07-25 10:32:00'
    ),
    (
        31,
        11,
        748000,
        'paid',
        'payos',
        'PAYOS-2026-1031',
        '2026-07-26 14:20:00',
        '2026-07-26 14:23:00'
    ),
    (
        32,
        12,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1032',
        '2026-07-27 20:05:00',
        '2026-07-27 20:07:00'
    ),
    (
        33,
        13,
        848000,
        'paid',
        'payos',
        'PAYOS-2026-1033',
        '2026-07-31 19:25:00',
        '2026-07-31 19:28:00'
    ),
    (
        34,
        14,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1034',
        '2026-08-01 08:20:00',
        '2026-08-01 08:22:00'
    ),
    (
        35,
        15,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1035',
        '2026-08-01 09:45:00',
        '2026-08-01 09:47:00'
    ),
    (
        36,
        16,
        249000,
        'paid',
        'payos',
        'PAYOS-2026-1036',
        '2026-08-01 10:35:00',
        '2026-08-01 10:37:00'
    ),
    (
        37,
        17,
        349000,
        'paid',
        'payos',
        'PAYOS-2026-1037',
        '2026-08-01 13:10:00',
        '2026-08-01 13:12:00'
    ),
    (
        38,
        18,
        748000,
        'paid',
        'payos',
        'PAYOS-2026-1038',
        '2026-08-01 15:30:00',
        '2026-08-01 15:33:00'
    ),
    (
        39,
        19,
        499000,
        'failed',
        'payos',
        'PAYOS-2026-1039',
        '2026-07-20 17:05:00',
        NULL
    ),
    (
        40,
        20,
        299000,
        'failed',
        'payos',
        'PAYOS-2026-1040',
        '2026-07-21 18:25:00',
        NULL
    ),
    -- Backfilled successful orders: realistic monthly growth and dense recent daily data.
    (
        41,
        13,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1041',
        '2025-12-31 18:42:00',
        '2025-12-31 18:44:00'
    ),
    (
        42,
        19,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1042',
        '2026-01-09 09:18:00',
        '2026-01-09 09:21:00'
    ),
    (
        43,
        25,
        498000,
        'paid',
        'payos',
        'PAYOS-2026-1043',
        '2026-01-17 20:06:00',
        '2026-01-17 20:10:00'
    ),
    (
        44,
        15,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1044',
        '2026-01-24 10:34:00',
        '2026-01-24 10:39:00'
    ),
    (
        45,
        22,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1045',
        '2026-01-30 14:27:00',
        '2026-01-30 14:29:00'
    ),
    (
        46,
        12,
        698000,
        'paid',
        'payos',
        'PAYOS-2026-1046',
        '2026-02-02 08:52:00',
        '2026-02-02 08:55:00'
    ),
    (
        47,
        17,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1047',
        '2026-02-07 19:16:00',
        '2026-02-07 19:20:00'
    ),
    (
        48,
        24,
        398000,
        'paid',
        'payos',
        'PAYOS-2026-1048',
        '2026-02-14 10:08:00',
        '2026-02-14 10:13:00'
    ),
    (
        49,
        14,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1049',
        '2026-02-20 13:44:00',
        '2026-02-20 13:46:00'
    ),
    (
        50,
        20,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1050',
        '2026-02-27 21:03:00',
        '2026-02-27 21:06:00'
    ),
    (
        51,
        11,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1051',
        '2026-03-01 09:41:00',
        '2026-03-01 09:45:00'
    ),
    (
        52,
        16,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1052',
        '2026-03-07 16:25:00',
        '2026-03-07 16:30:00'
    ),
    (
        53,
        23,
        698000,
        'paid',
        'payos',
        'PAYOS-2026-1053',
        '2026-03-15 11:12:00',
        '2026-03-15 11:14:00'
    ),
    (
        54,
        13,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1054',
        '2026-03-22 20:31:00',
        '2026-03-22 20:34:00'
    ),
    (
        55,
        19,
        498000,
        'paid',
        'payos',
        'PAYOS-2026-1055',
        '2026-03-29 14:06:00',
        '2026-03-29 14:10:00'
    ),
    (
        56,
        25,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1056',
        '2026-04-05 10:17:00',
        '2026-04-05 10:22:00'
    ),
    (
        57,
        15,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1057',
        '2026-04-12 19:38:00',
        '2026-04-12 19:40:00'
    ),
    (
        58,
        22,
        798000,
        'paid',
        'payos',
        'PAYOS-2026-1058',
        '2026-04-16 08:46:00',
        '2026-04-16 08:49:00'
    ),
    (
        59,
        12,
        249000,
        'paid',
        'payos',
        'PAYOS-2026-1059',
        '2026-04-22 15:29:00',
        '2026-04-22 15:33:00'
    ),
    (
        60,
        17,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1060',
        '2026-04-29 20:14:00',
        '2026-04-29 20:19:00'
    ),
    (
        61,
        24,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1061',
        '2026-05-02 09:23:00',
        '2026-05-02 09:25:00'
    ),
    (
        62,
        14,
        349000,
        'paid',
        'payos',
        'PAYOS-2026-1062',
        '2026-05-09 18:51:00',
        '2026-05-09 18:54:00'
    ),
    (
        63,
        20,
        598000,
        'paid',
        'payos',
        'PAYOS-2026-1063',
        '2026-05-12 12:07:00',
        '2026-05-12 12:11:00'
    ),
    (
        64,
        11,
        348000,
        'paid',
        'payos',
        'PAYOS-2026-1064',
        '2026-05-18 20:36:00',
        '2026-05-18 20:41:00'
    ),
    (
        65,
        16,
        699000,
        'paid',
        'payos',
        'PAYOS-2026-1065',
        '2026-05-24 10:42:00',
        '2026-05-24 10:44:00'
    ),
    (
        66,
        23,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1066',
        '2026-05-30 16:18:00',
        '2026-05-30 16:21:00'
    ),
    (
        67,
        13,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1067',
        '2026-06-01 08:39:00',
        '2026-06-01 08:43:00'
    ),
    (
        68,
        19,
        398000,
        'paid',
        'payos',
        'PAYOS-2026-1068',
        '2026-06-06 19:27:00',
        '2026-06-06 19:32:00'
    ),
    (
        69,
        25,
        699000,
        'paid',
        'payos',
        'PAYOS-2026-1069',
        '2026-06-08 11:16:00',
        '2026-06-08 11:18:00'
    ),
    (
        70,
        15,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1070',
        '2026-06-13 20:04:00',
        '2026-06-13 20:07:00'
    ),
    (
        71,
        22,
        349000,
        'paid',
        'payos',
        'PAYOS-2026-1071',
        '2026-06-16 09:32:00',
        '2026-06-16 09:36:00'
    ),
    (
        72,
        12,
        249000,
        'paid',
        'payos',
        'PAYOS-2026-1072',
        '2026-06-22 14:48:00',
        '2026-06-22 14:53:00'
    ),
    (
        73,
        17,
        348000,
        'paid',
        'payos',
        'PAYOS-2026-1073',
        '2026-06-28 18:11:00',
        '2026-06-28 18:13:00'
    ),
    (
        74,
        24,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1074',
        '2026-06-30 21:07:00',
        '2026-06-30 21:10:00'
    ),
    (
        75,
        14,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1075',
        '2026-07-04 09:26:00',
        '2026-07-04 09:30:00'
    ),
    (
        76,
        20,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1076',
        '2026-07-06 20:13:00',
        '2026-07-06 20:18:00'
    ),
    (
        77,
        11,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1077',
        '2026-07-09 08:54:00',
        '2026-07-09 08:56:00'
    ),
    (
        78,
        16,
        348000,
        'paid',
        'payos',
        'PAYOS-2026-1078',
        '2026-07-10 14:22:00',
        '2026-07-10 14:25:00'
    ),
    (
        79,
        23,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1079',
        '2026-07-11 19:47:00',
        '2026-07-11 19:51:00'
    ),
    (
        80,
        13,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1080',
        '2026-07-13 10:31:00',
        '2026-07-13 10:36:00'
    ),
    (
        81,
        19,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1081',
        '2026-07-15 15:18:00',
        '2026-07-15 15:20:00'
    ),
    (
        82,
        25,
        998000,
        'paid',
        'payos',
        'PAYOS-2026-1082',
        '2026-07-16 09:43:00',
        '2026-07-16 09:46:00'
    ),
    (
        83,
        15,
        598000,
        'paid',
        'payos',
        'PAYOS-2026-1083',
        '2026-07-17 20:26:00',
        '2026-07-17 20:30:00'
    ),
    (
        84,
        22,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1084',
        '2026-07-18 11:39:00',
        '2026-07-18 11:44:00'
    ),
    (
        85,
        12,
        179000,
        'paid',
        'payos',
        'PAYOS-2026-1085',
        '2026-07-20 18:52:00',
        '2026-07-20 18:54:00'
    ),
    (
        86,
        17,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1086',
        '2026-07-22 10:14:00',
        '2026-07-22 10:17:00'
    ),
    (
        87,
        24,
        349000,
        'paid',
        'payos',
        'PAYOS-2026-1087',
        '2026-07-23 16:37:00',
        '2026-07-23 16:41:00'
    ),
    (
        88,
        14,
        498000,
        'paid',
        'payos',
        'PAYOS-2026-1088',
        '2026-07-28 09:21:00',
        '2026-07-28 09:26:00'
    ),
    (
        89,
        20,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1089',
        '2026-07-29 19:08:00',
        '2026-07-29 19:10:00'
    ),
    (
        90,
        11,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1090',
        '2026-07-30 13:46:00',
        '2026-07-30 13:49:00'
    ),
    (
        91,
        16,
        798000,
        'paid',
        'payos',
        'PAYOS-2026-1091',
        '2026-08-02 10:12:00',
        '2026-08-02 10:16:00'
    ),
    (
        92,
        23,
        399000,
        'failed',
        'payos',
        'PAYOS-2026-1092',
        '2026-08-03 15:34:00',
        NULL
    ),
    (
        93,
        13,
        448000,
        'failed',
        'payos',
        'PAYOS-2026-1093',
        '2026-08-04 09:47:00',
        NULL
    ),
    (
        94,
        19,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1094',
        '2026-08-05 20:16:00',
        '2026-08-05 20:19:00'
    ),
    (
        95,
        25,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1095',
        '2026-08-06 11:28:00',
        '2026-08-06 11:32:00'
    ),
    -- Back-filled purchases for enrollments that previously had no matching transaction.
    (
        96,
        15,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1096',
        '2026-06-05 08:57:00',
        '2026-06-05 09:00:00'
    ),
    (
        97,
        11,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1097',
        '2026-06-05 09:57:00',
        '2026-06-05 10:00:00'
    ),
    (
        98,
        12,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1098',
        '2026-06-05 10:57:00',
        '2026-06-05 11:00:00'
    ),
    (
        99,
        20,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1099',
        '2026-06-06 08:57:00',
        '2026-06-06 09:00:00'
    ),
    (
        100,
        13,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1100',
        '2026-06-06 09:27:00',
        '2026-06-06 09:30:00'
    ),
    (
        101,
        14,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1101',
        '2026-06-07 13:57:00',
        '2026-06-07 14:00:00'
    ),
    (
        102,
        15,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1102',
        '2026-06-08 08:57:00',
        '2026-06-08 09:00:00'
    ),
    (
        103,
        11,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1103',
        '2026-06-08 09:57:00',
        '2026-06-08 10:00:00'
    ),
    (
        104,
        16,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1104',
        '2026-06-09 13:57:00',
        '2026-06-09 14:00:00'
    ),
    (
        105,
        19,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1105',
        '2026-06-09 14:57:00',
        '2026-06-09 15:00:00'
    ),
    (
        106,
        24,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1106',
        '2026-06-10 10:57:00',
        '2026-06-10 11:00:00'
    ),
    (
        107,
        16,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1107',
        '2026-06-10 13:57:00',
        '2026-06-10 14:00:00'
    ),
    (
        108,
        19,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1108',
        '2026-06-11 14:57:00',
        '2026-06-11 15:00:00'
    ),
    (
        109,
        21,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1109',
        '2026-06-12 08:57:00',
        '2026-06-12 09:00:00'
    ),
    (
        110,
        15,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1110',
        '2026-06-12 08:57:00',
        '2026-06-12 09:00:00'
    ),
    (
        111,
        17,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1111',
        '2026-06-12 09:57:00',
        '2026-06-12 10:00:00'
    ),
    (
        112,
        22,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1112',
        '2026-06-12 13:57:00',
        '2026-06-12 14:00:00'
    ),
    (
        113,
        18,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1113',
        '2026-06-12 15:57:00',
        '2026-06-12 16:00:00'
    ),
    (
        114,
        20,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1114',
        '2026-06-14 08:57:00',
        '2026-06-14 09:00:00'
    ),
    (
        115,
        18,
        249000,
        'paid',
        'payos',
        'PAYOS-2026-1115',
        '2026-06-14 15:57:00',
        '2026-06-14 16:00:00'
    ),
    (
        116,
        21,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1116',
        '2026-06-15 08:57:00',
        '2026-06-15 09:00:00'
    ),
    (
        117,
        25,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1117',
        '2026-06-15 09:57:00',
        '2026-06-15 10:00:00'
    ),
    (
        118,
        12,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1118',
        '2026-06-15 10:57:00',
        '2026-06-15 11:00:00'
    ),
    (
        119,
        22,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1119',
        '2026-06-15 13:57:00',
        '2026-06-15 14:00:00'
    ),
    (
        120,
        14,
        699000,
        'paid',
        'payos',
        'PAYOS-2026-1120',
        '2026-06-15 13:57:00',
        '2026-06-15 14:00:00'
    ),
    (
        121,
        23,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1121',
        '2026-06-19 08:57:00',
        '2026-06-19 09:00:00'
    ),
    (
        122,
        14,
        299000,
        'paid',
        'payos',
        'PAYOS-2026-1122',
        '2026-06-19 13:57:00',
        '2026-06-19 14:00:00'
    ),
    (
        123,
        13,
        249000,
        'paid',
        'payos',
        'PAYOS-2026-1123',
        '2026-06-20 08:57:00',
        '2026-06-20 09:00:00'
    ),
    (
        124,
        24,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1124',
        '2026-06-20 10:57:00',
        '2026-06-20 11:00:00'
    ),
    (
        125,
        16,
        399000,
        'paid',
        'payos',
        'PAYOS-2026-1125',
        '2026-06-20 13:57:00',
        '2026-06-20 14:00:00'
    ),
    (
        126,
        15,
        249000,
        'paid',
        'payos',
        'PAYOS-2026-1126',
        '2026-06-21 08:57:00',
        '2026-06-21 09:00:00'
    ),
    (
        127,
        20,
        699000,
        'paid',
        'payos',
        'PAYOS-2026-1127',
        '2026-06-22 08:57:00',
        '2026-06-22 09:00:00'
    ),
    (
        128,
        18,
        349000,
        'paid',
        'payos',
        'PAYOS-2026-1128',
        '2026-06-22 15:57:00',
        '2026-06-22 16:00:00'
    ),
    (
        129,
        17,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1129',
        '2026-06-23 09:57:00',
        '2026-06-23 10:00:00'
    ),
    (
        130,
        24,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1130',
        '2026-06-23 10:57:00',
        '2026-06-23 11:00:00'
    ),
    (
        131,
        25,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1131',
        '2026-06-25 09:57:00',
        '2026-06-25 10:00:00'
    ),
    (
        132,
        17,
        499000,
        'paid',
        'payos',
        'PAYOS-2026-1132',
        '2026-06-26 09:57:00',
        '2026-06-26 10:00:00'
    ),
    (
        133,
        18,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1133',
        '2026-07-24 09:27:00',
        '2026-07-24 09:30:00'
    ),
    (
        134,
        22,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1134',
        '2026-07-26 13:57:00',
        '2026-07-26 14:00:00'
    ),
    (
        135,
        17,
        199000,
        'paid',
        'payos',
        'PAYOS-2026-1135',
        '2026-07-27 09:57:00',
        '2026-07-27 10:00:00'
    ),
    (
        136,
        21,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1136',
        '2026-07-28 20:12:00',
        '2026-07-28 20:15:00'
    ),
    (
        137,
        23,
        179000,
        'paid',
        'payos',
        'PAYOS-2026-1137',
        '2026-07-30 08:57:00',
        '2026-07-30 09:00:00'
    ),
    (
        138,
        25,
        179000,
        'paid',
        'payos',
        'PAYOS-2026-1138',
        '2026-07-31 09:57:00',
        '2026-07-31 10:00:00'
    ),
    (
        139,
        24,
        149000,
        'paid',
        'payos',
        'PAYOS-2026-1139',
        '2026-08-01 09:02:00',
        '2026-08-01 09:05:00'
    );

-- ============================================================================
-- TRANSACTION_ITEMS (snapshot of price at purchase time)
-- ============================================================================
INSERT INTO
    transaction_items (
        id,
        transaction_id,
        course_id,
        price
    )
VALUES (1, 1, 4, 199000),
    (2, 2, 2, 199000),
    (3, 2, 22, 149000),
    (4, 3, 12, 299000),
    (5, 3, 16, 299000),
    (6, 4, 5, 499000),
    (7, 5, 5, 499000),
    (8, 6, 13, 349000),
    (9, 6, 8, 299000),
    (10, 7, 3, 149000),
    (11, 8, 18, 499000),
    (12, 9, 20, 199000),
    (13, 9, 21, 249000),
    (14, 10, 10, 399000),
    (15, 10, 22, 149000),
    (16, 11, 7, 699000),
    (17, 12, 16, 299000),
    (18, 12, 23, 199000),
    (19, 13, 16, 299000),
    (20, 13, 22, 149000),
    (21, 14, 7, 699000),
    (22, 14, 24, 179000),
    (23, 15, 21, 249000),
    (24, 16, 18, 499000),
    (25, 17, 18, 499000),
    (26, 18, 13, 349000),
    (27, 18, 17, 199000),
    (28, 19, 10, 399000),
    (29, 19, 19, 349000),
    (30, 20, 7, 699000),
    (31, 21, 5, 499000),
    (32, 22, 13, 349000),
    (33, 22, 8, 299000),
    (34, 23, 7, 699000),
    (35, 23, 10, 399000),
    (36, 24, 14, 199000),
    (37, 24, 15, 249000),
    (38, 25, 18, 499000),
    (39, 25, 15, 249000),
    (40, 26, 6, 499000),
    (41, 26, 17, 199000),
    (42, 27, 7, 699000),
    (43, 27, 17, 199000),
    (44, 27, 20, 199000),
    (45, 28, 8, 299000),
    (46, 28, 7, 699000),
    (47, 29, 10, 399000),
    (48, 30, 19, 349000),
    (49, 30, 14, 199000),
    (50, 31, 6, 499000),
    (51, 31, 21, 249000),
    (52, 32, 12, 299000),
    (53, 33, 19, 349000),
    (54, 33, 18, 499000),
    (55, 34, 1, 399000),
    (56, 35, 10, 399000),
    (57, 36, 21, 249000),
    (58, 37, 19, 349000),
    (59, 38, 6, 499000),
    (60, 38, 15, 249000),
    (61, 39, 6, 499000),
    (62, 40, 8, 299000),
    -- Line items for the additional successful demo orders above.
    (63, 41, 4, 199000),
    (64, 42, 2, 199000),
    (65, 43, 4, 199000),
    (66, 43, 16, 299000),
    (67, 44, 12, 299000),
    (68, 45, 2, 199000),
    (69, 46, 4, 199000),
    (70, 46, 5, 499000),
    (71, 47, 12, 299000),
    (72, 48, 2, 199000),
    (73, 48, 4, 199000),
    (74, 49, 18, 499000),
    (75, 50, 5, 499000),
    (76, 51, 8, 299000),
    (77, 52, 2, 199000),
    (78, 53, 4, 199000),
    (79, 53, 18, 499000),
    (80, 54, 5, 499000),
    (81, 55, 8, 299000),
    (82, 55, 23, 199000),
    (83, 56, 22, 149000),
    (84, 57, 18, 499000),
    (85, 58, 5, 499000),
    (86, 58, 8, 299000),
    (87, 59, 21, 249000),
    (88, 60, 20, 199000),
    (89, 61, 22, 149000),
    (90, 62, 13, 349000),
    (91, 63, 13, 349000),
    (92, 63, 21, 249000),
    (93, 64, 20, 199000),
    (94, 64, 3, 149000),
    (95, 65, 7, 699000),
    (96, 66, 5, 499000),
    (97, 67, 8, 299000),
    (98, 68, 17, 199000),
    (99, 68, 4, 199000),
    (100, 69, 7, 699000),
    (101, 70, 6, 499000),
    (102, 71, 19, 349000),
    (103, 72, 15, 249000),
    (104, 73, 14, 199000),
    (105, 73, 22, 149000),
    (106, 74, 6, 499000),
    (107, 75, 16, 299000),
    (108, 76, 12, 299000),
    (109, 77, 2, 199000),
    (110, 78, 14, 199000),
    (111, 78, 3, 149000),
    (112, 79, 10, 399000),
    (113, 80, 1, 399000),
    (114, 81, 3, 149000),
    (115, 82, 18, 499000),
    (116, 82, 5, 499000),
    (117, 83, 19, 349000),
    (118, 83, 21, 249000),
    (119, 84, 4, 199000),
    (120, 85, 24, 179000),
    (121, 86, 10, 399000),
    (122, 87, 13, 349000),
    (123, 88, 12, 299000),
    (124, 88, 2, 199000),
    (125, 89, 14, 199000),
    (126, 90, 22, 149000),
    (127, 91, 18, 499000),
    (128, 91, 16, 299000),
    (129, 92, 1, 399000),
    (130, 93, 21, 249000),
    (131, 93, 20, 199000),
    (132, 94, 22, 149000),
    (133, 95, 10, 399000),
    -- Line items for the back-filled purchases above (matches previously orphan enrolls).
    (134, 96, 1, 399000),
    (135, 97, 1, 399000),
    (136, 98, 1, 399000),
    (137, 99, 1, 399000),
    (138, 100, 14, 199000),
    (139, 101, 4, 199000),
    (140, 102, 14, 199000),
    (141, 103, 5, 499000),
    (142, 104, 4, 199000),
    (143, 105, 10, 399000),
    (144, 106, 16, 299000),
    (145, 107, 11, 149000),
    (146, 108, 12, 299000),
    (147, 109, 10, 399000),
    (148, 110, 2, 199000),
    (149, 111, 16, 299000),
    (150, 112, 12, 299000),
    (151, 113, 20, 199000),
    (152, 114, 2, 199000),
    (153, 115, 21, 249000),
    (154, 116, 11, 149000),
    (155, 117, 3, 149000),
    (156, 118, 3, 149000),
    (157, 119, 14, 199000),
    (158, 120, 7, 699000),
    (159, 121, 23, 199000),
    (160, 122, 8, 299000),
    (161, 123, 15, 249000),
    (162, 124, 17, 199000),
    (163, 125, 10, 399000),
    (164, 126, 15, 249000),
    (165, 127, 7, 699000),
    (166, 128, 13, 349000),
    (167, 129, 17, 199000),
    (168, 130, 18, 499000),
    (169, 131, 20, 199000),
    (170, 132, 18, 499000),
    (171, 133, 3, 149000),
    (172, 134, 22, 149000),
    (173, 135, 23, 199000),
    (174, 136, 3, 149000),
    (175, 137, 24, 179000),
    (176, 138, 24, 179000),
    (177, 139, 3, 149000);

-- ============================================================================
-- HIGHLIGHT_FEED (newsfeed entries; one per highlight video)
-- ============================================================================
INSERT INTO
    highlight_feed (
        id,
        video_id,
        course_id,
        title,
        caption,
        hashtags,
        status,
        created_at,
        updated_at
    )
VALUES (
        1,
        32,
        1,
        'Introduction to Participles + Types of Participles + Present Participle Usage',
        'The speaker introduces the concept of participles, explaining their importance in grammar and how they are commonly encountered in English.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-06-30 18:15:00',
        '2026-07-01 09:00:00'
    ),
    (
        2,
        33,
        1,
        'Active vs. Passive Meaning + Past Participle Usage + Examples of Participles in Context',
        'Clarification of the difference between active and passive meanings when using present and past participles.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-01 10:00:00',
        '2026-07-01 10:00:00'
    ),
    (
        3,
        34,
        1,
        'Practice Exercises + Common Mistakes with Participles + Conclusion and Recap',
        'Engagement with practice exercises to apply the knowledge of participles, encouraging active learning and self-assessment.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-01 11:15:00',
        '2026-07-01 11:15:00'
    ),
    (
        4,
        35,
        1,
        'Introduction to Two-Verb Structures + First Usage of Two-Verb + Second Usage of Two-Verb',
        'The speaker introduces the concept of Two-Verb structures, explaining their roles in sentences and how they function as either main verbs or complements.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-03 14:00:00',
        '2026-07-03 14:00:00'
    ),
    (
        5,
        36,
        1,
        'Third Usage of Two-Verb + Fourth Usage of Two-Verb + Common Structures with Two-Verb',
        'The third usage of Two-Verb is introduced, where it follows a subject and indicates purpose, often synonymous with ''in order to''.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-02 12:15:00',
        '2026-07-02 12:15:00'
    ),
    (
        6,
        37,
        1,
        'Usage of Verb In + Common Verbs with Verb In',
        'The various usages of Verb In are explored, including its position in sentences and how it interacts with other verbs.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-01 14:00:00',
        '2026-07-01 14:00:00'
    ),
    (
        7,
        38,
        1,
        'Introduction to Base Form Verbs + Explanation of ''Can'' and ''May'' + Difference Between ''Have to'' and ''Must''',
        'The speaker introduces the concept of base form verbs, explaining their position and function in sentences.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-03 13:15:00',
        '2026-07-03 13:15:00'
    ),
    (
        8,
        39,
        1,
        'Understanding ''Should'' and ''Ought to'' + Using ''Let'' and ''Make''',
        'An explanation of ''should'' and ''ought to'', focusing on their use in giving advice and recommendations.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-01 16:00:00',
        '2026-07-01 16:00:00'
    ),
    (
        9,
        40,
        1,
        'Explaining ''Help'' and Its Structure + Introduction to ''Have'' in Context + Using ''Please'' in Requests',
        'The speaker elaborates on the verb ''help'' and its structure when used with other verbs.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-04 14:15:00',
        '2026-07-04 14:15:00'
    ),
    (
        10,
        41,
        1,
        'Conclusion and Practice + Understanding ''In Order To'' + Review of Modal Verbs and Their Applications',
        'The speaker concludes the lesson by encouraging practice with the discussed structures and providing tips for effective learning.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-03 15:00:00',
        '2026-07-03 15:00:00'
    ),
    (
        11,
        42,
        1,
        'Introduction to English Tenses + Present Simple Tense Overview',
        'The speaker introduces the topic of English tenses, focusing on the most commonly used ones in TOEIC exams.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-02 18:00:00',
        '2026-07-02 18:00:00'
    ),
    (
        12,
        43,
        1,
        'Forming Questions in Present Simple',
        'How to form questions in the Present Simple tense, including examples.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-01 20:00:00',
        '2026-07-01 20:00:00'
    ),
    (
        13,
        44,
        1,
        'Usage of Present Simple Tense + Common Time Expressions for Present Simple',
        'Situations where the Present Simple tense is used, such as describing habits and general truths.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-06 16:15:00',
        '2026-07-06 16:15:00'
    ),
    (
        14,
        45,
        1,
        'Introduction to Past Simple Tense + Forming Questions in Past Simple',
        'Overview of the Past Simple tense, including its structure and rules for regular and irregular verbs.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-06 10:00:00',
        '2026-07-06 10:00:00'
    ),
    (
        15,
        46,
        1,
        'Usage of Past Simple Tense + Common Time Expressions for Past Simple',
        'Situations where the Past Simple tense is used, including actions completed at a specific time in the past.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-07 17:15:00',
        '2026-07-07 17:15:00'
    ),
    (
        16,
        47,
        1,
        'Introduction to Future Simple Tense + Introduction to Tenses in English + Future Simple Tense Structure',
        'Overview of the Future Simple tense, including its structure and common usage.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-03 16:00:00',
        '2026-07-03 16:00:00'
    ),
    (
        17,
        48,
        1,
        'Examples of Future Simple Tense',
        'The speaker provides examples of sentences using the future simple tense, illustrating its application in everyday language.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-02 19:00:00',
        '2026-07-02 19:00:00'
    ),
    (
        18,
        49,
        1,
        'Usage of Future Simple Tense',
        'Situations where the Future Simple tense is used, including making promises and decisions.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-07 10:00:00',
        '2026-07-07 10:00:00'
    ),
    (
        19,
        50,
        1,
        'Common Time Expressions for Future Simple + Present Continuous and Past Continuous Tenses',
        'Key time expressions that indicate the use of the Future Simple tense.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-09 19:15:00',
        '2026-07-09 19:15:00'
    ),
    (
        20,
        51,
        1,
        'Forming Questions in Continuous Tenses + Usage of Continuous Tenses + Present Continuous for Future Plans',
        'How to form questions in Present Continuous and Past Continuous tenses.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-02 04:00:00',
        '2026-07-02 04:00:00'
    ),
    (
        21,
        52,
        1,
        'Past Continuous Tense Overview + Examples of Past Continuous Tense + Past Continuous Tense',
        'Introduction to the past continuous tense, including its structure and usage.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-10 20:15:00',
        '2026-07-10 20:15:00'
    ),
    (
        22,
        53,
        1,
        'Examples of Past Continuous Tense + Present Perfect Tense + Present Perfect Tense Usage',
        'The speaker shares examples of the past continuous tense, highlighting its application in real-life situations.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-03 17:00:00',
        '2026-07-03 17:00:00'
    ),
    (
        23,
        54,
        1,
        'Hiện Tại Hoàn Thành + Ví dụ về Hiện Tại Hoàn Thành + Cách Dùng Hiện Tại Hoàn Thành Tiếp Diễn + Công Thức Quá Khứ Hoàn Thành',
        'Giới thiệu về thì hiện tại hoàn thành, công thức và cách sử dụng của nó.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-11 21:15:00',
        '2026-07-11 21:15:00'
    ),
    (
        24,
        55,
        1,
        'Ví dụ về Quá Khứ Hoàn Thành + Examples of Past Perfect Tense + Quá Khứ Hoàn Thành Tiếp Diễn',
        'Cung cấp ví dụ minh họa cho thì quá khứ hoàn thành và cách diễn đạt.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-02 08:00:00',
        '2026-07-02 08:00:00'
    ),
    (
        25,
        56,
        1,
        'Examples of Past Perfect Continuous Tense + Thực Hành với Các Thì + Câu Hỏi Thực Hành về Hiện Tại và Quá Khứ',
        'The speaker provides examples to illustrate the use of the past perfect continuous tense in various contexts.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-12 10:15:00',
        '2026-07-12 10:15:00'
    ),
    (
        26,
        57,
        1,
        'Câu Hỏi Thực Hành Khó + Tổng Kết và Lời Khuyên',
        'Giới thiệu các câu hỏi thực hành khó hơn để kiểm tra kiến thức về các thì.',
        '["TOEIC","Grammar","English"]',
        'active',
        '2026-07-09 10:00:00',
        '2026-07-09 10:00:00'
    ),
    (
        27,
        58,
        2,
        'Understanding the Phrase ''Nice to Meet You''',
        'This topic covers the common misunderstanding of when to use the phrase ''nice to meet you'' in English, emphasizing the importance of exchanging names before using the phrase.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-04 15:00:00',
        '2026-07-04 15:00:00'
    ),
    (
        28,
        59,
        2,
        'Correct Usage of ''Nice to Meet You''',
        'An explanation of the correct context for using ''nice to meet you'' and the distinction between first-time meetings and subsequent encounters.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-03 18:00:00',
        '2026-07-03 18:00:00'
    ),
    (
        29,
        60,
        2,
        'Alternative Expressions for Asking About Toilets',
        'This section introduces alternative phrases to use instead of ''toilet,'' such as ''restroom,'' ''washroom,'' and ''bathroom,'' and explains their appropriate contexts.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-14 12:15:00',
        '2026-07-14 12:15:00'
    ),
    (
        30,
        61,
        2,
        'Using ''I Like'' and ''I Like To''',
        'An explanation of how to use ''I like'' and ''I like to'' with examples, focusing on the structure and common activities associated with these phrases.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-08 14:30:00',
        '2026-07-08 14:30:00'
    ),
    (
        31,
        62,
        2,
        'Expressing Dislikes with ''I Don''t Like''',
        'This topic covers how to express dislikes using ''I don''t like'' and ''I don''t like to,'' along with examples of common dislikes.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-15 13:15:00',
        '2026-07-15 13:15:00'
    ),
    (
        32,
        63,
        2,
        'Understanding Western Names',
        'An overview of the structure of Western names, including given names, family names, and middle names, and their significance.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-02 16:00:00',
        '2026-07-02 16:00:00'
    ),
    (
        33,
        64,
        2,
        'Common Pet Names in English + Expressions for Leaving a Conversation',
        'A discussion on common pet names used in English, including their meanings and contexts for use.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-04 16:00:00',
        '2026-07-04 16:00:00'
    ),
    (
        34,
        65,
        2,
        'Expressing Head Injuries or Sickness',
        'An explanation of how to express various head-related issues in English, including headaches and concussions.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-03 19:00:00',
        '2026-07-03 19:00:00'
    ),
    (
        35,
        66,
        2,
        'Asking for Permission',
        'A guide on how to ask for permission in English using phrases like ''can I,'' ''could I,'' and ''may I,'' along with examples.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-17 15:15:00',
        '2026-07-17 15:15:00'
    ),
    (
        36,
        67,
        2,
        'Expressing Emotions in English',
        'This topic covers how to express basic emotions in English, including happy, sad, angry, and scared, with examples.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-02 20:00:00',
        '2026-07-02 20:00:00'
    ),
    (
        37,
        68,
        2,
        'Asking for Directions',
        'An introduction to common phrases used when asking for directions, including polite ways to request help.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-18 16:15:00',
        '2026-07-18 16:15:00'
    ),
    (
        38,
        69,
        2,
        'Words of Encouragement',
        'A discussion on common expressions of encouragement in English, including ''good luck'' and ''you can do it.''',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-09 14:30:00',
        '2026-07-09 14:30:00'
    ),
    (
        39,
        70,
        2,
        'Expressing Language Proficiency',
        'This section teaches how to express one''s proficiency in another language using various phrases.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-04 17:00:00',
        '2026-07-04 17:00:00'
    ),
    (
        40,
        71,
        2,
        'Apologizing in English',
        'An overview of common expressions used to apologize in English, including formal and informal options.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-17 13:00:00',
        '2026-07-17 13:00:00'
    ),
    (
        41,
        72,
        2,
        'Pointing Out Embarrassing Situations',
        'A guide on how to politely inform someone about an embarrassing situation, such as having something on their face.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-20 18:15:00',
        '2026-07-20 18:15:00'
    ),
    (
        42,
        73,
        2,
        'Discussing the Weather',
        'An introduction to common questions and answers about the weather, including various descriptive terms.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        43,
        74,
        2,
        'Asking for Repetition',
        'A guide on expressions to use when asking someone to repeat what they said, including polite and informal options.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-21 19:15:00',
        '2026-07-21 19:15:00'
    ),
    (
        44,
        75,
        2,
        'Inquiring About Weekends',
        'This topic covers how to ask someone about their weekend and how to respond to such inquiries.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-19 08:00:00',
        '2026-07-19 08:00:00'
    ),
    (
        45,
        76,
        2,
        'Expressing Forgetfulness',
        'An explanation of common phrases and idioms used to express forgetfulness in English.',
        '["English","Conversation","Speaking"]',
        'active',
        '2026-07-04 18:00:00',
        '2026-07-04 18:00:00'
    ),
    (
        46,
        77,
        6,
        'Introduction to HTML + Setting Up the Development Environment',
        'An overview of HTML as the foundational language for web development, its importance, and the basic structure of a web page.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-10 14:30:00',
        '2026-07-10 14:30:00'
    ),
    (
        47,
        78,
        6,
        'Creating the index.html File + Basic HTML Document Structure',
        'Steps to create the main HTML file for a website, including the importance of naming it index.html.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-23 21:15:00',
        '2026-07-23 21:15:00'
    ),
    (
        48,
        79,
        6,
        'Using Header Tags + Paragraph Elements + Line Breaks and Horizontal Rules',
        'How to use header tags (H1 to H6) to create headings in an HTML document.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-03 08:00:00',
        '2026-07-03 08:00:00'
    ),
    (
        49,
        80,
        6,
        'Adding Comments in HTML + Creating Hyperlinks',
        'How to add comments in HTML for documentation purposes, which are not displayed in the browser.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-24 10:15:00',
        '2026-07-24 10:15:00'
    ),
    (
        50,
        81,
        6,
        'Adding Images to a Web Page',
        'Instructions on how to add images using the IMG tag, including attributes for source, alt text, and title.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-05 16:00:00',
        '2026-07-05 16:00:00'
    ),
    (
        51,
        82,
        6,
        'Embedding Audio in HTML',
        'How to embed audio files using the audio element, including attributes for controls and autoplay.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-04 19:00:00',
        '2026-07-04 19:00:00'
    ),
    (
        52,
        83,
        6,
        'Embedding Video in HTML',
        'Instructions on how to embed video files using the video element, including attributes for controls and multiple sources.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-03 12:00:00',
        '2026-07-03 12:00:00'
    ),
    (
        53,
        84,
        6,
        'Text Formatting Tags + Creating Lists in HTML',
        'Overview of various text formatting tags in HTML, including bold, italic, and others.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-26 12:15:00',
        '2026-07-26 12:15:00'
    ),
    (
        54,
        85,
        6,
        'Creating Tables in HTML',
        'Instructions on how to create tables using table, tr, th, and td tags.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-11 14:30:00',
        '2026-07-11 14:30:00'
    ),
    (
        55,
        86,
        6,
        'Adding Color to a Web Page',
        'How to add color to elements using inline CSS styles within HTML tags.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-27 13:15:00',
        '2026-07-27 13:15:00'
    ),
    (
        56,
        87,
        6,
        'Using Span and Div Tags',
        'Explanation of the span and div tags for applying styles and organizing content in HTML.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-05 17:00:00',
        '2026-07-05 17:00:00'
    ),
    (
        57,
        88,
        6,
        'Understanding Meta Tags',
        'Overview of meta tags and their importance for providing metadata about a web page.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-06-30 14:15:00',
        '2026-07-03 17:00:00'
    ),
    (
        58,
        89,
        6,
        'Using iFrames',
        'How to use iFrames to embed other web pages or documents within an HTML document.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-17 10:00:00',
        '2026-07-17 10:00:00'
    ),
    (
        59,
        90,
        6,
        'Creating Buttons in HTML',
        'Instructions on how to create buttons using button tags and how to add functionality with JavaScript.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-01 15:15:00',
        '2026-07-03 19:00:00'
    ),
    (
        60,
        91,
        6,
        'Creating Forms in HTML',
        'How to create forms for user input, including various input types and attributes.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-03 20:00:00',
        '2026-07-03 20:00:00'
    ),
    (
        61,
        92,
        11,
        'Registering for ChatGPT',
        'Step-by-step guide on how to register for a ChatGPT account, including the requirements and process involved.',
        '["ChatGPT","AI","Productivity"]',
        'active',
        '2026-07-02 16:15:00',
        '2026-07-03 21:00:00'
    ),
    (
        62,
        93,
        11,
        'Advanced Usage of ChatGPT + Using ChatGPT for Content Creation',
        'Exploration of more advanced features and applications of ChatGPT, including creative writing and data analysis.',
        '["ChatGPT","AI","Productivity"]',
        'active',
        '2026-07-05 18:00:00',
        '2026-07-05 18:00:00'
    ),
    (
        63,
        94,
        11,
        'Future of ChatGPT and AI Tools + Introduction to Upgrading ChatGPT Accounts',
        'Insights into the future developments of ChatGPT and similar AI tools, including potential enhancements and applications.',
        '["ChatGPT","AI","Productivity"]',
        'active',
        '2026-07-03 17:15:00',
        '2026-07-03 23:00:00'
    ),
    (
        64,
        95,
        11,
        'Differences Between Free and Paid Accounts + Benefits of Upgrading to ChatGPT Plus + How to Upgrade Your Account',
        'An explanation of the limitations of free accounts compared to paid accounts, including access to different models and features.',
        '["ChatGPT","AI","Productivity"]',
        'active',
        '2026-07-04 00:00:00',
        '2026-07-04 00:00:00'
    ),
    (
        65,
        96,
        11,
        'Demonstration of Data Summarization',
        'A practical demonstration of how to use ChatGPT to summarize a complex dataset, including a sample file related to real estate.',
        '["ChatGPT","AI","Productivity"]',
        'active',
        '2026-07-04 18:15:00',
        '2026-07-04 18:15:00'
    ),
    (
        66,
        97,
        11,
        'Interacting with ChatGPT for Data Insights + Limitations and Considerations',
        'Explaining how to interact with ChatGPT to ask questions about the dataset and receive summarized information.',
        '["ChatGPT","AI","Productivity"]',
        'active',
        '2026-07-19 10:00:00',
        '2026-07-19 10:00:00'
    ),
    (
        67,
        98,
        11,
        'Using ChatGPT for Image Analysis + Creating Custom Chatbots with ChatGPT + Conclusion and Future Applications',
        'Discussion on how to use ChatGPT to analyze and generate content based on images, including a demonstration.',
        '["ChatGPT","AI","Productivity"]',
        'active',
        '2026-07-05 19:15:00',
        '2026-07-05 19:15:00'
    ),
    (
        68,
        99,
        10,
        'Introduction to Data Science and Machine Learning + Multidisciplinary Nature of Data Science',
        'An overview of what Data Science and Machine Learning are, their importance, and the structure of the course.',
        '["MachineLearning","AI","DataScience"]',
        'active',
        '2026-07-05 19:00:00',
        '2026-07-05 19:00:00'
    ),
    (
        69,
        100,
        10,
        'Difference Between Data Science, Data Analytics, and Big Data + Why Data Science is Relevant Now + Applications of Data Science and Machine Learning',
        'Clarifies the distinctions between these terms and introduces the four Vs of Big Data.',
        '["MachineLearning","AI","DataScience"]',
        'active',
        '2026-07-06 20:15:00',
        '2026-07-06 20:15:00'
    ),
    (
        70,
        101,
        10,
        'History and Future of Data Science + Understanding Data and Variables',
        'Provides a brief history of Data Science and discusses its promising future, including the impact of cloud services.',
        '["MachineLearning","AI","DataScience"]',
        'active',
        '2026-07-13 14:30:00',
        '2026-07-13 14:30:00'
    ),
    (
        71,
        102,
        10,
        'Handling Outliers and Missing Data + Types of Machine Learning',
        'Discusses the concepts of outliers and missing data, and various techniques to handle them.',
        '["MachineLearning","AI","DataScience"]',
        'active',
        '2026-07-07 21:15:00',
        '2026-07-07 21:15:00'
    ),
    (
        72,
        103,
        10,
        'Model Evaluation and Performance Indicators',
        'Covers how to evaluate machine learning models using metrics like R squared, confusion matrix, and cross-validation.',
        '["MachineLearning","AI","DataScience"]',
        'active',
        '2026-07-04 08:00:00',
        '2026-07-04 08:00:00'
    ),
    (
        73,
        104,
        10,
        'Best Practices in Data Science and Machine Learning',
        'Discusses essential practices for data cleaning, feature engineering, and scaling to improve model performance.',
        '["MachineLearning","AI","DataScience"]',
        'active',
        '2026-07-06 17:00:00',
        '2026-07-06 17:00:00'
    ),
    (
        74,
        105,
        7,
        'Introduction to System Design + Foundational Concepts in System Design',
        'Overview of the course and the importance of mastering system design for career advancement.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-19 13:00:00',
        '2026-07-19 13:00:00'
    ),
    (
        75,
        106,
        7,
        'Database Selection: SQL vs NoSQL',
        'Guidance on choosing the right database type based on application needs, including relational and non-relational databases.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-09 11:15:00',
        '2026-07-09 11:15:00'
    ),
    (
        76,
        107,
        7,
        'Scaling Strategies: Vertical vs Horizontal',
        'Discussion on the two primary approaches to scaling systems and their implications for performance and reliability.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-04 12:00:00',
        '2026-07-04 12:00:00'
    ),
    (
        77,
        108,
        7,
        'Load Balancing Techniques',
        'Explanation of load balancing, its importance, and various algorithms used to distribute traffic across servers.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-10 12:15:00',
        '2026-07-10 12:15:00'
    ),
    (
        78,
        109,
        7,
        'Avoiding Single Points of Failure',
        'Strategies to prevent single points of failure in system design, focusing on redundancy and health checks.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-14 14:30:00',
        '2026-07-14 14:30:00'
    ),
    (
        79,
        110,
        7,
        'API Design Principles + Understanding REST, GraphQL, and GRPC',
        'Exploration of how to design APIs that are scalable and developer-friendly.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-06 18:00:00',
        '2026-07-06 18:00:00'
    ),
    (
        80,
        111,
        7,
        'Authentication vs Authorization',
        'Clarification of the differences between authentication and authorization, including various methods and frameworks.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-19 14:00:00',
        '2026-07-19 14:00:00'
    ),
    (
        81,
        112,
        7,
        'API Security Best Practices',
        'Overview of techniques to secure APIs against common vulnerabilities and attacks.',
        '["SystemDesign","Backend","Scaling"]',
        'active',
        '2026-07-12 14:15:00',
        '2026-07-12 14:15:00'
    ),
    (
        82,
        113,
        8,
        'Giới thiệu về cây nhị phân và cây nhị phân tìm kiếm + Cấu trúc của cây nhị phân',
        'Bắt đầu với định nghĩa và khái niệm cơ bản về cây nhị phân và cây nhị phân tìm kiếm, cùng với các loại cây khác nhau.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-23 10:00:00',
        '2026-07-23 10:00:00'
    ),
    (
        83,
        114,
        8,
        'Các loại cây nhị phân + Cây nhị phân tìm kiếm (BST)',
        'Phân loại cây nhị phân dựa trên số lượng con của mỗi nút và các đặc điểm của chúng.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-13 15:15:00',
        '2026-07-13 15:15:00'
    ),
    (
        84,
        115,
        8,
        'Thao tác thêm nút vào cây nhị phân tìm kiếm',
        'Hướng dẫn chi tiết về cách thêm một nút vào cây nhị phân tìm kiếm, bao gồm các trường hợp khác nhau.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-21 09:00:00',
        '2026-07-21 09:00:00'
    ),
    (
        85,
        116,
        8,
        'Introduction to Binary Search Tree Insertion + Iterative vs Recursive Insertion Methods + Creating a New Root Node + Handling Existing Nodes + Node Comparison and Traversal + Finalizing the Insertion ',
        'The speaker introduces the concept of inserting a node into a binary search tree, explaining the basic structure and the need for a root node.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-06 19:00:00',
        '2026-07-06 19:00:00'
    ),
    (
        86,
        117,
        8,
        'Thao tác xóa nút trong cây nhị phân tìm kiếm',
        'Giải thích các trường hợp khác nhau khi xóa một nút trong cây nhị phân tìm kiếm và cách xử lý chúng.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-04 10:00:00',
        '2026-07-04 22:00:00'
    ),
    (
        87,
        118,
        8,
        'Giới thiệu về cây nhị phân và các thao tác cơ bản + Implementing the Deletion Function',
        'Bắt đầu với khái niệm cây nhị phân và các thao tác cơ bản như xóa nút trong cây.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-15 17:15:00',
        '2026-07-15 17:15:00'
    ),
    (
        88,
        119,
        8,
        'Cách thực hiện hàm xóa nút + Trường hợp xóa nút có hai con',
        'Hướng dẫn từng bước để thực hiện hàm xóa nút trong cây nhị phân tìm kiếm.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-05 00:00:00',
        '2026-07-05 00:00:00'
    ),
    (
        89,
        120,
        8,
        'Trường hợp xóa nút có một con + Trường hợp xóa nút không có con + Tìm kiếm nút trong cây nhị phân',
        'Giải thích cách xử lý khi xóa nút chỉ có một con.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-16 18:15:00',
        '2026-07-16 18:15:00'
    ),
    (
        90,
        121,
        8,
        'Duyệt cây nhị phân',
        'Giới thiệu các phương pháp duyệt cây nhị phân như pre-order, in-order và post-order.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-05 10:00:00',
        '2026-07-05 10:00:00'
    ),
    (
        91,
        122,
        8,
        'Phân tích độ phức tạp của các thuật toán',
        'Thảo luận về độ phức tạp thời gian và không gian của các thuật toán liên quan đến cây nhị phân.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-17 19:15:00',
        '2026-07-17 19:15:00'
    ),
    (
        92,
        123,
        8,
        'Tính chiều cao của cây nhị phân',
        'Hướng dẫn cách tính chiều cao của cây nhị phân bằng phương pháp đệ quy.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-19 16:00:00',
        '2026-07-19 16:00:00'
    ),
    (
        93,
        124,
        8,
        'Kiểm tra tổng đường đi trong cây',
        'Giới thiệu bài toán kiểm tra xem có đường đi nào trong cây có tổng bằng một giá trị cho trước.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-18 20:15:00',
        '2026-07-18 20:15:00'
    ),
    (
        94,
        125,
        8,
        'Thực hiện giải thuật kiểm tra tổng + Kết luận và tổng kết',
        'Chi tiết cách thực hiện giải thuật kiểm tra tổng đường đi trong cây nhị phân.',
        '["DSA","BinaryTree","Algorithms"]',
        'active',
        '2026-07-06 10:00:00',
        '2026-07-06 10:00:00'
    ),
    (
        95,
        126,
        4,
        'Cài đặt môi trường lập trình cho máy Windows mới + Cấu hình máy tính mới + Cài đặt Visual Studio Code',
        'Hướng dẫn từng bước để cài đặt và cấu hình môi trường lập trình trên máy tính Windows mới, bao gồm các phần mềm cần thiết.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-19 21:15:00',
        '2026-07-19 21:15:00'
    ),
    (
        96,
        127,
        4,
        'Thiết lập terminal + Cài đặt Node.js',
        'Hướng dẫn cách thiết lập Windows Terminal để sử dụng hiệu quả hơn trong quá trình lập trình.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-07 18:00:00',
        '2026-07-07 18:00:00'
    ),
    (
        97,
        128,
        4,
        'Hướng dẫn cài đặt môi trường lập trình cho Windows + Cài đặt Visual Studio Code',
        'Giới thiệu về quy trình cài đặt môi trường lập trình trên máy Windows mới, bao gồm các bước cần thiết để thiết lập và cấu hình.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-20 10:15:00',
        '2026-07-20 10:15:00'
    ),
    (
        98,
        129,
        4,
        'Cài đặt extensions cho Visual Studio Code + Kiểm tra cài đặt thành công + Cài đặt Node.js + Cài đặt Git + Thiết lập terminal + Cấu hình PATH',
        'Hướng dẫn cách cài đặt các extensions cần thiết cho Visual Studio Code để hỗ trợ lập trình.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-07 10:00:00',
        '2026-07-07 10:00:00'
    ),
    (
        99,
        130,
        4,
        'Cài đặt môi trường lập trình cho máy Windows mới + Hướng dẫn cài đặt môi trường lập trình cho Windows',
        'Hướng dẫn chi tiết từng bước để cài đặt môi trường lập trình trên máy Windows mới, bao gồm các công cụ cần thiết.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-21 11:15:00',
        '2026-07-21 11:15:00'
    ),
    (
        100,
        131,
        4,
        'Cài đặt Visual Studio Code + Cài đặt Git + Cài đặt Node.js + Thiết lập terminal + Cài đặt extensions cho Visual Studio Code + Cấu hình PATH + Kiểm tra cài đặt thành công + Cài đặt và cấu hình Apache +',
        'Hướng dẫn chi tiết cách cài đặt Visual Studio Code, một công cụ lập trình phổ biến.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-05 12:00:00',
        '2026-07-05 12:00:00'
    ),
    (
        101,
        132,
        4,
        'Giới thiệu về CORS Policy + Khái niệm nguồn gốc (Origin)',
        'Giới thiệu về chính sách CORS và tầm quan trọng của nó trong việc bảo mật dữ liệu giữa các nguồn gốc khác nhau.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-22 09:00:00',
        '2026-07-22 09:00:00'
    ),
    (
        102,
        133,
        4,
        'Chính sách CORS + Access-Control-Allow-Origin',
        'Mô tả chính sách CORS và cách nó bảo vệ dữ liệu giữa các nguồn gốc khác nhau.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-07 19:00:00',
        '2026-07-07 19:00:00'
    ),
    (
        103,
        134,
        4,
        'Xử lý lỗi CORS + Access-Control-Allow-Origin + Cấu hình CORS',
        'Cách xử lý các lỗi liên quan đến CORS khi thực hiện các yêu cầu từ nguồn gốc khác.',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-20 15:00:00',
        '2026-07-20 15:00:00'
    ),
    (
        104,
        135,
        4,
        'Tình huống thực tế với CORS + Thực tiễn sử dụng CORS + Tương lai của CORS',
        'Trong thực tế, khi làm việc với các API từ các nguồn khác nhau, việc hiểu và cấu hình CORS là rất quan trọng để đảm bảo rằng ứng dụng hoạt động đúng cách mà không gặp phải các lỗi liên quan đến chính ',
        '["DevTools","Windows","Programming"]',
        'active',
        '2026-07-05 16:00:00',
        '2026-07-05 16:00:00'
    ),
    (
        105,
        136,
        6,
        'Introduction to HTML + Setting Up the Development Environment',
        'An overview of HTML, its importance, and its role as the foundational building block of web development.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-24 14:15:00',
        '2026-07-24 14:15:00'
    ),
    (
        106,
        137,
        6,
        'Creating the Basic HTML Structure',
        'How to create a basic HTML document structure, including the doctype declaration, HTML tags, head, and body sections.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-09 10:00:00',
        '2026-07-09 10:00:00'
    ),
    (
        107,
        138,
        6,
        'Using HTML Tags',
        'Explanation of HTML tags, including header tags (H1-H6), paragraph tags (P), line breaks (BR), and horizontal rules (HR).',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-22 10:00:00',
        '2026-07-22 10:00:00'
    ),
    (
        108,
        139,
        6,
        'Adding Comments in HTML + Creating Hyperlinks',
        'How to add comments in HTML code for documentation purposes, which are not displayed in the browser.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-21 13:00:00',
        '2026-07-21 13:00:00'
    ),
    (
        109,
        140,
        6,
        'Inserting Images',
        'How to add images to a webpage using the IMG tag, including setting the source and alternative text attributes.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-20 16:00:00',
        '2026-07-20 16:00:00'
    ),
    (
        110,
        141,
        6,
        'Adding Audio to a Web Page',
        'Instructions on how to embed audio files in a webpage using the audio element, including attributes for controls and autoplay.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-10 10:00:00',
        '2026-07-10 10:00:00'
    ),
    (
        111,
        142,
        6,
        'Embedding Videos',
        'How to add video content to a webpage using the video element, including attributes for controls and multiple sources.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-27 17:15:00',
        '2026-07-27 17:15:00'
    ),
    (
        112,
        143,
        6,
        'Text Formatting Tags + Creating Lists in HTML',
        'Overview of various text formatting tags in HTML, including bold, italic, and other text styles.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-23 08:00:00',
        '2026-07-23 08:00:00'
    ),
    (
        113,
        144,
        6,
        'Creating Tables in HTML',
        'Instructions on how to create tables in HTML, including table rows, headers, and data cells.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-06-30 18:15:00',
        '2026-07-06 01:00:00'
    ),
    (
        114,
        145,
        6,
        'Adding Color to Web Pages',
        'Introduction to CSS for adding color to web pages, including inline styles for background and font colors.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-11 10:00:00',
        '2026-07-11 10:00:00'
    ),
    (
        115,
        146,
        6,
        'Understanding Span and Div Tags',
        'Explanation of the span and div tags in HTML, their purposes, and how to use them for styling.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-01 19:15:00',
        '2026-07-06 03:00:00'
    ),
    (
        116,
        147,
        6,
        'Using Meta Tags',
        'Overview of meta tags in HTML, their purpose for providing metadata about the webpage, and common examples.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-06 04:00:00',
        '2026-07-06 04:00:00'
    ),
    (
        117,
        148,
        6,
        'Embedding iFrames',
        'How to use iFrames to embed other web pages or documents within an HTML document.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-02 20:15:00',
        '2026-07-06 05:00:00'
    ),
    (
        118,
        149,
        6,
        'Creating Buttons in HTML',
        'Instructions on how to create buttons using HTML, including attributes for linking and styling.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-12 10:00:00',
        '2026-07-12 10:00:00'
    ),
    (
        119,
        150,
        6,
        'Building Forms in HTML',
        'Comprehensive guide on creating forms in HTML, including input types, labels, and form attributes.',
        '["HTML","CSS","WebDev"]',
        'active',
        '2026-07-03 21:15:00',
        '2026-07-06 07:00:00'
    ),
    (
        120,
        151,
        6,
        'Introduction to Node.js',
        'An overview of Node.js as a runtime environment for executing JavaScript outside of a browser, its purpose in building backend services, and its advantages over other frameworks.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-21 15:00:00',
        '2026-07-21 15:00:00'
    ),
    (
        121,
        152,
        6,
        'Node.js Architecture',
        'Explanation of what a runtime environment is, how Node.js uses the V8 engine, and the differences between browser and Node.js environments.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-04 10:15:00',
        '2026-07-06 09:00:00'
    ),
    (
        122,
        153,
        6,
        'Asynchronous Nature of Node.js',
        'Understanding the non-blocking architecture of Node.js through a restaurant metaphor, comparing it to synchronous architecture and its implications for scalability.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        123,
        154,
        6,
        'Installing Node.js',
        'Step-by-step guide on how to install Node.js on different operating systems and verify the installation.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-05 11:15:00',
        '2026-07-06 11:00:00'
    ),
    (
        124,
        155,
        6,
        'Creating Your First Node.js Application',
        'Demonstration of creating a simple Node.js application, including writing JavaScript code and executing it using Node.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-23 10:00:00',
        '2026-07-23 10:00:00'
    ),
    (
        125,
        156,
        6,
        'Node.js Module System',
        'Introduction to the module system in Node.js, explaining the concept of modules, their scope, and how to create and use them.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-06 12:15:00',
        '2026-07-06 13:00:00'
    ),
    (
        126,
        157,
        6,
        'Working with Global Objects in Node.js',
        'Discussion on global objects in Node.js, how they differ from browser global objects, and the implications for variable scope.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-14 10:00:00',
        '2026-07-14 10:00:00'
    ),
    (
        127,
        158,
        6,
        'Event Handling in Node.js',
        'Explaining the concept of events in Node.js, how to create and handle events using the EventEmitter class.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-07 13:15:00',
        '2026-07-07 13:15:00'
    ),
    (
        128,
        159,
        6,
        'Building an HTTP Server',
        'Creating a simple HTTP server using Node.js, handling requests, and sending responses, including routing examples.',
        '["NodeJS","JavaScript","Backend"]',
        'active',
        '2026-07-06 16:00:00',
        '2026-07-06 16:00:00'
    ),
    (
        129,
        160,
        5,
        'Introduction to JavaScript + Capabilities of JavaScript + JavaScript Execution Environments',
        'An overview of JavaScript, its popularity, and job opportunities.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-08 14:15:00',
        '2026-07-08 14:15:00'
    ),
    (
        130,
        161,
        5,
        'ECMAScript and ES6 Features + Setting Up Development Environment',
        'Introduction to ECMAScript, its specifications, and the features introduced in ES6.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-15 10:00:00',
        '2026-07-15 10:00:00'
    ),
    (
        131,
        162,
        5,
        'Creating and Linking JavaScript Files',
        'Demonstrates how to create an HTML file and link it to a JavaScript file.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-09 15:15:00',
        '2026-07-09 15:15:00'
    ),
    (
        132,
        163,
        5,
        'Understanding Variables',
        'Explains the concept of variables in JavaScript, including declaration and initialization.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-21 17:00:00',
        '2026-07-21 17:00:00'
    ),
    (
        133,
        164,
        5,
        'Constants in JavaScript + Primitive Data Types',
        'Discusses the use of constants and the difference between variables and constants.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-10 16:15:00',
        '2026-07-10 16:15:00'
    ),
    (
        134,
        165,
        5,
        'Dynamic Typing in JavaScript',
        'Explains the concept of dynamic typing and how variable types can change at runtime.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-16 10:00:00',
        '2026-07-16 10:00:00'
    ),
    (
        135,
        166,
        5,
        'Introduction to Objects',
        'Defines objects in JavaScript and how they can be used to group related variables.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-11 17:15:00',
        '2026-07-11 17:15:00'
    ),
    (
        136,
        167,
        5,
        'Accessing Object Properties',
        'Demonstrates how to access and modify object properties using dot and bracket notation.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-23 12:00:00',
        '2026-07-23 12:00:00'
    ),
    (
        137,
        168,
        5,
        'Working with Arrays',
        'Introduces arrays, how to create them, and their dynamic nature in JavaScript.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-12 18:15:00',
        '2026-07-12 18:15:00'
    ),
    (
        138,
        169,
        5,
        'Functions in JavaScript',
        'Explains the concept of functions, how to declare them, and their parameters and arguments.',
        '["JavaScript","ES6","Programming"]',
        'active',
        '2026-07-17 10:00:00',
        '2026-07-17 10:00:00'
    ),
    (
        139,
        170,
        22,
        'Introduction to Critical Thinking + Current Educational Challenges + The Importance of Questioning',
        'The speaker introduces critical thinking as an essential skill for the 21st century, emphasizing its importance for young people to adapt to the 4.0 industrial revolution.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-13 19:15:00',
        '2026-07-13 19:15:00'
    ),
    (
        140,
        171,
        22,
        'Consequences of Lack of Critical Thinking + Skills Needed for the Future',
        'Exploration of the serious implications for young people who do not develop critical thinking skills, particularly in the context of AI and automation.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-07 04:00:00',
        '2026-07-07 04:00:00'
    ),
    (
        141,
        172,
        22,
        'Understanding Critical Thinking + The Process of Critical Thinking',
        'Definition and explanation of critical thinking, emphasizing its role in analyzing, evaluating, and synthesizing information.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-14 20:15:00',
        '2026-07-14 20:15:00'
    ),
    (
        142,
        173,
        22,
        'Describing and Articulating Thoughts + Self-Reflection and Acceptance of Mistakes',
        'The need to articulate thoughts clearly to avoid misunderstandings and to validate one''s reasoning.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-18 10:00:00',
        '2026-07-18 10:00:00'
    ),
    (
        143,
        174,
        22,
        'Acquiring Knowledge in the Digital Age',
        'How to effectively acquire knowledge and information in the context of modern technology and its implications.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-15 21:15:00',
        '2026-07-15 21:15:00'
    ),
    (
        144,
        175,
        22,
        'Challenges in Information Processing + Encouragement to Take Action + Application of Critical Thinking',
        'The speaker addresses the difficulties young people face in processing and understanding information in the digital age.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-07 08:00:00',
        '2026-07-07 08:00:00'
    ),
    (
        145,
        176,
        22,
        'Analyzing Information + Understanding Critical Thinking',
        'The process of analyzing information critically to determine its validity and relevance.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-16 10:15:00',
        '2026-07-16 10:15:00'
    ),
    (
        146,
        177,
        22,
        'Synthesis and Creativity in Critical Thinking + The Importance of Internalizing Knowledge + The Role of Critical Thinking in the Modern World',
        'The importance of synthesizing information and using creativity to develop new ideas and solutions.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-19 10:00:00',
        '2026-07-19 10:00:00'
    ),
    (
        147,
        178,
        22,
        'AI and Human Skills + Emotional Intelligence in Communication',
        'The speaker discusses the relationship between AI development and the need for human skills such as critical thinking and creativity.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-17 11:15:00',
        '2026-07-17 11:15:00'
    ),
    (
        148,
        179,
        22,
        'Applying Critical Thinking in Dialogue',
        'Strategies for applying critical thinking in conversations without making others uncomfortable.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-23 14:00:00',
        '2026-07-23 14:00:00'
    ),
    (
        149,
        180,
        22,
        'Overcoming Challenges in Group Work',
        'Advice on improving group dynamics and collaboration through critical thinking and respect for diverse opinions.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-18 12:15:00',
        '2026-07-18 12:15:00'
    ),
    (
        150,
        181,
        22,
        'The Value of Personal Reflection + The Role of Emotional Intelligence in Communication',
        'Encouragement for individuals to reflect on their own thoughts and contributions before engaging with others.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-20 10:00:00',
        '2026-07-20 10:00:00'
    ),
    (
        151,
        182,
        22,
        'The Future of Learning and Adaptation + Collaboration and Teamwork in Critical Thinking',
        'The necessity of continuous learning and adaptation in a rapidly changing world, emphasizing the importance of critical thinking.',
        '["CriticalThinking","SoftSkills","Education"]',
        'active',
        '2026-07-19 13:15:00',
        '2026-07-19 13:15:00'
    ),
    (
        152,
        183,
        23,
        'Introduction to Project Management + History of Project Management + Project Management Lifecycle',
        'An overview of project management, its importance, and the objectives of the tutorial.',
        '["ProjectManagement","Agile","SoftSkills"]',
        'active',
        '2026-07-25 09:00:00',
        '2026-07-25 09:00:00'
    ),
    (
        153,
        184,
        23,
        'Project Initiation Phase + Project Planning Phase + Project Execution Phase',
        'Details on the initiation phase, focusing on feasibility, project charter creation, and stakeholder involvement.',
        '["ProjectManagement","Agile","SoftSkills"]',
        'active',
        '2026-07-20 14:15:00',
        '2026-07-20 14:15:00'
    ),
    (
        154,
        185,
        23,
        'Monitoring and Control Phase + Project Closure Phase + Project Management Knowledge Areas + Project Management Methodologies',
        'Overview of the monitoring and control phase, focusing on quality assurance, budget management, and project tracking.',
        '["ProjectManagement","Agile","SoftSkills"]',
        'active',
        '2026-07-21 10:00:00',
        '2026-07-21 10:00:00'
    ),
    (
        155,
        186,
        23,
        'Project Management Tools',
        'Discussion on the importance of project management tools and their features that aid in project execution.',
        '["ProjectManagement","Agile","SoftSkills"]',
        'active',
        '2026-07-21 15:15:00',
        '2026-07-21 15:15:00'
    ),
    (
        156,
        187,
        23,
        'Project Management Certifications',
        'Overview of popular project management certifications available in 2021 and their significance in career advancement.',
        '["ProjectManagement","Agile","SoftSkills"]',
        'active',
        '2026-07-07 20:00:00',
        '2026-07-07 20:00:00'
    ),
    (
        157,
        188,
        23,
        'Demo: Creating a Project Plan with Asana',
        'A practical demonstration of using Asana to create a project plan, covering essential steps and features.',
        '["ProjectManagement","Agile","SoftSkills"]',
        'active',
        '2026-07-22 16:15:00',
        '2026-07-22 16:15:00'
    ),
    (
        158,
        189,
        24,
        'Introduction to Music Theory for Guitar Players + The First Assignment: Note Cards',
        'The speaker shares their personal journey with music theory and introduces the concept of using note cards to learn music theory fundamentals.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-22 10:00:00',
        '2026-07-22 10:00:00'
    ),
    (
        159,
        190,
        24,
        'Creating Major Triads + Understanding Major Triads and Chords',
        'The speaker guides the audience through writing out major triads on the note cards, explaining the notes associated with each card.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-23 17:15:00',
        '2026-07-23 17:15:00'
    ),
    (
        160,
        191,
        24,
        'Memorizing Sharps and Flats + The Circle of Fifths and Key Signatures + Introduction to Chord Theory',
        'The speaker emphasizes the importance of memorizing sharps and flats using acronyms and explains how they relate to major chords.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-23 16:00:00',
        '2026-07-23 16:00:00'
    ),
    (
        161,
        192,
        24,
        'Understanding Chord Inversions + Playing Chord Inversions on Guitar',
        'An explanation of chord inversions, detailing root position, first inversion, and second inversion of the G major chord.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-22 19:00:00',
        '2026-07-22 19:00:00'
    ),
    (
        162,
        193,
        24,
        'Transitioning Between Chords',
        'Discussion on how first inversion chords resolve and how to transition smoothly between chords like G over B and C.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-23 10:00:00',
        '2026-07-23 10:00:00'
    ),
    (
        163,
        194,
        24,
        'Exploring Second Inversion Chords',
        'Explanation of second inversion chords, their characteristics, and how they resolve to the root chord.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-25 19:15:00',
        '2026-07-25 19:15:00'
    ),
    (
        164,
        195,
        24,
        'Building Major and Minor Chords',
        'How to construct major and minor chords from the G major scale, including examples of A minor and B minor chords.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-25 11:00:00',
        '2026-07-25 11:00:00'
    ),
    (
        165,
        196,
        24,
        'Understanding the Circle of Fifths + Recap of Music Theory Concepts',
        'Introduction to the circle of fifths and its application in identifying key signatures and chord relationships.',
        '["MusicTheory","Guitar","Music"]',
        'active',
        '2026-07-24 14:00:00',
        '2026-07-24 14:00:00'
    ),
    (
        166,
        197,
        20,
        'Introduction to Video Editing with CapCut + Video Editing Workflow Steps',
        'An overview of the video editing process using CapCut, including the importance of understanding the software for effective video creation.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-07-04 10:00:00',
        '2026-07-08 06:00:00'
    ),
    (
        167,
        198,
        20,
        'Understanding the Timeline and Layer Management + Masking Techniques in Video Editing',
        'An explanation of how to manage layers within the timeline, including moving and adjusting layers for effective video editing.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-07-27 21:15:00',
        '2026-07-27 21:15:00'
    ),
    (
        168,
        199,
        20,
        'Color Grading Essentials + Introduction to CapCut Video Editing',
        'A complete breakdown of color grading techniques to enhance the visual appeal of videos.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-07-08 08:00:00',
        '2026-07-08 08:00:00'
    ),
    (
        169,
        200,
        20,
        'Masking Techniques in CapCut + Using Multiple Masks + Adjusting Video Frames + Creating Fade Effects',
        'A detailed explanation of how to create and adjust masks using the pen tool for precise video editing.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-06-30 10:15:00',
        '2026-07-08 09:00:00'
    ),
    (
        170,
        201,
        20,
        'Layering Effects + Advanced Transitions and Effects',
        'Explaining how to layer effects in CapCut and adjust their parameters for desired outcomes.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-07-05 10:00:00',
        '2026-07-08 10:00:00'
    ),
    (
        171,
        202,
        20,
        'Speed Adjustment Techniques + Audio Mixing Fundamentals',
        'Methods for adjusting video speed and duration to create dynamic content.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-07-01 11:15:00',
        '2026-07-08 11:00:00'
    ),
    (
        172,
        203,
        20,
        'Adding Background Music + Creating Subtitles Automatically',
        'Instructions on how to add and adjust background music in video projects.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-07-23 18:00:00',
        '2026-07-23 18:00:00'
    ),
    (
        173,
        204,
        20,
        'Finalizing and Rendering Videos',
        'Steps to render videos in CapCut, including settings for quality and format.',
        '["CapCut","VideoEditing","CreatorEconomy"]',
        'active',
        '2026-07-02 12:15:00',
        '2026-07-08 13:00:00'
    ),
    (
        174,
        205,
        21,
        'Introduction to Premiere Pro Basics + Setting Up Project Files',
        'Overview of the tutorial''s goals and structure, focusing on essential features for beginners.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-06 10:00:00',
        '2026-07-08 14:00:00'
    ),
    (
        175,
        206,
        21,
        'Premiere Pro Workspace Setup',
        'Guide to configuring Premiere Pro settings for optimal performance and user experience.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-03 13:15:00',
        '2026-07-08 15:00:00'
    ),
    (
        176,
        207,
        21,
        'Importing Media and Creating a Sequence',
        'Steps to import media files and create a sequence for video editing.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-25 13:00:00',
        '2026-07-25 13:00:00'
    ),
    (
        177,
        208,
        21,
        'Timeline Fundamentals: Cutting and Trimming Clips',
        'Techniques for arranging clips on the timeline, including cutting and trimming methods.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-04 14:15:00',
        '2026-07-08 17:00:00'
    ),
    (
        178,
        209,
        21,
        'Adding Transitions Between Clips',
        'How to apply and customize transitions to enhance video flow.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-07 10:00:00',
        '2026-07-08 18:00:00'
    ),
    (
        179,
        210,
        21,
        'Incorporating Text Titles',
        'Instructions for adding and customizing text titles in the video.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-05 15:15:00',
        '2026-07-08 19:00:00'
    ),
    (
        180,
        211,
        21,
        'Audio Adjustment Techniques',
        'Methods for adjusting audio levels and adding sound effects to enhance the video.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-08 20:00:00',
        '2026-07-08 20:00:00'
    ),
    (
        181,
        212,
        21,
        'Exporting Your Final Project + Color Correction and Grading Basics',
        'Steps to export the completed video project with the desired settings.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-06 16:15:00',
        '2026-07-08 21:00:00'
    ),
    (
        182,
        213,
        21,
        'Keyframing for Motion Graphics',
        'How to use keyframing to create animations and enhance visual engagement.',
        '["PremierePro","VideoEditing","CreativeTools"]',
        'active',
        '2026-07-07 14:30:00',
        '2026-07-08 22:00:00'
    ),
    (
        183,
        214,
        12,
        'Giới thiệu về Lightroom + Nguyên tắc hoạt động của Lightroom + Chọn và nhập hình ảnh',
        'Nội dung này giới thiệu về Lightroom, lịch sử phát triển và các phiên bản của phần mềm này, cùng với những lợi ích mà nó mang lại cho người dùng.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-07 17:15:00',
        '2026-07-08 23:00:00'
    ),
    (
        184,
        215,
        12,
        'Quản lý thư viện hình ảnh + Xuất hình ảnh + Chỉnh sửa hình ảnh cơ bản + Công cụ khử mắt đỏ và chỉnh màu',
        'Giới thiệu về cách quản lý thư viện hình ảnh trong Lightroom, bao gồm việc tạo collection và tổ chức hình ảnh.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-09 00:00:00',
        '2026-07-09 00:00:00'
    ),
    (
        185,
        216,
        12,
        'Giới thiệu về công cụ AI trong Lightroom + Chọn chủ thể trong hình ảnh + Chọn vùng trời và xóa nền + Công cụ chọn vùng không gian + Sử dụng công cụ Blood để tạo mặt nạ',
        'Phân tích về công cụ AI trong Lightroom và cách nó giúp tiết kiệm thời gian trong quá trình hậu kỳ.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-08 18:15:00',
        '2026-07-09 01:00:00'
    ),
    (
        186,
        217,
        12,
        'Công cụ Lainer Gradient + Công cụ Radio Gradient + Công cụ Color Ren và Luminon Ren',
        'Cách sử dụng công cụ Lainer Gradient để tạo lớp chuyển màu từ đậm đến nhẹ trong hình ảnh.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-09 10:00:00',
        '2026-07-09 10:00:00'
    ),
    (
        187,
        218,
        12,
        'Cân bằng trắng và các chế độ màu + Công cụ chỉnh sáng tối',
        'Giải thích về cách sử dụng công cụ cân bằng trắng và các chế độ màu sắc khác nhau trong Lightroom.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-09 19:15:00',
        '2026-07-09 19:15:00'
    ),
    (
        188,
        219,
        12,
        'Công cụ tăng giảm chi tiết + Công cụ điều chỉnh màu sắc + Công cụ tông cất',
        'Hướng dẫn cách sử dụng công cụ để tăng hoặc giảm chi tiết trong hình ảnh.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-11 08:00:00',
        '2026-07-11 08:00:00'
    ),
    (
        189,
        220,
        12,
        'Công cụ vòng tròn điều chỉnh + Công cụ chỉnh sửa màu sắc nâng cao',
        'Hướng dẫn cách sử dụng công cụ vòng tròn để điều chỉnh độ sáng tối và màu sắc cho nhiều vùng khác nhau.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-10 20:15:00',
        '2026-07-10 20:15:00'
    ),
    (
        190,
        221,
        12,
        'Giới thiệu về nguyên lý sử dụng Lightroom + Công cụ điều chỉnh độ sáng và độ tương phản + Công cụ khử noise',
        'Bắt đầu với các nguyên lý cơ bản trong Lightroom và cách sử dụng các công cụ chỉnh sửa hình ảnh.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-08 14:30:00',
        '2026-07-09 06:00:00'
    ),
    (
        191,
        222,
        12,
        'Sử dụng công cụ Transform + Sử dụng công cụ Crop và Straighten + Công cụ crop và điều chỉnh hình ảnh + Tổng kết và hướng dẫn sử dụng',
        'Hướng dẫn cách sử dụng công cụ Transform để chỉnh sửa hình ảnh bị méo hoặc nghiêng.',
        '["Lightroom","Photography","Editing"]',
        'active',
        '2026-07-11 21:15:00',
        '2026-07-11 21:15:00'
    ),
    (
        192,
        223,
        13,
        'Introduction to Graphic Design Basics + Setting Up the Workspace in Photoshop',
        'The speaker introduces the course on graphic design, emphasizing the importance of starting from the basics to build a strong foundation.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-27 10:00:00',
        '2026-07-27 10:00:00'
    ),
    (
        193,
        224,
        13,
        'Creating a New Document + Understanding Image Resolution',
        'Step-by-step guide on how to create a new document in Photoshop, including selecting dimensions and resolution.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-12 10:15:00',
        '2026-07-12 10:15:00'
    ),
    (
        194,
        225,
        13,
        'Choosing Color Modes + Using Layers in Design',
        'Discussion on different color modes in Photoshop, including RGB for online use and CMYK for print, and their implications for design.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-11 10:00:00',
        '2026-07-11 10:00:00'
    ),
    (
        195,
        226,
        13,
        'Chọn Mẫu Màu Trong Thiết Kế Đồ Họa + Phân Biệt Các Mẫu Màu + Quy Trình Chọn Mẫu Màu',
        'Giới thiệu về cách chọn mẫu màu trong thiết kế đồ họa, bao gồm các bước và nguyên tắc cơ bản để lựa chọn màu sắc phù hợp.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-13 11:15:00',
        '2026-07-13 11:15:00'
    ),
    (
        196,
        227,
        13,
        'Cách Đổ Màu Trong Thiết Kế + Nguyên Tắc Sử Dụng Màu Sắc',
        'Chi tiết về cách đổ màu trong thiết kế đồ họa, bao gồm các công cụ và kỹ thuật sử dụng.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-09 12:00:00',
        '2026-07-09 12:00:00'
    ),
    (
        197,
        228,
        13,
        'Tạo Bố Cục Trong Thiết Kế + Sử Dụng Hình Dạng Trong Thiết Kế',
        'Hướng dẫn cách tạo bố cục trong thiết kế đồ họa, bao gồm việc sử dụng hình dạng và không gian.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-14 12:15:00',
        '2026-07-14 12:15:00'
    ),
    (
        198,
        229,
        13,
        'Kỹ Thuật Tạo Hình Trong Thiết Kế',
        'Giới thiệu các kỹ thuật tạo hình trong thiết kế đồ họa, bao gồm việc sử dụng các công cụ và phần mềm.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-09 14:30:00',
        '2026-07-09 14:30:00'
    ),
    (
        199,
        230,
        13,
        'Quản Lý Đối Tượng Trong Thiết Kế',
        'Hướng dẫn cách quản lý và sắp xếp các đối tượng trong thiết kế, bao gồm việc sử dụng các lớp và nhóm.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-15 13:15:00',
        '2026-07-15 13:15:00'
    ),
    (
        200,
        231,
        13,
        'Xuất Bản Thiết Kế',
        'Chi tiết về quy trình xuất bản thiết kế, bao gồm các định dạng file và cách lưu trữ.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-25 17:00:00',
        '2026-07-25 17:00:00'
    ),
    (
        201,
        232,
        13,
        'Creating Layouts with Shapes + Tạo Hiệu Ứng Trong Thiết Kế',
        'The speaker explains how to create layouts using different shapes and the importance of understanding these shapes for effective design.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-16 14:15:00',
        '2026-07-16 14:15:00'
    ),
    (
        202,
        233,
        13,
        'Kết Luận và Bài Tập Thực Hành',
        'Tóm tắt các kiến thức đã học và đưa ra bài tập thực hành để củng cố kỹ năng thiết kế.',
        '["GraphicDesign","Photoshop","Design"]',
        'active',
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        203,
        234,
        14,
        'Understanding Exposure + The Three Camera Settings for Exposure + ISO Explained',
        'This topic introduces the concept of exposure in photography, explaining its importance and how it affects the brightness of images.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-17 15:15:00',
        '2026-07-17 15:15:00'
    ),
    (
        204,
        235,
        14,
        'Understanding Aperture + Demonstrating Aperture Effects',
        'An explanation of aperture, its function in controlling light entry, and how it is measured with F-numbers.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-27 12:00:00',
        '2026-07-27 12:00:00'
    ),
    (
        205,
        236,
        14,
        'Creative Use of Shutter Speed',
        'Exploration of creative options with shutter speed, including freezing and blurring motion, and how to choose the right speed.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-12 08:00:00',
        '2026-07-12 08:00:00'
    ),
    (
        206,
        237,
        14,
        'Understanding Camera Exposure + How Cameras Measure Light',
        'This topic introduces the concept of camera exposure and the common issues faced by photographers when using automatic modes. It sets the stage for understanding how to achieve perfect exposures.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-10 14:30:00',
        '2026-07-10 14:30:00'
    ),
    (
        207,
        238,
        14,
        'Common Exposure Problems + Solutions for Better Exposure + Metering Modes and Exposure Compensation',
        'The speaker discusses common exposure issues, such as underexposure and overexposure, and how they relate to the camera''s light measurement.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-19 17:15:00',
        '2026-07-19 17:15:00'
    ),
    (
        208,
        239,
        14,
        'The Concept of Stops in Photography + Dynamic and Tonal Ranges',
        'An explanation of what ''stops'' mean in photography, how they relate to light exposure, and their significance in adjusting camera settings.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-10 00:00:00',
        '2026-07-10 00:00:00'
    ),
    (
        209,
        240,
        14,
        'Techniques to Control Light + Understanding Histograms',
        'The speaker discusses various techniques to control light in photography, including the use of filters and HDR photography.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-20 18:15:00',
        '2026-07-20 18:15:00'
    ),
    (
        210,
        241,
        14,
        'Analyzing Histograms for Proper Exposure',
        'This section dives deeper into analyzing histograms to determine if an image is properly exposed, including practical examples.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-15 10:00:00',
        '2026-07-15 10:00:00'
    ),
    (
        211,
        242,
        14,
        'Transitioning to Manual Mode',
        'The speaker discusses the importance of understanding camera settings and introduces the concept of shooting in manual mode for full creative control.',
        '["Photography","Exposure","Composition"]',
        'active',
        '2026-07-12 09:00:00',
        '2026-07-12 09:00:00'
    ),
    (
        212,
        243,
        15,
        'Introduction to Figma and Course Overview + Creating a Desktop Frame',
        'The speaker introduces Figma as a leading design tool and outlines the goals of the crash course, emphasizing hands-on learning and speed.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-25 19:00:00',
        '2026-07-25 19:00:00'
    ),
    (
        213,
        244,
        15,
        'Understanding Color Properties + Adding Structure with Lines and Dividers',
        'Explanation of fill and stroke properties in Figma, including how to use hex and HSB color systems for better color management.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-22 20:15:00',
        '2026-07-22 20:15:00'
    ),
    (
        214,
        245,
        15,
        'Using Rulers and Grids for Layout + Working with Text in Figma',
        'Instructions on how to use rulers and grids in Figma to create a structured layout, including adding and adjusting grid systems.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-16 10:00:00',
        '2026-07-16 10:00:00'
    ),
    (
        215,
        246,
        15,
        'Creating Shapes and Icons',
        'Demonstration of adding shapes and icons to the design, including using plugins to find and insert icons efficiently.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-06-30 11:00:00',
        '2026-07-10 07:00:00'
    ),
    (
        216,
        247,
        15,
        'Implementing Gradients and Shadows',
        'Explanation of how to apply gradients and shadows to elements in Figma, enhancing the visual appeal of the design.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-27 14:00:00',
        '2026-07-27 14:00:00'
    ),
    (
        217,
        248,
        15,
        'Utilizing Auto Layout for Flexibility',
        'Introduction to auto layout in Figma, demonstrating how to create responsive designs that adjust automatically to content changes.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-24 10:15:00',
        '2026-07-24 10:15:00'
    ),
    (
        218,
        249,
        15,
        'Creating Components for Reusability',
        'Guide on how to create components in Figma for consistent design elements across multiple screens, including managing variants.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-17 10:00:00',
        '2026-07-17 10:00:00'
    ),
    (
        219,
        250,
        15,
        'Prototyping and Interaction Design',
        'Overview of prototyping features in Figma, including setting up hover states and interactions for a more dynamic user experience.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-25 11:15:00',
        '2026-07-25 11:15:00'
    ),
    (
        220,
        251,
        15,
        'Dev Handoff and Collaboration',
        'Discussion on the process of handing off designs to developers, including the use of Dev Mode and the importance of consistency in design.',
        '["Figma","UIUX","Design"]',
        'active',
        '2026-07-10 12:00:00',
        '2026-07-10 12:00:00'
    ),
    (
        221,
        252,
        19,
        'Introduction to Power BI and Its Importance + Understanding Power BI''s Role in Data Analysis + Comparison with Other BI Tools',
        'An overview of Power BI as a critical tool for data analysis and its relevance in the industry.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-06-30 12:00:00',
        '2026-07-10 13:00:00'
    ),
    (
        222,
        253,
        19,
        'Components of Power BI + Data Transformation with Power Query',
        'Breakdown of the three main components of Power BI: Power BI Desktop, Power BI Service, and Power BI Mobile.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-13 08:00:00',
        '2026-07-13 08:00:00'
    ),
    (
        223,
        254,
        19,
        'Creating Data Models in Power BI + Using DAX for Data Analysis + Building Effective Dashboards',
        'Explains the concept of data models in Power BI and how to establish relationships between different data sets.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-26 18:00:00',
        '2026-07-26 18:00:00'
    ),
    (
        224,
        255,
        19,
        'Automating Data Refresh and Reporting + The Five-Step Process for Reporting + Practical Project Implementation + Introduction to Power BI Data Modeling',
        'Discusses the importance of setting up automated data refreshes and how to manage data flows in Power BI.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-10 16:00:00',
        '2026-07-10 16:00:00'
    ),
    (
        225,
        256,
        19,
        'Connecting Data to Power BI + Understanding Data Files and Their Structure',
        'A step-by-step guide on how to connect data sources to Power BI, including practical examples of data files.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-06-30 14:15:00',
        '2026-07-10 17:00:00'
    ),
    (
        226,
        257,
        19,
        'Using AI for Data Analysis + Creating Analytical Dashboards + Data Transformation Techniques',
        'Demonstrating how to utilize AI tools to analyze data files quickly and efficiently, enhancing productivity.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-19 10:00:00',
        '2026-07-19 10:00:00'
    ),
    (
        227,
        258,
        19,
        'Building Relationships in Data Models + Understanding Data Model Normalization + Introduction to Power BI Reporting Features',
        'Explaining how to establish relationships between different data tables in Power BI to ensure accurate data analysis.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-06-30 13:00:00',
        '2026-07-10 19:00:00'
    ),
    (
        228,
        259,
        19,
        'Creating Effective Dashboards',
        'This section discusses the process of creating dashboards in Power BI, including inserting text boxes and customizing visual elements for better presentation.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-13 09:00:00',
        '2026-07-13 09:00:00'
    ),
    (
        229,
        260,
        19,
        'Key Performance Indicators (KPIs) in Power BI + Using DAX for Calculating KPIs',
        'An overview of how to create and display KPIs in Power BI, including the calculation of order quantities and revenue metrics.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-02 16:15:00',
        '2026-07-10 21:00:00'
    ),
    (
        230,
        261,
        19,
        'Using AI to Assist with DAX + Understanding DAX Syntax + Creating Revenue Measures + Building Effective Dashboards',
        'Discussion on how AI can assist users in generating DAX code quickly and efficiently, while also stressing the importance of learning DAX fundamentals.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-20 10:00:00',
        '2026-07-20 10:00:00'
    ),
    (
        231,
        262,
        19,
        'Visualizing Data with Charts',
        'A step-by-step guide on how to create and customize various types of charts in Power BI to visualize data effectively.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-03 17:15:00',
        '2026-07-10 23:00:00'
    ),
    (
        232,
        263,
        19,
        'Visualizing Data with Charts',
        'An exploration of different chart types available in Power BI for visualizing data, including bar charts and donut charts, and how to customize their appearance.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-11 00:00:00',
        '2026-07-11 00:00:00'
    ),
    (
        233,
        264,
        19,
        'Finalizing the Dashboard',
        'A summary of the steps taken to finalize the dashboard, including adjustments to visual elements and ensuring all KPIs are accurately represented.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-06-30 14:00:00',
        '2026-07-11 01:00:00'
    ),
    (
        234,
        265,
        19,
        'Using Slicers for Data Filtering + Publishing and Sharing Reports',
        'Explanation of how to use slicers in Power BI to filter data dynamically based on user selections, enhancing interactivity in dashboards.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        235,
        266,
        19,
        'Refreshing Data in Power BI + Conclusion and Future Learning',
        'Discussion on how to set up data refresh in Power BI, including the necessary configurations to ensure data is up-to-date.',
        '["PowerBI","DataAnalytics","Dashboard"]',
        'active',
        '2026-07-05 19:15:00',
        '2026-07-11 03:00:00'
    ),
    (
        236,
        267,
        16,
        'Introduction to Promotion Strategies + Discount Techniques Overview',
        'The speaker introduces the importance of promotion strategies in increasing sales and customer engagement, particularly in the Vietnamese market.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-11 04:00:00',
        '2026-07-11 04:00:00'
    ),
    (
        237,
        268,
        16,
        'Using Psychological Pricing + Time-Based Discounts + Lucky Draw Promotions',
        'The speaker explains the technique of psychological pricing, such as setting prices just below a round number to make them appear more attractive.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-06 20:15:00',
        '2026-07-11 05:00:00'
    ),
    (
        238,
        269,
        16,
        'Customer-Driven Pricing + Happy Hour Promotions',
        'Introducing a program where customers can set their own prices within a certain range, fostering a sense of control and satisfaction.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-01 12:00:00',
        '2026-07-11 06:00:00'
    ),
    (
        239,
        270,
        16,
        'Flash Sales + Loyalty Programs',
        'Explaining flash sales as a strategy to create urgency and excitement among customers, often involving significant discounts for a limited time.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-06-30 15:00:00',
        '2026-07-11 07:00:00'
    ),
    (
        240,
        271,
        16,
        'Overview of Promotion Strategies + Discount Techniques + Sales Boosting Tactics',
        'An introduction to various promotion strategies that can enhance sales and customer engagement.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-27 18:00:00',
        '2026-07-27 18:00:00'
    ),
    (
        241,
        272,
        16,
        'Effective Upselling and Cross-Selling + Marketing Campaign Planning + Revenue Growth Tips + Bundling Products',
        'In-depth explanation of upselling and cross-selling methods to increase average order value.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-08 10:15:00',
        '2026-07-11 09:00:00'
    ),
    (
        242,
        273,
        16,
        'Promotional Partnerships + Promotional Strategies for New Products + Creating Value Through Promotions',
        'Leveraging partnerships with other businesses to offer joint promotions, enhancing value for customers without significant cost.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-23 10:00:00',
        '2026-07-23 10:00:00'
    ),
    (
        243,
        274,
        16,
        'Overcoming Fear of Starting + Introduction to Digital Marketing',
        'Discusses the common fears faced by beginners in digital marketing and how to overcome them.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-09 11:15:00',
        '2026-07-11 11:00:00'
    ),
    (
        244,
        275,
        16,
        'Differences Between Digital and Traditional Marketing',
        'Compares digital marketing with traditional marketing methods, highlighting key differences.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-01 13:00:00',
        '2026-07-11 12:00:00'
    ),
    (
        245,
        276,
        16,
        'The Role of Digital Marketing in Business + Types of Digital Marketing Strategies',
        'Discusses how digital marketing aids in research, planning, and execution of marketing strategies.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-06-30 16:00:00',
        '2026-07-11 13:00:00'
    ),
    (
        246,
        277,
        16,
        'Introduction to Digital Marketing Fundamentals + Understanding Traffic Management + Paid Advertising in Digital Marketing + On Media and Owned Media',
        'An overview of the essential concepts in digital marketing, emphasizing the importance of understanding basic knowledge and taking action.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-04 10:00:00',
        '2026-07-11 14:00:00'
    ),
    (
        247,
        278,
        16,
        'Understanding Customer Journey Stages + The Role of Multi-Channel Marketing + Customer Experience and Emotional Connection + Mapping Customer Actions',
        'Explains the different stages of the customer journey, including Z-mode, F-mode, and S-mode, and how customers interact with brands.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-11 13:15:00',
        '2026-07-11 15:00:00'
    ),
    (
        248,
        279,
        16,
        'Creating Engaging Content + Utilizing Social Media for Marketing + Post-Purchase Customer Engagement',
        'Discusses the importance of creating engaging content across various platforms to attract and retain customers.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-11 16:00:00',
        '2026-07-11 16:00:00'
    ),
    (
        249,
        280,
        16,
        'Building a Community Around Your Brand + Final Thoughts on Digital Marketing',
        'Discusses the importance of creating a community and engaging customers to foster brand loyalty.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-12 14:15:00',
        '2026-07-12 14:15:00'
    ),
    (
        250,
        281,
        16,
        'Content Marketing Essentials + Choosing the Right Content Format',
        'An introduction to content marketing, emphasizing the importance of delivering valuable content to attract and retain customers.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-01 14:00:00',
        '2026-07-11 18:00:00'
    ),
    (
        251,
        282,
        16,
        'Introduction to Digital Marketing + Choosing the Right Marketing Channels',
        'An overview of digital marketing and its importance in today''s business landscape.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-06-30 17:00:00',
        '2026-07-11 19:00:00'
    ),
    (
        252,
        283,
        16,
        'Understanding Customer Behavior + Measuring Marketing Effectiveness',
        'The importance of analyzing customer behavior to effectively target marketing efforts.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-11 20:00:00',
        '2026-07-11 20:00:00'
    ),
    (
        253,
        284,
        16,
        'Setting Clear Marketing Goals + Understanding the Customer Journey',
        'The necessity of establishing clear and measurable marketing goals to guide campaigns.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-14 16:15:00',
        '2026-07-14 16:15:00'
    ),
    (
        254,
        285,
        16,
        'Content Types and Delivery Methods + Continuous Improvement in Marketing Strategies + Measuring Marketing Effectiveness',
        'Discussion on various content types and the best methods for delivering them to the audience.',
        '["DigitalMarketing","Marketing","Promotions"]',
        'active',
        '2026-07-11 22:00:00',
        '2026-07-11 22:00:00'
    ),
    (
        255,
        286,
        17,
        'Introduction to Copywriting + Three Rules of Effective Copy + Visualizing Copy',
        'The speaker introduces the importance of copywriting as a fundamental skill in marketing, emphasizing its role in effective communication.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-07-15 17:15:00',
        '2026-07-15 17:15:00'
    ),
    (
        256,
        287,
        17,
        'Falsifiability in Copy + Uniqueness in Copywriting',
        'Discussion on the significance of writing falsifiable statements in copy, enhancing credibility and engagement by presenting verifiable claims.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-07-01 15:00:00',
        '2026-07-12 00:00:00'
    ),
    (
        257,
        288,
        17,
        'The Importance of Learning Copywriting + Crafting Memorable Copy',
        'A compelling argument for why individuals should learn copywriting, highlighting its impact on marketing success and business growth.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-06-30 18:00:00',
        '2026-07-12 01:00:00'
    ),
    (
        258,
        289,
        17,
        'The Process of Writing Copy',
        'An overview of the speaker''s process for writing copy, including understanding the audience, having a clear message, and the iterative nature of writing.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-07-12 02:00:00',
        '2026-07-12 02:00:00'
    ),
    (
        259,
        290,
        17,
        'The Process of Writing an Ad + Understanding Conflict in Copywriting + The Interaction of Writing and Design',
        'The speaker shares their personal process of writing an ad, including the importance of multiple rewrites and the role of design in copywriting.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-07-17 19:15:00',
        '2026-07-17 19:15:00'
    ),
    (
        260,
        291,
        17,
        'Using Facts in Copywriting',
        'The speaker discusses the role of facts in copywriting, emphasizing their importance in grounding arguments and enhancing credibility.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-07-12 04:00:00',
        '2026-07-12 04:00:00'
    ),
    (
        261,
        292,
        17,
        'Engagement in Newsletters + Writing with Simplicity',
        'A discussion on the speaker''s approach to writing newsletters, focusing on engagement and the importance of connecting with the audience.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-07-02 13:00:00',
        '2026-07-12 05:00:00'
    ),
    (
        262,
        293,
        17,
        'The Importance of Structure in Writing + The Impact of AI on Writing',
        'A discussion on the significance of structure in writing, including how to break down ideas into manageable parts for clarity and impact.',
        '["Copywriting","Marketing","ContentWriting"]',
        'active',
        '2026-07-01 16:00:00',
        '2026-07-12 06:00:00'
    ),
    (
        263,
        294,
        18,
        'Introduction to the Ultimate SEO Checklist + Tracking SEO Performance + Key SEO KPIs to Track',
        'Overview of the importance of SEO and the checklist that will be covered in the video.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-06-30 19:00:00',
        '2026-07-12 07:00:00'
    ),
    (
        264,
        295,
        18,
        'Running a Screaming Frog Crawl + Crawlability and Indexability of Your Website + Mobile Friendliness of Your Website + Website Loading Speed + SSL Certificate Verification',
        'Instructions on how to run a crawl using Screaming Frog and the importance of this step in the SEO checklist.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-12 08:00:00',
        '2026-07-12 08:00:00'
    ),
    (
        265,
        296,
        18,
        'Modern Website Design + Impact of Interstitial Pop-ups on SEO',
        'The impact of website design on user trust and SEO performance.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-20 10:15:00',
        '2026-07-20 10:15:00'
    ),
    (
        266,
        297,
        18,
        'Ad Placement and User Experience + Trust Pages on Your Website + Author Bios and Expertise',
        'The effects of aggressive ad placements on user engagement and SEO performance.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-12 10:00:00',
        '2026-07-12 10:00:00'
    ),
    (
        267,
        298,
        18,
        'Managing Non-Indexable Pages + Website Bloat and Pruning',
        'How to identify and manage pages that are non-indexable and their impact on SEO.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-02 14:00:00',
        '2026-07-12 11:00:00'
    ),
    (
        268,
        299,
        18,
        'Thin Content Issues + Outdated Content Management + Engagement Rate Analysis',
        'How to identify and address pages with thin content that may harm SEO.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-01 17:00:00',
        '2026-07-12 12:00:00'
    ),
    (
        269,
        300,
        18,
        'Title and H1 Tag Optimization + Spelling and Grammar Checks + Backlink Analysis for Traffic',
        'Ensuring each page has a unique title tag and H1 tag for better SEO.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-22 12:15:00',
        '2026-07-22 12:15:00'
    ),
    (
        270,
        301,
        18,
        'Redirect Management',
        'Managing redirect chains and ensuring efficient redirects for SEO.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-12 14:00:00',
        '2026-07-12 14:00:00'
    ),
    (
        271,
        302,
        18,
        'Duplicate Content Issues + Broken Links Management + AI Content Considerations',
        'Identifying and resolving duplicate content to improve SEO performance.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-23 13:15:00',
        '2026-07-23 13:15:00'
    ),
    (
        272,
        303,
        18,
        'H1 Tag and Heading Structure',
        'Ensuring proper structure of H1 and heading tags for SEO optimization.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-12 16:00:00',
        '2026-07-12 16:00:00'
    ),
    (
        273,
        304,
        18,
        'Keyword Placement in URLs and Meta Tags',
        'Discusses the significance of including target keywords in URLs, title tags, and meta descriptions.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-02 15:00:00',
        '2026-07-12 17:00:00'
    ),
    (
        274,
        305,
        18,
        'Content Originality and Quality',
        'Assessing content originality and ensuring it meets quality standards.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-01 18:00:00',
        '2026-07-12 18:00:00'
    ),
    (
        275,
        306,
        18,
        'Satisfying Search Intent',
        'Understanding and optimizing content to satisfy user search intent.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-25 15:15:00',
        '2026-07-25 15:15:00'
    ),
    (
        276,
        307,
        18,
        'Differentiating Content Strategy + Introduction to SEO Fundamentals + Effort Lever in Content Creation',
        'Creating unique content strategies that stand out from competitors.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-12 20:00:00',
        '2026-07-12 20:00:00'
    ),
    (
        277,
        308,
        18,
        'The Uniqueness and Data Lever + Updating Existing Content',
        'Explaining how using unique data and insights can help create original content that stands out in search results.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-26 16:15:00',
        '2026-07-26 16:15:00'
    ),
    (
        278,
        309,
        18,
        'Readability and User Experience + Visual Assets in Content',
        'The significance of content readability and structure in enhancing user experience and engagement.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-12 22:00:00',
        '2026-07-12 22:00:00'
    ),
    (
        279,
        310,
        18,
        'Creating Helpful Content + Originality in Content Creation',
        'Defining helpful content and how it should fulfill user intent to be considered valuable.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-02 16:00:00',
        '2026-07-12 23:00:00'
    ),
    (
        280,
        311,
        18,
        'Accuracy and Trustworthiness + Demonstrating Expertise',
        'Discussing the need for accurate information and citing sources to build trust with the audience.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-01 19:00:00',
        '2026-07-13 00:00:00'
    ),
    (
        281,
        312,
        18,
        'Demonstrating Expertise and Credibility',
        'Discusses the importance of showcasing expertise and providing credible sources to enhance content trustworthiness.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-13 01:00:00',
        '2026-07-13 01:00:00'
    ),
    (
        282,
        313,
        18,
        'Schema Markup and Technical SEO',
        'Explaining the role of schema markup in improving search visibility and click-through rates.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-13 02:00:00',
        '2026-07-13 02:00:00'
    ),
    (
        283,
        314,
        18,
        'Internal Linking Strategies',
        'The importance of internal linking for SEO and how to optimize it for better performance.',
        '["SEO","TechnicalSEO","ContentStrategy"]',
        'active',
        '2026-07-13 03:00:00',
        '2026-07-13 03:00:00'
    );

-- ============================================================================
-- FEED INTERACTIONS (180 Unique Likes, Saves, Shares across students)
-- ============================================================================
INSERT INTO
    feed_interactions (
        id,
        user_id,
        highlight_id,
        type,
        created_at
    )
VALUES (
        1,
        11,
        188,
        'like',
        '2026-07-12 08:00:00'
    ),
    (
        2,
        11,
        211,
        'save',
        '2026-07-13 09:00:00'
    ),
    (
        3,
        11,
        234,
        'share',
        '2026-07-14 10:00:00'
    ),
    (
        4,
        11,
        257,
        'like',
        '2026-07-15 11:00:00'
    ),
    (
        5,
        11,
        280,
        'save',
        '2026-07-16 12:00:00'
    ),
    (
        6,
        11,
        23,
        'share',
        '2026-07-17 13:00:00'
    ),
    (
        7,
        11,
        46,
        'like',
        '2026-07-18 14:00:00'
    ),
    (
        8,
        11,
        69,
        'save',
        '2026-07-19 15:00:00'
    ),
    (
        9,
        11,
        92,
        'share',
        '2026-07-20 16:00:00'
    ),
    (
        10,
        11,
        115,
        'like',
        '2026-07-21 17:00:00'
    ),
    (
        11,
        11,
        138,
        'save',
        '2026-07-22 18:00:00'
    ),
    (
        12,
        11,
        161,
        'share',
        '2026-07-23 19:00:00'
    ),
    (
        13,
        12,
        205,
        'like',
        '2026-07-13 08:00:00'
    ),
    (
        14,
        12,
        228,
        'save',
        '2026-07-14 09:00:00'
    ),
    (
        15,
        12,
        251,
        'share',
        '2026-07-15 10:00:00'
    ),
    (
        16,
        12,
        274,
        'like',
        '2026-07-16 11:00:00'
    ),
    (
        17,
        12,
        17,
        'save',
        '2026-07-17 12:00:00'
    ),
    (
        18,
        12,
        40,
        'share',
        '2026-07-18 13:00:00'
    ),
    (
        19,
        12,
        63,
        'like',
        '2026-07-19 14:00:00'
    ),
    (
        20,
        12,
        86,
        'save',
        '2026-07-20 15:00:00'
    ),
    (
        21,
        12,
        109,
        'share',
        '2026-07-21 16:00:00'
    ),
    (
        22,
        12,
        132,
        'like',
        '2026-07-22 17:00:00'
    ),
    (
        23,
        12,
        155,
        'save',
        '2026-07-23 18:00:00'
    ),
    (
        24,
        12,
        178,
        'share',
        '2026-07-24 19:00:00'
    ),
    (
        25,
        13,
        222,
        'like',
        '2026-07-14 08:00:00'
    ),
    (
        26,
        13,
        245,
        'save',
        '2026-07-15 09:00:00'
    ),
    (
        27,
        13,
        268,
        'share',
        '2026-07-16 10:00:00'
    ),
    (
        28,
        13,
        11,
        'like',
        '2026-07-17 11:00:00'
    ),
    (
        29,
        13,
        34,
        'save',
        '2026-07-18 12:00:00'
    ),
    (
        30,
        13,
        57,
        'share',
        '2026-07-19 13:00:00'
    ),
    (
        31,
        13,
        80,
        'like',
        '2026-07-20 14:00:00'
    ),
    (
        32,
        13,
        103,
        'save',
        '2026-07-21 15:00:00'
    ),
    (
        33,
        13,
        126,
        'share',
        '2026-07-22 16:00:00'
    ),
    (
        34,
        13,
        149,
        'like',
        '2026-07-23 17:00:00'
    ),
    (
        35,
        13,
        172,
        'save',
        '2026-07-24 18:00:00'
    ),
    (
        36,
        13,
        195,
        'share',
        '2026-07-25 19:00:00'
    ),
    (
        37,
        14,
        239,
        'like',
        '2026-07-15 08:00:00'
    ),
    (
        38,
        14,
        262,
        'save',
        '2026-07-16 09:00:00'
    ),
    (
        39,
        14,
        5,
        'share',
        '2026-07-17 10:00:00'
    ),
    (
        40,
        14,
        28,
        'like',
        '2026-07-18 11:00:00'
    ),
    (
        41,
        14,
        51,
        'save',
        '2026-07-19 12:00:00'
    ),
    (
        42,
        14,
        74,
        'share',
        '2026-07-20 13:00:00'
    ),
    (
        43,
        14,
        97,
        'like',
        '2026-07-21 14:00:00'
    ),
    (
        44,
        14,
        120,
        'save',
        '2026-07-22 15:00:00'
    ),
    (
        45,
        14,
        143,
        'share',
        '2026-07-23 16:00:00'
    ),
    (
        46,
        14,
        166,
        'like',
        '2026-07-24 17:00:00'
    ),
    (
        47,
        14,
        189,
        'save',
        '2026-07-25 18:00:00'
    ),
    (
        48,
        14,
        212,
        'share',
        '2026-07-26 19:00:00'
    ),
    (
        49,
        15,
        256,
        'like',
        '2026-07-16 08:00:00'
    ),
    (
        50,
        15,
        279,
        'save',
        '2026-07-17 09:00:00'
    ),
    (
        51,
        15,
        22,
        'share',
        '2026-07-18 10:00:00'
    ),
    (
        52,
        15,
        45,
        'like',
        '2026-07-19 11:00:00'
    ),
    (
        53,
        15,
        68,
        'save',
        '2026-07-20 12:00:00'
    ),
    (
        54,
        15,
        91,
        'share',
        '2026-07-21 13:00:00'
    ),
    (
        55,
        15,
        114,
        'like',
        '2026-07-22 14:00:00'
    ),
    (
        56,
        15,
        137,
        'save',
        '2026-07-23 15:00:00'
    ),
    (
        57,
        15,
        160,
        'share',
        '2026-07-24 16:00:00'
    ),
    (
        58,
        15,
        183,
        'like',
        '2026-07-25 17:00:00'
    ),
    (
        59,
        15,
        206,
        'save',
        '2026-07-26 18:00:00'
    ),
    (
        60,
        15,
        229,
        'share',
        '2026-07-27 19:00:00'
    ),
    (
        61,
        16,
        273,
        'like',
        '2026-07-17 08:00:00'
    ),
    (
        62,
        16,
        16,
        'save',
        '2026-07-18 09:00:00'
    ),
    (
        63,
        16,
        39,
        'share',
        '2026-07-19 10:00:00'
    ),
    (
        64,
        16,
        62,
        'like',
        '2026-07-20 11:00:00'
    ),
    (
        65,
        16,
        85,
        'save',
        '2026-07-21 12:00:00'
    ),
    (
        66,
        16,
        108,
        'share',
        '2026-07-22 13:00:00'
    ),
    (
        67,
        16,
        131,
        'like',
        '2026-07-23 14:00:00'
    ),
    (
        68,
        16,
        154,
        'save',
        '2026-07-24 15:00:00'
    ),
    (
        69,
        16,
        177,
        'share',
        '2026-07-25 16:00:00'
    ),
    (
        70,
        16,
        200,
        'like',
        '2026-07-26 17:00:00'
    ),
    (
        71,
        16,
        223,
        'save',
        '2026-07-27 18:00:00'
    ),
    (
        72,
        16,
        246,
        'share',
        '2026-07-28 19:00:00'
    ),
    (
        73,
        17,
        10,
        'like',
        '2026-07-18 08:00:00'
    ),
    (
        74,
        17,
        33,
        'save',
        '2026-07-19 09:00:00'
    ),
    (
        75,
        17,
        56,
        'share',
        '2026-07-20 10:00:00'
    ),
    (
        76,
        17,
        79,
        'like',
        '2026-07-21 11:00:00'
    ),
    (
        77,
        17,
        102,
        'save',
        '2026-07-22 12:00:00'
    ),
    (
        78,
        17,
        125,
        'share',
        '2026-07-23 13:00:00'
    ),
    (
        79,
        17,
        148,
        'like',
        '2026-07-24 14:00:00'
    ),
    (
        80,
        17,
        171,
        'save',
        '2026-07-25 15:00:00'
    ),
    (
        81,
        17,
        194,
        'share',
        '2026-07-26 16:00:00'
    ),
    (
        82,
        17,
        217,
        'like',
        '2026-07-27 17:00:00'
    ),
    (
        83,
        17,
        240,
        'save',
        '2026-07-28 18:00:00'
    ),
    (
        84,
        17,
        263,
        'share',
        '2026-07-01 19:00:00'
    ),
    (
        85,
        18,
        27,
        'like',
        '2026-07-19 08:00:00'
    ),
    (
        86,
        18,
        50,
        'save',
        '2026-07-20 09:00:00'
    ),
    (
        87,
        18,
        73,
        'share',
        '2026-07-21 10:00:00'
    ),
    (
        88,
        18,
        96,
        'like',
        '2026-07-22 11:00:00'
    ),
    (
        89,
        18,
        119,
        'save',
        '2026-07-23 12:00:00'
    ),
    (
        90,
        18,
        142,
        'share',
        '2026-07-24 13:00:00'
    ),
    (
        91,
        18,
        165,
        'like',
        '2026-07-25 14:00:00'
    ),
    (
        92,
        18,
        188,
        'save',
        '2026-07-26 15:00:00'
    ),
    (
        93,
        18,
        211,
        'share',
        '2026-07-27 16:00:00'
    ),
    (
        94,
        18,
        234,
        'like',
        '2026-07-28 17:00:00'
    ),
    (
        95,
        18,
        257,
        'save',
        '2026-07-01 18:00:00'
    ),
    (
        96,
        18,
        280,
        'share',
        '2026-07-02 19:00:00'
    ),
    (
        97,
        19,
        44,
        'like',
        '2026-07-20 08:00:00'
    ),
    (
        98,
        19,
        67,
        'save',
        '2026-07-21 09:00:00'
    ),
    (
        99,
        19,
        90,
        'share',
        '2026-07-22 10:00:00'
    ),
    (
        100,
        19,
        113,
        'like',
        '2026-07-23 11:00:00'
    ),
    (
        101,
        19,
        136,
        'save',
        '2026-07-24 12:00:00'
    ),
    (
        102,
        19,
        159,
        'share',
        '2026-07-25 13:00:00'
    ),
    (
        103,
        19,
        182,
        'like',
        '2026-07-26 14:00:00'
    ),
    (
        104,
        19,
        205,
        'save',
        '2026-07-27 15:00:00'
    ),
    (
        105,
        19,
        228,
        'share',
        '2026-07-28 16:00:00'
    ),
    (
        106,
        19,
        251,
        'like',
        '2026-07-01 17:00:00'
    ),
    (
        107,
        19,
        274,
        'save',
        '2026-07-02 18:00:00'
    ),
    (
        108,
        19,
        17,
        'share',
        '2026-07-03 19:00:00'
    ),
    (
        109,
        20,
        61,
        'like',
        '2026-07-21 08:00:00'
    ),
    (
        110,
        20,
        84,
        'save',
        '2026-07-22 09:00:00'
    ),
    (
        111,
        20,
        107,
        'share',
        '2026-07-23 10:00:00'
    ),
    (
        112,
        20,
        130,
        'like',
        '2026-07-24 11:00:00'
    ),
    (
        113,
        20,
        153,
        'save',
        '2026-07-25 12:00:00'
    ),
    (
        114,
        20,
        176,
        'share',
        '2026-07-26 13:00:00'
    ),
    (
        115,
        20,
        199,
        'like',
        '2026-07-27 14:00:00'
    ),
    (
        116,
        20,
        222,
        'save',
        '2026-07-28 15:00:00'
    ),
    (
        117,
        20,
        245,
        'share',
        '2026-07-01 16:00:00'
    ),
    (
        118,
        20,
        268,
        'like',
        '2026-07-02 17:00:00'
    ),
    (
        119,
        20,
        11,
        'save',
        '2026-07-03 18:00:00'
    ),
    (
        120,
        20,
        34,
        'share',
        '2026-07-04 19:00:00'
    ),
    (
        121,
        21,
        78,
        'like',
        '2026-07-22 08:00:00'
    ),
    (
        122,
        21,
        101,
        'save',
        '2026-07-23 09:00:00'
    ),
    (
        123,
        21,
        124,
        'share',
        '2026-07-24 10:00:00'
    ),
    (
        124,
        21,
        147,
        'like',
        '2026-07-25 11:00:00'
    ),
    (
        125,
        21,
        170,
        'save',
        '2026-07-26 12:00:00'
    ),
    (
        126,
        21,
        193,
        'share',
        '2026-07-27 13:00:00'
    ),
    (
        127,
        21,
        216,
        'like',
        '2026-07-28 14:00:00'
    ),
    (
        128,
        21,
        239,
        'save',
        '2026-07-01 15:00:00'
    ),
    (
        129,
        21,
        262,
        'share',
        '2026-07-02 16:00:00'
    ),
    (
        130,
        21,
        5,
        'like',
        '2026-07-03 17:00:00'
    ),
    (
        131,
        21,
        28,
        'save',
        '2026-07-04 18:00:00'
    ),
    (
        132,
        21,
        51,
        'share',
        '2026-07-05 19:00:00'
    ),
    (
        133,
        22,
        95,
        'like',
        '2026-07-23 08:00:00'
    ),
    (
        134,
        22,
        118,
        'save',
        '2026-07-24 09:00:00'
    ),
    (
        135,
        22,
        141,
        'share',
        '2026-07-25 10:00:00'
    ),
    (
        136,
        22,
        164,
        'like',
        '2026-07-26 11:00:00'
    ),
    (
        137,
        22,
        187,
        'save',
        '2026-07-27 12:00:00'
    ),
    (
        138,
        22,
        210,
        'share',
        '2026-07-28 13:00:00'
    ),
    (
        139,
        22,
        233,
        'like',
        '2026-07-01 14:00:00'
    ),
    (
        140,
        22,
        256,
        'save',
        '2026-07-02 15:00:00'
    ),
    (
        141,
        22,
        279,
        'share',
        '2026-07-03 16:00:00'
    ),
    (
        142,
        22,
        22,
        'like',
        '2026-07-04 17:00:00'
    ),
    (
        143,
        22,
        45,
        'save',
        '2026-07-05 18:00:00'
    ),
    (
        144,
        22,
        68,
        'share',
        '2026-07-06 19:00:00'
    ),
    (
        145,
        23,
        112,
        'like',
        '2026-07-24 08:00:00'
    ),
    (
        146,
        23,
        135,
        'save',
        '2026-07-25 09:00:00'
    ),
    (
        147,
        23,
        158,
        'share',
        '2026-07-26 10:00:00'
    ),
    (
        148,
        23,
        181,
        'like',
        '2026-07-27 11:00:00'
    ),
    (
        149,
        23,
        204,
        'save',
        '2026-07-28 12:00:00'
    ),
    (
        150,
        23,
        227,
        'share',
        '2026-07-01 13:00:00'
    ),
    (
        151,
        23,
        250,
        'like',
        '2026-07-02 14:00:00'
    ),
    (
        152,
        23,
        273,
        'save',
        '2026-07-03 15:00:00'
    ),
    (
        153,
        23,
        16,
        'share',
        '2026-07-04 16:00:00'
    ),
    (
        154,
        23,
        39,
        'like',
        '2026-07-05 17:00:00'
    ),
    (
        155,
        23,
        62,
        'save',
        '2026-07-06 18:00:00'
    ),
    (
        156,
        23,
        85,
        'share',
        '2026-07-07 19:00:00'
    ),
    (
        157,
        24,
        129,
        'like',
        '2026-07-25 08:00:00'
    ),
    (
        158,
        24,
        152,
        'save',
        '2026-07-26 09:00:00'
    ),
    (
        159,
        24,
        175,
        'share',
        '2026-07-27 10:00:00'
    ),
    (
        160,
        24,
        198,
        'like',
        '2026-07-28 11:00:00'
    ),
    (
        161,
        24,
        221,
        'save',
        '2026-07-01 12:00:00'
    ),
    (
        162,
        24,
        244,
        'share',
        '2026-07-02 13:00:00'
    ),
    (
        163,
        24,
        267,
        'like',
        '2026-07-03 14:00:00'
    ),
    (
        164,
        24,
        10,
        'save',
        '2026-07-04 15:00:00'
    ),
    (
        165,
        24,
        33,
        'share',
        '2026-07-05 16:00:00'
    ),
    (
        166,
        24,
        56,
        'like',
        '2026-07-06 17:00:00'
    ),
    (
        167,
        24,
        79,
        'save',
        '2026-07-07 18:00:00'
    ),
    (
        168,
        24,
        102,
        'share',
        '2026-07-08 19:00:00'
    ),
    (
        169,
        25,
        146,
        'like',
        '2026-07-26 08:00:00'
    ),
    (
        170,
        25,
        169,
        'save',
        '2026-07-27 09:00:00'
    ),
    (
        171,
        25,
        192,
        'share',
        '2026-07-28 10:00:00'
    ),
    (
        172,
        25,
        215,
        'like',
        '2026-07-01 11:00:00'
    ),
    (
        173,
        25,
        238,
        'save',
        '2026-07-02 12:00:00'
    ),
    (
        174,
        25,
        261,
        'share',
        '2026-07-03 13:00:00'
    ),
    (
        175,
        25,
        4,
        'like',
        '2026-07-04 14:00:00'
    ),
    (
        176,
        25,
        27,
        'save',
        '2026-07-05 15:00:00'
    ),
    (
        177,
        25,
        50,
        'share',
        '2026-07-06 16:00:00'
    ),
    (
        178,
        25,
        73,
        'like',
        '2026-07-07 17:00:00'
    ),
    (
        179,
        25,
        96,
        'save',
        '2026-07-08 18:00:00'
    ),
    (
        180,
        25,
        119,
        'share',
        '2026-07-09 19:00:00'
    );

-- ============================================================================
-- FEED COMMENTS (85 Comments & Replies: Students ask, Lecturers & Students reply)
-- ============================================================================
INSERT INTO
    feed_comments (
        id,
        highlight_id,
        user_id,
        content,
        origin_cmt,
        created_at,
        updated_at
    )
VALUES (
        1,
        10,
        12,
        'Phần này giải thích bẫy TOEIC Part 5 rất thực tế.',
        NULL,
        '2026-07-06 10:00:00',
        '2026-07-06 10:00:00'
    ),
    (
        2,
        14,
        13,
        'Cảm ơn thầy Đăng Khoa, đoạn CORS này mình bị vướng cả tuần nay.',
        NULL,
        '2026-07-07 10:00:00',
        '2026-07-07 10:00:00'
    ),
    (
        3,
        18,
        14,
        'Mascot minh họa sinh động quá, học không bị chán.',
        NULL,
        '2026-07-08 10:00:00',
        '2026-07-08 10:00:00'
    ),
    (
        4,
        22,
        15,
        'Cho mình hỏi tài liệu đính kèm tải ở đâu vậy ạ?',
        NULL,
        '2026-07-09 10:00:00',
        '2026-07-09 10:00:00'
    ),
    (
        5,
        26,
        16,
        'Bài giảng rất hay và súc tích!',
        NULL,
        '2026-07-10 10:00:00',
        '2026-07-10 10:00:00'
    ),
    (
        6,
        30,
        17,
        'Đã thả tim và lưu bài lại để xem lại khi làm project.',
        NULL,
        '2026-07-11 10:00:00',
        '2026-07-11 10:00:00'
    ),
    (
        7,
        34,
        18,
        'Thầy giảng phần Async/Await cực kỳ trực quan.',
        NULL,
        '2026-07-12 10:00:00',
        '2026-07-12 10:00:00'
    ),
    (
        8,
        38,
        19,
        'Hình ảnh và chất lượng video tuyệt vời.',
        NULL,
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        9,
        42,
        20,
        'Mong thầy ra thêm nhiều highlight chủ đề System Design nữa.',
        NULL,
        '2026-07-14 10:00:00',
        '2026-07-14 10:00:00'
    ),
    (
        10,
        46,
        21,
        'Nội dung ngắn mà đúng trọng tâm, rất thích phong cách này.',
        NULL,
        '2026-07-15 10:00:00',
        '2026-07-15 10:00:00'
    ),
    (
        11,
        50,
        22,
        'Cảm ơn bạn đã chia sẻ!',
        NULL,
        '2026-07-16 10:00:00',
        '2026-07-16 10:00:00'
    ),
    (
        12,
        54,
        23,
        'Mình cũng nghĩ vậy!',
        NULL,
        '2026-07-17 10:00:00',
        '2026-07-17 10:00:00'
    ),
    (
        13,
        58,
        24,
        'Totally agree!',
        NULL,
        '2026-07-18 10:00:00',
        '2026-07-18 10:00:00'
    ),
    (
        14,
        62,
        25,
        'Great explanation! Very clear and concise.',
        NULL,
        '2026-07-19 10:00:00',
        '2026-07-19 10:00:00'
    ),
    (
        15,
        66,
        11,
        'This saved me hours of reading documentation.',
        NULL,
        '2026-07-20 10:00:00',
        '2026-07-20 10:00:00'
    ),
    (
        16,
        70,
        12,
        'Very well structured, easy to follow.',
        NULL,
        '2026-07-21 10:00:00',
        '2026-07-21 10:00:00'
    ),
    (
        17,
        74,
        13,
        'Learned so much in just a few minutes!',
        NULL,
        '2026-07-22 10:00:00',
        '2026-07-22 10:00:00'
    ),
    (
        18,
        78,
        14,
        'Video ngắn gọn mà dễ hiểu quá cô ơi!',
        NULL,
        '2026-07-23 10:00:00',
        '2026-07-23 10:00:00'
    ),
    (
        19,
        82,
        15,
        'Phần này giải thích bẫy TOEIC Part 5 rất thực tế.',
        NULL,
        '2026-07-24 10:00:00',
        '2026-07-24 10:00:00'
    ),
    (
        20,
        86,
        16,
        'Cảm ơn thầy Đăng Khoa, đoạn CORS này mình bị vướng cả tuần nay.',
        NULL,
        '2026-07-05 10:00:00',
        '2026-07-05 10:00:00'
    ),
    (
        21,
        90,
        17,
        'Mascot minh họa sinh động quá, học không bị chán.',
        NULL,
        '2026-07-06 10:00:00',
        '2026-07-06 10:00:00'
    ),
    (
        22,
        94,
        18,
        'Cho mình hỏi tài liệu đính kèm tải ở đâu vậy ạ?',
        NULL,
        '2026-07-07 10:00:00',
        '2026-07-07 10:00:00'
    ),
    (
        23,
        98,
        19,
        'Bài giảng rất hay và súc tích!',
        NULL,
        '2026-07-08 10:00:00',
        '2026-07-08 10:00:00'
    ),
    (
        24,
        102,
        20,
        'Đã thả tim và lưu bài lại để xem lại khi làm project.',
        NULL,
        '2026-07-09 10:00:00',
        '2026-07-09 10:00:00'
    ),
    (
        25,
        106,
        21,
        'Thầy giảng phần Async/Await cực kỳ trực quan.',
        NULL,
        '2026-07-10 10:00:00',
        '2026-07-10 10:00:00'
    ),
    (
        26,
        110,
        22,
        'Hình ảnh và chất lượng video tuyệt vời.',
        NULL,
        '2026-07-11 10:00:00',
        '2026-07-11 10:00:00'
    ),
    (
        27,
        114,
        23,
        'Mong thầy ra thêm nhiều highlight chủ đề System Design nữa.',
        NULL,
        '2026-07-12 10:00:00',
        '2026-07-12 10:00:00'
    ),
    (
        28,
        118,
        24,
        'Nội dung ngắn mà đúng trọng tâm, rất thích phong cách này.',
        NULL,
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        29,
        122,
        25,
        'Cảm ơn bạn đã chia sẻ!',
        NULL,
        '2026-07-14 10:00:00',
        '2026-07-14 10:00:00'
    ),
    (
        30,
        126,
        11,
        'Mình cũng nghĩ vậy!',
        NULL,
        '2026-07-15 10:00:00',
        '2026-07-15 10:00:00'
    ),
    (
        31,
        130,
        12,
        'Totally agree!',
        NULL,
        '2026-07-16 10:00:00',
        '2026-07-16 10:00:00'
    ),
    (
        32,
        134,
        13,
        'Great explanation! Very clear and concise.',
        NULL,
        '2026-07-17 10:00:00',
        '2026-07-17 10:00:00'
    ),
    (
        33,
        138,
        14,
        'This saved me hours of reading documentation.',
        NULL,
        '2026-07-18 10:00:00',
        '2026-07-18 10:00:00'
    ),
    (
        34,
        142,
        15,
        'Very well structured, easy to follow.',
        NULL,
        '2026-07-19 10:00:00',
        '2026-07-19 10:00:00'
    ),
    (
        35,
        146,
        16,
        'Learned so much in just a few minutes!',
        NULL,
        '2026-07-20 10:00:00',
        '2026-07-20 10:00:00'
    ),
    (
        36,
        150,
        17,
        'Video ngắn gọn mà dễ hiểu quá cô ơi!',
        NULL,
        '2026-07-21 10:00:00',
        '2026-07-21 10:00:00'
    ),
    (
        37,
        154,
        18,
        'Phần này giải thích bẫy TOEIC Part 5 rất thực tế.',
        NULL,
        '2026-07-22 10:00:00',
        '2026-07-22 10:00:00'
    ),
    (
        38,
        158,
        19,
        'Cảm ơn thầy Đăng Khoa, đoạn CORS này mình bị vướng cả tuần nay.',
        NULL,
        '2026-07-23 10:00:00',
        '2026-07-23 10:00:00'
    ),
    (
        39,
        162,
        20,
        'Mascot minh họa sinh động quá, học không bị chán.',
        NULL,
        '2026-07-24 10:00:00',
        '2026-07-24 10:00:00'
    ),
    (
        40,
        166,
        21,
        'Cho mình hỏi tài liệu đính kèm tải ở đâu vậy ạ?',
        NULL,
        '2026-07-05 10:00:00',
        '2026-07-05 10:00:00'
    ),
    (
        41,
        170,
        22,
        'Bài giảng rất hay và súc tích!',
        NULL,
        '2026-07-06 10:00:00',
        '2026-07-06 10:00:00'
    ),
    (
        42,
        174,
        23,
        'Đã thả tim và lưu bài lại để xem lại khi làm project.',
        NULL,
        '2026-07-07 10:00:00',
        '2026-07-07 10:00:00'
    ),
    (
        43,
        178,
        24,
        'Thầy giảng phần Async/Await cực kỳ trực quan.',
        NULL,
        '2026-07-08 10:00:00',
        '2026-07-08 10:00:00'
    ),
    (
        44,
        182,
        25,
        'Hình ảnh và chất lượng video tuyệt vời.',
        NULL,
        '2026-07-09 10:00:00',
        '2026-07-09 10:00:00'
    ),
    (
        45,
        186,
        11,
        'Mong thầy ra thêm nhiều highlight chủ đề System Design nữa.',
        NULL,
        '2026-07-10 10:00:00',
        '2026-07-10 10:00:00'
    ),
    (
        46,
        190,
        12,
        'Nội dung ngắn mà đúng trọng tâm, rất thích phong cách này.',
        NULL,
        '2026-07-11 10:00:00',
        '2026-07-11 10:00:00'
    ),
    (
        47,
        194,
        13,
        'Cảm ơn bạn đã chia sẻ!',
        NULL,
        '2026-07-12 10:00:00',
        '2026-07-12 10:00:00'
    ),
    (
        48,
        198,
        14,
        'Mình cũng nghĩ vậy!',
        NULL,
        '2026-07-13 10:00:00',
        '2026-07-13 10:00:00'
    ),
    (
        49,
        202,
        15,
        'Totally agree!',
        NULL,
        '2026-07-14 10:00:00',
        '2026-07-14 10:00:00'
    ),
    (
        50,
        206,
        16,
        'Great explanation! Very clear and concise.',
        NULL,
        '2026-07-15 10:00:00',
        '2026-07-15 10:00:00'
    ),
    (
        51,
        210,
        17,
        'This saved me hours of reading documentation.',
        NULL,
        '2026-07-16 10:00:00',
        '2026-07-16 10:00:00'
    ),
    (
        52,
        214,
        18,
        'Very well structured, easy to follow.',
        NULL,
        '2026-07-17 10:00:00',
        '2026-07-17 10:00:00'
    ),
    (
        53,
        218,
        19,
        'Learned so much in just a few minutes!',
        NULL,
        '2026-07-18 10:00:00',
        '2026-07-18 10:00:00'
    ),
    (
        54,
        222,
        20,
        'Video ngắn gọn mà dễ hiểu quá cô ơi!',
        NULL,
        '2026-07-19 10:00:00',
        '2026-07-19 10:00:00'
    ),
    (
        55,
        226,
        21,
        'Phần này giải thích bẫy TOEIC Part 5 rất thực tế.',
        NULL,
        '2026-07-20 10:00:00',
        '2026-07-20 10:00:00'
    ),
    (
        56,
        230,
        22,
        'Cảm ơn thầy Đăng Khoa, đoạn CORS này mình bị vướng cả tuần nay.',
        NULL,
        '2026-07-21 10:00:00',
        '2026-07-21 10:00:00'
    ),
    (
        57,
        234,
        23,
        'Mascot minh họa sinh động quá, học không bị chán.',
        NULL,
        '2026-07-22 10:00:00',
        '2026-07-22 10:00:00'
    ),
    (
        58,
        238,
        24,
        'Cho mình hỏi tài liệu đính kèm tải ở đâu vậy ạ?',
        NULL,
        '2026-07-23 10:00:00',
        '2026-07-23 10:00:00'
    ),
    (
        59,
        242,
        25,
        'Bài giảng rất hay và súc tích!',
        NULL,
        '2026-07-24 10:00:00',
        '2026-07-24 10:00:00'
    ),
    (
        60,
        246,
        11,
        'Đã thả tim và lưu bài lại để xem lại khi làm project.',
        NULL,
        '2026-07-05 10:00:00',
        '2026-07-05 10:00:00'
    ),
    (
        61,
        14,
        3,
        'Em vào tab Tài nguyên ở màn hình bài học để tải file nhé.',
        2,
        '2026-07-07 14:30:00',
        '2026-07-07 14:30:00'
    ),
    (
        62,
        22,
        16,
        'Cho mình hỏi tài liệu đính kèm tải ở đâu vậy ạ?',
        4,
        '2026-07-09 14:00:00',
        '2026-07-09 14:00:00'
    ),
    (
        63,
        30,
        5,
        'Chào em, em có thể xem thêm tài liệu tham khảo đính kèm nhé.',
        6,
        '2026-07-11 14:00:00',
        '2026-07-11 14:00:00'
    ),
    (
        64,
        38,
        18,
        'Đã thả tim và lưu bài lại để xem lại khi làm project.',
        8,
        '2026-07-13 14:00:00',
        '2026-07-13 14:00:00'
    ),
    (
        65,
        46,
        7,
        'Cảm ơn em! Chúc em ôn luyện đạt kết quả cao nhé.',
        10,
        '2026-07-15 14:00:00',
        '2026-07-15 14:00:00'
    ),
    (
        66,
        54,
        20,
        'Hình ảnh và chất lượng video tuyệt vời.',
        12,
        '2026-07-17 14:00:00',
        '2026-07-17 14:00:00'
    ),
    (
        67,
        62,
        9,
        'Cảm ơn em đã ủng hộ khóa học! Thầy sẽ ra thêm bài giảng mới sớm.',
        14,
        '2026-07-19 14:00:00',
        '2026-07-19 14:00:00'
    ),
    (
        68,
        70,
        22,
        'Nội dung ngắn mà đúng trọng tâm, rất thích phong cách này.',
        16,
        '2026-07-21 14:00:00',
        '2026-07-21 14:00:00'
    ),
    (
        69,
        78,
        2,
        'Chúc em học tốt và vận dụng tốt vào dự án thực tế!',
        18,
        '2026-07-23 14:00:00',
        '2026-07-23 14:00:00'
    ),
    (
        70,
        86,
        24,
        'Mình cũng nghĩ vậy!',
        20,
        '2026-07-16 14:30:00',
        '2026-07-16 14:30:00'
    ),
    (
        71,
        94,
        4,
        'Em vào tab Tài nguyên ở màn hình bài học để tải file nhé.',
        22,
        '2026-07-17 14:30:00',
        '2026-07-17 14:30:00'
    ),
    (
        72,
        102,
        11,
        'Great explanation! Very clear and concise.',
        24,
        '2026-07-18 14:30:00',
        '2026-07-18 14:30:00'
    ),
    (
        73,
        110,
        6,
        'Chào em, em có thể xem thêm tài liệu tham khảo đính kèm nhé.',
        26,
        '2026-07-19 14:30:00',
        '2026-07-19 14:30:00'
    ),
    (
        74,
        118,
        13,
        'Very well structured, easy to follow.',
        28,
        '2026-07-20 14:30:00',
        '2026-07-20 14:30:00'
    ),
    (
        75,
        126,
        8,
        'Cảm ơn em! Chúc em ôn luyện đạt kết quả cao nhé.',
        30,
        '2026-07-21 14:30:00',
        '2026-07-21 14:30:00'
    ),
    (
        76,
        134,
        15,
        'Video ngắn gọn mà dễ hiểu quá cô ơi!',
        32,
        '2026-07-22 14:30:00',
        '2026-07-22 14:30:00'
    ),
    (
        77,
        142,
        10,
        'Cảm ơn em đã ủng hộ khóa học! Thầy sẽ ra thêm bài giảng mới sớm.',
        34,
        '2026-07-23 14:30:00',
        '2026-07-23 14:30:00'
    ),
    (
        78,
        150,
        17,
        'Cảm ơn thầy Đăng Khoa, đoạn CORS này mình bị vướng cả tuần nay.',
        36,
        '2026-07-24 14:30:00',
        '2026-07-24 14:30:00'
    ),
    (
        79,
        158,
        3,
        'Chúc em học tốt và vận dụng tốt vào dự án thực tế!',
        38,
        '2026-07-25 14:30:00',
        '2026-07-25 14:30:00'
    ),
    (
        80,
        166,
        19,
        'Cho mình hỏi tài liệu đính kèm tải ở đâu vậy ạ?',
        40,
        '2026-07-06 14:30:00',
        '2026-07-06 14:30:00'
    ),
    (
        81,
        174,
        5,
        'Em vào tab Tài nguyên ở màn hình bài học để tải file nhé.',
        42,
        '2026-07-07 14:30:00',
        '2026-07-07 14:30:00'
    ),
    (
        82,
        182,
        21,
        'Đã thả tim và lưu bài lại để xem lại khi làm project.',
        44,
        '2026-07-09 14:00:00',
        '2026-07-09 14:00:00'
    ),
    (
        83,
        190,
        7,
        'Chào em, em có thể xem thêm tài liệu tham khảo đính kèm nhé.',
        46,
        '2026-07-11 14:00:00',
        '2026-07-11 14:00:00'
    ),
    (
        84,
        198,
        23,
        'Hình ảnh và chất lượng video tuyệt vời.',
        48,
        '2026-07-13 14:00:00',
        '2026-07-13 14:00:00'
    ),
    (
        85,
        206,
        9,
        'Cảm ơn em! Chúc em ôn luyện đạt kết quả cao nhé.',
        50,
        '2026-07-15 14:00:00',
        '2026-07-15 14:00:00'
    );

-- ============================================================================
-- FEED VIEWS (140 Video Views - watch_duration strictly <= Highlight Video Duration)
-- ============================================================================
INSERT INTO
    feed_views (
        id,
        user_id,
        highlight_id,
        watch_duration,
        completed,
        viewed_at
    )
VALUES (
        1,
        12,
        3,
        42,
        0,
        '2026-07-02 11:15:00'
    ),
    (
        2,
        13,
        5,
        58.5,
        0,
        '2026-07-03 12:15:00'
    ),
    (
        3,
        14,
        7,
        78,
        0,
        '2026-07-04 13:15:00'
    ),
    (
        4,
        15,
        9,
        95.5,
        0,
        '2026-07-05 14:15:00'
    ),
    (
        5,
        16,
        11,
        183.1,
        1,
        '2026-07-06 15:15:00'
    ),
    (
        6,
        17,
        13,
        35,
        0,
        '2026-07-07 16:15:00'
    ),
    (
        7,
        18,
        15,
        42,
        0,
        '2026-07-08 17:15:00'
    ),
    (
        8,
        19,
        17,
        58.5,
        0,
        '2026-07-09 18:15:00'
    ),
    (
        9,
        20,
        19,
        78,
        0,
        '2026-07-10 19:15:00'
    ),
    (
        10,
        21,
        21,
        95.5,
        0,
        '2026-07-11 20:15:00'
    ),
    (
        11,
        22,
        23,
        167.4,
        1,
        '2026-07-12 21:15:00'
    ),
    (
        12,
        23,
        25,
        35,
        0,
        '2026-07-13 10:15:00'
    ),
    (
        13,
        24,
        27,
        42,
        0,
        '2026-07-14 11:15:00'
    ),
    (
        14,
        25,
        29,
        58.5,
        0,
        '2026-07-15 12:15:00'
    ),
    (
        15,
        11,
        31,
        78,
        0,
        '2026-07-16 13:15:00'
    ),
    (
        16,
        12,
        33,
        95.5,
        0,
        '2026-07-17 14:15:00'
    ),
    (
        17,
        13,
        35,
        184,
        1,
        '2026-07-18 15:15:00'
    ),
    (
        18,
        14,
        37,
        35,
        0,
        '2026-07-19 16:15:00'
    ),
    (
        19,
        15,
        39,
        42,
        0,
        '2026-07-20 17:15:00'
    ),
    (
        20,
        16,
        41,
        58.5,
        0,
        '2026-07-21 18:15:00'
    ),
    (
        21,
        17,
        43,
        78,
        0,
        '2026-07-22 19:15:00'
    ),
    (
        22,
        18,
        45,
        95.5,
        0,
        '2026-07-23 20:15:00'
    ),
    (
        23,
        19,
        47,
        182.3,
        1,
        '2026-07-24 21:15:00'
    ),
    (
        24,
        20,
        49,
        35,
        0,
        '2026-07-25 10:15:00'
    ),
    (
        25,
        21,
        51,
        42,
        0,
        '2026-07-26 11:15:00'
    ),
    (
        26,
        22,
        53,
        58.5,
        0,
        '2026-07-27 12:15:00'
    ),
    (
        27,
        23,
        55,
        78,
        0,
        '2026-07-28 13:15:00'
    ),
    (
        28,
        24,
        57,
        95.5,
        0,
        '2026-07-01 14:15:00'
    ),
    (
        29,
        25,
        59,
        181.2,
        1,
        '2026-07-02 15:15:00'
    ),
    (
        30,
        11,
        61,
        35,
        0,
        '2026-07-03 16:15:00'
    ),
    (
        31,
        12,
        63,
        42,
        0,
        '2026-07-04 17:15:00'
    ),
    (
        32,
        13,
        65,
        58.5,
        0,
        '2026-07-05 18:15:00'
    ),
    (
        33,
        14,
        67,
        78,
        0,
        '2026-07-06 19:15:00'
    ),
    (
        34,
        15,
        69,
        95.5,
        0,
        '2026-07-07 20:15:00'
    ),
    (
        35,
        16,
        71,
        182.2,
        1,
        '2026-07-08 21:15:00'
    ),
    (
        36,
        17,
        73,
        35,
        0,
        '2026-07-09 10:15:00'
    ),
    (
        37,
        18,
        75,
        42,
        0,
        '2026-07-10 11:15:00'
    ),
    (
        38,
        19,
        77,
        58.5,
        0,
        '2026-07-11 12:15:00'
    ),
    (
        39,
        20,
        79,
        78,
        0,
        '2026-07-12 13:15:00'
    ),
    (
        40,
        21,
        81,
        95.5,
        0,
        '2026-07-13 14:15:00'
    ),
    (
        41,
        22,
        83,
        183.7,
        1,
        '2026-07-14 15:15:00'
    ),
    (
        42,
        23,
        85,
        35,
        0,
        '2026-07-15 16:15:00'
    ),
    (
        43,
        24,
        87,
        42,
        0,
        '2026-07-16 17:15:00'
    ),
    (
        44,
        25,
        89,
        58.5,
        0,
        '2026-07-17 18:15:00'
    ),
    (
        45,
        11,
        91,
        78,
        0,
        '2026-07-18 19:15:00'
    ),
    (
        46,
        12,
        93,
        95.5,
        0,
        '2026-07-19 20:15:00'
    ),
    (
        47,
        13,
        95,
        182.2,
        1,
        '2026-07-20 21:15:00'
    ),
    (
        48,
        14,
        97,
        35,
        0,
        '2026-07-21 10:15:00'
    ),
    (
        49,
        15,
        99,
        42,
        0,
        '2026-07-22 11:15:00'
    ),
    (
        50,
        16,
        101,
        58.5,
        0,
        '2026-07-23 12:15:00'
    ),
    (
        51,
        17,
        103,
        78,
        0,
        '2026-07-24 13:15:00'
    ),
    (
        52,
        18,
        105,
        95.5,
        0,
        '2026-07-25 14:15:00'
    ),
    (
        53,
        19,
        107,
        180.3,
        1,
        '2026-07-26 15:15:00'
    ),
    (
        54,
        20,
        109,
        35,
        0,
        '2026-07-27 16:15:00'
    ),
    (
        55,
        21,
        111,
        42,
        0,
        '2026-07-28 17:15:00'
    ),
    (
        56,
        22,
        113,
        58.5,
        0,
        '2026-07-01 18:15:00'
    ),
    (
        57,
        23,
        115,
        78,
        0,
        '2026-07-02 19:15:00'
    ),
    (
        58,
        24,
        117,
        95.5,
        0,
        '2026-07-03 20:15:00'
    ),
    (
        59,
        25,
        119,
        182.9,
        1,
        '2026-07-04 21:15:00'
    ),
    (
        60,
        11,
        121,
        35,
        0,
        '2026-07-05 10:15:00'
    ),
    (
        61,
        12,
        123,
        42,
        0,
        '2026-07-06 11:15:00'
    ),
    (
        62,
        13,
        125,
        58.5,
        0,
        '2026-07-07 12:15:00'
    ),
    (
        63,
        14,
        127,
        78,
        0,
        '2026-07-08 13:15:00'
    ),
    (
        64,
        15,
        129,
        95.5,
        0,
        '2026-07-09 14:15:00'
    ),
    (
        65,
        16,
        131,
        183.7,
        1,
        '2026-07-10 15:15:00'
    ),
    (
        66,
        17,
        133,
        35,
        0,
        '2026-07-11 16:15:00'
    ),
    (
        67,
        18,
        135,
        42,
        0,
        '2026-07-12 17:15:00'
    ),
    (
        68,
        19,
        137,
        58.5,
        0,
        '2026-07-13 18:15:00'
    ),
    (
        69,
        20,
        139,
        78,
        0,
        '2026-07-14 19:15:00'
    ),
    (
        70,
        21,
        141,
        95.5,
        0,
        '2026-07-15 20:15:00'
    ),
    (
        71,
        22,
        143,
        137.1,
        1,
        '2026-07-16 21:15:00'
    ),
    (
        72,
        23,
        145,
        35,
        0,
        '2026-07-17 10:15:00'
    ),
    (
        73,
        24,
        147,
        42,
        0,
        '2026-07-18 11:15:00'
    ),
    (
        74,
        25,
        149,
        58.5,
        0,
        '2026-07-19 12:15:00'
    ),
    (
        75,
        11,
        151,
        78,
        0,
        '2026-07-20 13:15:00'
    ),
    (
        76,
        12,
        153,
        95.5,
        0,
        '2026-07-21 14:15:00'
    ),
    (
        77,
        13,
        155,
        181.2,
        1,
        '2026-07-22 15:15:00'
    ),
    (
        78,
        14,
        157,
        35,
        0,
        '2026-07-23 16:15:00'
    ),
    (
        79,
        15,
        159,
        42,
        0,
        '2026-07-24 17:15:00'
    ),
    (
        80,
        16,
        161,
        58.5,
        0,
        '2026-07-25 18:15:00'
    ),
    (
        81,
        17,
        163,
        78,
        0,
        '2026-07-26 19:15:00'
    ),
    (
        82,
        18,
        165,
        95.5,
        0,
        '2026-07-27 20:15:00'
    ),
    (
        83,
        19,
        167,
        182.1,
        1,
        '2026-07-28 21:15:00'
    ),
    (
        84,
        20,
        169,
        35,
        0,
        '2026-07-01 10:15:00'
    ),
    (
        85,
        21,
        171,
        42,
        0,
        '2026-07-02 11:15:00'
    ),
    (
        86,
        22,
        173,
        58.5,
        0,
        '2026-07-03 12:15:00'
    ),
    (
        87,
        23,
        175,
        78,
        0,
        '2026-07-04 13:15:00'
    ),
    (
        88,
        24,
        177,
        95.5,
        0,
        '2026-07-05 14:15:00'
    ),
    (
        89,
        25,
        179,
        169.6,
        1,
        '2026-07-06 15:15:00'
    ),
    (
        90,
        11,
        181,
        35,
        0,
        '2026-07-07 16:15:00'
    ),
    (
        91,
        12,
        183,
        42,
        0,
        '2026-07-08 17:15:00'
    ),
    (
        92,
        13,
        185,
        58.5,
        0,
        '2026-07-09 18:15:00'
    ),
    (
        93,
        14,
        187,
        78,
        0,
        '2026-07-10 19:15:00'
    ),
    (
        94,
        15,
        189,
        95.5,
        0,
        '2026-07-11 20:15:00'
    ),
    (
        95,
        16,
        191,
        183.1,
        1,
        '2026-07-12 21:15:00'
    ),
    (
        96,
        17,
        193,
        35,
        0,
        '2026-07-13 10:15:00'
    ),
    (
        97,
        18,
        195,
        42,
        0,
        '2026-07-14 11:15:00'
    ),
    (
        98,
        19,
        197,
        58.5,
        0,
        '2026-07-15 12:15:00'
    ),
    (
        99,
        20,
        199,
        78,
        0,
        '2026-07-16 13:15:00'
    ),
    (
        100,
        21,
        201,
        95.5,
        0,
        '2026-07-17 14:15:00'
    ),
    (
        101,
        22,
        203,
        115,
        1,
        '2026-07-18 15:15:00'
    ),
    (
        102,
        23,
        205,
        35,
        0,
        '2026-07-19 16:15:00'
    ),
    (
        103,
        24,
        207,
        42,
        0,
        '2026-07-20 17:15:00'
    ),
    (
        104,
        25,
        209,
        58.5,
        0,
        '2026-07-21 18:15:00'
    ),
    (
        105,
        11,
        211,
        78,
        0,
        '2026-07-22 19:15:00'
    ),
    (
        106,
        12,
        213,
        95.5,
        0,
        '2026-07-23 20:15:00'
    ),
    (
        107,
        13,
        215,
        180.6,
        1,
        '2026-07-24 21:15:00'
    ),
    (
        108,
        14,
        217,
        35,
        0,
        '2026-07-25 10:15:00'
    ),
    (
        109,
        15,
        219,
        42,
        0,
        '2026-07-26 11:15:00'
    ),
    (
        110,
        16,
        221,
        58.5,
        0,
        '2026-07-27 12:15:00'
    ),
    (
        111,
        17,
        223,
        78,
        0,
        '2026-07-28 13:15:00'
    ),
    (
        112,
        18,
        225,
        95.5,
        0,
        '2026-07-01 14:15:00'
    ),
    (
        113,
        19,
        227,
        115,
        1,
        '2026-07-02 15:15:00'
    ),
    (
        114,
        20,
        229,
        35,
        0,
        '2026-07-03 16:15:00'
    ),
    (
        115,
        21,
        231,
        42,
        0,
        '2026-07-04 17:15:00'
    ),
    (
        116,
        22,
        233,
        58.5,
        0,
        '2026-07-05 18:15:00'
    ),
    (
        117,
        23,
        235,
        78,
        0,
        '2026-07-06 19:15:00'
    ),
    (
        118,
        24,
        237,
        95.5,
        0,
        '2026-07-07 20:15:00'
    ),
    (
        119,
        25,
        239,
        115,
        1,
        '2026-07-08 21:15:00'
    ),
    (
        120,
        11,
        241,
        35,
        0,
        '2026-07-09 10:15:00'
    ),
    (
        121,
        12,
        243,
        42,
        0,
        '2026-07-10 11:15:00'
    ),
    (
        122,
        13,
        245,
        58.5,
        0,
        '2026-07-11 12:15:00'
    ),
    (
        123,
        14,
        247,
        78,
        0,
        '2026-07-12 13:15:00'
    ),
    (
        124,
        15,
        249,
        95.5,
        0,
        '2026-07-13 14:15:00'
    ),
    (
        125,
        16,
        251,
        115,
        1,
        '2026-07-14 15:15:00'
    ),
    (
        126,
        17,
        253,
        35,
        0,
        '2026-07-15 16:15:00'
    ),
    (
        127,
        18,
        255,
        42,
        0,
        '2026-07-16 17:15:00'
    ),
    (
        128,
        19,
        257,
        58.5,
        0,
        '2026-07-17 18:15:00'
    ),
    (
        129,
        20,
        259,
        78,
        0,
        '2026-07-18 19:15:00'
    ),
    (
        130,
        21,
        261,
        95.5,
        0,
        '2026-07-19 20:15:00'
    ),
    (
        131,
        22,
        263,
        182.3,
        1,
        '2026-07-20 21:15:00'
    ),
    (
        132,
        23,
        265,
        35,
        0,
        '2026-07-21 10:15:00'
    ),
    (
        133,
        24,
        267,
        42,
        0,
        '2026-07-22 11:15:00'
    ),
    (
        134,
        25,
        269,
        58.5,
        0,
        '2026-07-23 12:15:00'
    ),
    (
        135,
        11,
        271,
        78,
        0,
        '2026-07-24 13:15:00'
    ),
    (
        136,
        12,
        273,
        95.5,
        0,
        '2026-07-25 14:15:00'
    ),
    (
        137,
        13,
        275,
        115,
        1,
        '2026-07-26 15:15:00'
    ),
    (
        138,
        14,
        277,
        35,
        0,
        '2026-07-27 16:15:00'
    ),
    (
        139,
        15,
        279,
        42,
        0,
        '2026-07-28 17:15:00'
    ),
    (
        140,
        16,
        1,
        58.5,
        0,
        '2026-07-01 18:15:00'
    );

-- ============================================================================
-- CURRENT FEED RANKING SCENARIO
-- These timestamps are relative to the time the seed runs. Trending only reads
-- the last hour, while recommendations use a 7-day engagement window.  Static
-- July dates therefore made every item tie after the demo database aged.
--
-- Guest: eight active feeds from eight different courses have distinct, recent
-- engagement so /feed/trending is useful instead of falling back to feed ID.
-- Student 11 (Trần Anh Tú): completed views cover those same courses, giving
-- the recommendation profile balanced course and hashtag affinities.  Three
-- of the feeds belong to lecturer 4 (Trần Đăng Khoa), so instructor/admin
-- analytics also show meaningful current activity.
-- ============================================================================
INSERT INTO
    feed_interactions (
        id,
        user_id,
        highlight_id,
        type,
        created_at
    )
VALUES (
        181,
        12,
        104,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 52 MINUTE
        )
    ),
    (
        182,
        14,
        104,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 49 MINUTE
        )
    ),
    (
        183,
        16,
        104,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 46 MINUTE
        )
    ),
    (
        184,
        17,
        104,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 43 MINUTE
        )
    ),
    (
        185,
        19,
        104,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 40 MINUTE
        )
    ),
    (
        186,
        20,
        104,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 37 MINUTE
        )
    ),
    (
        187,
        23,
        104,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 34 MINUTE
        )
    ),
    (
        188,
        11,
        120,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 51 MINUTE
        )
    ),
    (
        189,
        13,
        120,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 48 MINUTE
        )
    ),
    (
        190,
        15,
        120,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 45 MINUTE
        )
    ),
    (
        191,
        17,
        120,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 42 MINUTE
        )
    ),
    (
        192,
        19,
        120,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 39 MINUTE
        )
    ),
    (
        193,
        20,
        120,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 36 MINUTE
        )
    ),
    (
        194,
        22,
        120,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 33 MINUTE
        )
    ),
    (
        195,
        12,
        138,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 50 MINUTE
        )
    ),
    (
        196,
        13,
        138,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 47 MINUTE
        )
    ),
    (
        197,
        15,
        138,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 44 MINUTE
        )
    ),
    (
        198,
        17,
        138,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 41 MINUTE
        )
    ),
    (
        199,
        19,
        138,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 38 MINUTE
        )
    ),
    (
        200,
        20,
        138,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 35 MINUTE
        )
    ),
    (
        201,
        22,
        138,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 32 MINUTE
        )
    ),
    (
        202,
        11,
        216,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 31 MINUTE
        )
    ),
    (
        203,
        12,
        216,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 29 MINUTE
        )
    ),
    (
        204,
        14,
        216,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 27 MINUTE
        )
    ),
    (
        205,
        16,
        216,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 25 MINUTE
        )
    ),
    (
        206,
        17,
        216,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 23 MINUTE
        )
    ),
    (
        207,
        19,
        216,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 21 MINUTE
        )
    ),
    (
        208,
        20,
        216,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 19 MINUTE
        )
    ),
    (
        209,
        12,
        234,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 30 MINUTE
        )
    ),
    (
        210,
        13,
        234,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 28 MINUTE
        )
    ),
    (
        211,
        14,
        234,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 26 MINUTE
        )
    ),
    (
        212,
        15,
        234,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 24 MINUTE
        )
    ),
    (
        213,
        16,
        234,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 22 MINUTE
        )
    ),
    (
        214,
        17,
        234,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 20 MINUTE
        )
    ),
    (
        215,
        20,
        234,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 18 MINUTE
        )
    ),
    (
        216,
        12,
        280,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 17 MINUTE
        )
    ),
    (
        217,
        13,
        280,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 15 MINUTE
        )
    ),
    (
        218,
        14,
        280,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 13 MINUTE
        )
    ),
    (
        219,
        15,
        280,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 11 MINUTE
        )
    ),
    (
        220,
        16,
        280,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 9 MINUTE
        )
    ),
    (
        221,
        17,
        280,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 7 MINUTE
        )
    ),
    (
        222,
        19,
        280,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 5 MINUTE
        )
    ),
    (
        223,
        11,
        72,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 16 MINUTE
        )
    ),
    (
        224,
        12,
        72,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 14 MINUTE
        )
    ),
    (
        225,
        13,
        72,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 12 MINUTE
        )
    ),
    (
        226,
        14,
        72,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 10 MINUTE
        )
    ),
    (
        227,
        16,
        72,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 8 MINUTE
        )
    ),
    (
        228,
        17,
        72,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 6 MINUTE
        )
    ),
    (
        229,
        19,
        72,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 4 MINUTE
        )
    ),
    (
        230,
        11,
        209,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 15 MINUTE
        )
    ),
    (
        231,
        12,
        209,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 13 MINUTE
        )
    ),
    (
        232,
        13,
        209,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 11 MINUTE
        )
    ),
    (
        233,
        14,
        209,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 9 MINUTE
        )
    ),
    (
        234,
        16,
        209,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 7 MINUTE
        )
    ),
    (
        235,
        17,
        209,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 5 MINUTE
        )
    ),
    (
        236,
        19,
        209,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 3 MINUTE
        )
    ),
    -- Deliberately different volumes so guest trending has meaningful ranks.
    (
        237,
        21,
        104,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 18 MINUTE
        )
    ),
    (
        238,
        22,
        104,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 16 MINUTE
        )
    ),
    (
        239,
        24,
        104,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 14 MINUTE
        )
    ),
    (
        240,
        25,
        104,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 12 MINUTE
        )
    ),
    (
        241,
        21,
        216,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 10 MINUTE
        )
    ),
    (
        242,
        22,
        216,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 8 MINUTE
        )
    ),
    (
        243,
        23,
        216,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 6 MINUTE
        )
    ),
    (
        244,
        21,
        234,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 10 MINUTE
        )
    ),
    (
        245,
        22,
        234,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 8 MINUTE
        )
    ),
    (
        246,
        21,
        120,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 6 MINUTE
        )
    ),
    (
        247,
        24,
        120,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 4 MINUTE
        )
    ),
    (
        248,
        21,
        138,
        'like',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 6 MINUTE
        )
    ),
    (
        249,
        22,
        72,
        'save',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 4 MINUTE
        )
    ),
    (
        250,
        22,
        209,
        'share',
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 2 MINUTE
        )
    );

INSERT INTO
    feed_comments (
        id,
        highlight_id,
        user_id,
        content,
        origin_cmt,
        created_at,
        updated_at
    )
VALUES (
        86,
        104,
        12,
        'Ví dụ CORS thực tế rất dễ áp dụng. Mình đã sửa được lỗi gọi API local.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 35 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 35 MINUTE
        )
    ),
    (
        87,
        104,
        4,
        'Tốt quá em. Nhớ chỉ mở origin cần thiết khi đưa API lên production nhé.',
        86,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 32 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 32 MINUTE
        )
    ),
    (
        88,
        120,
        13,
        'Phần Node.js này giúp mình hiểu rõ luồng chạy server hơn nhiều.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 31 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 31 MINUTE
        )
    ),
    (
        89,
        120,
        4,
        'Em thử tạo một API nhỏ sau video để nhớ kiến thức lâu hơn nhé.',
        88,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 29 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 29 MINUTE
        )
    ),
    (
        90,
        138,
        14,
        'Ví dụ về function ngắn gọn, xem xong là làm bài được luôn.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 28 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 28 MINUTE
        )
    ),
    (
        91,
        138,
        4,
        'Cảm ơn em, phần tiếp theo mình sẽ ghép function vào project nhỏ.',
        90,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 26 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 26 MINUTE
        )
    ),
    (
        92,
        216,
        16,
        'Gradient và shadow giải thích rất trực quan, mình đã áp dụng vào file Figma.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 25 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 25 MINUTE
        )
    ),
    (
        93,
        216,
        7,
        'Hay quá, em thử kết hợp thêm Auto Layout để giao diện nhất quán hơn nha.',
        92,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 23 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 23 MINUTE
        )
    ),
    (
        94,
        234,
        17,
        'Slicer trong Power BI đúng là phần mình đang cần cho dashboard bán hàng.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 22 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 22 MINUTE
        )
    ),
    (
        95,
        234,
        13,
        'Mình cũng dùng cách này để lọc báo cáo theo tháng, khá tiện.',
        94,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 20 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 20 MINUTE
        )
    ),
    (
        96,
        280,
        19,
        'Checklist SEO có thứ tự rõ ràng nên mình biết bắt đầu tối ưu từ đâu.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 19 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 19 MINUTE
        )
    ),
    (
        97,
        280,
        8,
        'Đúng rồi em, ưu tiên nội dung hữu ích và kiểm tra định kỳ các trang cũ.',
        96,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 17 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 17 MINUTE
        )
    ),
    (
        98,
        72,
        20,
        'Cách đọc chỉ số đánh giá model dễ hiểu hơn mình tưởng.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 16 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 16 MINUTE
        )
    ),
    (
        99,
        72,
        6,
        'Em có thể thử lại với một dataset nhỏ để thấy sự khác nhau giữa các metric.',
        98,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 14 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 14 MINUTE
        )
    ),
    (
        100,
        209,
        23,
        'Histogram được minh hoạ rõ nên mình tự tin chỉnh exposure hơn rồi.',
        NULL,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 13 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 13 MINUTE
        )
    ),
    (
        101,
        209,
        7,
        'Tuyệt vời, em thử chụp cùng một cảnh ở vài mức exposure để luyện mắt nhé.',
        100,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 11 MINUTE
        ),
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 11 MINUTE
        )
    );

INSERT INTO
    feed_views (
        id,
        user_id,
        highlight_id,
        watch_duration,
        completed,
        viewed_at
    )
VALUES (
        141,
        11,
        104,
        150,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 34 MINUTE
        )
    ),
    (
        142,
        12,
        104,
        104,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 30 MINUTE
        )
    ),
    (
        143,
        14,
        104,
        126,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 26 MINUTE
        )
    ),
    (
        144,
        16,
        104,
        170,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 22 MINUTE
        )
    ),
    (
        145,
        11,
        120,
        130,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 33 MINUTE
        )
    ),
    (
        146,
        13,
        120,
        82,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 29 MINUTE
        )
    ),
    (
        147,
        15,
        120,
        110,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 25 MINUTE
        )
    ),
    (
        148,
        17,
        120,
        145,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 21 MINUTE
        )
    ),
    (
        149,
        11,
        138,
        155,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 32 MINUTE
        )
    ),
    (
        150,
        12,
        138,
        94,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 28 MINUTE
        )
    ),
    (
        151,
        15,
        138,
        121,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 24 MINUTE
        )
    ),
    (
        152,
        19,
        138,
        170,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 20 MINUTE
        )
    ),
    (
        153,
        11,
        216,
        150,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 31 MINUTE
        )
    ),
    (
        154,
        14,
        216,
        101,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 27 MINUTE
        )
    ),
    (
        155,
        16,
        216,
        128,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 23 MINUTE
        )
    ),
    (
        156,
        20,
        216,
        176,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 19 MINUTE
        )
    ),
    (
        157,
        11,
        234,
        150,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 30 MINUTE
        )
    ),
    (
        158,
        13,
        234,
        99,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 26 MINUTE
        )
    ),
    (
        159,
        17,
        234,
        124,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 22 MINUTE
        )
    ),
    (
        160,
        20,
        234,
        178,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 18 MINUTE
        )
    ),
    (
        161,
        11,
        280,
        150,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 29 MINUTE
        )
    ),
    (
        162,
        12,
        280,
        105,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 25 MINUTE
        )
    ),
    (
        163,
        16,
        280,
        130,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 21 MINUTE
        )
    ),
    (
        164,
        19,
        280,
        180,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 17 MINUTE
        )
    ),
    (
        165,
        11,
        72,
        120,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 28 MINUTE
        )
    ),
    (
        166,
        13,
        72,
        76,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 24 MINUTE
        )
    ),
    (
        167,
        17,
        72,
        98,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 20 MINUTE
        )
    ),
    (
        168,
        20,
        72,
        145,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 16 MINUTE
        )
    ),
    (
        169,
        11,
        209,
        150,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 27 MINUTE
        )
    ),
    (
        170,
        12,
        209,
        97,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 23 MINUTE
        )
    ),
    (
        171,
        16,
        209,
        125,
        0,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 19 MINUTE
        )
    ),
    (
        172,
        23,
        209,
        176,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 15 MINUTE
        )
    ),
    -- Extra completed views keep Anh Tú's course profile broad, without
    -- repeatedly viewing the exact feed items used for global trending.
    (
        173,
        11,
        103,
        140,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 45 MINUTE
        )
    ),
    (
        174,
        11,
        137,
        180,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 43 MINUTE
        )
    ),
    (
        175,
        11,
        71,
        180,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 41 MINUTE
        )
    ),
    (
        176,
        11,
        215,
        180,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 39 MINUTE
        )
    ),
    (
        177,
        11,
        233,
        150,
        1,
        DATE_SUB(
            CURRENT_TIMESTAMP,
            INTERVAL 37 MINUTE
        )
    );

-- ============================================================================
-- FINAL TIMELINE NORMALIZATION
-- ============================================================================
-- Highlight feed is imported from older demo data, so make highlight video
-- timestamps no later than the feed entries that publish them.
UPDATE videos v
JOIN highlight_feed hf ON hf.video_id = v.id
SET
    v.created_at = LEAST(v.created_at, hf.created_at),
    v.updated_at = GREATEST(
        v.updated_at,
        hf.created_at,
        hf.updated_at
    )
WHERE
    v.type = 'highlight';

-- If a course/lesson is linked to a video created later, mark the parent record
-- as updated at least at the video's creation time.
UPDATE courses c
JOIN videos v ON v.id = c.video_id
SET
    c.updated_at = GREATEST(c.updated_at, v.created_at)
WHERE
    c.video_id IS NOT NULL
    AND c.updated_at < v.created_at;

UPDATE lessons l
JOIN videos v ON v.id = l.video_id
SET
    l.updated_at = GREATEST(l.updated_at, v.created_at)
WHERE
    l.video_id IS NOT NULL
    AND l.updated_at < v.created_at;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF SEED
-- ============================================================================