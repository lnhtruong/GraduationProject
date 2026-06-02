export interface InstructorStats {
  followerCount: number;
  isFollowing: boolean;
}

export interface FollowingInstructor {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  title?: string;
}
