import { useEffect, useState, useMemo } from "react";
import * as Switch from "@radix-ui/react-switch";
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  Info,
  ShieldCheck,
  Truck,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { adminReturnsApi } from "../api/adminReturnsApi";
import { ReturnReason, ReturnReasonLabels } from "@/features/returns/types";
import type {
  ReturnReasonPolicy,
  UpdateReturnReasonPolicyItem,
} from "../types";
import { formatDateTime } from "@/lib/utils";

interface PolicyRowState {
  reason: ReturnReason;
  reasonName: string;
  refundProductAmount: boolean;
  refundShippingAmount: boolean;
  refundPaymentFee: boolean;
  updatedOn: string;
}

function getReasonCategoryBadge(reason: ReturnReason): {
  label: string;
  variant: "oxblood" | "turmeric" | "teal" | "soft";
} {
  switch (reason) {
    case ReturnReason.DamagedInTransit:
    case ReturnReason.DefectiveOrExpired:
    case ReturnReason.WrongItemReceived:
    case ReturnReason.PackageTampered:
      return { label: "Seller / Logistics Fault", variant: "oxblood" };
    case ReturnReason.MissingItem:
      return { label: "Fulfillment Error", variant: "oxblood" };
    case ReturnReason.LateDelivery:
      return { label: "Delivery Delay", variant: "turmeric" };
    case ReturnReason.QualityMismatch:
      return { label: "Quality Dispute", variant: "turmeric" };
    case ReturnReason.OrderedByMistake:
    case ReturnReason.TasteNotAsExpected:
    default:
      return { label: "Customer Discretion", variant: "soft" };
  }
}

export function ReturnReasonPolicyTable() {
  const [policies, setPolicies] = useState<PolicyRowState[]>([]);
  const [initialPolicies, setInitialPolicies] = useState<PolicyRowState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadPolicies = () => {
    setIsLoading(true);
    setError("");
    adminReturnsApi
      .getPolicies()
      .then((data) => {
        if (data && Array.isArray(data)) {
          const mapped = data.map((item: ReturnReasonPolicy) => ({
            reason: item.reason,
            reasonName:
              ReturnReasonLabels[item.reason] ||
              item.reasonName ||
              `Reason #${item.reason}`,
            refundProductAmount: Boolean(item.refundProductAmount),
            refundShippingAmount: Boolean(item.refundShippingAmount),
            refundPaymentFee: Boolean(item.refundPaymentFee),
            updatedOn: item.updatedOn,
          }));
          setPolicies(mapped);
          setInitialPolicies(mapped);
        } else {
          setError("Failed to load return reason policies from server.");
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading refund policies."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const isDirty = useMemo(() => {
    if (policies.length === 0 || initialPolicies.length === 0) return false;
    if (policies.length !== initialPolicies.length) return true;

    for (let i = 0; i < policies.length; i++) {
      const current = policies[i];
      const original = initialPolicies.find((p) => p.reason === current.reason);
      if (!original) return true;
      if (
        current.refundProductAmount !== original.refundProductAmount ||
        current.refundShippingAmount !== original.refundShippingAmount ||
        current.refundPaymentFee !== original.refundPaymentFee
      ) {
        return true;
      }
    }
    return false;
  }, [policies, initialPolicies]);

  const handleToggle = (
    reason: ReturnReason,
    field: "refundProductAmount" | "refundShippingAmount" | "refundPaymentFee",
    value: boolean
  ) => {
    setSuccessMessage("");
    setPolicies((prev) =>
      prev.map((row) =>
        row.reason === reason ? { ...row, [field]: value } : row
      )
    );
  };

  const handleReset = () => {
    setPolicies(initialPolicies);
    setSuccessMessage("");
    setError("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    const payloadItems: UpdateReturnReasonPolicyItem[] = policies.map((p) => ({
      reason: p.reason,
      refundProductAmount: p.refundProductAmount,
      refundShippingAmount: p.refundShippingAmount,
      refundPaymentFee: p.refundPaymentFee,
    }));

    try {
      const res = await adminReturnsApi.updatePolicies({ policies: payloadItems });
      if (res?.success && res.data) {
        const updated = res.data.map((item: ReturnReasonPolicy) => ({
          reason: item.reason,
          reasonName:
            ReturnReasonLabels[item.reason] ||
            item.reasonName ||
            `Reason #${item.reason}`,
          refundProductAmount: Boolean(item.refundProductAmount),
          refundShippingAmount: Boolean(item.refundShippingAmount),
          refundPaymentFee: Boolean(item.refundPaymentFee),
          updatedOn: item.updatedOn,
        }));
        setPolicies(updated);
        setInitialPolicies(updated);
        setSuccessMessage("Return reason policies successfully updated and saved.");
      } else {
        setError(res?.message || "Failed to update return reason policies.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save return reason refund policies."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-ink/10 bg-ivory p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-oxblood/10 p-2.5 text-oxblood shrink-0 mt-0.5">
            <Sliders size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg! sm:text-xl! font-semibold text-ink">
                Refund Rules &amp; Reason Policy Matrix
              </h2>
              {isDirty && (
                <span className="rounded-full bg-turmeric-light/30 border border-turmeric px-2 py-0.5 text-[10px]! font-semibold text-ink">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs! text-ink-soft mt-1 max-w-2xl leading-relaxed">
              Define which monetary components are automatically eligible for refund based on the return reason selected by the customer. When processing approvals, QC inspections, or Razorpay refunds, the system strictly enforces these rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || isSaving || isLoading}
            className="text-xs! gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Discard</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving || isLoading}
            className="text-xs! gap-1.5 min-w-[130px]"
          >
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Policies</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs! sm:text-sm! text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-oxblood/30 bg-oxblood/5 p-3.5 text-xs! sm:text-sm! text-oxblood flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadPolicies}
            className="text-xs! border-oxblood/30 text-oxblood"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Policy Table Grid */}
      <div className="rounded-2xl border border-ink/10 bg-ivory shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="animate-spin text-oxblood" size={32} />
            <p className="text-xs! text-ink-soft">Loading refund policies...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-ivory-dim/70 text-xs! font-semibold text-ink uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6 w-[36%] min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-oxblood" />
                      <span>Return Reason</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 sm:px-6 w-[21%] min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={15} className="text-teal" />
                      <span>Refund Product Total</span>
                    </div>
                    <span className="block text-[10px]! font-normal text-ink-soft normal-case mt-0.5">
                      Items purchased amount
                    </span>
                  </th>
                  <th className="py-4 px-4 sm:px-6 w-[21%] min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Truck size={15} className="text-turmeric-deep" />
                      <span>Refund Shipping</span>
                    </div>
                    <span className="block text-[10px]! font-normal text-ink-soft normal-case mt-0.5">
                      Forward shipping fee paid
                    </span>
                  </th>
                  <th className="py-4 px-4 sm:px-6 w-[22%] min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} className="text-oxblood" />
                      <span>Refund Payment Fee</span>
                    </div>
                    <span className="block text-[10px]! font-normal text-ink-soft normal-case mt-0.5">
                      Gateway &amp; processing tax
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {policies.map((row) => {
                  const badge = getReasonCategoryBadge(row.reason);
                  return (
                    <tr
                      key={row.reason}
                      className="hover:bg-ivory-dim/40 transition-colors"
                    >
                      {/* Reason Column */}
                      <td className="py-4 px-4 sm:px-6 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-medium text-ink text-xs! sm:text-sm!">
                              {row.reasonName}
                            </span>
                            <Badge variant={badge.variant} className="text-[10px]! py-0 px-2">
                              {badge.label}
                            </Badge>
                          </div>
                          <span className="text-[10px]! text-ink-soft block font-mono">
                            Reason Code #{row.reason}
                            {row.updatedOn && ` • Updated ${formatDateTime(row.updatedOn)}`}
                          </span>
                        </div>
                      </td>

                      {/* Refund Product Total Amount Switch */}
                      <td className="py-4 px-4 sm:px-6 align-middle">
                        <div className="flex items-center gap-3">
                          <Switch.Root
                            checked={row.refundProductAmount}
                            onCheckedChange={(checked) =>
                              handleToggle(row.reason, "refundProductAmount", checked)
                            }
                            aria-label={`Refund product total for ${row.reasonName}`}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-oxblood/30 ${
                              row.refundProductAmount ? "bg-emerald-600" : "bg-ink/15"
                            }`}
                          >
                            <Switch.Thumb
                              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                                row.refundProductAmount ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </Switch.Root>
                          <span
                            className={`text-xs! font-medium ${
                              row.refundProductAmount
                                ? "text-emerald-700 font-semibold"
                                : "text-ink-soft"
                            }`}
                          >
                            {row.refundProductAmount ? "Eligible" : "Excluded"}
                          </span>
                        </div>
                      </td>

                      {/* Refund Shipping Amount Switch */}
                      <td className="py-4 px-4 sm:px-6 align-middle">
                        <div className="flex items-center gap-3">
                          <Switch.Root
                            checked={row.refundShippingAmount}
                            onCheckedChange={(checked) =>
                              handleToggle(row.reason, "refundShippingAmount", checked)
                            }
                            aria-label={`Refund shipping amount for ${row.reasonName}`}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-oxblood/30 ${
                              row.refundShippingAmount ? "bg-emerald-600" : "bg-ink/15"
                            }`}
                          >
                            <Switch.Thumb
                              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                                row.refundShippingAmount ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </Switch.Root>
                          <span
                            className={`text-xs! font-medium ${
                              row.refundShippingAmount
                                ? "text-emerald-700 font-semibold"
                                : "text-ink-soft"
                            }`}
                          >
                            {row.refundShippingAmount ? "Refunded" : "Retained"}
                          </span>
                        </div>
                      </td>

                      {/* Refund Payment Amount Switch */}
                      <td className="py-4 px-4 sm:px-6 align-middle">
                        <div className="flex items-center gap-3">
                          <Switch.Root
                            checked={row.refundPaymentFee}
                            onCheckedChange={(checked) =>
                              handleToggle(row.reason, "refundPaymentFee", checked)
                            }
                            aria-label={`Refund payment processing fee for ${row.reasonName}`}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-oxblood/30 ${
                              row.refundPaymentFee ? "bg-emerald-600" : "bg-ink/15"
                            }`}
                          >
                            <Switch.Thumb
                              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                                row.refundPaymentFee ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </Switch.Root>
                          <span
                            className={`text-xs! font-medium ${
                              row.refundPaymentFee
                                ? "text-emerald-700 font-semibold"
                                : "text-ink-soft"
                            }`}
                          >
                            {row.refundPaymentFee ? "Refunded" : "Retained"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Policy Note */}
      <div className="rounded-2xl border border-ink/10 bg-ivory-dim/60 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs! font-semibold text-ink uppercase tracking-wider text-[11px]!">
          <Info size={15} className="text-teal" />
          <span>How Policy Enforcement Works</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs! text-ink-soft">
          <div className="rounded-xl border border-ink/10 bg-ivory p-3 space-y-1">
            <span className="font-semibold text-ink block">Refund Product Total</span>
            <p>
              When checked, approved items or items that pass warehouse QC inspection have their unit prices calculated into the customer refund.
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-ivory p-3 space-y-1">
            <span className="font-semibold text-ink block">Refund Shipping</span>
            <p>
              When enabled, original forward delivery charges paid by the customer are added to the refund when the full order is returned.
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-ivory p-3 space-y-1">
            <span className="font-semibold text-ink block">Refund Payment Fee</span>
            <p>
              When enabled, commercial payment gateway processing fees / service tax collected during checkout are credited back to the customer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
