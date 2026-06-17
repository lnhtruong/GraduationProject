import { apiHttpClient } from "@/features/_shared/api-factories";

export interface QuizApiItem {
  id: number;
  name: string;
  lessonActivityId: number;
  passingScore?: number;
  timeLimitMinutes?: number;
  isInVideo?: boolean;
  questions?: { id: number }[];
}

export const quizApi = {
  /** GET /course/quizzes — trả về toàn bộ quiz (không filter theo instructor ở backend) */
  getAll: async (): Promise<QuizApiItem[]> => {
    const { data } = await apiHttpClient.get<QuizApiItem[]>("/course/quizzes");
    return Array.isArray(data) ? data : [];
  },

  /** DELETE /course/quizzes/:id */
  deleteQuiz: async (id: number): Promise<void> => {
    await apiHttpClient.delete(`/course/quizzes/${id}`);
  },
};
