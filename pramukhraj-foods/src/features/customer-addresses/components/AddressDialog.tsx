import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState, type InputHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldError, FieldLabel } from "@/components/ui/Typography";
import { getApiErrorMessage } from "@/lib/apiClient";
import { addressSchema, type AddressFormValues } from "../schemas/address.schema";
import type { CustomerAddress } from "../types/address.types";

const emptyAddress: AddressFormValues = { recipientName: "", mobileNumber: "+91", email: "", addressLine1: "", addressLine2: "", landmark: "", city: "", state: "", postalCode: "", country: "India", addressType: "Home", isDefaultShipping: false, isDefaultBilling: false };

export function AddressDialog({ open, address, busy, onOpenChange, onSave }: { open: boolean; address: CustomerAddress | null; busy: boolean; onOpenChange: (open: boolean) => void; onSave: (values: AddressFormValues) => Promise<void> }) {
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema), defaultValues: emptyAddress });
  useEffect(() => {
    reset(address ? { recipientName: address.recipientName, mobileNumber: address.mobileNumber, email: address.email ?? "", addressLine1: address.addressLine1, addressLine2: address.addressLine2 ?? "", landmark: address.landmark ?? "", city: address.city, state: address.state, postalCode: address.postalCode, country: "India", addressType: address.addressType, isDefaultShipping: address.isDefaultShipping, isDefaultBilling: address.isDefaultBilling, concurrencyStamp: address.concurrencyStamp } : emptyAddress);
    setServerError("");
  }, [address, open, reset]);
  const submit = async (values: AddressFormValues) => {
    setServerError("");
    try { await onSave(values); onOpenChange(false); }
    catch (error) { setServerError(getApiErrorMessage(error)); }
  };
  const fieldError = (name: keyof AddressFormValues) => errors[name]?.message;
  return <Dialog.Root open={open} onOpenChange={next => { if (!busy) onOpenChange(next); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[75] bg-teal-deep/55 backdrop-blur-sm" /><Dialog.Content className="fixed inset-x-3 top-1/2 z-[76] max-h-[92vh] -translate-y-1/2 overflow-y-auto rounded-[1.75rem] bg-ivory p-5 shadow-2xl sm:left-1/2 sm:w-[min(94vw,680px)] sm:-translate-x-1/2 sm:p-8">
    <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-display text-2xl! text-ink">{address ? "Edit address" : "Add an address"}</Dialog.Title><Dialog.Description className="mt-1 text-sm! text-ink-soft">Used for delivery and billing during checkout.</Dialog.Description></div><Dialog.Close asChild><button aria-label="Close" className="rounded-full p-2 text-ink-soft hover:bg-ink/5"><X size={18} /></button></Dialog.Close></div>
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)} noValidate>
      <Field name="recipientName" label="Recipient name" register={register} error={fieldError("recipientName")} autoComplete="name" />
      <Field name="mobileNumber" label="Mobile number" register={register} error={fieldError("mobileNumber")} autoComplete="tel" />
      <Field name="email" label="Email (optional)" register={register} error={fieldError("email")} type="email" autoComplete="email" />
      <div><FieldLabel htmlFor="address-type">Address type</FieldLabel><select id="address-type" {...register("addressType")} className="h-12 w-full rounded-xl border border-ink/15 bg-ivory px-4 text-sm! outline-none"><option>Home</option><option>Work</option><option>Other</option></select></div>
      <Field name="addressLine1" label="Address line 1" register={register} error={fieldError("addressLine1")} className="sm:col-span-2" autoComplete="address-line1" />
      <Field name="addressLine2" label="Address line 2 (optional)" register={register} error={fieldError("addressLine2")} className="sm:col-span-2" autoComplete="address-line2" />
      <Field name="landmark" label="Landmark (optional)" register={register} error={fieldError("landmark")} />
      <Field name="city" label="City" register={register} error={fieldError("city")} autoComplete="address-level2" />
      <Field name="state" label="State" register={register} error={fieldError("state")} autoComplete="address-level1" />
      <Field name="postalCode" label="PIN code" register={register} error={fieldError("postalCode")} inputMode="numeric" autoComplete="postal-code" />
      <div className="sm:col-span-2 flex flex-col gap-3 rounded-xl bg-tan/35 p-4 sm:flex-row sm:gap-6"><label className="flex items-center gap-2 text-sm! text-ink"><input type="checkbox" className="accent-oxblood" {...register("isDefaultShipping")} />Default shipping</label><label className="flex items-center gap-2 text-sm! text-ink"><input type="checkbox" className="accent-oxblood" {...register("isDefaultBilling")} />Default billing</label></div>
      {serverError && <FieldError className="sm:col-span-2">{serverError}</FieldError>}
      <div className="flex justify-end gap-3 sm:col-span-2"><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={busy}>{busy ? <><LoaderCircle size={16} className="animate-spin" />Saving…</> : "Save address"}</Button></div>
    </form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function Field({ name, label, register, error, className, ...props }: { name: keyof AddressFormValues; label: string; register: ReturnType<typeof useForm<AddressFormValues>>["register"]; error?: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <div className={className}><FieldLabel htmlFor={`address-${name}`}>{label}</FieldLabel><Input id={`address-${name}`} error={Boolean(error)} {...props} {...register(name)} />{error && <FieldError>{error}</FieldError>}</div>;
}
