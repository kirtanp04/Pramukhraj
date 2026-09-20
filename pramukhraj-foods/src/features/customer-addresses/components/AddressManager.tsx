import { LoaderCircle, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddressCard } from "./AddressCard";
import { AddressDialog } from "./AddressDialog";
import { useCustomerAddresses } from "../hooks/useCustomerAddresses";
import type { AddressFormValues } from "../schemas/address.schema";
import type { CustomerAddress } from "../types/address.types";

export function AddressManager({ selectable, selectedId, onSelect, onAddressChanged, onAddressRemoved }: { selectable?: boolean; selectedId?: string | null; onSelect?: (address: CustomerAddress) => void; onAddressChanged?: (address: CustomerAddress) => void; onAddressRemoved?: (address: CustomerAddress) => void }) {
  const addressState = useCustomerAddresses();
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  if (addressState.isLoading) return <div className="flex items-center justify-center rounded-2xl border border-ink/10 p-12 text-sm! text-ink-soft"><LoaderCircle size={18} className="mr-2 animate-spin" />Loading addresses…</div>;
  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl! text-ink">Saved addresses</h2>{selectable && <p className="mt-1 text-xs! text-ink-soft">Choose where this order should be delivered.</p>}</div><Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus size={14} />Add address</Button></div>
    {addressState.error && <div role="alert" className="mb-4 rounded-xl border border-oxblood/20 bg-oxblood/5 p-3 text-sm! text-oxblood">{addressState.error}</div>}
    {addressState.addresses.length === 0 ? <div className="rounded-2xl border border-dashed border-ink/20 px-5 py-12 text-center"><MapPin className="mx-auto text-ink-soft" /><p className="mt-3 text-sm! font-medium">No saved addresses yet</p><p className="mt-1 text-xs! text-ink-soft">Add a secure delivery address to continue.</p></div>
      : <div className="grid gap-4 sm:grid-cols-2">{addressState.addresses.map(address => <AddressCard key={address.id} address={address} selected={selectedId === address.id} disabled={addressState.isMutating} onSelect={selectable ? () => onSelect?.(address) : undefined} onEdit={() => { setEditing(address); setDialogOpen(true); }} onDelete={() => { if (window.confirm("Remove this saved address?")) void addressState.remove(address.id).then(() => onAddressRemoved?.(address)).catch(() => undefined); }} onDefaultShipping={() => void addressState.setDefaultShipping(address.id).catch(() => undefined)} onDefaultBilling={() => void addressState.setDefaultBilling(address.id).catch(() => undefined)} />)}</div>}
    <AddressDialog open={dialogOpen} address={editing} busy={addressState.isMutating} onOpenChange={setDialogOpen} onSave={async (values: AddressFormValues) => { const saved = await addressState.save(values, editing?.id); if (saved) onAddressChanged?.(saved); }} />
  </div>;
}
