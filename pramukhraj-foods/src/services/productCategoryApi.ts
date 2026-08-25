import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPost, apiPostResponse } from "@/lib/apiClient";
import type { ComboData } from "@/types/common";
import type {
  AdminCategoryList,
  CategoryImagesDictionary,
  GetCategoryImagesRequestPayload,
} from "@/types/productCategory";
import type { AddProductCategoryRequest } from "@/types/productCategorySchema";

export const productCategoryApi = {
  add(payload: AddProductCategoryRequest) {
    return apiPostResponse<string>(ApiPath.admin.productCategory.add, payload);
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
