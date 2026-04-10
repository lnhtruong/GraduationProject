import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoadMapDto {
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;
}