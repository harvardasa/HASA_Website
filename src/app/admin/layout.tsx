import { ReactNode } from 'react';
import AdminShellNav from '@/components/admin/AdminShellNav';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold">HASA Admin Dashboard</h1>
            <p className="text-sm text-gray-600">
              Manage events, gallery media, and editable website copy.
            </p>
          </div>
          <AdminLogoutButton />
        </header>
        <AdminShellNav />
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          {children}
        </section>
      </div>
    </div>
  );
}
