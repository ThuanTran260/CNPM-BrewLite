/**
 * Tiêu chuẩn định giá Size và Topping theo ADR-007
 * Cố định hằng số giúp tối ưu truy vấn CSDL, tính giá an toàn tại Backend
 */

export const SIZE_PRICES: Record<string, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

export const TOPPING_PRICES: Record<string, number> = {
  'Trân châu trắng': 5000,
  'Kem Cheese': 10000,
  'Thạch cà phê': 5000,
};

export function calculateItemUnitPrice(
  basePrice: number,
  size: string,
  toppings: string[] = [],
): number {
  const sizeDelta = SIZE_PRICES[size] ?? 0;
  const toppingsDelta = toppings.reduce((sum, t) => sum + (TOPPING_PRICES[t] ?? 0), 0);
  return basePrice + sizeDelta + toppingsDelta;
}
