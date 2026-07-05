import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Chính sách quyền riêng tư",
  description:
    "Cách LearnHub thu thập, sử dụng và bảo vệ thông tin cá nhân của người dùng.",
  path: "/privacy",
});

const sections = [
  {
    title: "Thông tin LearnHub thu thập",
    content:
      "Khi bạn tạo tài khoản, đăng nhập bằng email hoặc mạng xã hội, LearnHub có thể lưu các thông tin cơ bản như tên, email, ảnh đại diện và vai trò tài khoản. Khi bạn học, hệ thống có thể ghi nhận khóa học đã đăng ký, tiến độ học, lịch sử tương tác, bình luận, đánh giá và nội dung bạn tải lên.",
  },
  {
    title: "Cách sử dụng thông tin",
    content:
      "Thông tin được dùng để vận hành tài khoản, cá nhân hóa trải nghiệm học tập, lưu tiến độ, hiển thị nội dung phù hợp, xử lý thanh toán, hỗ trợ người dùng và cải thiện chất lượng nền tảng.",
  },
  {
    title: "Đăng nhập bằng Facebook hoặc Google",
    content:
      "Khi bạn chọn đăng nhập qua bên thứ ba, LearnHub chỉ nhận các thông tin bạn cho phép, thường gồm tên, email và ảnh đại diện. LearnHub không nhận mật khẩu Facebook hoặc Google của bạn.",
  },
  {
    title: "Chia sẻ dữ liệu",
    content:
      "LearnHub không bán thông tin cá nhân của bạn. Dữ liệu chỉ được chia sẻ khi cần thiết để vận hành dịch vụ, tuân thủ yêu cầu pháp luật, xử lý thanh toán hoặc bảo vệ quyền lợi hợp pháp của người dùng và nền tảng.",
  },
  {
    title: "Bảo mật và lưu trữ",
    content:
      "LearnHub áp dụng các biện pháp kỹ thuật hợp lý để bảo vệ dữ liệu. Tuy vậy, không có hệ thống trực tuyến nào an toàn tuyệt đối, vì vậy bạn nên giữ an toàn cho tài khoản và thông báo cho LearnHub nếu phát hiện truy cập bất thường.",
  },
  {
    title: "Quyền của bạn",
    content:
      "Bạn có thể yêu cầu cập nhật, chỉnh sửa hoặc xóa một số thông tin cá nhân theo phạm vi hệ thống hỗ trợ và quy định áp dụng. Với yêu cầu liên quan dữ liệu, hãy liên hệ LearnHub qua email hỗ trợ.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-background">
      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            LearnHub
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Chính sách quyền riêng tư
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            Trang này giải thích cách LearnHub xử lý thông tin cá nhân khi bạn
            sử dụng website, đăng nhập, học tập hoặc tạo nội dung trên nền tảng.
          </p>
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            Cập nhật lần cuối: 05/07/2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-xl font-bold tracking-tight">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {section.content}
              </p>
            </article>
          ))}

          <article className="rounded-2xl border border-border/70 bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">Liên hệ</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Nếu bạn có câu hỏi về quyền riêng tư hoặc dữ liệu cá nhân, vui
              lòng liên hệ qua email{" "}
              <a
                href="mailto:support@learnhub.edu.vn"
                className="font-semibold text-primary hover:underline"
              >
                support@learnhub.edu.vn
              </a>
              .
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
