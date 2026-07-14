import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Điều khoản dịch vụ",
  description:
    "Các điều khoản khi sử dụng tài khoản, khóa học, thanh toán và nội dung trên StudyLoop.",
  path: "/terms",
});

const sections = [
  {
    title: "Chấp nhận điều khoản",
    content:
      "Khi truy cập hoặc sử dụng StudyLoop, bạn đồng ý tuân thủ các điều khoản này. Nếu không đồng ý, bạn nên ngừng sử dụng dịch vụ.",
  },
  {
    title: "Tài khoản người dùng",
    content:
      "Bạn chịu trách nhiệm bảo mật tài khoản, thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình. Thông tin đăng ký cần chính xác để StudyLoop có thể hỗ trợ khi cần.",
  },
  {
    title: "Khóa học và nội dung học tập",
    content:
      "Nội dung trên StudyLoop được cung cấp cho mục đích học tập. Bạn không được sao chép, phân phối lại, bán lại hoặc sử dụng nội dung trái phép khi chưa có sự đồng ý của chủ sở hữu hợp pháp.",
  },
  {
    title: "Nội dung do người dùng tạo",
    content:
      "Khi tải lên video, bình luận, đánh giá hoặc tài liệu, bạn xác nhận mình có quyền sử dụng nội dung đó và nội dung không vi phạm pháp luật, quyền riêng tư, bản quyền hoặc quyền của bên thứ ba.",
  },
  {
    title: "Thanh toán và quyền truy cập",
    content:
      "Một số khóa học hoặc tính năng có thể yêu cầu thanh toán. Quyền truy cập phụ thuộc vào trạng thái đơn hàng, chính sách của khóa học và quy định hiện hành của StudyLoop.",
  },
  {
    title: "Tạm ngừng hoặc chấm dứt tài khoản",
    content:
      "StudyLoop có thể giới hạn hoặc tạm ngừng tài khoản nếu phát hiện hành vi gian lận, lạm dụng hệ thống, vi phạm điều khoản hoặc gây ảnh hưởng đến người dùng khác.",
  },
  {
    title: "Thay đổi dịch vụ",
    content:
      "StudyLoop có thể cập nhật giao diện, tính năng, chính sách hoặc điều khoản để cải thiện dịch vụ. Các thay đổi quan trọng sẽ được thông báo bằng phương thức phù hợp.",
  },
];

export default function TermsPage() {
  return (
    <main className="bg-background">
      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            StudyLoop
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Điều khoản dịch vụ
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            Các điều khoản này mô tả quyền và trách nhiệm khi bạn sử dụng
            StudyLoop để học tập, tạo nội dung hoặc quản lý khóa học.
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
              Nếu cần hỗ trợ về điều khoản dịch vụ, vui lòng liên hệ qua email{" "}
              <a
                href="mailto:support@studyloop.edu.vn"
                className="font-semibold text-primary hover:underline"
              >
                support@studyloop.edu.vn
              </a>
              .
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
