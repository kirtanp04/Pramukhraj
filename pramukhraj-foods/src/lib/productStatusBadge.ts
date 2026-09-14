import { productStatuses, type ProductStatus } from '@/constants/searchQueryParams'
import type { Product } from '@/types/catalog'

export interface ProductStatusBadge {
  label: string
  variant: 'oxblood' | 'teal' | 'turmeric'
}

interface StatusBadgeOption extends ProductStatusBadge {
  isActive: boolean
  status: ProductStatus
}

export function getProductStatusBadge(
  product: Product,
  selectedStatus?: ProductStatus | null,
): ProductStatusBadge | null {
  const options: StatusBadgeOption[] = [
    {
      status: productStatuses.bestSellers,
      isActive: product.bestSeller,
      label: 'Best Seller',
      variant: 'oxblood',
    },
    {
      status: productStatuses.newArrivals,
      isActive: product.newArrival,
      label: 'New',
      variant: 'teal',
    },
    {
      status: productStatuses.trending,
      isActive: product.trending,
      label: 'Trending',
      variant: 'turmeric',
    },
  ]
  const activeOptions = options.filter((option) => option.isActive)

  if (activeOptions.length === 0) return null
  if (activeOptions.length === 1 || selectedStatus === undefined) {
    return toStatusBadge(activeOptions[0])
  }

  const selectedOption = activeOptions.find((option) => option.status === selectedStatus)
  return selectedOption ? toStatusBadge(selectedOption) : null
}

function toStatusBadge(option: StatusBadgeOption): ProductStatusBadge {
  return { label: option.label, variant: option.variant }
}
