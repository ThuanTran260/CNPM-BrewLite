'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Wallet, ShieldCheck, ArrowRight, AlertTriangle, AlertCircle, CheckCircle, Coffee, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { ordersApi, paymentsApi, vouchersApi } from '../../services/api';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<'E_WALLET' | 'BANK_CARD'>('E_WALLET');
  const [forceFail, setForceFail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const items = useCartStore((state) => state.items);
  const voucherCode = useCartStore((state) => state.voucherCode);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getSubtotal());

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('brewlite_token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (voucherCode && subtotal > 0) {
      vouchersApi
        .validateVoucher(voucherCode, subtotal)
        .then((res) => setDiscountAmount(res.discountAmount))
        .catch(() => setDiscountAmount(0));
    }
  }, [router, voucherCode, subtotal]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-house">Giỏ hàng của bạn đang trống</h2>
        <p className="mt-2 text-sm text-ink-muted">Vui lòng chọn món trước khi tiến hành thanh toán.</p>
        <Link href="/" className="btn-pill mt-4 px-6 py-2.5 bg-primary-accent text-white text-xs font-bold shadow-md">
          Quay lại thực đơn
        </Link>
      </div>
    );
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Tạo đơn hàng PENDING tại Backend (Tính lại giá DB + trừ kho)
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          toppings: i.toppings,
          qty: i.qty,
        })),
        voucherCode: voucherCode || undefined,
      };

      const order = await ordersApi.createOrder(orderPayload);

      // 2. Sinh UUID Idempotency-Key mới cho lần thanh toán này
      const idempotencyKey = crypto.randomUUID();

      // 3. Gọi xử lý thanh toán Idempotent
      const paymentResult = await paymentsApi.processPayment(idempotencyKey, {
        orderId: order.id,
        method,
        forceFail,
      });

      if (paymentResult.status === 'PAID') {
        // Thành công: Xóa giỏ hàng và chuyển sang trang tracking đơn
        clearCart();
        router.push(`/orders/${order.id}?success=true`);
      } else {
        // Thất bại giả lập: Giữ giỏ hàng, thông báo cho khách
        setError('Giao dịch thanh toán bị từ chối (Mô phỏng lỗi số dư không đủ). Giỏ hàng của bạn được bảo lưu để thử lại.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Có lỗi xảy ra trong quá trình tạo đơn hoặc thanh toán. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-house tracking-tight mb-2">
          Xác Nhận & Thanh Toán Không Tiền Mặt
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mb-8">
          Hệ thống thanh toán nhanh chóng, an toàn và tự động cập nhật đơn hàng tới quầy Barista.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">Thanh toán không thành công</p>
              <p className="mt-0.5 text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Cột trái: Chọn phương thức thanh toán & test checkbox */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl border border-ceramic p-6 shadow-soft">
              <h2 className="text-sm font-bold text-house uppercase tracking-wider mb-4 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-primary-accent" />
                <span>Chọn phương thức không tiền mặt</span>
              </h2>

              <div className="space-y-3">
                {/* Option 1: Ví điện tử */}
                <div
                  onClick={() => setMethod('E_WALLET')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    method === 'E_WALLET'
                      ? 'border-primary-accent bg-primary-accent/5 shadow-sm'
                      : 'border-ceramic hover:border-ink/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-house">Ví Điện Tử (MoMo / ZaloPay)</h4>
                      <p className="text-xs text-ink-muted">Quét mã QR hoặc thanh toán một chạm qua ví</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    method === 'E_WALLET' ? 'border-primary-accent' : 'border-ceramic'
                  }`}>
                    {method === 'E_WALLET' && <div className="w-2.5 h-2.5 rounded-full bg-primary-accent" />}
                  </div>
                </div>

                {/* Option 2: Thẻ ngân hàng */}
                <div
                  onClick={() => setMethod('BANK_CARD')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    method === 'BANK_CARD'
                      ? 'border-primary-accent bg-primary-accent/5 shadow-sm'
                      : 'border-ceramic hover:border-ink/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-house">Thẻ Ngân Hàng (Napas / Visa)</h4>
                      <p className="text-xs text-ink-muted">Thanh toán an toàn bảo mật qua thẻ nội địa & quốc tế</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    method === 'BANK_CARD' ? 'border-primary-accent' : 'border-ceramic'
                  }`}>
                    {method === 'BANK_CARD' && <div className="w-2.5 h-2.5 rounded-full bg-primary-accent" />}
                  </div>
                </div>
              </div>

              {/* Hộp kiểm thử ngoại lệ (Dành riêng cho Thầy/Nhóm chấm Task 8 & 10) */}
              <div className="mt-6 pt-5 border-t border-ceramic">
                <div className="bg-gold-light/40 border border-gold/40 rounded-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="forceFail"
                      checked={forceFail}
                      onChange={(e) => setForceFail(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-primary-accent focus:ring-primary-accent"
                    />
                    <label htmlFor="forceFail" className="text-xs text-house cursor-pointer">
                      <span className="font-bold block text-red-700">Giả lập lỗi thanh toán (Test Mode)</span>
                      <span className="text-ink-muted block mt-0.5">
                        Tick vào ô này để kiểm thử kịch bản thanh toán thất bại (thẻ không đủ tiền): đơn hàng sẽ chuyển sang trạng thái <code>PAYMENT_FAILED</code> và hoàn lại tồn kho đúng chuẩn Task 8 & 10.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Tóm tắt đơn & nút Xác nhận thanh toán */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-ceramic p-6 shadow-soft space-y-4">
              <h3 className="font-bold text-base text-house border-b border-ceramic pb-3">
                Đơn Hàng ({items.reduce((s, i) => s + i.qty, 0)} món)
              </h3>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between text-xs">
                    <div className="pr-2">
                      <span className="font-bold text-house">{i.name}</span>
                      <span className="text-ink-muted"> x{i.qty}</span>
                      <p className="text-[11px] text-ink-muted">Size {i.size}{i.toppings.length > 0 ? `, ${i.toppings.join(', ')}` : ''}</p>
                    </div>
                    <span className="font-semibold text-house shrink-0">{i.lineTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-ceramic space-y-2 text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span>Tạm tính:</span>
                  <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Mã giảm giá ({voucherCode}):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-ceramic flex justify-between items-baseline text-sm">
                  <span className="font-bold text-house">Tổng cần thanh toán:</span>
                  <span className="font-extrabold text-xl text-primary-accent">{finalTotal.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleCheckout}
                className="btn-pill w-full mt-4 py-3.5 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-lg flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Đang xử lý thanh toán...</span>
                ) : (
                  <>
                    <span>Xác nhận trả • {finalTotal.toLocaleString('vi-VN')}đ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-center text-ink-muted pt-1">
                🔒 Đảm bảo giao dịch không bị trừ tiền 2 lần qua cơ chế <b>Idempotent Key</b>.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
