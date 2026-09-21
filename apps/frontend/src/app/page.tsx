import Link from 'next/link';
import { Coffee, ShoppingBag, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-house text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-accent flex items-center justify-center shadow-inner">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">BrewLite</span>
          </div>

          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="text-white hover:text-primary-light transition-colors">
              Thực đơn
            </Link>
            <Link href="/orders/history" className="text-white/80 hover:text-white transition-colors">
              Đơn hàng
            </Link>
            <Link href="/staff" className="text-gold hover:text-white transition-colors font-semibold">
              Quầy Barista
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center space-x-2 bg-gold-light text-house px-4 py-1.5 rounded-pill text-xs font-semibold uppercase tracking-wider mb-6 border border-gold/30">
          <span>✨ Phiên bản VER 1.0 — Đặt Cà Phê Không Tiền Mặt</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-house tracking-tight max-w-3xl leading-tight">
          Cà phê thơm ngon, <br />
          <span className="text-primary-accent">chạm nhẹ là có ngay.</span>
        </h1>

        <p className="mt-6 text-lg text-ink-muted max-w-2xl">
          Đặt đồ uống, chọn size, thêm topping và thanh toán không tiền mặt chỉ trong vài giây. Không còn phải xếp hàng chờ đợi tại quầy.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/"
            className="btn-pill px-8 py-3.5 bg-primary-accent text-white hover:bg-primary-hover shadow-lg flex items-center space-x-2 text-base"
          >
            <span>Khám phá thực đơn</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/staff"
            className="btn-pill px-8 py-3.5 bg-white text-house hover:bg-ceramic border border-ceramic shadow-sm text-base"
          >
            <span>Vào quầy Barista KDS</span>
          </Link>
        </div>

        {/* Status Check Badge */}
        <div className="mt-16 p-4 rounded-2xl bg-white border border-ceramic shadow-soft max-w-md w-full text-left">
          <div className="flex items-center justify-between pb-3 border-b border-ceramic">
            <span className="text-xs font-semibold text-ink-muted uppercase">Trạng thái hệ thống</span>
            <span className="flex items-center text-xs font-bold text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping mr-2"></span>
              Sẵn sàng kết nối
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-ink-muted">
            <p>• Frontend: <code className="text-house font-mono font-semibold">http://localhost:3000</code></p>
            <p>• Backend API: <code className="text-house font-mono font-semibold">http://localhost:3001/api</code></p>
            <p>• Database: <code className="text-house font-mono font-semibold">PostgreSQL (Prisma ORM)</code></p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-house text-white/70 text-xs py-6 text-center border-t border-white/10">
        <p>© 2026 BrewLite. Bài tập lớn môn Công nghệ Phần mềm — SGU.</p>
      </footer>
    </div>
  );
}
