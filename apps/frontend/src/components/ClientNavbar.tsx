'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ClientNavbar() {
  const pathname = usePathname();

  // Không hiển thị Navbar khách hàng ở trang Barista KDS hoặc các trang xác thực chuyên biệt
  if (
    pathname?.startsWith('/staff') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return null;
  }

  return <Navbar />;
}
