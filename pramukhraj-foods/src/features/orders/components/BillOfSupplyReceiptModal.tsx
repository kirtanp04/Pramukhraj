import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X, FileCheck, ShieldCheck } from "lucide-react";
import { formatDateTime, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { CustomerOrderDetail } from "../types/order.types";

interface BillOfSupplyReceiptModalProps {
  order: CustomerOrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillOfSupplyReceiptModal({
  order,
  open,
  onOpenChange,
}: BillOfSupplyReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const shipping = order.shippingAddress;
  const billing = order.billingAddress || shipping;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-xs print:hidden" />
        <Dialog.Content className="fixed inset-4 z-[101] m-auto max-h-[92vh] max-w-3xl overflow-y-auto rounded-2xl bg-ivory p-6 shadow-2xl md:p-8 print:inset-0 print:max-h-none print:max-w-none print:rounded-none print:bg-white print:p-8 print:shadow-none">
          {/* Top Actions (Hidden in print) */}
          <div className="flex items-center justify-between border-b border-ink/10 pb-4 print:hidden">
            <div className="flex items-center gap-2">
              <FileCheck size={20} className="text-oxblood" />
              <Dialog.Title className="font-display text-lg! font-semibold text-ink">
                Bill of Supply / Order Receipt
              </Dialog.Title>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs!"
              >
                <Printer size={14} />
                <span>Print Receipt</span>
              </Button>
              <Dialog.Close asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Close"
                  className="h-8 w-8 p-0"
                >
                  <X size={14} />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          <Dialog.Description className="sr-only">
            Official Bill of Supply and Order Receipt for Order #{order.orderNumber}
          </Dialog.Description>

          {/* Printable Receipt Sheet */}
          <div className="pt-6 space-y-6 text-ink print:pt-0">
            {/* Store Header & Document Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
              <div>
                <h1 className="font-display text-2xl! font-bold tracking-tight text-oxblood">
                  {order.storeName || "Pramukhraj Foods"}
                </h1>
                <p className="text-xs! text-ink-soft mt-0.5">
                  Pure & Authentic Food Products
                </p>
                {order.storeAddress && (
                  <p className="text-[11px]! text-ink-soft mt-0.5 whitespace-pre-line">
                    Dispatch Facility: {order.storeAddress}
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <span className="inline-block rounded-md bg-ink/5 px-2.5 py-1 text-xs! font-bold uppercase tracking-wider text-ink border border-ink/10">
                  Bill of Supply
                </span>
                <p className="text-[11px]! text-ink-soft mt-1">
                  Order Receipt
                </p>
              </div>
            </div>

            {/* Legal Notice Box (Section 32 CGST Act / Rule 49) */}
            <div className="rounded-xl border border-teal/20 bg-teal/5 p-3 text-xs! leading-relaxed text-teal print:border-ink/20 print:bg-transparent print:text-ink">
              <p className="font-semibold uppercase tracking-wider text-[10px]!">
                Statutory Declaration (CGST Act, 2017)
              </p>
              <p className="mt-0.5">
                <strong>Unregistered dealer under Section 32 of the CGST Act, 2017.</strong> Not entitled to collect tax on supplies. All prices quoted and charged are <strong>inclusive of all taxes</strong>.
              </p>
            </div>

            {/* Order & Customer Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs! rounded-xl bg-ivory-dim p-4 border border-ink/5 print:bg-transparent print:border-ink/10">
              <div className="space-y-1">
                <p className="text-ink-soft">Order Number:</p>
                <p className="font-mono font-bold text-sm! text-ink">
                  {order.orderNumber}
                </p>
                <p className="text-ink-soft pt-1">Date of Issue:</p>
                <p className="font-medium text-ink">
                  {formatDateTime(order.orderDate)}
                </p>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-ink-soft">Payment Status:</p>
                <p className="font-medium text-emerald-700 capitalize">
                  {order.paymentStatus} (Prepaid Online)
                </p>
                <p className="text-ink-soft pt-1">GSTIN / Tax ID:</p>
                <p className="font-mono text-ink-soft">
                  Not Applicable (Unregistered)
                </p>
              </div>
            </div>

            {/* Addresses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs!">
              {/* Shipping Address */}
              <div className="rounded-xl border border-ink/10 p-4 space-y-1">
                <p className="font-semibold text-ink uppercase tracking-wider text-[11px]! border-b border-ink/5 pb-1">
                  Delivery Destination
                </p>
                {shipping ? (
                  <>
                    <p className="font-medium text-ink pt-1">{shipping.recipientName}</p>
                    <p className="text-ink-soft">{shipping.addressLine1}</p>
                    {shipping.addressLine2 && <p className="text-ink-soft">{shipping.addressLine2}</p>}
                    <p className="text-ink-soft">
                      {shipping.city}, {shipping.state} - {shipping.postalCode}
                    </p>
                    <p className="text-ink-soft">Mobile: {shipping.mobileNumber}</p>
                  </>
                ) : (
                  <p className="text-ink-soft italic">Standard Delivery</p>
                )}
              </div>

              {/* Billing Address */}
              <div className="rounded-xl border border-ink/10 p-4 space-y-1">
                <p className="font-semibold text-ink uppercase tracking-wider text-[11px]! border-b border-ink/5 pb-1">
                  Customer / Billing Details
                </p>
                {billing ? (
                  <>
                    <p className="font-medium text-ink pt-1">{billing.recipientName}</p>
                    <p className="text-ink-soft">{billing.addressLine1}</p>
                    {billing.addressLine2 && <p className="text-ink-soft">{billing.addressLine2}</p>}
                    <p className="text-ink-soft">
                      {billing.city}, {billing.state} - {billing.postalCode}
                    </p>
                    {billing.email && <p className="text-ink-soft">Email: {billing.email}</p>}
                  </>
                ) : (
                  <p className="text-ink-soft italic">Same as Delivery Address</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-xl border border-ink/10">
              <table className="w-full text-left border-collapse text-xs!">
                <thead>
                  <tr className="border-b border-ink/10 bg-ivory-dim text-ink font-semibold uppercase tracking-wider text-[11px]! print:bg-gray-100">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Description of Goods</th>
                    <th className="py-2.5 px-3 text-center">Pack / Weight</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {order.items.map((item, idx) => (
                    <tr key={item.productVariantId || idx}>
                      <td className="py-2.5 px-3 text-center text-ink-soft font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-ink">
                        {item.productName}
                        <span className="block text-[11px]! text-ink-soft font-mono font-normal">
                          SKU: {item.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-ink-soft">
                        {item.weight} {item.weightUnit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-ink-soft">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-ink">
                        {formatINR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
              <div className="text-xs! text-ink-soft space-y-1.5 max-w-sm">
                <div className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck size={14} />
                  <span>100% Guaranteed Quality & Purity</span>
                </div>
                <p className="text-[11px]! leading-relaxed">
                  This is a computer-generated Bill of Supply / Order Receipt and requires no physical signature under Indian law.
                </p>
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs! rounded-xl bg-ivory-dim p-4 border border-ink/5 print:bg-transparent print:border-ink/10">
                <div className="flex justify-between text-ink-soft">
                  <span>Items Subtotal:</span>
                  <span className="font-mono text-ink">{formatINR(order.subtotal)}</span>
                </div>

                {order.itemDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Product Savings:</span>
                    <span className="font-mono">- {formatINR(order.itemDiscountAmount)}</span>
                  </div>
                )}

                {order.couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount {order.couponCode && `(${order.couponCode})`}:</span>
                    <span className="font-mono">- {formatINR(order.couponDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-ink-soft">
                  <span>Delivery Charges:</span>
                  <span className="font-mono text-ink">
                    {order.customerShippingAmount === 0 ? "FREE" : formatINR(order.customerShippingAmount)}
                  </span>
                </div>

                {order.paymentServiceTaxAmount > 0 && (
                  <div className="flex justify-between text-ink-soft">
                    <span>Payment Processing Fee:</span>
                    <span className="font-mono text-ink">
                      {formatINR(order.paymentServiceTaxAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-ink-soft">
                  <span>Taxes:</span>
                  <span className="font-mono text-emerald-700 font-medium">
                    ₹0.00 (Unregistered)
                  </span>
                </div>

                <div className="border-t border-ink/10 pt-2 flex items-center justify-between font-bold text-ink text-sm!">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono text-base! text-oxblood print:text-black">
                    {formatINR(order.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-ink/10 pt-4 text-center text-[11px]! text-ink-soft">
              <p>Thank you for choosing {order.storeName || "Pramukhraj Foods"}!</p>
              <p className="mt-0.5">For inquiries or returns, visit your account dashboard or contact support.</p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

