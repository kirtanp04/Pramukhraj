import { useEffect, useState, useId } from "react";
import {
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  CreditCard,
  ShieldAlert,
  Loader2,
  X,
  Truck,
  Navigation,
  ExternalLink,
  Printer,
} from "lucide-react";
import { formatDateTime, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminDrawer } from "@/components/admin/AdminDrawer";
import * as Dialog from "@radix-ui/react-dialog";
import { adminReturnsApi } from "../api/adminReturnsApi";
import {
  ReturnStatus,
  ReturnStatusLabels,
  ReturnStatusBadgeVariants,
  ReturnReasonLabels,
  ReturnResolutionLabels,
  InspectionOutcome,
  InspectionOutcomeLabels,
} from "@/features/returns/types";
import { ReturnPackingSlipModal } from "@/features/returns/components/ReturnPackingSlipModal";
import type {
  AdminReturnDetails,
  AdminItemInspectionInput,
} from "../types";

interface AdminReturnDrawerProps {
  returnId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function AdminReturnDrawer({
  returnId,
  open,
  onOpenChange,
  onUpdated,
}: AdminReturnDrawerProps) {
  const [details, setDetails] = useState<AdminReturnDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Dialog states for admin actions
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [schedulePickupOpen, setSchedulePickupOpen] = useState(false);
  const [updateTrackingOpen, setUpdateTrackingOpen] = useState(false);
  const [showPackingSlip, setShowPackingSlip] = useState(false);

  // Form states
  const [reverseDeduction, setReverseDeduction] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [inspectionItems, setInspectionItems] = useState<AdminItemInspectionInput[]>([]);
  const [refundSpeed, setRefundSpeed] = useState<string>("normal");

  // Reverse Logistics Form state
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [pickupScheduledDate, setPickupScheduledDate] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [targetTrackingStatus, setTargetTrackingStatus] = useState<ReturnStatus>(ReturnStatus.InTransit);
  const [trackingNotes, setTrackingNotes] = useState("");

  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState("");

  const modalDescId = useId();

  const fetchDetails = () => {
    if (!returnId || !open) return;
    setIsLoading(true);
    setError("");

    adminReturnsApi
      .getDetails(returnId)
      .then((res) => {
        if (res) {
          setDetails(res);
          setReverseDeduction(res.reverseShippingDeduction || 0);
          // Initialize inspection items
          setInspectionItems(
            res.items.map((it) => ({
              returnItemId: it.id,
              outcome: it.inspectionStatus === InspectionOutcome.Pending ? InspectionOutcome.Passed : it.inspectionStatus,
              restockInventory: it.restockInventory ?? true,
            }))
          );
          setCourierName(res.courierName || "");
          setTrackingNumber(res.trackingNumber || "");
          setTrackingUrl(res.trackingUrl || "");
          setPickupScheduledDate(
            res.pickupScheduledDate
              ? new Date(res.pickupScheduledDate).toISOString().slice(0, 16)
              : ""
          );
        } else {
          setError("Return request details not found.");
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
    fetchDetails();
  }, [returnId, open]);

  // Handlers
  const handleApprove = async () => {
    if (!returnId) return;
    setIsProcessingAction(true);
    setActionError("");
    try {
      const res = await adminReturnsApi.approve(returnId, {
        reverseShippingDeduction: Number(reverseDeduction) || 0,
        adminNotes: adminNotes.trim() || undefined,
      });
      if (res && res.success) {
        setApproveOpen(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        setActionError(res?.message || "Failed to approve return.");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!returnId) return;
    if (!rejectionReason.trim()) {
      setActionError("Please provide a reason for rejecting this return.");
      return;
    }
    setIsProcessingAction(true);
    setActionError("");
    try {
      const res = await adminReturnsApi.reject(returnId, {
        rejectionReason: rejectionReason.trim(),
      });
      if (res && res.success) {
        setRejectOpen(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        setActionError(res?.message || "Failed to reject return.");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleInspect = async () => {
    if (!returnId) return;
    setIsProcessingAction(true);
    setActionError("");
    try {
      const res = await adminReturnsApi.inspect(returnId, {
        items: inspectionItems,
        inspectionNotes: inspectionNotes.trim() || undefined,
      });
      if (res && res.success) {
        setInspectOpen(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        setActionError(res?.message || "Failed to record QC inspection.");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Inspection submission failed.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!returnId) return;
    setIsProcessingAction(true);
    setActionError("");
    try {
      const res = await adminReturnsApi.processRefund(returnId, {
        refundSpeed,
      });
      if (res && res.success) {
        setRefundOpen(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        setActionError(res?.message || "Failed to initiate Razorpay refund.");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Refund initiation failed.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSchedulePickup = async () => {
    if (!returnId) return;
    if (!courierName.trim() || !trackingNumber.trim()) {
      setActionError("Please provide both courier name and tracking/AWB number.");
      return;
    }
    setIsProcessingAction(true);
    setActionError("");
    try {
      const res = await adminReturnsApi.schedulePickup(returnId, {
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
        pickupScheduledDate: pickupScheduledDate ? new Date(pickupScheduledDate).toISOString() : undefined,
        notes: pickupNotes.trim() || undefined,
      });
      if (res && res.success) {
        setSchedulePickupOpen(false);
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        setActionError(res?.message || "Failed to schedule reverse pickup.");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to schedule reverse pickup.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUpdateTracking = async (statusOverride?: ReturnStatus) => {
    if (!returnId) return;
    const statusToApply = statusOverride ?? targetTrackingStatus;
    setIsProcessingAction(true);
    setActionError("");
    try {
      const res = await adminReturnsApi.updateTracking(returnId, {
        status: statusToApply,
        notes: trackingNotes.trim() || undefined,
      });
      if (res && res.success) {
        setUpdateTrackingOpen(false);
        setTrackingNotes("");
        fetchDetails();
        if (onUpdated) onUpdated();
      } else {
        setActionError(res?.message || "Failed to update tracking status.");
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Tracking update failed.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <>
      <AdminDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={details ? `Return #${details.returnNumber}` : "Return Details"}
        description={details ? `Order #${details.orderNumber} • Created ${formatDateTime(details.createdOn)}` : undefined}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="animate-spin text-oxblood" size={32} />
            <p className="text-xs! text-ink-soft">Loading return details...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-center space-y-2">
            <AlertCircle size={28} className="mx-auto text-oxblood" />
            <p className="text-xs! sm:text-sm! text-oxblood font-medium">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchDetails} className="text-xs!">
              Retry
            </Button>
          </div>
        ) : !details ? null : (
          <div className="space-y-6">
            {/* Status & Quick Action Banner */}
            <div className="rounded-2xl border border-ink/10 bg-ivory-dim p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs! text-ink-soft">Current Status:</span>
                <Badge variant={ReturnStatusBadgeVariants[details.status]}>
                  {ReturnStatusLabels[details.status]}
                </Badge>
              </div>

              {/* Action buttons based on status */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Print RMA Slip */}
                {details.status !== ReturnStatus.Requested &&
                  details.status !== ReturnStatus.Rejected &&
                  details.status !== ReturnStatus.Cancelled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPackingSlip(true)}
                      className="text-xs! gap-1.5"
                    >
                      <Printer size={13} />
                      <span>Print RMA Slip</span>
                    </Button>
                  )}

                {details.status === ReturnStatus.Requested && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setActionError("");
                        setApproveOpen(true);
                      }}
                      className="text-xs! gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionError("");
                        setRejectOpen(true);
                      }}
                      className="text-xs! gap-1.5 text-oxblood border-oxblood/30 hover:bg-oxblood/5"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </Button>
                  </>
                )}

                {details.status === ReturnStatus.Approved && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActionError("");
                      setSchedulePickupOpen(true);
                    }}
                    className="text-xs! gap-1.5 bg-teal hover:bg-teal-deep text-white"
                  >
                    <Truck size={13} />
                    <span>Schedule Pickup</span>
                  </Button>
                )}

                {details.status === ReturnStatus.PickupScheduled && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActionError("");
                      setTargetTrackingStatus(ReturnStatus.InTransit);
                      setUpdateTrackingOpen(true);
                    }}
                    className="text-xs! gap-1.5 bg-teal hover:bg-teal-deep text-white"
                  >
                    <Navigation size={13} />
                    <span>Mark In Transit</span>
                  </Button>
                )}

                {details.status === ReturnStatus.InTransit && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActionError("");
                      setTargetTrackingStatus(ReturnStatus.DeliveredToWarehouse);
                      setUpdateTrackingOpen(true);
                    }}
                    className="text-xs! gap-1.5 bg-teal hover:bg-teal-deep text-white"
                  >
                    <Truck size={13} />
                    <span>Mark Delivered</span>
                  </Button>
                )}

                {(details.status === ReturnStatus.Approved ||
                  details.status === ReturnStatus.PickupScheduled ||
                  details.status === ReturnStatus.InTransit ||
                  details.status === ReturnStatus.DeliveredToWarehouse) && (
                  <Button
                    size="sm"
                    variant={details.status === ReturnStatus.DeliveredToWarehouse ? "primary" : "outline"}
                    onClick={() => {
                      setActionError("");
                      setInspectOpen(true);
                    }}
                    className="text-xs! gap-1.5"
                  >
                    <ClipboardCheck size={13} />
                    <span>QC Inspection</span>
                  </Button>
                )}

                {details.status === ReturnStatus.InspectionPassed && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActionError("");
                      setRefundOpen(true);
                    }}
                    className="text-xs! gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <CreditCard size={13} />
                    <span>Execute Razorpay Refund</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Reverse Logistics Tracking Overview Card */}
            {(details.courierName ||
              details.trackingNumber ||
              details.status === ReturnStatus.PickupScheduled ||
              details.status === ReturnStatus.InTransit ||
              details.status === ReturnStatus.DeliveredToWarehouse) && (
              <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-xs! sm:text-sm! text-teal">
                    <Truck size={16} />
                    <span>Reverse Courier & Tracking Logistics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionError("");
                        setSchedulePickupOpen(true);
                      }}
                      className="text-xs! h-7 px-2.5 border-teal/30 text-teal hover:bg-teal/10"
                    >
                      {details.courierName ? "Edit Courier" : "Assign Courier"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionError("");
                        setTargetTrackingStatus(
                          details.status === ReturnStatus.PickupScheduled
                            ? ReturnStatus.InTransit
                            : ReturnStatus.DeliveredToWarehouse
                        );
                        setUpdateTrackingOpen(true);
                      }}
                      className="text-xs! h-7 px-2.5 border-teal/30 text-teal hover:bg-teal/10"
                    >
                      Update Status
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs!">
                  <div>
                    <span className="text-ink-soft block text-[11px]! uppercase font-medium">Courier / Carrier</span>
                    <span className="font-medium text-ink">{details.courierName || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft block text-[11px]! uppercase font-medium">Reverse AWB</span>
                    {details.trackingNumber ? (
                      <div className="flex items-center gap-1 font-mono font-bold text-ink">
                        <span>{details.trackingNumber}</span>
                        {details.trackingUrl && (
                          <a
                            href={details.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal hover:underline inline-flex items-center ml-1"
                            title="Open tracking link"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-soft">Pending generation</span>
                    )}
                  </div>
                  <div>
                    <span className="text-ink-soft block text-[11px]! uppercase font-medium">Pickup Scheduled</span>
                    <span className="font-medium text-ink">
                      {details.pickupScheduledDate ? formatDateTime(details.pickupScheduledDate) : "Not scheduled"}
                    </span>
                  </div>
                </div>

                {(details.pickedUpOn || details.deliveredToWarehouseOn) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs! pt-2 border-t border-teal/10">
                    {details.pickedUpOn && (
                      <div>
                        <span className="text-ink-soft block text-[11px]! uppercase font-medium">Carrier Picked Up</span>
                        <span className="font-medium text-ink">{formatDateTime(details.pickedUpOn)}</span>
                      </div>
                    )}
                    {details.deliveredToWarehouseOn && (
                      <div>
                        <span className="text-ink-soft block text-[11px]! uppercase font-medium">Delivered to Warehouse</span>
                        <span className="font-medium text-ink">{formatDateTime(details.deliveredToWarehouseOn)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Customer Information */}
            <div className="rounded-2xl border border-ink/10 bg-ivory p-4 space-y-3">
              <h4 className="font-display font-medium text-ink text-xs! sm:text-sm! flex items-center gap-2">
                <User size={15} className="text-oxblood" />
                <span>Customer &amp; Contact</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs!">
                <div>
                  <span className="text-ink-soft block text-[11px]! uppercase font-medium">Name</span>
                  <span className="font-medium text-ink">{details.customerName}</span>
                </div>
                <div>
                  <span className="text-ink-soft block text-[11px]! uppercase font-medium">Email</span>
                  <span className="text-ink flex items-center gap-1">
                    <Mail size={12} className="text-ink-soft" />
                    <span>{details.customerEmail || "N/A"}</span>
                  </span>
                </div>
                <div>
                  <span className="text-ink-soft block text-[11px]! uppercase font-medium">Phone</span>
                  <span className="text-ink flex items-center gap-1 font-mono">
                    <Phone size={12} className="text-ink-soft" />
                    <span>{details.customerPhone || "N/A"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="rounded-2xl border border-ink/10 bg-ivory p-4 space-y-2">
              <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                Financial Breakdown
              </h4>
              <div className="space-y-1.5 text-xs!">
                <div className="flex justify-between text-ink-soft">
                  <span>Gross Item Refund:</span>
                  <span className="font-mono">{formatINR(details.totalRefundAmount)}</span>
                </div>
                {details.reverseShippingDeduction > 0 && (
                  <div className="flex justify-between text-oxblood">
                    <span>Reverse Shipping Deduction:</span>
                    <span className="font-mono">- {formatINR(details.reverseShippingDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-ink/10 pt-2 font-bold text-ink text-sm!">
                  <span>Net Customer Refund:</span>
                  <span className="font-mono text-emerald-700">{formatINR(details.netRefundAmount)}</span>
                </div>
              </div>
            </div>

            {/* Request Reason & Notes */}
            <div className="rounded-2xl border border-ink/10 bg-ivory p-4 space-y-3">
              <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                Return Reason &amp; Comments
              </h4>
              <div className="space-y-2 text-xs!">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-ink/5 px-2.5 py-1 text-ink font-medium">
                    Reason: {ReturnReasonLabels[details.reason]}
                  </span>
                  <span className="rounded-md bg-ink/5 px-2.5 py-1 text-ink font-medium">
                    Resolution: {ReturnResolutionLabels[details.resolution]}
                  </span>
                </div>

                <div className="rounded-xl bg-ivory-dim p-3 space-y-1">
                  <span className="text-[11px]! text-ink-soft block font-medium uppercase">
                    Customer Comments:
                  </span>
                  <p className="text-ink italic">"{details.customerComments}"</p>
                </div>

                {details.adminNotes && (
                  <div className="rounded-xl bg-ink/5 p-3 space-y-1">
                    <span className="text-[11px]! text-ink-soft block font-medium uppercase">
                      Admin Notes:
                    </span>
                    <p className="text-ink">{details.adminNotes}</p>
                  </div>
                )}

                {details.rejectionReason && (
                  <div className="rounded-xl bg-oxblood/10 p-3 space-y-1 text-oxblood">
                    <span className="text-[11px]! block font-medium uppercase">
                      Rejection Reason:
                    </span>
                    <p>{details.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-2xl border border-ink/10 bg-ivory p-4 space-y-3">
              <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                Items for Return ({details.items.length})
              </h4>
              <div className="space-y-2">
                {details.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-ink/10 p-3 flex flex-wrap items-center justify-between gap-3 text-xs!"
                  >
                    <div>
                      <h5 className="font-medium text-ink text-xs! sm:text-sm!">
                        {item.productName}
                      </h5>
                      <p className="text-[11px]! text-ink-soft">
                        Variant: {item.variantName} • Qty: {item.quantity} • Unit Price: {formatINR(item.unitPrice)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            item.inspectionStatus === InspectionOutcome.Passed
                              ? "success"
                              : item.inspectionStatus === InspectionOutcome.Failed
                              ? "oxblood"
                              : "outline"
                          }
                        >
                          {InspectionOutcomeLabels[item.inspectionStatus]}
                        </Badge>
                        {item.restockInventory && (
                          <span className="text-[10px]! font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Restock enabled
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px]! text-ink-soft block">Refund Share</span>
                      <span className="font-mono font-bold text-ink text-xs! sm:text-sm!">
                        {formatINR(item.refundAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defect Proof Photos */}
            {details.media && details.media.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-ivory p-4 space-y-3">
                <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                  Uploaded Photos ({details.media.length})
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {details.media.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhoto(photo.url)}
                      className="aspect-square rounded-xl border border-ink/10 overflow-hidden hover:opacity-80 transition-opacity bg-ink/5"
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

            {/* Gateway Refund Record (if exists) */}
            {details.refund && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-medium text-xs! sm:text-sm!">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Razorpay Refund Executed</span>
                  </div>
                  <span className="font-mono font-bold">
                    {formatINR(details.refund.amount)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]! text-emerald-800 dark:text-emerald-400 font-mono">
                  <div>
                    <span className="opacity-75 block">Provider Refund ID:</span>
                    <span>{details.refund.providerRefundId ?? "Pending"}</span>
                  </div>
                  <div>
                    <span className="opacity-75 block">Idempotency Key:</span>
                    <span>{details.refund.idempotencyKey}</span>
                  </div>
                  <div>
                    <span className="opacity-75 block">Speed:</span>
                    <span className="uppercase">{details.refund.refundSpeed}</span>
                  </div>
                  <div>
                    <span className="opacity-75 block">Settled On:</span>
                    <span>{details.refund.settledOn ? formatDateTime(details.refund.settledOn) : "Pending webhook"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {details.timeline && details.timeline.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-ivory p-4 space-y-3">
                <h4 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                  Audit Timeline ({details.timeline.length})
                </h4>
                <div className="relative pl-5 border-l-2 border-ink/15 space-y-4">
                  {details.timeline.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-oxblood border-2 border-ivory" />
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs!">
                          <span className="font-medium text-ink">
                            {ReturnStatusLabels[item.status]}
                          </span>
                          <span className="text-[10px]! text-ink-soft">
                            {formatDateTime(item.createdOn)}
                          </span>
                          {item.actorAdminName && (
                            <span className="text-[10px]! bg-ink/5 px-2 py-0.5 rounded text-ink font-mono">
                              By {item.actorAdminName}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <p className="text-[11px]! text-ink-soft">{item.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminDrawer>

      {/* ─── APPROVE MODAL ────────────────────────────────────── */}
      <Dialog.Root open={approveOpen} onOpenChange={setApproveOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/50 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby={modalDescId}
            className="fixed inset-4 z-80 m-auto max-h-[85vh] max-w-md flex flex-col rounded-2xl bg-ivory p-6 shadow-2xl border border-ink/10"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <Dialog.Title className="font-display font-semibold text-ink text-base!">
                Approve Return Request
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <X size={13} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 py-4 text-xs!">
              {actionError && (
                <div className="rounded-lg bg-oxblood/10 p-2.5 text-oxblood">
                  {actionError}
                </div>
              )}
              <p id={modalDescId} className="text-ink-soft">
                Approving this request authorizes the customer to return the item(s) and schedules reverse shipment pickup.
              </p>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">
                  Reverse Shipping Deduction (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={reverseDeduction}
                  onChange={(e) => setReverseDeduction(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-ink font-mono outline-none focus:border-oxblood"
                />
                <span className="text-[11px]! text-ink-soft">
                  Set to 0 if reverse shipping is free for the customer.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">Admin Internal Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes for warehouse or customer service team..."
                  className="w-full rounded-xl border border-ink/15 bg-ivory p-2.5 text-ink outline-none focus:border-oxblood resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveOpen(false)}
                className="text-xs!"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={isProcessingAction}
                className="text-xs!"
              >
                {isProcessingAction ? "Approving..." : "Confirm Approval"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── REJECT MODAL ─────────────────────────────────────── */}
      <Dialog.Root open={rejectOpen} onOpenChange={setRejectOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/50 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby={modalDescId}
            className="fixed inset-4 z-80 m-auto max-h-[85vh] max-w-md flex flex-col rounded-2xl bg-ivory p-6 shadow-2xl border border-ink/10"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <Dialog.Title className="font-display font-semibold text-oxblood text-base!">
                Reject Return Request
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <X size={13} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 py-4 text-xs!">
              {actionError && (
                <div className="rounded-lg bg-oxblood/10 p-2.5 text-oxblood">
                  {actionError}
                </div>
              )}
              <p id={modalDescId} className="text-ink-soft">
                Please enter a clear explanation for rejecting this request. This reason will be visible to the customer.
              </p>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Defect reported is outside product warranty, or items are consumed/tampered..."
                  className="w-full rounded-xl border border-ink/15 bg-ivory p-2.5 text-ink outline-none focus:border-oxblood resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectOpen(false)}
                className="text-xs!"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReject}
                disabled={isProcessingAction || !rejectionReason.trim()}
                className="text-xs! bg-oxblood hover:bg-oxblood/90 text-ivory"
              >
                {isProcessingAction ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── QC INSPECTION MODAL ──────────────────────────────── */}
      <Dialog.Root open={inspectOpen} onOpenChange={setInspectOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/50 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby={modalDescId}
            className="fixed inset-4 z-80 m-auto max-h-[85vh] max-w-lg flex flex-col rounded-2xl bg-ivory p-6 shadow-2xl border border-ink/10"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <Dialog.Title className="font-display font-semibold text-ink text-base!">
                Warehouse QC Inspection
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <X size={13} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 py-4 text-xs!">
              {actionError && (
                <div className="rounded-lg bg-oxblood/10 p-2.5 text-oxblood">
                  {actionError}
                </div>
              )}
              <p id={modalDescId} className="text-ink-soft">
                Evaluate each returned item upon physical arrival at the warehouse. Mark items as Passed or Failed.
              </p>

              <div className="space-y-3">
                {details?.items.map((item) => {
                  const currentItemState = inspectionItems.find((i) => i.returnItemId === item.id) ?? {
                    returnItemId: item.id,
                    outcome: InspectionOutcome.Passed,
                    restockInventory: true,
                  };

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-ink/10 p-3 bg-ivory-dim space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="font-medium text-ink">{item.productName}</h6>
                          <p className="text-[11px]! text-ink-soft">
                            Variant: {item.variantName} • Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-ink/10">
                        <div>
                          <label className="text-[10px]! uppercase text-ink-soft block font-semibold">
                            Inspection Outcome
                          </label>
                          <select
                            value={currentItemState.outcome}
                            onChange={(e) => {
                              const val = Number(e.target.value) as InspectionOutcome;
                              setInspectionItems((prev) =>
                                prev.map((p) =>
                                  p.returnItemId === item.id ? { ...p, outcome: val } : p
                                )
                              );
                            }}
                            className="mt-1 w-full rounded-lg border border-ink/15 bg-ivory px-2 py-1 text-xs! font-medium outline-none"
                          >
                            <option value={InspectionOutcome.Passed}>Passed (Acceptable)</option>
                            <option value={InspectionOutcome.Failed}>Failed (Damaged/Void)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id={`restock-${item.id}`}
                            checked={currentItemState.restockInventory}
                            onChange={(e) => {
                              const chk = e.target.checked;
                              setInspectionItems((prev) =>
                                prev.map((p) =>
                                  p.returnItemId === item.id ? { ...p, restockInventory: chk } : p
                                )
                              );
                            }}
                            className="h-4 w-4 rounded border-ink/20 text-oxblood focus:ring-oxblood"
                          />
                          <label
                            htmlFor={`restock-${item.id}`}
                            className="text-xs! text-ink font-medium cursor-pointer"
                          >
                            Restock into inventory
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-medium text-ink">Inspection Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Package condition, seal status, verification comments..."
                  className="w-full rounded-xl border border-ink/15 bg-ivory p-2.5 text-ink outline-none focus:border-oxblood resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectOpen(false)}
                className="text-xs!"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleInspect}
                disabled={isProcessingAction}
                className="text-xs!"
              >
                {isProcessingAction ? "Submitting..." : "Submit QC Results"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── PROCESS REFUND MODAL ─────────────────────────────── */}
      <Dialog.Root open={refundOpen} onOpenChange={setRefundOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/50 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby={modalDescId}
            className="fixed inset-4 z-80 m-auto max-h-[85vh] max-w-md flex flex-col rounded-2xl bg-ivory p-6 shadow-2xl border border-ink/10"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CreditCard size={18} />
                <Dialog.Title className="font-display font-semibold text-ink text-base!">
                  Execute Razorpay Refund
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <X size={13} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 py-4 text-xs!">
              {actionError && (
                <div className="rounded-lg bg-oxblood/10 p-2.5 text-oxblood">
                  {actionError}
                </div>
              )}

              <div className="rounded-xl border border-turmeric/30 bg-turmeric/10 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-turmeric-deep">
                  <ShieldAlert size={15} />
                  <span>Direct Gateway Transaction</span>
                </div>
                <p id={modalDescId} className="text-ink-soft text-[11px]!">
                  This will invoke the Razorpay API to process an instant or normal refund back to the customer's source account. This action cannot be undone.
                </p>
              </div>

              <div className="rounded-xl border border-ink/10 bg-ivory-dim p-4 flex items-center justify-between">
                <span className="text-ink-soft font-medium">Refund Amount:</span>
                <span className="font-mono font-bold text-ink text-base! text-emerald-700">
                  {formatINR(details?.netRefundAmount ?? 0)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">Refund Speed</label>
                <select
                  value={refundSpeed}
                  onChange={(e) => setRefundSpeed(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-xs! font-medium outline-none focus:border-oxblood"
                >
                  <option value="normal">Normal (5-7 business days)</option>
                  <option value="optimum">Optimum (Instant if supported by bank)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefundOpen(false)}
                className="text-xs!"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProcessRefund}
                disabled={isProcessingAction}
                className="text-xs! bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isProcessingAction ? "Triggering Refund..." : "Execute Refund"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── SCHEDULE REVERSE PICKUP MODAL ───────────────────────── */}
      <Dialog.Root open={schedulePickupOpen} onOpenChange={setSchedulePickupOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/50 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby={modalDescId}
            className="fixed inset-4 z-80 m-auto max-h-[85vh] max-w-md flex flex-col rounded-2xl bg-ivory p-6 shadow-2xl border border-ink/10"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2 text-teal">
                <Truck size={18} />
                <Dialog.Title className="font-display font-semibold text-ink text-base!">
                  Schedule Reverse Pickup
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <X size={13} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-3.5 py-4 text-xs!">
              {actionError && (
                <div className="rounded-lg bg-oxblood/10 p-2.5 text-oxblood">
                  {actionError}
                </div>
              )}

              <p id={modalDescId} className="text-ink-soft text-[11px]!">
                Assign the reverse logistics courier partner and generate or input the tracking AWB code.
              </p>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">
                  Courier / Logistics Partner <span className="text-oxblood">*</span>
                </label>
                <input
                  type="text"
                  list="carrier-suggestions"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Blue Dart, Delhivery, DTDC, Xpressbees"
                  className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-ink outline-none focus:border-oxblood text-xs!"
                />
                <datalist id="carrier-suggestions">
                  <option value="Blue Dart" />
                  <option value="Delhivery" />
                  <option value="DTDC Express" />
                  <option value="Xpressbees" />
                  <option value="Shadowfax" />
                  <option value="Ekart Logistics" />
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">
                  Reverse AWB / Tracking Code <span className="text-oxblood">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BD123456789IN"
                  className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 font-mono text-ink outline-none focus:border-oxblood text-xs!"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">Tracking Web URL (Optional)</label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.carrier.com/..."
                  className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-ink outline-none focus:border-oxblood text-xs!"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">Scheduled Pickup Date &amp; Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={pickupScheduledDate}
                  onChange={(e) => setPickupScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-ink outline-none focus:border-oxblood text-xs!"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">Special Instructions / Dispatch Notes</label>
                <textarea
                  rows={2}
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="Package notes, pickup window details..."
                  className="w-full rounded-xl border border-ink/15 bg-ivory p-2.5 text-ink outline-none focus:border-oxblood resize-none text-xs!"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSchedulePickupOpen(false)}
                className="text-xs!"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSchedulePickup}
                disabled={isProcessingAction}
                className="text-xs! bg-teal hover:bg-teal-deep text-white"
              >
                {isProcessingAction ? "Scheduling..." : "Confirm Schedule"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── UPDATE REVERSE TRACKING STATUS MODAL ─────────────────── */}
      <Dialog.Root open={updateTrackingOpen} onOpenChange={setUpdateTrackingOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-80 bg-ink/50 backdrop-blur-xs" />
          <Dialog.Content
            aria-describedby={modalDescId}
            className="fixed inset-4 z-80 m-auto max-h-[85vh] max-w-md flex flex-col rounded-2xl bg-ivory p-6 shadow-2xl border border-ink/10"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2 text-teal">
                <Navigation size={18} />
                <Dialog.Title className="font-display font-semibold text-ink text-base!">
                  Update Reverse Tracking Status
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <X size={13} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 py-4 text-xs!">
              {actionError && (
                <div className="rounded-lg bg-oxblood/10 p-2.5 text-oxblood">
                  {actionError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-medium text-ink">New Tracking Status</label>
                <select
                  value={targetTrackingStatus}
                  onChange={(e) => setTargetTrackingStatus(Number(e.target.value) as ReturnStatus)}
                  className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-xs! font-medium outline-none focus:border-oxblood"
                >
                  <option value={ReturnStatus.InTransit}>In Transit (Carrier Picked Up Package)</option>
                  <option value={ReturnStatus.DeliveredToWarehouse}>Delivered to Warehouse (Arrived at Hub)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink">Tracking / Milestones Note (Optional)</label>
                <textarea
                  rows={2}
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  placeholder="e.g. Scanned at Ahmedabad hub, package in good physical shape..."
                  className="w-full rounded-xl border border-ink/15 bg-ivory p-2.5 text-ink outline-none focus:border-oxblood resize-none text-xs!"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpdateTrackingOpen(false)}
                className="text-xs!"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdateTracking()}
                disabled={isProcessingAction}
                className="text-xs! bg-teal hover:bg-teal-deep text-white"
              >
                {isProcessingAction ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── RETURN PACKING SLIP PRINTABLE MODAL ────────────────── */}
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
            customerName: details.customerName,
            customerEmail: details.customerEmail,
            customerPhone: details.customerPhone,
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

      {/* Lightbox for Image Preview */}
      {selectedPhoto && (
        <Dialog.Root open={Boolean(selectedPhoto)} onOpenChange={() => setSelectedPhoto(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-90 bg-ink/80 backdrop-blur-xs" />
            <Dialog.Content className="fixed inset-4 z-90 m-auto max-h-[85vh] max-w-2xl flex items-center justify-center p-2">
              <img
                src={selectedPhoto}
                alt="Defect proof"
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
    </>
  );
}
