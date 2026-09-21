'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coffee, ShoppingBag, User, LogOut } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
    const email = localStorage.getItem('brewlite_user_email');
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('brewlite_token');
    localStorage.removeItem('brewlite_user_email');
    localStorage.removeItem('brewlite_user_role');
    setUserEmail(null);
    window.location.reload();
  };

  return (
    <header className="bg-house text-white shadow-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">BrewLite</span>
        </Link>

        {/* Navigation Links (Pure Customer View - No Staff/Admin Link) */}
        <nav className="flex items-center space-x-8 text-sm font-medium">
          <Link
            href="/"
            className="text-white hover:text-primary-light transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary-light after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
          >
            Thực đơn
          </Link>
          <Link
            href="/orders/history"
            className="text-white/80 hover:text-white transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
          >
            Lịch sử đơn
          </Link>
        </nav>

        {/* Actions (Cart & High-End Account Profile) */}
        <div className="flex items-center space-x-4">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white flex items-center justify-center"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5" />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-accent text-white text-[11px] font-extrabold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-house shadow-sm animate-scale">
                {totalItems}
              </span>
            )}
          </Link>

          {/* High-End Account Profile Pill (Zero CLS Reserved Container) */}
          {!mounted ? (
            <div className="w-28 h-8 rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
          ) : userEmail ? (
            <div className="flex items-center space-x-2 bg-white/10 hover:bg-white/[0.14] border border-white/15 rounded-full py-1 pl-1.5 pr-2.5 transition-all duration-300 shadow-sm backdrop-blur-sm">
              {/* Nested Avatar Circle */}
              <div className="w-7 h-7 rounded-full bg-primary-accent border border-white/20 flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner select-none">
                {userEmail.charAt(0).toUpperCase()}
              </div>

              {/* Email & Tier Details */}
              <div className="flex flex-col text-left leading-tight max-w-[110px] sm:max-w-[140px]">
                <span className="text-xs font-semibold text-white truncate" title={userEmail}>
                  {userEmail}
                </span>
                <span className="text-[9px] text-primary-light font-medium tracking-wider uppercase">
                  Thành viên
                </span>
              </div>

              {/* Trailing Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 active:scale-90 ml-1"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-pill px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center space-x-1.5 active:scale-95 transition-all duration-200 shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-primary-light" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
