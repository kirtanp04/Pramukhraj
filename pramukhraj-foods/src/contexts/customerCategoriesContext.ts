import { createContext } from 'react'
import type { useCustomerCategoriesQuery } from '@/hooks/useCustomerCategories'

export type CustomerCategoriesContextValue = ReturnType<typeof useCustomerCategoriesQuery>

export const CustomerCategoriesContext = createContext<CustomerCategoriesContextValue | null>(null)
