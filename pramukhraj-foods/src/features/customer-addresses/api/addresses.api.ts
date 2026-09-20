import { ApiPath } from "@/constants/apiPaths";
import { apiDelete, apiGet, apiPatchResponse, apiPost, apiPutResponse } from "@/lib/apiClient";
import type { AddressInput, CustomerAddress } from "../types/address.types";

export const addressesApi = {
  list: () => apiGet<CustomerAddress[]>(ApiPath.customer.addresses.list),
  create: (input: AddressInput) => apiPost<CustomerAddress>(ApiPath.customer.addresses.list, input),
  update: async (id: string, input: AddressInput) => (await apiPutResponse<CustomerAddress>(ApiPath.customer.addresses.byId(id), input)).data,
  remove: (id: string) => apiDelete<unknown>(ApiPath.customer.addresses.byId(id)),
  setDefaultShipping: async (id: string) => (await apiPatchResponse<CustomerAddress>(ApiPath.customer.addresses.defaultShipping(id))).data,
  setDefaultBilling: async (id: string) => (await apiPatchResponse<CustomerAddress>(ApiPath.customer.addresses.defaultBilling(id))).data,
};
