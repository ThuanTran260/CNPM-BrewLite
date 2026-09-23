import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard xác thực JWT tùy chọn: cho phép ẩn danh (request.user = null)
// khi không có hoặc có token không hợp lệ, thay vì ném 401.
// Dùng cho các endpoint xem trước công khai như POST /vouchers/validate.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
