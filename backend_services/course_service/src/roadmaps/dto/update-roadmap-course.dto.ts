import { PartialType } from '@nestjs/mapped-types';
import { AddRoadMapCourseDto } from './add-roadmap-course.dto';

export class UpdateRoadMapCourseDto extends PartialType(AddRoadMapCourseDto) {}