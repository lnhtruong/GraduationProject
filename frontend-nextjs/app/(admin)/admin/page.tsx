import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Quản trị LearnHub",
  "Không gian quản trị hệ thống LearnHub.",
);

import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
