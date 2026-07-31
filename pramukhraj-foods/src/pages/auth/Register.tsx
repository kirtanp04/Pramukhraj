import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export function Register() {
  const Field = ({ label, type = 'text' }: { label: string; type?: string }) => (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      <input type={type} required className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
    </label>
  )
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-card border border-ink/10 p-6">
          <h1 className="mb-1 font-display text-2xl">Create your account</h1>
          <p className="mb-6 text-sm text-ink-soft">Join PramukhRaj Foods in seconds.</p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field label="Full Name" />
            <Field label="Email" type="email" />
            <Field label="Phone Number" type="tel" />
            <Field label="Password" type="password" />
            <Button className="w-full" size="lg" asChild><Link to="/verify-email">Create Account</Link></Button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-soft">
            Already have an account? <Link to="/login" className="text-oxblood hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
