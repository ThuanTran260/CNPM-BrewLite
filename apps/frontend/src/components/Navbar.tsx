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

        {/* Navigation Links */}
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="text-white hover:text-primary-light transition-colors">
            Thực đơn
          </Link>
          <Link href="/orders/history" className="text-white/80 hover:text-white transition-colors">
            Lịch sử đơn
          </Link>
          <Link
            href="/staff"
            className="text-gold hover:text-white transition-colors font-semibold flex items-center space-x-1"
          >
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
            <span>Quầy Barista</span>
          </Link>
        </nav>

        {/* Actions (Cart & Auth) */}
        <div className="flex items-center space-x-4">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-6 h-6" />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-accent text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-house shadow-sm animate-scale">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Auth Button */}
          {mounted && userEmail ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-white/20">
              <span className="text-xs text-white/80 hidden sm:inline max-w-[120px] truncate">
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-pill px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center space-x-1"
            >
              <User className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
