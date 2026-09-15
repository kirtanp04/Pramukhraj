export async function loadImagesByIds<T extends { productId: string; imageUrl: string }, TImage>(
  items: T[], fetchImages: (ids: string[], signal?: AbortSignal) => Promise<Record<string, TImage> | null>,
  getUrl: (image: TImage) => string, signal?: AbortSignal,
): Promise<T[]> {
  const ids = [...new Set(items.map(item => item.productId.toLowerCase()).filter(Boolean))]
  if (ids.length === 0) return items
  const images = await fetchImages(ids, signal)
  const normalized = new Map(Object.entries(images ?? {}).map(([id, value]) => [id.toLowerCase(), value]))
  return items.map(item => {
    const image = normalized.get(item.productId.toLowerCase())
    return image ? { ...item, imageUrl: getUrl(image) } : item
  })
}
