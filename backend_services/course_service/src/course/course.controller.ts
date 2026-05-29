import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CoursesService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { SearchCoursesQueryDto } from './dto/search-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseLevel, CourseStatus } from 'src/models/course.model';
import { buildRequesterFromHeaders } from 'src/audit_logs/requester.types';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  private parseRequiredUserId(userIdHeader?: string): number {
    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Authentication required');
    }
    return userId;
  }

  private parseRequiredRole(roleHeader?: string): number {
    const role = Number(roleHeader);
    if (!Number.isInteger(role)) {
      throw new UnauthorizedException('User role is required');
    }
    if (role !== 1 && role !== 3) {
      throw new ForbiddenException('Lecturer or admin permission required');
    }
    return role;
  }

  @Post()
  create(@Body() createCourseDto: CreateCourseDto, @Headers('x-user-id') userIdHeader?: string) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    return this.coursesService.create(createCourseDto, user_id);
  }

  @Get('mine')
  findAllMine(
    @Query('status') status?: CourseStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('x-user-id') userIdHeader?: string,
  ) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;
    const parsedPage = page !== undefined ? Number(page) : undefined;
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;

    return this.coursesService.findAll(
      user_id,
      status,
      parsedPage,
      parsedLimit,
    );
  }

  @Get()
  findAll(
    @Query('status') status?: CourseStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('level') level?: CourseLevel,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('userId') userId?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const parsedPage = page !== undefined ? Number(page) : undefined;
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const parsedMinPrice = minPrice !== undefined ? Number(minPrice) : undefined;
    const parsedMaxPrice = maxPrice !== undefined ? Number(maxPrice) : undefined;

    let filterUserId: number | undefined;
    if (userId !== undefined) {
      const role = Number(roleHeader);
      if (role !== 1) {
        throw new ForbiddenException(
          'Only admin can filter courses by lecturer userId',
        );
      }
      const parsedUserId = Number(userId);
      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        throw new BadRequestException('Invalid userId filter');
      }
      filterUserId = parsedUserId;
    }

    return this.coursesService.findAllPublic({
      status,
      page: parsedPage,
      limit: parsedLimit,
      search,
      level,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
      userId: filterUserId,
    });
  }

  @Get('search')
  search(@Query() query: SearchCoursesQueryDto) {
    return this.coursesService.searchPublishedCourses(query);
  }

  @Get('stats/overview')
  getOverviewStats(
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);
    const role = this.parseRequiredRole(roleHeader);
    return this.coursesService.getOverviewStats(userId, role);
  }

  @Get(':id/stats/overview')
  getCourseStats(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userIdHeader?: string,
    @Headers('x-user-role') roleHeader?: string,
  ) {
    const userId = this.parseRequiredUserId(userIdHeader);
    const role = this.parseRequiredRole(roleHeader);
    return this.coursesService.getCourseStatsOverview(id, userId, role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') uid: string,
    @Headers('x-user-role') role: string,
    @Headers('x-forwarded-for') ff: string,
    @Headers('user-agent') ua: string,
  ) {
    const requester = buildRequesterFromHeaders(uid, role, ff, ua) ?? undefined;
    return this.coursesService.remove(id, requester);
  }

  @Post(':id/submit-for-review')
  submitForReview(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.submitForReview(id);
  }

  @Post(':id/review')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'accepted' | 'rejected' },
    @Headers('x-user-id') uid: string,
    @Headers('x-user-role') role: string,
    @Headers('x-forwarded-for') ff: string,
    @Headers('user-agent') ua: string,
  ) {
    const requester = buildRequesterFromHeaders(uid, role, ff, ua) ?? undefined;
    return this.coursesService.review(id, body.status, requester);
  }

  @Post(':id/publish')
  publish(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') uid: string,
    @Headers('x-user-role') role: string,
    @Headers('x-forwarded-for') ff: string,
    @Headers('user-agent') ua: string,
  ) {
    const requester = buildRequesterFromHeaders(uid, role, ff, ua) ?? undefined;
    return this.coursesService.publish(id, requester);
  }
}
