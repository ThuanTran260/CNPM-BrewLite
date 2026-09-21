# BrewLite VER 1.0 — Implementation Plan V4 (Go-Live Ready)

> **Dành cho agentic workers:** REQUIRED SUB-SKILL `superpowers:executing-plans` hoặc `superpowers:subagent-driven-development`. Thực hiện task-by-task theo từng checkbox.

**Mục tiêu (Goal):** Xây dựng trọn vẹn MVP đặt cà phê không dùng tiền mặt đạt trọn vẹn **10/10 điểm** theo `BrewLite-CongNghePhanMem-fixed.md`. Frontend Next.js 14 App Router + Backend NestJS 10 + PostgreSQL 16 (Prisma ORM 5) + Mock Payment nội bộ + Docker Compose bàn giao end-to-end.

**Quyết định đã chốt:**
1. Package manager: **npm workspaces duy nhất** (chỉ commit `package-lock.json`) — đỡ cực khi làm nhóm + thầy chấm.
2. Tồn kho: **trừ tại `POST /orders` (PENDING), hoàn khi `PAYMENT_FAILED`/`CANCELLED`**, Optimistic Locking bằng `Product.version`.
3. Voucher/Loyalty khóa scope: 2 mã seed, loyalty **chỉ cộng, không đổi** ở VER 1.0.
4. Realtime: Polling 3s React Query, không WebSocket/SSE.
5. Chi tiết go-live (job timeout, JWT, P2002, Docker prod, ops): xem `docs/ADR-007-go-live.md`.

**Tech Stack:**
- **Frontend:** Next.js 14+ (App Router, TypeScript), TailwindCSS, Lucide Icons, Zustand (State giỏ hàng, persist), TanStack React Query (Data fetching & Polling 3s).
- **Backend:** NestJS 10+ (TypeScript), Prisma ORM 5, PostgreSQL 16, Passport JWT, bcryptjs, class-validator, `@nestjs/throttler`, Jest / Supertest.
- **DevOps:** Docker Compose (Postgres, Backend, Frontend), Node 20 LTS trong container (`node:20-alpine`), Git, npm 10+.

---

## 1. Design System: Starbucks-Inspired Retail Aesthetic (Chốt từ `design-md/starbucks`)

Ngôn ngữ thiết kế F&B bán lẻ hiện đại, ấm cúng, sang trọng lấy cảm hứng từ **Starbucks Design System**:

### 1.1 Bảng màu (Color Tokens)
- **Canvas / Nền chủ đạo:**
  - Canvas chính: nền kem ấm `#f2f0eb` (thay vì trắng lạnh, gợi giấy ăn / nội thất gỗ quán cà phê).
  - Surface Card / Modal: trắng `#ffffff` nổi trên nền kem, viền mảnh `#edebe9`.
  - House Green: `#1E3932` cho Navbar, Banner Hero, Footer.
- **Brand & CTAs:**
  - Brand Primary: `#006241` cho H1, logo.
  - CTA Accent Green: `#00754A` cho mọi nút chính (Thêm giỏ, Thanh toán, Đặt món), hover `#005a39`, active `scale(0.95)`.
  - Loyalty & Rewards: vàng Gold `#cba258`, nền phụ `#faf6ee` cho badge điểm / voucher.
- **Typography & Text:**
  - Text chính: `rgba(0, 0, 0, 0.87)`, phụ: `rgba(0, 0, 0, 0.58)`, trên nền tối: `#ffffff` / `rgba(255,255,255,0.75)`.
  - Font: `Inter` hoặc `Nunito Sans`, `tracking-tight`; điểm xuyết Serif (`Georgia`/`Lora`) cho banner khuyến mãi.

### 1.2 UI Components & Micro-interactions
- **Buttons:** 100% nút chính `rounded-full`, `py-2.5 px-6`, `font-medium`, `active:scale-95 transition-all duration-150`.
- **Product Card:** `rounded-2xl`, `shadow-sm hover:shadow-md transition-shadow`, ảnh tràn viền, tag giá to rõ.
- **Floating Cart Pill:** nút nổi góc dưới phải (số món + tổng tiền + "Xem giỏ"), tự ẩn khi giỏ rỗng.
- Cấu hình theme Tailwind với đúng 4 tokens trên; không tự ý thêm màu mới ở VER 1.0.

---

## 2. Kiến trúc & Thiết kế kỹ thuật cốt lõi

### 2.1 Cấu trúc Monorepo (npm workspaces)
```
BrewLite/
├── docker-compose.yml
├── package.json                   # npm workspaces: ["apps/*"]
├── package-lock.json              # Khóa phiên bản chuẩn duy nhất
├── .env.example
├── README.md                      # Bàn giao, tài khoản test, hướng dẫn chạy
├── docs/
│   └── ADR-007-go-live.md         # 6 quyết định chặn vận hành
├── apps/
│   ├── backend/                   # NestJS 10 (Port 3001, Global Prefix /api)
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Full schema chuẩn hóa (6 models)
│   │   │   └── seed.ts            # Seed accounts, menu, vouchers
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── state-machine/order-state-machine.ts
│   │   │   │   ├── guards/jwt-auth.guard.ts, roles.guard.ts
│   │   │   │   └── constants/drink-options.ts (Size/Topping constants)
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # JWT, bcryptjs, roles (CUSTOMER, STAFF, ADMIN)
│   │   │   │   ├── products/      # Menu, detail
│   │   │   │   ├── orders/        # Tạo đơn, trừ kho optimistic, cancel + cleanup hoàn kho
│   │   │   │   ├── payments/      # Mock payment idempotent, loyalty accrual
│   │   │   │   └── vouchers/      # Validate mã giảm giá
│   │   └── test/                  # Unit/e2e specs cho Task 10
│   └── frontend/                  # Next.js 14 App Router (Port 3000, standalone)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx       # Menu chính
│       │   │   ├── products/[id]/ # Redirect về modal tại menu (giữ route cho SEO/share)
│       │   │   ├── cart/          # Quản lý giỏ hàng
│       │   │   ├── checkout/      # Thanh toán Ví/Thẻ, cờ giả lập lỗi
│       │   │   ├── orders/[id]/   # Tracking trạng thái đơn (Polling 3s + countdown 15:00)
│       │   │   ├── orders/history/# Lịch sử đơn hàng của tôi
│       │   │   ├── staff/         # KDS Barista Kanban 3 cột (guard STAFF|ADMIN)
│       │   │   ├── login/ & register/
│       │   │   └── layout.tsx
│       │   ├── store/useCartStore.ts # Zustand persist
│       │   └── services/api.ts    # Axios client kèm Bearer Interceptor
```

### 2.2 Prisma Schema chuẩn hóa (Tạo 1 lần duy nhất ở Task 2)
- **`User`**: `id`, `email @unique`, `passwordHash`, `role` (`CUSTOMER` | `STAFF` | `ADMIN`), `loyaltyPoints @default(0)`, `createdAt`
- **`Product`**: `id`, `name`, `price`, `description`, `imageUrl`, `stock`, `version @default(0)` *(Optimistic Locking)*
- **`Order`**: `id`, `code @unique` (`#1042...`), `userId`, `status` (`OrderStatus`), `subtotal`, `discountAmount @default(0)`, `total`, `voucherCode?`, `version @default(0)`, `expiresAt` *(PENDING timeout 15p)*, `createdAt`, `updatedAt`
- **`OrderItem`**: `id`, `orderId`, `productId`, `productName` *(snapshot hiển thị)*, `size` (`S` | `M` | `L`), `toppings` *(Json)*, `qty`, `unitPrice`, `lineTotal`
- **`Payment`**: `id`, `orderId`, `idempotencyKey @unique`, `amount`, `method` (`E_WALLET` | `BANK_CARD`), `status` (`SUCCESS` | `FAILED`), `createdAt`
- **`Voucher`**: `code @unique`, `type` (`PERCENT` | `FIXED`), `value`, `minOrder @default(0)`, `usageLimit?`, `usedCount @default(0)`, `expiresAt?`

### 2.3 Bảng hằng số Size & Topping (ADR)
Định nghĩa thống nhất tại `apps/backend/src/common/constants/drink-options.ts` và mirror phía Frontend:
- **Size:** `S` (+0đ), `M` (+5.000đ), `L` (+10.000đ).
- **Topping:** `Trân châu trắng` (+5.000đ), `Kem Cheese` (+10.000đ), `Thạch cà phê` (+5.000đ).
- *Lý do (ADR):* MVP F&B VER 1.0, size/topping cố định theo quy chuẩn quầy; cố định hằng số giúp tránh join phức tạp, giá vẫn tính an toàn tuyệt đối tại Backend (không tin giá client).

### 2.4 State Machine & `assertTransition`
```
[PENDING] --------(thanh toán OK)-------> [PAID] --------(barista nhận)--------> [PREPARING]
    |                                       |                                       |
    |--(thanh toán lỗi)--> [PAYMENT_FAILED] |--(hủy đơn)                            v
    |                           |           v                                    [READY]
    |--(hủy đơn)                |--(thử lại)   [CANCELLED]                          |
    v                           v                                            (giao khách)
[CANCELLED] <---------------- [PENDING]                                             v
                                                                               [COMPLETED]
```
- Mọi chuyển không nằm trên mũi tên đều bị `assertTransition(from, to)` chặn → `400 Bad Request`.
- **Hoàn kho:** khi chuyển sang `PAYMENT_FAILED` hoặc `CANCELLED`, hoàn `qty` về `Product.stock` trong cùng transaction.
- **Giao dịch liền mạch tại Checkout:** `/cart` chỉ xem trước → sang `/checkout` → bấm **[Xác nhận]** mới gọi tuần tự `(1) POST /orders` lấy `orderId` → `(2) POST /payments`. Xóa giỏ chỉ khi thanh toán thành công. Tránh đơn PENDING rác khi bấm Back.
- **Quy tắc sinh Key:** mỗi lần bấm xác nhận mới sinh `crypto.randomUUID()`; chỉ reuse key khi cùng request lag/double-click trong vài giây (debounce + disable nút).

### 2.5 API Contract chốt (Global Prefix `/api`; mapping spec `/products ≡ /api/products`)
| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/products`, `/api/products/:id` | public | Menu + trạng thái còn/hết hàng |
| POST | `/api/auth/register` | public | bcrypt salt 10, role `CUSTOMER` |
| POST | `/api/auth/login` | public | JWT `{sub, email, role}`, expiry 7d, throttler 5/phút/IP |
| POST | `/api/orders` | `CUSTOMER+` | Tính lại giá từ DB, apply voucher, trừ kho optimistic → `PENDING` + `code` + `expiresAt` |
| POST | `/api/orders/:id/cancel` | owner (`PENDING`\|`PAYMENT_FAILED`) hoặc `STAFF`\|`ADMIN` (`PAID` chưa `PREPARING`) | Hoàn kho transaction |
| POST | `/api/payments` + header `Idempotency-Key: <uuid>` + body `{orderId, method, forceFail?}` | owner | Idempotent (lookup + catch `P2002`), `PAID` (+loyalty, +voucher.usedCount) hoặc `PAYMENT_FAILED` (+hoàn kho) |
| GET | `/api/orders/me`, `/api/orders/:id` | owner (staff xem mọi đơn ở KDS) | Lịch sử + polling tracking |
| PATCH | `/api/orders/:id/status {to}` | `STAFF`\|`ADMIN` | Qua `assertTransition` |
| GET | `/api/health` | public | Healthcheck cho Docker |

---

## 3. Kế hoạch triển khai 3 Sprint chi tiết (10 Tasks)

### Sprint 1: Nền tảng Monorepo, CSDL & Menu (Tasks 1, 2, 3, 4)

- [x] **Task 1: Khởi tạo Monorepo & Docker 3 Services (1 điểm)**
  - Root `package.json` `"workspaces": ["apps/*"]`, chỉ giữ `package-lock.json`.
  - `docker-compose.yml`: `postgres:16-alpine` + healthcheck `pg_isready`; `backend` (`node:20-alpine`, `depends_on: postgres healthy`, entrypoint `npx prisma migrate deploy` luôn + `prisma db seed` chỉ khi `SEED=true`, chạy `node dist/main` multi-stage prod); `frontend` (standalone, port 3000, `depends_on backend`).
  - `.env.example` (không secret thật), `.gitignore`, `README.md` (mapping `/api`, lệnh dev/build, tài khoản test).
  - *DoD:* `docker compose up -d --build` xanh cả 3; `http://localhost:3000` và `http://localhost:3001/api/health` 200 OK.

- [x] **Task 2: API Sản phẩm & Seed Data (1 điểm)**
  - Prisma đủ 6 models + `seed.ts`: 6 món (35k–55k, ảnh Unsplash) + `Cà phê Giới hạn (Limited Cold Brew) stock = 1` (demo Task 10) + vouchers `WELCOME10` (10% min 50k), `FIXED20K` (20k min 100k) + `staff@brewlite.vn/Staff123!` (STAFF) + `customer@brewlite.vn/Customer123!` (CUSTOMER).
  - `ProductsModule`: `GET /api/products`, `GET /api/products/:id`.
  - Unit test `products.service.spec.ts`.
  - *DoD:* `npm run test` pass; API JSON chuẩn; seed đủ trong Postgres.

- [x] **Task 3: Trang Menu theo chuẩn Starbucks (1 điểm)**
  - Tailwind + `lucide-react` + TanStack Query; theme: kem `#f2f0eb`, House `#1E3932`, Accent `#00754A`, Gold `#cba258`.
  - Components: `Navbar` (House Green + badge), `ProductCard` (`rounded-2xl`), `FloatingCartPill` (ẩn khi rỗng), `SkeletonLoader`, `EmptyState`.
  - `src/app/page.tsx` grid responsive (mobile 1 → desktop 3-4 cột).
  - *DoD:* đúng tokens, pill hiện/mượt khi thêm món.

- [x] **Task 4: Modal Tùy chọn Món (1 điểm)**
  - `DrinkCustomizationModal` (Bottom Sheet mobile): ảnh lớn, Size pill S/M/L, topping multi-checkbox, giá realtime `Base + SizeDelta + ToppingsDelta`, nút pill `[Thêm vào giỏ • 45.000đ]` + `active:scale-95`.
  - *DoD:* bấm món mở modal không reload; đổi option giá nhảy ngay; thêm vào Zustand + đóng modal.

---

### Sprint 2: Xác thực → Đặt đơn → Giỏ hàng (Tasks 7 → 6 → 5)

- [x] **Task 7: Đăng ký / Đăng nhập JWT & Roles (1 điểm)**
  - BE `AuthModule`: `POST /api/auth/register|login`, `bcryptjs`, `JwtStrategy`, `JwtAuthGuard`, `RolesGuard` (`@Roles('STAFF','ADMIN')`), throttler login, CORS từ env (`FRONTEND_URL`).
  - FE `login/`, `register/` (card trắng/nền kem), token localStorage + axios Bearer interceptor, middleware guard `/staff`.
  - *DoD:* sai pass → 401; không token vào route bảo vệ → 401; customer vào `/staff` → redirect.

- [x] **Task 6: API Tạo đơn & Trừ kho Optimistic (1 điểm)**
  - `CreateOrderDto` (`class-validator` whitelist): `items[{productId,size,toppings,qty}]`, `voucherCode?`.
  - `POST /api/orders` (JWT): (1) load Product từ DB, (2) `unitPrice = base + sizeDelta + toppingsDelta`, `subtotal = Σ`, (3) validate voucher (expiry/limit/min) → `discountAmount`, (4) transaction: `updateMany({where:{id, version:cur, stock:{gte:qty}}, data:{stock:{decrement:qty}, version:{increment:1}}})` → match 0 → `409 Hết hàng/tranh chấp`; tạo `Order PENDING` (`#code`, `expiresAt=now+15p`) + `OrderItems`.
  - `POST /api/orders/:id/cancel` (quyền như §2.5) + `OrdersCleanupService` cron 5p + lazy check (`PENDING & expiresAt<now → CANCELLED` + hoàn kho).
  - *DoD:* giá fake bị ghi đè; voucher sai → 400; quá kho → 409; quá hạn → CANCELLED + hồi stock (có test).

- [x] **Task 5: Giỏ hàng (1 điểm)**
  - `useCartStore.ts` (Zustand persist): key item `productId_size_toppings`, state `items + voucherCode`, actions `add/remove/setQty/clear/setVoucher`, getters `totalItems/subtotal`.
  - `cart/page.tsx`: card size/topping, qty +/-, xóa, ô voucher preview, tóm tắt (tạm tính/giảm/tổng), nút pill xanh `[Tiến hành thanh toán]` → `/checkout`.
  - *DoD:* F5 không mất; badge + Pill đồng bộ; rỗng có EmptyState thân thiện.

---

### Sprint 3: Thanh toán Mock, Barista & Task 10 (Tasks 8, 9, 10)

- [x] **Task 8: Thanh toán Idempotent (1 điểm)**
  - `POST /api/payments`: B1 lookup key (cùng orderId → 200 cũ; khác orderId → 422) + `try/catch P2002` cho race song song; B2 `assertTransition`; B3 `forceFail` → `PAYMENT_FAILED` + hoàn kho; B4 success → `PAID` + `loyalty += floor(total/10000)` + `voucher.usedCount++` (1 transaction).
  - `checkout/page.tsx`: Ví (MoMo/ZaloPay) / Thẻ, checkbox `Giả lập lỗi (thẻ không đủ số dư)`, nút `[Xác nhận • 123.000đ]` sinh UUID + disable chống spam, flow `orders → payments`, success clear cart.
  - *DoD:* success → trang mã đơn; fail → cảnh báo + `PAYMENT_FAILED` + giữ cart retry key mới.

- [x] **Task 9: Tracking, KDS `/staff` & Bàn giao (1 điểm)**
  - `orders/[id]`: mã `#1042` to + QR **MOCK** (ghi rõ không quét thật) + stepper 4 bước (Đã đặt → Đang pha → Sẵn sàng → Đã nhận) + `refetchInterval: 3000` + countdown 15:00 + nút Hủy.
  - `orders/history`: `GET /api/orders/me`.
  - `staff/page.tsx` Kanban 3 cột `[CẦN PHA (PAID)|ĐANG PHA (PREPARING)|CHỜ LẤY (READY)]`, card (mã + món/size/topping đậm + giờ đặt), nút `[Bắt đầu pha|Pha xong|Đã giao]` + Hủy (PAID).
  - README + `docker compose up -d --build` mượt.
  - *DoD:* 2 tab: staff bấm → khách cập nhật ≤3s không F5.

- [x] **Task 10: Nghiệp vụ chuyên sâu & Kiểm chứng (1 điểm)**
  - `order-state-machine.ts` + `assertTransition` dùng chung payments + PATCH + cancel + cleanup.
  - 4 bộ test (xanh 100%):
    1. `test/state-machine.spec.ts`: chặn `PENDING→READY`, `COMPLETED→PREPARING`; cho `PENDING→PAID`, `PAYMENT_FAILED→PENDING`.
    2. `test/idempotency.e2e-spec.ts`: 2 POST cùng key (kể cả song song) → 1 payment + loyalty 1 lần; khác orderId → 422.
    3. `test/concurrency.e2e-spec.ts`: `stock=1`, 10 req `POST /orders` song song → 1×201 + 9×409, stock cuối = 0 (không âm).
    4. Voucher + cleanup: giảm đúng %, sai/min/expiry/limit → 400; quá hạn → CANCELLED + hồi kho.
  - *DoD:* `npm run test` + `npm run test:e2e` pass.

---

## 4. Kịch bản Nghiệm thu Bàn giao (Verification Script)

```bash
# 1. Khởi động toàn bộ hệ sinh thái
npm i
docker compose up -d --build

# 2. Test nghiệp vụ Task 10 (DB thật trong Docker)
cd apps/backend
npm run test
npm run test:e2e
```

### Demo trực tiếp cho Giảng viên (3 phút):
1. **Đặt món + voucher:** login `customer@brewlite.vn`, Cappuccino M + Trân châu, nhập `WELCOME10` (-10%), sang checkout.
2. **Ngoại lệ:** tick `Giả lập lỗi` → `PAYMENT_FAILED`, chứng minh kho hồi + cart giữ nguyên.
3. **Thành công:** bỏ tick, bấm lại (key mới) → `PAID #1042` + cộng loyalty.
4. **Barista realtime (2 cửa sổ):** khách ở `#1042`, staff `staff@brewlite.vn` tại `/staff` bấm `[Bắt đầu pha]` → khách `ĐANG PHA` ≤3s → `[Pha xong]` → `MỜI NHẬN NƯỚC` → `[Giao khách]` → `COMPLETED`.
5. **Test suite:** chạy `npm run test:e2e` cho thấy Concurrency + Idempotency PASS.
