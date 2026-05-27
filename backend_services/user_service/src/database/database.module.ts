import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from '../config/database.config';
import { User } from '../users/user.model';
import { AuditLog } from '../audit_logs/audit-log.model';
import { LecturerUpgradeRequest } from '../lecturer_requests/lecturer-request.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          ...dbConfig,
          models: [User, AuditLog],
          models: [User, LecturerUpgradeRequest],
          autoLoadModels: true,
          synchronize: false, // Set to true only for development
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule { }
