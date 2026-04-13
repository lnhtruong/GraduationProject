"use client";

import { BookOpenText } from "lucide-react";
import CreateCourseForm from "@/features/courses/create/components/CreateCourseForm";
import CoursePublishGuide from "@/features/courses/create/components/CoursePublishGuide";

export default function CreateCourse() {
	return (
		<div className="relative min-h-screen overflow-hidden bg-background">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />

			<div className="container relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
				<header className="mb-8 space-y-4">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
						<BookOpenText className="h-3.5 w-3.5" />
						Course Studio
					</div>

					<div className="space-y-2">
						<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
							Tạo khóa học mới
						</h1>
						<p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
							Thiết lập nhanh nội dung nền tảng để khởi tạo khóa học. Bạn có thể
							bổ sung lesson, media và tài nguyên chi tiết ở bước biên tập tiếp
							theo.
						</p>
					</div>
				</header>

				<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
					<CreateCourseForm />
					<CoursePublishGuide />
				</div>
			</div>
		</div>
	);
}
