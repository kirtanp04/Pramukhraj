import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X, PackageCheck, Truck, MapPin, ShieldCheck } from "lucide-react";
import { formatDateTime, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface ReturnPackingSlipItem {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice?: number;
  refundAmount?: number;
  reason?: string;
}

export interface ReturnPackingSlipData {
  returnNumber: string;
  orderNumber: string;
  createdOn: string;
  approvedOn?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  pickupScheduledDate?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupAddress?: string;
  items: ReturnPackingSlipItem[];
  totalRefundAmount?: number;
  reverseShippingDeduction?: number;
  netRefundAmount?: number;
  reasonText?: string;
  storeName?: string;
  storeAddress?: string;
  supportPhone?: string;
  supportEmail?: string;
}

interface ReturnPackingSlipModalProps {
  data: ReturnPackingSlipData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnPackingSlipModal({
  data,
  open,
  onOpenChange,
}: ReturnPackingSlipModalProps) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalItems = data.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/50 backdrop-blur-xs print:hidden" />
        <Dialog.Content className="fixed inset-4 z-80 m-auto max-h-[92vh] max-w-3xl overflow-y-auto rounded-2xl bg-ivory p-6 shadow-2xl md:p-8 print:inset-0 print:max-h-none print:max-w-none print:rounded-none print:bg-white print:p-8 print:shadow-none">
          {/* Top Actions (Hidden in Print) */}
          <div className="flex items-center justify-between border-b border-ink/10 pb-4 print:hidden">
            <div className="flex items-center gap-2">
              <PackageCheck size={20} className="text-oxblood" />
              <Dialog.Title className="font-display text-lg! font-semibold text-ink">
                RMA Return Packing Slip & Shipping Label
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
                <span>Print RMA Slip</span>
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
            Authorized Return Merchandise Authorization (RMA) packing slip for Return #{data.returnNumber}
          </Dialog.Description>

          {/* Printable RMA Document */}
          <div className="pt-6 space-y-6 text-ink print:pt-0">
            {/* Header & Brand */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink/10 pb-5">
              <div>
                <h1 className="font-display text-2xl! font-bold tracking-tight text-oxblood">
                  {data.storeName || "Pramukhraj Foods"}
                </h1>
                <p className="text-xs! text-ink-soft mt-0.5">
                  Pure & Authentic Food Products • Reverse Logistics Facility
                </p>
                {/* <p className="text-[11px]! text-ink-soft">
                  FSSAI Certified Food Establishment • GST: Unregistered Dealer (CGST Act Sec. 32)
                </p> */}
              </div>
              <div className="sm:text-right">
                <span className="inline-block rounded-md bg-ink/5 px-2.5 py-1 text-xs! font-bold uppercase tracking-wider text-ink border border-ink/10">
                  Authorized RMA Slip
                </span>
                <p className="font-mono text-sm! font-bold text-oxblood mt-1">
                  #{data.returnNumber}
                </p>
                <p className="text-[11px]! text-ink-soft">
                  Order Ref: #{data.orderNumber}
                </p>
              </div>
            </div>

            {/* Barcode & Key Identifiers */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-ink/10 bg-ivory-dim p-4 print:bg-transparent print:border-ink/20">
              <div className="space-y-1 text-xs! w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-ink-soft">Return Requested:</span>
                  <span className="font-medium text-ink">{formatDateTime(data.createdOn)}</span>
                </div>
                {data.approvedOn && (
                  <div className="flex items-center gap-2">
                    <span className="text-ink-soft">RMA Authorization:</span>
                    <span className="font-medium text-teal">{formatDateTime(data.approvedOn)}</span>
                  </div>
                )}
                {data.reasonText && (
                  <div className="flex items-center gap-2">
                    <span className="text-ink-soft">Reason:</span>
                    <span className="font-medium text-ink">{data.reasonText}</span>
                  </div>
                )}
              </div>

              {/* Barcode representation */}
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-ink/10 text-center">
                <div className="flex items-center gap-[2px] h-9 px-2">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 1, 2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-ink h-full"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px]! tracking-widest text-ink font-semibold mt-1">
                  *{data.returnNumber}*
                </span>
              </div>
            </div>

            {/* Reverse Courier / Shipping Section */}
            <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 text-xs! print:border-ink/20 print:bg-transparent">
              <div className="flex items-center gap-2 text-teal font-semibold text-xs! mb-2 print:text-ink">
                <Truck size={15} />
                <span>Reverse Logistics & Carrier Dispatch</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px]! text-ink-soft uppercase block font-medium">Assigned Courier</span>
                  <span className="font-medium text-ink text-xs!">
                    {data.courierName || "Pending Carrier Assignment"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px]! text-ink-soft uppercase block font-medium">Reverse AWB / Tracking #</span>
                  <span className="font-mono font-bold text-ink text-xs!">
                    {data.trackingNumber || "To be generated"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px]! text-ink-soft uppercase block font-medium">Scheduled Pickup Date</span>
                  <span className="font-medium text-ink text-xs!">
                    {data.pickupScheduledDate ? formatDateTime(data.pickupScheduledDate) : "Standard 24-48 hr courier slot"}
                  </span>
                </div>
              </div>
            </div>

            {/* Addresses Grid: From (Customer) & To (Warehouse) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs!">
              {/* Sender / Customer Pickup Address */}
              <div className="rounded-xl border border-ink/10 bg-ivory-dim p-4 space-y-2 print:bg-transparent print:border-ink/20">
                <div className="flex items-center gap-1.5 font-semibold text-ink uppercase tracking-wider text-[11px]!">
                  <MapPin size={13} className="text-oxblood" />
                  <span>Ship From (Customer Pickup Address)</span>
                </div>
                <div className="space-y-0.5 text-ink">
                  <p className="font-medium">{data.customerName || "Valued Customer"}</p>
                  {data.pickupAddress ? (
                    <p className="whitespace-pre-line text-ink-soft">{data.pickupAddress}</p>
                  ) : (
                    <p className="text-ink-soft italic">Address verified on order record</p>
                  )}
                  {data.customerPhone && <p className="text-ink-soft">Phone: {data.customerPhone}</p>}
                  {data.customerEmail && <p className="text-ink-soft">Email: {data.customerEmail}</p>}
                </div>
              </div>

              {/* Destination / Return Warehouse */}
              <div className="rounded-xl border border-ink/10 bg-ivory-dim p-4 space-y-2 print:bg-transparent print:border-ink/20">
                <div className="flex items-center gap-1.5 font-semibold text-ink uppercase tracking-wider text-[11px]!">
                  <MapPin size={13} className="text-teal" />
                  <span>Ship To (Central Return Facility)</span>
                </div>
                <div className="space-y-0.5 text-ink">
                  <p className="font-medium">{data.storeName || "Pramukhraj Foods"} - QC & Returns Facility</p>
                  {data.storeAddress ? (
                    <p className="text-ink-soft whitespace-pre-line">{data.storeAddress}</p>
                  ) : (
                    <>
                      <p className="text-ink-soft">Plot No. 42, GIDC Phase II, Naroda Industrial Estate</p>
                      <p className="text-ink-soft">Ahmedabad, Gujarat - 382330, India</p>
                    </>
                  )}
                  {data.supportPhone && <p className="text-ink-soft">Contact: {data.supportPhone}</p>}
                  {data.supportEmail && <p className="text-ink-soft">Email: {data.supportEmail}</p>}
                </div>
              </div>
            </div>

            {/* Authorized Item Manifest */}
            <div className="space-y-2">
              <h3 className="font-semibold text-xs! sm:text-sm! text-ink uppercase tracking-wider">
                Authorized Item Manifest ({totalItems} {totalItems === 1 ? "Unit" : "Units"})
              </h3>
              <div className="rounded-xl border border-ink/10 overflow-hidden print:border-ink/20">
                <table className="w-full text-left text-xs!">
                  <thead className="bg-ink/5 border-b border-ink/10 text-ink-soft uppercase text-[10px]! font-medium print:bg-transparent print:border-ink/20">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Variant</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      {data.totalRefundAmount !== undefined && (
                        <th className="py-2.5 px-3 text-right">Refund Share</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10 print:divide-ink/20">
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-medium text-ink">
                          {item.productName}
                          {item.reason && (
                            <span className="block text-[10px]! text-ink-soft font-normal mt-0.5">
                              Reason: {item.reason}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-ink-soft">{item.variantName || "Standard"}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium text-ink">{item.quantity}</td>
                        {data.totalRefundAmount !== undefined && (
                          <td className="py-2.5 px-3 text-right font-mono text-ink">
                            {item.refundAmount !== undefined ? formatINR(item.refundAmount) : "—"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {data.netRefundAmount !== undefined && (
                    <tfoot className="border-t border-ink/10 bg-ivory-dim font-medium text-ink text-xs! print:bg-transparent print:border-ink/20">
                      {data.reverseShippingDeduction && data.reverseShippingDeduction > 0 ? (
                        <>
                          <tr>
                            <td colSpan={3} className="py-1.5 px-3 text-right text-ink-soft text-[11px]!">
                              Gross Refund:
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono text-[11px]!">
                              {formatINR(data.totalRefundAmount || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="py-1.5 px-3 text-right text-oxblood text-[11px]!">
                              Reverse Freight Deduction:
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono text-oxblood text-[11px]!">
                              - {formatINR(data.reverseShippingDeduction)}
                            </td>
                          </tr>
                        </>
                      ) : null}
                      <tr className="font-bold text-sm!">
                        <td colSpan={3} className="py-2.5 px-3 text-right text-ink">
                          Authorized Refund Total:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                          {formatINR(data.netRefundAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Packaging & Handover Instructions */}
            <div className="rounded-xl border border-ink/10 bg-ivory-dim p-4 space-y-2 text-xs! print:bg-transparent print:border-ink/20">
              <div className="flex items-center gap-1.5 font-semibold text-ink text-xs!">
                <ShieldCheck size={14} className="text-teal" />
                <span>Return Packaging & Handover Instructions</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-ink-soft text-[11px]! leading-relaxed">
                <li>
                  <strong className="text-ink">Packaging:</strong> Place the authorized items securely in their original retail packaging or a secure corrugated box with appropriate bubble wrap / cushioning.
                </li>
                <li>
                  <strong className="text-ink">Labeling:</strong> Fold and place this RMA document inside the package, or paste a clear copy on the outer carton.
                </li>
                <li>
                  <strong className="text-ink">Verification:</strong> When the pickup courier arrives, confirm the Reverse AWB number ({data.trackingNumber || "provided via SMS/email"}) before handing over the parcel.
                </li>
                <li>
                  <strong className="text-ink">Quality Inspection (QC):</strong> All returned goods undergo automated QC at our warehouse facility within 24 hours of arrival before refund settlement is disbursed to your payment method.
                </li>
              </ol>
            </div>

            {/* Legal / Policy Footer */}
            <div className="border-t border-ink/10 pt-3 text-center text-[10px]! text-ink-soft print:border-ink/20">
              <p>
                Official Return Merchandise Authorization (RMA) issued by {data.storeName || "Pramukhraj Foods"} E-Commerce Portal.
              </p>
              <p className="mt-0.5">
                Support: {data.supportEmail || "support@pramukhrajfoods.com"} | Helpline: {data.supportPhone || "+91 98765 43210"}
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
