export function AccountProfile() {
  const Field = ({ label, defaultValue }: { label: string; defaultValue?: string }) => (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      <input defaultValue={defaultValue} className="w-full rounded-lg border border-ink/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-oxblood/50" />
    </label>
  )
  return (
    <div>
      <h2 className="mb-4 font-display text-xl">Profile</h2>
      <div className="grid max-w-lg gap-4 rounded-card border border-ink/10 p-5 sm:grid-cols-2">
        <Field label="Full Name" defaultValue="Aarav Sharma" />
        <Field label="Email" defaultValue="aarav.sharma@example.com" />
        <Field label="Phone" defaultValue="+91 98765 43210" />
        <Field label="Date of Birth" defaultValue="1994-05-12" />
      </div>
    </div>
  )
}
