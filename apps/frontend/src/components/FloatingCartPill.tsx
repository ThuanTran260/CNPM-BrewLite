'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

export default function FloatingCartPill() {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || totalItems === 0) return null;

  const formattedSubtotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(subtotal);

  return (
    <aside aria-label="Thanh giỏ hàng nổi" className="fixed bottom-6 right-4 sm:right-6 z-40 animate-slide-up">
      <Link
        href="/cart"
        className="btn-pill pl-4 pr-5 py-3 bg-house text-white hover:bg-black/90 shadow-float border border-white/20 flex items-center space-x-3 transition-transform hover:scale-105 active:scale-95"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary-accent flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 bg-gold text-house text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-house">
            {totalItems}
          </span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[11px] text-white/70 font-medium leading-none">Giỏ hàng của bạn</span>
          <span className="text-sm font-extrabold text-gold leading-tight">{formattedSubtotal}</span>
        </div>

        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center ml-1">
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </div>
      </Link>
    </aside>
  );
}
