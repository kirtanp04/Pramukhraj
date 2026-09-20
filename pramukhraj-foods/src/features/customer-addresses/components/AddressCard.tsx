import { MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CustomerAddress } from "../types/address.types";

export function AddressCard({ address, selected, disabled, onSelect, onEdit, onDelete, onDefaultShipping, onDefaultBilling }: {
  address: CustomerAddress; selected?: boolean; disabled?: boolean; onSelect?: () => void; onEdit: () => void; onDelete: () => void; onDefaultShipping: () => void; onDefaultBilling: () => void;
}) {
  return <article className={`rounded-2xl border p-4 transition ${selected ? "border-oxblood bg-oxblood/5" : "border-ink/10 bg-white/55"}`}>
    <button type="button" disabled={!onSelect || disabled} onClick={onSelect} className="w-full text-left disabled:cursor-default">
      <div className="flex items-start justify-between gap-3"><p className="flex items-center gap-2 text-sm! font-semibold"><MapPin size={15} className="text-oxblood" />{address.addressType}</p><div className="flex flex-wrap justify-end gap-1">{address.isDefaultShipping && <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px]! font-semibold text-teal">Shipping</span>}{address.isDefaultBilling && <span className="rounded-full bg-tan px-2 py-0.5 text-[10px]! font-semibold text-ink">Billing</span>}</div></div>
      <p className="mt-3 text-sm! font-medium">{address.recipientName}</p><p className="mt-1 text-sm! leading-6 text-ink-soft">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}<br />{address.city}, {address.state} {address.postalCode}</p><p className="mt-2 text-xs! text-ink-soft">{address.mobileNumber}{address.email ? ` · ${address.email}` : ""}</p>
    </button>
    <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-3"><Button size="sm" variant="ghost" onClick={onEdit} disabled={disabled}><Pencil size={13} />Edit</Button><Button size="sm" variant="ghost" onClick={onDelete} disabled={disabled}><Trash2 size={13} />Remove</Button>{!address.isDefaultShipping && <Button size="sm" variant="outline" onClick={onDefaultShipping} disabled={disabled}>Default shipping</Button>}{!address.isDefaultBilling && <Button size="sm" variant="outline" onClick={onDefaultBilling} disabled={disabled}>Default billing</Button>}</div>
  </article>;
}
