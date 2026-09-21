'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowRight, ShoppingBag, Coffee, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import { ordersApi } from '../../../services/api';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('brewlite_token');
    if (!token) {
      router.push('/login?redirect=/orders/history');
    }
  }, [router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: ordersApi.getMyOrders,
    enabled: mounted,
  });

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary-accent border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-semibold text-house">Đang tải lịch sử đơn hàng...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Đã thanh toán</span>;
      case 'PREPARING':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-pulse">Đang pha chế</span>;
      case 'READY':
        return <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Sẵn sàng nhận món</span>;
      case 'COMPLETED':
        return <span className="bg-gray-100 text-gray-700 border border-gray-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Hoàn tất</span>;
      case 'PAYMENT_FAILED':
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Lỗi thanh toán</span>;
      case 'CANCELLED':
        return <span className="bg-gray-50 text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Đã hủy</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">Chờ thanh toán</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-house tracking-tight mb-6">
          Lịch Sử Đơn Hàng Của Bạn
        </h1>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-ceramic p-12 text-center max-w-md mx-auto shadow-soft my-8">
            <div className="w-16 h-16 rounded-full bg-canvas flex items-center justify-center mx-auto mb-4 text-primary-accent border border-ceramic">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-house">Bạn chưa có đơn hàng nào</h3>
            <p className="mt-1 text-xs text-ink-muted">
              Hãy thử thưởng thức ly cà phê thơm ngon của BrewLite ngay hôm nay nhé!
            </p>
            <Link
              href="/"
              className="btn-pill mt-5 px-6 py-2.5 bg-primary-accent text-white text-xs font-bold shadow-md inline-flex items-center space-x-1.5"
            >
              <span>Xem thực đơn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-ceramic p-5 shadow-soft hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center justify-between border-b border-ceramic pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-extrabold text-base text-house group-hover:text-primary-accent transition-colors">
                      {order.code}
                    </span>
                    <span className="text-xs text-ink-muted">
                      • {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink font-medium">
                      {order.items?.map((i: any) => `${i.productName} (x${i.qty})`).join(', ')}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Tổng số món: {order.items?.reduce((sum: number, i: any) => sum + i.qty, 0)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-base text-primary-accent">
                      {order.total?.toLocaleString('vi-VN')}đ
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-muted group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
