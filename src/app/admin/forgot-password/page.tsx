'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async ({ email }: LoginFormData) => {
    setSubmitting(true)

    // Check allowlist first — silently no-op if not allowlisted, to prevent
    // email enumeration. The user always sees the same success message.
    const checkRes = await fetch('/api/admin/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const { allowed } = await checkRes.json()

    if (allowed) {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">HASA Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Reset your password</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {submitted ? (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900">Check your inbox</h2>
              <p className="text-sm text-gray-600">
                If that email is authorized for admin access, we&apos;ve sent a password
                reset link. The link expires in 1 hour.
              </p>
              <Link href="/admin/login" className="text-sm text-gray-700 underline">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={submitting}
                  {...register('email')}
                  className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm shadow-sm disabled:bg-gray-50"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-md bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>

              <div className="text-center text-sm text-gray-500">
                <Link href="/admin/login" className="underline hover:text-gray-900">
                  ← Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
