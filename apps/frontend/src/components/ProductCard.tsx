'use client';

import React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price);

  return (
    <div
      onClick={() => product.inStock && onSelect(product)}
      className={`group bg-white rounded-2xl border border-ceramic p-4 flex flex-col justify-between shadow-soft hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden ${
        !product.inStock ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'
      }`}
    >
      {/* Product Image */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-ceramic/50 mb-4">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-pill">
              Hết hàng
            </span>
          </div>
        )}

        {product.stock === 1 && product.inStock && (
          <div className="absolute top-2 right-2 bg-gold text-house text-xs font-bold px-2.5 py-0.5 rounded-pill shadow">
            Chỉ còn 1 ly
          </div>
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
        <div className="mt-4 pt-3 border-t border-ceramic flex items-center justify-between">
          <span className="font-extrabold text-base text-primary-accent">
            {formattedPrice}
          </span>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={(e) => {
              e.stopPropagation();
              if (product.inStock) onSelect(product);
            }}
            className="btn-pill px-3.5 py-1.5 bg-primary-accent hover:bg-primary-hover text-white text-xs font-semibold flex items-center space-x-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Chọn món</span>
          </button>
        </div>
      </div>
    </div>
  );
}
