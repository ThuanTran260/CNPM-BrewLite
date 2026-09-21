import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  assertTransition,
  ALLOWED_TRANSITIONS,
} from '../src/common/state-machine/order-state-machine';

describe('Order State Machine & assertTransition (Task 10 Spec)', () => {
  describe('Ma trận chuyển đổi hợp lệ (Valid Transitions)', () => {
    it('cho phép PENDING -> PAID khi khách hàng thanh toán thành công', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAID)).not.toThrow();
    });

    it('cho phép PENDING -> PAYMENT_FAILED khi thanh toán thất bại (giả lập lỗi/hết số dư)', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED),
      ).not.toThrow();
    });

    it('cho phép PENDING -> CANCELLED khi khách hàng hoặc hệ thống hủy đơn hàng', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.CANCELLED),
      ).not.toThrow();
    });

    it('cho phép PAYMENT_FAILED -> PENDING khi khách hàng thực hiện thanh toán lại', () => {
      expect(() =>
        assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING),
      ).not.toThrow();
    });

    it('cho phép PAYMENT_FAILED -> CANCELLED khi khách hàng hủy đơn sau khi thanh toán thất bại', () => {
      expect(() =>
        assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED),
      ).not.toThrow();
    });

    it('cho phép PAID -> PREPARING khi Barista tiếp nhận đơn và bắt đầu pha chế', () => {
      expect(() =>
        assertTransition(OrderStatus.PAID, OrderStatus.PREPARING),
      ).not.toThrow();
    });

    it('cho phép PAID -> CANCELLED khi Staff/Admin hủy đơn trước khi pha chế', () => {
      expect(() =>
        assertTransition(OrderStatus.PAID, OrderStatus.CANCELLED),
      ).not.toThrow();
    });

    it('cho phép PREPARING -> READY khi Barista hoàn thành pha chế thức uống', () => {
      expect(() =>
        assertTransition(OrderStatus.PREPARING, OrderStatus.READY),
      ).not.toThrow();
    });

    it('cho phép READY -> COMPLETED khi khách hàng đã nhận thức uống tại quầy', () => {
      expect(() =>
        assertTransition(OrderStatus.READY, OrderStatus.COMPLETED),
      ).not.toThrow();
    });
  });

  describe('Ma trận chuyển đổi bất hợp lệ bị chặn (Invalid Transitions - Throws BadRequestException)', () => {
    it('chặn nhảy cóc từ PENDING -> READY (chưa thanh toán mà đã đòi nhận nước)', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.READY),
      ).toThrow(BadRequestException);
    });

    it('chặn nhảy cóc từ PENDING -> PREPARING (chưa thanh toán mà đã pha chế)', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.PREPARING),
      ).toThrow(BadRequestException);
    });

    it('chặn nhảy cóc từ PENDING -> COMPLETED', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED),
      ).toThrow(BadRequestException);
    });

    it('chặn quay ngược từ COMPLETED -> PREPARING (đơn đã hoàn thành không thể quay lại)', () => {
      expect(() =>
        assertTransition(OrderStatus.COMPLETED, OrderStatus.PREPARING),
      ).toThrow(BadRequestException);
    });

    it('chặn quay ngược từ COMPLETED -> PENDING', () => {
      expect(() =>
        assertTransition(OrderStatus.COMPLETED, OrderStatus.PENDING),
      ).toThrow(BadRequestException);
    });

    it('chặn hủy đơn khi đã hoàn thành COMPLETED -> CANCELLED', () => {
      expect(() =>
        assertTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
      ).toThrow(BadRequestException);
    });

    it('chặn quay ngược từ CANCELLED -> PAID (đơn đã hủy không thể thanh toán)', () => {
      expect(() =>
        assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID),
      ).toThrow(BadRequestException);
    });

    it('chặn quay ngược từ CANCELLED -> PENDING', () => {
      expect(() =>
        assertTransition(OrderStatus.CANCELLED, OrderStatus.PENDING),
      ).toThrow(BadRequestException);
    });

    it('chặn quay ngược từ PREPARING -> PAID', () => {
      expect(() =>
        assertTransition(OrderStatus.PREPARING, OrderStatus.PAID),
      ).toThrow(BadRequestException);
    });

    it('chặn quay ngược từ READY -> PREPARING', () => {
      expect(() =>
        assertTransition(OrderStatus.READY, OrderStatus.PREPARING),
      ).toThrow(BadRequestException);
    });

    it('chặn hủy ngang khi Barista đang pha chế: PREPARING -> CANCELLED', () => {
      expect(() =>
        assertTransition(OrderStatus.PREPARING, OrderStatus.CANCELLED),
      ).toThrow(BadRequestException);
    });

    it('chặn hủy ngang khi thức uống đã sẵn sàng: READY -> CANCELLED', () => {
      expect(() =>
        assertTransition(OrderStatus.READY, OrderStatus.CANCELLED),
      ).toThrow(BadRequestException);
    });
  });

  describe('Kiểm tra thông báo lỗi chi tiết', () => {
    it('thông báo lỗi phải chứa rõ ràng trạng thái nguồn và đích', () => {
      expect.assertions(2);
      try {
        assertTransition(OrderStatus.PENDING, OrderStatus.READY);
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toBe(
          'Chuyển đổi trạng thái không hợp lệ: Không thể chuyển từ [PENDING] sang [READY]',
        );
      }
    });
  });

  describe('Kiểm tra tính đầy đủ của ALLOWED_TRANSITIONS', () => {
    it('phải bao quát đủ 7 trạng thái của OrderStatus enum', () => {
      const allStatuses = Object.values(OrderStatus);
      const configuredStatuses = Object.keys(ALLOWED_TRANSITIONS);
      expect(configuredStatuses.sort()).toEqual(allStatuses.sort());
    });

    it('trạng thái kết thúc (Terminal states: COMPLETED, CANCELLED) phải có mảng rỗng', () => {
      expect(ALLOWED_TRANSITIONS[OrderStatus.COMPLETED]).toEqual([]);
      expect(ALLOWED_TRANSITIONS[OrderStatus.CANCELLED]).toEqual([]);
    });
  });
});
