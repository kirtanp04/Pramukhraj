const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidGuid(value: string | undefined): value is string {
  return value !== undefined && GUID_PATTERN.test(value) && value !== '00000000-0000-0000-0000-000000000000'
}
