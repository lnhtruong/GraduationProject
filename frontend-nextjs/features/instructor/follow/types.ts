export interface InstructorStats {
  followerCount: number;
  isFollowing: boolean;
}

export interface FollowingInstructor {
  id: number;
  name: string;
  avatarUrl?: string;
}

export interface FollowingInstructorsPage {
  data: FollowingInstructor[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
