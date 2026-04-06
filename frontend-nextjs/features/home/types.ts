/**
 * Home feature types
 */

export interface FeaturedCourse {
  id: number;
  title: string;
  instructor: string;
  instructorAvatar: string | null;
  rating: number;
  reviewCount: number;
  /** null = free */
  price: number | null;
  category: string;
  thumbnail: string;
}
