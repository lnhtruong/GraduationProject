import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AddManyRoadMapCoursesDto } from './dto/add-many-roadmap-courses.dto';
import { AddRoadMapCourseDto } from './dto/add-roadmap-course.dto';
import { CreateRoadMapDto } from './dto/create-roadmap.dto';
import { ReorderRoadMapCoursesDto } from './dto/reorder-roadmap-courses.dto';
import { UpdateRoadMapCourseDto } from './dto/update-roadmap-course.dto';
import { UpdateRoadMapDto } from './dto/update-roadmap.dto';
import { RoadmapsService } from './roadmaps.service';

@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Post()
  create(@Body() createRoadMapDto: CreateRoadMapDto) {
    return this.roadmapsService.create(createRoadMapDto);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedUserId = userId !== undefined ? Number(userId) : undefined;
    const parsedPage = page !== undefined ? Number(page) : undefined;
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;

    return this.roadmapsService.findAll(parsedUserId, parsedPage, parsedLimit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roadmapsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoadMapDto: UpdateRoadMapDto,
  ) {
    return this.roadmapsService.update(id, updateRoadMapDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roadmapsService.remove(id);
  }

  @Post(':id/courses')
  addCourse(
    @Param('id', ParseIntPipe) roadMapId: number,
    @Body() addRoadMapCourseDto: AddRoadMapCourseDto,
  ) {
    return this.roadmapsService.addCourse(roadMapId, addRoadMapCourseDto);
  }

  @Post(':id/courses/bulk')
  addCoursesBulk(
    @Param('id', ParseIntPipe) roadMapId: number,
    @Body() addManyRoadMapCoursesDto: AddManyRoadMapCoursesDto,
  ) {
    return this.roadmapsService.addCoursesBulk(
      roadMapId,
      addManyRoadMapCoursesDto,
    );
  }

  @Patch(':id/courses/reorder')
  reorderCourses(
    @Param('id', ParseIntPipe) roadMapId: number,
    @Body() reorderRoadMapCoursesDto: ReorderRoadMapCoursesDto,
  ) {
    return this.roadmapsService.reorderCourses(
      roadMapId,
      reorderRoadMapCoursesDto,
    );
  }

  @Patch(':id/courses/:courseId')
  updateCourse(
    @Param('id', ParseIntPipe) roadMapId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() updateRoadMapCourseDto: UpdateRoadMapCourseDto,
  ) {
    return this.roadmapsService.updateCourse(
      roadMapId,
      courseId,
      updateRoadMapCourseDto,
    );
  }

  @Delete(':id/courses/:courseId')
  removeCourse(
    @Param('id', ParseIntPipe) roadMapId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.roadmapsService.removeCourse(roadMapId, courseId);
  }
}