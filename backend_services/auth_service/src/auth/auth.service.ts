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
import * as crypto from 'crypto';
import {
  OAuth2Client,
  TokenPayload as GoogleTokenPayload,
} from 'google-auth-library';
import { User } from '../users/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import {
  JwtTokenService,
  RefreshTokenPayload,
  TokenPayload,
} from './jwt/jwt.service';
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
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.userModel.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (!existingUser.password) {
        // Account created via OAuth — link password so user can also login with email
        const hashedPassword = await bcrypt.hash(password, 10);
        const updates: Record<string, unknown> = { password: hashedPassword };
        if (!existingUser.firstName && firstName) updates.firstName = firstName;
        if (!existingUser.lastName && lastName) updates.lastName = lastName;
        await existingUser.update(updates);
        return { user: this.toAuthUserResponse(existingUser) };
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
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const redisKey = this.getRefreshTokenKey(payload.userId);
    const storedJti = await this.redisService.get(redisKey);

    if (!storedJti) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    if (storedJti !== payload.jti) {
      // Reuse detected — wipe the session so the legitimate user is also forced
      // to re-login (defensive: assume the token has leaked).
      await this.redisService.del(redisKey);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const tokenPair = await this.jwtTokenService.generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    await this.storeRefreshToken(payload.userId, tokenPair.refreshJti);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }

  async logout(userId: number) {
    await this.redisService.del(this.getRefreshTokenKey(userId));

    return {
      message: 'Logged out successfully',
    };
  }

  async issueToken(payload: TokenPayload) {
    const tokenPair = await this.jwtTokenService.generateTokenPair(payload);
    await this.storeRefreshToken(payload.userId, tokenPair.refreshJti);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
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

    const user = await this.userModel.findOne({
      where: { email: normalizedEmail },
    });
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

    const user = await this.userModel.findOne({
      where: { email: normalizedEmail },
    });
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

  private async generateOAuthState(): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex');
    await this.redisService.set('oauth_state:' + state, '1', 300);
    return state;
  }

  // OAuth callbacks can arrive more than once for a single login (e.g.
  // Facebook/browser prefetching the redirect URL). Only the first request
  // may run the code exchange; duplicates wait for its cached result.
  private async consumeOAuthStateOnce(state: string): Promise<boolean> {
    const value = await this.redisService.get('oauth_state:' + state);
    if (!value) return false;
    const isFirst = await this.redisService.setLock(
      'oauth_state_used:' + state,
      '1',
      300,
    );
    if (isFirst) {
      await this.redisService.del('oauth_state:' + state);
    }
    return isFirst;
  }

  private async storeOAuthResult(state: string, result: object): Promise<void> {
    await this.redisService.set(
      'oauth_result:' + state,
      JSON.stringify(result),
      120,
    );
  }

  private async waitForOAuthResult(state: string) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const raw = await this.redisService.get('oauth_result:' + state);
      if (raw) return JSON.parse(raw);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return null;
  }

  async createOAuthSession(payload: {
    accessToken: string;
    user: object;
  }): Promise<string> {
    const nonce = crypto.randomBytes(32).toString('hex');
    await this.redisService.set(
      'oauth_session:' + nonce,
      JSON.stringify(payload),
      120,
    );
    return nonce;
  }

  async consumeOAuthSession(
    nonce: string,
  ): Promise<{ accessToken: string; user: object } | null> {
    const raw = await this.redisService.get('oauth_session:' + nonce);
    if (!raw) return null;
    await this.redisService.del('oauth_session:' + nonce);
    return JSON.parse(raw);
  }

  async buildGithubOAuthUrl(): Promise<string> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new BadRequestException('GitHub OAuth is not configured');
    }

    const state = await this.generateOAuthState();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async githubCallback(code: string, state: string) {
    const isFirstCallback = await this.consumeOAuthStateOnce(state);
    if (!isFirstCallback) {
      const cached = await this.waitForOAuthResult(state);
      if (cached) return cached;
      throw new UnauthorizedException('Invalid OAuth state');
    }
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('GitHub OAuth is not configured');
    }

    const tokenRes = await this.httpService.axiosRef.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
      { headers: { Accept: 'application/json' } },
    );

    const accessToken: string = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new UnauthorizedException('Failed to get GitHub access token');
    }

    const profileRes = await this.httpService.axiosRef.get(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'GraduationProject',
        },
      },
    );

    const profile = profileRes.data;
    const githubId = String(profile.id);
    let email: string | null = profile.email?.trim().toLowerCase() || null;

    // GitHub có thể ẩn email — fetch thêm từ /user/emails
    if (!email) {
      try {
        const emailsRes = await this.httpService.axiosRef.get(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'User-Agent': 'GraduationProject',
            },
          },
        );
        const primary = (
          emailsRes.data as Array<{
            email: string;
            primary: boolean;
            verified: boolean;
          }>
        )?.find((e) => e.primary && e.verified);
        email = primary?.email?.trim().toLowerCase() || null;
      } catch {
        // email stays null
      }
    }

    let user = await this.userModel.findOne({ where: { githubId } });

    if (!user && email) {
      user = await this.userModel.findOne({ where: { email } });
      if (user) {
        await user.update({ githubId });
      }
    }

    if (!user) {
      const nameParts = (profile.name || '').split(' ');
      user = await this.userModel.create({
        email: email ?? `github_${githubId}@noemail.local`,
        password: null,
        firstName: nameParts[0] || null,
        lastName: nameParts.slice(1).join(' ') || null,
        role: DEFAULT_USER_ROLE,
        githubId,
        emailVerified: !!email,
        avatarUrl: profile.avatar_url || null,
      });
    }

    const result = await this.issueAuthTokens(user);
    await this.storeOAuthResult(state, result);
    return result;
  }

  async buildFacebookOAuthUrl(): Promise<string> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI');

    if (!appId || !redirectUri) {
      throw new BadRequestException('Facebook OAuth is not configured');
    }

    const state = await this.generateOAuthState();
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'email,public_profile',
      response_type: 'code',
      state,
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async facebookCallback(code: string, state: string) {
    const isFirstCallback = await this.consumeOAuthStateOnce(state);
    if (!isFirstCallback) {
      const cached = await this.waitForOAuthResult(state);
      if (cached) return cached;
      throw new UnauthorizedException('Invalid OAuth state');
    }
    const appId = this.configService.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
    const redirectUri = this.configService.get<string>('FACEBOOK_REDIRECT_URI');

    if (!appId || !appSecret || !redirectUri) {
      throw new BadRequestException('Facebook OAuth is not configured');
    }

    const tokenRes = await this.httpService.axiosRef.post(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const accessToken: string = tokenRes.data?.access_token;
    if (!accessToken) {
      throw new UnauthorizedException('Failed to get Facebook access token');
    }

    const profileRes = await this.httpService.axiosRef.get(
      'https://graph.facebook.com/v19.0/me',
      {
        params: {
          fields: 'id,email,first_name,last_name,picture.type(large)',
          access_token: accessToken,
        },
      },
    );

    const profile = profileRes.data;
    const facebookId = String(profile.id);
    const email: string | null = profile.email?.trim().toLowerCase() || null;
    const avatarUrl: string | null = profile.picture?.data?.url || null;

    let user = await this.userModel.findOne({ where: { facebookId } });

    if (!user && email) {
      user = await this.userModel.findOne({ where: { email } });
      if (user) {
        await user.update({ facebookId });
      }
    }

    if (!user) {
      user = await this.userModel.create({
        email: email ?? `facebook_${facebookId}@noemail.local`,
        password: null,
        firstName: profile.first_name || null,
        lastName: profile.last_name || null,
        role: DEFAULT_USER_ROLE,
        facebookId,
        emailVerified: !!email,
        avatarUrl,
      });
    }

    const result = await this.issueAuthTokens(user);
    await this.storeOAuthResult(state, result);
    return result;
  }

  private async issueAuthTokens(user: User) {
    const tokenPair = await this.jwtTokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role ?? DEFAULT_USER_ROLE,
    });

    await this.storeRefreshToken(user.id, tokenPair.refreshJti);

    return {
      user: this.toAuthUserResponse(user),
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
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

  private async storeRefreshToken(userId: number, refreshJti: string) {
    const ttl = this.configService.get('redis.ttl');
    await this.redisService.set(
      this.getRefreshTokenKey(userId),
      refreshJti,
      ttl,
    );
  }

  private getRefreshTokenKey(userId: number): string {
    return `refresh_token:${userId}`;
  }
}
