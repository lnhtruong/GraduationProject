import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { RoadMapCourseStatus } from 'src/models/roadmap-course.model';

export class AddRoadMapCourseDto {
  @IsInt()
  courseId: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  orderIndex?: number;

  @IsEnum(RoadMapCourseStatus)
  @IsOptional()
  status?: RoadMapCourseStatus | null;
}