import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDiscussionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;
}
