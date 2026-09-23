'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, ShieldAlert, Users, UtensilsCrossed } from 'lucide-react';
import MenuStockTab from '../../components/admin/MenuStockTab';
import StaffRbacTab from '../../components/admin/StaffRbacTab';

type AdminTab = 'menu' | 'staff';

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('brewlite_token');
    const role = localStorage.getItem('brewlite_user_role');

    if (!token) {
      router.push('/login?redirect=/admin');
      return;
    }

    if (role !== 'ADMIN') {
      setUserRole('FORBIDDEN');
    } else {
      setUserRole(role);
    }
  }, [router]);

  // Tự động chuyển về trang chủ sau khi hiển thị thông báo 403.
  useEffect(() => {
    if (mounted && userRole === 'FORBIDDEN') {
      const timer = window.setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [mounted, userRole, router]);

  if (!mounted || userRole === null) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-accent border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-house">Đang kiểm tra quyền quản trị...</p>
      </div>
    );
  }

  if (userRole === 'FORBIDDEN') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-14 h-14 text-red-600 mb-3" />
        <h2 className="text-2xl font-bold text-house">403 — Không có quyền truy cập</h2>
        <p className="mt-2 text-sm text-ink-muted max-w-md">
          Trang quản trị chỉ dành riêng cho tài khoản Quản trị viên (role <code>ADMIN</code>).
          Bạn sẽ được tự động chuyển về trang chủ sau 3 giây.
        </p>
        <div className="mt-6">
          <Link href="/" className="btn-pill px-6 py-2.5 bg-primary-accent text-white text-xs font-bold shadow-md">
            Về trang chủ ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-canvas">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-full bg-house text-gold flex items-center justify-center shadow-md shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-house tracking-tight">
              Bảng Điều Khiển Quản Trị
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              Quản lý thực đơn, tồn kho và phân quyền nhân sự.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-ceramic p-1.5 shadow-soft flex flex-col sm:flex-row gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={
              activeTab === 'menu'
                ? 'btn-pill flex-1 py-2.5 bg-house text-white text-sm font-bold shadow-md inline-flex items-center justify-center space-x-2'
                : 'btn-pill flex-1 py-2.5 bg-transparent text-ink-muted hover:bg-canvas text-sm font-bold inline-flex items-center justify-center space-x-2'
            }
            aria-pressed={activeTab === 'menu'}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Thực đơn &amp; Tồn kho</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={
              activeTab === 'staff'
                ? 'btn-pill flex-1 py-2.5 bg-house text-white text-sm font-bold shadow-md inline-flex items-center justify-center space-x-2'
                : 'btn-pill flex-1 py-2.5 bg-transparent text-ink-muted hover:bg-canvas text-sm font-bold inline-flex items-center justify-center space-x-2'
            }
            aria-pressed={activeTab === 'staff'}
          >
            <Users className="w-4 h-4" />
            <span>Nhân sự &amp; Phân quyền</span>
          </button>
        </div>

        <section className="mt-4 bg-white rounded-2xl border border-ceramic p-4 sm:p-6 shadow-soft">
          {activeTab === 'menu' ? <MenuStockTab /> : <StaffRbacTab />}
        </section>
      </main>
    </div>
  );
}
