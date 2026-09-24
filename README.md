# ☕ BrewLite — Cashless Coffee Ordering System (VER 1.0)

> **Môn học:** Công nghệ Phần mềm — Khoa Công nghệ Thông tin, Đại học Sài Gòn (SGU)  
> **Quy trình:** Agile Scrum (3 Sprints — 10 Tasks)  
> **Kiến trúc:** Monorepo (Next.js 14 App Router + NestJS 10 REST API + PostgreSQL 16 + Prisma ORM)  
> 📑 **Tài liệu Báo cáo Đồ án Tổng hợp (12 Mục Chuẩn Chấm Điểm):** [docs/BAO_CAO_DO_AN_BREWLITE.md](docs/BAO_CAO_DO_AN_BREWLITE.md)  
> 📐 **Tài liệu Kiến trúc & Biểu đồ Hệ thống (BFD, DFD, UseCase, ERD, Sequence):** [docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md](docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md)

---

## 1. Tổng quan hệ thống

BrewLite là nền tảng đặt đồ uống và thanh toán không tiền mặt theo phong cách chuỗi bán lẻ cao cấp (lấy cảm hứng từ Starbucks Design System). Hệ thống cho phép khách hàng đặt món, tùy biến size/topping, áp dụng voucher, thanh toán không tiền mặt (Mock Payment Idempotent), theo dõi tiến trình pha chế qua Stepper thời gian thực (Polling 3s), màn hình quầy Barista KDS 3 cột Kanban, cùng Cổng Quản trị viên (Admin Portal) quản lý nhân sự, kho hàng và đổi điểm thưởng Starbucks Rewards.

### Thông số cổng mạng (Port Mapping):
* **Frontend (Next.js 14):** `http://localhost:3000`
* **Backend (NestJS 10):** `http://localhost:3001` (Toàn bộ API đặt dưới tiền tố `/api`, ví dụ: `http://localhost:3001/api/health`)
* **Database (PostgreSQL 16):** `localhost:5432` (`brewlite` / `brewlite_secret` / `brewlite_db`)

---

## 2. Tài khoản kiểm thử có sẵn (Seed Accounts)

| Vai trò (Role) | Email | Mật khẩu | Mục đích sử dụng |
|---|---|---|---|
| **ADMIN (Quản trị)** | `admin@brewlite.vn` | `Admin123!` | Đăng nhập cổng Quản trị `/admin`: Quản lý danh sách Barista, điều chỉnh kho tức thì, đổi điểm Starbucks Rewards sang voucher. |
| **STAFF (Nhân viên)** | `staff@brewlite.vn` | `Staff123!` | Đăng nhập màn hình Barista KDS `/staff`: Nhận đơn, bắt đầu pha, pha xong và giao đồ uống. |
| **CUSTOMER (Khách)** | `customer@brewlite.vn` | `Customer123!` | Đăng nhập đặt hàng, áp dụng voucher, theo dõi đơn hàng, hồ sơ tích điểm Loyalty (mặc định sẵn 50 sao). |

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
5. **Demo Starbucks Rewards & Cổng Admin:**
   * Khách vào trang `/profile`: Xem số dư Sao thưởng, chọn đổi 50 Sao lấy Voucher giảm 20.000đ `RW-...` ngay lập tức.
   * Admin đăng nhập `admin@brewlite.vn` vào `/admin`: Quản lý danh sách Barista (thêm mới tài khoản Barista), điều chỉnh tồn kho tức thì không cần reload DB, xem báo cáo tổng hợp.
6. **Kiểm chứng Task 10 (102/102 Tests PASS):** Chạy lệnh `npm run test` & `npm run test:e2e` trên backend để giảng viên xem toàn bộ test nghiệp vụ Concurrency, Idempotency và Voucher Cleanup đều 100% Green.

---

## 7. Tài liệu Kiến trúc & Đặc tả Thiết kế Hệ thống

Toàn bộ tài liệu phân tích và thiết kế hệ thống chuẩn học thuật (Academic-Grade Architecture Spec) được biên soạn tại [docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md](docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md) và hướng dẫn sử dụng Draw.io tại [docs/DRAWIO_GUIDE.md](docs/DRAWIO_GUIDE.md), bao gồm:
1. **BFD (Business Function Decomposition):** Sơ đồ phân rã chức năng 3 cấp (F0.0 $\rightarrow$ F1..F6 $\rightarrow$ Fx.y) và Từ điển 22 chức năng nghiệp vụ.
2. **DFD Lv0 (Context Diagram):** Sơ đồ luồng dữ liệu mức ngữ cảnh với 5 tác nhân ngoài và 10 luồng dữ liệu vào/ra.
3. **DFD Lv1 (Detailed Data Flow):** Sơ đồ luồng dữ liệu mức 1 phân tầng (Anti-Spaghetti), gồm 6 tiến trình và 6 kho dữ liệu vật lý (`users`, `products`, `orders`, `order_items`, `payments`, `vouchers`).
4. **Use Case Diagrams (Phân rã 2 cấp):** Sơ đồ tổng quan cấp cao (4 Actors - 5 Packages) cùng 3 sơ đồ phân rã chi tiết cho Khách hàng, Barista KDS, Quản trị viên & Cron; kèm bảng đặc tả kịch bản chuẩn RUP cho UC-01, UC-02, UC-03.
5. **ERD & Data Dictionary:** Sơ đồ quan hệ thực thể chuẩn hóa khớp 100% `schema.prisma` kèm từ điển dữ liệu chi tiết từng cột và kiểu Enum.
6. **Sequence Diagrams:** Sơ đồ tuần tự cho 2 luồng cốt lõi: Đặt hàng trừ kho Optimistic Locking (`POST /api/orders`) và Thanh toán Idempotent Replay, Race Defense `P2002` (`POST /api/payments`).
7. **Order State Machine:** Sơ đồ máy trạng thái và ma trận chuyển đổi 2 chiều khớp 100% với `StateMachineService` trong NestJS backend.
8. **Kho biểu đồ Vector & Draw.io:** Toàn bộ 11 biểu đồ được xuất sẵn mã nguồn độc lập tại [docs/diagrams/](docs/diagrams/) và bộ ảnh vector SVG siêu nét tại [docs/diagrams/svg/](docs/diagrams/svg/) hỗ trợ phóng to 1.000% không vỡ hạt.

