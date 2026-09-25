import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/apiClient";
import { ordersApi } from "../api/orders.api";
import type { CustomerOrderDetail } from "../types/order.types";

export function useCustomerOrderDetail(orderId?: string) {
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const load = useCallback(
    async (isBackground = false) => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }
      if (!isBackground) {
        setIsLoading(true);
      }
      setError("");
      try {
        const response = await ordersApi.getById(orderId);
        setOrder(response ?? null);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [orderId]
  );

  const reload = useCallback(() => load(true), [load]);

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    order,
    isLoading,
    error,
    reload,
  };
}

