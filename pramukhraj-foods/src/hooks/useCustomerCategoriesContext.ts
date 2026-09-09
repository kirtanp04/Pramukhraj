import { useContext } from 'react'
import { CustomerCategoriesContext } from '@/contexts/customerCategoriesContext'

export function useCustomerCategories() {
  const value = useContext(CustomerCategoriesContext)
  if (!value) {
    throw new Error('useCustomerCategories must be used inside CustomerCategoriesProvider.')
  }
  return value
}
