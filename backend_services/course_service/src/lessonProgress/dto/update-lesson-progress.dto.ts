import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateLessonProgressDto } from './create-lesson-progress.dto';

/** Only lesson state can change; identity fields are immutable. */
export class UpdateLessonProgressDto extends PartialType(
  OmitType(CreateLessonProgressDto, ['courseId', 'lessonId'] as const),
) { }
