import { ApiPath } from "@/constants/apiPaths";
import { apiPost } from "@/lib/apiClient";
import type { ProductFormValues } from "@/types/productSchema";


export const productApi = {
  add(payload: ProductFormValues) {
    return apiPost<string>(ApiPath.admin.product.add, payload);
  },
};
