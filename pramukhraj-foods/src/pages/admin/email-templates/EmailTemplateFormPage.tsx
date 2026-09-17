import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import EmailEditor, { type EditorRef } from 'react-email-editor'
import { ArrowLeft, Braces, Eye, LayoutTemplate, LoaderCircle, Paperclip, Plus, Save, Trash2, Variable, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmailDesignJsonEditor } from '@/components/admin/email-template/EmailDesignJsonEditor'
import { Button } from '@/components/ui/Button'
import { EntityFormError } from '@/components/admin/EntityFormError'
import { FormField, ToggleField, inputCls } from '@/components/admin/product/FormField'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiClient'
import { isValidGuid } from '@/lib/routeParams'
import type { EmailDesignJson } from '@/lib/emailDesignJson'
import { EMAIL_TEMPLATE_STARTERS } from '@/lib/emailTemplateStarters'
import { emailTemplateApi } from '@/services/emailTemplateApi'
import { EMAIL_TEMPLATE_CATEGORY, EMAIL_TEMPLATE_CATEGORY_LABELS, type EmailTemplateAttachmentDefinition, type EmailTemplateCategory, type EmailTemplateWriteRequest } from '@/types/emailTemplate'

const EMPTY_ATTACHMENT: EmailTemplateAttachmentDefinition = { name: '', contentType: 'application/pdf', sourceVariable: '', isRequired: false }
type EmailDesign = Parameters<NonNullable<EditorRef['editor']>['loadDesign']>[0]
type EditorMode = 'visual' | 'json'

export function EmailTemplateFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const dialog = useMessageDialog()
  const editorRef = useRef<EditorRef>(null)
  const pendingDesignRef = useRef<EmailDesign | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<{ message: string; status?: number } | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [editorMode, setEditorMode] = useState<EditorMode>('visual')
  const [designJsonText, setDesignJsonText] = useState('')
  const [hasUnappliedJson, setHasUnappliedJson] = useState(false)
  const [form, setForm] = useState<EmailTemplateWriteRequest>({ key: '', name: '', description: '', category: EMAIL_TEMPLATE_CATEGORY.Account, subject: '', designJson: '{}', htmlContent: '', plainTextContent: '', variables: [], attachments: [], isActive: true })

  const mergeTags = useMemo(() => Object.fromEntries(form.variables.map(variable => [variable, { name: variable.replaceAll('_', ' '), value: `{{${variable}}}` }])), [form.variables])

  useEffect(() => {
    if (!isEditing) { setIsLoading(false); return }
    if (!isValidGuid(id)) { setLoadError({ message: 'The email template ID is invalid.', status: 400 }); setIsLoading(false); return }
    const controller = new AbortController()
    void (async () => {
      try {
        const template = await emailTemplateApi.getById(id, controller.signal)
        if (!template || controller.signal.aborted) return
        setForm({ ...template, description: template.description ?? '', plainTextContent: template.plainTextContent ?? '' })
        try {
          const design = JSON.parse(template.designJson) as EmailDesign
          pendingDesignRef.current = design
          setDesignJsonText(JSON.stringify(design, null, 2))
        } catch {
          pendingDesignRef.current = null
          setDesignJsonText(template.designJson)
        }
      } catch (error) { if (!controller.signal.aborted) setLoadError({ message: getApiErrorMessage(error), status: getApiErrorStatus(error) }) }
      finally { if (!controller.signal.aborted) setIsLoading(false) }
    })()
    return () => controller.abort()
  }, [id, isEditing])

  useEffect(() => {
    if (isEditorReady && pendingDesignRef.current) { editorRef.current?.editor?.loadDesign(pendingDesignRef.current); pendingDesignRef.current = null }
  }, [isEditorReady, isLoading])

  const exportEmail = useCallback(() => new Promise<{ design: EmailDesign; html: string }>((resolve, reject) => {
    const editor = editorRef.current?.editor
    if (!editor) { reject(new Error('The email editor is still loading.')); return }
    editor.exportHtml(data => resolve({ design: data.design, html: data.html }))
  }), [])

  function showJsonEditor() {
    if (editorMode === 'json') return
    const editor = editorRef.current?.editor
    if (!editor) {
      dialog.error('The visual editor is still loading.', { title: 'JSON Editor Unavailable' })
      return
    }
    editor.saveDesign(design => {
      const json = JSON.stringify(design, null, 2)
      setDesignJsonText(json)
      setForm(current => ({ ...current, designJson: JSON.stringify(design) }))
      setHasUnappliedJson(false)
      setEditorMode('json')
    })
  }

  function updateDesignJson(value: string) {
    setDesignJsonText(value)
    setHasUnappliedJson(true)
  }

  function loadJsonIntoVisualBuilder(design: EmailDesignJson, formattedJson: string) {
    const editor = editorRef.current?.editor
    if (!editor) {
      dialog.error('The visual editor is still loading.', { title: 'Could Not Load JSON' })
      return
    }
    try {
      editor.loadDesign(design as EmailDesign)
      setDesignJsonText(formattedJson)
      setForm(current => ({ ...current, designJson: JSON.stringify(design) }))
      setHasUnappliedJson(false)
      setEditorMode('visual')
    } catch (error) {
      dialog.error(getApiErrorMessage(error), { title: 'Could Not Load JSON' })
    }
  }

  function requireAppliedJson() {
    if (!hasUnappliedJson) return true
    dialog.error('Load the JSON into the Visual Builder before saving or previewing.', { title: 'Unapplied JSON Changes' })
    return false
  }

  function applyStarter(index: number) {
    const starter = EMAIL_TEMPLATE_STARTERS[index]
    if (!starter) return

    const design = starter.design as EmailDesign
    pendingDesignRef.current = design
    if (isEditorReady && editorRef.current?.editor) {
      editorRef.current.editor.loadDesign(design)
      pendingDesignRef.current = null
    }

    const designJson = JSON.stringify(starter.design)
    setDesignJsonText(JSON.stringify(starter.design, null, 2))
    setHasUnappliedJson(false)
    setEditorMode('visual')
    setForm(current => ({
      ...current,
      key: starter.key,
      name: starter.name,
      description: starter.description,
      category: starter.category,
      subject: starter.subject,
      designJson,
      plainTextContent: starter.plainTextContent,
      variables: [...starter.variables],
    }))
  }

  async function save() {
    if (!requireAppliedJson()) return
    if (!form.key.trim() || !form.name.trim() || !form.subject.trim()) { dialog.error('Template key, name, and subject are required.', { title: 'Check Template Details' }); return }
    setIsSaving(true)
    try {
      const exported = await exportEmail()
      const plainText = form.plainTextContent.trim() || new DOMParser().parseFromString(exported.html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() || ''
      const payload: EmailTemplateWriteRequest = { ...form, key: form.key.trim().toUpperCase(), name: form.name.trim(), subject: form.subject.trim(), designJson: JSON.stringify(exported.design), htmlContent: exported.html, plainTextContent: plainText }
      const response = isEditing && isValidGuid(id) ? await emailTemplateApi.update(id, payload) : await emailTemplateApi.create(payload)
      dialog.success(response.message, { title: isEditing ? 'Template Updated' : 'Template Created', actionLabel: 'Back to Templates', onAction: () => navigate('/admin/email-templates') })
    } catch (error) { dialog.error(getApiErrorMessage(error), { title: 'Could Not Save Template' }) }
    finally { setIsSaving(false) }
  }

  async function preview() {
    if (!requireAppliedJson()) return
    try { setPreviewHtml((await exportEmail()).html) } catch (error) { dialog.error(getApiErrorMessage(error), { title: 'Preview Unavailable' }) }
  }
  function updateAttachment(index: number, patch: Partial<EmailTemplateAttachmentDefinition>) { setForm(current => ({ ...current, attachments: current.attachments.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) })) }

  if (isLoading) return <div className="flex min-h-96 items-center justify-center"><LoaderCircle className="animate-spin text-oxblood" size={28} aria-label="Loading template" /></div>
  if (loadError) return <EntityFormError title={loadError.status === 404 ? 'Template Not Found' : 'Unable to Load Template'} message={loadError.message} onBack={() => navigate('/admin/email-templates')} />

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3"><button type="button" onClick={() => navigate('/admin/email-templates')} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5" aria-label="Back to templates"><ArrowLeft size={17} /></button><div><h1 className="font-display text-2xl! text-ink">{isEditing ? 'Edit Email Template' : 'New Email Template'}</h1><p className="text-sm! text-ink-soft">Design responsive email content and configure delivery metadata.</p></div></div>
      <div className="flex gap-2 self-end lg:self-auto"><Button variant="outline" onClick={() => void preview()} disabled={!isEditorReady}><Eye size={16} /> Preview</Button><Button onClick={() => void save()} disabled={isSaving || !isEditorReady}>{isSaving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />} Save Template</Button></div>
    </header>

    <section className="rounded-card border border-ink/10 bg-ivory p-4 sm:p-6"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {!isEditing && <FormField label="Start from event" htmlFor="template-starter" hint="Loads a complete visual design, metadata, and merge variables."><select id="template-starter" defaultValue="" onChange={event => applyStarter(Number(event.target.value))} className={inputCls(false)}><option value="" disabled>Select an email event</option>{EMAIL_TEMPLATE_STARTERS.map((starter, index) => <option key={starter.key} value={index}>{starter.name}</option>)}</select></FormField>}
      <FormField label="Template key" htmlFor="template-key" hint="Stable server key; uppercase letters and underscores." required><input id="template-key" value={form.key} onChange={event => setForm(current => ({ ...current, key: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))} className={inputCls(false)} placeholder="WELCOME" /></FormField>
      <FormField label="Template name" htmlFor="template-name" required><input id="template-name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className={inputCls(false)} placeholder="Welcome Email" /></FormField>
      <FormField label="Category" htmlFor="template-category" required><select id="template-category" value={form.category} onChange={event => setForm(current => ({ ...current, category: Number(event.target.value) as EmailTemplateCategory }))} className={inputCls(false)}>{Object.values(EMAIL_TEMPLATE_CATEGORY).map(category => <option key={category} value={category}>{EMAIL_TEMPLATE_CATEGORY_LABELS[category]}</option>)}</select></FormField>
      <FormField label="Subject" htmlFor="template-subject" className="md:col-span-2" hint="Merge tags such as {{customer_name}} are supported." required><input id="template-subject" value={form.subject} onChange={event => setForm(current => ({ ...current, subject: event.target.value }))} className={inputCls(false)} placeholder="Welcome, {{customer_name}}!" /></FormField>
      <div className="flex items-end"><ToggleField label="Active" description="Only active templates can be used for delivery." checked={form.isActive} onCheckedChange={isActive => setForm(current => ({ ...current, isActive }))} /></div>
      <FormField label="Description" htmlFor="template-description" className="md:col-span-2 xl:col-span-3"><textarea id="template-description" rows={2} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} className={inputCls(false)} placeholder="When and why this template is sent" /></FormField>
    </div></section>

    <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory">
      <div className="flex flex-col gap-4 border-b border-ink/10 bg-ivory-dim p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-lg! text-ink">Email Content</h2>
          <p className="text-xs! text-ink-soft">Build visually, or load an Unlayer design by writing or importing JSON.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-full border border-ink/15 bg-ivory p-1" role="tablist" aria-label="Email editor mode">
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === 'visual'}
              onClick={() => {
                if (hasUnappliedJson) {
                  dialog.error('Use “Load JSON into Visual Builder” to apply your JSON changes.', { title: 'Unapplied JSON Changes' })
                  return
                }
                setEditorMode('visual')
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs! font-medium transition-colors ${editorMode === 'visual' ? 'bg-oxblood text-white' : 'text-ink-soft hover:text-ink'}`}
            >
              <LayoutTemplate size={14} aria-hidden /> Visual Builder
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === 'json'}
              onClick={showJsonEditor}
              disabled={!isEditorReady}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs! font-medium transition-colors disabled:opacity-50 ${editorMode === 'json' ? 'bg-oxblood text-white' : 'text-ink-soft hover:text-ink'}`}
            >
              <Braces size={14} aria-hidden /> Design JSON
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">{form.variables.map(variable => <code key={variable} className="rounded-full bg-teal/10 px-2 py-1 text-[10px]! text-teal">{`{{${variable}}}`}</code>)}</div>
        </div>
      </div>

      <div role="tabpanel" aria-label="Visual Builder" hidden={editorMode !== 'visual'} className="min-h-[720px] bg-white">
        <EmailEditor ref={editorRef} minHeight="720px" onReady={() => setIsEditorReady(true)} options={{ displayMode: 'email', mergeTags, appearance: { theme: 'light' } }} />
      </div>
      {editorMode === 'json' && (
        <div role="tabpanel" aria-label="Design JSON">
          <EmailDesignJsonEditor value={designJsonText} onChange={updateDesignJson} onApply={loadJsonIntoVisualBuilder} />
        </div>
      )}
    </section>

    <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-card border border-ink/10 bg-ivory p-5"><div className="flex items-center gap-2"><Variable size={18} className="text-oxblood" /><h2 className="font-display text-lg!">Merge Variables</h2></div><p className="mt-1 text-xs! text-ink-soft">Comma-separated lower snake_case names available inside the editor.</p><textarea value={form.variables.join(', ')} onChange={event => setForm(current => ({ ...current, variables: event.target.value.split(',').map(value => value.trim().toLowerCase()).filter(Boolean) }))} rows={4} className={`${inputCls(false)} mt-4`} placeholder="customer_name, order_number, order_url" /></div>
      <div className="rounded-card border border-ink/10 bg-ivory p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Paperclip size={18} className="text-oxblood" /><h2 className="font-display text-lg!">Attachment Definitions</h2></div><p className="mt-1 text-xs! text-ink-soft">Map generated files, such as invoices, to variables supplied by the sender.</p></div><Button variant="outline" size="sm" onClick={() => setForm(current => ({ ...current, attachments: [...current.attachments, { ...EMPTY_ATTACHMENT }] }))}><Plus size={14} /> Add</Button></div><div className="mt-4 space-y-3">{form.attachments.length === 0 ? <p className="rounded-lg bg-ink/[0.03] p-4 text-center text-xs! text-ink-soft">No attachments configured.</p> : form.attachments.map((attachment, index) => <div key={index} className="grid gap-2 rounded-lg border border-ink/10 p-3 sm:grid-cols-2"><input aria-label="Attachment name" value={attachment.name} onChange={event => updateAttachment(index, { name: event.target.value })} className={inputCls(false)} placeholder="Invoice.pdf" /><input aria-label="Content type" value={attachment.contentType} onChange={event => updateAttachment(index, { contentType: event.target.value })} className={inputCls(false)} placeholder="application/pdf" /><input aria-label="Source variable" value={attachment.sourceVariable} onChange={event => updateAttachment(index, { sourceVariable: event.target.value.toLowerCase() })} className={inputCls(false)} placeholder="invoice_file" /><div className="flex items-center justify-between"><label className="flex items-center gap-2 text-xs! text-ink-soft"><input type="checkbox" checked={attachment.isRequired} onChange={event => updateAttachment(index, { isRequired: event.target.checked })} className="accent-oxblood" /> Required</label><button type="button" onClick={() => setForm(current => ({ ...current, attachments: current.attachments.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-full p-2 text-red-700 hover:bg-red-50" aria-label="Remove attachment"><Trash2 size={14} /></button></div></div>)}</div></div>
    </section>

    <section className="rounded-card border border-ink/10 bg-ivory p-5"><FormField label="Plain-text fallback" htmlFor="plain-text" hint="Optional. Generated from exported HTML when left blank."><textarea id="plain-text" rows={7} value={form.plainTextContent} onChange={event => setForm(current => ({ ...current, plainTextContent: event.target.value }))} className={inputCls(false)} placeholder="Accessible plain-text version" /></FormField></section>
    {previewHtml && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-teal-deep/70 p-3 backdrop-blur-sm"><div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-card bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-ink/10 px-4 py-3"><div><h2 className="font-display text-lg!">Email Preview</h2><p className="text-xs! text-ink-soft">Current unsaved design.</p></div><button onClick={() => setPreviewHtml('')} className="rounded-full p-2 hover:bg-ink/5" aria-label="Close preview"><X size={18} /></button></div><iframe title="Email template preview" sandbox="" srcDoc={previewHtml} className="min-h-0 flex-1 bg-white" /></div></div>}
    <MessageDialog {...dialog.props} />
  </div>
}
