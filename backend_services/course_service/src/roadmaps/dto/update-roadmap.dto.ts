import { PartialType } from '@nestjs/mapped-types';
import { CreateRoadMapDto } from './create-roadmap.dto';

export class UpdateRoadMapDto extends PartialType(CreateRoadMapDto) {}