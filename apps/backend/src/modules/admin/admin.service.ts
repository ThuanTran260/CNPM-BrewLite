import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CurrentAdmin {
  id: string;
  email: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateUserRole(targetId: string, newRole: Role, currentAdmin: CurrentAdmin) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new NotFoundException(`Không tìm thấy người dùng có ID: ${targetId}`);
    }

    if (target.role === newRole) {
      return {
        id: target.id,
        email: target.email,
        role: target.role,
        loyaltyPoints: target.loyaltyPoints,
        createdAt: target.createdAt,
      };
    }

    if (targetId === currentAdmin.id && newRole !== Role.ADMIN) {
      throw new BadRequestException('Bạn không thể tự hạ quyền quản trị của chính mình');
    }

    if (target.role === Role.ADMIN && newRole !== Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Không thể hạ quyền quản trị viên cuối cùng của hệ thống',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `[RBAC_AUDIT] Admin ${currentAdmin.email} changed role of user ${target.email} from ${target.role} to ${newRole}`,
    );

    return updated;
  }
}
