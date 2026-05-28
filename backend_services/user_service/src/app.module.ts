import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuditLogsModule } from './audit_logs/audit-logs.module';
import { LecturerRequestsModule } from './lecturer_requests/lecturer-requests.module';
import { DatabaseModule } from './database/database.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
    // JwtModule.register({
    //   global: true,
    // }),
    DatabaseModule,
    AuditLogsModule,
    LecturerRequestsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
