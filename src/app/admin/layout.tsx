// Admin chrome — the protected pages render `AdminShell` (header + nav).
// Login/reset/setup pages render bare children since they have their own UI.

import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-gray-50 text-gray-900">{children}</div>
}
