import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CheckOtpDto } from './dto/check-otp.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { COOKIE_CONFIG } from './constants/cookie.constant';
import type { Response, Request } from 'express';

//jwtauthguard chạy trước -> decode token -> payload -> lưu vào req.user. Controller sẽ đọc đc req.user và truyền vào service

//jwtauthguard chạy trước -> decode token -> payload -> lưu vào req.user. Controller sẽ đọc đc req.user và truyền vào service

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    console.log('check2')
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    res.cookie(
      COOKIE_CONFIG.REFRESH_TOKEN_NAME,
      result.refreshToken,
      COOKIE_CONFIG.REFRESH_TOKEN_OPTIONS,
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request, @Body() refreshTokenDto: RefreshTokenDto) {
    let { refreshToken } = refreshTokenDto;

    if (!refreshToken) {
      refreshToken = req.cookies[COOKIE_CONFIG.REFRESH_TOKEN_NAME];
    }

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    res.clearCookie(
      COOKIE_CONFIG.REFRESH_TOKEN_NAME,
      COOKIE_CONFIG.REFRESH_TOKEN_OPTIONS,
    );

    return this.authService.logout(req.user.userId);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateCredential(@Body() validateTokenDto: ValidateTokenDto) {
    return this.authService.validateCredential(validateTokenDto);
  }

  @Post('issue-token')
  @HttpCode(HttpStatus.OK)
  async issueToken(
    @Body() payload: { userId: number; email: string; role: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.issueToken(payload);

    // Set refresh token vào HTTP-only cookie
    res.cookie(
      COOKIE_CONFIG.REFRESH_TOKEN_NAME,
      result.refreshToken,
      COOKIE_CONFIG.REFRESH_TOKEN_OPTIONS,
    );

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('check-otp')
  @HttpCode(HttpStatus.OK)
  async checkOtp(@Body() checkOtpDto: CheckOtpDto) {
    return this.authService.checkOtpAndResetPassword(checkOtpDto);
  }
}
