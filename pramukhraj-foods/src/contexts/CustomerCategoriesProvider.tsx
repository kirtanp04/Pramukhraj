import type { PropsWithChildren } from 'react'
import { CustomerCategoriesContext } from '@/contexts/customerCategoriesContext'
import { useCustomerCategoriesQuery } from '@/hooks/useCustomerCategories'

export function CustomerCategoriesProvider({ children }: PropsWithChildren) {
  const value = useCustomerCategoriesQuery()
  return (
    <CustomerCategoriesContext.Provider value={value}>
      {children}
    </CustomerCategoriesContext.Provider>
  )
}
