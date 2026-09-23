'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../../services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Khối tài khoản mẫu: hiện ở dev, hoặc ở prod khi mở /login?demo=1 (chỉ để
  // test nhanh; nút này chỉ điền sẵn form dùng chung luồng handleSubmit).
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      new URLSearchParams(window.location.search).get('demo') === '1'
    ) {
      setShowDemo(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.login({ email: email.trim(), password });
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

  const fillQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
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
                  name="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
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
                  type="password"
                  required
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                />
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

          {/* Quick Demo Accounts Helper — chỉ hiện ở dev, hoặc prod khi có ?demo=1.
              Chỉ điền sẵn vào form, KHÔNG tự submit; dùng chung luồng
              handleSubmit hiện có. */}
          {showDemo && (
            <div className="mt-6 pt-6 border-t border-ceramic">
              <span className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-2.5 text-center">
                Tài khoản mẫu để test nhanh:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('customer@brewlite.vn', 'Customer123!')}
                  className="btn-pill py-2 px-2.5 bg-canvas hover:bg-ceramic text-[11px] font-medium text-house border border-ceramic text-center"
                >
                  Khách hàng mẫu
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('staff@brewlite.vn', 'Staff123!')}
                  className="btn-pill py-2 px-2.5 bg-gold/10 hover:bg-gold/20 text-[11px] font-bold text-house border border-gold/40 text-center"
                >
                  Barista (Staff)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin@brewlite.vn', 'Admin123!')}
                  className="btn-pill col-span-2 py-2 px-2.5 bg-house/5 hover:bg-house/10 text-[11px] font-bold text-house border border-house/20 text-center"
                >
                  Quản trị viên (Admin)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
