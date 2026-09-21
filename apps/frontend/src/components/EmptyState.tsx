import React from 'react';
import { Coffee } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = 'Chưa có sản phẩm',
  message = 'Hiện tại danh mục đồ uống đang được cập nhật. Vui lòng quay lại sau.',
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-3xl border border-ceramic p-12 text-center max-w-md mx-auto shadow-soft my-12">
      <div className="w-16 h-16 rounded-full bg-canvas flex items-center justify-center mx-auto mb-4 text-primary-accent border border-ceramic">
        <Coffee className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-house">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted leading-relaxed">{message}</p>
    </div>
  );
}
