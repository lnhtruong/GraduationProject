import { PartialType } from '@nestjs/mapped-types';
import { CreateMascotOverlayDto } from './create-mascot-overlay.dto';

export class UpdateMascotOverlayDto extends PartialType(CreateMascotOverlayDto) { }