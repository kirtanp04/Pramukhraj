import { CheckCircle2, CircleAlert } from "lucide-react";

export function VerificationStatusCard({ title, destination, verified }: { title: string; destination?: string | null; verified: boolean }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/55 px-4 py-3">
    <div><p className="text-sm! font-semibold text-ink">{title}</p><p className="mt-1 text-xs! text-ink-soft">{destination || "Not added"}</p></div>
    <span className={verified ? "flex items-center gap-1.5 text-xs! font-semibold text-green-700" : "flex items-center gap-1.5 text-xs! font-semibold text-amber-700"}>
      {verified ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}{verified ? "Verified" : "Required"}
    </span>
  </div>;
}
