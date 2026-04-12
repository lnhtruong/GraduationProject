import type { FeaturedCourse } from "../types";

export const MOCK_FEATURED_COURSES: FeaturedCourse[] = [
  {
    id: 1,
    title: "Toán 10 - Phương trình và bất phương trình",
    instructor: "Nguyễn Văn A",
    instructorAvatar: null,
    rating: 4.8,
    reviewCount: 1234,
    price: null,
    category: "Toán học",
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop",
  },
  {
    id: 2,
    title: "Vật lý 11 - Cơ học chất điểm",
    instructor: "Trần Thị B",
    instructorAvatar: null,
    rating: 4.9,
    reviewCount: 2345,
    price: 299000,
    category: "Vật lý",
    thumbnail:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=225&fit=crop",
  },
  {
    id: 3,
    title: "Hóa 12 - Phản ứng hóa học",
    instructor: "Lê Văn C",
    instructorAvatar: null,
    rating: 4.7,
    reviewCount: 1567,
    price: 399000,
    category: "Hóa học",
    thumbnail:
      "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=400&h=225&fit=crop",
  },
  {
    id: 4,
    title: "Ngữ văn 10 - Văn học Việt Nam",
    instructor: "Phạm Thị D",
    instructorAvatar: null,
    rating: 4.8,
    reviewCount: 3456,
    price: null,
    category: "Văn học",
    thumbnail:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=225&fit=crop",
  },
];
