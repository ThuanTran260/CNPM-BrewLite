/**
 * BrewLite Tab-Isolated Multi-Session Storage
 * 
 * Kiến trúc phiên đa tài khoản cô lập theo Tab (Tab-Isolated Multi-Session):
 * 1. Tầng ưu tiên 1 (Per-Tab SessionStorage): Mỗi tab trình duyệt sở hữu vùng nhớ riêng biệt.
 *    Khi người dùng đăng nhập tài khoản nào trên Tab nào, tab đó sẽ giữ nguyên tài khoản đó.
 *    Thao tác F5 (Refresh) được W3C đảm bảo giữ nguyên 100% dữ liệu trong sessionStorage của tab đó.
 * 2. Tầng ưu tiên 2 (Role-Scoped LocalStorage Fallback): Lưu trữ bền vững theo vai trò
 *    (brewlite_customer_*, brewlite_staff_*, brewlite_admin_*). Khi mở một tab mới hoàn toàn,
 *    tab mới sẽ tự động nhận diện vai trò phù hợp theo URL để khôi phục phiên làm việc.
 */

export type AuthScope = 'auto' | 'customer' | 'staff' | 'admin';

export interface AuthSessionUser {
  email: string;
  role: string;
}

export function resolveScope(
  scope: AuthScope = 'auto',
  pathname?: string
): 'customer' | 'staff' | 'admin' {
  if (scope !== 'auto') {
    return scope;
  }

  if (typeof window !== 'undefined') {
    const currentPath = pathname ?? window.location.pathname;
    if (currentPath.startsWith('/staff')) {
      return 'staff';
    }
    if (currentPath.startsWith('/admin')) {
      return 'admin';
    }
  }

  return 'customer';
}

function getTabSession(): { token: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem('brewlite_session_token');
  const email = sessionStorage.getItem('brewlite_session_email');
  const role = sessionStorage.getItem('brewlite_session_role');

  if (token && email && role) {
    return { token, email, role };
  }
  return null;
}

export function getAuthToken(scope: AuthScope = 'auto'): string | null {
  if (typeof window === 'undefined') return null;

  const tabSession = getTabSession();
  const resolved = resolveScope(scope);

  // 1. Nếu tab hiện tại đã có phiên đăng nhập trong sessionStorage
  if (tabSession) {
    if (resolved === 'staff') {
      if (tabSession.role === 'STAFF' || tabSession.role === 'ADMIN') {
        return tabSession.token;
      }
    } else if (resolved === 'admin') {
      if (tabSession.role === 'ADMIN') {
        return tabSession.token;
      }
    } else {
      // Scope 'auto' hoặc 'customer': ưu tiên dùng chính token của tab này
      return tabSession.token;
    }
  }

  // 2. Fallback cho tab mới mở (chưa có sessionStorage): lấy từ localStorage theo vai trò
  if (resolved === 'staff') {
    const staffToken = localStorage.getItem('brewlite_staff_token');
    if (staffToken) {
      sessionStorage.setItem('brewlite_session_token', staffToken);
      sessionStorage.setItem('brewlite_session_email', localStorage.getItem('brewlite_staff_email') || '');
      sessionStorage.setItem('brewlite_session_role', 'STAFF');
      return staffToken;
    }
    if (localStorage.getItem('brewlite_user_role') === 'STAFF') {
      return localStorage.getItem('brewlite_token');
    }
    return null;
  }

  if (resolved === 'admin') {
    const adminToken = localStorage.getItem('brewlite_admin_token');
    if (adminToken) {
      sessionStorage.setItem('brewlite_session_token', adminToken);
      sessionStorage.setItem('brewlite_session_email', localStorage.getItem('brewlite_admin_email') || '');
      sessionStorage.setItem('brewlite_session_role', 'ADMIN');
      return adminToken;
    }
    if (localStorage.getItem('brewlite_user_role') === 'ADMIN') {
      return localStorage.getItem('brewlite_token');
    }
    return null;
  }

  // Customer fallback
  const custToken =
    localStorage.getItem('brewlite_customer_token') ||
    localStorage.getItem('brewlite_token');

  if (custToken) {
    sessionStorage.setItem('brewlite_session_token', custToken);
    sessionStorage.setItem(
      'brewlite_session_email',
      localStorage.getItem('brewlite_customer_email') ||
      localStorage.getItem('brewlite_user_email') ||
      ''
    );
    sessionStorage.setItem(
      'brewlite_session_role',
      localStorage.getItem('brewlite_customer_role') ||
      localStorage.getItem('brewlite_user_role') ||
      'CUSTOMER'
    );
    return custToken;
  }

  return null;
}

export function getUserEmail(scope: AuthScope = 'auto'): string | null {
  if (typeof window === 'undefined') return null;

  const tabSession = getTabSession();
  if (tabSession) {
    return tabSession.email;
  }

  // Trigger fallback khởi tạo nếu chưa có
  const token = getAuthToken(scope);
  if (token) {
    const refreshed = getTabSession();
    if (refreshed) return refreshed.email;
  }

  const resolved = resolveScope(scope);
  if (resolved === 'staff') {
    return localStorage.getItem('brewlite_staff_email');
  }
  if (resolved === 'admin') {
    return localStorage.getItem('brewlite_admin_email');
  }
  return (
    localStorage.getItem('brewlite_customer_email') ||
    localStorage.getItem('brewlite_user_email')
  );
}

export function getUserRole(scope: AuthScope = 'auto'): string | null {
  if (typeof window === 'undefined') return null;

  const tabSession = getTabSession();
  if (tabSession) {
    return tabSession.role;
  }

  const token = getAuthToken(scope);
  if (token) {
    const refreshed = getTabSession();
    if (refreshed) return refreshed.role;
  }

  const resolved = resolveScope(scope);
  if (resolved === 'staff') {
    return localStorage.getItem('brewlite_staff_role');
  }
  if (resolved === 'admin') {
    return localStorage.getItem('brewlite_admin_role');
  }
  return (
    localStorage.getItem('brewlite_customer_role') ||
    localStorage.getItem('brewlite_user_role')
  );
}

export function saveAuthSession(
  user: { email: string; role: string },
  token: string
): void {
  if (typeof window === 'undefined') return;

  const roleUpper = (user.role || '').toUpperCase();

  // 1. Khóa phiên làm việc lập tức vào sessionStorage của tab này
  sessionStorage.setItem('brewlite_session_token', token);
  sessionStorage.setItem('brewlite_session_email', user.email);
  sessionStorage.setItem('brewlite_session_role', roleUpper);

  // 2. Lưu vào localStorage tương ứng theo vai trò để các tab mới mở có thể dùng
  if (roleUpper === 'STAFF') {
    localStorage.setItem('brewlite_staff_token', token);
    localStorage.setItem('brewlite_staff_email', user.email);
    localStorage.setItem('brewlite_staff_role', 'STAFF');
  } else if (roleUpper === 'ADMIN') {
    localStorage.setItem('brewlite_admin_token', token);
    localStorage.setItem('brewlite_admin_email', user.email);
    localStorage.setItem('brewlite_admin_role', 'ADMIN');
  } else {
    // CUSTOMER
    localStorage.setItem('brewlite_customer_token', token);
    localStorage.setItem('brewlite_customer_email', user.email);
    localStorage.setItem('brewlite_customer_role', 'CUSTOMER');

    // Đồng bộ legacy keys cho các request cũ nếu cần
    localStorage.setItem('brewlite_token', token);
    localStorage.setItem('brewlite_user_email', user.email);
    localStorage.setItem('brewlite_user_role', 'CUSTOMER');
  }
}

export function clearAuthSession(
  scope: 'auto' | 'customer' | 'staff' | 'admin' | 'all' = 'auto'
): void {
  if (typeof window === 'undefined') return;

  // 1. Luôn xóa phiên của tab hiện tại trong sessionStorage
  sessionStorage.removeItem('brewlite_session_token');
  sessionStorage.removeItem('brewlite_session_email');
  sessionStorage.removeItem('brewlite_session_role');

  if (scope === 'all') {
    const keys = [
      'brewlite_customer_token',
      'brewlite_customer_email',
      'brewlite_customer_role',
      'brewlite_staff_token',
      'brewlite_staff_email',
      'brewlite_staff_role',
      'brewlite_admin_token',
      'brewlite_admin_email',
      'brewlite_admin_role',
      'brewlite_token',
      'brewlite_user_email',
      'brewlite_user_role',
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    return;
  }

  const resolved = resolveScope(scope);

  if (resolved === 'staff') {
    localStorage.removeItem('brewlite_staff_token');
    localStorage.removeItem('brewlite_staff_email');
    localStorage.removeItem('brewlite_staff_role');
  } else if (resolved === 'admin') {
    localStorage.removeItem('brewlite_admin_token');
    localStorage.removeItem('brewlite_admin_email');
    localStorage.removeItem('brewlite_admin_role');
  } else if (resolved === 'customer') {
    localStorage.removeItem('brewlite_customer_token');
    localStorage.removeItem('brewlite_customer_email');
    localStorage.removeItem('brewlite_customer_role');
    localStorage.removeItem('brewlite_token');
    localStorage.removeItem('brewlite_user_email');
    localStorage.removeItem('brewlite_user_role');
  }
}
