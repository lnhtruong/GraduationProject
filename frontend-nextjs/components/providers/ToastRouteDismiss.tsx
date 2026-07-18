"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export function ToastRouteDismiss() {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      toast.dismiss();
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  return null;
}
