import type { RazorpayCheckoutData, RazorpaySuccess } from "../types/payment.types";

type RazorpayOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name: string; email?: string; contact: string };
  theme: { color: string }; modal: { ondismiss: () => void; escape: boolean; backdropclose: boolean };
  config: { display: { blocks: Record<string, { name: string; instruments: Array<{ method: "upi" | "card" }> }>; sequence: string[]; preferences: { show_default_blocks: boolean } } };
  handler: (response: RazorpaySuccess) => void;
};

declare global {
  interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void } }
}

let loader: Promise<void> | null = null;

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Secure payment checkout could not be loaded."));
    document.head.appendChild(script);
  });
  return loader;
}

export async function openRazorpay(data: RazorpayCheckoutData): Promise<RazorpaySuccess> {
  await loadRazorpay();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Secure payment checkout is unavailable.");
  const enabledMethods = [
    data.isUpiPaymentEnabled ? { code: "upi", name: "Pay via UPI", method: "upi" as const } : null,
    data.isCardPaymentEnabled ? { code: "card", name: "Pay via card", method: "card" as const } : null,
  ].filter((item): item is { code: string; name: string; method: "upi" | "card" } => item !== null);
  if (enabledMethods.length === 0) throw new Error("No payment method is currently available.");
  return new Promise((resolve, reject) => {
    let lastFailureReason: string | null = null;
    let isSettled = false;

    const checkout = new Razorpay({
      key: data.keyId,
      amount: data.amountPaise,
      currency: data.currency,
      name: data.storeName,
      description: `Payment for ${data.orderNumber}`,
      order_id: data.razorpayOrderId,
      prefill: { name: data.customerName, email: data.customerEmail ?? undefined, contact: data.customerMobile },
      theme: { color: "#7f1d1d" },
      config: {
        display: {
          blocks: Object.fromEntries(enabledMethods.map(item => [item.code, { name: item.name, instruments: [{ method: item.method }] }])),
          sequence: enabledMethods.map(item => `block.${item.code}`),
          preferences: { show_default_blocks: false },
        },
      },
      modal: {
        escape: true,
        backdropclose: false,
        ondismiss: () => {
          if (isSettled) return;
          isSettled = true;
          reject(new Error(lastFailureReason || "Payment was cancelled. Your order is reserved for a short time."));
        },
      },
      handler: (response: RazorpaySuccess) => {
        if (isSettled) return;
        isSettled = true;
        resolve(response);
      },
    });

    checkout.on("payment.failed", response => {
      // NOTE: Razorpay's modal remains open upon a failed payment attempt, allowing the customer to retry.
      // We must not reject the promise here; we only record the error description so that if the customer
      // closes/dismisses the modal without succeeding, the error message is communicated to them.
      lastFailureReason = response.error?.description || "Payment failed. You can retry safely.";
    });

    checkout.open();
  });
}
