export function getPositiveIntegerQueryParam(
  searchParams: URLSearchParams,
  key: string,
  fallback = 1,
): number {
  const rawValue = searchParams.get(key)
  if (rawValue === null || rawValue.trim() === '') return fallback

  const parsedValue = Number(rawValue)
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback
}
