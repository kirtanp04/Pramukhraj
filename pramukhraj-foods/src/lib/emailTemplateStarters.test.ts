import { describe, expect, it } from 'vitest'
import { EMAIL_TEMPLATE_CATEGORY } from '@/types/emailTemplate'
import { parseEmailDesignJson } from './emailDesignJson'
import { EMAIL_TEMPLATE_STARTERS } from './emailTemplateStarters'

function referencedVariables(value: unknown) {
  const matches = JSON.stringify(value).matchAll(/\{\{([a-z0-9_]+)\}\}/g)
  return new Set(Array.from(matches, match => match[1]))
}

describe('EMAIL_TEMPLATE_STARTERS', () => {
  it('provides a unique valid Unlayer design for every starter', () => {
    const keys = EMAIL_TEMPLATE_STARTERS.map(starter => starter.key)
    expect(new Set(keys).size).toBe(keys.length)

    for (const starter of EMAIL_TEMPLATE_STARTERS) {
      expect(parseEmailDesignJson(JSON.stringify(starter.design)).success, starter.key).toBe(true)
    }
  })

  it('declares every variable referenced by its content', () => {
    for (const starter of EMAIL_TEMPLATE_STARTERS) {
      const declared = new Set<string>(starter.variables)
      const referenced = referencedVariables({
        subject: starter.subject,
        plainTextContent: starter.plainTextContent,
        design: starter.design,
      })

      expect([...referenced].filter(variable => !declared.has(variable)), starter.key).toEqual([])
    }
  })

  it('includes an email-verification OTP template', () => {
    const otp = EMAIL_TEMPLATE_STARTERS.find(starter => starter.key === 'EMAIL_VERIFICATION_OTP')
    expect(otp?.variables).toContain('otp_code')
    expect(otp?.variables).toContain('expires_in')
  })

  it('covers every email-template category', () => {
    const categories = new Set(EMAIL_TEMPLATE_STARTERS.map(starter => starter.category))
    expect(categories).toEqual(new Set(Object.values(EMAIL_TEMPLATE_CATEGORY)))
  })
})
