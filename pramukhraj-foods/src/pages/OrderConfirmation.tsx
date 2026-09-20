import { Link, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Package, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function OrderConfirmation() {
  const state = useLocation().state as { orderNumber?: string; storeName?: string; orderId?: string } | null
  if (!state?.orderNumber) return <Navigate to="/account/orders" replace />

  const trackingLink = state.orderId ? `/account/orders/${state.orderId}` : "/account/orders"

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <CheckCircle2 size={64} className="text-green-600" />
      </motion.div>
      <h1 className="mt-6 font-display text-3xl!">Order placed successfully!</h1>
      <p className="mt-2 text-sm! text-ink-soft">
        Thank you for shopping with {state.storeName || 'our store'}. Your order <span className="font-mono text-ink">#{state.orderNumber}</span> has been confirmed.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-full bg-ivory-dim px-4 py-2 text-sm! text-ink-soft">
        <Package size={16} /> Tracking details and milestone updates will appear under your account.
      </div>
      <div className="mt-8 flex gap-3">
        <Button asChild><Link to={trackingLink}>View & Track Order</Link></Button>
        <Button variant="outline" asChild><Link to="/"><Home size={15} /> Back to Home</Link></Button>
      </div>
    </div>
  )
}
