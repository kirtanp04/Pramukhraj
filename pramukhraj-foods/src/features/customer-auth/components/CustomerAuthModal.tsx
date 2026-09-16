import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck, Smartphone, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FieldError, FieldLabel } from "@/components/ui/Typography";
import { getApiErrorMessage } from "@/lib/apiClient";
import { mobileSchema, otpSchema, profileSchema } from "../schemas/authSchemas";
import { customerAuthApi } from "../services/customerAuthApi";
import { useCustomerAuthStore } from "../store/customerAuthStore";
import { useCartStore } from "@/features/cart/store/cart.store";

type AuthStep = "mobile" | "otp" | "profile";

export function CustomerAuthModal() {
  const open = useCustomerAuthStore(state => state.isAuthOpen);
  const closeAuth = useCustomerAuthStore(state => state.closeAuth);
  const acceptAuth = useCustomerAuthStore(state => state.acceptAuth);
  const completeProfile = useCustomerAuthStore(state => state.completeProfile);
  const [step, setStep] = useState<AuthStep>("mobile");
  const [mobileInput, setMobileInput] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({ fullName: "", email: "", city: "", state: "", postalCode: "", marketingConsent: false });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => setCountdown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const reset = () => {
    setStep("mobile"); setMobileInput(""); setMobileNumber(""); setChallengeId("");
    setCode(""); setCountdown(0); setError(""); setBusy(false);
    setProfile({ fullName: "", email: "", city: "", state: "", postalCode: "", marketingConsent: false });
  };

  const close = () => {
    if (busy) return;
    finishClose();
  };

  const finishClose = () => {
    closeAuth();
    window.setTimeout(reset, 200);
  };

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = mobileSchema.safeParse({ mobileNumber: mobileInput });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter a valid mobile number."); return; }
    setBusy(true); setError("");
    try {
      const result = await customerAuthApi.sendOtp(parsed.data.mobileNumber);
      if (!result) throw new Error("Unable to send verification code.");
      setMobileNumber(parsed.data.mobileNumber);
      setChallengeId(result.challengeId);
      setCountdown(result.resendAfterSeconds);
      setStep("otp");
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = otpSchema.safeParse({ code });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter the verification code."); return; }
    setBusy(true); setError("");
    try {
      const result = await customerAuthApi.verifyOtp(challengeId, mobileNumber, parsed.data.code);
      if (!result) throw new Error("Unable to verify code.");
      acceptAuth(result);
      await useCartStore.getState().mergeGuestCart();
      if (result.isNewCustomer && !result.customer.isProfileCompleted) setStep("profile");
      else finishClose();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    if (countdown > 0 || busy) return;
    setBusy(true); setError("");
    try {
      const result = await customerAuthApi.sendOtp(mobileNumber);
      if (!result) throw new Error("Unable to resend verification code.");
      setChallengeId(result.challengeId); setCountdown(result.resendAfterSeconds); setCode("");
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your profile details."); return; }
    setBusy(true); setError("");
    try { await completeProfile(parsed.data); finishClose(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={next => { if (!next) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-teal-deep/55 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[71] max-h-[92vh] overflow-y-auto rounded-t-[2rem] border border-white/20 bg-ivory shadow-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(94vw,460px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]">
          <div className="h-1.5 bg-gradient-to-r from-oxblood via-turmeric to-teal" />
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tan text-teal-deep">
                {step === "profile" ? <CheckCircle2 size={23} /> : step === "otp" ? <ShieldCheck size={23} /> : <Smartphone size={23} />}
              </div>
              <Dialog.Close asChild><button disabled={busy} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5" aria-label="Close"><X size={19} /></button></Dialog.Close>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.18 }}>
                {step === "mobile" && (
                  <form onSubmit={sendOtp} noValidate>
                    <Dialog.Title className="font-display text-3xl! text-ink">Welcome to Pramukhraj</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm! leading-6 text-ink-soft">Sign in or create an account with one secure verification code. No password to remember.</Dialog.Description>
                    <div className="mt-7"><FieldLabel htmlFor="customer-mobile">Mobile number</FieldLabel><Input id="customer-mobile" autoFocus inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={mobileInput} onChange={event => setMobileInput(event.target.value)} error={Boolean(error)} /></div>
                    {error && <FieldError>{error}</FieldError>}
                    <Button className="mt-6 w-full" size="lg" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={18} /> Sending code…</> : "Continue securely"}</Button>
                    <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs! text-ink-soft"><LockKeyhole size={13} /> Your number is used only to secure your account.</p>
                  </form>
                )}

                {step === "otp" && (
                  <form onSubmit={verifyOtp} noValidate>
                    <button type="button" onClick={() => { setStep("mobile"); setError(""); }} className="mb-4 flex items-center gap-1 text-xs! font-medium text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Change number</button>
                    <Dialog.Title className="font-display text-3xl! text-ink">Check your messages</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm! leading-6 text-ink-soft">Enter the 6-digit code sent to <span className="font-medium text-ink">{mobileNumber}</span>.</Dialog.Description>
                    <div className="mt-7"><FieldLabel htmlFor="customer-otp">Verification code</FieldLabel><Input id="customer-otp" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} error={Boolean(error)} className="h-14 text-center font-mono text-2xl! tracking-[0.45em]" /></div>
                    {error && <FieldError>{error}</FieldError>}
                    <Button className="mt-6 w-full" size="lg" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={18} /> Verifying…</> : "Verify & continue"}</Button>
                    <button type="button" onClick={() => void resend()} disabled={countdown > 0 || busy} className="mt-4 w-full text-center text-sm! font-medium text-oxblood disabled:text-ink-soft">{countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}</button>
                  </form>
                )}

                {step === "profile" && (
                  <form onSubmit={saveProfile} noValidate>
                    <Dialog.Title className="font-display text-3xl! text-ink">A little about you</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm! leading-6 text-ink-soft">Your account is ready. Add basic details for faster checkout, or do this later.</Dialog.Description>
                    <div className="mt-6 space-y-4">
                      <div><FieldLabel htmlFor="profile-name">Full name *</FieldLabel><Input id="profile-name" autoFocus autoComplete="name" value={profile.fullName} onChange={event => setProfile(value => ({ ...value, fullName: event.target.value }))} /></div>
                      <div><FieldLabel htmlFor="profile-email">Email <span className="font-normal text-ink-soft">(optional)</span></FieldLabel><Input id="profile-email" type="email" autoComplete="email" placeholder="you@example.com" value={profile.email} onChange={event => setProfile(value => ({ ...value, email: event.target.value }))} /><p className="mt-1.5 text-xs! leading-5 text-ink-soft">Add an email to receive your account confirmation and future order updates.</p></div>
                      <div className="grid grid-cols-2 gap-3"><div><FieldLabel htmlFor="profile-city">City</FieldLabel><Input id="profile-city" autoComplete="address-level2" value={profile.city} onChange={event => setProfile(value => ({ ...value, city: event.target.value }))} /></div><div><FieldLabel htmlFor="profile-state">State</FieldLabel><Input id="profile-state" autoComplete="address-level1" value={profile.state} onChange={event => setProfile(value => ({ ...value, state: event.target.value }))} /></div></div>
                      <div><FieldLabel htmlFor="profile-postal">Postal code</FieldLabel><Input id="profile-postal" autoComplete="postal-code" value={profile.postalCode} onChange={event => setProfile(value => ({ ...value, postalCode: event.target.value }))} /></div>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-tan/45 p-3 text-xs! leading-5 text-ink-soft"><input type="checkbox" className="mt-1 accent-oxblood" checked={profile.marketingConsent} onChange={event => setProfile(value => ({ ...value, marketingConsent: event.target.checked }))} />Keep me updated about new products and offers.</label>
                    </div>
                    {error && <FieldError>{error}</FieldError>}
                    <Button className="mt-6 w-full" size="lg" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={18} /> Saving…</> : "Save basic info"}</Button>
                    <Button type="button" variant="ghost" className="mt-2 w-full" onClick={close} disabled={busy}>Skip for now</Button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
