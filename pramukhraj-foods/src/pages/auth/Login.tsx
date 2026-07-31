import { Link } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export function Login() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-card border border-ink/10 p-6">
          <h1 className="mb-1 font-display text-2xl">Welcome back</h1>
          <p className="mb-6 text-sm text-ink-soft">Log in to continue shopping.</p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs text-ink-soft"><Mail size={13} /> Email</span>
              <input type="email" required placeholder="you@example.com" className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
            </label>
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs text-ink-soft"><Lock size={13} /> Password</span>
              <input type="password" required placeholder="••••••••" className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
            </label>
            <div className="flex items-center justify-between text-xs">
              <Link to="/forgot-password" className="text-oxblood hover:underline">Forgot password?</Link>
              <Link to="/otp-login" className="text-oxblood hover:underline">Login with OTP</Link>
            </div>
            <Button className="w-full" size="lg" asChild><Link to="/account">Log In</Link></Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
            <div className="h-px flex-1 bg-ink/10" /> or <div className="h-px flex-1 bg-ink/10" />
          </div>
          <Button variant="outline" className="w-full">Continue with Google</Button>
          <p className="mt-6 text-center text-sm text-ink-soft">
            New here? <Link to="/register" className="text-oxblood hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
