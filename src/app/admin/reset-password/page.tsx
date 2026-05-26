'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminResetPasswordSchema } from '@/lib/validations'
import type { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/admin-auth'

type FormData = z.infer<typeof adminResetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(adminResetPasswordSchema) })

  // Verify the user has a session (Supabase auto-signs them in via the reset link)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setError(
          'No active reset session. The link may have expired or already been used. Request a new one.'
        )
      } else if (!isAdminEmail(user.email)) {
        // Server-side guard re-checks too, but this gives a clear UX message
        setError('This account is not authorized for admin access.')
      }
      setCheckingSession(false)
    })
  }, [])

  const onSubmit = async ({ password }: FormData) => {
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }
    setSuccess(true)
    // Give the user a beat to read the success message, then send them to /admin
    setTimeout(() => {
      router.replace('/admin')
      router.refresh()
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">HASA Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Set a new password</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {checkingSession ? (
            <p className="text-sm text-gray-500">Verifying reset link…</p>
          ) : success ? (
            <p className="text-sm text-emerald-700">
              Password updated. Redirecting to the admin dashboard…
            </p>
          ) : error ? (
            <div className="space-y-3">
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
              <Link href="/admin/forgot-password" className="text-sm text-gray-700 underline">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  disabled={submitting}
                  {...register('password')}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm shadow-sm disabled:bg-gray-50"
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  disabled={submitting}
                  {...register('confirm')}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm shadow-sm disabled:bg-gray-50"
                />
                {errors.confirm && (
                  <p className="text-sm text-red-600">{errors.confirm.message}</p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Must be 14+ characters with an uppercase letter, a lowercase letter, a number,
                and a symbol.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-md bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-60"
              >
                {submitting ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
