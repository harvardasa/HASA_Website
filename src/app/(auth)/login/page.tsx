'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { isHarvardEmail } from '@/lib/email-domains'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorParam === 'auth-failed' ? 'Authentication failed. Please try again.' : null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async ({ email }: LoginFormData) => {
    if (!isHarvardEmail(email)) {
      setErrorMsg(
        "We didn't recognize this as a Harvard email. The directory is for current Harvard affiliates and alumni. If you think this is wrong, contact directory@hasa-harvard.org."
      )
      return
    }

    setStatus('loading')
    setErrorMsg(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('success')
    }
  }

  if (status === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent a magic link to your Harvard email. Click it to sign in — it expires in 1 hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Didn&apos;t get it? Check your spam folder, or{' '}
            <button
              className="text-green-700 underline"
              onClick={() => setStatus('idle')}
            >
              try again
            </button>
            .
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to HASA Directory</CardTitle>
        <CardDescription>
          Enter your Harvard email and we&apos;ll send you a magic link — no password needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Harvard email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@college.harvard.edu"
              {...register('email')}
              disabled={status === 'loading'}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {errorMsg && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending…' : 'Send magic link'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Who is this for? Current Harvard undergrads, grad students, alumni, and faculty or staff
          with African heritage or close ties to the African continent.
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
