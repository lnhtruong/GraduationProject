import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CheckOtpDto } from './dto/check-otp.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { ForgotPasswordRateLimitGuard } from './guards/forgot-password-rate-limit.guard';
import { COOKIE_CONFIG } from './constants/cookie.constant';
import type { Response, Request } from 'express';

//jwtauthguard chạy trước -> decode token -> payload -> lưu vào req.user. Controller sẽ đọc đc req.user và truyền vào service

//jwtauthguard chạy trước -> decode token -> payload -> lưu vào req.user. Controller sẽ đọc đc req.user và truyền vào service

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    console.log('check2');
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respondWithAuthTokens(
      await this.authService.login(loginDto),
      res,
    );
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respondWithAuthTokens(
      await this.authService.googleLogin(googleLoginDto),
      res,
    );
  }

  @Get('github')
  async githubOAuth(@Res() res: Response) {
    const url = await this.authService.buildGithubOAuthUrl();
    res.redirect(url);
  }

  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (!code) {
      return res.redirect(
        `${frontendUrl}/auth/oauth-callback?error=login_failed`,
      );
    }

    try {
      const result = await this.authService.githubCallback(code, state);
      res.cookie(
        COOKIE_CONFIG.REFRESH_TOKEN_NAME,
        result.refreshToken,
        COOKIE_CONFIG.REFRESH_TOKEN_OPTIONS,
      );
      const nonce = await this.authService.createOAuthSession({
        accessToken: result.accessToken,
        user: result.user,
      });
      return res.redirect(
        `${frontendUrl}/auth/oauth-callback?session=${nonce}`,
      );
    } catch (err) {
      console.error(
        'GitHub OAuth callback failed:',
        err?.response?.data ?? err,
      );
      return res.redirect(
        `${frontendUrl}/auth/oauth-callback?error=login_failed`,
      );
    }
  }

  @Get('facebook')
  async facebookOAuth(@Res() res: Response) {
    const url = await this.authService.buildFacebookOAuthUrl();
    res.redirect(url);
  }

  @Get('facebook/callback')
  async facebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (!code) {
      return res.redirect(
        `${frontendUrl}/auth/oauth-callback?error=login_failed`,
      );
    }

    try {
      const result = await this.authService.facebookCallback(code, state);
      res.cookie(
        COOKIE_CONFIG.REFRESH_TOKEN_NAME,
        result.refreshToken,
        COOKIE_CONFIG.REFRESH_TOKEN_OPTIONS,
      );
      const nonce = await this.authService.createOAuthSession({
        accessToken: result.accessToken,
        user: result.user,
      });
      return res.redirect(
        `${frontendUrl}/auth/oauth-callback?session=${nonce}`,
      );
    } catch (err) {
      console.error(
        'Facebook OAuth callback failed:',
        err?.response?.data ?? err,
      );
      return res.redirect(
        `${frontendUrl}/auth/oauth-callback?error=login_failed`,
      );
    }
  }

  @Get('oauth-session')
  @HttpCode(HttpStatus.OK)
  async getOAuthSession(
    @Query('session') nonce: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!nonce) throw new UnauthorizedException('Missing session');
    const session = await this.authService.consumeOAuthSession(nonce);
    if (!session) throw new UnauthorizedException('Session expired or invalid');
    return session;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[COOKIE_CONFIG.REFRESH_TOKEN_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshToken(refreshToken);

    res.cookie(
      COOKIE_CONFIG.REFRESH_TOKEN_NAME,
      result.refreshToken,
      COOKIE_CONFIG.REFRESH_TOKEN_OPTIONS,
    );

    return { accessToken: result.accessToken };
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
  @UseGuards(ForgotPasswordRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('check-otp')
  @HttpCode(HttpStatus.OK)
  async checkOtp(@Body() checkOtpDto: CheckOtpDto) {
    return this.authService.checkOtpAndResetPassword(checkOtpDto);
  }

  private respondWithAuthTokens(
    result: { user: object; accessToken: string; refreshToken: string },
    res: Response,
  ) {
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
}
