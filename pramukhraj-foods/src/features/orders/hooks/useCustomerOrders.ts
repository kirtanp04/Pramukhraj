import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/apiClient";
import { ordersApi } from "../api/orders.api";
import type { CustomerOrderListItem } from "../types/order.types";

export function useCustomerOrders(initialStatus = "all", initialPage = 1, pageSize = 10) {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState(initialStatus);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await ordersApi.list({ page, pageSize, status });
      if (response) {
        setOrders(response.items ?? response.orders ?? []);
        setTotalPages(response.totalPages ?? 1);
        setTotalCount(response.totalCount ?? 0);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  return {
    orders,
    page,
    setPage,
    status,
    setStatus: handleStatusChange,
    totalPages,
    totalCount,
    isLoading,
    error,
    reload: load,
  };
}

