using System.Text.Json;
using pramukhraj.Entities.EmailTemplates;

namespace pramukhraj.Services;

public sealed record DefaultEmailTemplateDefinition(
    string Key,
    string Name,
    string Description,
    EmailTemplateCategory Category,
    string Subject,
    string HtmlContent,
    string PlainTextContent,
    IReadOnlyList<string> Variables,
    string DesignJson);

public static class DefaultEmailTemplates
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private const string BaseHtmlLayout = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{store_name}}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preheader Text (hidden) -->
  <div style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    __PREHEADER__
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:24px 12px 36px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
          <!-- Store Header with Verification & Logo -->
          <tr>
            <td align="center" style="padding:16px 12px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-height:48px;max-width:180px;height:auto;display:inline-block;margin-bottom:6px;border:0;" />
                    <div style="font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:700;color:#991B1B;line-height:1.2;letter-spacing:0.2px;">{{store_name}}</div>
                    <div style="font-family:'Work Sans',Arial,sans-serif;font-size:11px;font-weight:600;color:#D97706;letter-spacing:1.2px;text-transform:uppercase;margin-top:3px;">Pure &bull; Authentic &bull; Verified Store</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;box-shadow:0 4px 14px rgba(17,24,39,0.04);overflow:hidden;">
                <!-- Top Accent Banner -->
                <tr>
                  <td style="height:4px;background:#991B1B;"></td>
                </tr>

                <!-- Card Body -->
                <tr>
                  <td style="padding:32px 28px;">
                    <!-- Category Badge -->
                    <div style="margin-bottom:14px;">
                      <span style="display:inline-block;padding:4px 10px;background:__BADGE_BG__;color:__BADGE_COLOR__;font-family:'Work Sans',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;border-radius:9999px;">__BADGE_TEXT__</span>
                    </div>

                    <!-- Title -->
                    <h1 style="margin:0 0 18px;font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:700;line-height:1.3;color:#111827;">__TITLE__</h1>

                    <!-- Body Text / Tables -->
                    <div style="font-family:'Work Sans',Arial,sans-serif;font-size:15px;line-height:1.65;color:#374151;">
                      __BODY__
                    </div>

                    __BUTTON__
                    __NOTE__
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Details -->
          <tr>
            <td align="center" style="padding:28px 16px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-family:'Work Sans',Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7280;">
                    <p style="margin:0 0 4px;font-weight:600;color:#111827;">{{store_name}}</p>
                    <p style="margin:0 0 8px;color:#6B7280;">{{store_address}}</p>
                    <p style="margin:0 0 10px;color:#6B7280;">
                      Support: <a href="mailto:{{support_email}}" style="color:#991B1B;font-weight:600;text-decoration:none;">{{support_email}}</a> &bull; <a href="tel:{{support_phone}}" style="color:#991B1B;font-weight:600;text-decoration:none;">{{support_phone}}</a>
                    </p>
                    <p style="margin:0;font-size:11px;color:#9CA3AF;">This is an authentic customer notification from {{store_name}}.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""";

    public static readonly IReadOnlyList<DefaultEmailTemplateDefinition> All =
    [
        CreateWelcome(),
        CreateEmailVerificationOtp(),
        CreatePasswordReset(),
        CreateOrderSuccess(),
        CreatePaymentSuccess(),
        CreateInvoice(),
        CreateShipment(),
        CreateDelivered(),
        CreateOrderCancelled(),
        CreateRefundProcessed(),
        CreateReturnRequested(),
        CreateReturnApproved(),
        CreateReturnRejected(),
        CreateReversePickupScheduled(),
        CreateReturnPackageReceived(),
        CreateReplacementOrderConfirmed(),
        CreateSecurityAlert(),
        CreateNewsletter()
    ];

    private static string WrapHtml(
        string preheader,
        string badgeText,
        string badgeBg,
        string badgeColor,
        string title,
        string bodyContent,
        string? buttonText = null,
        string? buttonUrl = null,
        string? noteText = null)
    {
        var buttonHtml = !string.IsNullOrWhiteSpace(buttonText) && !string.IsNullOrWhiteSpace(buttonUrl)
            ? $"""
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="{buttonUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:#991B1B;color:#FFFFFF;font-family:'Work Sans',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:9999px;box-shadow:0 2px 6px rgba(153,27,27,0.25);">
                      {buttonText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              """
            : string.Empty;

        var noteHtml = !string.IsNullOrWhiteSpace(noteText)
            ? $"""
              <p style="margin:16px 0 0;font-family:'Work Sans',Arial,sans-serif;font-size:12px;line-height:1.5;color:#6B7280;text-align:center;">
                {noteText}
              </p>
              """
            : string.Empty;

        return BaseHtmlLayout
            .Replace("__PREHEADER__", preheader)
            .Replace("__BADGE_BG__", badgeBg)
            .Replace("__BADGE_COLOR__", badgeColor)
            .Replace("__BADGE_TEXT__", badgeText)
            .Replace("__TITLE__", title)
            .Replace("__BODY__", bodyContent)
            .Replace("__BUTTON__", buttonHtml)
            .Replace("__NOTE__", noteHtml);
    }

    private static string BuildDesignJson(
        string key, string title, string preheader, string message, string? highlight = null, bool isCode = false, string? actionLabel = null, string? actionUrl = null, string? note = null)
    {
        var prefix = key.ToLowerInvariant();
        var rows = new List<object>
        {
            new
            {
                id = $"{prefix}_brand",
                cells = new[] { 1 },
                columns = new object[]
                {
                    new
                    {
                        id = $"{prefix}_brand_col",
                        contents = new object[]
                        {
                            new
                            {
                                id = $"{prefix}_brand_text",
                                type = "text",
                                values = new
                                {
                                    containerPadding = "24px 30px 14px",
                                    fontSize = "22px",
                                    textAlign = "center",
                                    lineHeight = "140%",
                                    text = "<p style=\"margin:0;text-align:center;font-family:'Fraunces',Georgia,serif;color:#991B1B;font-size:24px;font-weight:700;\">{{store_name}}</p><p style=\"margin:4px 0 0;text-align:center;color:#D97706;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;\">Pure &bull; Authentic &bull; Verified Store</p>"
                                }
                            }
                        }
                    }
                }
            },
            new
            {
                id = $"{prefix}_title",
                cells = new[] { 1 },
                columns = new object[]
                {
                    new
                    {
                        id = $"{prefix}_title_col",
                        contents = new object[]
                        {
                            new
                            {
                                id = $"{prefix}_title_text",
                                type = "text",
                                values = new
                                {
                                    containerPadding = "16px 30px 12px",
                                    fontSize = "24px",
                                    textAlign = "center",
                                    lineHeight = "130%",
                                    text = $"<h1 style=\"margin:0;font-family:'Fraunces',Georgia,serif;color:#111827;font-size:24px;line-height:1.3;text-align:center;\">{title}</h1>"
                                }
                            }
                        }
                    }
                }
            },
            new
            {
                id = $"{prefix}_message",
                cells = new[] { 1 },
                columns = new object[]
                {
                    new
                    {
                        id = $"{prefix}_msg_col",
                        contents = new object[]
                        {
                            new
                            {
                                id = $"{prefix}_msg_text",
                                type = "text",
                                values = new
                                {
                                    containerPadding = "12px 30px",
                                    fontSize = "15px",
                                    textAlign = "left",
                                    lineHeight = "160%",
                                    text = $"<p style=\"margin:0;font-family:'Work Sans',Arial,sans-serif;color:#374151;\">{message}</p>"
                                }
                            }
                        }
                    }
                }
            }
        };

        if (!string.IsNullOrWhiteSpace(highlight))
        {
            var fontStyle = isCode
                ? "font-family:'IBM Plex Mono',Courier,monospace;font-size:28px;letter-spacing:6px;color:#991B1B;"
                : "font-family:'Work Sans',Arial,sans-serif;font-size:18px;font-weight:700;color:#111827;";
            rows.Add(new
            {
                id = $"{prefix}_highlight",
                cells = new[] { 1 },
                columns = new object[]
                {
                    new
                    {
                        id = $"{prefix}_hl_col",
                        contents = new object[]
                        {
                            new
                            {
                                id = $"{prefix}_hl_text",
                                type = "text",
                                values = new
                                {
                                    containerPadding = "16px 30px",
                                    textAlign = "center",
                                    text = $"<p style=\"margin:0;text-align:center;font-weight:700;{fontStyle}\">{highlight}</p>"
                                }
                            }
                        }
                    }
                }
            });
        }

        if (!string.IsNullOrWhiteSpace(actionLabel) && !string.IsNullOrWhiteSpace(actionUrl))
        {
            rows.Add(new
            {
                id = $"{prefix}_action",
                cells = new[] { 1 },
                columns = new object[]
                {
                    new
                    {
                        id = $"{prefix}_act_col",
                        contents = new object[]
                        {
                            new
                            {
                                id = $"{prefix}_act_btn",
                                type = "button",
                                values = new
                                {
                                    containerPadding = "16px 30px 24px",
                                    href = new { name = "web", values = new { href = actionUrl, target = "_blank" } },
                                    buttonColors = new { color = "#ffffff", backgroundColor = "#991b1b", hoverColor = "#ffffff", hoverBackgroundColor = "#7f1d1d" },
                                    fontSize = "14px",
                                    fontWeight = "600",
                                    textAlign = "center",
                                    padding = "13px 28px",
                                    borderRadius = "9999px",
                                    text = $"<span>{actionLabel}</span>"
                                }
                            }
                        }
                    }
                }
            });
        }

        if (!string.IsNullOrWhiteSpace(note))
        {
            rows.Add(new
            {
                id = $"{prefix}_note",
                cells = new[] { 1 },
                columns = new object[]
                {
                    new
                    {
                        id = $"{prefix}_note_col",
                        contents = new object[]
                        {
                            new
                            {
                                id = $"{prefix}_note_text",
                                type = "text",
                                values = new
                                {
                                    containerPadding = "8px 30px 20px",
                                    fontSize = "12px",
                                    textAlign = "center",
                                    lineHeight = "150%",
                                    text = $"<p style=\"margin:0;color:#6B7280;font-size:12px;\">{note}</p>"
                                }
                            }
                        }
                    }
                }
            });
        }

        rows.Add(new
        {
            id = $"{prefix}_footer",
            cells = new[] { 1 },
            columns = new object[]
            {
                new
                {
                    id = $"{prefix}_ft_col",
                    contents = new object[]
                    {
                        new
                        {
                            id = $"{prefix}_ft_text",
                            type = "text",
                            values = new
                            {
                                containerPadding = "22px 30px",
                                fontSize = "12px",
                                textAlign = "center",
                                lineHeight = "160%",
                                text = "<p style=\"margin:0;color:#6B7280;font-size:12px;\"><strong>{{store_name}}</strong><br/>{{store_address}}<br/>Support: {{support_email}} | {{support_phone}}</p>"
                            }
                        }
                    }
                }
            }
        });

        var root = new
        {
            counters = new
            {
                u_row = rows.Count,
                u_column = rows.Count,
                u_content_text = rows.Count - (string.IsNullOrWhiteSpace(actionLabel) ? 0 : 1),
                u_content_button = string.IsNullOrWhiteSpace(actionLabel) ? 0 : 1
            },
            body = new
            {
                id = $"{prefix}_body",
                rows,
                headers = Array.Empty<object>(),
                footers = Array.Empty<object>(),
                values = new
                {
                    contentWidth = "600px",
                    fontFamily = new { label = "Arial", value = "arial,helvetica,sans-serif" },
                    textColor = "#111827",
                    backgroundColor = "#F8FAFC",
                    preheaderText = preheader
                }
            },
            schemaVersion = 21
        };

        return JsonSerializer.Serialize(root, JsonOptions);
    }

    private static DefaultEmailTemplateDefinition CreateWelcome() => new(
        Key: EmailTemplateKeys.Welcome,
        Name: "Welcome to Store",
        Description: "Welcomes a customer upon account creation.",
        Category: EmailTemplateCategory.Account,
        Subject: "Welcome to {{store_name}}, {{customer_name}}!",
        HtmlContent: WrapHtml(
            preheader: "Your account is ready at {{store_name}}.",
            badgeText: "WELCOME ABOARD",
            badgeBg: "#FEF2F2",
            badgeColor: "#991B1B",
            title: "Welcome to {{store_name}}!",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Thank you for joining our culinary family! We are dedicated to crafting authentic, delicious foods made with uncompromised quality and traditional touch.</p><p style=\"margin:0 0 16px;\">Your account ({{customer_email}}) is now ready. Start exploring our traditional snacks, freshly prepared delicacies, and sweet treats right away.</p>",
            buttonText: "Start Exploring",
            buttonUrl: "{{store_url}}",
            noteText: "You are receiving this transactional message because an account was created at {{store_name}} with {{customer_email}}."),
        PlainTextContent: "Dear {{customer_name}},\n\nWelcome to {{store_name}}! We are delighted to have you with us.\nYour account ({{customer_email}}) is ready.\n\nExplore our store: {{store_url}}\n\nNeed assistance? Contact us at {{support_email}} or {{support_phone}}.\n{{store_name}} - {{store_address}}",
        Variables: ["customer_email", "customer_name", "store_address", "store_logo_url", "store_name", "store_url", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.Welcome,
            "Welcome to {{store_name}}!",
            "Your account is ready at {{store_name}}.",
            "Welcome {{customer_name}}! Discover authentic flavors carefully prepared and delivered to your doorstep.",
            actionLabel: "Start Exploring",
            actionUrl: "{{store_url}}",
            note: "Account email: {{customer_email}}"));

    private static DefaultEmailTemplateDefinition CreateEmailVerificationOtp() => new(
        Key: EmailTemplateKeys.EmailVerificationOtp,
        Name: "Email Verification OTP",
        Description: "Sends a one-time verification passcode to verify a customer email address.",
        Category: EmailTemplateCategory.Account,
        Subject: "{{otp_code}} is your {{store_name}} verification code",
        HtmlContent: WrapHtml(
            preheader: "Use one-time verification code {{otp_code}} to verify your email.",
            badgeText: "SECURITY VERIFICATION",
            badgeBg: "#FEF2F2",
            badgeColor: "#991B1B",
            title: "Verify Your Email Address",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Please enter the following one-time verification code to confirm your email address and protect your account:</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;\"><tr><td align=\"center\"><div style=\"display:inline-block;padding:16px 36px;background:#F8FAFC;border:2px dashed #991B1B;border-radius:12px;font-family:'IBM Plex Mono',Courier,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#991B1B;\">{{otp_code}}</div></td></tr></table><p style=\"margin:0 0 6px;text-align:center;font-size:13px;color:#6B7280;\">This code expires in <strong>{{expires_in}} minutes</strong>.</p>",
            noteText: "Never share this code with anyone. If you did not request this verification, you can safely ignore this email."),
        PlainTextContent: "Dear {{customer_name}},\n\nYour one-time email verification code for {{store_name}} is:\n\n{{otp_code}}\n(or {{verification_code}})\n\nThis code expires in {{expires_in}} minutes ({{expires_in_minutes}} min).\nNever share this code with anyone.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "expires_in", "expires_in_minutes", "otp_code", "store_address", "store_logo_url", "store_name", "support_email", "support_phone", "verification_code"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.EmailVerificationOtp,
            "Verify Your Email Address",
            "Your verification code is {{otp_code}}",
            "Dear {{customer_name}}, enter this verification code to verify your email address at {{store_name}}:",
            highlight: "{{otp_code}}",
            isCode: true,
            note: "This code expires in {{expires_in}} minutes. Never share this code with anyone."));

    private static DefaultEmailTemplateDefinition CreatePasswordReset() => new(
        Key: EmailTemplateKeys.PasswordReset,
        Name: "Password Reset Request",
        Description: "Sends a secure link to reset an account password.",
        Category: EmailTemplateCategory.Account,
        Subject: "Reset your {{store_name}} password",
        HtmlContent: WrapHtml(
            preheader: "A secure request to reset your password.",
            badgeText: "PASSWORD ASSISTANCE",
            badgeBg: "#FEF2F2",
            badgeColor: "#991B1B",
            title: "Reset Your Password",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">We received a request to reset the password associated with your account at {{store_name}}. Click the button below to establish a new password:</p>",
            buttonText: "Reset My Password",
            buttonUrl: "{{reset_url}}",
            noteText: "This link expires in {{expires_in}} minutes. If you did not request a password reset, no further action is necessary."),
        PlainTextContent: "Dear {{customer_name}},\n\nWe received a request to reset your password at {{store_name}}.\nReset link: {{reset_url}}\n\nThis link is valid for {{expires_in}} minutes.\nIf you did not make this request, please disregard this email.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "expires_in", "reset_url", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.PasswordReset,
            "Reset Your Password",
            "Secure link to reset your password.",
            "Dear {{customer_name}}, click below to set a new password for your {{store_name}} account.",
            actionLabel: "Reset Password",
            actionUrl: "{{reset_url}}",
            note: "Link expires in {{expires_in}} minutes. If you did not request this, no action is needed."));

    private static DefaultEmailTemplateDefinition CreateOrderSuccess() => new(
        Key: EmailTemplateKeys.OrderSuccess,
        Name: "Order Confirmation",
        Description: "Confirms order placement and summarizes order details.",
        Category: EmailTemplateCategory.Order,
        Subject: "Order Confirmed: #{{order_number}} - {{store_name}}",
        HtmlContent: WrapHtml(
            preheader: "Your order #{{order_number}} is confirmed.",
            badgeText: "ORDER CONFIRMED",
            badgeBg: "#ECFDF5",
            badgeColor: "#047857",
            title: "Order #{{order_number}} Confirmed!",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Thank you for your order! We have safely received your order <strong>#{{order_number}}</strong> for a total of <strong>{{order_total}}</strong>.</p><p style=\"margin:0 0 16px;\">Our kitchen and fulfillment team is already preparing your items with traditional recipes and premium ingredients. We will notify you as soon as your parcel ships!</p>",
            buttonText: "View Order Status",
            buttonUrl: "{{order_url}}",
            noteText: "You can track the progress of your order at any time using the link above."),
        PlainTextContent: "Dear {{customer_name}},\n\nThank you for ordering with {{store_name}}!\nOrder #{{order_number}} has been confirmed.\nTotal: {{order_total}}\n\nTrack your order: {{order_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "order_number", "order_total", "order_url", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.OrderSuccess,
            "Order Confirmed!",
            "Your order #{{order_number}} is confirmed.",
            "Dear {{customer_name}}, thank you for ordering! Order #{{order_number}} ({{order_total}}) is being prepared.",
            highlight: "Order #{{order_number}}",
            actionLabel: "View Order",
            actionUrl: "{{order_url}}"));

    private static DefaultEmailTemplateDefinition CreatePaymentSuccess() => new(
        Key: EmailTemplateKeys.PaymentSuccess,
        Name: "Payment Confirmation",
        Description: "Confirms that customer payment has been captured successfully.",
        Category: EmailTemplateCategory.Payment,
        Subject: "Payment Received for Order #{{order_number}}",
        HtmlContent: WrapHtml(
            preheader: "Payment of {{amount}} confirmed for order #{{order_number}}.",
            badgeText: "PAYMENT RECEIVED",
            badgeBg: "#ECFDF5",
            badgeColor: "#047857",
            title: "Payment Received",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">We have successfully received your payment of <strong>{{amount}}</strong> for Order <strong>#{{order_number}}</strong>.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;\"><tr><td style=\"font-size:13px;color:#4B5563;\">Transaction / Payment ID:</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#111827;\">{{payment_id}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Amount Paid:</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:#047857;padding-top:8px;\">{{amount}}</td></tr></table>",
            buttonText: "View Your Order",
            buttonUrl: "{{order_url}}",
            noteText: "A copy of this payment receipt is stored in your account history."),
        PlainTextContent: "Dear {{customer_name}},\n\nPayment received for Order #{{order_number}}!\nAmount: {{amount}}\nPayment Reference: {{payment_id}}\n\nView order: {{order_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["amount", "customer_name", "order_number", "order_url", "payment_id", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.PaymentSuccess,
            "Payment Received",
            "Payment of {{amount}} confirmed.",
            "Dear {{customer_name}}, we received your payment of {{amount}} for order #{{order_number}}.",
            highlight: "Payment ID: {{payment_id}}",
            actionLabel: "View Order",
            actionUrl: "{{order_url}}"));

    private static DefaultEmailTemplateDefinition CreateInvoice() => new(
        Key: EmailTemplateKeys.Invoice,
        Name: "Order Receipt / Bill of Supply",
        Description: "Official bill of supply / order receipt with tax-inclusive pricing.",
        Category: EmailTemplateCategory.Order,
        Subject: "Order Receipt for #{{order_number}} - {{store_name}}",
        HtmlContent: WrapHtml(
            preheader: "Bill of Supply for order #{{order_number}} is available.",
            badgeText: "BILL OF SUPPLY",
            badgeBg: "#EFF6FF",
            badgeColor: "#1E40AF",
            title: "Your Order Receipt is Ready",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Your official Bill of Supply / Order Receipt <strong>#{{invoice_number}}</strong> for Order <strong>#{{order_number}}</strong> has been generated.</p><p style=\"margin:0 0 16px;font-size:13px;color:#6B7280;\">As an unregistered business entity, all prices on your bill are flat, final, and all-inclusive. You can view or download the complete receipt below:</p>",
            buttonText: "Download Receipt",
            buttonUrl: "{{invoice_url}}",
            noteText: "Receipt Number: {{invoice_number}} &bull; Order Reference: #{{order_number}}"),
        PlainTextContent: "Dear {{customer_name}},\n\nYour order receipt / bill of supply for order #{{order_number}} is ready.\nReceipt Number: {{invoice_number}}\nView or download: {{invoice_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "invoice_number", "invoice_url", "order_number", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.Invoice,
            "Your Order Receipt",
            "Bill of Supply for order #{{order_number}}.",
            "Dear {{customer_name}}, your order receipt for order #{{order_number}} (Receipt #{{invoice_number}}) is ready.",
            highlight: "Receipt #{{invoice_number}}",
            actionLabel: "View Receipt",
            actionUrl: "{{invoice_url}}"));

    private static DefaultEmailTemplateDefinition CreateShipment() => new(
        Key: EmailTemplateKeys.Shipment,
        Name: "Order Dispatched",
        Description: "Notifies customer when their order is on the way with courier tracking.",
        Category: EmailTemplateCategory.Shipping,
        Subject: "Your {{store_name}} order #{{order_number}} is on the way!",
        HtmlContent: WrapHtml(
            preheader: "Order #{{order_number}} has been dispatched with tracking #{{tracking_number}}.",
            badgeText: "ORDER DISPATCHED",
            badgeBg: "#EFF6FF",
            badgeColor: "#1E40AF",
            title: "Your Order is On Its Way!",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Great news! Your order <strong>#{{order_number}}</strong> has been handed over to our courier partner and is en route to your delivery address.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;\"><tr><td style=\"font-size:13px;color:#4B5563;\">Courier Partner:</td><td align=\"right\" style=\"font-size:13px;font-weight:600;color:#111827;\">{{courier_name}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">AWB / Tracking Number:</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#991B1B;padding-top:8px;\">{{tracking_number}}</td></tr></table>",
            buttonText: "Track Parcel Live",
            buttonUrl: "{{tracking_url}}",
            noteText: "Tracking scans may take up to a few hours to update on the courier portal."),
        PlainTextContent: "Dear {{customer_name}},\n\nYour order #{{order_number}} is on its way!\nCourier: {{courier_name}}\nAWB Tracking: {{tracking_number}}\n\nTrack parcel: {{tracking_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["courier_name", "customer_name", "order_number", "store_address", "store_logo_url", "store_name", "support_email", "support_phone", "tracking_number", "tracking_url"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.Shipment,
            "Your Order Has Shipped!",
            "Track your package: {{tracking_number}}",
            "Dear {{customer_name}}, order #{{order_number}} has been dispatched with {{courier_name}}.",
            highlight: "Tracking #{{tracking_number}}",
            actionLabel: "Track Package",
            actionUrl: "{{tracking_url}}"));

    private static DefaultEmailTemplateDefinition CreateDelivered() => new(
        Key: EmailTemplateKeys.Delivered,
        Name: "Order Delivered",
        Description: "Confirms delivery and invites customer feedback.",
        Category: EmailTemplateCategory.Shipping,
        Subject: "Delivered: Your {{store_name}} order #{{order_number}}",
        HtmlContent: WrapHtml(
            preheader: "Order #{{order_number}} has been delivered.",
            badgeText: "DELIVERED",
            badgeBg: "#ECFDF5",
            badgeColor: "#047857",
            title: "Your Order Was Delivered!",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Your package for Order <strong>#{{order_number}}</strong> has been successfully delivered. We hope you and your family thoroughly enjoy every treat!</p><p style=\"margin:0 0 16px;\">If you have any feedback or if anything was less than perfect, please reach out so our team can assist right away.</p>",
            buttonText: "View Your Order",
            buttonUrl: "{{order_url}}",
            noteText: "Did not receive your package? Please check with neighbors or contact {{support_email}}."),
        PlainTextContent: "Dear {{customer_name}},\n\nYour order #{{order_number}} has been successfully delivered!\nWe hope you enjoy every bite.\n\nView order: {{order_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "order_number", "order_url", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.Delivered,
            "Package Delivered!",
            "Order #{{order_number}} was delivered.",
            "Dear {{customer_name}}, your order #{{order_number}} has arrived. Enjoy the authentic taste of {{store_name}}!",
            actionLabel: "View Order",
            actionUrl: "{{order_url}}",
            note: "If you need help with your order, please reply to this email."));

    private static DefaultEmailTemplateDefinition CreateOrderCancelled() => new(
        Key: EmailTemplateKeys.Cancelled,
        Name: "Order Cancelled",
        Description: "Confirms order cancellation and outlines refund details.",
        Category: EmailTemplateCategory.Order,
        Subject: "Order #{{order_number}} has been cancelled",
        HtmlContent: WrapHtml(
            preheader: "Order #{{order_number}} has been cancelled.",
            badgeText: "ORDER CANCELLED",
            badgeBg: "#FEF2F2",
            badgeColor: "#DC2626",
            title: "Order Cancellation Confirmed",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Your order <strong>#{{order_number}}</strong> has been cancelled as requested.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;\"><tr><td style=\"font-size:13px;color:#4B5563;\">Cancellation Reason:</td><td align=\"right\" style=\"font-size:13px;font-weight:500;color:#111827;\">{{cancellation_reason}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Refund Amount:</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:#047857;padding-top:8px;\">{{refund_amount}}</td></tr></table><p style=\"margin:0;font-size:13px;color:#6B7280;\">If you paid online, the refund will be credited back to your original payment method within 5-7 business days.</p>",
            noteText: "If you have questions about your cancellation, our support team is here to assist."),
        PlainTextContent: "Dear {{customer_name}},\n\nYour order #{{order_number}} was cancelled.\nReason: {{cancellation_reason}}\nRefund Amount: {{refund_amount}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["cancellation_reason", "customer_name", "order_number", "refund_amount", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.Cancelled,
            "Order Cancelled",
            "Order #{{order_number}} has been cancelled.",
            "Dear {{customer_name}}, order #{{order_number}} was cancelled as requested. Reason: {{cancellation_reason}}.",
            highlight: "Refund: {{refund_amount}}",
            note: "Refunds typically process back to your payment account within 5-7 business days."));

    private static DefaultEmailTemplateDefinition CreateRefundProcessed() => new(
        Key: EmailTemplateKeys.Refund,
        Name: "Refund Processed",
        Description: "Confirms that a payment refund has been issued to the customer.",
        Category: EmailTemplateCategory.Payment,
        Subject: "Refund Processed: {{refund_amount}} for Order #{{order_number}}",
        HtmlContent: WrapHtml(
            preheader: "Refund of {{refund_amount}} processed for order #{{order_number}}.",
            badgeText: "REFUND PROCESSED",
            badgeBg: "#ECFDF5",
            badgeColor: "#047857",
            title: "Your Refund Has Been Processed",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">We have processed a refund of <strong>{{refund_amount}}</strong> for Order <strong>#{{order_number}}</strong>.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;\"><tr><td style=\"font-size:13px;color:#4B5563;\">Refund Amount:</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:700;color:#047857;\">{{refund_amount}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Gateway Reference ID:</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:13px;color:#111827;padding-top:8px;\">{{refund_id}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Refund Destination:</td><td align=\"right\" style=\"font-size:13px;color:#111827;padding-top:8px;\">{{payment_method}}</td></tr></table><p style=\"margin:0;font-size:13px;color:#6B7280;\">The funds will appear in your bank statement or card balance within 5-7 working days depending on your financial institution.</p>",
            noteText: "Transaction reference: {{refund_id}}"),
        PlainTextContent: "Dear {{customer_name}},\n\nWe have processed your refund of {{refund_amount}} for Order #{{order_number}}.\nReference: {{refund_id}}\nDestination: {{payment_method}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "order_number", "payment_method", "refund_amount", "refund_id", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.Refund,
            "Refund Processed",
            "Refund of {{refund_amount}} processed.",
            "Dear {{customer_name}}, refund of {{refund_amount}} has been issued for order #{{order_number}}.",
            highlight: "{{refund_amount}}",
            note: "Reference: {{refund_id}}. Bank processing may take 5-7 business days."));

    private static DefaultEmailTemplateDefinition CreateReturnRequested() => new(
        Key: EmailTemplateKeys.ReturnRequested,
        Name: "Return Request Acknowledged",
        Description: "Acknowledges receipt of customer return request.",
        Category: EmailTemplateCategory.Shipping,
        Subject: "Return Request Received: #{{return_number}} (Order #{{order_number}})",
        HtmlContent: WrapHtml(
            preheader: "Return request #{{return_number}} for order #{{order_number}} received.",
            badgeText: "RETURN RECEIVED",
            badgeBg: "#FEF3C7",
            badgeColor: "#B45309",
            title: "Return Request Received",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">We have received your return request <strong>#{{return_number}}</strong> for Order <strong>#{{order_number}}</strong>.</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;\"><tr><td style=\"font-size:13px;color:#4B5563;\">Return Reason:</td><td align=\"right\" style=\"font-size:13px;font-weight:600;color:#111827;\">{{reason}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Requested Resolution:</td><td align=\"right\" style=\"font-size:13px;font-weight:600;color:#991B1B;padding-top:8px;\">{{resolution}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Number of Items:</td><td align=\"right\" style=\"font-size:13px;color:#111827;padding-top:8px;\">{{items_count}} item(s)</td></tr></table><p style=\"margin:0;font-size:14px;color:#4B5563;\">Our team is reviewing your request against our store return policy and will update you shortly with next steps.</p>",
            noteText: "Return Request Number: #{{return_number}} &bull; Order Reference: #{{order_number}}"),
        PlainTextContent: "Dear {{customer_name}},\n\nWe have received your return request #{{return_number}} for Order #{{order_number}}.\nReason: {{reason}}\nResolution: {{resolution}}\nItems: {{items_count}}\n\nOur team is reviewing your request and will update you shortly.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "items_count", "order_number", "reason", "resolution", "return_number", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.ReturnRequested,
            "Return Request Received",
            "Return request #{{return_number}} received.",
            "Dear {{customer_name}}, we received your return request #{{return_number}} for order #{{order_number}}. Our team is reviewing it.",
            highlight: "RMA #{{return_number}}",
            note: "We will notify you once your request has been reviewed."));

    private static DefaultEmailTemplateDefinition CreateReturnApproved() => new(
        Key: EmailTemplateKeys.ReturnApproved,
        Name: "Return Request Approved",
        Description: "Approved return notification with complete refund breakdown table and packaging guidelines.",
        Category: EmailTemplateCategory.Shipping,
        Subject: "Return Approved: #{{return_number}} - {{store_name}}",
        HtmlContent: WrapHtml(
            preheader: "Return request #{{return_number}} approved. Net refund: {{net_refund_amount}}.",
            badgeText: "RETURN APPROVED",
            badgeBg: "#ECFDF5",
            badgeColor: "#047857",
            title: "Your Return Request is Approved",
            bodyContent: """
            <p style="margin:0 0 16px;">Dear {{customer_name}},</p>
            <p style="margin:0 0 16px;">We are pleased to inform you that your return request <strong>#{{return_number}}</strong> for Order <strong>#{{order_number}}</strong> has been <strong>Approved</strong>.</p>

            <!-- Complete Financial Refund Summary Breakdown Table -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:20px 0;background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background:#991B1B;color:#FFFFFF;">
                  <th colspan="2" style="padding:12px 16px;text-align:left;font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:600;letter-spacing:0.3px;">Return &amp; Refund Amount Breakdown</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #E5E7EB;">
                  <td style="padding:10px 16px;font-family:'Work Sans',Arial,sans-serif;font-size:13px;color:#4B5563;">Resolution Type</td>
                  <td style="padding:10px 16px;text-align:right;font-family:'Work Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#111827;">{{resolution}}</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;">
                  <td style="padding:10px 16px;font-family:'Work Sans',Arial,sans-serif;font-size:13px;color:#4B5563;">Product Value Refund</td>
                  <td style="padding:10px 16px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#111827;">{{product_refund_amount}}</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;">
                  <td style="padding:10px 16px;font-family:'Work Sans',Arial,sans-serif;font-size:13px;color:#4B5563;">Shipping Charges Refund</td>
                  <td style="padding:10px 16px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#111827;">{{shipping_refund_amount}}</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;">
                  <td style="padding:10px 16px;font-family:'Work Sans',Arial,sans-serif;font-size:13px;color:#4B5563;">Payment Processing Fee Refund</td>
                  <td style="padding:10px 16px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#111827;">{{payment_fee_refund_amount}}</td>
                </tr>
                <tr style="border-bottom:1px solid #E5E7EB;">
                  <td style="padding:10px 16px;font-family:'Work Sans',Arial,sans-serif;font-size:13px;color:#DC2626;">Less: Reverse Shipping Deduction</td>
                  <td style="padding:10px 16px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#DC2626;">-{{reverse_shipping_deduction}}</td>
                </tr>
                <tr style="background:#ECFDF5;border-top:2px solid #059669;">
                  <td style="padding:14px 16px;font-family:'Work Sans',Arial,sans-serif;font-size:14px;font-weight:700;color:#065F46;">Total Net Refund Amount</td>
                  <td style="padding:14px 16px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:700;color:#047857;">{{net_refund_amount}}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin:16px 0;padding:14px 16px;background:#F8FAFC;border-left:4px solid #991B1B;border-radius:4px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#111827;">Returned Items Summary:</p>
              <p style="margin:0;font-size:13px;color:#4B5563;">{{return_items_summary}}</p>
            </div>

            <div style="margin:16px 0;padding:14px 16px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#92400E;">Packaging Guidelines:</p>
              <p style="margin:0;font-size:12px;color:#78350F;line-height:1.5;">Please pack the items securely in their original packaging with all labels intact. Hand over the parcel when our courier executive arrives for reverse pickup.</p>
            </div>

            <div style="margin-top:16px;font-size:12px;color:#6B7280;">
              <p style="margin:0 0 4px;font-weight:600;color:#374151;">Return Facility &amp; Dispatch Warehouse:</p>
              <p style="margin:0;">{{return_facility}}</p>
            </div>
            """,
            noteText: "We will coordinate courier reverse pickup shortly and notify you with tracking details."),
        PlainTextContent: """
        Dear {{customer_name}},

        Your return request #{{return_number}} for Order #{{order_number}} has been Approved.

        RETURN & REFUND AMOUNT SUMMARY BREAKDOWN:
        - Resolution: {{resolution}}
        - Product Value Refund: {{product_refund_amount}}
        - Shipping Charges Refund: {{shipping_refund_amount}}
        - Payment Fee Refund: {{payment_fee_refund_amount}}
        - Less Reverse Shipping Deduction: -{{reverse_shipping_deduction}}
        - TOTAL NET REFUND AMOUNT: {{net_refund_amount}}

        Items to return:
        {{return_items_summary}}

        Return Facility:
        {{return_facility}}

        Please pack the items securely in original packaging for reverse pickup.
        {{store_name}} - {{store_address}}
        Support: {{support_email}} | {{support_phone}}
        """,
        Variables: [
            "customer_name",
            "net_refund_amount",
            "order_number",
            "payment_fee_refund_amount",
            "product_refund_amount",
            "resolution",
            "return_facility",
            "return_items_summary",
            "return_number",
            "reverse_shipping_deduction",
            "shipping_refund_amount",
            "store_address",
            "store_logo_url",
            "store_name",
            "support_email",
            "support_phone"
        ],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.ReturnApproved,
            "Return Request Approved",
            "Return request #{{return_number}} approved. Net refund: {{net_refund_amount}}.",
            "Dear {{customer_name}}, your return request #{{return_number}} for Order #{{order_number}} has been approved. Pack items securely for reverse pickup.",
            highlight: "Net Refund: {{net_refund_amount}}",
            note: "Items: {{return_items_summary}} | Return Facility: {{return_facility}}"));

    private static DefaultEmailTemplateDefinition CreateReturnRejected() => new(
        Key: EmailTemplateKeys.ReturnRejected,
        Name: "Return Request Rejected",
        Description: "Notifies customer when a return request cannot be approved based on store policy.",
        Category: EmailTemplateCategory.Shipping,
        Subject: "Update on Return Request #{{return_number}} (Order #{{order_number}})",
        HtmlContent: WrapHtml(
            preheader: "Update regarding return request #{{return_number}}.",
            badgeText: "RETURN UPDATE",
            badgeBg: "#FEF2F2",
            badgeColor: "#DC2626",
            title: "Update on Return Request",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">After careful review of your return request <strong>#{{return_number}}</strong> for Order <strong>#{{order_number}}</strong>, we regret to inform you that it could not be approved due to our return policy guidelines.</p><div style=\"margin:16px 0;padding:14px 16px;background:#FEF2F2;border-left:4px solid #DC2626;border-radius:4px;\"><p style=\"margin:0 0 4px;font-size:13px;font-weight:600;color:#991B1B;\">Reason for Decision:</p><p style=\"margin:0;font-size:13px;color:#7F1D1D;\">{{rejection_reason}}</p></div><p style=\"margin:0;font-size:13px;color:#4B5563;\">If you have additional information or questions, please reply directly to this email so our team can review further.</p>",
            noteText: "Return Request: #{{return_number}} &bull; Order Reference: #{{order_number}}"),
        PlainTextContent: "Dear {{customer_name}},\n\nYour return request #{{return_number}} for Order #{{order_number}} could not be approved for the following reason:\n{{rejection_reason}}\n\nIf you have questions, please contact our support team.\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "order_number", "rejection_reason", "return_number", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.ReturnRejected,
            "Return Request Update",
            "Update regarding return request #{{return_number}}.",
            "Dear {{customer_name}}, return request #{{return_number}} could not be approved. Reason: {{rejection_reason}}.",
            note: "Reply to this email if you need further clarification."));

    private static DefaultEmailTemplateDefinition CreateReversePickupScheduled() => new(
        Key: EmailTemplateKeys.ReversePickupScheduled,
        Name: "Reverse Pickup Scheduled",
        Description: "Notifies customer with courier details and date for scheduled reverse pickup.",
        Category: EmailTemplateCategory.Shipping,
        Subject: "Reverse Pickup Scheduled for Return #{{return_number}}",
        HtmlContent: WrapHtml(
            preheader: "Reverse pickup scheduled via {{courier_name}}.",
            badgeText: "PICKUP SCHEDULED",
            badgeBg: "#EFF6FF",
            badgeColor: "#1E40AF",
            title: "Reverse Pickup Scheduled",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">A reverse pickup has been scheduled for your return request <strong>#{{return_number}}</strong> (Order <strong>#{{order_number}}</strong>).</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;\"><tr><td style=\"font-size:13px;color:#4B5563;\">Courier Partner:</td><td align=\"right\" style=\"font-size:13px;font-weight:600;color:#111827;\">{{courier_name}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Tracking Number (AWB):</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#991B1B;padding-top:8px;\">{{tracking_number}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Scheduled Date:</td><td align=\"right\" style=\"font-size:13px;font-weight:600;color:#111827;padding-top:8px;\">{{pickup_date}}</td></tr></table><p style=\"margin:0;font-size:13px;color:#4B5563;\">Please hand over the securely packed package to the courier executive upon arrival.</p>",
            noteText: "Please keep parcel ready with all original tags and packing."),
        PlainTextContent: "Dear {{customer_name}},\n\nA reverse pickup has been scheduled for your return #{{return_number}} (Order #{{order_number}}).\nCourier: {{courier_name}}\nAWB Tracking: {{tracking_number}}\nScheduled Date: {{pickup_date}}\n\nPlease hand over the package to the pickup executive.\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["courier_name", "customer_name", "order_number", "pickup_date", "return_number", "store_address", "store_logo_url", "store_name", "support_email", "support_phone", "tracking_number"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.ReversePickupScheduled,
            "Reverse Pickup Scheduled",
            "Pickup scheduled via {{courier_name}}.",
            "Dear {{customer_name}}, reverse pickup for Return #{{return_number}} has been scheduled via {{courier_name}} on {{pickup_date}}.",
            highlight: "AWB: {{tracking_number}}",
            note: "Please keep the package securely packed for pickup."));

    private static DefaultEmailTemplateDefinition CreateReturnPackageReceived() => new(
        Key: EmailTemplateKeys.ReturnPackageReceived,
        Name: "Return Package Received at Warehouse",
        Description: "Confirms package delivered to facility and QC inspection underway.",
        Category: EmailTemplateCategory.Shipping,
        Subject: "Return Package Received: #{{return_number}} at Warehouse",
        HtmlContent: WrapHtml(
            preheader: "Package for return #{{return_number}} received at warehouse.",
            badgeText: "PACKAGE RECEIVED",
            badgeBg: "#ECFDF5",
            badgeColor: "#047857",
            title: "Package Received at Warehouse",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">We have safely received your returned package for Return Request <strong>#{{return_number}}</strong> (Order <strong>#{{order_number}}</strong>) at our fulfillment warehouse.</p><p style=\"margin:0 0 16px;\">Our quality control team is now inspecting the items. As soon as the inspection is completed, we will process your <strong>{{resolution}}</strong> immediately.</p>",
            noteText: "We will notify you immediately once inspection is completed."),
        PlainTextContent: "Dear {{customer_name}},\n\nWe have safely received your returned package for Return Request #{{return_number}} (Order #{{order_number}}).\nOur quality control team is inspecting the items and will process your {{resolution}} shortly.\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "order_number", "resolution", "return_number", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.ReturnPackageReceived,
            "Package Received at Warehouse",
            "Return package for #{{return_number}} received.",
            "Dear {{customer_name}}, we received your returned parcel for Return #{{return_number}}. Our QC team is inspecting the items for your {{resolution}}.",
            note: "Quality control inspection is underway."));

    private static DefaultEmailTemplateDefinition CreateReplacementOrderConfirmed() => new(
        Key: EmailTemplateKeys.ReplacementConfirmed,
        Name: "Replacement Order Confirmed",
        Description: "Confirms creation of complimentary replacement order following return.",
        Category: EmailTemplateCategory.Order,
        Subject: "Replacement Order Confirmed: #{{replacement_order_number}}",
        HtmlContent: WrapHtml(
            preheader: "Replacement order #{{replacement_order_number}} confirmed.",
            badgeText: "REPLACEMENT CONFIRMED",
            badgeBg: "#ECFDF5",
            badgeColor: "#047857",
            title: "Replacement Order Confirmed",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">Your replacement order <strong>#{{replacement_order_number}}</strong> has been created following your Return Request <strong>#{{return_number}}</strong> (Original Order <strong>#{{original_order_number}}</strong>).</p><div style=\"margin:16px 0;padding:14px 16px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;\"><p style=\"margin:0 0 6px 0;font-size:13px;font-weight:600;color:#111827;\">Replacement Items:</p><p style=\"margin:0;font-size:13px;color:#4B5563;\">{{items_summary}}</p></div><p style=\"margin:0;font-size:13px;color:#4B5563;\">We are preparing your fresh replacement items for dispatch and will send tracking information once shipped.</p>",
            noteText: "Replacement Order #{{replacement_order_number}} &bull; Zero Charge Order"),
        PlainTextContent: "Dear {{customer_name}},\n\nYour replacement order #{{replacement_order_number}} has been created for Return #{{return_number}} (Original Order #{{original_order_number}}).\nItems: {{items_summary}}\n\nWe will update you as soon as your replacement ships.\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "items_summary", "original_order_number", "replacement_order_number", "return_number", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.ReplacementConfirmed,
            "Replacement Order Confirmed",
            "Replacement order #{{replacement_order_number}} confirmed.",
            "Dear {{customer_name}}, replacement order #{{replacement_order_number}} is confirmed for Return #{{return_number}}.",
            highlight: "Order #{{replacement_order_number}}",
            note: "Items: {{items_summary}}"));

    private static DefaultEmailTemplateDefinition CreateSecurityAlert() => new(
        Key: EmailTemplateKeys.SecurityAlert,
        Name: "Account Security Alert",
        Description: "Alerts customer of sensitive account events such as password change or unexpected login.",
        Category: EmailTemplateCategory.System,
        Subject: "Security Alert for your {{store_name}} Account",
        HtmlContent: WrapHtml(
            preheader: "Important security notice regarding your account.",
            badgeText: "SECURITY NOTICE",
            badgeBg: "#FEF2F2",
            badgeColor: "#DC2626",
            title: "Security Alert",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">We detected sensitive activity on your {{store_name}} account:</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;\"><tr><td style=\"font-size:13px;color:#4B5563;\">Activity:</td><td align=\"right\" style=\"font-size:13px;font-weight:600;color:#111827;\">{{activity}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Timestamp:</td><td align=\"right\" style=\"font-family:'IBM Plex Mono',monospace;font-size:13px;color:#111827;padding-top:8px;\">{{activity_time}}</td></tr><tr><td style=\"font-size:13px;color:#4B5563;padding-top:8px;\">Location:</td><td align=\"right\" style=\"font-size:13px;color:#111827;padding-top:8px;\">{{location}}</td></tr></table>",
            buttonText: "Review Account Security",
            buttonUrl: "{{security_url}}",
            noteText: "If this was you, no action is needed. If you did not make this change, please secure your account immediately."),
        PlainTextContent: "Dear {{customer_name}},\n\nSecurity notice for {{store_name}}:\nActivity: {{activity}}\nTime: {{activity_time}}\nLocation: {{location}}\n\nReview account security: {{security_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["activity", "activity_time", "customer_name", "location", "security_url", "store_address", "store_logo_url", "store_name", "support_email", "support_phone"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.SecurityAlert,
            "Security Alert",
            "Security notice for your {{store_name}} account.",
            "Dear {{customer_name}}, we noticed {{activity}} at {{activity_time}} from {{location}}.",
            actionLabel: "Review Account",
            actionUrl: "{{security_url}}",
            note: "If this wasn't you, reset your password immediately."));

    private static DefaultEmailTemplateDefinition CreateNewsletter() => new(
        Key: EmailTemplateKeys.Newsletter,
        Name: "Store Newsletter & Offers",
        Description: "Branded layout for announcements, seasonal delicacies, and customer offers.",
        Category: EmailTemplateCategory.Marketing,
        Subject: "Fresh Delights & Offers from {{store_name}}",
        HtmlContent: WrapHtml(
            preheader: "{{featured_title}} - Handcrafted delicacies from {{store_name}}.",
            badgeText: "SPECIAL HIGHLIGHT",
            badgeBg: "#FEF3C7",
            badgeColor: "#B45309",
            title: "{{featured_title}}",
            bodyContent: "<p style=\"margin:0 0 16px;\">Dear {{customer_name}},</p><p style=\"margin:0 0 16px;\">{{featured_description}}</p>",
            buttonText: "Explore Collection",
            buttonUrl: "{{featured_url}}",
            noteText: "You received this newsletter because you opted in to updates from {{store_name}}. To unsubscribe: {{unsubscribe_url}}"),
        PlainTextContent: "Dear {{customer_name}},\n\n{{featured_title}}\n\n{{featured_description}}\n\nExplore collection: {{featured_url}}\nUnsubscribe: {{unsubscribe_url}}\n\n{{store_name}} - {{store_address}}\nSupport: {{support_email}} | {{support_phone}}",
        Variables: ["customer_name", "featured_description", "featured_title", "featured_url", "store_address", "store_logo_url", "store_name", "support_email", "support_phone", "unsubscribe_url"],
        DesignJson: BuildDesignJson(
            EmailTemplateKeys.Newsletter,
            "{{featured_title}}",
            "{{featured_title}} - Discover handcrafted delicacies.",
            "Dear {{customer_name}}, {{featured_description}}",
            actionLabel: "Discover Now",
            actionUrl: "{{featured_url}}",
            note: "Unsubscribe: {{unsubscribe_url}}"));
}
