import { Wallet, Star } from 'lucide-react'
export function AccountWallet() {
  return (
    <div>
      <h2 className="mb-4 font-display text-xl">Wallet & Rewards</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card bg-gradient-to-br from-teal to-teal-deep p-5 text-ivory">
          <Wallet size={20} />
          <p className="mt-3 font-display text-3xl">₹250.00</p>
          <p className="text-sm text-ivory/70">Wallet Balance</p>
        </div>
        <div className="rounded-card bg-gradient-to-br from-turmeric to-turmeric-deep p-5 text-teal-deep">
          <Star size={20} />
          <p className="mt-3 font-display text-3xl">1,240</p>
          <p className="text-sm text-teal-deep/70">Reward Points</p>
        </div>
      </div>
    </div>
  )
}
