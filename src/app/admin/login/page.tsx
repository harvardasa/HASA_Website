'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminLoginSchema } from '@/lib/validations'
import type { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

type FormData = z.infer<typeof adminLoginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const initialError =
    errorParam === 'not_authorized'
      ? 'This email is not authorized for admin access. Contact the HASA board if you think this is wrong.'
      : null

  const [error, setError] = useState<string | null>(initialError)
  const [status, setStatus] = useState<'idle' | 'checking' | 'signing-in'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(adminLoginSchema) })

  const onSubmit = async ({ email, password }: FormData) => {
    setError(null)
    setStatus('checking')

    // 1. Check email is on the allowlist BEFORE attempting password auth.
    //    This prevents Supabase from leaking whether the email exists.
    const checkRes = await fetch('/api/admin/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const { allowed } = await checkRes.json()

    if (!allowed) {
      setStatus('idle')
      setError(
        'This email is not authorized for admin access. Contact the HASA board if you think this is wrong.'
      )
      return
    }

    // 2. Email is allowed — attempt password sign-in
    setStatus('signing-in')
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setStatus('idle')
      setError('Incorrect email or password.')
      return
    }

    // Success — go to dashboard. The shell will auto-promote role to admin.
    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">HASA Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage the website</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={status !== 'idle'}
                {...register('email')}
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm shadow-sm disabled:bg-gray-50"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={status !== 'idle'}
                {...register('password')}
                className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm shadow-sm disabled:bg-gray-50"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status !== 'idle'}
              className="w-full h-10 rounded-md bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-60"
            >
              {status === 'checking'
                ? 'Checking…'
                : status === 'signing-in'
                  ? 'Signing in…'
                  : 'Sign in'}
            </button>

            <div className="text-center text-sm text-gray-500">
              <Link href="/admin/forgot-password" className="underline hover:text-gray-900">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
