import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCustomerFaqs } from '@/hooks/faq/useCustomerFaqs'
import { useInViewOnce } from '@/hooks/useInViewOnce'

export function FAQSection() {
  const { ref, hasEnteredView } = useInViewOnce<HTMLElement>()
  const { faqs, isLoading, hasLoaded, error, retry } = useCustomerFaqs(hasEnteredView)

  if (hasLoaded && faqs.length === 0) return null

  return (
    <section ref={ref} className="mx-auto min-h-64 max-w-3xl px-4 py-14 md:px-6">
      <h2 className="mb-8 text-center font-display text-3xl">Frequently Asked Questions</h2>
      {isLoading ? (
        <div className="space-y-3" aria-label="Loading frequently asked questions">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-sm text-ink-soft">FAQs could not be loaded.</p>
          <button type="button" onClick={() => void retry()} className="mt-3 text-sm font-medium text-oxblood hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <Accordion.Root type="single" collapsible className="divide-y divide-ink/10">
          {faqs.map(faq => (
            <Accordion.Item key={faq.id} value={faq.id}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left font-medium">
                  {faq.question}
                  <ChevronDown size={16} className="shrink-0 text-ink-soft transition-transform group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden pb-4 text-sm text-ink-soft data-[state=open]:animate-[accordion-down_0.2s_ease-out] data-[state=closed]:animate-[accordion-up_0.2s_ease-out]">
                {faq.answer}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}
    </section>
  )
}
