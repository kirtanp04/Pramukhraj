import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
export function ForgotPassword() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-card border border-ink/10 p-6 text-center">
          <h1 className="mb-1 font-display text-2xl">Reset password</h1>
          <p className="mb-6 text-sm text-ink-soft">Enter your email and we'll send a reset link.</p>
          <input type="email" placeholder="you@example.com" className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
          <Button className="mt-4 w-full" asChild><Link to="/reset-password">Send Reset Link</Link></Button>
          <p className="mt-6 text-sm text-ink-soft"><Link to="/login" className="text-oxblood hover:underline">Back to login</Link></p>
        </div>
      </div>
    </div>
  )
}
