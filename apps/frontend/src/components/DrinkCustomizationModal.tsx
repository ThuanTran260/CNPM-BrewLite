'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';
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
  const shouldReduceMotion = useReducedMotion();
  const [selectedSize, setSelectedSize] = useState<string>(() => sizes[0]?.name || 'S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  const addItem = useCartStore((state) => state.addItem);

  // Sync / reset state when product or sizes change
  useEffect(() => {
    if (product) {
      setSelectedSize(sizes[0]?.name || 'S');
      setSelectedToppings([]);
      setQuantity(1);
      setAddedAnimation(false);
    }
  }, [product?.id, sizes]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  // Calculate dynamic pricing
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
    if (addedAnimation) return;

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
    }, 450);
  };

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(totalPrice);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-float overflow-hidden max-h-[90vh] flex flex-col relative border border-ceramic/80"
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close button with tactile micro-physics */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-house flex items-center justify-center shadow-md backdrop-blur-sm transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </motion.button>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="inline-flex items-center space-x-1 text-gold text-[11px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Tùy chỉnh công thức</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{product.name}</h2>
            <p className="text-xs text-white/85 line-clamp-1 mt-0.5 font-normal">{product.description}</p>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Chọn Size (Radio Pill buttons with layoutId spring scoped via LayoutGroup) */}
          <LayoutGroup id={`modal-sizes-${product.id}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-house uppercase tracking-wider">
                  Chọn Kích Cỡ (Size)
                </label>
                <span className="text-[11px] text-primary-accent font-bold px-2 py-0.5 rounded-full bg-primary-light/50">
                  Bắt buộc
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {sizes.map((s) => {
                  const isSelected = selectedSize === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelectedSize(s.name)}
                      className={`relative rounded-full py-2.5 px-3 border text-xs font-semibold flex flex-col items-center justify-center space-y-0.5 transition-colors z-10 ${
                        isSelected
                          ? 'text-primary-accent font-bold border-transparent'
                          : 'border-ceramic bg-canvas/40 text-ink hover:border-ink/20'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="sizeHighlight"
                          className="absolute inset-0 bg-primary-accent/10 border-2 border-primary-accent rounded-full -z-10 shadow-sm"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span>Size {s.name}</span>
                      <span className="text-[11px] opacity-80 font-medium">
                        {s.priceDelta > 0 ? `+${s.priceDelta.toLocaleString('vi-VN')}đ` : 'Giá gốc'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </LayoutGroup>

          {/* 2. Chọn Topping (Multi-select checkboxes with spring checkmark) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-house uppercase tracking-wider">
                Thêm Topping
              </label>
              <span className="text-xs text-ink-muted">Tùy chọn</span>
            </div>
            <div className="space-y-2">
              {toppings.map((t) => {
                const isChecked = selectedToppings.includes(t.name);
                return (
                  <motion.div
                    key={t.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => handleToggleTopping(t.name)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-primary-accent/50 bg-primary-accent/[0.04]'
                        : 'border-ceramic bg-white hover:border-ink/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{
                          scale: isChecked ? [0.85, 1.15, 1] : 1,
                          backgroundColor: isChecked ? '#00754A' : '#ffffff',
                          borderColor: isChecked ? '#00754A' : '#edebe9',
                        }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                      >
                        {isChecked && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </motion.div>
                        )}
                      </motion.div>
                      <span className="text-sm font-medium text-ink">{t.name}</span>
                    </div>
                    <span className="text-xs font-bold text-primary-accent">
                      +{t.priceDelta.toLocaleString('vi-VN')}đ
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 3. Số lượng (Quantity with spring tap) */}
          <div className="flex items-center justify-between pt-2 border-t border-ceramic/80">
            <span className="text-sm font-bold text-house">Số lượng</span>
            <div className="flex items-center space-x-3 bg-ceramic/50 p-1 rounded-full">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-sm hover:bg-ceramic transition-colors"
                aria-label="Giảm số lượng"
              >
                <Minus className="w-4 h-4 stroke-[2.2]" />
              </motion.button>
              <motion.span
                key={quantity}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="font-extrabold text-sm min-w-[24px] text-center text-house"
              >
                {quantity}
              </motion.span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-sm hover:bg-ceramic transition-colors"
                aria-label="Tăng số lượng"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Action Button Footer with smooth price badge */}
        <div className="p-4 sm:p-5 border-t border-ceramic/80 bg-white shrink-0">
          <motion.button
            type="button"
            disabled={addedAnimation}
            onClick={handleAddToCart}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`rounded-full w-full py-3.5 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-lg flex items-center justify-center space-x-2 transition-colors duration-200 disabled:cursor-not-allowed ${
              addedAnimation ? 'bg-house' : ''
            }`}
          >
            <AnimatePresence mode="wait">
              {addedAnimation ? (
                <motion.div
                  key="added"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex items-center space-x-1.5 text-gold"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span className="font-extrabold">Đã thêm vào giỏ hàng!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="add-default"
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  className="flex items-center space-x-2"
                >
                  <span>Thêm vào giỏ hàng •</span>
                  <motion.span
                    key={totalPrice}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="font-extrabold text-gold"
                  >
                    {formattedTotal}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
