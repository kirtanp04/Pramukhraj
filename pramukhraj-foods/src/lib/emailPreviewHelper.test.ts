import { describe, expect, it } from 'vitest'
import { renderEmailSubjectPreview, renderEmailTemplatePreview } from './emailPreviewHelper'
import type { StoreSettings } from '@/features/admin-settings/types'

const mockStoreSettings: StoreSettings = {
  storeName: 'Pramukhraj Special Sweets',
  storeAddress: '123 Market Rd, Anand, Gujarat',
  storeAddressLine1: '123 Market Rd',
  storeAddressLine2: '',
  storeCity: 'Anand',
  storeState: 'Gujarat',
  storePostalCode: '388001',
  storeCountry: 'India',
  supportEmail: 'care@pramukhrajsweets.com',
  supportPhoneNumber: '+919876543210',
  logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  paymentProcessingFee: 20,
  paymentServiceTaxRatePercent: 20,
  taxRatePercent: 0,
  freeShippingMinimumAmount: 999,
  returnWindowDays: 7,
  updatedOn: null,
  concurrencyStamp: null,
}

describe('emailPreviewHelper', () => {
  it('replaces {{store_logo_url}} with real store logo from settings when logo is set', () => {
    const rawHtml = `
      <div class="header">
        <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-height:48px;" />
        <h1>{{store_name}}</h1>
      </div>
    `
    const rendered = renderEmailTemplatePreview(rawHtml, mockStoreSettings)

    expect(rendered).toContain('src="data:image/png;base64,iVBORw0KGgo')
    expect(rendered).toContain('Pramukhraj Special Sweets')
    expect(rendered).not.toContain('{{store_logo_url}}')
    expect(rendered).not.toContain('{{store_name}}')
  })

  it('gracefully strips broken <img> tag when store logo is not set', () => {
    const settingsWithoutLogo: StoreSettings = {
      ...mockStoreSettings,
      logoUrl: '',
    }
    const rawHtml = `
      <div class="header">
        <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-height:48px;" />
        <h1>{{store_name}}</h1>
      </div>
    `
    const rendered = renderEmailTemplatePreview(rawHtml, settingsWithoutLogo)

    expect(rendered).not.toContain('<img')
    expect(rendered).toContain('<h1>Pramukhraj Special Sweets</h1>')
  })

  it('merges customer and order sample variables', () => {
    const rawHtml = `
      <p>Hello {{customer_name}}, your order {{order_number}} of {{order_total}} is confirmed.</p>
      <p>Resolution: {{resolution}} | Refund: {{net_refund_amount}}</p>
    `
    const rendered = renderEmailTemplatePreview(rawHtml, mockStoreSettings)

    expect(rendered).toContain('Hello Rahul Sharma')
    expect(rendered).toContain('ORD-89412')
    expect(rendered).toContain('₹1,499.00')
    expect(rendered).toContain('Full Refund to Original Payment Method')
    expect(rendered).toContain('₹1,521.00')
    expect(rendered).not.toContain('{{customer_name}}')
    expect(rendered).not.toContain('{{order_number}}')
  })

  it('merges email subject line with store settings and variables', () => {
    const rawSubject = 'Order Confirmation #{{order_number}} — {{store_name}}'
    const subject = renderEmailSubjectPreview(rawSubject, mockStoreSettings)

    expect(subject).toBe('Order Confirmation #ORD-89412 — Pramukhraj Special Sweets')
  })
})
