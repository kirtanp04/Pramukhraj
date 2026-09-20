import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldError, FieldLabel } from "@/components/ui/Typography";
import { verificationEmailSchema, type VerificationEmailValues } from "../schemas/verification.schema";

export function EmailAddressForm({ busy, error, defaultEmail, onSubmit }: {
  busy: boolean;
  error: string;
  defaultEmail?: string;
  onSubmit: (email: string) => Promise<void>;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VerificationEmailValues>({
    resolver: zodResolver(verificationEmailSchema),
    defaultValues: { email: defaultEmail ?? "" },
  });
  useEffect(() => { reset({ email: defaultEmail ?? "" }); }, [defaultEmail, reset]);
  return <form className="mt-3" onSubmit={handleSubmit(values => onSubmit(values.email))} noValidate>
    <FieldLabel htmlFor="verification-email">Email address</FieldLabel>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input id="verification-email" type="email" autoComplete="email" placeholder="you@example.com" error={Boolean(errors.email || error)} {...register("email")} />
      <Button className="shrink-0 px-5" disabled={busy}>{busy ? <><LoaderCircle size={17} className="animate-spin" />Sending…</> : "Send code"}</Button>
    </div>
    {(errors.email?.message || error) && <FieldError>{errors.email?.message || error}</FieldError>}
  </form>;
}
