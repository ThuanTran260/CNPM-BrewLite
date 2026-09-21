'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Coffee } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import DrinkCustomizationModal from '../components/DrinkCustomizationModal';
import FloatingCartPill from '../components/FloatingCartPill';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { productsApi } from '../services/api';
import { Product } from '../types';

export default function MenuPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  });

  const categories = [
    { id: 'ALL', name: 'Tất cả đồ uống' },
    { id: 'COFFEE', name: 'Cà phê nguyên chất' },
    { id: 'TEA', name: 'Trà & Sữa' },
  ];

  const filteredProducts = data?.items.filter((p) => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'COFFEE') {
      return (
        p.name.toLowerCase().includes('cà phê') ||
        p.name.toLowerCase().includes('americano') ||
        p.name.toLowerCase().includes('cappuccino') ||
        p.name.toLowerCase().includes('bạc xỉu')
      );
    }
    if (activeCategory === 'TEA') {
      return (
        p.name.toLowerCase().includes('trà') ||
        p.name.toLowerCase().includes('sữa')
      );
    }
    return true;
  }) || [];

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />

      {/* Main Menu Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Banner Hero */}
        <div className="bg-house text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-soft relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center space-x-1.5 bg-gold/20 text-gold px-3.5 py-1 rounded-pill text-xs font-bold uppercase tracking-wider mb-4 border border-gold/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hương vị cà phê nguyên bản</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Thực Đơn Đồ Uống BrewLite
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
              Pha chế từ những hạt cà phê hảo hạng. Tự do tùy biến kích cỡ và topping yêu thích, thanh toán không tiền mặt nhận món nhanh tại quầy.
            </p>
          </div>

          <div className="mt-6 md:mt-0 relative z-10 flex items-center justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/10 border-2 border-gold/40 flex items-center justify-center text-gold shadow-float backdrop-blur-sm">
              <Coffee className="w-12 h-12" />
            </div>
          </div>

          {/* Decorative Background Blob */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-accent/30 blur-3xl pointer-events-none" />
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`btn-pill px-5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary-accent text-white shadow-md'
                  : 'bg-white text-ink border border-ceramic hover:border-primary-accent/40 shadow-sm'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <EmptyState
            title="Không thể tải thực đơn"
            message="Đã có lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại dịch vụ Backend đang chạy tại cổng 3001."
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="Không tìm thấy món phù hợp"
            message="Hiện không có món nào trong danh mục này. Bạn hãy thử chọn danh mục khác nhé!"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Quick Action */}
      <FloatingCartPill />

      {/* Customization Modal / Bottom Sheet */}
      {selectedProduct && (
        <DrinkCustomizationModal
          product={selectedProduct}
          sizes={data?.options.sizes || []}
          toppings={data?.options.toppings || []}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-house text-white/70 text-xs py-6 text-center border-t border-white/10 mt-12">
        <p>© 2026 BrewLite. Bài tập lớn môn Công nghệ Phần mềm — SGU.</p>
      </footer>
    </div>
  );
}
