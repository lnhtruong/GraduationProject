import { IsInt, IsOptional, IsString, MaxLength, MinLength, Min } from 'class-validator';

export class CreateDiscussionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;

  /**
   * If provided, this post is a reply to another post.
   * Two-level nesting is enforced at the service layer
   * (parentId must reference a root post, never a reply).
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}
