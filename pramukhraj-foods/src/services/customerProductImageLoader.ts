import { customerProductApi } from '@/services/customerProductApi'

const imageCache = new Map<string, string>()
const pendingImages = new Map<string, Promise<string>>()
const queuedProductIds = new Map<string, string>()
const queuedResolvers = new Map<
  string,
  { resolve: (url: string) => void; reject: (error: unknown) => void }
>()
let batchTimer: ReturnType<typeof setTimeout> | null = null

async function flushImageQueue() {
  batchTimer = null
  const batch = new Map(queuedProductIds)
  queuedProductIds.clear()

  try {
    const images = await customerProductApi.getImagesByIds([...batch.values()])
    const normalizedImages = new Map(
      Object.entries(images ?? {}).map(([id, image]) => [id.toLowerCase(), image.imageurl]),
    )

    for (const key of batch.keys()) {
      const imageUrl = normalizedImages.get(key) ?? ''
      imageCache.set(key, imageUrl)
      pendingImages.delete(key)
      queuedResolvers.get(key)?.resolve(imageUrl)
      queuedResolvers.delete(key)
    }
  } catch (error: unknown) {
    for (const key of batch.keys()) {
      pendingImages.delete(key)
      queuedResolvers.get(key)?.reject(error)
      queuedResolvers.delete(key)
    }
  }
}

export function getCachedCustomerProductImage(productId: string) {
  return imageCache.get(productId.toLowerCase()) ?? ''
}

export function loadCustomerProductImage(productId: string): Promise<string> {
  const key = productId.toLowerCase()
  const cached = imageCache.get(key)
  if (cached !== undefined) return Promise.resolve(cached)

  const pending = pendingImages.get(key)
  if (pending) return pending

  const request = new Promise<string>((resolve, reject) => {
    queuedProductIds.set(key, productId)
    queuedResolvers.set(key, { resolve, reject })
    batchTimer ??= setTimeout(() => void flushImageQueue(), 0)
  })

  pendingImages.set(key, request)
  return request
}
