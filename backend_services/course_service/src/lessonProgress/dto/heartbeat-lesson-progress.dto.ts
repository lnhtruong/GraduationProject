import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class HeartbeatLessonProgressDto {
  /** Last watched video position, in milliseconds. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647) // INT column ceiling (~24 days), guards against overflow
  position: number;
}
