import { Button } from '@/components/ui/Button'

export function CartErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-display text-2xl">We couldn’t load your cart</h1><p className="mt-2 text-sm text-ink-soft">{message}</p><Button className="mt-6" onClick={retry}>Try again</Button></div>
}
