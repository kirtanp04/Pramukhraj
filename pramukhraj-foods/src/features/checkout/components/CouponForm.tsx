import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldError } from "@/components/ui/Typography";
import { couponSchema, type CouponValues } from "../schemas/checkout.schema";

export function CouponForm({ currentCode, busy, onApply, onRemove }: { currentCode: string | null; busy: boolean; onApply: (code: string) => Promise<void>; onRemove: () => Promise<void> }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<CouponValues>({ resolver: zodResolver(couponSchema), defaultValues: { couponCode: "" } });
  if (currentCode) return <div className="flex items-center justify-between rounded-xl border border-green-700/20 bg-green-50 px-4 py-3"><div><p className="text-xs! font-semibold uppercase tracking-wide text-green-800">Coupon applied</p><p className="text-sm! font-semibold text-ink">{currentCode}</p></div><button disabled={busy} onClick={() => void onRemove()} className="text-xs! font-semibold text-oxblood">Remove</button></div>;
  return <form onSubmit={handleSubmit(async values => { try { await onApply(values.couponCode); } catch (error) { setError("couponCode", { message: error instanceof Error ? error.message : "Coupon could not be applied." }); } })} noValidate><div className="flex gap-2"><Input aria-label="Coupon code" placeholder="Coupon code" error={Boolean(errors.couponCode)} {...register("couponCode")} /><Button variant="outline" disabled={busy}>Apply</Button></div>{errors.couponCode?.message && <FieldError>{errors.couponCode.message}</FieldError>}</form>;
}
