'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminContentService } from '@/lib/admin/clientService';

const DEV_FALLBACK_ADMIN_KEY = 'hasa-admin';

export default function AdminLoginPage() {
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!adminKey.trim()) {
      setError('Admin key is required.');
      return;
    }

    try {
      setLoading(true);
      await getAdminContentService().login(adminKey.trim());
      const nextPath =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next') || '/admin/events'
          : '/admin/events';
      router.replace(nextPath);
      router.refresh();
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to sign in.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Sign In</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your admin key to access content management tools.
        </p>
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Local development shortcut: if no ADMIN_DASHBOARD_KEY is configured, use
          {' '}
          {DEV_FALLBACK_ADMIN_KEY}
          .
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700" htmlFor="admin-key">
            Admin key
          </label>
          <input
            id="admin-key"
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            autoComplete="current-password"
            placeholder="Enter admin key"
          />
          <button
            type="button"
            onClick={() => setAdminKey(DEV_FALLBACK_ADMIN_KEY)}
            className="inline-flex rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Use local default key
          </button>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
