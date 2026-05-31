import { Controller, Get } from '@nestjs/common';
import { CoursesService } from './course.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll() {
    return this.coursesService.findCategories();
  }
}
