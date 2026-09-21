'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coffee,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { ordersApi } from '../../services/api';

export default function StaffBaristaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('brewlite_user_role');
    const token = localStorage.getItem('brewlite_token');

    if (!token) {
      router.push('/login?redirect=/staff');
      return;
    }

    if (role !== 'STAFF' && role !== 'ADMIN') {
      setUserRole('FORBIDDEN');
    } else {
      setUserRole(role);
    }
  }, [router]);

  // Polling danh sách đơn cần pha mỗi 3 giây
  const { data: activeOrders = [], isLoading, isFetching } = useQuery({
    queryKey: ['staff-active-orders'],
    queryFn: ordersApi.getStaffActiveOrders,
    enabled: mounted && userRole !== 'FORBIDDEN' && !!userRole,
    refetchInterval: 3000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }: { orderId: string; nextStatus: string }) =>
      ordersApi.updateOrderStatus(orderId, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-active-orders'] });
    },
  });

  const handleUpdate = (orderId: string, nextStatus: string) => {
    updateStatusMutation.mutate({ orderId, nextStatus });
  };

  const handleLogout = () => {
    localStorage.removeItem('brewlite_token');
    localStorage.removeItem('brewlite_user_email');
    localStorage.removeItem('brewlite_user_role');
    router.push('/login');
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-accent border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-house">Đang tải bảng điều khiển Barista KDS...</p>
      </div>
    );
  }

  if (userRole === 'FORBIDDEN') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-14 h-14 text-red-600 mb-3" />
        <h2 className="text-2xl font-bold text-house">Không có quyền truy cập</h2>
        <p className="mt-2 text-sm text-ink-muted max-w-md">
          Màn hình này chỉ dành riêng cho tài khoản Nhân viên Barista (role <code>STAFF</code> hoặc <code>ADMIN</code>).
          Tài khoản của bạn hiện là Khách hàng.
        </p>
        <div className="mt-6 flex space-x-3">
          <Link href="/" className="btn-pill px-5 py-2.5 bg-primary-accent text-white text-xs font-bold">
            Về trang chủ khách hàng
          </Link>
          <button
            onClick={handleLogout}
            className="btn-pill px-5 py-2.5 bg-white border border-ceramic text-house text-xs font-bold hover:bg-ceramic"
          >
            Đăng nhập tài khoản Staff
          </button>
        </div>
      </div>
    );
  }

  // Phân chia đơn hàng theo 3 cột Kanban
  const paidOrders = activeOrders.filter((o: any) => o.status === 'PAID');
  const preparingOrders = activeOrders.filter((o: any) => o.status === 'PREPARING');
  const readyOrders = activeOrders.filter((o: any) => o.status === 'READY');

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* KDS Header */}
      <header className="bg-house text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gold text-house flex items-center justify-center font-bold shadow-md">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight">Barista KDS</span>
                <span className="bg-gold/20 text-gold border border-gold/40 text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase">
                  Quầy Pha Chế
                </span>
              </div>
              <p className="text-[11px] text-white/70">Màn hình điều phối chế biến đồ uống thời gian thực</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-pill">
              <span className={`w-2 h-2 rounded-full ${isFetching ? 'bg-gold animate-ping' : 'bg-green-400'}`} />
              <span>Polling 3s • Tổng {activeOrders.length} đơn đang xử lý</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-pill px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center space-x-1.5"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát quầy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Kanban Board (3 Columns) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
          {/* CỘT 1: CẦN PHA (PAID) */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-ceramic p-4 flex flex-col shadow-soft">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-ceramic">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-house">
                  1. Cần Pha Chế (PAID)
                </h2>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-pill">
                {paidOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {paidOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted border-2 border-dashed border-ceramic rounded-2xl">
                  Chưa có đơn mới thanh toán
                </div>
              ) : (
                paidOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border-2 border-blue-200 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-house tracking-tight">{order.code}</span>
                      <span className="text-[11px] text-ink-muted flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    <div className="bg-canvas/50 rounded-xl p-3 space-y-1.5 border border-ceramic">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="text-xs">
                          <span className="font-extrabold text-house">{item.productName}</span>
                          <span className="text-primary-accent font-bold"> (Size {item.size})</span>
                          <span className="font-bold text-ink"> x{item.qty}</span>
                          {item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0 && (
                            <p className="text-[11px] text-amber-800 font-semibold pl-2">
                              + {item.toppings.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleUpdate(order.id, 'PREPARING')}
                      className="btn-pill w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Bắt đầu pha chế</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CỘT 2: ĐANG PHA CHẾ (PREPARING) */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-ceramic p-4 flex flex-col shadow-soft">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-ceramic">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-house">
                  2. Đang Pha Chế (PREPARING)
                </h2>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-pill">
                {preparingOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {preparingOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted border-2 border-dashed border-ceramic rounded-2xl">
                  Không có đơn đang pha
                </div>
              ) : (
                preparingOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border-2 border-amber-300 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-amber-900 tracking-tight">{order.code}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Đang làm...
                      </span>
                    </div>

                    <div className="bg-canvas/50 rounded-xl p-3 space-y-1.5 border border-ceramic">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="text-xs">
                          <span className="font-extrabold text-house">{item.productName}</span>
                          <span className="text-primary-accent font-bold"> (Size {item.size})</span>
                          <span className="font-bold text-ink"> x{item.qty}</span>
                          {item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0 && (
                            <p className="text-[11px] text-amber-800 font-semibold pl-2">
                              + {item.toppings.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleUpdate(order.id, 'READY')}
                      className="btn-pill w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã pha xong (Sẵn sàng)</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CỘT 3: SẴN SÀNG NHẬN MÓN (READY) */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-ceramic p-4 flex flex-col shadow-soft">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-ceramic">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-house">
                  3. Chờ Lấy Món (READY)
                </h2>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-black px-2.5 py-0.5 rounded-pill">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {readyOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted border-2 border-dashed border-ceramic rounded-2xl">
                  Không có đơn đang chờ nhận
                </div>
              ) : (
                readyOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border-2 border-green-300 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-green-800 tracking-tight">{order.code}</span>
                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Mời khách lấy
                      </span>
                    </div>

                    <div className="bg-canvas/50 rounded-xl p-3 space-y-1.5 border border-ceramic">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="text-xs">
                          <span className="font-extrabold text-house">{item.productName}</span>
                          <span className="text-primary-accent font-bold"> (Size {item.size})</span>
                          <span className="font-bold text-ink"> x{item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleUpdate(order.id, 'COMPLETED')}
                      className="btn-pill w-full py-2.5 bg-primary-accent hover:bg-primary-hover text-white text-xs font-bold shadow flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Giao khách hoàn tất</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
