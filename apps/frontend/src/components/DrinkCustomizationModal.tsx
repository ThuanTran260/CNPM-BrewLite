'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Product, SizeOption, ToppingOption } from '../types';
import { useCartStore } from '../store/useCartStore';

interface DrinkCustomizationModalProps {
  product: Product | null;
  sizes: SizeOption[];
  toppings: ToppingOption[];
  onClose: () => void;
}

export default function DrinkCustomizationModal({
  product,
  sizes,
  toppings,
  onClose,
}: DrinkCustomizationModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  const addItem = useCartStore((state) => state.addItem);

  if (!product) return null;

  // Tính toán đơn giá real-time
  const sizeDelta = sizes.find((s) => s.name === selectedSize)?.priceDelta || 0;
  const toppingsDelta = selectedToppings.reduce((sum, tName) => {
    const topping = toppings.find((t) => t.name === tName);
    return sum + (topping?.priceDelta || 0);
  }, 0);

  const unitPrice = product.price + sizeDelta + toppingsDelta;
  const totalPrice = unitPrice * quantity;

  const handleToggleTopping = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName)
        ? prev.filter((t) => t !== toppingName)
        : [...prev, toppingName],
    );
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      size: selectedSize,
      toppings: selectedToppings,
      unitPrice: unitPrice,
      qty: quantity,
    });

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 400);
  };

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(totalPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-float overflow-hidden max-h-[90vh] flex flex-col animate-slide-up sm:animate-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Image & Close Button */}
        <div className="relative w-full h-48 sm:h-56 bg-ceramic/50 shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-ink flex items-center justify-center shadow-md transition-all active:scale-90"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{product.name}</h2>
            <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{product.description}</p>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* 1. Chọn Size (Radio Pill buttons) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-house uppercase tracking-wider">
                Chọn Kích Cỡ (Size)
              </label>
              <span className="text-xs text-primary-accent font-semibold">Bắt buộc</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {sizes.map((s) => {
                const isSelected = selectedSize === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSelectedSize(s.name)}
                    className={`btn-pill py-2.5 px-3 border text-xs font-semibold flex flex-col items-center justify-center space-y-0.5 ${
                      isSelected
                        ? 'border-primary-accent bg-primary-accent/10 text-primary-accent font-bold shadow-sm'
                        : 'border-ceramic bg-canvas/60 text-ink hover:border-ink/30'
                    }`}
                  >
                    <span>Size {s.name}</span>
                    <span className="text-[11px] opacity-75">
                      {s.priceDelta > 0 ? `+${s.priceDelta.toLocaleString('vi-VN')}đ` : 'Giá gốc'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Topping (Multi-select checkboxes) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-house uppercase tracking-wider">
                Thêm Topping
              </label>
              <span className="text-xs text-ink-muted">Tùy chọn</span>
            </div>
            <div className="space-y-2">
              {toppings.map((t) => {
                const isChecked = selectedToppings.includes(t.name);
                return (
                  <div
                    key={t.name}
                    onClick={() => handleToggleTopping(t.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-primary-accent bg-primary-accent/5'
                        : 'border-ceramic bg-white hover:border-ink/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-primary-accent border-primary-accent text-white'
                            : 'border-ceramic bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium text-ink">{t.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary-accent">
                      +{t.priceDelta.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Số lượng (Quantity) */}
          <div className="flex items-center justify-between pt-2 border-t border-ceramic">
            <span className="text-sm font-bold text-house">Số lượng</span>
            <div className="flex items-center space-x-3 bg-ceramic/50 p-1 rounded-pill">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-sm hover:bg-ceramic active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm min-w-[24px] text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-sm hover:bg-ceramic active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 border-t border-ceramic bg-white shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`btn-pill w-full py-3.5 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-lg flex items-center justify-center space-x-2 ${
              addedAnimation ? 'bg-green-700 scale-95' : ''
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã thêm vào giỏ hàng!</span>
              </>
            ) : (
              <span>Thêm vào giỏ hàng • {formattedTotal}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
