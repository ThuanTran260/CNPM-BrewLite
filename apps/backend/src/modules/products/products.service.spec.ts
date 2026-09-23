import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
    create: jest.fn(),
    update: jest.fn(),
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

  describe('createProduct', () => {
    it('nên tạo sản phẩm mới với version mặc định là 0', async () => {
      const dto = {
        name: 'Trà Đào Cam Sả',
        price: 45000,
        stock: 20,
        description: 'Thanh mát mùa hè',
        imageUrl: 'https://example.com/tra-dao.jpg',
      };
      prisma.product.create.mockResolvedValueOnce({ ...mockProduct, ...dto });

      const result = await service.createProduct(dto);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { ...dto, version: 0 },
      });
      expect(result.version).toBe(0);
    });

    it('nên thay description/imageUrl vắng mặt bằng chuỗi rỗng (schema NOT NULL)', async () => {
      const dto = { name: 'Cà phê Đen', price: 25000, stock: 10 };
      prisma.product.create.mockResolvedValueOnce({
        ...mockProduct,
        ...dto,
        description: '',
        imageUrl: '',
      });

      await service.createProduct(dto);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { ...dto, description: '', imageUrl: '', version: 0 },
      });
    });
  });

  describe('updateProduct', () => {
    it('nên cập nhật sản phẩm và tăng version khi thay đổi stock', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);
      const updated = { ...mockProduct, stock: 5, version: 1 };
      prisma.product.update.mockResolvedValueOnce(updated);

      const result = await service.updateProduct('prod-uuid-1', { stock: 5 });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-uuid-1' },
        data: { stock: 5, version: { increment: 1 } },
      });
      expect(result.version).toBe(1);
    });

    it('nên cập nhật sản phẩm và tăng version khi thay đổi price', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);
      const updated = { ...mockProduct, price: 40000, version: 1 };
      prisma.product.update.mockResolvedValueOnce(updated);

      const result = await service.updateProduct('prod-uuid-1', { price: 40000 });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-uuid-1' },
        data: { price: 40000, version: { increment: 1 } },
      });
      expect(result.version).toBe(1);
    });

    it('nên KHÔNG tăng version khi chỉ thay đổi tên', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);
      const updated = { ...mockProduct, name: 'Tên mới' };
      prisma.product.update.mockResolvedValueOnce(updated);

      const result = await service.updateProduct('prod-uuid-1', { name: 'Tên mới' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-uuid-1' },
        data: { name: 'Tên mới' },
      });
      expect(result.version).toBe(0);
    });

    it('nên ném NotFoundException khi sản phẩm không tồn tại', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateProduct('invalid-id', { stock: 5 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('DTO validation', () => {
    it('nên từ chối CreateProductDto khi giá hoặc tồn kho âm', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Sản phẩm lỗi',
        price: -1000,
        stock: -5,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const fields = errors.map((e) => e.property);
      expect(fields).toContain('price');
      expect(fields).toContain('stock');
    });

    it('nên chấp nhận CreateProductDto hợp lệ', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Cà phê Đen',
        price: 25000,
        stock: 10,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('nên từ chối UpdateProductDto khi giá hoặc tồn kho âm', async () => {
      const dto = plainToInstance(UpdateProductDto, {
        price: -100,
        stock: -1,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const fields = errors.map((e) => e.property);
      expect(fields).toContain('price');
      expect(fields).toContain('stock');
    });
  });
});
