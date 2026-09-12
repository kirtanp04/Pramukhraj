import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPost, apiPostResponse, apiPutResponse } from "@/lib/apiClient";
import type {
  AdminProductList,
  GetProductImagesRequestPayload,
  ProductFormValues,
  ProductDetailsResponse,
  ProductImagesDictionary,
} from "@/types/productSchema";
import type { ComboData } from "@/types/common";

export const productApi = {
  add(payload: ProductFormValues) {
    return apiPostResponse<string>(ApiPath.admin.product.add, payload);
  },
  getById(id: string, signal?: AbortSignal) {
    return apiGet<ProductDetailsResponse>(ApiPath.admin.product.getById(id), { signal });
  },
  update(id: string, payload: ProductFormValues, signal?: AbortSignal) {
    return apiPutResponse<string>(ApiPath.admin.product.update(id), payload, { signal });
  },
  getComboList(signal?: AbortSignal) {
    return apiGet<ComboData[]>(ApiPath.admin.product.getComboList, { signal });
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
