import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export function OtpLogin() {
  const [sent, setSent] = useState(false)
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-card border border-ink/10 p-6 text-center">
          <h1 className="mb-1 font-display text-2xl">Login with OTP</h1>
          <p className="mb-6 text-sm text-ink-soft">{sent ? 'Enter the 6-digit code sent to your phone.' : 'We will send a one-time code to your phone.'}</p>
          {!sent ? (
            <>
              <input placeholder="+91 98765 43210" className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-center text-sm outline-none focus:border-oxblood/50" />
              <Button className="mt-4 w-full" onClick={() => setSent(true)}>Send OTP</Button>
            </>
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input key={i} maxLength={1} className="h-12 w-10 rounded-lg border border-ink/15 bg-ivory text-center text-lg outline-none focus:border-oxblood/50" />
                ))}
              </div>
              <Button className="mt-5 w-full" asChild><Link to="/account">Verify & Continue</Link></Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
