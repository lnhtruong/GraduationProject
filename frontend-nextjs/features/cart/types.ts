export interface CartItem {
  id: number;
  courseId: number;
  title: string;
  instructorName: string;
  thumbnailUrl?: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  durationSeconds: number;
  price: number;
  avgRating?: number;
  reviewCount?: number;
  savedForLater: boolean;
  highlightVideoUrl?: string;
}

export interface CartSummary {
  subtotal: number;
  total: number;
  itemCount: number;
}
