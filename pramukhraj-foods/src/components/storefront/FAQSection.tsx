import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  { q: 'How fresh are the snacks and papads?', a: 'Everything is made in small batches within 7 days of your order and shipped in sealed, moisture-proof packaging.' },
  { q: 'Do you ship pan-India?', a: 'Yes, we deliver to over 20,000 pin codes across India, with cold-chain options for select sweets.' },
  { q: 'Can I return opened packets?', a: 'For food safety, we only accept returns on unopened, unused packs within 7 days of delivery.' },
  { q: 'Are your products preservative-free?', a: 'Most of our snacks and pickles use traditional preservation methods (oil, salt, sun-drying) instead of chemical preservatives — check each product page for details.' },
]

export function FAQSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <h2 className="mb-8 text-center font-display text-3xl">Frequently Asked Questions</h2>
      <Accordion.Root type="single" collapsible className="divide-y divide-ink/10">
        {faqs.map((f, i) => (
          <Accordion.Item key={i} value={`item-${i}`}>
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left font-medium">
                {f.q}
                <ChevronDown size={16} className="shrink-0 text-ink-soft transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="overflow-hidden pb-4 text-sm text-ink-soft data-[state=open]:animate-[accordion-down_0.2s_ease-out] data-[state=closed]:animate-[accordion-up_0.2s_ease-out]">
              {f.a}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  )
}
