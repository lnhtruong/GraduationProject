"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileContent } from "@/features/profile/components/ProfileContent";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
