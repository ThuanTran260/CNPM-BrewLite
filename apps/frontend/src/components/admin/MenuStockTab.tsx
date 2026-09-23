'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Coffee, Plus, X } from 'lucide-react';
import { productsApi } from '../../services/api';
import type { Product } from '../../types';

interface Notice {
  type: 'success' | 'error';
  message: string;
}

interface RowEdit {
  price: string;
  stock: string;
}

interface NewDishForm {
  name: string;
  price: string;
  stock: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: NewDishForm = {
  name: '',
  price: '',
  stock: '',
  description: '',
  imageUrl: '',
};

function getRowEdit(product: Product, edits: Record<string, RowEdit>): RowEdit {
  return edits[product.id] ?? { price: String(product.price), stock: String(product.stock) };
}

export default function MenuStockTab() {
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<NewDishForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-products'],
    queryFn: productsApi.getProducts,
  });

  const products: Product[] = data?.items ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, price, stock }: { id: string; price: number; stock: number }) =>
      productsApi.updateProduct(id, { price, stock }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setRowError((prev) => {
        const next = { ...prev };
        delete next[updated.id];
        return next;
      });
      setNotice({ type: 'success', message: `Đã cập nhật "${updated.name}" thành công!` });
    },
    onError: (err: unknown, variables) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Cập nhật thất bại. Vui lòng thử lại sau.';
      setRowError((prev) => ({ ...prev, [variables.id]: message }));
    },
  });

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      setFormError(null);
      setNotice({ type: 'success', message: `Đã thêm món "${created.name}" vào thực đơn!` });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Thêm món mới thất bại. Vui lòng thử lại sau.';
      setFormError(message);
    },
  });

  const handleSaveRow = (product: Product) => {
    const edit = getRowEdit(product, edits);
    const price = Number(edit.price);
    const stock = Number(edit.stock);

    if (
      edit.price.trim() === '' ||
      edit.stock.trim() === '' ||
      !Number.isFinite(price) ||
      !Number.isFinite(stock) ||
      price < 0 ||
      stock < 0
    ) {
      setRowError((prev) => ({
        ...prev,
        [product.id]: 'Giá và tồn kho phải là số hợp lệ, tối thiểu là 0 (Min 0).',
      }));
      return;
    }

    if (price === product.price && stock === product.stock) {
      setRowError((prev) => ({
        ...prev,
        [product.id]: 'Bạn chưa thay đổi giá trị nào so với hiện tại.',
      }));
      return;
    }

    setNotice(null);
    updateMutation.mutate({ id: product.id, price, stock });
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Vui lòng nhập tên món.');
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) {
      setFormError('Giá bán phải là số hợp lệ, tối thiểu là 0 (Min 0).');
      return;
    }

    if (form.stock.trim() === '' || !Number.isFinite(stock) || stock < 0) {
      setFormError('Tồn kho phải là số hợp lệ, tối thiểu là 0 (Min 0).');
      return;
    }

    setNotice(null);
    createMutation.mutate({
      name: form.name.trim(),
      price,
      stock,
      description: form.description.trim() === '' ? '' : form.description.trim(),
      imageUrl: form.imageUrl.trim() === '' ? '' : form.imageUrl.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 rounded-full border-4 border-primary-accent border-t-transparent animate-spin" />
        <p className="ml-3 text-sm font-semibold text-house">Đang tải thực đơn...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-sm text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span>Không tải được danh sách món. Vui lòng tải lại trang và thử lại.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={
            notice.type === 'success'
              ? 'p-3.5 rounded-xl bg-green-50 border border-green-200 flex items-start space-x-2.5 text-xs text-green-700 font-medium'
              : 'p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-xs text-red-700'
          }
        >
          {notice.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          Tổng {products.length} món trong thực đơn
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError(null);
            setShowAddModal(true);
          }}
          className="btn-pill px-4 py-2 bg-primary-accent hover:bg-primary-hover text-white text-xs font-bold shadow-md inline-flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm món mới</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ceramic">
        <table className="w-full min-w-[720px] text-sm bg-white">
          <thead>
            <tr className="bg-canvas/60 text-house text-xs uppercase tracking-wider">
              <th className="text-left font-bold px-4 py-3">Món</th>
              <th className="text-left font-bold px-4 py-3 w-36">Giá bán (đ)</th>
              <th className="text-left font-bold px-4 py-3 w-32">Tồn kho</th>
              <th className="text-left font-bold px-4 py-3 w-32">Trạng thái</th>
              <th className="text-right font-bold px-4 py-3 w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                  Thực đơn hiện đang trống. Hãy thêm món mới đầu tiên!
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const edit = getRowEdit(product, edits);
                const inStock = product.stock > 0;
                return (
                  <tr key={product.id} className="border-t border-ceramic align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-ceramic/50 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-canvas border border-ceramic flex items-center justify-center text-ink-muted shrink-0">
                            <Coffee className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-house truncate">{product.name}</p>
                          {product.description && (
                            <p className="text-[11px] text-ink-muted truncate max-w-[220px]">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {rowError[product.id] && (
                        <p className="mt-1.5 flex items-start space-x-1 text-[11px] text-red-600">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                          <span>{rowError[product.id]}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={edit.price}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [product.id]: { ...getRowEdit(product, prev), price: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                        aria-label={`Giá bán của ${product.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={edit.stock}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [product.id]: { ...getRowEdit(product, prev), stock: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                        aria-label={`Tồn kho của ${product.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {inStock ? (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold">
                          Còn hàng
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold">
                          Hết hàng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={updateMutation.isPending}
                        onClick={() => handleSaveRow(product)}
                        className="btn-pill px-4 py-1.5 bg-house hover:bg-black text-white text-xs font-bold shadow-sm"
                      >
                        {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Thêm món mới"
        >
          <div className="bg-white rounded-2xl shadow-float max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-house">Thêm món mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full text-ink-muted hover:bg-canvas transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddDish} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                  Tên món <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Cà Phê Sữa Đá"
                  className="block w-full px-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                    Giá bán (đ) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="35000"
                    className="block w-full px-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                    Tồn kho <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    placeholder="100"
                    className="block w-full px-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                  Mô tả <span className="text-ink-muted font-medium normal-case">(không bắt buộc)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về món..."
                  rows={2}
                  className="block w-full px-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                  Ảnh minh họa (URL){' '}
                  <span className="text-ink-muted font-medium normal-case">(không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="block w-full px-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={createMutation.isPending}
                  onClick={() => setShowAddModal(false)}
                  className="btn-pill flex-1 py-2.5 bg-canvas hover:bg-ceramic text-house text-sm font-bold border border-ceramic"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-pill flex-1 py-2.5 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-md"
                >
                  {createMutation.isPending ? 'Đang thêm...' : 'Thêm món'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
