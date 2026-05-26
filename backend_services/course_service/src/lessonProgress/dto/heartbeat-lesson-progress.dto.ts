import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class HeartbeatLessonProgressDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position: number;
}
