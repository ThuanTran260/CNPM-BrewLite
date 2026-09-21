import { PrismaClient, Role, VoucherType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu mẫu cho BrewLite...');

  // 1. Seed tài khoản người dùng
  const salt = await bcrypt.genSalt(10);
  const staffPasswordHash = await bcrypt.hash('Staff123!', salt);
  const customerPasswordHash = await bcrypt.hash('Customer123!', salt);

  const staff = await prisma.user.upsert({
    where: { email: 'staff@brewlite.vn' },
    update: {},
    create: {
      email: 'staff@brewlite.vn',
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      loyaltyPoints: 0,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@brewlite.vn' },
    update: {},
    create: {
      email: 'customer@brewlite.vn',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      loyaltyPoints: 5,
    },
  });

  console.log(`✅ Đã tạo tài khoản: Staff (${staff.email}), Customer (${customer.email})`);

  // 2. Seed sản phẩm đồ uống (Menu phong cách Starbucks)
  const products = [
    {
      name: 'Cà phê Sữa Đá Sài Gòn',
      price: 35000,
      description: 'Hạt Robusta Đắk Lắk đậm đà hòa quyện cùng sữa đặc ngọt béo truyền thống.',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      stock: 100,
      version: 0,
    },
    {
      name: 'Americano Cổ Điển',
      price: 40000,
      description: 'Espresso nguyên chất pha loãng với nước nóng giữ trọn tầng crema và hương thơm mộc.',
      imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&auto=format&fit=crop&q=80',
      stock: 100,
      version: 0,
    },
    {
      name: 'Cappuccino Bọt Sữa Mịn',
      price: 45000,
      description: 'Sự cân bằng hoàn hảo giữa espresso, sữa nóng và lớp bọt sữa dày mịn như nhung.',
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&auto=format&fit=crop&q=80',
      stock: 100,
      version: 0,
    },
    {
      name: 'Trà Đào Cam Sả Tươi',
      price: 42000,
      description: 'Trà đen thơm ngát kết hợp cùng đào giòn tươi, hương cam vàng và sả thanh mát giải nhiệt.',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
      stock: 100,
      version: 0,
    },
    {
      name: 'Bạc Xỉu Sữa Tươi Kem Béo',
      price: 39000,
      description: 'Thức uống quốc dân với nhiều sữa ít cà phê, béo ngậy ngọt ngào khó cưỡng.',
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
      stock: 100,
      version: 0,
    },
    {
      name: 'Trà Sữa Oolong Nướng',
      price: 48000,
      description: 'Lá trà Oolong sấy nhiệt đậm đà kết hợp cốt sữa thơm lừng quyến rũ.',
      imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&auto=format&fit=crop&q=80',
      stock: 100,
      version: 0,
    },
    // Món đặc biệt phục vụ kiểm thử Concurrency cho Task 10: Tồn kho chỉ còn đúng 1
    {
      name: 'Cà phê Giới hạn (Limited Cold Brew)',
      price: 55000,
      description: 'Món đặc biệt ủ lạnh 24 giờ. Phiên bản giới hạn duy nhất 1 suất (Dùng để kiểm thử Task 10 Concurrency).',
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
      stock: 1, // CHỈ CÒN ĐÚNG 1 ĐỂ TEST CONCURRENCY
      version: 0,
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    } else {
      await prisma.product.update({ where: { id: existing.id }, data: p });
    }
  }

  console.log(`✅ Đã seed ${products.length} sản phẩm đồ uống (bao gồm món test stock=1)`);

  // 3. Seed mã khuyến mãi Vouchers
  const vouchers = [
    {
      code: 'WELCOME10',
      type: VoucherType.PERCENT,
      value: 10,
      minOrder: 50000,
      usageLimit: 100,
      usedCount: 0,
    },
    {
      code: 'FIXED20K',
      type: VoucherType.FIXED,
      value: 20000,
      minOrder: 100000,
      usageLimit: 50,
      usedCount: 0,
    },
  ];

  for (const v of vouchers) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: {},
      create: v,
    });
  }

  console.log(`✅ Đã seed ${vouchers.length} mã khuyến mãi (WELCOME10, FIXED20K)`);
  console.log('🎉 Hoàn tất seed dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
