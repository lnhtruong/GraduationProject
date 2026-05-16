/**
 * Seed data để test chức năng Admin Review (duyệt khóa học + xử lý reports).
 *
 * Tạo:
 *   - 2 lecturer mới  (lecturer2@test.com, lecturer3@test.com)
 *   - 1 student mới   (student3@test.com)
 *   - 5 courses ở các trạng thái khác nhau: pending (3), approved (1), rejected (1)
 *   - Mỗi course có 3–4 lessons
 *   - 6 reports: course (2), lesson (2), teacher (2) — mix pending/approved/rejected
 *
 * Yêu cầu: đã chạy seed.js trước (admin@test.com, lecturer@test.com phải tồn tại)
 *
 * Run: node database/seed-admin-review.js
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

async function findOrCreateUser({ email, firstName, lastName, role }) {
  const existing = await db("users").where({ email }).first();
  if (existing) {
    console.log(`  ↩ User already exists: ${email} (id=${existing.id})`);
    return existing.id;
  }
  const password = await hash(
    role === 1 ? "Admin@123" : role === 3 ? "Lecturer@123" : "Student@123",
  );
  const [id] = await db("users").insert({
    email,
    password,
    firstName,
    lastName,
    role,
  });
  console.log(`  ✓ User created: ${email} (id=${id})`);
  return id;
}

async function seed() {
  console.log("🌱 Seeding admin-review test data...\n");

  const now = new Date();

  // ── Users ──────────────────────────────────────────────────────────────
  console.log("📋 Users:");
  const adminId = await findOrCreateUser({
    email: "admin@test.com",
    firstName: "Admin",
    lastName: "Test",
    role: 1,
  });
  const lecturerId = await findOrCreateUser({
    email: "lecturer@test.com",
    firstName: "Nguyen Van",
    lastName: "A",
    role: 3,
  });
  const lecturer2Id = await findOrCreateUser({
    email: "lecturer2@test.com",
    firstName: "Tran Thi",
    lastName: "Linh",
    role: 3,
  });
  const lecturer3Id = await findOrCreateUser({
    email: "lecturer3@test.com",
    firstName: "Le Minh",
    lastName: "Duc",
    role: 3,
  });
  const student3Id = await findOrCreateUser({
    email: "student3@test.com",
    firstName: "Pham Van",
    lastName: "Hoa",
    role: 2,
  });

  // ── Courses ────────────────────────────────────────────────────────────
  console.log("\n📚 Courses:");

  const courses = [
    // Pending — chờ admin duyệt
    {
      name: "TypeScript cho Backend Developer",
      description:
        "Học TypeScript từ cơ bản đến nâng cao: interfaces, generics, decorators và ứng dụng vào NestJS / Express. Phù hợp developer đã biết JavaScript muốn chuyển sang TypeScript.",
      categories: JSON.stringify(["Programming", "TypeScript", "Backend"]),
      level: "Intermediate",
      language: "Vietnamese",
      price: 449000,
      user_id: lecturer2Id,
      status: "pending",
      created_at: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
      updated_at: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Machine Learning với Python & Scikit-learn",
      description:
        "Xây dựng mô hình ML từ đầu: linear regression, classification, clustering, cross-validation và deploy model bằng FastAPI. Bao gồm project thực tế phân tích dữ liệu nhà đất.",
      categories: JSON.stringify(["Data Science", "Python", "Machine Learning"]),
      level: "Advanced",
      language: "Vietnamese",
      price: 799000,
      user_id: lecturer3Id,
      status: "pending",
      created_at: new Date(now - 5 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      name: "AWS Cloud cho Developer — từ 0 đến deploy",
      description:
        "Từ EC2, S3, RDS đến Lambda và CloudFront. Học qua hands-on lab thực chiến, không lý thuyết suông. Chuẩn bị cho AWS SAA certification.",
      categories: JSON.stringify(["Cloud", "AWS", "DevOps"]),
      level: "Intermediate",
      language: "Vietnamese",
      price: 649000,
      user_id: lecturerId,
      status: "pending",
      created_at: new Date(now - 1 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 1 * 60 * 60 * 1000),
    },
    // Approved — đã duyệt, chờ publish
    {
      name: "GraphQL & Apollo Server",
      description:
        "Thiết kế API với GraphQL: schema definition, resolvers, mutations, subscriptions và tích hợp với React Apollo Client.",
      categories: JSON.stringify(["Programming", "GraphQL", "API"]),
      level: "Intermediate",
      language: "Vietnamese",
      price: 499000,
      user_id: lecturer2Id,
      status: "approved",
      created_at: new Date(now - 10 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    // Rejected — bị từ chối
    {
      name: "Kiếm tiền online 2025",
      description:
        "Bí quyết kiếm tiền thụ động từ các nền tảng online. Nội dung được copy từ nhiều nguồn khác nhau, không có giá trị học thuật.",
      categories: JSON.stringify(["Business"]),
      level: "Beginner",
      language: "Vietnamese",
      price: 999000,
      user_id: lecturer3Id,
      status: "rejected",
      created_at: new Date(now - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
  ];

  const courseIds = {};
  for (const course of courses) {
    const [id] = await db("courses").insert(course);
    courseIds[course.name] = id;
    console.log(`  ✓ [${course.status.toUpperCase().padEnd(8)}] "${course.name}" (id=${id})`);
  }

  // ── Lessons ────────────────────────────────────────────────────────────
  console.log("\n📖 Lessons:");

  const lessonSets = {
    "TypeScript cho Backend Developer": [
      { title: "Tại sao dùng TypeScript? Setup tsconfig", contentType: "text", description: "Bài 1: Giới thiệu" },
      { title: "Types, Interfaces & Type Aliases", contentType: "text", description: "Bài 2: Kiểu dữ liệu" },
      { title: "Generics nâng cao", contentType: "text", description: "Bài 3: Generics" },
      { title: "Decorators & Metadata", contentType: "text", description: "Bài 4: Decorators" },
    ],
    "Machine Learning với Python & Scikit-learn": [
      { title: "Tổng quan ML: supervised vs unsupervised", contentType: "text", description: "Bài 1: Intro" },
      { title: "EDA & Feature Engineering với Pandas", contentType: "text", description: "Bài 2: EDA" },
      { title: "Linear & Logistic Regression", contentType: "text", description: "Bài 3: Regression" },
      { title: "Random Forest & XGBoost", contentType: "text", description: "Bài 4: Tree models" },
    ],
    "AWS Cloud cho Developer — từ 0 đến deploy": [
      { title: "AWS IAM: users, roles, policies", contentType: "text", description: "Bài 1: IAM" },
      { title: "EC2: launch instance & SSH", contentType: "text", description: "Bài 2: EC2" },
      { title: "S3: static hosting & pre-signed URL", contentType: "text", description: "Bài 3: S3" },
    ],
    "GraphQL & Apollo Server": [
      { title: "GraphQL Schema & Type System", contentType: "text", description: "Bài 1: Schema" },
      { title: "Queries & Mutations", contentType: "text", description: "Bài 2: Operations" },
      { title: "Resolvers & DataLoader", contentType: "text", description: "Bài 3: Resolvers" },
    ],
    "Kiếm tiền online 2025": [
      { title: "Bí quyết kiếm tiền nhanh", contentType: "text", description: "Bài 1" },
      { title: "Dropshipping không vốn", contentType: "text", description: "Bài 2" },
    ],
  };

  const lessonIdsByCourseName = {};
  for (const [courseName, lessons] of Object.entries(lessonSets)) {
    const courseId = courseIds[courseName];
    const ids = [];
    for (const lesson of lessons) {
      const [lessonId] = await db("lessons").insert({
        ...lesson,
        course_id: courseId,
        content: JSON.stringify({ text: lesson.description }),
        status: "active",
        created_at: now,
        updated_at: now,
      });
      ids.push(lessonId);
    }
    lessonIdsByCourseName[courseName] = ids;
    console.log(`  ✓ ${lessons.length} lessons → "${courseName}"`);
  }

  // ── Reports ────────────────────────────────────────────────────────────
  console.log("\n🚩 Reports:");

  // Lấy 1 lesson từ course "TypeScript" để làm target
  const tsLessonId = lessonIdsByCourseName["TypeScript cho Backend Developer"]?.[1];
  const awsLessonId = lessonIdsByCourseName["AWS Cloud cho Developer — từ 0 đến deploy"]?.[0];
  const graphqlCourseId = courseIds["GraphQL & Apollo Server"];
  const rejectedCourseId = courseIds["Kiếm tiền online 2025"];

  const reports = [
    // ── Course reports ──
    {
      target_type: "course",
      target_id: rejectedCourseId,
      reason:
        "Nội dung khoá học này bị copy từ các khoá học khác, không có giá trị thực tế. Tôi đã học khoá học tương tự của tác giả khác và thấy nội dung giống hệt nhau đến 90%.",
      status: "pending",
      reporter_id: student3Id,
      created_at: new Date(now - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      target_type: "course",
      target_id: graphqlCourseId,
      reason:
        "Tiêu đề ghi 'Apollo Server v4' nhưng nội dung dùng Apollo Server v2 đã deprecated. Gây nhầm lẫn cho người học.",
      status: "approved",
      reporter_id: student3Id,
      approver_id: adminId,
      review_note: "Đã kiểm tra, nội dung không phù hợp với tiêu đề. Đã liên hệ giảng viên cập nhật.",
      reviewed_at: new Date(now - 1 * 24 * 60 * 60 * 1000),
      created_at: new Date(now - 6 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    // ── Lesson reports ──
    {
      target_type: "lesson",
      target_id: tsLessonId,
      reason:
        "Bài học này có nội dung sai về TypeScript Generics. Ví dụ trong bài dùng cú pháp của TypeScript 2.x, không tương thích với TypeScript 5.x hiện tại.",
      status: "pending",
      reporter_id: student3Id,
      created_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      target_type: "lesson",
      target_id: awsLessonId,
      reason:
        "Bài học IAM hướng dẫn cấp quyền AdministratorAccess cho tất cả user — đây là bad practice bảo mật nghiêm trọng, có thể khiến học viên tạo security hole trong production.",
      status: "rejected",
      reporter_id: lecturerId,
      approver_id: adminId,
      review_note: "Sau khi xem xét, đây là ví dụ học tập có chú thích rõ không dùng trong production. Bác bỏ report.",
      reviewed_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
      created_at: new Date(now - 5 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    // ── Teacher reports ──
    {
      target_type: "teacher",
      target_id: lecturer3Id,
      reason:
        "Giảng viên này đã phát ngôn không phù hợp trong phần bình luận khoá học, có lời lẽ mang tính kỳ thị khi trả lời câu hỏi của học viên. Tôi đã chụp ảnh màn hình làm bằng chứng.",
      status: "pending",
      reporter_id: student3Id,
      created_at: new Date(now - 1 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      target_type: "teacher",
      target_id: lecturer2Id,
      reason: "Giảng viên không trả lời câu hỏi trong suốt 2 tháng dù nhiều học viên đã ping.",
      status: "approved",
      reporter_id: lecturerId,
      approver_id: adminId,
      review_note: "Đã xác minh giảng viên không hoạt động 60 ngày. Đã gửi cảnh báo.",
      reviewed_at: new Date(now - 3 * 24 * 60 * 60 * 1000),
      created_at: new Date(now - 8 * 24 * 60 * 60 * 1000),
      updated_at: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const report of reports) {
    const [id] = await db("reports").insert(report);
    console.log(
      `  ✓ [${report.status.toUpperCase().padEnd(8)}] ${report.target_type.padEnd(7)} report (id=${id}, target_id=${report.target_id})`,
    );
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Admin Review seed hoàn tất!

👤 Tài khoản (đăng nhập admin để test):
   admin@test.com / Admin@123

📚 Courses để test admin review:
   [PENDING]  "TypeScript cho Backend Developer"         — lecturer2@test.com
   [PENDING]  "Machine Learning với Python & Scikit-learn" — lecturer3@test.com
   [PENDING]  "AWS Cloud cho Developer — từ 0 đến deploy"  — lecturer@test.com
   [APPROVED] "GraphQL & Apollo Server"                   — lecturer2@test.com (chờ publish)
   [REJECTED] "Kiếm tiền online 2025"                     — lecturer3@test.com

🚩 Reports để test admin reports:
   PENDING  | course  → "Kiếm tiền online 2025" (nội dung copy)
   APPROVED | course  → "GraphQL & Apollo Server" (tiêu đề sai version)
   PENDING  | lesson  → Bài "Types, Interfaces..." (cú pháp lỗi thời)
   REJECTED | lesson  → Bài "AWS IAM" (sau xem xét không vi phạm)
   PENDING  | teacher → lecturer3@test.com (phát ngôn không phù hợp)
   APPROVED | teacher → lecturer2@test.com (không hoạt động 60 ngày)

🧪 Test cases admin/courses:
   1. Vào /admin/courses → Tab "Chờ duyệt" → thấy 3 khóa học PENDING
   2. Click vào "TypeScript cho Backend Developer" → xem chi tiết lessons
   3. Bấm "Duyệt" → status chuyển sang APPROVED
   4. Bấm "Từ chối" (course ML) → status chuyển sang REJECTED
   5. Vào /admin/dashboard → thấy stats tổng quan (courses, enrollments, ratings)
   6. Tab "Tất cả" → thấy đủ 5 courses, phân trang đúng

🧪 Test cases admin/reports:
   1. Vào /admin/reports → Tab "Chờ xử lý" → thấy 3 reports PENDING
   2. Click report course "Kiếm tiền online" → xem target info (tên khóa học, status)
   3. Tick "Cấm đối tượng" + Bấm "Chấp nhận" → course bị ban
   4. Click report teacher lecturer3 → xem info (tên, email)
   5. Bấm "Từ chối" với note → report chuyển sang REJECTED
   6. Filter theo loại "lesson" → chỉ thấy lesson reports
   7. Tab "Tất cả" → thấy đủ 6 reports với pagination
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await db.destroy();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  db.destroy();
  process.exit(1);
});
