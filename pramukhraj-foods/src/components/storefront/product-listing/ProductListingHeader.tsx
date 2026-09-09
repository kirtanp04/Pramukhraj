interface ProductListingHeaderProps {
  title: string
  description?: string
}

export function ProductListingHeader({ title, description }: ProductListingHeaderProps) {
  return (
    <header>
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-ink-soft">
        <span>Home</span>
        <span className="mx-1" aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <h1 className="font-display text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p>}
    </header>
  )
}
