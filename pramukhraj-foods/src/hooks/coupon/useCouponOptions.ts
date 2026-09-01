import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { couponApi } from '@/services/couponApi'
import type { ComboData } from '@/types/common'
import type { CouponApplicationScope } from '@/types/coupon'

type OptionKind = 'products' | 'categories'
interface OptionState { items: ComboData[]; loading: boolean; error: string | null }
const emptyState: OptionState = { items: [], loading: false, error: null }

export function useCouponOptions(scope: CouponApplicationScope) {
  const [products, setProducts] = useState<OptionState>(emptyState)
  const [categories, setCategories] = useState<OptionState>(emptyState)
  const loaded = useRef({ products: false, categories: false })
  const [retryVersion, setRetryVersion] = useState({ products: 0, categories: 0 })
  const kind: OptionKind | null = scope === 'SpecificProducts' ? 'products' : scope === 'SpecificCategories' ? 'categories' : null

  useEffect(() => {
    if (!kind || loaded.current[kind]) return
    const optionKind = kind
    const controller = new AbortController()
    const setState = optionKind === 'products' ? setProducts : setCategories
    async function load() {
      setState(state => ({ ...state, loading: true, error: null }))
      try {
        const response = optionKind === 'products'
          ? await couponApi.getProductComboList(controller.signal)
          : await couponApi.getCategoryComboList(controller.signal)
        if (!controller.signal.aborted) {
          loaded.current[optionKind] = true
          setState({ items: response ?? [], loading: false, error: null })
        }
      } catch (caught: unknown) {
        if (!controller.signal.aborted) setState({ items: [], loading: false, error: getApiErrorMessage(caught) })
      }
    }
    void load()
    return () => controller.abort()
  }, [kind, retryVersion.categories, retryVersion.products])

  const retry = useCallback((target: OptionKind) => {
    loaded.current[target] = false
    setRetryVersion(value => ({ ...value, [target]: value[target] + 1 }))
  }, [])

  return { products, categories, retry }
}
