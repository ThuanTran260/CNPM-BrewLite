# HƯỚNG DẪN SỬ DỤNG VÀ NHẬP MÃ BIỂU ĐỒ MERMAID VÀO DRAW.IO
## (Comprehensive Draw.io Integration & Diagram Customization Guide)

Tài liệu này cung cấp hướng dẫn chi tiết cách sử dụng các tệp mã nguồn Mermaid (`.mmd`) trong thư mục `docs/diagrams/` để nhập trực tiếp vào **Draw.io (diagrams.net)** nhằm chỉnh sửa, biên tập và xuất báo cáo học thuật chất lượng cao.

---

## 1. DANH MỤC CÁC BIỂU ĐỒ HỆ THỐNG BREWLITE

Tất cả các biểu đồ đều đã được chuẩn hóa **chữ đen tuyền (`#000000`)**, nền pastel tương phản cao, viền đậm 2px, tối ưu hoàn hảo cho cả Light Mode, Dark Mode và in ấn trắng đen:

| STT | Tên biểu đồ | Mô tả phân hệ | Mã nguồn Mermaid (.mmd) |
|:---:|---|---|:---:|
| **1** | **BFD** | Sơ đồ phân rã chức năng kinh doanh (Business Functions) | [bfd.mmd](./diagrams/bfd.mmd) |
| **2** | **DFD Lv0** | Sơ đồ luồng dữ liệu mức ngữ cảnh hệ thống BrewLite | [dfd-lv0.mmd](./diagrams/dfd-lv0.mmd) |
| **3** | **DFD Lv1** | Sơ đồ luồng dữ liệu mức 1 phân rã chi tiết | [dfd-lv1.mmd](./diagrams/dfd-lv1.mmd) |
| **4** | **Use Case Tổng quan** | Sơ đồ Use Case cấp cao (4 Tác nhân kết nối 5 Phân hệ) | [usecase-overview.mmd](./diagrams/usecase-overview.mmd) |
| **5** | **Use Case Khách hàng** | Phân rã chi tiết luồng nghiệp vụ Khách hàng | [usecase-customer.mmd](./diagrams/usecase-customer.mmd) |
| **6** | **Use Case Quầy bar** | Phân rã chi tiết luồng vận hành Quầy & Pha chế | [usecase-staff.mmd](./diagrams/usecase-staff.mmd) |
| **7** | **Use Case Admin & Tự động hóa** | Phân rã chi tiết Quản trị viên & Tự động hóa dọn dẹp | [usecase-admin-cron.mmd](./diagrams/usecase-admin-cron.mmd) |
| **8** | **ERD** | Sơ đồ quan hệ thực thể chuẩn hóa hệ thống | [erd.mmd](./diagrams/erd.mmd) |
| **9** | **Sequence 1** | Luồng Đăng nhập & Đặt lại mật khẩu (Chuẩn 4 tầng học thuật) | [sequence-login.mmd](./diagrams/sequence-login.mmd) |
| **10** | **Sequence 2** | Luồng Đặt đồ uống & Kiểm tra tồn kho | [sequence-order-creation.mmd](./diagrams/sequence-order-creation.mmd) |
| **11** | **Sequence 3** | Luồng Thanh toán không tiền mặt & Tích điểm thưởng | [sequence-idempotent-payment.mmd](./diagrams/sequence-idempotent-payment.mmd) |
| **12** | **Sequence 4** | Luồng Tiếp nhận đơn & Cập nhật pha chế tại quầy | [sequence-staff-kds.mmd](./diagrams/sequence-staff-kds.mmd) |
| **13** | **State Machine** | Máy trạng thái vòng đời đơn hàng | [order-state-machine.mmd](./diagrams/order-state-machine.mmd) |

---

## 2. KẾT XUẤT VÀ TÙY BIẾN ĐỒ HỌA TRÊN DRAW.IO
Toàn bộ mã nguồn biểu đồ được thiết kế tương thích trực tiếp với trình dựng của Draw.io. Khi cần đưa vào Word báo cáo hoặc slide thuyết trình, bạn chỉ cần nhập mã Mermaid vào Draw.io (xem Mục 3) và xuất ra file ảnh PNG (DPI 300%) hoặc PDF/SVG vector để đạt độ sắc nét tuyệt đối.

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
