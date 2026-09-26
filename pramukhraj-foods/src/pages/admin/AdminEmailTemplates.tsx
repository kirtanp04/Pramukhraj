import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, FileText, Mail, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { EmailTemplatePreviewDialog } from '@/components/admin/email-template/EmailTemplatePreviewDialog'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/utils'
import { emailTemplateApi } from '@/services/emailTemplateApi'
import { EMAIL_TEMPLATE_CATEGORY, EMAIL_TEMPLATE_CATEGORY_LABELS, type EmailTemplateListItem, type EmailTemplateResponse } from '@/types/emailTemplate'

export function AdminEmailTemplates() {
  const navigate = useNavigate()
  const [items, setItems] = useState<EmailTemplateListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [showSeedConfirm, setShowSeedConfirm] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<EmailTemplateListItem | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateListItem | null>(null)
  const [previewDetails, setPreviewDetails] = useState<EmailTemplateResponse | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewRequestVersion, setPreviewRequestVersion] = useState(0)

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError('')
    try {
      const res = await emailTemplateApi.getList(signal)
      setItems(res ?? [])
    } catch (loadError) {
      if (!signal?.aborted) setError(getApiErrorMessage(loadError))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  useEffect(() => {
    if (!previewTemplate) return
    const controller = new AbortController()
    setPreviewDetails(null)
    setPreviewError('')
    setIsPreviewLoading(true)
    void emailTemplateApi.getById(previewTemplate.id, controller.signal)
      .then(template => {
        if (!controller.signal.aborted) setPreviewDetails(template)
      })
      .catch(previewLoadError => {
        if (!controller.signal.aborted) setPreviewError(getApiErrorMessage(previewLoadError))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsPreviewLoading(false)
      })
    return () => controller.abort()
  }, [previewTemplate, previewRequestVersion])

  async function remove(template: EmailTemplateListItem) {
    setDeletingId(template.id)
    try {
      await emailTemplateApi.delete(template.id)
      setItems(current => current.filter(item => item.id !== template.id))
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSeedDefaults(overwrite = true) {
    setIsSeeding(true)
    setShowSeedConfirm(false)
    setError('')
    try {
      await emailTemplateApi.seedDefaults(overwrite)
      await load()
    } catch (seedErr) {
      setError(getApiErrorMessage(seedErr))
    } finally {
      setIsSeeding(false)
    }
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    for (const item of items) {
      const catKey = item.category.toString()
      counts[catKey] = (counts[catKey] || 0) + 1
    }
    return counts
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category.toString() === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        Boolean(item.description && item.description.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [items, selectedCategory, searchQuery])

  const categoryPills = [
    { id: 'all', label: 'All Templates' },
    { id: EMAIL_TEMPLATE_CATEGORY.Account.toString(), label: 'Account' },
    { id: EMAIL_TEMPLATE_CATEGORY.Order.toString(), label: 'Order' },
    { id: EMAIL_TEMPLATE_CATEGORY.Payment.toString(), label: 'Payment' },
    { id: EMAIL_TEMPLATE_CATEGORY.Shipping.toString(), label: 'Shipping & Returns' },
    { id: EMAIL_TEMPLATE_CATEGORY.Marketing.toString(), label: 'Marketing' },
    { id: EMAIL_TEMPLATE_CATEGORY.System.toString(), label: 'System' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl! font-bold text-ink">Email Templates</h1>
          <p className="mt-1 text-sm! text-ink-soft">
            Manage responsive store-branded email templates, customize merge tags, and preview live customer emails.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSeedConfirm(true)}
            disabled={isSeeding || isLoading}
            className="border-ink/20 text-xs! text-ink hover:border-oxblood hover:text-oxblood"
          >
            {isSeeding ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : <Sparkles size={14} className="mr-1.5 text-turmeric" />}
            Reset Default Templates
          </Button>
          <Button onClick={() => navigate('/admin/email-templates/new')}>
            <Plus size={16} aria-hidden /> New Template
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categoryPills.map(cat => {
            const count = categoryCounts[cat.id] || 0
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs! font-medium transition ${
                  isSelected
                    ? 'bg-oxblood text-white shadow-xs'
                    : 'bg-ivory border border-ink/10 text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px]! font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink-soft'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-ink/15 bg-ivory pl-8.5 pr-3 py-1.5 text-xs! text-ink placeholder:text-ink-soft/60 focus:border-oxblood focus:outline-hidden focus:ring-1 focus:ring-oxblood"
          />
        </div>
      </div>

      {/* Content Area */}
      {error ? (
        <ServerError className="h-auto min-h-80 py-14" message={error} action={{ label: 'Retry', onClick: () => void load() }} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading email templates">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-card bg-ink/5" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-card border border-dashed border-ink/20 bg-ivory px-6 py-16 text-center">
          <FileText className="mx-auto text-oxblood" size={34} aria-hidden />
          <h2 className="mt-4 font-display text-xl! text-ink">
            {searchQuery || selectedCategory !== 'all' ? 'No matching templates found' : 'Create your first email template'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm! text-ink-soft">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search query or switching categories.'
              : 'Start from a recommended event or click Reset Default Templates to load all official store designs.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {searchQuery || selectedCategory !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => void handleSeedDefaults(false)}>
                  <Sparkles size={14} className="mr-1.5 text-turmeric" /> Load Default Templates
                </Button>
                <Button onClick={() => navigate('/admin/email-templates/new')}>
                  <Plus size={16} aria-hidden /> Create Template
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map(template => (
            <article
              key={template.id}
              className="flex min-h-52 flex-col rounded-card border border-ink/10 bg-ivory p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
                  <Mail size={18} aria-hidden />
                </span>
                <Badge variant={template.isActive ? 'teal' : 'soft'}>{template.isActive ? 'Active' : 'Draft'}</Badge>
              </div>
              <div className="mt-4 flex-1">
                <p className="text-[11px]! font-semibold uppercase tracking-wider text-teal">
                  {EMAIL_TEMPLATE_CATEGORY_LABELS[template.category]}
                </p>
                <h2 className="mt-1 font-display text-lg! font-semibold text-ink">{template.name}</h2>
                <p className="mt-1 line-clamp-2 text-xs! leading-5 text-ink-soft">{template.subject}</p>
                <code className="mt-3 inline-block rounded bg-ink/5 px-2 py-0.5 font-mono text-[10px]! font-medium text-ink-soft">
                  {template.key}
                </code>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                <time className="text-[11px]! text-ink-soft" dateTime={template.updatedOn}>
                  {formatDateTime(template.updatedOn)}
                </time>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template)}
                    className="rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-oxblood"
                    aria-label={`Preview ${template.name}`}
                  >
                    <Eye size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/email-templates/${template.id}/edit`)}
                    className="rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-oxblood"
                    aria-label={`Edit ${template.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === template.id}
                    onClick={() => setPendingDelete(template)}
                    className="rounded-full p-2 text-ink-soft hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    aria-label={`Delete ${template.name}`}
                  >
                    {deletingId === template.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={open => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete email template?"
        description={pendingDelete ? `“${pendingDelete.name}” will no longer be available for email delivery.` : ''}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete)
        }}
      />

      {/* Seed Defaults Confirmation */}
      <ConfirmDialog
        open={showSeedConfirm}
        onOpenChange={setShowSeedConfirm}
        title="Reset & Seed Default Email Templates?"
        description="This will configure all 18 store email templates with responsive, professional designs matching the store theme, fonts ('Fraunces', 'Work Sans'), and colors. Existing templates will be updated with the latest layout."
        confirmLabel="Apply Store Defaults"
        onConfirm={() => void handleSeedDefaults(true)}
      />

      {/* Live Preview Dialog */}
      <EmailTemplatePreviewDialog
        open={previewTemplate !== null}
        name={previewDetails?.name ?? previewTemplate?.name ?? ''}
        subject={previewDetails?.subject ?? previewTemplate?.subject ?? ''}
        html={previewDetails?.htmlContent ?? ''}
        isLoading={isPreviewLoading}
        error={previewError}
        onOpenChange={open => {
          if (!open) setPreviewTemplate(null)
        }}
        onRetry={() => setPreviewRequestVersion(version => version + 1)}
      />
    </div>
  )
}
