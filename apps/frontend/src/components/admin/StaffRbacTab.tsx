'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { adminApi, type AdminRole, type AdminUser } from '../../services/api';

interface Notice {
  type: 'success' | 'error';
  message: string;
}

interface PendingChange {
  user: AdminUser;
  newRole: AdminRole;
}

const ROLE_OPTIONS: AdminRole[] = ['CUSTOMER', 'STAFF', 'ADMIN'];

function roleLabelVi(role: AdminRole): string {
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'STAFF') return 'Nhân viên';
  return 'Khách hàng';
}

function roleBadgeClass(role: AdminRole): string {
  if (role === 'ADMIN')
    return 'bg-purple-50 border-purple-200 text-purple-700';
  if (role === 'STAFF') return 'bg-gold-light/60 border-gold/40 text-house';
  return 'bg-canvas border-ceramic text-ink-muted';
}

export default function StaffRbacTab() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentEmail(localStorage.getItem('brewlite_user_email'));
  }, []);

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.getUsers,
    enabled: mounted,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminRole }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setPending(null);
      setConfirmStep(1);
      setConfirmError(null);
      setNotice({
        type: 'success',
        message: `Đã đổi quyền của ${updated.email} thành ${roleLabelVi(updated.role)}!`,
      });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Đổi quyền thất bại. Vui lòng thử lại sau.';
      setConfirmError(message);
    },
  });

  const openConfirm = (user: AdminUser, newRole: AdminRole) => {
    if (newRole === user.role) return;
    setConfirmError(null);
    setConfirmStep(1);
    setPending({ user, newRole });
  };

  const involvesAdmin =
    pending != null && (pending.user.role === 'ADMIN' || pending.newRole === 'ADMIN');

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 rounded-full border-4 border-primary-accent border-t-transparent animate-spin" />
        <p className="ml-3 text-sm font-semibold text-house">Đang tải danh sách nhân sự...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-sm text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <span>Không tải được danh sách người dùng. Vui lòng tải lại trang và thử lại.</span>
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

      <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">
        Tổng {users.length} tài khoản
      </p>

      <div className="overflow-x-auto rounded-2xl border border-ceramic">
        <table className="w-full min-w-[720px] text-sm bg-white">
          <thead>
            <tr className="bg-canvas/60 text-house text-xs uppercase tracking-wider">
              <th className="text-left font-bold px-4 py-3">Email</th>
              <th className="text-left font-bold px-4 py-3 w-36">Ngày tham gia</th>
              <th className="text-left font-bold px-4 py-3 w-28">Điểm thưởng</th>
              <th className="text-left font-bold px-4 py-3 w-44">Quyền hiện tại</th>
              <th className="text-left font-bold px-4 py-3 w-48">Đổi quyền</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                  Chưa có tài khoản nào trong hệ thống.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = currentEmail != null && user.email === currentEmail;
                return (
                  <tr key={user.id} className="border-t border-ceramic">
                    <td className="px-4 py-3">
                      <p className="font-bold text-house truncate max-w-[260px]" title={user.email}>
                        {user.email}
                      </p>
                      {isSelf && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-primary-accent/10 border border-primary-accent/30 text-primary-accent text-[10px] font-bold">
                          Đây là tài khoản của bạn
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 font-bold text-house">
                      {(user.loyaltyPoints ?? 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-bold ${roleBadgeClass(user.role)}`}
                      >
                        {roleLabelVi(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={isSelf || roleMutation.isPending}
                        onChange={(e) => openConfirm(user, e.target.value as AdminRole)}
                        title={
                          isSelf
                            ? 'Không thể tự đổi quyền của chính mình'
                            : `Đổi quyền cho ${user.email}`
                        }
                        aria-label={`Đổi quyền cho ${user.email}`}
                        className="w-full px-2.5 py-1.5 bg-canvas/40 border border-ceramic rounded-xl text-xs font-semibold text-house focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {roleLabelVi(role)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận đổi quyền"
        >
          <div className="bg-white rounded-2xl shadow-float max-w-sm w-full p-6">
            <h3 className="text-base font-extrabold text-house">
              {confirmStep === 1 ? 'Xác nhận đổi quyền (Bước 1/2)' : 'Xác nhận lần cuối (Bước 2/2)'}
            </h3>

            <div className="mt-3 space-y-1.5 text-sm text-ink">
              <p className="truncate">
                Tài khoản: <b title={pending.user.email}>{pending.user.email}</b>
              </p>
              <p>
                Quyền thay đổi:{' '}
                <b>{roleLabelVi(pending.user.role)}</b>
                <span className="mx-1.5 text-ink-muted">→</span>
                <b className="text-primary-accent">{roleLabelVi(pending.newRole)}</b>
              </p>
            </div>

            {confirmStep === 2 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {involvesAdmin ? (
                    <>
                      <b>Cảnh báo quan trọng:</b> thay đổi này liên quan đến quyền{' '}
                      <b>Quản trị viên (ADMIN)</b>. Việc cấp quyền ADMIN cho phép toàn quyền quản
                      trị hệ thống, còn việc gỡ quyền ADMIN có thể khiến hệ thống mất người quản
                      trị. Hãy chắc chắn bạn hiểu rõ trước khi tiếp tục.
                    </>
                  ) : (
                    'Hành động này sẽ thay đổi quyền truy cập của tài khoản ngay lập tức. Hãy kiểm tra kỹ trước khi xác nhận.'
                  )}
                </span>
              </div>
            )}

            {confirmError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{confirmError}</span>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={roleMutation.isPending}
                onClick={() => {
                  setPending(null);
                  setConfirmStep(1);
                  setConfirmError(null);
                }}
                className="btn-pill flex-1 py-2.5 bg-canvas hover:bg-ceramic text-house text-sm font-bold border border-ceramic"
              >
                Hủy bỏ
              </button>
              {confirmStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setConfirmStep(2)}
                  className="btn-pill flex-1 py-2.5 bg-house hover:bg-black text-white text-sm font-bold shadow-md"
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  type="button"
                  disabled={roleMutation.isPending}
                  onClick={() => {
                    setConfirmError(null);
                    roleMutation.mutate({ id: pending.user.id, role: pending.newRole });
                  }}
                  className="btn-pill flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md"
                >
                  {roleMutation.isPending ? 'Đang lưu...' : 'Xác nhận đổi quyền'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
