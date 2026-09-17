import { useEffect, useState } from "react";

export function ResendCountdown({ seconds, onReady }: { seconds: number; onReady?: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => { setRemaining(seconds); }, [seconds]);
  useEffect(() => {
    if (remaining <= 0) { onReady?.(); return; }
    const timer = window.setTimeout(() => setRemaining(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining, onReady]);
  return <span>{remaining > 0 ? `${remaining}s` : "now"}</span>;
}
