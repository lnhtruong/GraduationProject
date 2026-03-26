import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { JwtTokenService, TokenPayload } from './jwt/jwt.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CheckOtpDto } from './dto/check-otp.dto';

@Injectable()
export class AuthService {
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

        console.log('check: ', email, password, firstName, lastName)

        const existingUser = await this.userModel.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.userModel.create({
            email,
            password: hashedPassword,
            firstName: firstName || null,
            lastName: lastName || null,
            role: 1,
        });

        // const tokenPair = await this.jwtTokenService.generateTokenPair({
        //     userId: user.id,
        //     email: user.email,
        //     role: user.role,
        // });

        // await this.storeRefreshToken(user.id, tokenPair.refreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            // ...tokenPair,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        // console.log('check: ', email, password);

        const user = await this.userModel.findOne({
            where: { email },
            raw: true,
        });

        // console.log('check user: ', user);

        if (!user) {
            throw new UnauthorizedException('Invalid account or password!');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid account or password!');
        }

        const tokenPair = await this.jwtTokenService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        await this.storeRefreshToken(user.id, tokenPair.refreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            ...tokenPair,
        };
    }

    async refreshToken(refreshToken: string) {
        // const { refreshToken } = refreshTokenDto;

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
        await this.storeRefreshToken(payload.userId, (await tokenPair).refreshToken);

        return {
            accessToken: (await tokenPair).accessToken,
            refreshToken: (await tokenPair).refreshToken,
        };
    }

    async validateCredential(validateTokenDto: ValidateTokenDto) {
        const { token } = validateTokenDto;

        try {
            const payload = await this.jwtTokenService.verifyToken(token);

            // Optionally check if user still exists
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

        const user = await this.userModel.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('User with this email does not exist');
        }

        const mailServiceUrl =
            this.configService.get<string>('MAIL_SERVICE_URL') ||
            process.env.MAIL_SERVICE_URL ||
            'http://localhost:3000';

        try {
            const response = await this.httpService.axiosRef.post(
                `${mailServiceUrl}/mail/otp`,
                { email },
            );

            const otp = response.data?.data?.otp;

            return {
                message: 'OTP sent to email',
                // otp,
            };
        } catch (error) {
            throw new BadRequestException('Failed to send OTP email');
        }
    }

    async checkOtpAndResetPassword(checkOtpDto: CheckOtpDto) {
        const { email, otp, newPassword } = checkOtpDto;

        const emailKey = email.trim().toLowerCase();
        const redisKey = `MAIL_OTP:${emailKey}`;

        const storedOtp = await this.redisService.get(redisKey);

        if (!storedOtp || storedOtp !== otp) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        const user = await this.userModel.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('User with this email does not exist');
        }

        console.log('check user', user);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // user.password = hashedPassword;
        await user.update({
            password: hashedPassword,
        });

        // Xóa OTP sau khi dùng xong
        await this.redisService.del(redisKey);

        return {
            message: 'Password has been reset successfully',
        };
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
