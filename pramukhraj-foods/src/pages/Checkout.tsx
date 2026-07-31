import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Smartphone, Landmark, Wallet, Truck, MapPin } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { products } from '@/mock'
import { formatINR, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const steps = ['Address', 'Delivery', 'Payment'] as const
const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark },
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet },
]

export function Checkout() {
  const [step, setStep] = useState(0)
  const [payment, setPayment] = useState('upi')
  const [slot, setSlot] = useState('standard')
  const lines = useCartStore((s) => s.lines)
  const clearCart = useCartStore((s) => s.clearCart)
  const navigate = useNavigate()

  const items = useMemo(
    () => lines.map((l) => ({ product: products.find((p) => p.id === l.productId), quantity: l.quantity }))
      .filter((i): i is { product: (typeof products)[number]; quantity: number } => !!i.product),
    [lines],
  )
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shipping = slot === 'express' ? 79 : subtotal > 499 ? 0 : 49
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + shipping + tax

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl">Nothing to check out</h1>
        <p className="mt-2 text-sm text-ink-soft">Your cart is empty right now.</p>
        <Button className="mt-6" asChild><Link to="/products">Browse Products</Link></Button>
      </div>
    )
  }

  function placeOrder() {
    clearCart()
    navigate('/order-confirmation')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <h1 className="font-display text-3xl">Checkout</h1>

      <div className="mt-4 flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className={cn('flex items-center gap-2 text-xs', i <= step ? 'text-oxblood' : 'text-ink-soft')}>
            <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border', i <= step ? 'border-oxblood bg-oxblood text-ivory' : 'border-ink/20')}>{i + 1}</span>
            {s}
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-ink/15" />}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6 rounded-card border border-ink/10 p-6">
          {step === 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg"><MapPin size={18} /> Delivery Address</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" defaultValue="Aarav Sharma" />
                <Field label="Phone Number" defaultValue="+91 98765 43210" />
                <Field label="Pincode" defaultValue="380001" />
                <Field label="City" defaultValue="Ahmedabad" />
                <Field label="Address Line" defaultValue="B-204, Shreeji Heights, SG Highway" className="sm:col-span-2" />
                <Field label="State" defaultValue="Gujarat" />
                <Field label="Landmark (optional)" />
              </div>
              <Button className="mt-6" onClick={() => setStep(1)}>Continue to Delivery</Button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg"><Truck size={18} /> Delivery Slot</h2>
              <div className="space-y-3">
                {[
                  { id: 'standard', label: 'Standard Delivery', desc: '3-5 business days', price: subtotal > 499 ? 'Free' : '₹49' },
                  { id: 'express', label: 'Express Delivery', desc: '1-2 business days', price: '₹79' },
                ].map((opt) => (
                  <label key={opt.id} className={cn('flex cursor-pointer items-center justify-between rounded-lg border p-4', slot === opt.id ? 'border-oxblood bg-oxblood/5' : 'border-ink/15')}>
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={slot === opt.id} onChange={() => setSlot(opt.id)} className="accent-oxblood" />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-ink-soft">{opt.desc}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm">{opt.price}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={() => setStep(2)}>Continue to Payment</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-4 font-display text-lg">Payment Method</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((m) => (
                  <label key={m.id} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border p-4', payment === m.id ? 'border-oxblood bg-oxblood/5' : 'border-ink/15')}>
                    <input type="radio" checked={payment === m.id} onChange={() => setPayment(m.id)} className="accent-oxblood" />
                    <m.icon size={18} className="text-ink-soft" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={placeOrder}>Place Order — {formatINR(total)}</Button>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-card border border-ink/10 bg-ivory-dim p-5">
          <h2 className="font-display text-lg">Order Summary</h2>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3">
                <img src={product.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm">{product.name}</p>
                  <p className="text-xs text-ink-soft">Qty {quantity}</p>
                </div>
                <span className="font-mono text-sm">{formatINR(product.price * quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span className="font-mono text-ink">{formatINR(subtotal)}</span></div>
            <div className="flex justify-between text-ink-soft"><span>Shipping</span><span className="font-mono text-ink">{shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
            <div className="flex justify-between text-ink-soft"><span>Tax</span><span className="font-mono text-ink">{formatINR(tax)}</span></div>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-3 font-semibold">
            <span>Total</span><span className="font-mono text-lg text-oxblood">{formatINR(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, defaultValue, className }: { label: string; defaultValue?: string; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      <input defaultValue={defaultValue} className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
    </label>
  )
}
