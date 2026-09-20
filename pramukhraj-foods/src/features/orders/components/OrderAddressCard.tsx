import { MapPin, Phone, Mail } from "lucide-react";
import type { PendingOrderAddress } from "../types/order.types";

interface OrderAddressCardProps {
  title: string;
  address?: PendingOrderAddress | null;
}

export function OrderAddressCard({ title, address }: OrderAddressCardProps) {
  if (!address) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs space-y-3">
      <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
        <MapPin size={16} className="text-oxblood" />
        <h4 className="font-display font-medium text-ink text-base!">{title}</h4>
      </div>

      <div className="space-y-1.5 text-xs! sm:text-sm!">
        <p className="font-semibold text-ink">{address.recipientName}</p>
        <p className="text-ink-soft">
          {address.addressLine1}
          {address.addressLine2 ? `, ${address.addressLine2}` : ""}
        </p>
        {address.landmark && (
          <p className="text-ink-soft">
            <span className="text-ink-soft/80">Landmark:</span> {address.landmark}
          </p>
        )}
        <p className="text-ink-soft">
          {address.city}, {address.state} - <span className="font-mono font-medium text-ink">{address.postalCode}</span>
        </p>
        <p className="text-ink-soft">{address.country}</p>

        <div className="border-t border-ink/5 pt-2 mt-2 space-y-1 text-xs! text-ink-soft">
          <div className="flex items-center gap-1.5">
            <Phone size={13} className="text-oxblood" />
            <span className="font-mono">{address.mobileNumber}</span>
          </div>
          {address.email && (
            <div className="flex items-center gap-1.5">
              <Mail size={13} className="text-oxblood" />
              <span>{address.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

