import { describe, expect, it } from 'vitest'
import { DEFAULT_HOMEPAGE_CMS_VALUES, homepageCmsSchema } from '@/types/homepageCmsSchema'

describe('homepageCmsSchema', () => {
  it('accepts the database-aligned defaults without a custom image', () => {
    expect(homepageCmsSchema.safeParse(DEFAULT_HOMEPAGE_CMS_VALUES).success).toBe(true)
  })

  it.each(['eyebrowBadge', 'headline', 'subtext', 'heroImageAltText'] as const)(
    'requires %s',
    field => {
      const result = homepageCmsSchema.safeParse({ ...DEFAULT_HOMEPAGE_CMS_VALUES, [field]: '   ' })
      expect(result.success).toBe(false)
    },
  )

  it('rejects unsupported image data URIs', () => {
    const result = homepageCmsSchema.safeParse({
      ...DEFAULT_HOMEPAGE_CMS_VALUES,
      heroImageBase64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yw=',
    })
    expect(result.success).toBe(false)
  })

  it('accepts supported base64 image data', () => {
    const result = homepageCmsSchema.safeParse({
      ...DEFAULT_HOMEPAGE_CMS_VALUES,
      heroImageBase64: 'data:image/png;base64,iVBORw0KGgo=',
    })
    expect(result.success).toBe(true)
  })

  it.each(['happyCustomersLabel', 'productCountLabel', 'averageRatingLabel'] as const)(
    'limits %s to 60 characters',
    field => {
      const result = homepageCmsSchema.safeParse({
        ...DEFAULT_HOMEPAGE_CMS_VALUES,
        [field]: 'x'.repeat(61),
      })
      expect(result.success).toBe(false)
    },
  )
})
