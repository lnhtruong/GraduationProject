import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { AddRoadMapCourseDto } from './add-roadmap-course.dto';

export class AddManyRoadMapCoursesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AddRoadMapCourseDto)
  courses: AddRoadMapCourseDto[];
}
