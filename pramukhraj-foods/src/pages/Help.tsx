import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, MessageCircle, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const faqs = [
  { q: 'How do I track my order?', a: 'Go to Track Order in the footer or your account, and enter your order ID.' },
  { q: 'What is your return policy?', a: 'Unopened, unused packs can be returned within 7 days of delivery for a full refund.' },
  { q: 'Do you offer international shipping?', a: 'Currently we ship only within India, to over 20,000 pin codes.' },
  { q: 'How can I cancel an order?', a: 'Orders can be cancelled from My Account > Orders before they are shipped.' },
]

export function Help() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="text-center font-display text-3xl">Help Center</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">We're here to help with orders, returns, and everything in between.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-ink/10 p-5 text-center">
          <MessageCircle size={22} className="mx-auto text-oxblood" />
          <p className="mt-2 text-sm font-medium">Live Chat</p>
          <p className="text-xs text-ink-soft">Avg. response 2 mins</p>
          <Button size="sm" variant="outline" className="mt-3">Start Chat</Button>
        </div>
        <div className="rounded-card border border-ink/10 p-5 text-center">
          <Mail size={22} className="mx-auto text-oxblood" />
          <p className="mt-2 text-sm font-medium">Email Us</p>
          <p className="text-xs text-ink-soft">support@pramukhraj.example</p>
        </div>
        <div className="rounded-card border border-ink/10 p-5 text-center">
          <Phone size={22} className="mx-auto text-oxblood" />
          <p className="mt-2 text-sm font-medium">Call Us</p>
          <p className="text-xs text-ink-soft">+91 79 4000 1234</p>
        </div>
      </div>

      <h2 className="mt-12 mb-4 font-display text-xl">Frequently Asked Questions</h2>
      <Accordion.Root type="single" collapsible className="divide-y divide-ink/10">
        {faqs.map((f, i) => (
          <Accordion.Item key={i} value={`item-${i}`}>
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left text-sm font-medium">
                {f.q}
                <ChevronDown size={15} className="shrink-0 text-ink-soft transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="pb-4 text-sm text-ink-soft">{f.a}</Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  )
}
