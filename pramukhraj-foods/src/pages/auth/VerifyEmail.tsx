import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
export function VerifyEmail() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12 text-center">
      <MailCheck size={48} className="text-oxblood" />
      <h1 className="mt-4 font-display text-2xl">Check your inbox</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">We've sent a verification link to your email. Click it to activate your account.</p>
      <Button className="mt-6" asChild><Link to="/login">Back to Login</Link></Button>
    </div>
  )
}
