import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('fake_jwt_token_123'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('nên tạo tài khoản mới và trả về token', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'test@brewlite.vn',
        role: Role.CUSTOMER,
        loyaltyPoints: 0,
      });

      const result = await service.register({
        email: 'test@brewlite.vn',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('fake_jwt_token_123');
      expect(result.user.email).toBe('test@brewlite.vn');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('nên ném ConflictException nếu email đã tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(
        service.register({
          email: 'test@brewlite.vn',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('nên đăng nhập thành công nếu mật khẩu khớp', async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password123!', salt);

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'test@brewlite.vn',
        passwordHash,
        role: Role.CUSTOMER,
        loyaltyPoints: 10,
      });

      const result = await service.login({
        email: 'test@brewlite.vn',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('fake_jwt_token_123');
      expect(result.user.email).toBe('test@brewlite.vn');
    });

    it('nên ném UnauthorizedException nếu không tìm thấy user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({
          email: 'notfound@brewlite.vn',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('nên ném UnauthorizedException nếu mật khẩu sai', async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('CorrectPassword!', salt);

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'test@brewlite.vn',
        passwordHash,
        role: Role.CUSTOMER,
      });

      await expect(
        service.login({
          email: 'test@brewlite.vn',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
