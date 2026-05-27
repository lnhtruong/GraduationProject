import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Query,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

const ADMIN_ROLE = 1;

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async list(
    @Headers('x-user-role') roleHeader: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertAdmin(roleHeader);

    return this.auditLogsService.list({
      actorId: actorId ? Number(actorId) : undefined,
      action,
      targetType,
      targetId: targetId ? Number(targetId) : undefined,
      from,
      to,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }

  private assertAdmin(roleHeader?: string): void {
    const role = parseInt(roleHeader ?? '', 10);
    if (Number.isNaN(role)) {
      throw new BadRequestException('User role not found in request headers');
    }
    if (role !== ADMIN_ROLE) {
      throw new ForbiddenException('Admin permission required');
    }
  }
}
