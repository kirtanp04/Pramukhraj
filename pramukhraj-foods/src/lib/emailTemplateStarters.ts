import { EMAIL_TEMPLATE_CATEGORY, type EmailTemplateCategory } from '@/types/emailTemplate'
import type { EmailDesignJson } from './emailDesignJson'

interface StarterAction {
  label: string
  url: string
}

interface StarterDesignOptions {
  key: string
  title: string
  preheader: string
  greeting?: string
  message: string
  highlight?: string
  highlightIsCode?: boolean
  action?: StarterAction
  note?: string
}

export interface EmailTemplateStarter {
  key: string
  name: string
  description: string
  category: EmailTemplateCategory
  subject: string
  variables: readonly string[]
  plainTextContent: string
  design: EmailDesignJson
}

const brand = {
  red: '#b91c1c',
  redDark: '#991b1b',
  blue: '#1d4ed8',
  navy: '#172554',
  ink: '#111827',
  muted: '#475569',
  surface: '#ffffff',
  page: '#eef4ff',
  border: '#dbeafe',
}

function meta(htmlID: string, htmlClassNames: string) {
  return { htmlID, htmlClassNames }
}

function textContent(id: string, html: string, padding = '10px 30px') {
  return {
    id,
    type: 'text',
    values: {
      containerPadding: padding,
      anchor: '',
      fontSize: '16px',
      textAlign: 'left',
      lineHeight: '160%',
      linkStyle: { inherit: true, linkColor: brand.blue, linkHoverColor: brand.navy, linkUnderline: true, linkHoverUnderline: true },
      hideDesktop: false,
      displayCondition: null,
      _meta: meta(id, 'u_content_text'),
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
      text: html,
    },
  }
}

function buttonContent(id: string, action: StarterAction) {
  return {
    id,
    type: 'button',
    values: {
      containerPadding: '14px 30px 24px',
      anchor: '',
      href: { name: 'web', values: { href: action.url, target: '_blank' } },
      buttonColors: { color: '#ffffff', backgroundColor: brand.red, hoverColor: '#ffffff', hoverBackgroundColor: brand.redDark },
      size: { autoWidth: true, width: '100%' },
      fontSize: '15px',
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: '120%',
      padding: '13px 24px',
      border: {},
      borderRadius: '999px',
      hideDesktop: false,
      displayCondition: null,
      _meta: meta(id, 'u_content_button'),
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
      text: `<span>${action.label}</span>`,
    },
  }
}

function row(id: string, contents: Array<Record<string, unknown>>, backgroundColor = brand.surface) {
  const columnId = `${id}_column`
  return {
    id,
    cells: [1],
    columns: [{
      id: columnId,
      contents,
      values: {
        backgroundColor: '',
        padding: '0px',
        border: {},
        borderRadius: '0px',
        _meta: meta(columnId, 'u_column'),
      },
    }],
    values: {
      displayCondition: null,
      columns: false,
      backgroundColor: '',
      columnsBackgroundColor: backgroundColor,
      backgroundImage: { url: '', fullWidth: true, repeat: false, center: true, cover: false },
      padding: '0px',
      anchor: '',
      hideDesktop: false,
      _meta: meta(id, 'u_row'),
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
    },
  }
}

function createStarterDesign(options: StarterDesignOptions): EmailDesignJson {
  const prefix = options.key.toLowerCase()
  const rows: Array<Record<string, unknown>> = [
    row(`${prefix}_brand`, [textContent(`${prefix}_brand_text`, `<p style="margin:0;text-align:center;color:${brand.red};font-size:22px;font-weight:700;letter-spacing:.2px;">Pramukhraj Foods</p>`, '24px 30px 14px')]),
    row(`${prefix}_title`, [textContent(`${prefix}_title_text`, `<h1 style="margin:0;color:${brand.ink};font-size:30px;line-height:1.25;text-align:center;">${options.title}</h1>`, '18px 30px 12px')]),
  ]

  if (options.greeting) {
    rows.push(row(`${prefix}_greeting`, [textContent(`${prefix}_greeting_text`, `<p style="margin:0;color:${brand.ink};">${options.greeting}</p>`, '12px 30px 4px')]))
  }

  rows.push(row(`${prefix}_message`, [textContent(`${prefix}_message_text`, `<p style="margin:0;color:${brand.muted};">${options.message}</p>`, '10px 30px')]))

  if (options.highlight) {
    const highlightTypography = options.highlightIsCode
      ? "font-family:'Courier New',monospace;font-size:30px;letter-spacing:6px;"
      : 'font-size:22px;letter-spacing:.2px;'
    rows.push(row(`${prefix}_highlight`, [textContent(`${prefix}_highlight_text`, `<p style="margin:0;text-align:center;color:${brand.navy};${highlightTypography}font-weight:700;">${options.highlight}</p>`, '18px 30px')], '#eff6ff'))
  }

  if (options.action) rows.push(row(`${prefix}_action`, [buttonContent(`${prefix}_action_button`, options.action)]))
  if (options.note) rows.push(row(`${prefix}_note`, [textContent(`${prefix}_note_text`, `<p style="margin:0;color:${brand.muted};font-size:13px;">${options.note}</p>`, '8px 30px 22px')]))

  rows.push(row(`${prefix}_footer`, [textContent(`${prefix}_footer_text`, `<p style="margin:0;text-align:center;color:${brand.muted};font-size:12px;">This message was sent by Pramukhraj Foods.<br>Need help? Reply to this email.</p>`, '22px 30px')], '#f8fafc'))

  return {
    counters: {
      u_row: rows.length,
      u_column: rows.length,
      u_content_text: rows.length - (options.action ? 1 : 0),
      u_content_button: options.action ? 1 : 0,
    },
    body: {
      id: `${prefix}_body`,
      rows,
      headers: [],
      footers: [],
      values: {
        contentWidth: '600px',
        fontFamily: { label: 'Arial', value: 'arial,helvetica,sans-serif' },
        textColor: brand.ink,
        backgroundColor: brand.page,
        backgroundImage: { url: '', fullWidth: true, repeat: false, center: true, cover: false },
        preheaderText: options.preheader,
        linkStyle: { body: true, linkColor: brand.blue, linkHoverColor: brand.navy, linkUnderline: true, linkHoverUnderline: true },
        _meta: meta(`${prefix}_body`, 'u_body'),
      },
    },
    schemaVersion: 21,
  }
}

function starter(
  metadata: Omit<EmailTemplateStarter, 'design'>,
  content: Omit<StarterDesignOptions, 'key'>,
): EmailTemplateStarter {
  return { ...metadata, design: createStarterDesign({ key: metadata.key, ...content }) }
}

export const EMAIL_TEMPLATE_STARTERS: readonly EmailTemplateStarter[] = [
  starter(
    { key: 'WELCOME', name: 'Welcome Email', description: 'Welcomes a customer after account creation.', category: EMAIL_TEMPLATE_CATEGORY.Account, subject: 'Welcome to Pramukhraj Foods, {{customer_name}}!', variables: ['customer_name', 'customer_email', 'store_url'], plainTextContent: 'Hi {{customer_name}}, welcome to Pramukhraj Foods. We are delighted to have you with us. Visit {{store_url}} to start shopping.' },
    { title: 'Welcome to Pramukhraj Foods', preheader: 'Your Pramukhraj Foods account is ready.', greeting: 'Hi {{customer_name}},', message: 'Thank you for joining us. Discover authentic flavours, carefully prepared and delivered to your door.', action: { label: 'Start shopping', url: '{{store_url}}' }, note: 'You are receiving this account email at {{customer_email}}.' },
  ),
  starter(
    { key: 'EMAIL_VERIFICATION_OTP', name: 'Email Verification OTP', description: 'Sends a one-time code to verify a customer email address.', category: EMAIL_TEMPLATE_CATEGORY.Account, subject: '{{otp_code}} is your Pramukhraj Foods verification code', variables: ['customer_name', 'otp_code', 'expires_in'], plainTextContent: 'Hi {{customer_name}}, your Pramukhraj Foods verification code is {{otp_code}}. It expires in {{expires_in}} minutes. Never share this code.' },
    { title: 'Verify your email', preheader: 'Use your one-time code to verify your email.', greeting: 'Hi {{customer_name}},', message: 'Enter this one-time verification code to finish verifying your email address:', highlight: '{{otp_code}}', highlightIsCode: true, note: 'This code expires in {{expires_in}} minutes. Never share it with anyone. If you did not request this code, you can safely ignore this email.' },
  ),
  starter(
    { key: 'PASSWORD_RESET', name: 'Password Reset', description: 'Provides a secure password-reset link.', category: EMAIL_TEMPLATE_CATEGORY.Account, subject: 'Reset your Pramukhraj Foods password', variables: ['customer_name', 'reset_url', 'expires_in'], plainTextContent: 'Hi {{customer_name}}, reset your password using {{reset_url}}. This link expires in {{expires_in}} minutes.' },
    { title: 'Reset your password', preheader: 'A secure link to reset your password.', greeting: 'Hi {{customer_name}},', message: 'We received a request to reset your password. Use the secure button below to choose a new one.', action: { label: 'Reset password', url: '{{reset_url}}' }, note: 'This link expires in {{expires_in}} minutes. If you did not request a reset, no action is needed.' },
  ),
  starter(
    { key: 'ORDER_SUCCESS', name: 'Order Confirmation', description: 'Confirms that an order was successfully placed.', category: EMAIL_TEMPLATE_CATEGORY.Order, subject: 'Your order {{order_number}} is confirmed', variables: ['customer_name', 'order_number', 'order_total', 'order_url'], plainTextContent: 'Hi {{customer_name}}, order {{order_number}} is confirmed. Total: {{order_total}}. View it at {{order_url}}.' },
    { title: 'Order confirmed', preheader: 'We received order {{order_number}}.', greeting: 'Hi {{customer_name}},', message: 'Thank you for your order. We are preparing it now. Your order total is {{order_total}}.', highlight: 'Order {{order_number}}', action: { label: 'View order', url: '{{order_url}}' } },
  ),
  starter(
    { key: 'PAYMENT_SUCCESS', name: 'Payment Confirmation', description: 'Confirms successful payment for an order.', category: EMAIL_TEMPLATE_CATEGORY.Payment, subject: 'Payment received for order {{order_number}}', variables: ['customer_name', 'order_number', 'payment_id', 'amount', 'order_url'], plainTextContent: 'Hi {{customer_name}}, payment {{payment_id}} for {{amount}} was received for order {{order_number}}.' },
    { title: 'Payment received', preheader: 'Your payment was successful.', greeting: 'Hi {{customer_name}},', message: 'We received your payment of {{amount}} for order {{order_number}}.', highlight: 'Payment ID {{payment_id}}', action: { label: 'View order', url: '{{order_url}}' } },
  ),
  starter(
    { key: 'INVOICE', name: 'Invoice', description: 'Provides the invoice for a completed order.', category: EMAIL_TEMPLATE_CATEGORY.Order, subject: 'Invoice {{invoice_number}} for order {{order_number}}', variables: ['customer_name', 'order_number', 'invoice_number', 'invoice_url'], plainTextContent: 'Hi {{customer_name}}, invoice {{invoice_number}} for order {{order_number}} is ready: {{invoice_url}}.' },
    { title: 'Your invoice is ready', preheader: 'Invoice {{invoice_number}} is available.', greeting: 'Hi {{customer_name}},', message: 'Your invoice for order {{order_number}} is ready to view or download.', highlight: 'Invoice {{invoice_number}}', action: { label: 'View invoice', url: '{{invoice_url}}' } },
  ),
  starter(
    { key: 'SHIPMENT', name: 'Shipment Notification', description: 'Notifies a customer when an order ships.', category: EMAIL_TEMPLATE_CATEGORY.Shipping, subject: 'Your order {{order_number}} is on its way', variables: ['customer_name', 'order_number', 'tracking_number', 'tracking_url'], plainTextContent: 'Hi {{customer_name}}, order {{order_number}} has shipped. Tracking number: {{tracking_number}}. Track it at {{tracking_url}}.' },
    { title: 'Your order is on its way', preheader: 'Track shipment {{tracking_number}}.', greeting: 'Hi {{customer_name}},', message: 'Order {{order_number}} has left our facility and is heading to you.', highlight: 'Tracking {{tracking_number}}', action: { label: 'Track shipment', url: '{{tracking_url}}' } },
  ),
  starter(
    { key: 'DELIVERED', name: 'Order Delivered', description: 'Confirms delivery and invites the customer to review the order.', category: EMAIL_TEMPLATE_CATEGORY.Shipping, subject: 'Your order {{order_number}} was delivered', variables: ['customer_name', 'order_number', 'order_url'], plainTextContent: 'Hi {{customer_name}}, order {{order_number}} was delivered. View your order at {{order_url}}.' },
    { title: 'Delivered', preheader: 'Order {{order_number}} has been delivered.', greeting: 'Hi {{customer_name}},', message: 'Your order {{order_number}} has been delivered. We hope you enjoy every bite.', action: { label: 'View order', url: '{{order_url}}' }, note: 'If you cannot find your package, please check with your household or contact our support team.' },
  ),
  starter(
    { key: 'ORDER_CANCELLED', name: 'Order Cancelled', description: 'Confirms an order cancellation and expected refund.', category: EMAIL_TEMPLATE_CATEGORY.Order, subject: 'Your order {{order_number}} was cancelled', variables: ['customer_name', 'order_number', 'refund_amount'], plainTextContent: 'Hi {{customer_name}}, order {{order_number}} was cancelled. Expected refund: {{refund_amount}}.' },
    { title: 'Order cancelled', preheader: 'Order {{order_number}} has been cancelled.', greeting: 'Hi {{customer_name}},', message: 'Your order {{order_number}} has been cancelled as requested.', highlight: 'Refund {{refund_amount}}', note: 'If a payment was captured, the refund may take several business days to appear with your payment provider.' },
  ),
  starter(
    { key: 'REFUND_PROCESSED', name: 'Refund Processed', description: 'Confirms that a refund has been issued.', category: EMAIL_TEMPLATE_CATEGORY.Payment, subject: 'Your refund for {{order_number}} was processed', variables: ['customer_name', 'order_number', 'refund_amount', 'refund_id'], plainTextContent: 'Hi {{customer_name}}, refund {{refund_id}} for {{refund_amount}} was processed for order {{order_number}}.' },
    { title: 'Refund processed', preheader: 'Your refund has been issued.', greeting: 'Hi {{customer_name}},', message: 'We processed your refund for order {{order_number}}.', highlight: '{{refund_amount}}', note: 'Refund reference: {{refund_id}}. Your bank or payment provider may need several business days to post the funds.' },
  ),
  starter(
    { key: 'NEWSLETTER', name: 'Newsletter', description: 'Reusable branded layout for product news and stories.', category: EMAIL_TEMPLATE_CATEGORY.Marketing, subject: 'Fresh updates from Pramukhraj Foods', variables: ['customer_name', 'featured_title', 'featured_description', 'featured_url', 'unsubscribe_url'], plainTextContent: 'Hi {{customer_name}}, {{featured_title}}. {{featured_description}} Read more: {{featured_url}}. Unsubscribe: {{unsubscribe_url}}.' },
    { title: '{{featured_title}}', preheader: 'Fresh products and stories from Pramukhraj Foods.', greeting: 'Hi {{customer_name}},', message: '{{featured_description}}', action: { label: 'Explore the latest', url: '{{featured_url}}' }, note: 'You received this marketing email because you subscribed to updates. Unsubscribe: {{unsubscribe_url}}' },
  ),
  starter(
    { key: 'SECURITY_ALERT', name: 'Security Alert', description: 'Alerts a customer about important account activity.', category: EMAIL_TEMPLATE_CATEGORY.System, subject: 'Security alert for your Pramukhraj Foods account', variables: ['customer_name', 'activity', 'activity_time', 'location', 'security_url'], plainTextContent: 'Hi {{customer_name}}, we detected {{activity}} at {{activity_time}} from {{location}}. Review your account: {{security_url}}.' },
    { title: 'Security alert', preheader: 'Review recent activity on your account.', greeting: 'Hi {{customer_name}},', message: 'We detected {{activity}} on your account at {{activity_time}} from {{location}}.', action: { label: 'Review account security', url: '{{security_url}}' }, note: 'If this was you, no action is required. Otherwise, secure your account immediately.' },
  ),
] as const
