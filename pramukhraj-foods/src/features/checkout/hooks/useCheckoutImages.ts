import { useEffect, useState } from "react";
import { loadCustomerProductImage } from "@/services/customerProductImageLoader";
import type { CheckoutItem } from "../types/checkout.types";
export function useCheckoutImages(items: CheckoutItem[]) { const [images, setImages] = useState<Record<string, string>>({}); useEffect(() => { let active = true; void Promise.all(items.map(async item => [item.productId, await loadCustomerProductImage(item.productId)] as const)).then(entries => { if (active) setImages(Object.fromEntries(entries)); }).catch(() => undefined); return () => { active = false; }; }, [items]); return images; }
