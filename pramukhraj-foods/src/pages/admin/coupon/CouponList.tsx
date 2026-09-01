import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable } from "@/components/admin/DataTable";
import { ServerError } from "@/components/ui/ApiErrorPage";
import { MessageDialog } from "@/components/ui/MessageDialog";
import { useCouponList } from "@/hooks/coupon/useCouponList";
import { useMessageDialog } from "@/hooks/useMessageDialog";
import { useUrlPageParam } from "@/hooks/useUrlPageParam";
import { getApiErrorMessage } from "@/lib/apiClient";
import { couponApi } from "@/services/couponApi";
import { CouponStatusBadge } from "@/pages/admin/coupon/components/CouponStatusBadge";
import type {
  CouponApplicationScope,
  CouponListItemResponse,
} from "@/types/coupon";
import { formatDate } from "@/lib/utils";

export function CouponList() {
  const navigate = useNavigate();
  const { page, setPage } = useUrlPageParam();
  const { data, error, isLoading, refresh } = useCouponList(page);
  const dialog = useMessageDialog();
  const [archiveTarget, setArchiveTarget] =
    useState<CouponListItemResponse | null>(null);
  const [archiving, setArchiving] = useState(false);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setPage]
  );

  async function archiveCoupon() {
    if (!archiveTarget || archiving) return;
    const target = archiveTarget;
    setArchiving(true);
    try {
      await couponApi.archive(target.id);
      refresh();
      dialog.success(`Coupon “${target.code}” was archived successfully.`, {
        title: "Coupon Archived",
      });
    } catch (caught: unknown) {
      dialog.error(getApiErrorMessage(caught), {
        title: "Could Not Archive Coupon",
      });
    } finally {
      setArchiving(false);
      setArchiveTarget(null);
    }
  }

  const columns = useMemo<ColumnDef<CouponListItemResponse, unknown>[]>(
    () => [
      {
        header: "Coupon",
        accessorKey: "code",
        cell: ({ row }) => (
          <div>
            <p className="font-mono font-semibold text-ink">
              {row.original.code}
            </p>
            <p className="max-w-48 truncate text-xs text-ink-soft">
              {row.original.name}
            </p>
          </div>
        ),
      },
      {
        header: "Discount",
        accessorKey: "displayFriendlyDiscount",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {row.original.displayFriendlyDiscount}
            </p>
            <p className="text-xs text-ink-soft">
              Min. ₹{row.original.minimumOrderAmount.toLocaleString("en-IN")}
              {row.original.maximumDiscountAmount
                ? ` · Max. ₹${row.original.maximumDiscountAmount.toLocaleString("en-IN")}`
                : ""}
            </p>
          </div>
        ),
      },
      {
        header: "Scope",
        accessorKey: "applicationScope",
        cell: ({ row }) => (
          <span className="text-xs text-ink-soft">
            {scopeLabel(row.original.applicationScope)}
            {row.original.scopeItemCount
              ? ` · ${row.original.scopeItemCount} selected`
              : ""}
          </span>
        ),
      },
      {
        header: "Usage",
        accessorKey: "redeemedUsageCount",
        cell: ({ row }) => (
          <span>
            {row.original.redeemedUsageCount} /{" "}
            {row.original.totalUsageLimit ?? "∞"}
          </span>
        ),
      },
      {
        header: "Validity",
        accessorKey: "endOn",
        cell: ({ row }) => (
          <div className="text-xs">
            <p>{formatDate(row.original.startOn)}</p>
            <p className="text-ink-soft">
              to {formatDate(row.original.endOn)}
            </p>
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "computedStatus",
        cell: ({ row }) => (
          <CouponStatusBadge status={row.original.computedStatus} />
        ),
      },
      {
        header: "",
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={row.original.isDeleted}
              onClick={() => navigate(`/admin/coupons/${row.original.id}/edit`)}
              className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5 disabled:opacity-30"
              aria-label={`Edit ${row.original.code}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              disabled={row.original.isDeleted}
              onClick={() => setArchiveTarget(row.original)}
              className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5 disabled:opacity-30"
              aria-label={`Archive ${row.original.code}`}
            >
              <Archive size={14} />
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Coupons</h1>
          <p className="text-sm text-ink-soft">
            {isLoading
              ? "Loading coupons..."
              : `${data?.items.length ?? 0} coupons on page ${page}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/coupons/new")}
          className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"
        >
          <Plus size={15} /> Add Coupon
        </button>
      </div>

      {error ? (
        <ServerError
          className="h-auto min-h-96 py-16"
          message={error}
          action={{ label: "Retry", onClick: refresh }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          searchPlaceholder="Search this page by code, name, discount or status..."
          pageSize={20}
          isLoading={isLoading}
          loadingRows={8}
          emptyMessage={
            page > 1 ? "No coupons found on this page." : "No coupons found."
          }
          hideFooter={
            !isLoading && (data?.items.length ?? 0) === 0 && page === 1
          }
          serverPagination={{
            page,
            hasPreviousPage: page > 1,
            hasNextPage: Boolean(data && page < data.totalPages),
            isFetching: isLoading,
            onPageChange: handlePageChange,
          }}
        />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={open => !open && setArchiveTarget(null)}
        title="Archive this coupon?"
        description={`“${archiveTarget?.code ?? ""}” will no longer be redeemable. Its usage history will be preserved.`}
        confirmLabel={archiving ? "Archiving..." : "Archive"}
        onConfirm={() => void archiveCoupon()}
      />
      <MessageDialog {...dialog.props} />
    </div>
  );
}

function scopeLabel(scope: CouponApplicationScope) {
  return scope === "AllProducts"
    ? "All products"
    : scope === "SpecificProducts"
      ? "Specific products"
      : "Specific categories";
}
