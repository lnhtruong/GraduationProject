// src/models/lesson-activities/dto/update-lesson-activity.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonActivityDto } from './create-lesson-activities.dto';

export class UpdateLessonActivityDto extends PartialType(CreateLessonActivityDto) {}