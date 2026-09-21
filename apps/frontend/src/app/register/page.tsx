'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../../services/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.register({ email, password });
      localStorage.setItem('brewlite_token', data.accessToken);
      localStorage.setItem('brewlite_user_email', data.user.email);
      localStorage.setItem('brewlite_user_role', data.user.role);
      router.push('/');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.',
      );
    } finally {
      setLoading(false);
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
        <h2 className="mt-4 text-2xl font-bold text-house tracking-tight">Tạo tài khoản mới</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-semibold text-primary-accent hover:underline">
            Đăng nhập tại đây
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                Mật khẩu (Tối thiểu 6 ký tự)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-canvas/40 border border-ceramic rounded-xl text-sm text-ink placeholder-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-house uppercase tracking-wider mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Đang đăng ký...</span>
              ) : (
                <>
                  <span>Tạo tài khoản</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
