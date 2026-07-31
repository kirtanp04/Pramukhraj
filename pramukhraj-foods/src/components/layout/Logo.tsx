export function Logo({ className }: { className?: string }) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="17" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <path
          d="M17 5c4 3.5 6.5 7.7 6.5 12A6.5 6.5 0 1 1 10.5 17c0-4.3 2.5-8.5 6.5-12Z"
          fill="currentColor"
        />
        <path d="M17 12.5c1.6 1.6 2.6 3.3 2.6 4.9a2.6 2.6 0 1 1-5.2 0c0-1.6 1-3.3 2.6-4.9Z" fill="var(--color-ivory)" />
      </svg>
      <div style={{ lineHeight: 1.05 }}>
        <div className="font-display text-lg font-semibold tracking-tight">PramukhRaj</div>
        <div className="text-[9px] uppercase tracking-[0.18em] text-ink-soft">Foods</div>
      </div>
    </div>
  )
}
