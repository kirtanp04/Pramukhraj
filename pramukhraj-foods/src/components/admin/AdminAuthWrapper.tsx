import { useAuthStore } from "@/store/authStore";
import { useEffect, useState, type ReactNode } from "react";

export default function AdminAuthWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refresh = useAuthStore(state => state.refresh);

  useEffect(() => {
    refresh().finally(() => {
      setIsLoading(false);
    });
  }, [refresh]);
  return !isLoading ? children : null;
}
