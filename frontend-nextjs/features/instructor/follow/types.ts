export interface InstructorStats {
  followerCount: number;
  isFollowing: boolean;
}

export interface FollowingInstructor {
  id: number;
  name: string;
  avatarUrl?: string;
}
