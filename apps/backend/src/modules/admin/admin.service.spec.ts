import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  const adminUser = { id: 'admin-id-1', email: 'admin@brewlite.vn' };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('findAllUsers', () => {
    it('nên trả về danh sách user và không lộ passwordHash', async () => {
      prisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'u1',
          email: 'customer@brewlite.vn',
          role: Role.CUSTOMER,
          loyaltyPoints: 50,
          createdAt: new Date(),
        },
      ]);

      const result = await service.findAllUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          role: true,
          loyaltyPoints: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(result[0].email).toBe('customer@brewlite.vn');
    });
  });

  describe('updateUserRole', () => {
    it('nên chặn tự hạ quyền của chính mình (400)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: adminUser.id,
        email: adminUser.email,
        role: Role.ADMIN,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });

      await expect(
        service.updateUserRole(adminUser.id, Role.STAFF, adminUser),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('nên chặn hạ quyền admin cuối cùng (400)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'other-admin-id',
        email: 'admin2@brewlite.vn',
        role: Role.ADMIN,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });
      prisma.user.count.mockResolvedValueOnce(1);

      await expect(
        service.updateUserRole('other-admin-id', Role.STAFF, adminUser),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('nên đổi quyền thành công và ghi audit log', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'staff-id-1',
        email: 'staff@brewlite.vn',
        role: Role.STAFF,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });
      prisma.user.update.mockResolvedValueOnce({
        id: 'staff-id-1',
        email: 'staff@brewlite.vn',
        role: Role.ADMIN,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });
      const logSpy = jest.spyOn((service as any).logger, 'log');

      const result = await service.updateUserRole('staff-id-1', Role.ADMIN, adminUser);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'staff-id-1' },
        data: { role: Role.ADMIN },
        select: {
          id: true,
          email: true,
          role: true,
          loyaltyPoints: true,
          createdAt: true,
        },
      });
      expect(result.role).toBe(Role.ADMIN);
      expect(logSpy).toHaveBeenCalledWith(
        '[RBAC_AUDIT] Admin admin@brewlite.vn changed role of user staff@brewlite.vn from STAFF to ADMIN',
      );
      logSpy.mockRestore();
    });

    it('nên ném NotFoundException khi không tìm thấy user (404)', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateUserRole('unknown-id', Role.STAFF, adminUser),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
