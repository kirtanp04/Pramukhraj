import { useEffect, useState, useId } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  RotateCcw,
  X,
  AlertCircle,
  Upload,
  Trash2,
  CheckCircle2,
  Package,
  Sparkles,
  Loader2,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { returnsApi } from "../api/returns.api";
import {
  ReturnReason,
  ReturnResolution,
  ReturnReasonLabels,
  ReturnResolutionLabels,
  type ReturnEligibility,
  type CustomerReturnDetails,
  type CreateReturnItemInput,
  type CreateReturnMediaInput,
} from "../types";
import { fileToDataUrl } from "@/lib/imageUpload";

interface RequestReturnModalProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (returnDetails: CustomerReturnDetails) => void;
}

export function RequestReturnModal({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onSuccess,
}: RequestReturnModalProps) {
  const [eligibility, setEligibility] = useState<ReturnEligibility | null>(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(true);
  const [eligibilityError, setEligibilityError] = useState<string>("");

  // Selected items: map orderItemId -> quantity
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>(ReturnReason.DamagedInTransit);
  const [resolution, setResolution] = useState<ReturnResolution>(ReturnResolution.RefundToSource);
  const [comments, setComments] = useState("");
  const [mediaList, setMediaList] = useState<CreateReturnMediaInput[]>([]);
  const [mediaError, setMediaError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdReturnNumber, setCreatedReturnNumber] = useState("");

  const modalDescId = useId();

  // Load eligibility whenever modal opens
  useEffect(() => {
    if (!open) {
      setIsSuccess(false);
      setSubmitError("");
      setComments("");
      setMediaList([]);
      setMediaError("");
      return;
    }
    if (!orderId) return;

    let isMounted = true;
    setIsLoadingEligibility(true);
    setEligibilityError("");
    setIsSuccess(false);
    setSubmitError("");
    setComments("");
    setMediaList([]);
    setMediaError("");

    returnsApi
      .getEligibility(orderId)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setEligibility(res);
          // Pre-select first returnable item with quantity 1
          const initialSelected: Record<string, number> = {};
          const firstReturnable = res.items.find((i) => i.returnableQuantity > 0);
          if (firstReturnable) {
            initialSelected[firstReturnable.orderItemId] = 1;
          }
          setSelectedItems(initialSelected);
        } else {
          setEligibilityError("Unable to retrieve return eligibility for this order.");
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setEligibilityError(
          err instanceof Error ? err.message : "Failed to check return eligibility."
        );
      })
      .finally(() => {
        if (isMounted) setIsLoadingEligibility(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, orderId]);

  const toggleItem = (orderItemId: string) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[orderItemId]) {
        delete next[orderItemId];
      } else {
        next[orderItemId] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (orderItemId: string, qty: number, maxQty: number) => {
    const clamped = Math.max(1, Math.min(qty, maxQty));
    setSelectedItems((prev) => ({
      ...prev,
      [orderItemId]: clamped,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaError("");
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mediaList.length + files.length > 5) {
      setMediaError("A maximum of 5 defect proof photos can be attached.");
      return;
    }

    const newMedia: CreateReturnMediaInput[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setMediaError(`File ${file.name} exceeds the 5MB size limit.`);
        return;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        newMedia.push({
          url: dataUrl,
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          fileSizeBytes: file.size,
        });
      } catch {
        setMediaError(`Failed to process ${file.name}.`);
      }
    }

    setMediaList((prev) => [...prev, ...newMedia]);
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  // Find policy for currently selected reason
  const currentPolicy = eligibility?.policies?.find((p) => p.reason === reason);

  // Raw item refund subtotal (sum of unit refundPerItem * qty for selected items)
  const rawItemTotal = Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
    const item = eligibility?.items.find((i) => i.orderItemId === itemId);
    if (!item) return sum;
    return sum + item.refundPerItem * qty;
  }, 0);

  const isRefundResolution = resolution === ReturnResolution.RefundToSource;
  // If policy exists, respect its boolean flags; otherwise default to true for product, false for fees
  const allowProductRefund = currentPolicy ? currentPolicy.refundProductAmount : true;
  const allowShippingRefund = currentPolicy ? currentPolicy.refundShippingAmount : false;
  const allowPaymentFeeRefund = currentPolicy ? currentPolicy.refundPaymentFee : false;

  const estimatedProductRefund = isRefundResolution && allowProductRefund ? rawItemTotal : 0;
  const estimatedShippingRefund = isRefundResolution && allowShippingRefund ? (eligibility?.orderShippingAmount ?? 0) : 0;
  const estimatedPaymentFeeRefund = isRefundResolution && allowPaymentFeeRefund ? (eligibility?.orderPaymentFeeAmount ?? 0) : 0;
  const estimatedRefund = estimatedProductRefund + estimatedShippingRefund + estimatedPaymentFeeRefund;

  const selectedCount = Object.keys(selectedItems).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCount === 0) {
      setSubmitError("Please select at least one item to return.");
      return;
    }

    if (!comments.trim()) {
      setSubmitError("Please provide comments describing why you are returning the item(s).");
      return;
    }

    const itemsPayload: CreateReturnItemInput[] = Object.entries(selectedItems).map(
      ([orderItemId, quantity]) => ({
        orderItemId,
        quantity,
      })
    );

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await returnsApi.create(orderId, {
        items: itemsPayload,
        reason,
        resolution,
        customerComments: comments.trim(),
        media: mediaList.length > 0 ? mediaList : undefined,
      });

      if (res && res.success && res.data) {
        setIsSuccess(true);
        setCreatedReturnNumber(res.data.returnNumber);
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        setSubmitError(res?.message || "Failed to create return request.");
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-ink/50 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={modalDescId}
          className="fixed inset-3 z-70 m-auto flex max-h-[92vh] max-w-2xl flex-col rounded-2xl bg-ivory shadow-2xl overflow-hidden border border-ink/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
                <RotateCcw size={18} />
              </div>
              <div>
                <Dialog.Title className="font-display font-semibold text-ink text-base! sm:text-lg!">
                  Request Return / Refund
                </Dialog.Title>
                <p id={modalDescId} className="text-xs! text-ink-soft">
                  Order #{orderNumber}
                </p>
              </div>
            </div>
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="font-display font-semibold text-ink text-lg!">
                  Return Request Submitted!
                </h4>
                <p className="text-xs! sm:text-sm! text-ink-soft max-w-md">
                  Your return request{" "}
                  <span className="font-mono font-bold text-ink">
                    #{createdReturnNumber}
                  </span>{" "}
                  has been received and is pending review by our support team.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    onClick={() => onOpenChange(false)}
                    className="text-xs!"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : isLoadingEligibility ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="animate-spin text-oxblood" size={32} />
                <p className="text-xs! text-ink-soft">Checking return eligibility...</p>
              </div>
            ) : eligibilityError ? (
              <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-center space-y-2">
                <AlertCircle size={28} className="mx-auto text-oxblood" />
                <p className="font-medium text-xs! sm:text-sm! text-oxblood">
                  {eligibilityError}
                </p>
              </div>
            ) : !eligibility?.isEligible ? (
              <div className="rounded-2xl border border-turmeric/30 bg-turmeric/10 p-6 text-center space-y-3">
                <AlertCircle size={32} className="mx-auto text-turmeric-deep" />
                <h4 className="font-display font-medium text-ink text-base!">
                  Order Ineligible for Return
                </h4>
                <p className="text-xs! sm:text-sm! text-ink-soft max-w-md mx-auto">
                  {eligibility?.ineligibilityReason ||
                    "This order cannot be returned under our current return policy."}
                </p>
                {eligibility?.returnWindowExpiresOn && (
                  <p className="text-[11px]! text-ink-soft font-mono">
                    Window expired on:{" "}
                    {new Date(eligibility.returnWindowExpiresOn).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <form id="return-form" onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-3.5 text-xs! text-oxblood flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Step 1: Select Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-display font-medium text-ink text-xs! sm:text-sm!">
                      1. Select Items to Return
                    </label>
                    <span className="text-[11px]! text-ink-soft">
                      {selectedCount} item(s) selected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {eligibility.items.map((item) => {
                      const isSelected = Boolean(selectedItems[item.orderItemId]);
                      const currentQty = selectedItems[item.orderItemId] || 1;
                      const isProductReturnable = item.isReturnable ?? true;
                      const isReturnable = isProductReturnable && item.returnableQuantity > 0;

                      return (
                        <div
                          key={item.orderItemId}
                          className={`rounded-xl border p-3 transition-colors ${
                            !isReturnable
                              ? "border-ink/5 bg-ink/5 opacity-60 cursor-not-allowed"
                              : isSelected
                              ? "border-oxblood/40 bg-oxblood/5"
                              : "border-ink/10 bg-ivory hover:border-ink/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                disabled={!isReturnable}
                                checked={isSelected}
                                onChange={() => toggleItem(item.orderItemId)}
                                className="mt-1 h-4 w-4 rounded border-ink/20 text-oxblood focus:ring-oxblood disabled:opacity-40"
                              />
                              <div>
                                <h5 className="font-medium text-ink text-xs! sm:text-sm!">
                                  {item.productName}
                                </h5>
                                <p className="text-[11px]! text-ink-soft">
                                  Variant: {item.variantName} • Unit Price: {formatINR(item.unitPrice)}
                                </p>
                                {isReturnable && (
                                  <p className="text-[11px]! text-emerald-700 mt-0.5">
                                    Refund per unit: {formatINR(item.refundPerItem)}
                                  </p>
                                )}
                                {!isProductReturnable ? (
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <Badge variant="oxblood" className="text-[10px]!">Non-Returnable</Badge>
                                    <span className="text-[11px]! text-oxblood">
                                      {item.nonReturnableReason || "Non-returnable consumable item"}
                                    </span>
                                  </div>
                                ) : item.returnableQuantity <= 0 ? (
                                  <p className="text-[11px]! text-oxblood mt-0.5 font-medium">
                                    Already returned in full
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            {isSelected && isReturnable && (
                              <div className="flex items-center gap-1.5 shrink-0 bg-ivory rounded-lg border border-ink/15 px-2 py-1">
                                <span className="text-[10px]! uppercase text-ink-soft">Qty:</span>
                                <select
                                  value={currentQty}
                                  onChange={(e) =>
                                    updateQuantity(
                                      item.orderItemId,
                                      parseInt(e.target.value, 10),
                                      item.returnableQuantity
                                    )
                                  }
                                  className="bg-transparent text-xs! font-bold text-ink outline-none cursor-pointer"
                                >
                                  {Array.from(
                                    { length: item.returnableQuantity },
                                    (_, idx) => idx + 1
                                  ).map((q) => (
                                    <option key={q} value={q}>
                                      {q}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[10px]! text-ink-soft">
                                  / {item.returnableQuantity}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Reason & Resolution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-display font-medium text-ink text-xs! sm:text-sm!">
                      2. Reason for Return
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(Number(e.target.value) as ReturnReason)}
                      className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-xs! sm:text-sm! text-ink focus:border-oxblood focus:outline-none"
                    >
                      <option value={ReturnReason.DamagedInTransit}>
                        {ReturnReasonLabels[ReturnReason.DamagedInTransit]}
                      </option>
                      <option value={ReturnReason.DefectiveOrExpired}>
                        {ReturnReasonLabels[ReturnReason.DefectiveOrExpired]}
                      </option>
                      <option value={ReturnReason.WrongItemReceived}>
                        {ReturnReasonLabels[ReturnReason.WrongItemReceived]}
                      </option>
                      <option value={ReturnReason.QualityMismatch}>
                        {ReturnReasonLabels[ReturnReason.QualityMismatch]}
                      </option>
                      <option value={ReturnReason.MissingItem}>
                        {ReturnReasonLabels[ReturnReason.MissingItem]}
                      </option>
                      <option value={ReturnReason.LateDelivery}>
                        {ReturnReasonLabels[ReturnReason.LateDelivery]}
                      </option>
                      <option value={ReturnReason.OrderedByMistake}>
                        {ReturnReasonLabels[ReturnReason.OrderedByMistake]}
                      </option>
                      <option value={ReturnReason.PackageTampered}>
                        {ReturnReasonLabels[ReturnReason.PackageTampered]}
                      </option>
                      <option value={ReturnReason.TasteNotAsExpected}>
                        {ReturnReasonLabels[ReturnReason.TasteNotAsExpected]}
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-display font-medium text-ink text-xs! sm:text-sm!">
                      Preferred Resolution
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(Number(e.target.value) as ReturnResolution)}
                      className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-xs! sm:text-sm! text-ink focus:border-oxblood focus:outline-none"
                    >
                      <option value={ReturnResolution.RefundToSource}>
                        {ReturnResolutionLabels[ReturnResolution.RefundToSource]}
                      </option>
                      <option value={ReturnResolution.Replacement}>
                        {ReturnResolutionLabels[ReturnResolution.Replacement]}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Step 3: Comments */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-display font-medium text-ink text-xs! sm:text-sm!">
                      3. Describe the Issue
                    </label>
                    <span className="text-[11px]! text-ink-soft">
                      {comments.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide specific details about package damage, item defects, or expiry dates..."
                    className="w-full rounded-xl border border-ink/15 bg-ivory p-3 text-xs! sm:text-sm! text-ink focus:border-oxblood focus:outline-none resize-none placeholder:text-ink-soft/60"
                  />
                </div>

                {/* Step 4: Photo Proofs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-display font-medium text-ink text-xs! sm:text-sm!">
                      4. Defect Photo Proofs (Optional, max 5)
                    </label>
                    <span className="text-[11px]! text-ink-soft">
                      {mediaList.length}/5 uploaded
                    </span>
                  </div>

                  {mediaError && (
                    <p className="text-[11px]! text-oxblood">{mediaError}</p>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {mediaList.map((media, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl border border-ink/10 overflow-hidden bg-ink/5 group"
                      >
                        <img
                          src={media.url}
                          alt={media.fileName}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(idx)}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-ink/70 text-ivory flex items-center justify-center hover:bg-oxblood transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {mediaList.length < 5 && (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/20 bg-ivory hover:border-oxblood/50 hover:bg-oxblood/5 transition-colors p-2 text-center">
                        <Upload size={18} className="text-ink-soft mb-1" />
                        <span className="text-[10px]! font-medium text-ink-soft">
                          Upload Photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Live Refund / Resolution Summary */}
                {resolution === ReturnResolution.Replacement ? (
                  <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 flex items-start gap-3">
                    <Sparkles size={18} className="text-teal shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-display font-medium text-ink text-xs! sm:text-sm!">
                        Direct Product Replacement
                      </h5>
                      <p className="text-[11px]! text-ink-soft mt-0.5">
                        No refund will be processed to your payment method. Fresh replacement units will be prepared and dispatched once reverse pickup inspection completes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-ink/10 bg-ivory-dim/70 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-turmeric-deep" />
                        <span className="font-display font-semibold text-ink text-xs! sm:text-sm!">
                          Estimated Refund Calculation
                        </span>
                      </div>
                      <span className="text-[10px]! uppercase tracking-wider text-ink-soft font-mono">
                        Policy Breakdown
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs!">
                      <div className="flex justify-between items-center text-ink-soft">
                        <div className="flex items-center gap-1.5">
                          <span>Items Refund:</span>
                          {!allowProductRefund && (
                            <span className="rounded bg-oxblood/10 px-1.5 py-0.5 text-[10px]! font-medium text-oxblood">
                              Excluded by reason policy
                            </span>
                          )}
                        </div>
                        <span className={`font-mono ${allowProductRefund ? "text-ink" : "text-oxblood line-through"}`}>
                          {formatINR(allowProductRefund ? estimatedProductRefund : rawItemTotal)}
                        </span>
                      </div>

                      {allowShippingRefund && (eligibility?.orderShippingAmount ?? 0) > 0 && (
                        <div className="flex justify-between items-center text-emerald-700">
                          <div className="flex items-center gap-1.5">
                            <span>Original Shipping Fee:</span>
                            <span className="rounded bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px]! font-medium text-emerald-800 dark:text-emerald-300">
                              Refundable
                            </span>
                          </div>
                          <span className="font-mono">
                            + {formatINR(estimatedShippingRefund)}
                          </span>
                        </div>
                      )}

                      {allowPaymentFeeRefund && (eligibility?.orderPaymentFeeAmount ?? 0) > 0 && (
                        <div className="flex justify-between items-center text-emerald-700">
                          <div className="flex items-center gap-1.5">
                            <span>Payment Processing Fee:</span>
                            <span className="rounded bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px]! font-medium text-emerald-800 dark:text-emerald-300">
                              Refundable
                            </span>
                          </div>
                          <span className="font-mono">
                            + {formatINR(estimatedPaymentFeeRefund)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-ink/10 pt-2 font-bold text-ink text-sm! sm:text-base!">
                        <span>Estimated Total Refund:</span>
                        <span className="font-mono text-emerald-700">
                          {formatINR(estimatedRefund)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer */}
          {!isSuccess && eligibility?.isEligible && (
            <div className="flex items-center justify-end gap-3 border-t border-ink/10 px-5 py-3.5 sm:px-6 bg-ivory">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" className="text-xs!">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="return-form"
                disabled={isSubmitting || selectedCount === 0}
                className="text-xs! gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Package size={14} />
                    <span>Submit Return Request</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

