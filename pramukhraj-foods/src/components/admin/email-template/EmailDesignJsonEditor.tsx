import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { AlertCircle, CheckCircle2, FileJson, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { EMAIL_DESIGN_JSON_MAX_BYTES, parseEmailDesignJson, type EmailDesignJson } from '@/lib/emailDesignJson'

interface EmailDesignJsonEditorProps {
  value: string
  onChange: (value: string) => void
  onApply: (design: EmailDesignJson, formattedJson: string) => void
}

export function EmailDesignJsonEditor({ value, onChange, onApply }: EmailDesignJsonEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileError, setFileError] = useState('')
  const parsed = useMemo(() => parseEmailDesignJson(value), [value])
  const error = fileError || (parsed.success ? '' : parsed.error)

  function updateValue(nextValue: string) {
    setFileError('')
    onChange(nextValue)
  }

  async function importFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setFileError('Choose an Unlayer .json design file.')
      return
    }
    if (file.size > EMAIL_DESIGN_JSON_MAX_BYTES) {
      setFileError('The design JSON file must be 5 MB or smaller.')
      return
    }

    try {
      updateValue(await file.text())
    } catch {
      setFileError('The JSON file could not be read. Please try again.')
    }
  }

  function selectFile(files: FileList | null) {
    if (!files?.length) return
    if (files.length > 1) {
      setFileError('Import one JSON file at a time.')
      return
    }
    void importFile(files[0])
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    selectFile(event.dataTransfer.files)
  }

  function handleDropZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fileInputRef.current?.click()
    }
  }

  function formatJson() {
    if (parsed.success) updateValue(parsed.formattedJson)
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <label htmlFor="email-design-json" className="text-sm! font-semibold text-ink">Unlayer design JSON</label>
          <p className="mt-1 text-xs! text-ink-soft">Paste a design object or import the JSON exported from React Email Editor.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={formatJson} disabled={!parsed.success}>Format JSON</Button>
      </div>

      <textarea
        id="email-design-json"
        value={value}
        onChange={event => updateValue(event.target.value)}
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby="email-design-json-status"
        className={cn(
          'min-h-[520px] w-full resize-y rounded-card border bg-slate-950 p-4 font-mono text-sm! leading-6 text-slate-100 outline-none transition-colors',
          error ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-blue-400',
        )}
      />

      <div id="email-design-json-status" aria-live="polite">
        {error ? (
          <p className="flex items-start gap-1.5 text-xs! font-medium text-red-700" role="alert"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden /> {error}</p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs! font-medium text-teal"><CheckCircle2 size={14} aria-hidden /> Valid Unlayer design JSON</p>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Import Unlayer design JSON file"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleDropZoneKeyDown}
        onDragOver={event => { event.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer items-center justify-center gap-3 rounded-card border-2 border-dashed px-4 py-6 text-center transition-colors',
          isDragOver ? 'border-oxblood bg-oxblood/5' : 'border-ink/20 bg-ivory-dim hover:border-oxblood/40',
        )}
      >
        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="sr-only" />
        {isDragOver ? <Upload size={20} className="text-oxblood" aria-hidden /> : <FileJson size={20} className="text-ink-soft" aria-hidden />}
        <div>
          <p className="text-sm! font-medium text-ink">{isDragOver ? 'Drop the design file here' : 'Drag and drop an Unlayer JSON file'}</p>
          <p className="mt-0.5 text-xs! text-ink-soft">or click to browse · maximum 5 MB</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => parsed.success && onApply(parsed.design, parsed.formattedJson)} disabled={!parsed.success}>
          Load JSON into Visual Builder
        </Button>
      </div>
    </div>
  )
}
