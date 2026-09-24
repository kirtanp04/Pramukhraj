import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  RotateCcw,
  Calendar,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { formatDateTime, formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { returnsApi } from "@/features/returns/api/returns.api";
import {
  ReturnStatus,
  ReturnStatusLabels,
  ReturnStatusBadgeVariants,
  ReturnReasonLabels,
  type CustomerReturnSummary,
} from "@/features/returns/types";
import { CustomerReturnDetailModal } from "@/features/returns/components/CustomerReturnDetailModal";

type FilterTab = "all" | "in_progress" | "completed" | "rejected_cancelled";

export function AccountReturns() {
  const [returns, setReturns] = useState<CustomerReturnSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const fetchReturns = (pageNumber = 1) => {
    setIsLoading(true);
    setError("");

    returnsApi
      .getList({ page: pageNumber, pageSize: 10 })
      .then((res) => {
        if (res) {
          setReturns(res.returns);
          setPage(res.pageNumber);
          setTotalPages(res.totalPages);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load returns.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchReturns(page);
  }, [page]);

  const filteredReturns = useMemo(() => {
    if (activeTab === "all") return returns;

    if (activeTab === "in_progress") {
      const inProgressStatuses: ReturnStatus[] = [
        ReturnStatus.Requested,
        ReturnStatus.Approved,
        ReturnStatus.PickupScheduled,
        ReturnStatus.PickedUp,
        ReturnStatus.InTransit,
        ReturnStatus.DeliveredToWarehouse,
        ReturnStatus.InspectionPassed,
        ReturnStatus.RefundInitiated,
      ];
      return returns.filter((r) => inProgressStatuses.includes(r.status));
    }

    if (activeTab === "completed") {
      return returns.filter(
        (r) => r.status === ReturnStatus.RefundCompleted || r.status === ReturnStatus.Closed
      );
    }

    if (activeTab === "rejected_cancelled") {
      return returns.filter(
        (r) =>
          r.status === ReturnStatus.Rejected ||
          r.status === ReturnStatus.Cancelled ||
          r.status === ReturnStatus.InspectionFailed
      );
    }

    return returns;
  }, [returns, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-ink text-xl! sm:text-2xl!">
            My Returns &amp; Refunds
          </h1>
          <p className="text-xs! sm:text-sm! text-ink-soft">
            Track status, inspection progress, and refund settlements
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchReturns(page)}
          className="text-xs! gap-1.5"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-full px-3.5 py-1.5 text-xs! font-medium transition-colors ${
            activeTab === "all"
              ? "bg-oxblood text-ivory"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          All Requests ({returns.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("in_progress")}
          className={`rounded-full px-3.5 py-1.5 text-xs! font-medium transition-colors ${
            activeTab === "in_progress"
              ? "bg-oxblood text-ivory"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          In Progress
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`rounded-full px-3.5 py-1.5 text-xs! font-medium transition-colors ${
            activeTab === "completed"
              ? "bg-oxblood text-ivory"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Completed
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rejected_cancelled")}
          className={`rounded-full px-3.5 py-1.5 text-xs! font-medium transition-colors ${
            activeTab === "rejected_cancelled"
              ? "bg-oxblood text-ivory"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Rejected / Cancelled
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-ink/10 bg-ivory animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-oxblood/20 bg-oxblood/5 p-6 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-oxblood" />
          <h4 className="font-display font-medium text-oxblood text-base!">
            Failed to load return requests
          </h4>
          <p className="text-xs! sm:text-sm! text-ink-soft">{error}</p>
          <Button onClick={() => fetchReturns(page)} size="sm">
            Try Again
          </Button>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-ivory p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/5 text-ink-soft">
            <RotateCcw size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-medium text-ink text-base! sm:text-lg!">
              No return requests found
            </h4>
            <p className="text-xs! sm:text-sm! text-ink-soft max-w-sm mx-auto">
              {activeTab === "all"
                ? "You haven't requested any returns or refunds yet. You can request returns from your delivered orders."
                : "No returns match the selected filter."}
            </p>
          </div>
          <div>
            <Button asChild size="sm" variant="outline" className="text-xs! gap-1.5">
              <Link to="/account/orders">
                <ShoppingBag size={14} />
                <span>Go to My Orders</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((ret) => (
            <div
              key={ret.id}
              className="rounded-2xl border border-ink/10 bg-ivory p-5 shadow-xs transition hover:border-ink/20 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-ink text-sm! sm:text-base!">
                    Return #{ret.returnNumber}
                  </span>
                  <Badge variant={ReturnStatusBadgeVariants[ret.status]}>
                    {ReturnStatusLabels[ret.status]}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs! text-ink-soft">
                  <Calendar size={13} />
                  <span>Requested on {formatDateTime(ret.createdOn)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs!">
                <div>
                  <span className="text-ink-soft block text-[11px]! uppercase font-medium">
                    Order Reference
                  </span>
                  <Link
                    to={`/account/orders/${ret.orderId}`}
                    className="font-mono font-medium text-oxblood hover:underline inline-flex items-center gap-1"
                  >
                    <span>#{ret.orderNumber}</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>

                <div>
                  <span className="text-ink-soft block text-[11px]! uppercase font-medium">
                    Reason &amp; Items
                  </span>
                  <span className="font-medium text-ink">
                    {ReturnReasonLabels[ret.reason] ?? "Return"} • {ret.totalItemCount} item(s)
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-ink-soft block text-[11px]! uppercase font-medium">
                    Net Refund
                  </span>
                  <span className="font-mono font-bold text-ink text-sm! sm:text-base! text-emerald-700">
                    {formatINR(ret.netRefundAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReturnId(ret.id)}
                  className="text-xs! gap-1.5"
                >
                  <span>Track Return Details</span>
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs! text-ink-soft">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs!"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-xs!"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Return Detail Modal */}
      <CustomerReturnDetailModal
        returnId={selectedReturnId}
        open={Boolean(selectedReturnId)}
        onOpenChange={(open) => {
          if (!open) setSelectedReturnId(null);
        }}
        onCancelled={() => {
          fetchReturns(page);
        }}
      />
    </div>
  );
}
