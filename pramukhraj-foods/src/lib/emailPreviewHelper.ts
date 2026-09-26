import type { StoreSettings } from '@/features/admin-settings/types'

const DEFAULT_SAMPLE_VARIABLES: Record<string, string> = {
  customer_name: 'Rahul Sharma',
  customer_email: 'rahul.sharma@example.com',
  order_number: 'ORD-89412',
  order_total: '₹1,499.00',
  order_url: '#',
  payment_id: 'pay_PRM8923412',
  amount: '₹1,499.00',
  refund_id: 'rfnd_PRM491024',
  refund_amount: '₹1,499.00',
  payment_method: 'Online Payment (Razorpay UPI)',
  invoice_number: 'INV-2026-0841',
  invoice_url: '#',
  courier_name: 'BlueDart Express',
  tracking_number: 'BD-8492019482',
  tracking_url: '#',
  pickup_date: 'Sep 28, 2026 (10:00 AM - 2:00 PM)',
  cancellation_reason: 'Customer requested order cancellation before shipment dispatch.',
  return_number: 'RET-729104',
  reason: 'Defective / Damaged product received',
  resolution: 'Full Refund to Original Payment Method',
  items_count: '2',
  items_summary: '2x Premium Roasted Kaju (500g)',
  rejection_reason: 'Item return window expired or policy conditions not met.',
  original_order_number: 'ORD-89412',
  replacement_order_number: 'ORD-89502',
  activity: 'Password Changed from New Device',
  activity_time: '26 Sep 2026, 04:30 PM IST',
  location: 'Anand, Gujarat, India (Chrome / Windows)',
  security_url: '#',
  featured_title: 'Festive Special Sweets & Dry Fruits 20% Off',
  featured_description:
    'Celebrate this festive season with authentic sweets and dry fruit hampers freshly prepared with pure ingredients.',
  featured_url: '#',
  unsubscribe_url: '#',
  otp_code: '492801',
  verification_code: '492801',
  expires_in: '10',
  expires_in_minutes: '10',
  reset_url: '#',
  // Financial breakdown tags for return approved:
  product_refund_amount: '₹1,499.00',
  shipping_refund_amount: '₹0.00',
  payment_fee_refund_amount: '₹22.00',
  reverse_shipping_deduction: '₹0.00',
  net_refund_amount: '₹1,521.00',
  return_items_summary: '2x Premium Roasted Kaju (500g) - Defective/Damaged',
  return_facility: 'Pramukhraj Central Fulfillment Center, Anand, Gujarat',
}

export function getEffectiveVariables(
  storeSettings?: StoreSettings | null,
  customVariables?: Record<string, string>,
): Record<string, string> {
  const storeName = storeSettings?.storeName?.trim() || 'Pramukhraj Foods'
  const storeAddress =
    storeSettings?.storeAddress?.trim() ||
    'Shop 3,4, BH. Iris Hospital, Krishna Aaron, Sardar Patel Rd, Ring Road, Vivekanand Wadi, Anand, Gujarat - 388001, India'
  const supportEmail = storeSettings?.supportEmail?.trim() || 'support@pramukhrajfoods.com'
  const supportPhone = storeSettings?.supportPhoneNumber?.trim() || '+91 79844 84483'
  const logoUrl = storeSettings?.logoUrl?.trim() || ''
  const storeUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pramukhrajfoods.com'

  return {
    ...DEFAULT_SAMPLE_VARIABLES,
    store_name: storeName,
    store_address: storeAddress,
    support_email: supportEmail,
    support_phone: supportPhone,
    store_logo_url: logoUrl,
    store_url: storeUrl,
    ...customVariables,
  }
}

/**
 * Merges template HTML with actual store settings (including uploaded store logo)
 * and realistic sample variables so that the preview in the admin portal matches
 * exactly what customers receive.
 */
export function renderEmailTemplatePreview(
  html: string,
  storeSettings?: StoreSettings | null,
  customVariables?: Record<string, string>,
): string {
  if (!html) return ''

  const variables = getEffectiveVariables(storeSettings, customVariables)
  const hasLogo = Boolean(variables.store_logo_url)

  let rendered = html

  // First replace store_logo_url explicitly
  if (hasLogo) {
    rendered = rendered.replace(/\{\{\s*store_logo_url\s*\}\}/gi, variables.store_logo_url)
  } else {
    // If no logo is configured, remove any <img> tag that uses store_logo_url or empty src
    // to prevent browsers from showing a broken image icon.
    rendered = rendered.replace(
      /<img\s+[^>]*src=["'](?:\{\{\s*store_logo_url\s*\}\}|\s*)["'][^>]*>\s*/gi,
      '',
    )
  }

  // Replace all other mustache variables: {{variable_name}}
  rendered = rendered.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, key: string) => {
    const lowerKey = key.toLowerCase()
    if (Object.prototype.hasOwnProperty.call(variables, lowerKey)) {
      return variables[lowerKey]
    }
    // Clean fallback if variable is unknown
    return match
  })

  // Final safety pass: remove any leftover empty src image tags
  rendered = rendered.replace(/<img\s+[^>]*src=["']\s*["'][^>]*>\s*/gi, '')

  return rendered
}

/**
 * Merges subject line with store settings and sample preview data.
 */
export function renderEmailSubjectPreview(
  subject: string,
  storeSettings?: StoreSettings | null,
  customVariables?: Record<string, string>,
): string {
  if (!subject) return ''

  const variables = getEffectiveVariables(storeSettings, customVariables)
  return subject.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, key: string) => {
    const lowerKey = key.toLowerCase()
    if (Object.prototype.hasOwnProperty.call(variables, lowerKey)) {
      return variables[lowerKey]
    }
    return match
  })
}
