import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { GetQuizSubmissionsAdminQueryDto } from './dto/get-quiz-submissions-admin-query.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizSubmissionsService } from './quiz-submissions.service';

const ADMIN_ROLE = 1;
const LECTURER_ROLE = 3;

@Controller('quiz-submissions')
export class QuizSubmissionsController {
  constructor(private readonly quizSubmissionsService: QuizSubmissionsService) { }

  private parseUserId(userIdHeader?: string): number {
    if (!userIdHeader) {
      throw new UnauthorizedException('Authentication required');
    }
    const userId = Number(userIdHeader);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid user ID');
    }
    return userId;
  }

  private assertAdmin(roleHeader?: string): void {
    const role = Number(roleHeader);
    if (!Number.isInteger(role) || role !== ADMIN_ROLE) {
      throw new UnauthorizedException('Admin permission required');
    }
  }

  private assertLecturerOrAdmin(roleHeader?: string): void {
    const role = Number(roleHeader);
    if (!Number.isInteger(role) || (role !== ADMIN_ROLE && role !== LECTURER_ROLE)) {
      throw new UnauthorizedException('Lecturer or admin permission required');
    }
  }

  private parseRole(roleHeader?: string): number {
    const role = Number(roleHeader);
    if (!Number.isInteger(role) || role <= 0) {
      throw new UnauthorizedException('Invalid user role');
    }
    return role;
  }

  @Post()
  async submit(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Body() payload: SubmitQuizDto,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const role = this.parseRole(roleHeader);
    return await this.quizSubmissionsService.submit(userId, role, payload);
  }

  @Get('mine')
  async findMine(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Query('quizId') quizId?: string,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const role = this.parseRole(roleHeader);
    let parsedQuizId: number | undefined;
    if (typeof quizId === 'string' && quizId.trim().length > 0) {
      parsedQuizId = Number(quizId);
      if (!Number.isInteger(parsedQuizId) || parsedQuizId <= 0) {
        throw new BadRequestException('quizId must be a positive integer');
      }
    }

    return await this.quizSubmissionsService.findMine(userId, role, parsedQuizId);
  }

  @Get('stats/quiz/:quizId')
  async getQuizStats(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
  ) {
    this.assertLecturerOrAdmin(roleHeader);
    const requesterId = this.parseUserId(userIdHeader);
    const role = this.parseRole(roleHeader);
    return await this.quizSubmissionsService.getStatsForQuiz(
      quizId,
      requesterId,
      role,
    );
  }

  @Get()
  async findAllForAdmin(
    @Headers('x-user-role') roleHeader: string,
    @Query() query: GetQuizSubmissionsAdminQueryDto,
  ) {
    this.assertAdmin(roleHeader);
    return await this.quizSubmissionsService.findAllForAdmin(query);
  }
}
