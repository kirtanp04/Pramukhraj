import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FieldError, FieldLabel } from "@/components/ui/Typography";
import { verificationCodeSchema, type VerificationCodeValues } from "../schemas/verification.schema";
import { OtpInput } from "./OtpInput";
import { ResendCountdown } from "./ResendCountdown";

export function VerificationCodeForm({ busy, error, resendAfter, onVerify, onResend }: {
  busy: boolean;
  error: string;
  resendAfter: number;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const [cooldown, setCooldown] = useState(resendAfter);
  useEffect(() => { setCooldown(resendAfter); }, [resendAfter]);
  const { register, handleSubmit, formState: { errors } } = useForm<VerificationCodeValues>({
    resolver: zodResolver(verificationCodeSchema), defaultValues: { code: "" },
  });
  return <form className="mt-3" onSubmit={handleSubmit(values => onVerify(values.code))} noValidate>
    <FieldLabel htmlFor="verification-code">Verification code</FieldLabel>
    <OtpInput id="verification-code" autoFocus error={Boolean(errors.code || error)} {...register("code")} />
    {(errors.code?.message || error) && <FieldError>{errors.code?.message || error}</FieldError>}
    <Button className="mt-3 w-full" disabled={busy}>{busy ? <><LoaderCircle size={17} className="animate-spin" />Verifying…</> : "Verify code"}</Button>
    <button type="button" disabled={busy || cooldown > 0} onClick={() => void onResend()} className="mt-2 w-full text-center text-xs! font-medium text-oxblood disabled:text-ink-soft">
      {cooldown > 0 ? <>Resend available in <ResendCountdown seconds={resendAfter} onReady={() => setCooldown(0)} /></> : "Resend code"}
    </button>
  </form>;
}
