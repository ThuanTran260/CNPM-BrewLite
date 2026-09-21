import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  voucherCode: string | null;
  addItem: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  setVoucherCode: (code: string | null) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      voucherCode: null,

      addItem: (newItem) => {
        const sortedToppings = [...newItem.toppings].sort();
        const id = `${newItem.productId}_${newItem.size}_${sortedToppings.join('_')}`;

        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.id === id);

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingIndex];
            const newQty = existingItem.qty + newItem.qty;
            updatedItems[existingIndex] = {
              ...existingItem,
              qty: newQty,
              lineTotal: newQty * existingItem.unitPrice,
            };
            return { items: updatedItems };
          }

          const lineTotal = newItem.qty * newItem.unitPrice;
          return {
            items: [...state.items, { ...newItem, id, lineTotal }],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, qty, lineTotal: qty * item.unitPrice }
              : item,
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], voucherCode: null });
      },

      setVoucherCode: (code) => {
        set({ voucherCode: code });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.lineTotal, 0);
      },
    }),
    {
      name: 'brewlite_cart_storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
