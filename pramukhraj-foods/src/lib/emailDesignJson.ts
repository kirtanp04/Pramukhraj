export const EMAIL_DESIGN_JSON_MAX_BYTES = 5 * 1024 * 1024

export type EmailDesignJson = Record<string, unknown> & {
  body: Record<string, unknown>
}

export type EmailDesignJsonParseResult =
  | { success: true; design: EmailDesignJson; formattedJson: string }
  | { success: false; error: string }

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength
}

export function parseEmailDesignJson(value: string): EmailDesignJsonParseResult {
  if (!value.trim()) return { success: false, error: 'Enter or import an Unlayer design JSON object.' }
  if (byteLength(value) > EMAIL_DESIGN_JSON_MAX_BYTES) return { success: false, error: 'The design JSON must be 5 MB or smaller.' }

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { success: false, error: 'The design must be a JSON object.' }
    }

    const design = parsed as Record<string, unknown>
    if (!design.body || typeof design.body !== 'object' || Array.isArray(design.body)) {
      return { success: false, error: 'This is not a valid Unlayer design: the body object is missing.' }
    }

    return {
      success: true,
      design: design as EmailDesignJson,
      formattedJson: JSON.stringify(design, null, 2),
    }
  } catch (error) {
    if (error instanceof SyntaxError) return { success: false, error: `Invalid JSON: ${error.message}` }
    return { success: false, error: 'The design JSON could not be read.' }
  }
}

