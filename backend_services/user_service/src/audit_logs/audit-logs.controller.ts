import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Query,
} from '@nestjs/common';
import { UserRole } from '../users/users.service';
import { AuditLogsService } from './audit-logs.service';

@Controller('users/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async list(
    @Headers('x-user-role') roleHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.assertAdmin(roleHeader);

    return this.auditLogsService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      actorUserId: actorUserId ? Number(actorUserId) : undefined,
      action,
      targetType,
      targetId: targetId ? Number(targetId) : undefined,
      from,
      to,
    });
  }

  private assertAdmin(roleHeader?: string): void {
    const role = parseInt(roleHeader ?? '', 10);
    if (Number.isNaN(role)) {
      throw new BadRequestException('User role not found in request headers');
    }
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin permission required');
    }
  }
}
