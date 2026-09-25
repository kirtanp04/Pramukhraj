import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  Download,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import { adminReturnsApi } from "@/features/admin-returns/api/adminReturnsApi";
import {
  ReturnStatus,
  ReturnStatusLabels,
  ReturnStatusBadgeVariants,
  ReturnReasonLabels,
} from "@/features/returns/types";
import type {
  AdminReturnSummary,
  AdminReturnStatusCounts,
} from "@/features/admin-returns/types";
import { AdminReturnDrawer } from "@/features/admin-returns/components/AdminReturnDrawer";
import { ReturnReasonPolicyTable } from "@/features/admin-returns/components/ReturnReasonPolicyTable";

const PAGE_SIZE = 15;

const initialCounts: AdminReturnStatusCounts = {
  total: 0,
  requested: 0,
  approved: 0,
  rejected: 0,
  pickupScheduled: 0,
  inTransit: 0,
  deliveredToWarehouse: 0,
  inspectionPassed: 0,
  inspectionFailed: 0,
  refundCompleted: 0,
  cancelled: 0,
};

export function AdminReturns() {
  const [returns, setReturns] = useState<AdminReturnSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState<AdminReturnStatusCounts>(initialCounts);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "policies">("queue");

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await adminReturnsApi.exportCsv({
        searchQuery: debouncedSearch || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `returns-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to export returns CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const reasonBreakdown = useMemo(() => {
    const counts: Record<number, number> = {};
    returns.forEach((r) => {
      counts[r.reason] = (counts[r.reason] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([reason, count]) => ({
        reason: Number(reason),
        label: ReturnReasonLabels[Number(reason) as keyof typeof ReturnReasonLabels] || "Other",
        count,
        percent: returns.length ? Math.round((count / returns.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [returns]);

  // Debounce search
  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(handler);
  }, [searchInput]);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError("");

    adminReturnsApi
      .getList({
        page,
        pageSize: PAGE_SIZE,
        searchQuery: debouncedSearch || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      })
      .then((res) => {
        if (res) {
          setReturns(res.returns);
          setTotalPages(res.totalPages);
          setTotalCount(res.totalCount);
          if (res.statusCounts) {
            setStatusCounts(res.statusCounts);
          }
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load returns list.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = useMemo<ColumnDef<AdminReturnSummary, unknown>[]>(
    () => [
      {
        header: "Return / RMA #",
        accessorKey: "returnNumber",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setSelectedReturnId(row.original.id)}
            className="font-mono text-xs! font-bold text-oxblood hover:underline text-left"
          >
            #{row.original.returnNumber}
          </button>
        ),
      },
      {
        header: "Order #",
        accessorKey: "orderNumber",
        cell: ({ row }) => (
          <span className="font-mono text-xs! text-ink-soft">
            #{row.original.orderNumber}
          </span>
        ),
      },
      {
        header: "Customer",
        accessorKey: "customerName",
        cell: ({ row }) => (
          <div className="flex flex-col text-xs!">
            <span className="font-medium text-ink">{row.original.customerName}</span>
            <span className="text-[11px]! text-ink-soft font-mono">
              {row.original.customerPhone || row.original.customerEmail}
            </span>
          </div>
        ),
      },
      {
        header: "Reason",
        accessorKey: "reason",
        cell: ({ row }) => (
          <span className="text-xs! text-ink max-w-[150px] truncate block">
            {ReturnReasonLabels[row.original.reason] ?? "Return"}
          </span>
        ),
      },
      {
        header: "Items",
        accessorKey: "totalItemCount",
        cell: ({ row }) => (
          <span className="text-xs! text-ink font-medium">
            {row.original.totalItemCount} unit(s)
          </span>
        ),
      },
      {
        header: "Net Refund",
        accessorKey: "netRefundAmount",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs! text-emerald-700">
            {formatINR(row.original.netRefundAmount)}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge variant={ReturnStatusBadgeVariants[row.original.status]}>
            {ReturnStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      {
        header: "Created Date",
        accessorKey: "createdOn",
        cell: ({ row }) => (
          <span className="text-xs! text-ink-soft">
            {formatDateTime(row.original.createdOn)}
          </span>
        ),
      },
      {
        header: "",
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedReturnId(row.original.id)}
            className="text-xs! gap-1 h-7 px-2.5"
          >
            <Eye size={12} />
            <span>Manage</span>
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl! font-semibold text-ink">
            Returns &amp; Refunds Management
          </h1>
          <p className="text-xs! sm:text-sm! text-ink-soft">
            Process customer returns, reverse pickups, warehouse QC inspection, and Razorpay refunds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "queue" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="text-xs! gap-1.5"
            >
              <Download size={13} className={isExporting ? "animate-spin" : ""} />
              <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs! gap-1.5"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Top Tab Bar: Returns Queue vs Refund Rules & Policy */}
      <div className="flex items-center gap-2 border-b border-ink/10">
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={cn(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs! font-semibold whitespace-nowrap transition-colors sm:text-sm!",
            activeTab === "queue"
              ? "border-oxblood bg-ivory text-oxblood shadow-xs font-bold"
              : "border-transparent text-ink-soft hover:border-ink/20 hover:text-ink"
          )}
        >
          <RotateCcw size={14} />
          <span>Returns Queue</span>
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[11px]! font-mono">
            {statusCounts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("policies")}
          className={cn(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs! font-semibold whitespace-nowrap transition-colors sm:text-sm!",
            activeTab === "policies"
              ? "border-oxblood bg-ivory text-oxblood shadow-xs font-bold"
              : "border-transparent text-ink-soft hover:border-ink/20 hover:text-ink"
          )}
        >
          <Sliders size={14} />
          <span>Refund Rules &amp; Policy</span>
        </button>
      </div>

      {activeTab === "policies" ? (
        <ReturnReasonPolicyTable />
      ) : (
        <>
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-3">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === "ALL"
              ? "bg-oxblood text-ivory"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          All ({statusCounts.total})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.Requested));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.Requested)
              ? "bg-turmeric-deep text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Requested ({statusCounts.requested})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.Approved));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.Approved)
              ? "bg-teal text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Approved ({statusCounts.approved})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.PickupScheduled));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.PickupScheduled)
              ? "bg-teal text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Pickup Scheduled ({statusCounts.pickupScheduled ?? 0})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.InTransit));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.InTransit)
              ? "bg-teal text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          In Transit ({statusCounts.inTransit})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.DeliveredToWarehouse));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.DeliveredToWarehouse)
              ? "bg-teal text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          At Warehouse ({statusCounts.deliveredToWarehouse})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.InspectionPassed));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.InspectionPassed)
              ? "bg-emerald-700 text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          QC Passed ({statusCounts.inspectionPassed})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.RefundCompleted));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.RefundCompleted)
              ? "bg-emerald-700 text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Refunded ({statusCounts.refundCompleted})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.Rejected));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.Rejected)
              ? "bg-oxblood text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Rejected ({statusCounts.rejected})
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter(String(ReturnStatus.Cancelled));
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs! font-medium transition-colors ${
            statusFilter === String(ReturnStatus.Cancelled)
              ? "bg-ink-soft text-white"
              : "bg-ivory-dim text-ink-soft hover:bg-ink/5"
          }`}
        >
          Cancelled ({statusCounts.cancelled})
        </button>
      </div>

      {/* Return Reason Analytics Breakdown */}
      {reasonBreakdown.length > 0 && (
        <div className="rounded-2xl border border-ink/10 bg-ivory-dim/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs!">
            <span className="font-semibold text-ink uppercase tracking-wider text-[11px]!">
              Defect &amp; Return Reason Distribution
            </span>
            <span className="text-ink-soft">
              {returns.length} return{returns.length === 1 ? "" : "s"} shown
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {reasonBreakdown.map((item) => (
              <div
                key={item.reason}
                className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white/80 px-2.5 py-1 text-xs! text-ink"
              >
                <span className="font-medium">{item.label}:</span>
                <span className="font-mono font-bold text-oxblood">{item.count}</span>
                <span className="text-[10px]! text-ink-soft font-mono">({item.percent}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by RMA #, Order #, Customer Name, or Phone..."
            className="w-full rounded-xl border border-ink/15 bg-ivory pl-9 pr-3 py-2 text-xs! sm:text-sm! text-ink outline-none focus:border-oxblood placeholder:text-ink-soft/60"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-xs! sm:text-sm! text-oxblood flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadData} className="text-xs!">
            Retry
          </Button>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-2xl border border-ink/10 bg-ivory overflow-hidden shadow-xs">
        <DataTable
          columns={columns}
          data={returns}
          pageSize={PAGE_SIZE}
          searchPlaceholder="Filter current rows..."
        />
      </div>

      {/* Server Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs! text-ink-soft">
            Showing Page {page} of {totalPages} ({totalCount} total returns)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs!"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs!"
            >
              Next
            </Button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Admin Return Slide-over Drawer */}
      <AdminReturnDrawer
        returnId={selectedReturnId}
        open={Boolean(selectedReturnId)}
        onOpenChange={(open) => {
          if (!open) setSelectedReturnId(null);
        }}
        onUpdated={loadData}
      />
    </div>
  );
}
