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
  oxblood: '#991B1B',
  oxbloodDark: '#7F1D1D',
  turmeric: '#D97706',
  turmericLight: '#FEF3C7',
  ink: '#111827',
  muted: '#4B5563',
  border: '#E5E7EB',
  surface: '#FFFFFF',
  page: '#F8FAFC',
  green: '#047857',
  greenLight: '#ECFDF5',
}

const STORE_VARIABLES = [
  'store_address',
  'store_logo_url',
  'store_name',
  'support_email',
  'support_phone',
] as const

function withStoreVariables(vars: readonly string[]): readonly string[] {
  return Array.from(new Set([...vars, ...STORE_VARIABLES])).sort()
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
      fontSize: '15px',
      textAlign: 'left',
      lineHeight: '160%',
      linkStyle: { inherit: true, linkColor: brand.oxblood, linkHoverColor: brand.oxbloodDark, linkUnderline: true, linkHoverUnderline: true },
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
      buttonColors: { color: '#ffffff', backgroundColor: brand.oxblood, hoverColor: '#ffffff', hoverBackgroundColor: brand.oxbloodDark },
      size: { autoWidth: true, width: '100%' },
      fontSize: '15px',
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: '120%',
      padding: '13px 26px',
      border: {},
      borderRadius: '8px',
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
    row(
      `${prefix}_brand`,
      [
        textContent(
          `${prefix}_brand_text`,
          `<div style="text-align:center;"><p style="margin:0;font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:700;color:${brand.oxblood};letter-spacing:0.5px;">{{store_name}}</p></div>`,
          '28px 30px 14px',
        ),
      ],
      brand.surface,
    ),
    row(
      `${prefix}_title`,
      [
        textContent(
          `${prefix}_title_text`,
          `<h1 style="margin:0;font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:700;line-height:1.3;text-align:center;color:${brand.ink};">${options.title}</h1>`,
          '12px 30px 14px',
        ),
      ],
      brand.surface,
    ),
  ]

  if (options.greeting) {
    rows.push(
      row(
        `${prefix}_greeting`,
        [
          textContent(
            `${prefix}_greeting_text`,
            `<p style="margin:0;font-family:'Work Sans',Arial,sans-serif;font-size:15px;color:${brand.ink};font-weight:600;">${options.greeting}</p>`,
            '10px 30px 4px',
          ),
        ],
        brand.surface,
      ),
    )
  }

  rows.push(
    row(
      `${prefix}_message`,
      [
        textContent(
          `${prefix}_message_text`,
          `<p style="margin:0;font-family:'Work Sans',Arial,sans-serif;font-size:15px;line-height:1.6;color:${brand.muted};">${options.message}</p>`,
          '10px 30px 14px',
        ),
      ],
      brand.surface,
    ),
  )

  if (options.highlight) {
    const highlightTypography = options.highlightIsCode
      ? "font-family:'IBM Plex Mono',Courier,monospace;font-size:28px;letter-spacing:8px;"
      : "font-family:'IBM Plex Mono',monospace;font-size:20px;letter-spacing:0.5px;"
    rows.push(
      row(
        `${prefix}_highlight`,
        [
          textContent(
            `${prefix}_highlight_text`,
            `<div style="text-align:center;padding:14px;background:#F8FAFC;border:2px dashed ${brand.oxblood};border-radius:10px;"><p style="margin:0;color:${brand.oxblood};${highlightTypography}font-weight:700;">${options.highlight}</p></div>`,
            '12px 30px',
          ),
        ],
        brand.surface,
      ),
    )
  }

  if (options.action) {
    rows.push(row(`${prefix}_action`, [buttonContent(`${prefix}_action_button`, options.action)], brand.surface))
  }

  if (options.note) {
    rows.push(
      row(
        `${prefix}_note`,
        [
          textContent(
            `${prefix}_note_text`,
            `<div style="padding:10px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;"><p style="margin:0;font-family:'Work Sans',Arial,sans-serif;color:#78350F;font-size:13px;line-height:1.5;">${options.note}</p></div>`,
            '8px 30px 18px',
          ),
        ],
        brand.surface,
      ),
    )
  }

  rows.push(
    row(
      `${prefix}_footer`,
      [
        textContent(
          `${prefix}_footer_text`,
          `<p style="margin:0;text-align:center;font-family:'Work Sans',Arial,sans-serif;color:${brand.muted};font-size:12px;line-height:1.6;">{{store_name}} &bull; {{store_address}}<br>Need assistance? Contact <a href="mailto:{{support_email}}" style="color:${brand.oxblood};text-decoration:none;">{{support_email}}</a> | {{support_phone}}</p>`,
          '20px 30px',
        ),
      ],
      brand.page,
    ),
  )

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
        linkStyle: { body: true, linkColor: brand.oxblood, linkHoverColor: brand.oxbloodDark, linkUnderline: true, linkHoverUnderline: true },
        _meta: meta(`${prefix}_body`, 'u_body'),
      },
    },
    schemaVersion: 21,
  }
}

function starter(
  metadata: Omit<EmailTemplateStarter, 'design' | 'variables'> & { variables: readonly string[] },
  content: Omit<StarterDesignOptions, 'key'>,
): EmailTemplateStarter {
  const mergedVariables = withStoreVariables(metadata.variables)
  return {
    ...metadata,
    variables: mergedVariables,
    design: createStarterDesign({ key: metadata.key, ...content }),
  }
}

export const EMAIL_TEMPLATE_STARTERS: readonly EmailTemplateStarter[] = [
  starter(
    {
      key: 'WELCOME',
      name: 'Welcome Email',
      description: 'Welcomes a new customer after account registration.',
      category: EMAIL_TEMPLATE_CATEGORY.Account,
      subject: 'Welcome to {{store_name}}, {{customer_name}}!',
      variables: ['customer_name', 'customer_email', 'store_url'],
      plainTextContent: 'Welcome {{customer_name}} to {{store_name}}! Discover authentic flavors carefully prepared and delivered to your doorstep. Visit {{store_url}} to start exploring.\nAccount: {{customer_email}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Welcome to {{store_name}}',
      preheader: 'Your {{store_name}} account is ready.',
      greeting: 'Welcome {{customer_name}},',
      message: 'Thank you for joining our community! We are thrilled to welcome you. Discover authentic flavors, traditional recipes, and artisanal delicacies prepared fresh and delivered with care to your doorstep.',
      action: { label: 'Start Exploring', url: '{{store_url}}' },
      note: 'Account email: {{customer_email}}',
    },
  ),
  starter(
    {
      key: 'EMAIL_VERIFICATION_OTP',
      name: 'Email Verification OTP',
      description: 'Sends a one-time verification passcode to verify a customer email address.',
      category: EMAIL_TEMPLATE_CATEGORY.Account,
      subject: '{{otp_code}} is your {{store_name}} verification code',
      variables: ['customer_name', 'expires_in', 'otp_code'],
      plainTextContent: 'Dear {{customer_name}},\n\nYour one-time email verification code for {{store_name}} is: {{otp_code}}\nThis code expires in {{expires_in}} minutes.\nNever share this code with anyone.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Verify Your Email Address',
      preheader: 'Use one-time verification code {{otp_code}} to verify your email.',
      greeting: 'Dear {{customer_name}},',
      message: 'Please enter the following one-time verification code to confirm your email address and protect your account:',
      highlight: '{{otp_code}}',
      highlightIsCode: true,
      note: 'This code expires in {{expires_in}} minutes. Never share it with anyone. If you did not request this verification, you can safely ignore this email.',
    },
  ),
  starter(
    {
      key: 'PASSWORD_RESET',
      name: 'Password Reset Request',
      description: 'Sends a secure link to reset an account password.',
      category: EMAIL_TEMPLATE_CATEGORY.Account,
      subject: 'Reset your {{store_name}} password',
      variables: ['customer_name', 'expires_in', 'reset_url'],
      plainTextContent: 'Dear {{customer_name}},\n\nWe received a request to reset your password at {{store_name}}.\nReset link: {{reset_url}}\n\nThis link is valid for {{expires_in}} minutes. If you did not make this request, please disregard this email.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Reset Your Password',
      preheader: 'A secure link to reset your password.',
      greeting: 'Dear {{customer_name}},',
      message: 'We received a request to reset the password associated with your account at {{store_name}}. Click the button below to establish a new password:',
      action: { label: 'Reset My Password', url: '{{reset_url}}' },
      note: 'This link expires in {{expires_in}} minutes. If you did not request a password reset, no further action is necessary.',
    },
  ),
  starter(
    {
      key: 'ORDER_SUCCESS',
      name: 'Order Confirmation',
      description: 'Confirms order placement and summarizes order details.',
      category: EMAIL_TEMPLATE_CATEGORY.Order,
      subject: 'Order Confirmed: #{{order_number}} - {{store_name}}',
      variables: ['customer_name', 'order_number', 'order_total', 'order_url'],
      plainTextContent: 'Dear {{customer_name}},\n\nThank you for ordering with {{store_name}}!\nOrder #{{order_number}} has been confirmed.\nTotal: {{order_total}}\n\nTrack your order: {{order_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Order Confirmed!',
      preheader: 'Your order #{{order_number}} is confirmed.',
      greeting: 'Dear {{customer_name}},',
      message: 'Thank you for your order! We have safely received your order #{{order_number}} for a total of {{order_total}}. Our team is already preparing your items with traditional recipes and premium ingredients.',
      highlight: 'Order #{{order_number}}',
      action: { label: 'View Order Status', url: '{{order_url}}' },
      note: 'We will notify you with courier tracking information as soon as your parcel ships.',
    },
  ),
  starter(
    {
      key: 'PAYMENT_SUCCESS',
      name: 'Payment Confirmation',
      description: 'Confirms that customer payment has been captured successfully.',
      category: EMAIL_TEMPLATE_CATEGORY.Payment,
      subject: 'Payment Received for Order #{{order_number}}',
      variables: ['amount', 'customer_name', 'order_number', 'order_url', 'payment_id'],
      plainTextContent: 'Dear {{customer_name}},\n\nPayment received for Order #{{order_number}}!\nAmount: {{amount}}\nPayment Reference: {{payment_id}}\n\nView order: {{order_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Payment Received',
      preheader: 'Payment of {{amount}} confirmed for order #{{order_number}}.',
      greeting: 'Dear {{customer_name}},',
      message: 'We have successfully received your payment of {{amount}} for Order #{{order_number}}.',
      highlight: 'Payment ID: {{payment_id}}',
      action: { label: 'View Your Order', url: '{{order_url}}' },
      note: 'A copy of this payment receipt is stored in your account history.',
    },
  ),
  starter(
    {
      key: 'INVOICE',
      name: 'Order Receipt / Bill of Supply',
      description: 'Official bill of supply / order receipt with tax-inclusive pricing.',
      category: EMAIL_TEMPLATE_CATEGORY.Order,
      subject: 'Order Receipt for #{{order_number}} - {{store_name}}',
      variables: ['customer_name', 'invoice_number', 'invoice_url', 'order_number'],
      plainTextContent: 'Dear {{customer_name}},\n\nYour order receipt / bill of supply for order #{{order_number}} is ready.\nReceipt Number: {{invoice_number}}\nView or download: {{invoice_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Your Order Receipt is Ready',
      preheader: 'Bill of Supply for order #{{order_number}} is available.',
      greeting: 'Dear {{customer_name}},',
      message: 'Your official Bill of Supply / Order Receipt #{{invoice_number}} for Order #{{order_number}} has been generated. All prices on your bill are flat, final, and all-inclusive.',
      highlight: 'Receipt #{{invoice_number}}',
      action: { label: 'Download Receipt', url: '{{invoice_url}}' },
      note: 'Receipt Number: {{invoice_number}} &bull; Order Reference: #{{order_number}}',
    },
  ),
  starter(
    {
      key: 'SHIPMENT',
      name: 'Order Dispatched',
      description: 'Notifies customer when their order is on the way with courier tracking.',
      category: EMAIL_TEMPLATE_CATEGORY.Shipping,
      subject: 'Your {{store_name}} order #{{order_number}} is on the way!',
      variables: ['customer_name', 'order_number', 'tracking_number', 'tracking_url'],
      plainTextContent: 'Dear {{customer_name}},\n\nYour order #{{order_number}} from {{store_name}} has been dispatched!\nTracking Number: {{tracking_number}}\nTrack your shipment: {{tracking_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Your Order is on the Way!',
      preheader: 'Order #{{order_number}} has been dispatched with tracking #{{tracking_number}}.',
      greeting: 'Dear {{customer_name}},',
      message: 'Exciting news! Your order #{{order_number}} has been safely packaged and handed over to our delivery partner. It is now on its journey to your registered address.',
      highlight: 'Tracking #{{tracking_number}}',
      action: { label: 'Track Your Parcel', url: '{{tracking_url}}' },
      note: 'Courier tracking information may take a few hours to update with the carrier.',
    },
  ),
  starter(
    {
      key: 'DELIVERED',
      name: 'Order Delivered',
      description: 'Confirms delivery and invites customer to rate and review their purchase.',
      category: EMAIL_TEMPLATE_CATEGORY.Shipping,
      subject: 'Delivered: Your {{store_name}} order #{{order_number}} has arrived!',
      variables: ['customer_name', 'order_number', 'order_url'],
      plainTextContent: 'Dear {{customer_name}},\n\nYour order #{{order_number}} from {{store_name}} has been delivered!\nView order: {{order_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Your Order Has Arrived!',
      preheader: 'Order #{{order_number}} has been delivered successfully.',
      greeting: 'Dear {{customer_name}},',
      message: 'Package delivered! Order #{{order_number}} has safely arrived at your destination address. We hope you enjoy every bite of your authentic delicacies.',
      highlight: 'Delivered: #{{order_number}}',
      action: { label: 'Rate & Review Order', url: '{{order_url}}' },
      note: 'If you did not receive your parcel or have any concerns, please contact our support team immediately.',
    },
  ),
  starter(
    {
      key: 'ORDER_CANCELLED',
      name: 'Order Cancelled',
      description: 'Confirms order cancellation and any initiated refund details.',
      category: EMAIL_TEMPLATE_CATEGORY.Order,
      subject: 'Order Cancelled: #{{order_number}} - {{store_name}}',
      variables: ['customer_name', 'order_number', 'refund_amount'],
      plainTextContent: 'Dear {{customer_name}},\n\nYour order #{{order_number}} has been cancelled.\nRefund amount: {{refund_amount}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Order Cancellation Confirmed',
      preheader: 'Order #{{order_number}} has been cancelled.',
      greeting: 'Dear {{customer_name}},',
      message: 'As requested, Order #{{order_number}} has been cancelled. If any payment was captured, a full refund of {{refund_amount}} has been initiated.',
      highlight: 'Refund: {{refund_amount}}',
      note: 'Depending on your banking provider, refunded funds will appear in your statement within 5-7 business days.',
    },
  ),
  starter(
    {
      key: 'REFUND_PROCESSED',
      name: 'Refund Processed',
      description: 'Confirms successful refund transaction and banking turnaround.',
      category: EMAIL_TEMPLATE_CATEGORY.Payment,
      subject: 'Refund Processed for Order #{{order_number}} - {{store_name}}',
      variables: ['customer_name', 'order_number', 'payment_method', 'refund_amount', 'refund_id'],
      plainTextContent: 'Dear {{customer_name}},\n\nWe have processed your refund of {{refund_amount}} for Order #{{order_number}}.\nReference: {{refund_id}}\nDestination: {{payment_method}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Refund Processed',
      preheader: 'Refund of {{refund_amount}} processed.',
      greeting: 'Dear {{customer_name}},',
      message: 'We have processed a refund of {{refund_amount}} for Order #{{order_number}} to your {{payment_method}}.',
      highlight: '{{refund_amount}}',
      note: 'Transaction Reference ID: {{refund_id}}. Bank processing times usually take 5-7 working days.',
    },
  ),
  starter(
    {
      key: 'NEWSLETTER',
      name: 'Store Newsletter & Updates',
      description: 'Engaging editorial broadcast for announcements, recipes, and seasonal offerings.',
      category: EMAIL_TEMPLATE_CATEGORY.Marketing,
      subject: 'Fresh from the Kitchen: {{featured_title}} - {{store_name}}',
      variables: ['customer_name', 'featured_description', 'featured_title', 'featured_url', 'unsubscribe_url'],
      plainTextContent: 'Dear {{customer_name}},\n\n{{featured_title}}\n{{featured_description}}\n\nExplore: {{featured_url}}\nUnsubscribe: {{unsubscribe_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: '{{featured_title}}',
      preheader: 'Fresh recipes and seasonal specials from {{store_name}}.',
      greeting: 'Dear {{customer_name}},',
      message: '{{featured_description}}',
      action: { label: "Discover What's New", url: '{{featured_url}}' },
      note: 'You are receiving this update because you subscribed to {{store_name}}. Unsubscribe: {{unsubscribe_url}}',
    },
  ),
  starter(
    {
      key: 'SECURITY_ALERT',
      name: 'Account Security Alert',
      description: 'Alerts customer of sensitive account events such as password change or unexpected login.',
      category: EMAIL_TEMPLATE_CATEGORY.System,
      subject: 'Security Alert for your {{store_name}} Account',
      variables: ['activity', 'activity_time', 'customer_name', 'location', 'security_url'],
      plainTextContent: 'Dear {{customer_name}},\n\nSecurity notice for {{store_name}}:\nActivity: {{activity}}\nTime: {{activity_time}}\nLocation: {{location}}\n\nReview account security: {{security_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Security Alert',
      preheader: 'Important security notice regarding your account.',
      greeting: 'Dear {{customer_name}},',
      message: 'We detected sensitive activity on your {{store_name}} account: {{activity}} on {{activity_time}} from {{location}}.',
      highlight: 'Activity: {{activity}}',
      action: { label: 'Review Account Security', url: '{{security_url}}' },
      note: 'If this was you, no action is needed. If you did not make this change, please secure your account immediately.',
    },
  ),
  starter(
    {
      key: 'RETURN_REQUESTED',
      name: 'Return Request Acknowledged',
      description: 'Acknowledges receipt of customer return request.',
      category: EMAIL_TEMPLATE_CATEGORY.Shipping,
      subject: 'Return Request Received: #{{return_number}} (Order #{{order_number}})',
      variables: ['customer_name', 'items_count', 'order_number', 'reason', 'resolution', 'return_number'],
      plainTextContent: 'Dear {{customer_name}},\n\nWe have received your return request #{{return_number}} for Order #{{order_number}}.\nReason: {{reason}}\nResolution: {{resolution}}\nItems: {{items_count}}\n\nOur team is reviewing your request and will update you shortly.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Return Request Received',
      preheader: 'Return request #{{return_number}} for order #{{order_number}} received.',
      greeting: 'Dear {{customer_name}},',
      message: 'We have received your return request #{{return_number}} for Order #{{order_number}}. Reason: {{reason}}. Requested resolution: {{resolution}} for {{items_count}} item(s). Our team is reviewing it against our store return policy.',
      highlight: 'RMA #{{return_number}}',
      note: 'We will notify you via email as soon as your request is reviewed.',
    },
  ),
  starter(
    {
      key: 'RETURN_APPROVED',
      name: 'Return Request Approved',
      description: 'Approved return notification with complete refund breakdown and packaging guidelines.',
      category: EMAIL_TEMPLATE_CATEGORY.Shipping,
      subject: 'Return Approved: #{{return_number}} - {{store_name}}',
      variables: [
        'customer_name',
        'net_refund_amount',
        'order_number',
        'payment_fee_refund_amount',
        'product_refund_amount',
        'resolution',
        'return_facility',
        'return_items_summary',
        'return_number',
        'reverse_shipping_deduction',
        'shipping_refund_amount',
      ],
      plainTextContent: 'Dear {{customer_name}},\n\nYour return request #{{return_number}} for Order #{{order_number}} has been Approved.\n\nRETURN & REFUND AMOUNT SUMMARY BREAKDOWN:\n- Resolution: {{resolution}}\n- Product Value Refund: {{product_refund_amount}}\n- Shipping Charges Refund: {{shipping_refund_amount}}\n- Payment Fee Refund: {{payment_fee_refund_amount}}\n- Less Reverse Shipping Deduction: -{{reverse_shipping_deduction}}\n- TOTAL NET REFUND AMOUNT: {{net_refund_amount}}\n\nItems to return:\n{{return_items_summary}}\n\nReturn Facility:\n{{return_facility}}\n\nPlease pack items securely in original packaging for reverse pickup.\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Return Request Approved',
      preheader: 'Return request #{{return_number}} approved. Net refund: {{net_refund_amount}}.',
      greeting: 'Dear {{customer_name}},',
      message: 'Great news! Your return request #{{return_number}} for Order #{{order_number}} has been Approved for {{resolution}}.\n\nItems: {{return_items_summary}}\nReturn Facility: {{return_facility}}\n\nPlease pack the items securely in original packaging with all labels intact. Hand over the parcel when our courier executive arrives for reverse pickup.',
      highlight: 'Net Refund: {{net_refund_amount}}',
      note: 'Breakdown: Product: {{product_refund_amount}} | Shipping: {{shipping_refund_amount}} | Fee: {{payment_fee_refund_amount}} | Reverse Deduction: -{{reverse_shipping_deduction}} | Total Net: {{net_refund_amount}}',
    },
  ),
  starter(
    {
      key: 'RETURN_REJECTED',
      name: 'Return Request Rejected',
      description: 'Notifies customer when a return request cannot be approved based on store policy.',
      category: EMAIL_TEMPLATE_CATEGORY.Shipping,
      subject: 'Update on Return Request #{{return_number}} (Order #{{order_number}})',
      variables: ['customer_name', 'order_number', 'rejection_reason', 'return_number'],
      plainTextContent: 'Dear {{customer_name}},\n\nYour return request #{{return_number}} for Order #{{order_number}} could not be approved for the following reason:\n{{rejection_reason}}\n\nIf you have questions, please contact our support team.\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Update on Return Request',
      preheader: 'Update regarding return request #{{return_number}}.',
      greeting: 'Dear {{customer_name}},',
      message: 'After careful review of your return request #{{return_number}} for Order #{{order_number}}, we regret to inform you that it could not be approved due to our return policy guidelines.',
      highlight: 'Reason: {{rejection_reason}}',
      note: 'If you have questions or additional information, please reply directly to this email or contact support.',
    },
  ),
  starter(
    {
      key: 'REVERSE_PICKUP_SCHEDULED',
      name: 'Reverse Pickup Scheduled',
      description: 'Notifies customer with courier details and date for scheduled reverse pickup.',
      category: EMAIL_TEMPLATE_CATEGORY.Shipping,
      subject: 'Reverse Pickup Scheduled for Return #{{return_number}}',
      variables: ['courier_name', 'customer_name', 'order_number', 'pickup_date', 'return_number', 'tracking_number'],
      plainTextContent: 'Dear {{customer_name}},\n\nA reverse pickup has been scheduled for your return #{{return_number}} (Order #{{order_number}}).\nCourier: {{courier_name}}\nAWB Tracking: {{tracking_number}}\nScheduled Date: {{pickup_date}}\n\nPlease hand over the package to the pickup executive.\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Reverse Pickup Scheduled',
      preheader: 'Reverse pickup scheduled via {{courier_name}}.',
      greeting: 'Dear {{customer_name}},',
      message: 'A reverse pickup has been scheduled for your return request #{{return_number}} (Order #{{order_number}}) via {{courier_name}} on {{pickup_date}}.',
      highlight: 'AWB: {{tracking_number}}',
      note: 'Please keep the package securely packed and hand it over to the courier executive upon arrival.',
    },
  ),
  starter(
    {
      key: 'RETURN_PACKAGE_RECEIVED',
      name: 'Return Package Received at Warehouse',
      description: 'Confirms package delivered to facility and QC inspection underway.',
      category: EMAIL_TEMPLATE_CATEGORY.Shipping,
      subject: 'Return Package Received: #{{return_number}} at Warehouse',
      variables: ['customer_name', 'order_number', 'resolution', 'return_number'],
      plainTextContent: 'Dear {{customer_name}},\n\nWe have safely received your returned package for Return Request #{{return_number}} (Order #{{order_number}}).\nOur quality control team is inspecting the items and will process your {{resolution}} shortly.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Package Received at Warehouse',
      preheader: 'Package for return #{{return_number}} received at warehouse.',
      greeting: 'Dear {{customer_name}},',
      message: 'We have safely received your returned package for Return Request #{{return_number}} (Order #{{order_number}}) at our fulfillment warehouse. Our quality control team is now inspecting the items.',
      highlight: 'RMA #{{return_number}} Received',
      note: 'As soon as inspection is completed, we will process your {{resolution}} immediately.',
    },
  ),
  starter(
    {
      key: 'REPLACEMENT_CONFIRMED',
      name: 'Replacement Order Confirmed',
      description: 'Confirms creation of complimentary replacement order following return.',
      category: EMAIL_TEMPLATE_CATEGORY.Order,
      subject: 'Replacement Order Confirmed: #{{replacement_order_number}}',
      variables: ['customer_name', 'items_summary', 'original_order_number', 'replacement_order_number', 'return_number'],
      plainTextContent: 'Dear {{customer_name}},\n\nYour replacement order #{{replacement_order_number}} has been created for Return #{{return_number}} (Original Order #{{original_order_number}}).\nItems: {{items_summary}}\n\nWe will update you as soon as your replacement ships.\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}',
    },
    {
      title: 'Replacement Order Confirmed',
      preheader: 'Replacement order #{{replacement_order_number}} confirmed.',
      greeting: 'Dear {{customer_name}},',
      message: 'Your replacement order #{{replacement_order_number}} has been confirmed following Return #{{return_number}} (Original Order #{{original_order_number}}). Replacement items: {{items_summary}}.',
      highlight: 'Order #{{replacement_order_number}}',
      note: 'Your replacement order is now being processed with priority and will be dispatched to your registered delivery address.',
    },
  ),
] as const
