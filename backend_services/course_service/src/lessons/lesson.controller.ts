import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { LessonsService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) { }

  @Post()
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  @Get('course')
  findAllByCourseId(@Query('courseId') courseId?: number | null) {
    return this.lessonsService.findAllByCourseId(courseId);
  }

  // @Get('user')
  // findAllByUserId(@Headers('x-user-id') userIdHeader?: string) {
  //   const user_id =
  //           typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
  //               ? Number(userIdHeader)
  //               : undefined;
  //   return this.lessonsService.findAllByUserId(user_id);
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonsService.update(+id, updateLessonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(+id);
  }
}