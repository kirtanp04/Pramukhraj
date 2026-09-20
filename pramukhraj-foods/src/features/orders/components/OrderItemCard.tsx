import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { loadCustomerProductImage } from "@/services/customerProductImageLoader";
import type { CustomerOrderItemSummary, PendingOrderItem } from "../types/order.types";

interface OrderItemCardProps {
  item: CustomerOrderItemSummary | PendingOrderItem;
}

export function OrderItemCard({ item }: OrderItemCardProps) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    void loadCustomerProductImage(item.productId).then((url) => {
      if (active) {
        setImageUrl(url);
      }
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [item.productId]);

  const weightInfo = "weight" in item && item.weight > 0 ? `${item.weight} ${item.weightUnit}` : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-ink/10 bg-ivory p-4 transition-colors hover:border-oxblood/30">
      <div className="flex items-center gap-3.5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ivory-dim border border-ink/5">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.productName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-soft">
              <Package size={24} />
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          <Link
            to={`/product/${item.productSlug}`}
            className="font-medium text-ink hover:text-oxblood line-clamp-1 transition-colors text-sm! sm:text-base!"
          >
            {item.productName}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs! text-ink-soft">
            {item.variantName && <span>Variant: {item.variantName}</span>}
            {weightInfo && <span>• {weightInfo}</span>}
            {item.sku && <span>• SKU: {item.sku}</span>}
          </div>
          <p className="text-xs! text-ink-soft">
            Qty: <span className="font-semibold text-ink">{item.quantity}</span> × {formatINR(item.unitPrice)}
          </p>
        </div>
      </div>

      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 border-t border-ink/5 pt-2 sm:border-0 sm:pt-0">
        <span className="text-xs! text-ink-soft sm:hidden">Total:</span>
        <span className="font-mono font-semibold text-ink text-sm! sm:text-base!">
          {formatINR(item.lineTotal)}
        </span>
      </div>
    </div>
  );
}
