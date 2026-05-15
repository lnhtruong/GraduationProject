import type { ReactNode } from "react";
import { NewsfeedChrome } from "@/features/newsfeed/components/NewsfeedChrome";

export default function NewsfeedLayout({ children }: { children: ReactNode }) {
	return <NewsfeedChrome>{children}</NewsfeedChrome>;
}