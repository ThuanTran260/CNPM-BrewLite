'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, Coffee, Sparkles, Check, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useCartStore } from '../../store/useCartStore';
import { vouchersApi } from '../../services/api';

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  const items = useCartStore((state) => state.items);
  const voucherCode = useCartStore((state) => state.voucherCode);
  const setVoucherCode = useCartStore((state) => state.setVoucherCode);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getSubtotal());

  useEffect(() => {
    setMounted(true);
    if (voucherCode) {
      setVoucherInput(voucherCode);
    }
  }, [voucherCode]);

  // Kiểm tra lại voucher khi subtotal thay đổi
  useEffect(() => {
    if (voucherCode && subtotal > 0) {
      vouchersApi
        .validateVoucher(voucherCode, subtotal)
        .then((res) => {
          setDiscountAmount(res.discountAmount);
          setVoucherSuccess(`Đã áp dụng mã [${voucherCode}]`);
          setVoucherError(null);
        })
        .catch((err) => {
          setDiscountAmount(0);
          setVoucherCode(null);
          setVoucherError(err.response?.data?.message || 'Mã giảm giá không còn khả dụng');
          setVoucherSuccess(null);
        });
    } else {
      setDiscountAmount(0);
    }
  }, [subtotal, voucherCode, setVoucherCode]);

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;

    setValidatingVoucher(true);
    setVoucherError(null);
    setVoucherSuccess(null);

    try {
      const res = await vouchersApi.validateVoucher(voucherInput.trim(), subtotal);
      setDiscountAmount(res.discountAmount);
      setVoucherCode(res.voucher.code);
      setVoucherSuccess(`Áp dụng thành công mã [${res.voucher.code}]`);
    } catch (err: any) {
      setVoucherCode(null);
      setDiscountAmount(0);
      setVoucherError(err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode(null);
    setVoucherInput('');
    setDiscountAmount(0);
    setVoucherSuccess(null);
    setVoucherError(null);
  };

  const finalTotal = Math.max(0, subtotal - discountAmount);
  const loyaltyPointsEarned = Math.floor(finalTotal / 10000);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-house tracking-tight mb-6">
          Giỏ Hàng Của Bạn
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-ceramic p-12 text-center max-w-lg mx-auto shadow-soft my-8">
            <div className="w-20 h-20 rounded-full bg-canvas flex items-center justify-center mx-auto mb-5 text-primary-accent border border-ceramic shadow-inner">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-house">Giỏ hàng của bạn đang trống</h2>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              Bạn chưa chọn món đồ uống nào. Hãy khám phá thực đơn đa dạng của BrewLite ngay hôm nay nhé!
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="btn-pill px-6 py-3 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-md inline-flex items-center space-x-2"
              >
                <span>Khám phá thực đơn</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Món đã chọn ({items.reduce((s, i) => s + i.qty, 0)})
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Xóa tất cả
                </button>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-ceramic p-4 sm:p-5 flex items-start space-x-4 shadow-soft"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-ceramic/50 shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-house truncate">{item.name}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="bg-canvas border border-ceramic text-house text-[11px] font-bold px-2 py-0.5 rounded-md">
                            Size {item.size}
                          </span>
                          {item.toppings.map((top) => (
                            <span
                              key={top}
                              className="bg-primary-accent/10 text-primary-accent text-[11px] font-semibold px-2 py-0.5 rounded-md"
                            >
                              +{top}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-ink-muted hover:text-red-600 p-1 transition-colors"
                        title="Xóa món"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-extrabold text-sm sm:text-base text-primary-accent">
                        {item.lineTotal.toLocaleString('vi-VN')}đ
                      </span>

                      <div className="flex items-center space-x-2.5 bg-ceramic/50 p-1 rounded-pill">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          className="w-7 h-7 rounded-full bg-white text-ink flex items-center justify-center shadow-sm hover:bg-ceramic active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs min-w-[20px] text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          className="w-7 h-7 rounded-full bg-white text-ink flex items-center justify-center shadow-sm hover:bg-ceramic active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary & Voucher */}
            <div className="space-y-6">
              {/* Voucher Box */}
              <div className="bg-white rounded-3xl border border-ceramic p-5 shadow-soft">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="w-4 h-4 text-gold" />
                  <h3 className="font-bold text-sm text-house uppercase tracking-wider">
                    Mã Khuyến Mãi (Voucher)
                  </h3>
                </div>

                <form onSubmit={handleApplyVoucher} className="flex space-x-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="MÃ GIẢM GIÁ (VD: WELCOME10)"
                    disabled={!!voucherCode}
                    className="flex-1 px-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-xs font-semibold text-house placeholder-ink-muted/50 focus:outline-none focus:border-primary-accent uppercase"
                  />
                  {voucherCode ? (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="btn-pill px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold border border-red-200"
                    >
                      Bỏ mã
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={validatingVoucher || !voucherInput.trim()}
                      className="btn-pill px-4 py-2 bg-house hover:bg-black text-white text-xs font-bold shadow-sm"
                    >
                      {validatingVoucher ? 'Kiểm tra...' : 'Áp dụng'}
                    </button>
                  )}
                </form>

                {voucherError && (
                  <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{voucherError}</span>
                  </div>
                )}

                {voucherSuccess && (
                  <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-green-700 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{voucherSuccess}</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-ceramic text-[11px] text-ink-muted">
                  <p>• Mã thử nghiệm: <code className="font-mono text-house font-bold">WELCOME10</code> (giảm 10%, min 50k)</p>
                  <p>• Mã thử nghiệm: <code className="font-mono text-house font-bold">FIXED20K</code> (giảm 20k, min 100k)</p>
                </div>
              </div>

              {/* Cost Summary Box */}
              <div className="bg-white rounded-3xl border border-ceramic p-6 shadow-soft space-y-4">
                <h3 className="font-bold text-base text-house border-b border-ceramic pb-3">
                  Tóm Tắt Đơn Hàng
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-ink-muted">
                    <span>Tạm tính ({items.reduce((s, i) => s + i.qty, 0)} món)</span>
                    <span className="font-semibold text-house">{subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Giảm giá khuyến mãi</span>
                      <span className="font-semibold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-ceramic flex justify-between items-baseline">
                    <span className="font-bold text-base text-house">Tổng thanh toán</span>
                    <span className="font-extrabold text-2xl text-primary-accent">
                      {finalTotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                {/* Loyalty preview badge */}
                <div className="bg-gold-light/60 border border-gold/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-house">
                  <Sparkles className="w-4 h-4 text-gold shrink-0" />
                  <span>
                    Bạn sẽ tích lũy được <b>+{loyaltyPointsEarned} điểm</b> sau khi thanh toán đơn hàng này!
                  </span>
                </div>

                {/* Checkout Link */}
                <Link
                  href="/checkout"
                  className="btn-pill w-full py-3.5 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-lg flex items-center justify-center space-x-2 text-center"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-center text-ink-muted">
                  Thanh toán không tiền mặt an toàn qua Ví điện tử hoặc Thẻ ngân hàng
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
