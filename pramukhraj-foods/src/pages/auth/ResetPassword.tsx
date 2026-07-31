import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
export function ResetPassword() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-card border border-ink/10 p-6">
          <h1 className="mb-1 font-display text-2xl">Set new password</h1>
          <p className="mb-6 text-sm text-ink-soft">Choose a strong password for your account.</p>
          <div className="space-y-4">
            <input type="password" placeholder="New password" className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
            <input type="password" placeholder="Confirm password" className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
          </div>
          <Button className="mt-5 w-full" asChild><Link to="/login">Update Password</Link></Button>
        </div>
      </div>
    </div>
  )
}
