'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coffee,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  User,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authApi } from '../../services/api';

interface DemoAccount {
  role: string;
  badge: string;
  email: string;
  pass: string;
  icon: React.ComponentType<{ className?: string }>;
  iconStyle: string;
  badgeStyle: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Khách hàng',
    badge: 'Customer',
    email: 'customer@brewlite.vn',
    pass: 'Customer123!',
    icon: User,
    iconStyle: 'bg-emerald-100/80 text-emerald-800',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  },
  {
    role: 'Nhân viên pha chế',
    badge: 'Staff',
    email: 'staff@brewlite.vn',
    pass: 'Staff123!',
    icon: Coffee,
    iconStyle: 'bg-amber-100/80 text-amber-800',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/70',
  },
  {
    role: 'Quản trị viên',
    badge: 'Admin',
    email: 'admin@brewlite.vn',
    pass: 'Admin123!',
    icon: ShieldCheck,
    iconStyle: 'bg-house/10 text-house',
    badgeStyle: 'bg-house/5 text-house border-house/20',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = (loginEmail ?? email).trim();
    const targetPassword = loginPassword ?? password;

    if (!targetEmail || !targetPassword) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await authApi.login({ email: targetEmail, password: targetPassword });
      localStorage.setItem('brewlite_token', data.accessToken);
      localStorage.setItem('brewlite_user_email', data.user.email);
      localStorage.setItem('brewlite_user_role', data.user.role);

      // Ưu tiên quay lại trang đã yêu cầu (?redirect=...), nếu không thì
      // điều hướng theo vai trò: ADMIN -> /admin, STAFF -> /staff, còn lại -> /
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const safeRedirect =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null;

      if (safeRedirect) {
        router.push(safeRedirect);
      } else if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'STAFF') {
        router.push('/staff');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin();
  };

  const fillQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
  };

  const handleQuickAccountClick = (quickEmail: string, quickPass: string) => {
    if (loading) return;
    const isCurrentlySelected =
      email.trim().toLowerCase() === quickEmail.toLowerCase() && password === quickPass;

    if (isCurrentlySelected) {
      // Nếu tài khoản này đã được điền sẵn trong form, bấm thêm 1 lần sẽ tiến hành đăng nhập trực tiếp
      executeLogin(quickEmail, quickPass);
    } else {
      // Lần bấm đầu: Điền nhanh thông tin vào form để người dùng thấy rõ dữ liệu
      fillQuickAccount(quickEmail, quickPass);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5">
          <div className="w-12 h-12 rounded-full bg-primary-accent flex items-center justify-center text-white shadow-md">
            <Coffee className="w-6 h-6" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-house">BrewLite</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-house tracking-tight">Đăng nhập tài khoản</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Hoặc{' '}
          <Link href="/register" className="font-semibold text-primary-accent hover:underline">
            tạo tài khoản mới nếu chưa có
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-ceramic shadow-soft">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  disabled={loading}
                  name="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-house focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill w-full mt-2 py-3 bg-primary-accent hover:bg-primary-hover text-white text-sm font-bold shadow-md flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper — Hiển thị trực tiếp trên giao diện để điền nhanh */}
          <div className="mt-6 pt-6 border-t border-ceramic" role="region" aria-label="Tài khoản demo trải nghiệm">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-house uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Tài khoản demo trải nghiệm
              </span>
              <span className="text-[11px] text-ink-muted">
                Bấm để điền • Bấm tiếp để vào
              </span>
            </div>

            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected =
                  email.trim().toLowerCase() === acc.email.toLowerCase() && password === acc.pass;
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickAccountClick(acc.email, acc.pass)}
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Đã điền tài khoản ${acc.role}. Bấm lần nữa để đăng nhập ngay.`
                        : `Điền nhanh thông tin tài khoản demo ${acc.role}`
                    }
                    title={
                      isSelected
                        ? 'Bấm lần nữa để đăng nhập ngay'
                        : 'Bấm để điền thông tin tài khoản'
                    }
                    className={`group w-full p-2.5 sm:p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-primary-accent bg-primary-light/25 ring-1 ring-primary-accent/40 shadow-sm'
                        : 'border-ceramic bg-canvas/30 hover:bg-canvas/70 hover:border-ceramic/90'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-primary-accent text-white shadow-sm' : acc.iconStyle
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="text-xs font-bold text-house tracking-tight">
                            {acc.role}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${acc.badgeStyle}`}
                          >
                            {acc.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-muted font-mono mt-0.5 flex items-center gap-1.5">
                          <span className="truncate max-w-[140px] sm:max-w-none">{acc.email}</span>
                          <span className="text-ink-muted/40 shrink-0">•</span>
                          <span className="text-ink-muted/70 shrink-0 font-sans text-[10px] sm:text-[11px]">
                            {acc.pass}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-accent bg-white/95 px-2.5 py-1 rounded-full border border-primary-accent/30 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary-accent shrink-0" />
                          <span>Đã điền</span>
                          <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-primary-accent/80 border-l border-primary-accent/30 pl-1.5 ml-0.5">
                            Vào <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium text-ink-muted group-hover:text-primary-accent group-hover:translate-x-0.5 transition-all">
                          Điền <ArrowRight className="w-3 h-3 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
