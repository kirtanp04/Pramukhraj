import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus } from "lucide-react";
import { AsyncEntityThumbnail } from "@/components/admin/AsyncEntityThumbnail";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MessageDialog } from "@/components/ui/MessageDialog";
import { ServerError } from "@/components/ui/ApiErrorPage";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { useMessageDialog } from "@/hooks/useMessageDialog";
import { useUrlPageParam } from "@/hooks/useUrlPageParam";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { AdminProductList } from "@/types/productSchema";

type ProductColumns = Parameters<
  typeof DataTable<AdminProductList>
>[0]["columns"];

interface VariantPriceDisplay {
  key: string;
  price: string;
  weight: string;
}

function parseVariantPrice(value: string, index: number): VariantPriceDisplay {
  const separatorIndex = value.indexOf("~");
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return {
      key: `${value}-${index}`,
      price: value || "Unavailable",
      weight: "Variant",
    };
  }

  const rawPrice = value.slice(0, separatorIndex).trim();
  const weight = value.slice(separatorIndex + 1).trim();
  const numericPrice = Number(rawPrice);

  return {
    key: `${value}-${index}`,
    price: Number.isFinite(numericPrice) ? formatINR(numericPrice) : rawPrice,
    weight: weight || "Variant",
  };
}

export function AdminProducts() {
  const navigate = useNavigate();
  const dialog = useMessageDialog();
  const { page, setPage } = useUrlPageParam();
  const {
    items: products,
    images: productImages,
    pagination,
    isInitialLoading,
    isPageFetching,
    listError,
    imagesLoading,
    imagesError,
    retry,
    removeItem,
  } = useAdminProducts(page);

  const [deleteTarget, setDeleteTarget] = useState<AdminProductList | null>(
    null
  );
  const canManage = true;

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setPage]
  );

  function confirmDelete() {
    if (!deleteTarget) return;
    removeItem(deleteTarget.id);
    dialog.success(`"${deleteTarget.name}" has been removed from this list.`, {
      title: "Product Removed",
    });
    setDeleteTarget(null);
  }

  const columns = useMemo<ProductColumns>(
    () => [
      {
        header: "Product",
        accessorKey: "name",
        cell: ({ row }) => {
          const product = row.original;
          const imageUrl = productImages[product.id.toLowerCase()]?.imageurl;

          return (
            <div className="flex items-center gap-3">
              <AsyncEntityThumbnail
                key={`${product.id}:${imageUrl ?? ""}`}
                imageUrl={imageUrl}
                alt={product.name}
                loading={imagesLoading}
              />
              <div className="min-w-0">
                <p className="max-w-64 truncate font-medium">{product.name}</p>
                <p className="max-w-64 truncate font-mono text-xs text-ink-soft">
                  {product.slug}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        header: "Category",
        accessorKey: "categoryName",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="max-w-48 truncate font-medium">
              {row.original.categoryName}
            </span>
            {!row.original.isCategoryActive && (
              <Badge
                variant={row.original.isCategoryActive ? "success" : "oxblood"}
                title={`Category is inactive`}
              >
                { "Inactive"}
              </Badge>
            )}
          </div>
        ),
      },
      {
        header: "Price by Weight",
        accessorKey: "price",
        enableSorting: false,
        cell: ({ row }) => {
          const prices = row.original.price ?? [];

          return prices.length > 0 ? (
            <div className="min-w-20 space-y-1">
              {prices.map(parseVariantPrice).map(variant => (
                <div
                  key={variant.key}
                  className="flex items-center justify-start gap-3 text-xs"
                >
                  <span className="font-mono font-semibold text-oxblood">
                    {variant.price}
                  </span>
                  <span className="font-medium text-ink-soft">
                    {variant.weight}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-ink-soft">—</span>
          );
        },
      },
      {
        header: "Stock",
        accessorKey: "stock",
        cell: ({ row }) => {
          const stock = row.original.stock;
          return (
            <Badge
              variant={
                stock === 0 ? "oxblood" : stock < 15 ? "turmeric" : "teal"
              }
            >
              {stock === 0 ? "Out of stock" : `${stock} units`}
            </Badge>
          );
        },
      },
      {
        header: "Labels",
        id: "labels",
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          const labels = [
            product.isFeatured && "Featured",
            product.isBestSeller && "Best Seller",
            product.isTrending && "Trending",
            product.isNewArrival && "New",
          ].filter(Boolean) as string[];

          return labels.length > 0 ? (
            <div className="flex max-w-52 flex-wrap gap-1">
              {labels.map(label => (
                <Badge key={label} variant="soft">
                  {label}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-ink-soft">—</span>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "isActive",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "success" : "oxblood"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        header: "Shelf Life",
        accessorKey: "shelfLife",
        cell: ({ row }) => row.original.shelfLife || "Lifetime",
      },
      {
        header: "Created On",
        accessorKey: "createdOn",
        cell: ({ row }) => (
          <time
            dateTime={row.original.createdOn}
            className="whitespace-nowrap text-xs text-ink-soft"
          >
            {formatDateTime(row.original.createdOn)}
          </time>
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
              onClick={() =>
                navigate(`/admin/products/${row.original.id}/edit`)
              }
              className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
              aria-label={`Edit ${row.original.name}`}
            >
              <Pencil size={14} aria-hidden />
            </button>
            {/* <button
              type="button"
              onClick={() => setDeleteTarget(row.original)}
              className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5"
              aria-label={`Delete ${row.original.name}`}
            >
              <Trash2 size={14} aria-hidden />
            </button> */}
          </div>
        ),
      },
    ],
    [canManage, imagesLoading, navigate, productImages]
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            {isInitialLoading
              ? "Loading products..."
              : `${products.length} products on page ${page}`}
            {imagesError && (
              <span
                className="text-[11px] text-turmeric-deep"
                title={imagesError}
              >
                Some images are unavailable.
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => navigate("/admin/products/new")}
            className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"
          >
            <Plus size={15} aria-hidden /> Add Product
          </button>
        )}
      </div>

      {listError ? (
        <ServerError
          className="h-auto min-h-96 py-16"
          message={listError}
          action={{ label: "Retry", onClick: () => void retry() }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={products}
          searchPlaceholder="Search this page by product or category..."
          pageSize={pagination.pageSize}
          isLoading={isInitialLoading}
          loadingRows={pagination.pageSize}
          emptyMessage={
            page > 1 ? "No products found on this page." : "No products found."
          }
          hideFooter={!isInitialLoading && products.length === 0 && page === 1}
          serverPagination={{
            page: pagination.page,
            hasPreviousPage: pagination.hasPreviousPage,
            hasNextPage: pagination.hasNextPage,
            isFetching: isPageFetching,
            onPageChange: handlePageChange,
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Remove this product from the list?"
        description={`"${deleteTarget?.name ?? ""}" will only be removed from the current view because a delete API is not connected yet.`}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />

      <MessageDialog {...dialog.props} />
    </div>
  );
}
