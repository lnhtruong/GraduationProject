import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
} from '@nestjs/common';
import { LessonsService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons-query.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  private parseRequester(
    userIdHeader?: string,
    roleHeader?: string,
  ): { userId?: number; role?: number } {
    let userId: number | undefined;
    if (typeof userIdHeader === 'string' && userIdHeader.trim().length > 0) {
      const parsed = Number(userIdHeader);
      if (Number.isInteger(parsed) && parsed > 0) userId = parsed;
    }
    let role: number | undefined;
    if (typeof roleHeader === 'string' && roleHeader.trim().length > 0) {
      const parsed = Number(roleHeader);
      if (Number.isInteger(parsed)) role = parsed;
    }
    return { userId, role };
  }

  @Post()
  create(
    @Body() createLessonDto: CreateLessonDto,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    return this.lessonsService.create(
      createLessonDto,
      this.parseRequester(userIdHeader, roleHeader),
    );
  }

  @Get('course')
  findAllByCourseId(@Query() query: GetLessonsQueryDto) {
    return this.lessonsService.findAllByCourseId(query);
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
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    return this.lessonsService.update(
      +id,
      updateLessonDto,
      this.parseRequester(userIdHeader, roleHeader),
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    return this.lessonsService.remove(
      +id,
      this.parseRequester(userIdHeader, roleHeader),
    );
  }
}
