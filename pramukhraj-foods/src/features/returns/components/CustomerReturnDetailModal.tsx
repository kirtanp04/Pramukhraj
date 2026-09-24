import { useEffect, useState, useId } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  RotateCcw,
  X,
  AlertCircle,
  CheckCircle2,
  Ban,
  Loader2,
  Printer,
  Truck,
  ExternalLink,
} from "lucide-react";
import { formatDateTime, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { returnsApi } from "../api/returns.api";
import {
  ReturnStatus,
  ReturnStatusLabels,
  ReturnStatusBadgeVariants,
  ReturnReasonLabels,
  ReturnResolutionLabels,
  InspectionOutcomeLabels,
  InspectionOutcome,
  type CustomerReturnDetails,
} from "../types";
import { ReturnPackingSlipModal } from "./ReturnPackingSlipModal";

interface CustomerReturnDetailModalProps {
  returnId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}

export function CustomerReturnDetailModal({
  returnId,
  open,
  onOpenChange,
  onCancelled,
}: CustomerReturnDetailModalProps) {
  const [details, setDetails] = useState<CustomerReturnDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPackingSlip, setShowPackingSlip] = useState(false);

  const modalDescId = useId();

  const loadDetails = () => {
    if (!returnId || !open) return;
    setIsLoading(true);
    setError("");
    setActionError("");

    returnsApi
      .getDetails(returnId)
      .then((res) => {
        if (res) {
          setDetails(res);
        } else {
          setError("Return request not found.");
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load return details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadDetails();
  }, [returnId, open]);

  const handleCancelReturn = async () => {
    if (!returnId) return;
    if (!window.confirm("Are you sure you want to cancel this return request?")) return;

    setIsCancelling(true);
    setActionError("");
    try {
      const res = await returnsApi.cancel(returnId);
      if (res && res.success) {
        if (onCancelled) onCancelled();
        loadDetails();
      } else {
        setActionError(res?.message || "Failed to cancel return request.");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Cancellation failed.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-ink/50 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={modalDescId}
          className="fixed inset-3 z-70 m-auto flex max-h-[92vh] max-w-3xl flex-col rounded-2xl bg-ivory shadow-2xl overflow-hidden border border-ink/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
                <RotateCcw size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Dialog.Title className="font-mono font-bold text-ink text-base! sm:text-lg!">
                    Return #{details?.returnNumber ?? "Details"}
                  </Dialog.Title>
                  {details && (
                    <Badge variant={ReturnStatusBadgeVariants[details.status]}>
                      {ReturnStatusLabels[details.status]}
                    </Badge>
                  )}
                </div>
                <p id={modalDescId} className="text-xs! text-ink-soft">
                  {details ? `Order #${details.orderNumber} • Placed on ${formatDateTime(details.createdOn)}` : "Loading..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {details &&
                details.status !== ReturnStatus.Requested &&
                details.status !== ReturnStatus.Rejected &&
                details.status !== ReturnStatus.Cancelled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPackingSlip(true)}
                    className="gap-1.5 text-xs! border-ink/20 hover:border-oxblood hover:text-oxblood"
                  >
                    <Printer size={13} />
                    <span>Print RMA Slip</span>
                  </Button>
                )}
              <Dialog.Close asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Close"
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X size={14} />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="animate-spin text-oxblood" size={32} />
                <p className="text-xs! text-ink-soft">Loading return details...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-center space-y-2">
                <AlertCircle size={28} className="mx-auto text-oxblood" />
                <p className="text-xs! sm:text-sm! text-oxblood font-medium">{error}</p>
                <Button onClick={loadDetails} size="sm" variant="outline" className="text-xs!">
                  Retry
                </Button>
              </div>
            ) : !details ? null : (
              <>
                {actionError && (
                  <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-3.5 text-xs! text-oxblood flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Rejection Alert if Rejected */}
                {details.status === ReturnStatus.Rejected && details.rejectionReason && (
                  <div className="rounded-xl border border-oxblood/30 bg-oxblood/10 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-xs! sm:text-sm! text-oxblood">
                      <Ban size={15} />
                      <span>Return Request Rejected</span>
                    </div>
                    <p className="text-xs! text-ink-soft pl-5">
                      Reason: {details.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Refund Completed Alert */}
                {details.status === ReturnStatus.RefundCompleted && details.refund && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium text-xs! sm:text-sm!">
                        <CheckCircle2 size={16} />
                        <span>Refund Processed Successfully</span>
                      </div>
                      <span className="font-mono font-bold text-xs! sm:text-sm! text-emerald-800 dark:text-emerald-300">
                        {formatINR(details.refund.amount)}
                      </span>
                    </div>
                    {details.refund.providerRefundId && (
                      <p className="text-[11px]! text-emerald-700 dark:text-emerald-400 font-mono">
                        Gateway Refund ID: {details.refund.providerRefundId}
                      </p>
                    )}
                    {details.refund.settledOn && (
                      <p className="text-[11px]! text-emerald-700 dark:text-emerald-400">
                        Settled on {formatDateTime(details.refund.settledOn)}
                      </p>
                    )}
                  </div>
                )}

                {/* Replacement Order Card */}
                {details.replacementOrderNumber && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/30 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-medium text-xs! sm:text-sm!">
                        <RotateCcw size={16} />
                        <span>Replacement Order Confirmed</span>
                      </div>
                      <Badge variant="outline" className="border-blue-400 text-blue-800 dark:text-blue-300 font-mono font-semibold text-[11px]!">
                        ₹0 Replacement
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs!">
                      <span className="text-ink-soft">
                        Replacement Order:{" "}
                        <span className="font-mono font-bold text-ink">
                          #{details.replacementOrderNumber}
                        </span>
                      </span>
                      <span className="text-[11px]! text-blue-700 dark:text-blue-400">
                        Queued for dispatch to original delivery address
                      </span>
                    </div>
                  </div>
                )}

                {/* Reverse Logistics Tracking Card */}
                {details &&
                  (details.courierName ||
                    details.trackingNumber ||
                    details.status === ReturnStatus.PickupScheduled ||
                    details.status === ReturnStatus.InTransit ||
                    details.status === ReturnStatus.DeliveredToWarehouse) && (
                    <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-xs! sm:text-sm! text-teal">
                          <Truck size={16} />
                          <span>Reverse Courier & Tracking</span>
                        </div>
                        <Badge variant="teal">
                          {ReturnStatusLabels[details.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs!">
                        <div>
                          <span className="text-[10px]! uppercase text-ink-soft block font-medium">Carrier</span>
                          <span className="font-medium text-ink">{details.courierName || "To be scheduled"}</span>
                        </div>
                        <div>
                          <span className="text-[10px]! uppercase text-ink-soft block font-medium">Reverse AWB</span>
                          {details.trackingNumber ? (
                            <div className="flex items-center gap-1 font-mono font-bold text-ink">
                              <span>{details.trackingNumber}</span>
                              {details.trackingUrl && (
                                <a
                                  href={details.trackingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-teal hover:underline inline-flex items-center ml-1"
                                  title="Track Package"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-ink-soft">Pending</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px]! uppercase text-ink-soft block font-medium">
                            {details.deliveredToWarehouseOn ? "Delivered to Hub" : details.pickedUpOn ? "Picked Up On" : "Pickup Date"}
                          </span>
                          <span className="font-medium text-ink">
                            {details.deliveredToWarehouseOn
                              ? formatDateTime(details.deliveredToWarehouseOn)
                              : details.pickedUpOn
                              ? formatDateTime(details.pickedUpOn)
                              : details.pickupScheduledDate
                              ? formatDateTime(details.pickupScheduledDate)
                              : "Scheduled soon"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Request Overview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-ink/10 bg-ivory-dim p-4">
                  <div className="space-y-1">
                    <span className="text-[11px]! text-ink-soft block uppercase font-medium">
                      Return Reason
                    </span>
                    <span className="text-xs! sm:text-sm! font-medium text-ink">
                      {ReturnReasonLabels[details.reason] ?? "Other"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px]! text-ink-soft block uppercase font-medium">
                      Desired Resolution
                    </span>
                    <span className="text-xs! sm:text-sm! font-medium text-ink">
                      {ReturnResolutionLabels[details.resolution] ?? "Refund"}
                    </span>
                  </div>
                  <div className="sm:col-span-2 space-y-1 pt-1 border-t border-ink/10">
                    <span className="text-[11px]! text-ink-soft block uppercase font-medium">
                      Customer Comments
                    </span>
                    <p className="text-xs! text-ink italic">
                      "{details.customerComments}"
                    </p>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                    Returned Items ({details.items.length})
                  </h4>
                  <div className="space-y-2">
                    {details.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-ink/10 bg-ivory p-3.5 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <h5 className="font-medium text-ink text-xs! sm:text-sm!">
                            {item.productName}
                          </h5>
                          <p className="text-[11px]! text-ink-soft">
                            Variant: {item.variantName} • Qty: {item.quantity} • Unit: {formatINR(item.unitPrice)}
                          </p>
                          {item.inspectionStatus !== InspectionOutcome.Pending && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[10px]! uppercase text-ink-soft font-semibold">
                                QC Status:
                              </span>
                              <Badge
                                variant={
                                  item.inspectionStatus === InspectionOutcome.Passed
                                    ? "success"
                                    : "oxblood"
                                }
                              >
                                {InspectionOutcomeLabels[item.inspectionStatus]}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px]! text-ink-soft block">Refund Subtotal</span>
                          <span className="font-mono font-bold text-ink text-xs! sm:text-sm!">
                            {formatINR(item.refundAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="rounded-xl border border-ink/10 bg-ivory p-4 space-y-2 text-xs! sm:text-sm!">
                  <div className="flex justify-between text-ink-soft">
                    <span>Items Total Refund</span>
                    <span className="font-mono">{formatINR(details.totalRefundAmount)}</span>
                  </div>
                  {details.reverseShippingDeduction > 0 && (
                    <div className="flex justify-between text-oxblood">
                      <span>Reverse Shipping Deduction</span>
                      <span className="font-mono">- {formatINR(details.reverseShippingDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-ink/10 pt-2 font-bold text-ink text-sm! sm:text-base!">
                    <span>Net Refund Amount</span>
                    <span className="font-mono text-emerald-700">{formatINR(details.netRefundAmount)}</span>
                  </div>
                </div>

                {/* Proof Photos */}
                {details.media && details.media.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                      Proof Photos ({details.media.length})
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {details.media.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhoto(photo.url)}
                          className="aspect-square rounded-lg border border-ink/10 overflow-hidden hover:opacity-80 transition-opacity bg-ink/5"
                        >
                          <img
                            src={photo.url}
                            alt={photo.fileName}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                {details.timeline && details.timeline.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                      Activity Timeline
                    </h4>
                    <div className="relative pl-5 border-l-2 border-ink/15 space-y-4">
                      {details.timeline.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-oxblood border-2 border-ivory" />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink text-xs!">
                                {ReturnStatusLabels[step.status]}
                              </span>
                              <span className="text-[10px]! text-ink-soft">
                                {formatDateTime(step.createdOn)}
                              </span>
                            </div>
                            {step.note && (
                              <p className="text-[11px]! text-ink-soft">{step.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-ink/10 px-5 py-3.5 sm:px-6 bg-ivory">
            <div>
              {details?.status === ReturnStatus.Requested && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelReturn}
                  disabled={isCancelling}
                  className="text-xs! text-oxblood border-oxblood/30 hover:bg-oxblood/5"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Return"}
                </Button>
              )}
            </div>
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" className="text-xs!">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Lightbox for Image Preview */}
      {selectedPhoto && (
        <Dialog.Root open={Boolean(selectedPhoto)} onOpenChange={() => setSelectedPhoto(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/80 backdrop-blur-xs" />
            <Dialog.Content className="fixed inset-4 z-80 m-auto max-h-[85vh] max-w-2xl flex items-center justify-center p-2">
              <img
                src={selectedPhoto}
                alt="Return proof"
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-ink/80 text-ivory flex items-center justify-center hover:bg-oxblood"
              >
                <X size={16} />
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Return Packing Slip Printable Modal */}
      {details && (
        <ReturnPackingSlipModal
          open={showPackingSlip}
          onOpenChange={setShowPackingSlip}
          data={{
            returnNumber: details.returnNumber,
            orderNumber: details.orderNumber,
            createdOn: details.createdOn,
            approvedOn: details.approvedOn,
            courierName: details.courierName,
            trackingNumber: details.trackingNumber,
            pickupScheduledDate: details.pickupScheduledDate,
            items: details.items.map((i) => ({
              id: i.id,
              productName: i.productName,
              variantName: i.variantName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              refundAmount: i.refundAmount,
            })),
            totalRefundAmount: details.totalRefundAmount,
            reverseShippingDeduction: details.reverseShippingDeduction,
            netRefundAmount: details.netRefundAmount,
            reasonText: ReturnReasonLabels[details.reason],
          }}
        />
      )}
    </Dialog.Root>
  );
}
