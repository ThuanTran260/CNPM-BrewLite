'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coffee,
  CheckCircle2,
  Clock,
  QrCode,
  ArrowLeft,
  AlertCircle,
  XCircle,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import { ordersApi } from '../../../services/api';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const orderId = params?.id as string;
  const isNewSuccess = searchParams.get('success') === 'true';

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Polling tự động mỗi 3 giây theo đúng thỏa thuận ADR-007
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrderById(orderId),
    enabled: !!orderId,
    refetchInterval: 3000,
  });

  // Countdown timer cho đơn PENDING
  useEffect(() => {
    if (order?.status === 'PENDING' && order.expiresAt) {
      const calculateTimeLeft = () => {
        const diff = Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000));
        setTimeLeft(diff);
      };

      calculateTimeLeft();
      const interval = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [order]);

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-accent border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-semibold text-house">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mb-3" />
          <h2 className="text-xl font-bold text-house">Không thể tìm thấy đơn hàng</h2>
          <p className="mt-1 text-xs text-ink-muted max-w-sm">
            Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Link href="/" className="btn-pill mt-4 px-6 py-2.5 bg-primary-accent text-white text-xs font-bold shadow-md">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PAID', label: 'Đã thanh toán', desc: 'Đơn đã xác nhận' },
    { key: 'PREPARING', label: 'Đang pha chế', desc: 'Barista đang chuẩn bị' },
    { key: 'READY', label: 'Sẵn sàng lấy món', desc: 'Mời tới quầy nhận nước' },
    { key: 'COMPLETED', label: 'Hoàn tất', desc: 'Đã giao thành công' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PAID':
        return 0;
      case 'PREPARING':
        return 1;
      case 'READY':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIndex = getStepIndex(order.status);
  const isFailedOrCancelled = order.status === 'PAYMENT_FAILED' || order.status === 'CANCELLED';

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/orders/history"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-house hover:text-primary-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lịch sử đơn hàng</span>
          </Link>

          <span className="text-xs text-ink-muted">
            Tự động cập nhật mỗi <b>3 giây</b>
          </span>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-3xl border border-ceramic p-6 sm:p-8 shadow-soft text-center relative overflow-hidden mb-6">
          {isNewSuccess && (
            <div className="inline-flex items-center space-x-1.5 bg-green-50 text-green-700 px-3.5 py-1 rounded-pill text-xs font-bold mb-4 border border-green-200 animate-scale">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Thanh toán thành công! Cảm ơn bạn.</span>
            </div>
          )}

          <h2 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Mã đơn hàng của bạn</h2>
          <div className="text-4xl sm:text-5xl font-black text-house tracking-tight">{order.code}</div>

          {/* Trạng thái đặc biệt: PENDING */}
          {order.status === 'PENDING' && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col items-center">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Đang chờ thanh toán</span>
              </div>
              {timeLeft !== null && (
                <p className="mt-1">
                  Đơn hàng sẽ tự động hủy sau: <b className="font-mono text-sm text-red-600">{formatCountdown(timeLeft)}</b>
                </p>
              )}
              <div className="mt-3 flex space-x-3">
                <Link
                  href="/checkout"
                  className="btn-pill px-4 py-1.5 bg-primary-accent text-white font-bold text-xs"
                >
                  Thanh toán ngay
                </Link>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="btn-pill px-4 py-1.5 bg-white text-red-600 border border-red-200 font-bold text-xs hover:bg-red-50"
                >
                  Hủy đơn
                </button>
              </div>
            </div>
          )}

          {/* Trạng thái thất bại / Đã hủy */}
          {isFailedOrCancelled && (
            <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-bold">
                  {order.status === 'PAYMENT_FAILED'
                    ? 'Giao dịch thanh toán bị từ chối / lỗi số dư'
                    : 'Đơn hàng đã bị hủy và hoàn lại tồn kho'}
                </span>
              </div>
              {order.status === 'PAYMENT_FAILED' && (
                <div className="mt-2 flex space-x-3">
                  <Link
                    href="/checkout"
                    className="btn-pill px-4 py-1.5 bg-primary-accent text-white font-bold text-xs"
                  >
                    Thử thanh toán lại
                  </Link>
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="btn-pill px-4 py-1.5 bg-white text-red-600 border border-red-200 font-bold text-xs hover:bg-red-50"
                  >
                    Hủy đơn hoàn toàn
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stepper tiến trình (Chỉ hiển thị cho các đơn đã thanh toán) */}
          {!isFailedOrCancelled && order.status !== 'PENDING' && (
            <div className="mt-8 pt-6 border-t border-ceramic">
              <div className="grid grid-cols-4 gap-2 relative">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary-accent text-white shadow-md'
                            : isCurrent
                            ? 'bg-primary-accent text-white ring-4 ring-primary-accent/20 animate-pulse shadow-md'
                            : 'bg-ceramic text-ink-muted'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCurrent ? (
                          <Coffee className="w-5 h-5 animate-bounce" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-[11px] sm:text-xs font-bold mt-2 ${isCurrent ? 'text-primary-accent' : 'text-house'}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-ink-muted hidden sm:block mt-0.5">{step.desc}</span>
                    </div>
                  );
                })}
              </div>

              {order.status === 'READY' && (
                <div className="mt-6 p-4 rounded-2xl bg-gold-light border border-gold text-house text-sm font-bold flex items-center justify-center space-x-2 animate-pulse shadow-soft">
                  <Sparkles className="w-5 h-5 text-gold shrink-0" />
                  <span>Món của bạn đã sẵn sàng! Mời bạn tới quầy nhận nước với mã {order.code}.</span>
                </div>
              )}
            </div>
          )}

          {/* Mock QR Code nhận món (Chỉ hiển thị cho đơn đã thanh toán và đang hoạt động theo ADR-007) */}
          {(order.status === 'PAID' || order.status === 'PREPARING' || order.status === 'READY') && (
            <div className="mt-6 pt-6 border-t border-ceramic flex flex-col items-center">
              <div className="w-36 h-36 p-3 bg-white rounded-2xl border border-ceramic shadow-inner flex flex-col items-center justify-center">
                <QrCode className="w-24 h-24 text-house opacity-80" />
                <span className="text-[10px] font-mono font-bold text-house mt-1">{order.code}</span>
              </div>
              <p className="mt-2 text-[11px] text-ink-muted italic">
                * Mã nhận món tại quầy (Bản demo nghiệm thu — không quét thật theo ADR-007)
              </p>
            </div>
          )}
        </div>

        {/* Order Details Breakdown Card */}
        <div className="bg-white rounded-3xl border border-ceramic p-6 shadow-soft space-y-4">
          <h3 className="font-bold text-sm text-house uppercase tracking-wider border-b border-ceramic pb-3">
            Chi tiết các món trong đơn
          </h3>

          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start text-xs sm:text-sm">
                <div>
                  <h4 className="font-bold text-house">{item.productName}</h4>
                  <p className="text-xs text-ink-muted">
                    Size {item.size} • Số lượng: {item.qty}
                  </p>
                  {item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0 && (
                    <p className="text-[11px] text-primary-accent">
                      Topping: {item.toppings.join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-bold text-house">{item.lineTotal?.toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-ceramic space-y-1.5 text-xs text-ink-muted">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{order.subtotal?.toLocaleString('vi-VN')}đ</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Giảm giá ({order.voucherCode}):</span>
                <span>-{order.discountAmount?.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="pt-2 border-t border-ceramic flex justify-between items-baseline text-sm sm:text-base font-extrabold text-house">
              <span>Tổng thanh toán:</span>
              <span className="text-primary-accent text-xl">{order.total?.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
