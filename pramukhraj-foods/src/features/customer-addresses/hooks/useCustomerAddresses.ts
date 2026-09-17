import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/apiClient";
import { addressesApi } from "../api/addresses.api";
import type { AddressInput, CustomerAddress } from "../types/address.types";

export function useCustomerAddresses() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isMutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setAddresses((await addressesApi.list()) ?? []); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const mutate = useCallback(async <T,>(operation: () => Promise<T>) => {
    setMutating(true); setError("");
    try { const result = await operation(); await load(); return result; }
    catch (requestError) { const message = getApiErrorMessage(requestError); setError(message); throw new Error(message); }
    finally { setMutating(false); }
  }, [load]);
  return {
    addresses, isLoading, isMutating, error, load,
    save: (input: AddressInput, id?: string) => mutate(() => id ? addressesApi.update(id, input) : addressesApi.create(input)),
    remove: (id: string) => mutate(() => addressesApi.remove(id)),
    setDefaultShipping: (id: string) => mutate(() => addressesApi.setDefaultShipping(id)),
    setDefaultBilling: (id: string) => mutate(() => addressesApi.setDefaultBilling(id)),
  };
}
