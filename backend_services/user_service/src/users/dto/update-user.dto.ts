import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  role?: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;
  
  @MinLength(8)
  @MaxLength(255)
  password?: string;
}
