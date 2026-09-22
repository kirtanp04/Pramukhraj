import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  CreditCard,
  Info,
  Layers,
  Mail,
  Terminal,
  Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminLogEntry } from '../types/logs.types'

interface LogEntryItemProps {
  entry: AdminLogEntry
  searchKeyword?: string
}

export function LogEntryItem({ entry, searchKeyword }: LogEntryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasDetails = Boolean(entry.details && entry.details.trim().length > 0)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(entry.raw)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is blocked
    }
  }

  // Highlight search matches
  const highlightText = (text: string) => {
    if (!searchKeyword || !searchKeyword.trim()) return text
    const query = searchKeyword.trim()
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="rounded bg-turmeric/35 px-0.5 font-semibold text-ink">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Format timestamp
  const formatTimestamp = (iso: string) => {
    try {
      const dt = new Date(iso)
      return dt.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false,
      })
    } catch {
      return iso
    }
  }

  // Level config
  const getLevelConfig = (level: string, isSuccess: boolean) => {
    if (isSuccess || level.toLowerCase() === 'success') {
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
        border: 'border-l-emerald-500',
        icon: CheckCircle2,
        label: 'SUCCESS',
      }
    }
    switch (level.toLowerCase()) {
      case 'error':
      case 'fatal':
        return {
          badge: 'bg-red-50 text-red-700 border-red-300 font-semibold',
          border: 'border-l-red-600',
          icon: AlertCircle,
          label: level.toUpperCase(),
        }
      case 'warning':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
          border: 'border-l-amber-500',
          icon: AlertTriangle,
          label: 'WARN',
        }
      case 'debug':
      case 'verbose':
        return {
          badge: 'bg-ink/5 text-ink-soft border-ink/20 font-medium',
          border: 'border-l-ink/20',
          icon: Terminal,
          label: level.toUpperCase(),
        }
      default:
        return {
          badge: 'bg-sky-50 text-sky-800 border-sky-300 font-medium',
          border: 'border-l-sky-500',
          icon: Info,
          label: 'INFO',
        }
    }
  }

  // Submodule config
  const getSubModuleConfig = (subModule: string) => {
    switch (subModule.toLowerCase()) {
      case 'payment':
        return {
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: CreditCard,
          label: 'Payment',
        }
      case 'email':
        return {
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Mail,
          label: 'Email',
        }
      case 'shipment':
        return {
          badge: 'bg-teal/10 text-teal border-teal/20',
          icon: Truck,
          label: 'Shipment',
        }
      default:
        return {
          badge: 'bg-ink/5 text-ink-soft border-ink/10',
          icon: Layers,
          label: 'System',
        }
    }
  }

  const levelConfig = getLevelConfig(entry.level, entry.isSuccess)
  const LevelIcon = levelConfig.icon

  const subModuleConfig = getSubModuleConfig(entry.subModule)
  const SubModuleIcon = subModuleConfig.icon

  return (
    <article
      className={cn(
        'group relative border-l-4 bg-ivory transition-colors hover:bg-ink/[0.015]',
        levelConfig.border,
        'border-b border-ink/10 p-3 sm:p-4'
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Badges & Timestamp */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] uppercase tracking-wider',
              levelConfig.badge
            )}
          >
            <LevelIcon size={12} />
            {levelConfig.label}
          </span>

          {/* SubModule Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium',
              subModuleConfig.badge
            )}
          >
            <SubModuleIcon size={12} />
            {subModuleConfig.label}
          </span>

          {/* Timestamp */}
          <time
            dateTime={entry.timestamp}
            className="font-mono text-xs text-ink-soft"
            title={new Date(entry.timestamp).toLocaleString()}
          >
            {formatTimestamp(entry.timestamp)}
          </time>

          {/* Source Context */}
          {entry.sourceContext && (
            <span
              className="hidden max-w-xs truncate rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-soft md:inline-block"
              title={entry.sourceContext}
            >
              {entry.sourceContext.split('.').slice(-2).join('.')}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy log line"
            className="inline-flex h-7 items-center gap-1 rounded border border-ink/15 bg-ivory px-2 text-[11px] text-ink-soft hover:bg-ink/5 hover:text-ink"
          >
            {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {hasDetails && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex h-7 items-center gap-1 rounded border border-ink/15 bg-ivory px-2 text-[11px] text-ink-soft hover:bg-ink/5 hover:text-ink"
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{isExpanded ? 'Hide' : 'Details'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Text */}
      <div className="mt-2 font-mono text-xs leading-relaxed text-ink break-words sm:text-sm">
        {highlightText(entry.message)}
      </div>

      {/* Expanded Details / Stack Trace / Multi-line payload */}
      {hasDetails && isExpanded && (
        <div className="mt-3 rounded border border-ink/15 bg-ink/[0.03] p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
              Diagnostic Details & Stack Trace
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-oxblood hover:underline inline-flex items-center gap-1"
            >
              <Copy size={11} /> Copy complete raw payload
            </button>
          </div>
          <pre className="max-h-72 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink/90">
            {highlightText(entry.details!)}
          </pre>
        </div>
      )}
    </article>
  )
}

