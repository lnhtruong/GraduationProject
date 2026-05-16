/**
 * Seed script for testing enrollment & payment flow.
 *
 * Creates:
 *   - 1 admin     (admin@test.com / Admin@123)
 *   - 1 lecturer  (lecturer@test.com / Lecturer@123)
 *   - 2 students  (student1@test.com / Student@123, student2@test.com / Student@123)
 *   - 2 courses   (1 free, 1 paid) with 3 lessons each
 *
 * Run: node database/seed.js
 */

require("dotenv").config();
const knex = require("knex");
const bcrypt = require("bcryptjs");

const db = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || "graduation_user",
    password: process.env.DB_PASSWORD || "graduation_password",
    database: process.env.DB_NAME || "graduation_db",
    multipleStatements: true,
  },
});

async function hash(password) {
  return bcrypt.hash(password, 10);
}

async function seed() {
  console.log("🌱 Seeding test data...\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    {
      email: "admin@test.com",
      password: await hash("Admin@123"),
      firstName: "Admin",
      lastName: "Test",
      role: 1, // ADMIN
    },
    {
      email: "lecturer@test.com",
      password: await hash("Lecturer@123"),
      firstName: "Nguyen Van",
      lastName: "A",
      role: 3, // LECTURER
    },
    {
      email: "student1@test.com",
      password: await hash("Student@123"),
      firstName: "Tran Thi",
      lastName: "B",
      role: 2, // STUDENT
    },
    {
      email: "student2@test.com",
      password: await hash("Student@123"),
      firstName: "Le Van",
      lastName: "C",
      role: 2, // STUDENT
    },
  ];

  const userIds = {};
  for (const u of users) {
    const [id] = await db("users").insert(u);
    userIds[u.email] = id;
    console.log(`  ✓ User created: ${u.email} (id=${id})`);
  }

  const lecturerId = userIds["lecturer@test.com"];
  const student1Id = userIds["student1@test.com"];

  // ── Courses ────────────────────────────────────────────────────────────────
  const now = new Date();

  const [freeCourseId] = await db("courses").insert({
    name: "Lập trình Python cơ bản",
    description:
      "Khoá học nhập môn Python dành cho người mới bắt đầu. Học cú pháp, kiểu dữ liệu, vòng lặp, hàm và làm các bài tập thực hành.",
    categories: JSON.stringify(["Programming", "Python"]),
    level: "Beginner",
    language: "Vietnamese",
    price: 0,
    user_id: lecturerId,
    status: "publish",
    created_at: now,
    updated_at: now,
  });
  console.log(`\n  ✓ Course (FREE)  created: "Lập trình Python cơ bản" (id=${freeCourseId})`);

  const [paidCourseId] = await db("courses").insert({
    name: "React & Next.js nâng cao",
    description:
      "Khoá học chuyên sâu về React 18 và Next.js 14. Bao gồm Server Components, App Router, Zustand, React Query và triển khai lên Vercel.",
    categories: JSON.stringify(["Programming", "Frontend", "React"]),
    level: "Intermediate",
    language: "Vietnamese",
    price: 499000,
    user_id: lecturerId,
    status: "publish",
    created_at: now,
    updated_at: now,
  });
  console.log(`  ✓ Course (PAID)  created: "React & Next.js nâng cao" (id=${paidCourseId}, price=499,000đ)`);

  const [paid2CourseId] = await db("courses").insert({
    name: "Node.js & Express REST API",
    description:
      "Xây dựng REST API production-ready với Node.js, Express, JWT Auth, MySQL và deploy lên Railway.",
    categories: JSON.stringify(["Programming", "Backend", "Node.js"]),
    level: "Intermediate",
    language: "Vietnamese",
    price: 349000,
    user_id: lecturerId,
    status: "publish",
    created_at: now,
    updated_at: now,
  });
  console.log(`  ✓ Course (PAID)  created: "Node.js & Express REST API" (id=${paid2CourseId}, price=349,000đ)`);

  const [paid3CourseId] = await db("courses").insert({
    name: "Docker & CI/CD cho Developer",
    description:
      "Học Docker từ cơ bản đến nâng cao: containerize app, Docker Compose, GitHub Actions CI/CD và deploy lên VPS.",
    categories: JSON.stringify(["DevOps", "Docker"]),
    level: "Advanced",
    language: "Vietnamese",
    price: 599000,
    user_id: lecturerId,
    status: "publish",
    created_at: now,
    updated_at: now,
  });
  console.log(`  ✓ Course (PAID)  created: "Docker & CI/CD cho Developer" (id=${paid3CourseId}, price=599,000đ)`);

  const [paid4CourseId] = await db("courses").insert({
    name: "UI/UX Design với Figma",
    description:
      "Thiết kế giao diện chuyên nghiệp với Figma: wireframe, prototype, design system và handoff cho developer.",
    categories: JSON.stringify(["Design", "Figma", "UI/UX"]),
    level: "Beginner",
    language: "Vietnamese",
    price: 299000,
    user_id: lecturerId,
    status: "publish",
    created_at: now,
    updated_at: now,
  });
  console.log(`  ✓ Course (PAID)  created: "UI/UX Design với Figma" (id=${paid4CourseId}, price=299,000đ)`);

  // ── Lessons ────────────────────────────────────────────────────────────────
  const freeLessons = [
    {
      title: "Giới thiệu Python & cài đặt môi trường",
      contentType: "text",
      content: JSON.stringify({ text: "Hướng dẫn cài Python 3.12 và VSCode trên Windows/macOS." }),
      description: "Bài 1: Setup môi trường",
      status: "active",
    },
    {
      title: "Biến, kiểu dữ liệu và toán tử",
      contentType: "text",
      content: JSON.stringify({ text: "int, float, str, bool và các phép toán cơ bản." }),
      description: "Bài 2: Kiểu dữ liệu",
      status: "active",
    },
    {
      title: "Vòng lặp for và while",
      contentType: "text",
      content: JSON.stringify({ text: "Sử dụng vòng lặp để lặp qua danh sách và điều kiện." }),
      description: "Bài 3: Vòng lặp",
      status: "active",
    },
  ];

  const paidLessons = [
    {
      title: "Ôn tập React Hooks cần biết",
      contentType: "text",
      content: JSON.stringify({ text: "useState, useEffect, useRef, useMemo, useCallback." }),
      description: "Bài 1: React Hooks",
      status: "active",
    },
    {
      title: "Next.js App Router & Server Components",
      contentType: "text",
      content: JSON.stringify({ text: "Hiểu sự khác biệt Client/Server Component và routing." }),
      description: "Bài 2: App Router",
      status: "active",
    },
    {
      title: "Tích hợp React Query & Zustand",
      contentType: "text",
      content: JSON.stringify({ text: "Quản lý server state và client state hiệu quả." }),
      description: "Bài 3: State management",
      status: "active",
    },
  ];

  for (const lesson of freeLessons) {
    await db("lessons").insert({ ...lesson, course_id: freeCourseId, created_at: now, updated_at: now });
  }
  console.log(`\n  ✓ 3 lessons added to free course`);

  for (const lesson of paidLessons) {
    await db("lessons").insert({ ...lesson, course_id: paidCourseId, created_at: now, updated_at: now });
  }
  console.log(`  ✓ 3 lessons added to paid course (React & Next.js)`);

  const nodeLessons = [
    {
      title: "Khởi tạo project Node.js & cấu trúc thư mục",
      contentType: "text",
      content: JSON.stringify({ text: "Setup Express, dotenv, nodemon và cấu trúc MVC." }),
      description: "Bài 1: Project setup",
      status: "active",
    },
    {
      title: "JWT Authentication & Authorization",
      contentType: "text",
      content: JSON.stringify({ text: "Đăng ký, đăng nhập, refresh token và middleware bảo vệ route." }),
      description: "Bài 2: JWT Auth",
      status: "active",
    },
    {
      title: "CRUD với MySQL và Knex.js",
      contentType: "text",
      content: JSON.stringify({ text: "Query builder, migrations, transactions và error handling." }),
      description: "Bài 3: Database CRUD",
      status: "active",
    },
  ];
  for (const lesson of nodeLessons) {
    await db("lessons").insert({ ...lesson, course_id: paid2CourseId, created_at: now, updated_at: now });
  }
  console.log(`  ✓ 3 lessons added to paid course (Node.js)`);

  const dockerLessons = [
    {
      title: "Docker cơ bản: image, container, Dockerfile",
      contentType: "text",
      content: JSON.stringify({ text: "Build image, chạy container, expose port và volume." }),
      description: "Bài 1: Docker basics",
      status: "active",
    },
    {
      title: "Docker Compose: multi-service setup",
      contentType: "text",
      content: JSON.stringify({ text: "Compose nhiều service (app + db + redis) với networking." }),
      description: "Bài 2: Docker Compose",
      status: "active",
    },
    {
      title: "GitHub Actions CI/CD pipeline",
      contentType: "text",
      content: JSON.stringify({ text: "Tự động test, build Docker image và deploy lên VPS khi push code." }),
      description: "Bài 3: CI/CD",
      status: "active",
    },
  ];
  for (const lesson of dockerLessons) {
    await db("lessons").insert({ ...lesson, course_id: paid3CourseId, created_at: now, updated_at: now });
  }
  console.log(`  ✓ 3 lessons added to paid course (Docker)`);

  const figmaLessons = [
    {
      title: "Làm quen Figma: frame, layer, component",
      contentType: "text",
      content: JSON.stringify({ text: "Giao diện Figma, auto layout, component và variant." }),
      description: "Bài 1: Figma cơ bản",
      status: "active",
    },
    {
      title: "Wireframe & User Flow",
      contentType: "text",
      content: JSON.stringify({ text: "Vẽ wireframe low-fidelity và mapping user journey." }),
      description: "Bài 2: Wireframe",
      status: "active",
    },
    {
      title: "Prototype & Handoff cho Developer",
      contentType: "text",
      content: JSON.stringify({ text: "Tạo prototype click-through và export spec cho dev." }),
      description: "Bài 3: Prototype",
      status: "active",
    },
  ];
  for (const lesson of figmaLessons) {
    await db("lessons").insert({ ...lesson, course_id: paid4CourseId, created_at: now, updated_at: now });
  }
  console.log(`  ✓ 3 lessons added to paid course (Figma)`);

  // ── Enroll student1 vào free course (để test đã enrolled) ─────────────────
  await db("enrolls").insert({
    user_id: student1Id,
    course_id: freeCourseId,
    progress: 0,
    status: "active",
    enrolled_at: now,
  });
  console.log(`\n  ✓ student1@test.com enrolled in free course (để test trạng thái đã đăng ký)`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seed hoàn tất! Tài khoản test:

  👤 Admin      admin@test.com       / Admin@123
  👤 Lecturer   lecturer@test.com    / Lecturer@123
  👤 Student 1  student1@test.com    / Student@123  (đã enroll free course)
  👤 Student 2  student2@test.com    / Student@123  (chưa enroll gì)

📚 Courses:
  [id=${freeCourseId}] Lập trình Python cơ bản     — MIỄN PHÍ   (3 lessons)
  [id=${paidCourseId}] React & Next.js nâng cao    — 499,000đ   (3 lessons)
  [id=${paid2CourseId}] Node.js & Express REST API  — 349,000đ   (3 lessons)
  [id=${paid3CourseId}] Docker & CI/CD              — 599,000đ   (3 lessons)
  [id=${paid4CourseId}] UI/UX Design với Figma      — 299,000đ   (3 lessons)

🧪 Test cases gợi ý:
  1. student2 → enroll free course          → không cần payment
  2. student2 → add 1 paid course vào cart  → checkout → test payment đơn lẻ
  3. student2 → add 3-4 paid courses vào cart → checkout → test thanh toán nhiều khoá
  4. student1 → xem lesson của free course  → test lesson progress
  5. Sau khi thanh toán → kiểm tra enroll tự động tất cả khoá trong transaction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await db.destroy();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  db.destroy();
  process.exit(1);
});
