import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StorageKey } from "@/constants/StorageKeys";
import { useCustomerAuthStore } from "@/features/customer-auth/store/customerAuthStore";
import { getApiErrorMessage } from "@/lib/apiClient";
import { verificationApi } from "../api/verification.api";
import { VerificationCodeForm } from "../components/VerificationCodeForm";
import { EmailAddressForm } from "../components/EmailAddressForm";
import { VerificationStatusCard } from "../components/VerificationStatusCard";
import { useVerificationStatus } from "../hooks/useVerificationStatus";
import type { VerificationChallenge } from "../types/verification.types";

function takeCheckoutDestination() {
  const intended = sessionStorage.getItem(StorageKey.CustomerIntendedPath);
  sessionStorage.removeItem(StorageKey.CustomerIntendedPath);

  return intended?.startsWith("/") && !intended.startsWith("//") && intended !== "/verify-checkout"
    ? intended
    : "/checkout";
}

export function CustomerVerificationPage() {
  const navigate = useNavigate();
  const customerEmail = useCustomerAuthStore(state => state.customer?.email ?? "");
  const { status, isLoading, error: loadError, setStatus, load } = useVerificationStatus();
  const [challenge, setChallenge] = useState<{ kind: "mobile" | "email"; value: VerificationChallenge } | null>(null);
  const [emailValue, setEmailValue] = useState(customerEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!emailValue && customerEmail) setEmailValue(customerEmail); }, [customerEmail, emailValue]);

  useEffect(() => {
    if (status?.isCheckoutEligible) navigate(takeCheckoutDestination(), { replace: true });
  }, [navigate, status?.isCheckoutEligible]);

  const request = async (kind: "mobile" | "email") => {
    setBusy(true); setError("");
    try {
      const value = kind === "mobile" ? await verificationApi.requestMobile() : await verificationApi.requestEmail();
      if (!value) throw new Error("Verification code could not be created.");
      setChallenge({ kind, value });
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const verify = async (code: string) => {
    if (!challenge) return;
    setBusy(true); setError("");
    try {
      const next = challenge.kind === "mobile"
        ? await verificationApi.verifyMobile({ challengeId: challenge.value.challengeId, code })
        : await verificationApi.verifyEmail({ challengeId: challenge.value.challengeId, code });
      if (!next) throw new Error("Verification could not be completed.");
      setStatus(next); setChallenge(null);
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const saveEmail = async (email: string) => {
    setBusy(true); setError("");
    try {
      const next = await verificationApi.updateEmail(email);
      if (!next) throw new Error("Email address could not be saved.");
      setEmailValue(email.trim());
      setStatus(next);
      const value = await verificationApi.requestEmail();
      if (!value) throw new Error("Verification code could not be sent.");
      setChallenge({ kind: "email", value });
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setBusy(false); }
  };

  const continueCheckout = () => {
    navigate(takeCheckoutDestination(), { replace: true });
  };

  if (isLoading && !status) return <div className="flex min-h-[45vh] items-center justify-center text-sm! text-ink-soft"><LoaderCircle size={18} className="mr-2 animate-spin" />Loading verification status…</div>;
  if (!status) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><p className="text-sm! text-oxblood">{loadError || "Verification status is unavailable."}</p><Button className="mt-4" onClick={() => void load()}>Try again</Button></div>;

  return <main className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
    <section className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-ivory-dim shadow-sm">
      <div className="flex items-start gap-4 bg-teal-deep px-5 py-5 text-ivory sm:px-7">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><ShieldCheck size={24} /></span>
        <div><h1 className="font-display text-2xl!">Secure your checkout</h1><p className="mt-1 max-w-xl text-sm! leading-5 text-ivory/75">Verify both contact methods so order and delivery updates reach the right person.</p></div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <VerificationStatusCard title="Mobile number" destination={status.maskedMobileNumber} verified={status.isMobileVerified} />
          <VerificationStatusCard title="Email address" destination={status.maskedEmailAddress} verified={status.isEmailVerified} />
        </div>
        <div className="mt-4">
          {status.isCheckoutEligible ? <div className="flex flex-col justify-between gap-3 rounded-xl bg-green-50 p-4 sm:flex-row sm:items-center"><p className="text-sm! font-semibold text-green-800">Your contact details are verified.</p><Button onClick={continueCheckout}>Continue to checkout</Button></div>
            : challenge ? <div className="rounded-xl border border-turmeric/40 bg-tan/30 p-4"><h2 className="font-display text-lg! text-ink">Verify your {challenge.kind === "mobile" ? "mobile number" : "email"}</h2><p className="mt-0.5 text-xs! leading-5 text-ink-soft">Enter the secure code sent to {challenge.kind === "email" && emailValue ? emailValue : "your saved contact"}. It can only be used once.</p><VerificationCodeForm busy={busy} error={error} resendAfter={challenge.value.resendAfterSeconds} onVerify={verify} onResend={() => request(challenge.kind)} /></div>
            : !status.isMobileVerified ? <div className="flex flex-col justify-between gap-3 rounded-xl border border-turmeric/40 bg-tan/30 p-4 sm:flex-row sm:items-center"><div><p className="text-sm! font-semibold text-ink">Verify your mobile number</p><p className="mt-0.5 text-xs! text-ink-soft">We will send a secure six-digit code.</p>{error && <p role="alert" className="mt-1 text-xs! text-oxblood">{error}</p>}</div><Button disabled={busy} onClick={() => void request("mobile")}>{busy ? "Sending…" : "Send mobile code"}</Button></div>
            : <div className="rounded-xl border border-turmeric/40 bg-tan/30 p-4"><div><h2 className="font-display text-lg! text-ink">Verify your email</h2><p className="mt-0.5 text-xs! text-ink-soft">Confirm or change your email, then request a secure code.</p></div><EmailAddressForm busy={busy} error={error} defaultEmail={emailValue} onSubmit={saveEmail} /></div>}
        </div>
      </div>
    </section>
  </main>;
}
