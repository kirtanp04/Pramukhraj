import { useCallback, useEffect, useState } from 'react'
import { Eye, FileText, Mail, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { EmailTemplatePreviewDialog } from '@/components/admin/email-template/EmailTemplatePreviewDialog'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/utils'
import { emailTemplateApi } from '@/services/emailTemplateApi'
import { EMAIL_TEMPLATE_CATEGORY_LABELS, type EmailTemplateListItem, type EmailTemplateResponse } from '@/types/emailTemplate'

export function AdminEmailTemplates() {
  const navigate = useNavigate()
  const [items, setItems] = useState<EmailTemplateListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<EmailTemplateListItem | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateListItem | null>(null)
  const [previewDetails, setPreviewDetails] = useState<EmailTemplateResponse | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewRequestVersion, setPreviewRequestVersion] = useState(0)

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError('')
    try { setItems((await emailTemplateApi.getList(signal)) ?? []) }
    catch (loadError) { if (!signal?.aborted) setError(getApiErrorMessage(loadError)) }
    finally { if (!signal?.aborted) setIsLoading(false) }
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
    try { await emailTemplateApi.delete(template.id); setItems(current => current.filter(item => item.id !== template.id)) }
    catch (deleteError) { setError(getApiErrorMessage(deleteError)) }
    finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-display text-2xl! text-ink">Email Templates</h1><p className="mt-1 text-sm! text-ink-soft">Build responsive transactional and marketing emails with reusable merge variables.</p></div>
        <Button onClick={() => navigate('/admin/email-templates/new')}><Plus size={16} aria-hidden /> New Template</Button>
      </div>
      {error ? <ServerError className="h-auto min-h-80 py-14" message={error} action={{ label: 'Retry', onClick: () => void load() }} /> : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading email templates">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-card bg-ink/5" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-ink/20 bg-ivory px-6 py-16 text-center"><FileText className="mx-auto text-oxblood" size={34} aria-hidden /><h2 className="mt-4 font-display text-xl! text-ink">Create your first email template</h2><p className="mx-auto mt-2 max-w-md text-sm! text-ink-soft">Start from a recommended event such as welcome, order confirmation, or payment success.</p><Button className="mt-5" onClick={() => navigate('/admin/email-templates/new')}><Plus size={16} aria-hidden /> Create Template</Button></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(template => (
          <article key={template.id} className="flex min-h-52 flex-col rounded-card border border-ink/10 bg-ivory p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood"><Mail size={18} aria-hidden /></span><Badge variant={template.isActive ? 'teal' : 'soft'}>{template.isActive ? 'Active' : 'Draft'}</Badge></div>
            <div className="mt-4 flex-1"><p className="text-[11px]! font-semibold uppercase tracking-wider text-teal">{EMAIL_TEMPLATE_CATEGORY_LABELS[template.category]}</p><h2 className="mt-1 font-display text-lg! text-ink">{template.name}</h2><p className="mt-1 line-clamp-2 text-xs! leading-5 text-ink-soft">{template.subject}</p><code className="mt-3 inline-block rounded bg-ink/5 px-2 py-1 text-[10px]! text-ink-soft">{template.key}</code></div>
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3"><time className="text-[11px]! text-ink-soft" dateTime={template.updatedOn}>{formatDateTime(template.updatedOn)}</time><div className="flex gap-1"><button type="button" onClick={() => setPreviewTemplate(template)} className="rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-oxblood" aria-label={`Preview ${template.name}`}><Eye size={15} aria-hidden /></button><button type="button" onClick={() => navigate(`/admin/email-templates/${template.id}/edit`)} className="rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-oxblood" aria-label={`Edit ${template.name}`}><Pencil size={15} /></button><button type="button" disabled={deletingId === template.id} onClick={() => setPendingDelete(template)} className="rounded-full p-2 text-ink-soft hover:bg-red-50 hover:text-red-700 disabled:opacity-50" aria-label={`Delete ${template.name}`}>{deletingId === template.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}</button></div></div>
          </article>
        ))}</div>
      )}
      <ConfirmDialog open={pendingDelete !== null} onOpenChange={open => { if (!open) setPendingDelete(null) }} title="Delete email template?" description={pendingDelete ? `“${pendingDelete.name}” will no longer be available for email delivery.` : ''} onConfirm={() => { if (pendingDelete) void remove(pendingDelete) }} />
      <EmailTemplatePreviewDialog
        open={previewTemplate !== null}
        name={previewDetails?.name ?? previewTemplate?.name ?? ''}
        subject={previewDetails?.subject ?? previewTemplate?.subject ?? ''}
        html={previewDetails?.htmlContent ?? ''}
        isLoading={isPreviewLoading}
        error={previewError}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
        onRetry={() => setPreviewRequestVersion(version => version + 1)}
      />
    </div>
  )
}
