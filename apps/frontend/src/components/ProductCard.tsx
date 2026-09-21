'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index?: number;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, index = 0, onSelect }: ProductCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price);

  return (
    <motion.div
      layout
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.05, 0.3),
      }}
      whileHover={
        product.inStock && !shouldReduceMotion
          ? {
              y: -6,
              boxShadow: '0 16px 32px -8px rgba(30, 57, 50, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
              transition: { type: 'spring', stiffness: 300, damping: 30 },
            }
          : undefined
      }
      onClick={() => product.inStock && onSelect(product)}
      className={`group bg-white rounded-2xl border border-ceramic/90 ring-1 ring-black/[0.02] p-4 flex flex-col justify-between shadow-soft relative overflow-hidden transition-colors duration-200 cursor-pointer ${
        !product.inStock ? 'opacity-60 cursor-not-allowed' : 'hover:border-gold/40'
      }`}
    >
      {/* Product Image with Double-Bezel Nested Frame */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-ceramic/40 mb-4 ring-1 ring-black/[0.06] border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Subtle Ambient Vignette on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md tracking-wide">
              Hết hàng
            </span>
          </div>
        )}

        {product.stock === 1 && product.inStock && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2.5 right-2.5 bg-gradient-to-r from-gold to-[#dfb86e] text-house text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm border border-gold/40 flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Chỉ còn 1 ly</span>
          </motion.div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-house group-hover:text-primary-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer: Price & Add Button */}
        <div className="mt-4 pt-3 border-t border-ceramic/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Giá từ</span>
            <span className="font-extrabold text-base text-primary-accent tracking-tight">
              {formattedPrice}
            </span>
          </div>

          <motion.button
            type="button"
            disabled={!product.inStock}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => {
              e.stopPropagation();
              if (product.inStock) onSelect(product);
            }}
            className="rounded-full px-3.5 py-1.5 bg-primary-accent hover:bg-primary-hover text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Chọn món</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
