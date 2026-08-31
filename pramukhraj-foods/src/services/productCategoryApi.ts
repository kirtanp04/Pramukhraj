import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPost, apiPostResponse, apiPutResponse } from "@/lib/apiClient";
import type { ComboData } from "@/types/common";
import type {
  AdminCategoryList,
  CategoryImagesDictionary,
  GetCategoryImagesRequestPayload,
  ProductCategoryDetailsResponse,
} from "@/types/productCategory";
import type { AddProductCategoryRequest } from "@/types/productCategorySchema";

export const productCategoryApi = {
  add(payload: AddProductCategoryRequest) {
    return apiPostResponse<string>(ApiPath.admin.productCategory.add, payload);
  },
  getById(id: string, signal?: AbortSignal) {
    return apiGet<ProductCategoryDetailsResponse>(
      ApiPath.admin.productCategory.getById(id),
      { signal }
    );
  },
  update(id: string, payload: AddProductCategoryRequest, signal?: AbortSignal) {
    return apiPutResponse<string>(
      ApiPath.admin.productCategory.update(id),
      payload,
      { signal }
    );
  },
  getComboList(signal?: AbortSignal) {
    return apiGet<ComboData[]>(ApiPath.admin.productCategory.getComboList, {
      signal,
    });
  },
  getAdminCategoryList(pageNumber: number, signal?: AbortSignal) {
    return apiGet<AdminCategoryList[]>(
      ApiPath.admin.productCategory.getAdminList(pageNumber),
      {
        signal,
      }
    );
  },
  getImagesListByIds(categoryIds: string[], signal?: AbortSignal) {
    const payload: GetCategoryImagesRequestPayload = { categoryIds };
    return apiPost<CategoryImagesDictionary>(
      ApiPath.admin.productCategory.getImagesListByIds,
      payload,
      { signal }
    );
  },
};
