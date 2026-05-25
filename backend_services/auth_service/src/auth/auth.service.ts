import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, TokenPayload as GoogleTokenPayload } from 'google-auth-library';
import { User } from '../users/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { JwtTokenService, TokenPayload } from './jwt/jwt.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CheckOtpDto } from './dto/check-otp.dto';
const DEFAULT_USER_ROLE = 2; // default là student

const OTP_FAIL_WINDOW_SECONDS = 15 * 60;
const OTP_FAIL_THRESHOLD = 5;
const OTP_LOCK_TTL_SECONDS = 30 * 60;

const otpFailKey = (email: string) => `OTP_FAIL:${email}`;
const otpLockKey = (email: string) => `OTP_LOCK:${email}`;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client();

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly jwtTokenService: JwtTokenService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.userModel.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (!existingUser.password) {
        throw new BadRequestException(
          'This email is linked to Google sign-in. Please continue with Google.',
        );
      }
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role: DEFAULT_USER_ROLE,
    });

    return {
      user: this.toAuthUserResponse(user),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userModel.findOne({
      where: { email: normalizedEmail },
    });

    if (!user?.password) {
      throw new UnauthorizedException('Invalid account or password!');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid account or password!');
    }

    return this.issueAuthTokens(user);
  }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const { credential } = googleLoginDto;
    const googlePayload = await this.verifyGoogleIdToken(credential);

    const googleId = googlePayload.sub;
    const email = googlePayload.email?.trim().toLowerCase();

    if (!googleId || !email) {
      throw new UnauthorizedException('Invalid Google account');
    }

    if (!googlePayload.email_verified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    let user = await this.userModel.findOne({ where: { email } });

    if (user) {
      if (!user.googleId) {
        await user.update({ googleId, emailVerified: true });
      }
      return this.issueAuthTokens(user);
    }

    user = await this.userModel.create({
      email,
      password: null,
      firstName: googlePayload.given_name || null,
      lastName: googlePayload.family_name || null,
      role: DEFAULT_USER_ROLE,
      googleId,
      emailVerified: true,
      avatarUrl: googlePayload.picture || null,
    });

    return this.issueAuthTokens(user);
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.jwtTokenService.decodeToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.redisService.get(
      this.getRefreshTokenKey(payload.userId),
    );

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    const newAccessToken = await this.jwtTokenService.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    return {
      accessToken: newAccessToken,
    };
  }

  async logout(userId: number) {
    await this.redisService.del(this.getRefreshTokenKey(userId));

    return {
      message: 'Logged out successfully',
    };
  }

  async issueToken(payload: TokenPayload) {
    const tokenPair = this.jwtTokenService.generateTokenPair(payload);
    await this.storeRefreshToken(
      payload.userId,
      (await tokenPair).refreshToken,
    );

    return {
      accessToken: (await tokenPair).accessToken,
      refreshToken: (await tokenPair).refreshToken,
    };
  }

  async validateCredential(validateTokenDto: ValidateTokenDto) {
    const { token } = validateTokenDto;

    try {
      const payload = await this.jwtTokenService.verifyToken(token);

      const user = await this.userModel.findByPk(payload.userId);

      if (!user) {
        return {
          valid: false,
          reason: 'User not found',
        };
      }

      return {
        valid: true,
        payload: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        },
      };
    } catch (error) {
      return {
        valid: false,
        reason: error.message || 'Invalid token',
      };
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const normalizedEmail = email.trim().toLowerCase();

    // Per-email lockout overrides any IP-level allowance.
    if (await this.redisService.exists(otpLockKey(normalizedEmail))) {
      const ttl = await this.redisService.ttl(otpLockKey(normalizedEmail));
      const retryAfter = ttl > 0 ? ttl : OTP_LOCK_TTL_SECONDS;
      throw new HttpException(
        {
          success: false,
          message: 'Account temporarily locked',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userModel.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    const mailServiceUrl =
      this.configService.get<string>('MAIL_SERVICE_URL') ||
      process.env.MAIL_SERVICE_URL ||
      'http://localhost:3000';

    try {
      await this.httpService.axiosRef.post(`${mailServiceUrl}/mail/otp`, {
        email: normalizedEmail,
      });

      return {
        message: 'OTP sent to email',
      };
    } catch (err: any) {
      // Forward mail_service's per-email 429 so the client gets a real
      // rate-limit response with retryAfter, not a generic 400 they can
      // keep hammering until the IP guard finally trips.
      if (err?.response?.status === HttpStatus.TOO_MANY_REQUESTS) {
        const retryAfter = Number(err.response.data?.retryAfter) || 300;
        throw new HttpException(
          {
            success: false,
            message: 'Too many requests',
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      this.logger.warn(
        `Mail OTP send failed for ${normalizedEmail}: ${err?.message ?? err}`,
      );
      throw new BadRequestException('Failed to send OTP email');
    }
  }

  async checkOtpAndResetPassword(checkOtpDto: CheckOtpDto) {
    const { email, otp, newPassword } = checkOtpDto;
    const normalizedEmail = email.trim().toLowerCase();
    const redisKey = `MAIL_OTP:${normalizedEmail}`;

    // Block locked accounts up-front. 423 LOCKED per API contract.
    if (await this.redisService.exists(otpLockKey(normalizedEmail))) {
      throw new HttpException(
        {
          success: false,
          message: 'Account locked. Try again after 30 minutes.',
        },
        HttpStatus.LOCKED,
      );
    }

    const storedOtp = await this.redisService.get(redisKey);

    if (!storedOtp || storedOtp !== otp) {
      const failures = await this.redisService.incrWithTtl(
        otpFailKey(normalizedEmail),
        OTP_FAIL_WINDOW_SECONDS,
      );

      if (failures >= OTP_FAIL_THRESHOLD) {
        const locked = await this.redisService.setLock(
          otpLockKey(normalizedEmail),
          new Date().toISOString(),
          OTP_LOCK_TTL_SECONDS,
        );
        await this.redisService.del(otpFailKey(normalizedEmail));

        if (locked) {
          // Audit log — captured by ops via stdout collection. When the
          // audit_logs table from feat/242 lands, swap this for a row insert.
          this.logger.warn(
            `AUDIT_LOCKOUT email=${normalizedEmail} failures=${failures} ttl=${OTP_LOCK_TTL_SECONDS}s`,
          );
        }

        throw new HttpException(
          {
            success: false,
            message: 'Account locked. Try again after 30 minutes.',
          },
          HttpStatus.LOCKED,
        );
      }

      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.userModel.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({ password: hashedPassword });

    await this.redisService.del(redisKey);
    await this.redisService.del(otpFailKey(normalizedEmail));

    return {
      message: 'Password has been reset successfully',
    };
  }

  private async issueAuthTokens(user: User) {
    const tokenPair = await this.jwtTokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role ?? DEFAULT_USER_ROLE,
    });

    await this.storeRefreshToken(user.id, tokenPair.refreshToken);

    return {
      user: this.toAuthUserResponse(user),
      ...tokenPair,
    };
  }

  private toAuthUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<GoogleTokenPayload> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!googleClientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return payload;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private async storeRefreshToken(userId: number, refreshToken: string) {
    const ttl = this.configService.get('redis.ttl');
    await this.redisService.set(
      this.getRefreshTokenKey(userId),
      refreshToken,
      ttl,
    );
  }

  private getRefreshTokenKey(userId: number): string {
    return `refresh_token:${userId}`;
  }
}
