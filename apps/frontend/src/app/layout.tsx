import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import ClientNavbar from '../components/ClientNavbar';

export const metadata: Metadata = {
  title: 'BrewLite — Đặt Cà Phê Không Tiền Mặt',
  description: 'Hệ thống đặt đồ uống không tiền mặt phong cách Starbucks hiện đại',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-canvas text-ink antialiased flex flex-col">
        <Providers>
          <ClientNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
