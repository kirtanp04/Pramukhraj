import { describe, expect, it } from 'vitest'
import { parseEmailDesignJson } from './emailDesignJson'

describe('parseEmailDesignJson', () => {
  it('accepts and formats an Unlayer design object', () => {
    const result = parseEmailDesignJson('{"body":{"rows":[]},"schemaVersion":21}')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.design.body).toEqual({ rows: [] })
      expect(result.formattedJson).toContain('\n  "body"')
    }
  })

  it('rejects JSON arrays', () => {
    expect(parseEmailDesignJson('[]')).toEqual({ success: false, error: 'The design must be a JSON object.' })
  })

  it('rejects objects without an Unlayer body', () => {
    expect(parseEmailDesignJson('{"name":"not a design"}')).toEqual({
      success: false,
      error: 'This is not a valid Unlayer design: the body object is missing.',
    })
  })

  it('returns a useful syntax error', () => {
    const result = parseEmailDesignJson('{broken')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('Invalid JSON:')
  })
})

