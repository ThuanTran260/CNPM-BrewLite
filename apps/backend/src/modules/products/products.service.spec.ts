import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct = {
  id: 'prod-uuid-1',
  name: 'Cà phê Sữa Đá',
  price: 35000,
  description: 'Thơm ngon đậm đà',
  imageUrl: 'https://example.com/coffee.jpg',
  stock: 10,
  version: 0,
  createdAt: new Date(),
};

const mockPrismaService = {
  product: {
    findMany: jest.fn().mockResolvedValue([mockProduct]),
    findUnique: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('nên trả về danh sách sản phẩm kèm trạng thái inStock và tùy chọn size/topping', async () => {
      const result = await service.findAll();

      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].inStock).toBe(true);
      expect(result.options.sizes.length).toBeGreaterThan(0);
      expect(result.options.toppings.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('nên trả về chi tiết sản phẩm nếu tìm thấy', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);

      const result = await service.findOne('prod-uuid-1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-uuid-1' },
      });
      expect(result.id).toBe('prod-uuid-1');
      expect(result.inStock).toBe(true);
    });

    it('nên ném NotFoundException nếu không tìm thấy sản phẩm', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
