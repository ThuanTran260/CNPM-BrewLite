# ☕ BrewLite — Cashless Coffee Ordering System (VER 1.0)

> **Môn học:** Công nghệ Phần mềm — Khoa Công nghệ Thông tin, Đại học Sài Gòn (SGU)  
> **Quy trình:** Agile Scrum (3 Sprints — 10 Tasks)  
> **Kiến trúc:** Monorepo (Next.js 14 App Router + NestJS 10 REST API + PostgreSQL 16 + Prisma ORM)

---

## 1. Tổng quan hệ thống

BrewLite là nền tảng đặt đồ uống và thanh toán không tiền mặt theo phong cách chuỗi bán lẻ cao cấp (lấy cảm hứng từ Starbucks Design System). Hệ thống cho phép khách hàng đặt món, tùy biến size/topping, áp dụng voucher, thanh toán không tiền mặt (Mock Payment Idempotent), theo dõi tiến trình pha chế qua Stepper thời gian thực (Polling 3s) và màn hình quầy Barista KDS 3 cột Kanban.

### Thông số cổng mạng (Port Mapping):
* **Frontend (Next.js 14):** `http://localhost:3000`
* **Backend (NestJS 10):** `http://localhost:3001` (Toàn bộ API đặt dưới tiền tố `/api`, ví dụ: `http://localhost:3001/api/health`)
* **Database (PostgreSQL 16):** `localhost:5432` (`brewlite` / `brewlite_secret` / `brewlite_db`)

---

## 2. Tài khoản kiểm thử có sẵn (Seed Accounts)

| Vai trò (Role) | Email | Mật khẩu | Mục đích sử dụng |
|---|---|---|---|
| **STAFF (Nhân viên)** | `staff@brewlite.vn` | `Staff123!` | Đăng nhập vào màn hình Barista KDS `/staff` để nhận đơn, pha chế và giao món. |
| **CUSTOMER (Khách)** | `customer@brewlite.vn` | `Customer123!` | Đăng nhập đặt hàng, áp dụng voucher, tích điểm Loyalty. |

### Mã giảm giá có sẵn (Vouchers):
* `WELCOME10`: Giảm 10% cho đơn hàng từ 50.000đ trở lên.
* `FIXED20K`: Giảm trực tiếp 20.000đ cho đơn hàng từ 100.000đ trở lên.

---

## 3. Hướng dẫn khởi chạy nhanh bằng Docker Compose

Yêu cầu máy tính đã cài đặt **Docker Desktop**.

```bash
# 1. Khởi động toàn bộ 3 dịch vụ (Postgres, Backend, Frontend)
docker compose up -d --build

# 2. Kiểm tra trạng thái các container
docker compose ps

# 3. Xem log vận hành của backend
docker compose logs -f backend
```

Truy cập:
* Giao diện Khách hàng: [http://localhost:3000](http://localhost:3000)
* Màn hình Barista KDS: [http://localhost:3000/staff](http://localhost:3000/staff)
* Kiểm tra Healthcheck Backend: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 4. Hướng dẫn khởi chạy thủ công trên môi trường Local (Dev)

Yêu cầu **Node.js >= 20** và **npm >= 10**.

```bash
# 1. Cài đặt toàn bộ dependencies cho Monorepo
npm install

# 2. Khởi động PostgreSQL (nếu dùng Docker riêng cho DB)
docker compose up -d postgres

# 3. Đồng bộ CSDL và Seed dữ liệu mẫu
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# 4. Chạy đồng thời Backend & Frontend
# Terminal 1: Backend (Port 3001)
npm run dev:backend

# Terminal 2: Frontend (Port 3000)
npm run dev:frontend
```

---

## 5. Chạy kiểm thử tự động (Unit & E2E Tests - Task 10)

Hệ thống cung cấp đầy đủ 4 bộ kiểm thử chuyên sâu nhằm chứng minh tính đúng đắn của nghiệp vụ:
1. `state-machine.spec.ts`: Chặn mọi chuyển trạng thái bất hợp pháp.
2. `idempotency.e2e-spec.ts`: Chống thanh toán/trừ tiền trùng lặp khi gửi đồng thời cùng key.
3. `concurrency.e2e-spec.ts`: Xử lý tranh chấp tồn kho (Optimistic Locking) khi 10 khách đặt cùng lúc 1 sản phẩm chỉ còn tồn 1.
4. Voucher & Cleanup: Kiểm tra tính toán giảm giá và cơ chế tự động thu hồi kho khi hết hạn 15 phút.

```bash
# Di chuyển vào thư mục backend và chạy test
cd apps/backend
npm run test
npm run test:e2e
```

---

## 6. Kịch bản Demo nghiệm thu cho Giảng viên (3 phút)

1. **Khách hàng đặt món:** Vào `localhost:3000`, đăng nhập `customer@brewlite.vn`, chọn Cappuccino M + Trân châu, nhập voucher `WELCOME10`, bấm "Tiến hành thanh toán".
2. **Demo Ngoại lệ (Thanh toán lỗi):** Tick chọn "Giả lập lỗi thanh toán" $\rightarrow$ Đơn chuyển sang `PAYMENT_FAILED`, chứng minh giỏ hàng được giữ nguyên và kho được hoàn lại lập tức.
3. **Thanh toán thành công:** Bỏ tick lỗi, bấm xác nhận $\rightarrow$ Đơn chuyển sang `PAID` kèm mã đơn `#1042`, tài khoản được tích điểm Loyalty.
4. **Demo Barista KDS (Mở 2 tab song song):**
   * Tab 1: Khách đang ở màn hình tracking `#1042`.
   * Tab 2: Nhân viên đăng nhập `staff@brewlite.vn` vào `/staff`, thấy đơn `#1042` ở cột `[CẦN PHA]`.
   * Nhân viên bấm **[Bắt đầu pha]** $\rightarrow$ Tab Khách tự động đổi sang `ĐANG PHA CHẾ` sau 3 giây (Polling).
   * Nhân viên bấm **[Pha xong]** $\rightarrow$ Tab Khách đổi sang `MỜI TỚI QUẦY LẤY NƯỚC`.
   * Nhân viên bấm **[Đã giao]** $\rightarrow$ Đơn hoàn tất `COMPLETED`.
5. **Kiểm chứng Task 10:** Chạy lệnh `npm run test:e2e` trên terminal để giảng viên xem toàn bộ test nghiệp vụ Concurrency và Idempotency đều PASS.
