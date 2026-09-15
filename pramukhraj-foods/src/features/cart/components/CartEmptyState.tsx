import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function CartEmptyState() {
  return <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center"><ShoppingBag className="text-oxblood" size={48}/><h1 className="mt-5 font-display text-2xl">Your cart is empty</h1><p className="mt-2 text-sm text-ink-soft">Add a few favourites and they’ll appear here.</p><Button className="mt-6" asChild><Link to="/products">Browse Products</Link></Button></div>
}
