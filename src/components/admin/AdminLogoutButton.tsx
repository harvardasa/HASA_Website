'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getAdminContentService } from '@/lib/admin/clientService';

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      setLoading(true);
      await getAdminContentService().logout();
      router.replace('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
