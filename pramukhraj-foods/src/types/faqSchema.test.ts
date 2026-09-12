import { describe, expect, it } from 'vitest'
import { FAQ_CATEGORY } from '@/types/faq'
import { DEFAULT_FAQ_VALUES, faqSchema } from '@/types/faqSchema'

describe('faqSchema', () => {
  it('accepts a valid FAQ', () => {
    expect(faqSchema.safeParse({
      ...DEFAULT_FAQ_VALUES,
      category: FAQ_CATEGORY.Shipping,
      question: 'How long does delivery take?',
      answer: 'Most orders arrive within three to five business days.',
    }).success).toBe(true)
  })

  it.each(['', '   '])('rejects a blank question', question => {
    expect(faqSchema.safeParse({ ...DEFAULT_FAQ_VALUES, question, answer: 'Answer' }).success).toBe(false)
  })

  it('rejects a blank answer', () => {
    expect(faqSchema.safeParse({ ...DEFAULT_FAQ_VALUES, question: 'Question', answer: '  ' }).success).toBe(false)
  })

  it('rejects an invalid category and negative display order', () => {
    expect(faqSchema.safeParse({
      ...DEFAULT_FAQ_VALUES,
      category: 999,
      question: 'Question',
      answer: 'Answer',
      displayOrder: -1,
    }).success).toBe(false)
  })
})
