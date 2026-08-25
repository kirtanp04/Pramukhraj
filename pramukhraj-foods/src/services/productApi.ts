import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPost } from "@/lib/apiClient";
import type {
  AdminProductList,
  GetProductImagesRequestPayload,
  ProductFormValues,
  ProductImagesDictionary,
} from "@/types/productSchema";

export const productApi = {
  add(payload: ProductFormValues) {
    return apiPost<string>(ApiPath.admin.product.add, payload);
  },

  getAdminProductList(pageNumber: number, signal?: AbortSignal) {
    return apiGet<AdminProductList[]>(
      ApiPath.admin.product.getAdminList(pageNumber),
      {
        signal,
      }
    );
  },
  getImagesListByIds(productIds: string[], signal?: AbortSignal) {
    const payload: GetProductImagesRequestPayload = { productIds };
    return apiPost<ProductImagesDictionary>(
      ApiPath.admin.product.getImagesListByIds,
      payload,
      { signal }
    );
  },
};
