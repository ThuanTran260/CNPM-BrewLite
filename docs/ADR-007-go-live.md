# ADR-007: Chốt 6 điểm chặn vận hành (kẹp vào Plan V4)

**Ngày:** 2026-09-21
**Trạng thái:** Accepted
**Liên quan:** `implementation_plan_v4.md`, `BrewLite-CongNghePhanMem-fixed.md` (Mục 10 DoD, Mục 11 bàn giao)

Plan V3 đã đủ demo 10 điểm nhưng còn 6 lỗ hổng vận hành. ADR này chốt quyết định để worker implement không phải đoán.

---

## 1. PENDING timeout 15 phút — ai dọn kho bị giam?

**Context:** Trừ kho tại `POST /orders` (PENDING) gây giam kho nếu khách tạo đơn rồi đóng tab, hết tiền, hoặc back về cart.

**Decision:**
- Thêm `Order.expiresAt = now() + 15 phút` khi tạo đơn `PENDING`.
- `OrdersCleanupService` chạy cron mỗi 5 phút **và** lazy-check trong `GET /orders/:id`: `WHERE status='PENDING' AND expiresAt < now()` → chuyển `CANCELLED` + hoàn `stock` trong 1 transaction (qua `assertTransition`).
- FE `orders/[id]` hiển thị countdown `14:59 → 00:00`, hết giờ tự gọi `POST /orders/:id/cancel`.
- Thêm nút Hủy tại `orders/[id]` + `orders/history` gọi endpoint cancel.

**Consequences:** Cần thêm test cleanup (tua `expiresAt` về quá khứ → CANCELLED + hồi stock). Cron dùng `@nestjs/schedule`.

## 2. Auth chốt 1 cơ chế + phân quyền Cancel

**Decision:**
- JWT Bearer + `localStorage` + axios interceptor (demo VER 1.0). Access token expiry **7 ngày**, không refresh token ở VER 1.0 (ghi rõ trong README để không bị hỏi).
- `POST /orders/:id/cancel`: owner được hủy khi `PENDING`/`PAYMENT_FAILED`; `STAFF`/`ADMIN` được hủy khi `PAID` chưa sang `PREPARING`. Mọi đường đi qua `assertTransition`, sai → 400, sai quyền → 403.
- Guard 2 lớp cho `/staff`: BE `Roles('STAFF','ADMIN')`, FE middleware check `role` → redirect `/login`.

## 3. Idempotency chống race thật (P2002)

**Context:** Lookup-then-insert vẫn lọt 2 payment khi 2 request song song cùng key.

**Decision:**
- `Payment.idempotencyKey @unique` ở DB.
- Flow `POST /api/payments`: (1) lookup → cùng `orderId` return 200 cũ, khác `orderId` → 422; (2) `try { create } catch (P2002) { query lại record cũ → return 200 }`.
- Key sinh mới (`crypto.randomUUID()`) mỗi lần bấm xác nhận; chỉ reuse khi retry cùng click (debounce + disable nút 3s).

**Test bắt buộc:** 2 POST cùng key song song → 1 payment + loyalty cộng 1 lần.

## 4. Bảo mật tối thiểu để vận hành

- `bcryptjs` salt 10; `class-validator` whitelist + forbidNonWhitelisted mọi DTO.
- Throttler login: 5 req/phút/IP (`@nestjs/throttler`).
- CORS: dev `http://localhost:3000`, prod đọc `FRONTEND_URL` từ env.
- Secret (`JWT_SECRET`, DB pass) chỉ qua env; `.env.example` không chứa giá trị thật.

## 5. Docker prod vs dev

- Dockerfile multi-stage (`deps → build → runner`), chạy `node dist/main` (`start:prod`), không dùng `start:dev` trong container.
- Entrypoint tách: `prisma migrate deploy` luôn chạy; `prisma db seed` chỉ khi `SEED=true` (tránh seed đè dữ liệu prod).
- Image `node:20-alpine` cho cả BE/FE (dù máy dev Node 24). FE dùng `output: standalone`. BE `depends_on postgres: healthy`, FE `depends_on backend`.

## 6. Ops + giới hạn demo (tránh bị giảng viên test lố)

- Postgres volume `pgdata` persist + lệnh backup ghi trong README.
- `GET /api/health` cho BE (Docker healthcheck + thầy curl kiểm tra).
- QR tại `orders/[id]` là **MOCK** — ghi chữ "Mã nhận món tại quầy (bản demo)" để không ai quét thật.
- Bắt buộc trang 404, `EmptyState` giỏ rỗng, toast lỗi mapping đúng mã BE (400/401/403/404/409/422).
- Log BE dạng JSON (pino hoặc Nest logger); không log `passwordHash`/token.
