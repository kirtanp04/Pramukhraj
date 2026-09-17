import { Input, type InputProps } from "@/components/ui/Input";

export function OtpInput(props: InputProps) {
  return <Input {...props} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="h-11 text-center font-mono text-xl! tracking-[0.35em]" />;
}
