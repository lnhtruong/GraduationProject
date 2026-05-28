import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

export interface TokenPayload {
  userId: number;
  email: string;
  role: number;
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.accessTokenExpiresIn'),
    });
  }

  async generateRefreshToken(
    payload: TokenPayload,
    jti: string,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.refreshTokenExpiresIn'),
      jwtid: jti,
    });
  }

  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const refreshJti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload, refreshJti),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshJti,
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('jwt.secret'),
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('jwt.secret'),
    });
  }

  async decodeToken(token: string): Promise<TokenPayload | null> {
    try {
      return await this.verifyToken(token);
    } catch {
      return null;
    }
  }
}
