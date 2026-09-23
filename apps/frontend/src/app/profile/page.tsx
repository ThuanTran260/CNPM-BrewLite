'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  Crown,
  Gift,
  Medal,
  Sparkles,
  Ticket,
  Wallet,
} from 'lucide-react';
import { authApi, vouchersApi, type MyVoucher, type RedeemedVoucher } from '../../services/api';

const REDEEM_WARNING =
  'Đổi điểm thưởng sẽ làm giảm số dư hiện tại và có thể ảnh hưởng đến thứ hạng thẻ của bạn';

interface RewardPack {
  pointsCost: 20 | 50;
  value: number;
  minOrder: number;
}

const REWARD_PACKS: RewardPack[] = [
  { pointsCost: 20, value: 20000, minOrder: 50000 },
  { pointsCost: 50, value: 50000, minOrder: 100000 },
];

interface TierInfo {
  name: string;
  color: string;
  nextAt: number | null;
  progress: number;
  progressLabel: string;
}

function getTier(points: number): TierInfo {
  if (points >= 100) {
    return {
      name: 'Gold',
      color: '#cba258',
      nextAt: null,
      progress: 100,
      progressLabel: 'Bạn đang ở hạng cao nhất',
    };
  }
  if (points >= 50) {
    return {
      name: 'Silver',
      color: '#718096',
      nextAt: 100,
      progress: ((points - 50) / 50) * 100,
      progressLabel: `Còn ${100 - points} điểm nữa để lên hạng Vàng`,
    };
  }
  return {
    name: 'Bronze',
    color: '#8c5a3c',
    nextAt: 50,
    progress: (points / 50) * 100,
    progressLabel: `Còn ${50 - points} điểm nữa để lên hạng Bạc`,
  };
}

function tierLabelVi(name: string): string {
  if (name === 'Gold') return 'Vàng';
  if (name === 'Silver') return 'Bạc';
  return 'Đồng';
}

// Mã thành viên chỉ để hiển thị, suy ra phía client từ email (không dùng để định danh server).
function deriveMemberCode(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i += 1) {
    h = (h * 31 + email.charCodeAt(i)) >>> 0;
  }
  return `BL-${h.toString(36).toUpperCase().padStart(7, '0')}`;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'Không thời hạn';
  return `HSD: ${new Date(expiresAt).toLocaleDateString('vi-VN')}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [confirmPack, setConfirmPack] = useState<RewardPack | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [lastRedeemed, setLastRedeemed] = useState<RedeemedVoucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('brewlite_token');
    if (!token) {
      router.push('/login?redirect=/profile');
    }
  }, [router]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: mounted,
  });

  const { data: myVouchers, isLoading: vouchersLoading } = useQuery({
    queryKey: ['my-vouchers'],
    queryFn: vouchersApi.getMyVouchers,
    enabled: mounted,
  });

  const isLoading = !mounted || profileLoading;

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((current) => (current === code ? null : current));
    }, 2000);
  };

  const openConfirm = (pack: RewardPack) => {
    setRedeemError(null);
    setConfirmPack(pack);
  };

  const handleConfirmRedeem = async () => {
    if (!confirmPack) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      const result = await vouchersApi.redeemVoucher(confirmPack.pointsCost);
      // Cập nhật số dư ngay lập tức + đồng bộ lại từ server.
      queryClient.setQueryData(['profile'], (old: any) =>
        old ? { ...old, loyaltyPoints: result.remainingPoints } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-vouchers'] });
      setLastRedeemed(result.voucher);
      setConfirmPack(null);
    } catch (err: any) {
      setRedeemError(err.response?.data?.message || 'Đổi điểm thất bại. Vui lòng thử lại sau.');
    } finally {
      setRedeeming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-accent border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-house">Đang tải hồ sơ thành viên...</p>
      </div>
    );
  }

  const points: number = profile?.loyaltyPoints ?? 0;
  const email: string = profile?.email ?? '';
  const tier = getTier(points);
  const vouchers: MyVoucher[] = myVouchers ?? [];

  return (
    <div className="flex-1 flex flex-col bg-canvas">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-house tracking-tight">
          Hồ Sơ Thành Viên
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-1 mb-6">
          Theo dõi điểm thưởng, đổi voucher ưu đãi và quản lý ví của bạn.
        </p>

        {/* Thẻ thành viên */}
        <section className="bg-white rounded-2xl border border-ceramic p-5 sm:p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md shrink-0"
                style={{ backgroundColor: tier.color }}
              >
                <Crown className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-base text-house truncate" title={email}>
                  {email}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Mã thành viên: <span className="font-mono font-bold text-house">{deriveMemberCode(email)}</span>
                </p>
                {profile?.createdAt && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    Tham gia từ {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-2">
              <span
                className="px-3.5 py-1.5 rounded-full text-xs font-extrabold text-white uppercase tracking-wider shadow-sm inline-flex items-center space-x-1.5"
                style={{ backgroundColor: tier.color }}
              >
                <Medal className="w-3.5 h-3.5" />
                <span>
                  {tier.name} • {tierLabelVi(tier.name)}
                </span>
              </span>
              <span className="text-sm font-bold text-house inline-flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-gold" />
                <span>{points.toLocaleString('vi-VN')} điểm</span>
              </span>
            </div>
          </div>

          {/* Thanh tiến trình hạng */}
          <div className="mt-5">
            <div className="h-2.5 rounded-full bg-ceramic overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, tier.progress)}%`, backgroundColor: tier.color }}
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">{tier.progressLabel}</p>
          </div>
        </section>

        {/* Cửa hàng đổi thưởng */}
        <section className="mt-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-house tracking-tight flex items-center space-x-2">
            <Gift className="w-5 h-5 text-gold" />
            <span>Cửa Hàng Đổi Thưởng</span>
          </h2>

          {lastRedeemed && (
            <div className="mt-3 p-4 rounded-2xl bg-green-50 border border-green-200 flex flex-col sm:flex-row sm:items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-green-600 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-bold text-green-800">Đổi thưởng thành công!</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Mã voucher mới của bạn:{' '}
                  <span className="font-mono font-extrabold">{lastRedeemed.code}</span> — giảm{' '}
                  {lastRedeemed.value.toLocaleString('vi-VN')}đ cho đơn từ{' '}
                  {lastRedeemed.minOrder.toLocaleString('vi-VN')}đ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(lastRedeemed.code)}
                className="btn-pill px-4 py-2 bg-house text-white text-xs font-bold inline-flex items-center space-x-1.5 shrink-0"
              >
                {copiedCode === lastRedeemed.code ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedCode === lastRedeemed.code ? 'Đã sao chép' : 'Sao chép mã'}</span>
              </button>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REWARD_PACKS.map((pack) => {
              const disabled = points < pack.pointsCost;
              return (
                <div
                  key={pack.pointsCost}
                  className="bg-white rounded-2xl border border-ceramic p-5 shadow-soft flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-light border border-gold/40 text-xs font-extrabold text-house">
                      <Ticket className="w-3.5 h-3.5 text-gold" />
                      <span>{pack.pointsCost} điểm</span>
                    </span>
                    <span className="font-extrabold text-xl text-primary-accent">
                      {pack.value.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink">
                    Voucher giảm <b>{pack.value.toLocaleString('vi-VN')}đ</b> cho đơn từ{' '}
                    {pack.minOrder.toLocaleString('vi-VN')}đ.
                  </p>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => openConfirm(pack)}
                    className="btn-pill mt-4 w-full py-2.5 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-md"
                  >
                    Đổi ngay
                  </button>
                  {disabled && (
                    <p className="mt-2 text-[11px] text-ink-muted text-center">
                      Bạn cần thêm {(pack.pointsCost - points).toLocaleString('vi-VN')} điểm nữa để
                      đổi gói này.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Ví voucher */}
        <section className="mt-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-house tracking-tight flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-gold" />
            <span>Ví Voucher Của Bạn</span>
          </h2>

          {vouchersLoading ? (
            <div className="mt-3 flex items-center justify-center py-10">
              <div className="w-8 h-8 rounded-full border-4 border-primary-accent border-t-transparent animate-spin" />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="mt-3 bg-white rounded-2xl border border-ceramic p-10 text-center shadow-soft">
              <div className="w-16 h-16 rounded-full bg-canvas flex items-center justify-center mx-auto mb-4 text-gold border border-ceramic">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-house">Bạn chưa có voucher nào</h3>
              <p className="mt-1 text-xs text-ink-muted">
                Hãy đổi điểm thưởng ở cửa hàng phía trên để nhận voucher ưu đãi nhé!
              </p>
              <Link
                href="/cart"
                className="btn-pill mt-5 px-6 py-2.5 bg-primary-accent text-white text-xs font-bold shadow-md inline-flex items-center space-x-1.5"
              >
                <span>Tích điểm khi đặt món</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.code}
                  className="bg-white rounded-2xl border border-ceramic p-5 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-extrabold text-sm text-house truncate">
                      {voucher.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(voucher.code)}
                      className="btn-pill px-3 py-1.5 bg-canvas hover:bg-ceramic text-house text-[11px] font-bold border border-ceramic inline-flex items-center space-x-1 shrink-0"
                      aria-label={`Sao chép mã ${voucher.code}`}
                    >
                      {copiedCode === voucher.code ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode === voucher.code ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-primary-accent">
                      Giảm {voucher.value.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-ink-muted">
                      Đơn từ {voucher.minOrder.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-muted">{formatExpiry(voucher.expiresAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Hộp thoại xác nhận đổi thưởng */}
      {confirmPack && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận đổi điểm thưởng"
        >
          <div className="bg-white rounded-2xl shadow-float max-w-sm w-full p-6">
            <h3 className="text-base font-extrabold text-house">Xác nhận đổi thưởng</h3>
            <div className="mt-3 space-y-1.5 text-sm text-ink">
              <p>
                Điểm sẽ trừ: <b>{confirmPack.pointsCost} điểm</b>
              </p>
              <p>
                Số dư còn lại:{' '}
                <b>{(points - confirmPack.pointsCost).toLocaleString('vi-VN')} điểm</b>
              </p>
              <p>
                Bạn sẽ nhận: voucher <b>{confirmPack.value.toLocaleString('vi-VN')}đ</b> (đơn từ{' '}
                {confirmPack.minOrder.toLocaleString('vi-VN')}đ).
              </p>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{REDEEM_WARNING}</span>
            </div>
            {redeemError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{redeemError}</span>
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={redeeming}
                onClick={() => {
                  setConfirmPack(null);
                  setRedeemError(null);
                }}
                className="btn-pill flex-1 py-2.5 bg-canvas hover:bg-ceramic text-house text-sm font-bold border border-ceramic"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={redeeming}
                onClick={handleConfirmRedeem}
                className="btn-pill flex-1 py-2.5 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-md"
              >
                {redeeming ? 'Đang đổi...' : 'Xác nhận đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
