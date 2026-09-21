'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { Sparkles, Coffee } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import DrinkCustomizationModal from '../components/DrinkCustomizationModal';
import FloatingCartPill from '../components/FloatingCartPill';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { productsApi } from '../services/api';
import { Product } from '../types';

// Cinematic stagger animation variants for the Hero banner
const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

export default function MenuPage() {
  const shouldReduceMotion = useReducedMotion();
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

  const isCoffeeItem = (name: string) => {
    const lower = name.toLowerCase();
    return (
      lower.includes('cà phê') ||
      lower.includes('americano') ||
      lower.includes('cappuccino') ||
      lower.includes('bạc xỉu') ||
      lower.includes('cold brew') ||
      lower.includes('espresso')
    );
  };

  const filteredProducts =
    data?.items.filter((p) => {
      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'COFFEE') {
        return isCoffeeItem(p.name);
      }
      if (activeCategory === 'TEA') {
        return (
          !isCoffeeItem(p.name) &&
          (p.name.toLowerCase().includes('trà') || p.name.toLowerCase().includes('sữa'))
        );
      }
      return true;
    }) || [];

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />

      {/* Main Menu Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Banner Hero: Cinematic Staggered Reveal + Ambient Glow + Floating Coffee Steam */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroContainerVariants}
          className="bg-house text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-soft relative overflow-hidden flex flex-col md:flex-row items-center justify-between border border-white/10"
        >
          {/* Left Text Content with Staggered Elements */}
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <motion.div
              variants={heroItemVariants}
              className="inline-flex items-center space-x-1.5 bg-gold/20 text-gold px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-gold/30 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hương vị cà phê nguyên bản</span>
            </motion.div>

            <motion.h1
              variants={heroItemVariants}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight"
            >
              Thực Đơn Đồ Uống BrewLite
            </motion.h1>

            <motion.p
              variants={heroItemVariants}
              className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed font-normal"
            >
              Pha chế từ những hạt cà phê hảo hạng. Tự do tùy biến kích cỡ và topping yêu thích, thanh toán không tiền mặt nhận món nhanh tại quầy.
            </motion.p>
          </div>

          {/* Right Floating Coffee Icon with Rising Steam & Glowing Aura */}
          <motion.div
            variants={heroItemVariants}
            className="mt-8 md:mt-0 relative z-10 flex items-center justify-center"
          >
            {/* Ambient gold glow ring */}
            <motion.div
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: [1, 1.15, 1],
                      opacity: [0.35, 0.65, 0.35],
                    }
              }
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
              }}
              className="absolute w-32 h-32 rounded-full bg-gold/20 blur-xl pointer-events-none"
            />

            {/* Floating Cup Container with Anchored Steam Wisps */}
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.6,
                ease: 'easeInOut',
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/10 border-2 border-gold/40 flex items-center justify-center text-gold shadow-float backdrop-blur-md relative"
            >
              {/* Rising Coffee Steam Wisps */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-end justify-center space-x-1.5 pointer-events-none z-20">
                {[
                  { delay: 0, x: -3, duration: 2.2 },
                  { delay: 0.6, x: 0, duration: 2.5 },
                  { delay: 1.2, x: 3, duration: 2.1 },
                ].map((steam, i) => (
                  <motion.span
                    key={i}
                    animate={
                      shouldReduceMotion
                        ? {}
                        : {
                            y: [0, -14, -22],
                            x: [0, steam.x, steam.x * 1.5],
                            opacity: [0, 0.75, 0],
                            scaleY: [0.6, 1.2, 0.4],
                          }
                    }
                    transition={{
                      repeat: Infinity,
                      duration: steam.duration,
                      delay: steam.delay,
                      ease: 'easeInOut',
                    }}
                    className="w-1.5 h-5 bg-gradient-to-t from-gold/60 to-white/10 rounded-full blur-[0.8px]"
                  />
                ))}
              </div>

              <Coffee className="w-12 h-12 stroke-[1.8]" />
            </motion.div>
          </motion.div>

          {/* Decorative Ambient Background Gradients */}
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.35, 0.2],
                  }
            }
            transition={{
              repeat: Infinity,
              duration: 7,
              ease: 'easeInOut',
            }}
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-accent/40 blur-3xl pointer-events-none"
          />
          <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        </motion.div>

        {/* Category Filters with Fluid Spring Indicator */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 z-10 ${
                  isActive
                    ? 'text-white'
                    : 'bg-white text-ink border border-ceramic hover:border-primary-accent/40 shadow-sm'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="categoryHighlight"
                    className="absolute inset-0 bg-primary-accent rounded-full shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {cat.name}
              </button>
            );
          })}
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
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Floating Cart Quick Action */}
      <FloatingCartPill />

      {/* Customization Modal / Bottom Sheet with AnimatePresence */}
      <AnimatePresence>
        {selectedProduct && (
          <DrinkCustomizationModal
            key={selectedProduct.id}
            product={selectedProduct}
            sizes={data?.options.sizes || []}
            toppings={data?.options.toppings || []}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-house text-white/70 text-xs py-6 text-center border-t border-white/10 mt-12">
        <p>© 2026 BrewLite. Bài tập lớn môn Công nghệ Phần mềm — SGU.</p>
      </footer>
    </div>
  );
}
