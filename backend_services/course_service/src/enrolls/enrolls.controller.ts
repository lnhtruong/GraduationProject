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
  Headers
} from '@nestjs/common';
import { EnrollsService } from './enrolls.service';
import { CreateEnrollDto } from './dto/create-enroll.dto';
import { UpdateEnrollDto } from './dto/update-enroll.dto';
import { GetEnrollsQueryDto } from './dto/get-enrolls-query.dto';
import { CheckEnrollExistsDto } from './dto/check-enroll-exists.dto';

@Controller('enroll')
export class EnrollsController {
  constructor(private readonly enrollsService: EnrollsService) { }

  @Post()
  create(@Body() dto: CreateEnrollDto, @Headers('x-user-id') userIdHeader?: string) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;

    return this.enrollsService.create(dto, user_id);
  }

  @Get()
  findAll(@Query() query: GetEnrollsQueryDto, @Headers('x-user-id') userIdHeader?: string) {
    const user_id =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : undefined;

    return this.enrollsService.findAll(query, user_id);
  }

  @Get('check-mine-exists')
  checkMineExists(@Query() dto: CheckEnrollExistsDto) {
    return this.enrollsService.checkEnrollExists(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enrollsService.findOne(id);
  }


  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnrollDto,
  ) {
    return this.enrollsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enrollsService.remove(id);
  }
}
