import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLecturerRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  confirm?: string;
}
