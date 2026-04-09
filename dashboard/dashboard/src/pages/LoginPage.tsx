import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { isSafeRedirect } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const storeLogin = useAuthStore(s => s.login)
  const timedOut = params.get('reason') === 'timeout'
  const [error, setError] = useState<string | null>(null)
  const [failCount, setFailCount] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    if (lockedUntil && Date.now() < lockedUntil) {
      setError('Too many failed attempts. Please wait 30 seconds before trying again.')
      return
    }
    setError(null)
    try {
      const result = await login(data)
      storeLogin(result.tokens, result.user)
      setFailCount(0)
      navigate(isSafeRedirect(params.get('next')), { replace: true })
    } catch {
      const next = failCount + 1
      setFailCount(next)
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        setFailCount(0)
        setError('Too many failed attempts. Please wait 30 seconds before trying again.')
      } else {
        setError('Invalid email or password. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950/40 via-background to-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <img src="/kakebe-shop.png" alt="Kakebe Shop" className="h-14 w-14 rounded-2xl object-cover shadow-lg" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Kakebe Shop Admin</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Sign in to your dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {timedOut && !error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Session expired due to inactivity. Please sign in again.
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="admin@kakebe.ug" autoComplete="email" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              loading={isSubmitting}
              disabled={!!(lockedUntil && Date.now() < lockedUntil)}
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Kakebe Shop · Admin Dashboard
        </p>
      </div>
    </div>
  )
}
