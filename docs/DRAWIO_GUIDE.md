# HƯỚNG DẪN SỬ DỤNG VÀ NHẬP MÃ BIỂU ĐỒ MERMAID VÀO DRAW.IO
## (Comprehensive Draw.io Integration & Diagram Customization Guide)

Tài liệu này cung cấp hướng dẫn chi tiết cách sử dụng các tệp mã nguồn Mermaid (`.mmd`) và tệp ảnh vector (`.svg`) trong thư mục `docs/diagrams/` để xem phóng to không giới hạn hoặc nhập trực tiếp vào **Draw.io (diagrams.net)** nhằm chỉnh sửa, biên tập và xuất báo cáo học thuật chất lượng cao.

---

## 1. DANH MỤC CÁC BIỂU ĐỒ HỆ THỐNG BREWLITE

Tất cả các biểu đồ đều đã được chuẩn hóa **chữ đen tuyền (`#000000`)**, nền pastel tương phản cao, viền đậm 2px, tối ưu hoàn hảo cho cả Light Mode, Dark Mode và in ấn trắng đen:

| STT | Tên biểu đồ | Mô tả phân hệ | Mã nguồn Mermaid (.mmd) | Ảnh Vector SVG siêu nét |
|:---:|---|---|:---:|:---:|
| **1** | **BFD** | Sơ đồ phân rã chức năng kinh doanh (Business Functions) | [bfd.mmd](./diagrams/bfd.mmd) | [bfd.svg](./diagrams/svg/bfd.svg) |
| **2** | **DFD Lv0** | Sơ đồ luồng dữ liệu mức ngữ cảnh hệ thống BrewLite | [dfd-lv0.mmd](./diagrams/dfd-lv0.mmd) | [dfd-lv0.svg](./diagrams/svg/dfd-lv0.svg) |
| **3** | **DFD Lv1** | Sơ đồ luồng dữ liệu mức 1 phân tầng (Anti-Spaghetti) | [dfd-lv1.mmd](./diagrams/dfd-lv1.mmd) | [dfd-lv1.svg](./diagrams/svg/dfd-lv1.svg) |
| **4** | **Use Case Tổng quan** | Sơ đồ Use Case cấp cao (4 Actors kết nối 5 Packages) | [usecase-overview.mmd](./diagrams/usecase-overview.mmd) | [usecase-overview.svg](./diagrams/svg/usecase-overview.svg) |
| **5** | **Use Case Khách hàng** | Phân rã chi tiết luồng nghiệp vụ Khách hàng (Customer) | [usecase-customer.mmd](./diagrams/usecase-customer.mmd) | [usecase-customer.svg](./diagrams/svg/usecase-customer.svg) |
| **6** | **Use Case Barista** | Phân rã chi tiết luồng vận hành Quầy & KDS (Staff) | [usecase-staff.mmd](./diagrams/usecase-staff.mmd) | [usecase-staff.svg](./diagrams/svg/usecase-staff.svg) |
| **7** | **Use Case Admin & Cron** | Phân rã chi tiết Quản trị viên & Tự động hóa dọn dẹp | [usecase-admin-cron.mmd](./diagrams/usecase-admin-cron.mmd) | [usecase-admin-cron.svg](./diagrams/svg/usecase-admin-cron.svg) |
| **8** | **ERD** | Sơ đồ quan hệ thực thể chuẩn 100% Prisma Schema | [erd.mmd](./diagrams/erd.mmd) | [erd.svg](./diagrams/svg/erd.svg) |
| **9** | **Sequence 1** | Luồng Đặt hàng trừ kho Optimistic Locking | [sequence-order-creation.mmd](./diagrams/sequence-order-creation.mmd) | [sequence-order-creation.svg](./diagrams/svg/sequence-order-creation.svg) |
| **10** | **Sequence 2** | Luồng Thanh toán Idempotent Replay & Bắt lỗi P2002 | [sequence-idempotent-payment.mmd](./diagrams/sequence-idempotent-payment.mmd) | [sequence-idempotent-payment.svg](./diagrams/svg/sequence-idempotent-payment.svg) |
| **11** | **State Machine** | Máy trạng thái vòng đời đơn hàng (ADR-007) | [order-state-machine.mmd](./diagrams/order-state-machine.mmd) | [order-state-machine.svg](./diagrams/svg/order-state-machine.svg) |

---

## 2. CÁCH XEM PHÓNG TO THU NHỎ 1.000% KHÔNG VỠ HẠT (VECTOR SVG)

Nếu màn hình hoặc trình xem Markdown mặc định quá nhỏ:
1. Truy cập thư mục [docs/diagrams/svg/](./diagrams/svg/).
2. Nhấp đúp chuột vào bất kỳ tệp `.svg` nào (hoặc kéo thả vào trình duyệt Chrome, Edge, Brave, Firefox).
3. Sử dụng con lăn chuột kết hợp phím `Ctrl` (`Ctrl + Scroll`) để phóng to lên **500% – 1.000%**. Toàn bộ chữ viết, mũi tên và ký hiệu hình khối sẽ giữ độ sắc nét tuyệt đối, không hề bị vỡ hạt hay mờ nét.

---

## 3. HƯỚNG DẪN IMPORT MÃ MERMAID VÀO DRAW.IO (DIAGRAMS.NET)

Draw.io hỗ trợ công cụ biên dịch Mermaid trực tiếp thành các đối tượng đồ họa (Native Shapes) có thể di chuyển, căn chỉnh và đổi màu tùy ý:

### Bước 1: Mở Draw.io
- Truy cập phiên bản trực tuyến tại: [https://app.diagrams.net/](https://app.diagrams.net/) (hoặc mở ứng dụng Draw.io Desktop trên máy tính).
- Chọn **Create New Diagram** -> **Blank Diagram**.

### Bước 2: Mở hộp thoại chèn Mermaid
Có 2 cách để mở hộp thoại:
- **Cách 1 (Dùng phím tắt):** Nhấn tổ hợp phím **`Ctrl + Shift + I`** trên Windows / Linux (hoặc `Cmd + Shift + I` trên macOS).
- **Cách 2 (Dùng thanh thực đơn):** Trên thanh Menu trên cùng, chọn:  
  `Arrange` (Sắp xếp) ➔ `Insert` (Chèn) ➔ `Advanced` (Nâng cao) ➔ `Mermaid`.

### Bước 3: Dán mã nguồn biểu đồ
1. Mở tệp `.mmd` tương ứng trong thư mục `docs/diagrams/` (ví dụ: `usecase-overview.mmd` hoặc `dfd-lv1.mmd`).
2. Copy toàn bộ nội dung code bên trong tệp.
3. Dán vào khung thoại **Mermaid** trong Draw.io.
4. Nhấn nút **Insert** (Chèn). Draw.io sẽ tự động tạo biểu đồ dưới dạng các hình khối vector độc lập.

---

## 4. CÁC MẸO TINH CHỈNH VÀ TỐI ƯU BỐ CỤC TRONG DRAW.IO

Sau khi dán mã Mermaid vào Draw.io, bạn có thể áp dụng các mẹo sau để sơ đồ đạt tính thẩm mỹ tối đa:

### 1. Tự động dàn trang và chống chồng chéo (Layout Optimization)
- Chọn toàn bộ sơ đồ bằng phím tắt **`Ctrl + A`**.
- Trên thanh Menu, chọn: `Arrange` ➔ `Layout` ➔ chọn một trong các kiểu:
  - **Hierarchical (Phân cấp / Phổ biến nhất):** Thích hợp cho DFD Lv0, DFD Lv1 và Use Case.
  - **Horizontal Flow (Luồng ngang):** Thích hợp cho State Machine và Sequence Diagram.
  - **Organic:** Thích hợp nếu muốn các cụm tự phân bố theo lực hút tự nhiên.

### 2. Định tuyến đường nối (Connection Lines & Waypoints)
- Mặc định sau khi import, một số đường nối có thể thẳng hoặc cắt qua nhau.
- Chọn một hoặc nhiều đường nối, nhìn sang bảng thuộc tính bên phải (**Format Panel**):
  - **Line:** Đổi kiểu từ `Sharp` (Sắc nhọn) sang `Orthogonal` (Vuông góc) hoặc `Curved` (Đường cong mềm mại).
  - **Waypoints:** Kéo các chấm tròn màu xanh trên thân đường nối để bẻ hướng tránh đè lên các node chữ.
  - **Line Jump (Nhảy dây):** Tại mục *Line Jump*, chọn `Arc` hoặc `Gap`. Khi hai đường cắt chéo nhau, đường phía trên sẽ tạo một vòng cung nhảy qua, loại bỏ hoàn toàn hiện tượng dây chéo gây nhầm lẫn!

### 3. Đổi bảng màu và Theme nhanh (Color Themes)
- Bên thanh công cụ bên phải (Format Panel) tab **Style**:
  - Chọn các bảng màu pastel có sẵn ở phần Style Palette.
  - Các node nghiệp vụ đã được thiết kế sẵn để phối hợp hoàn hảo với viền đen `2px` và nền trắng / xanh lơ / vàng kem.

### 4. Xuất file báo cáo học thuật
Để chèn vào báo cáo đồ án Word, LaTeX hoặc slide thuyết trình:
- Chọn `File` ➔ `Export as` (Xuất dưới dạng):
  - **PDF / SVG:** Dành cho in ấn luận văn và báo cáo học thuật chuẩn mực (độ phân giải vector vô hạn).
  - **PNG:** Đặt **DPI = 300%** (hoặc Transparent Background) để dán vào Word/PowerPoint không bị răng cưa.
