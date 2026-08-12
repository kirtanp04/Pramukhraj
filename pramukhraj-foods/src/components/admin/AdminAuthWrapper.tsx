import { useAuthStore } from "@/store/authStore";
import { useEffect, useState, type ReactNode } from "react";

export default function AdminAuthWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { refresh } = useAuthStore();

  useEffect(() => {
    refresh().finally(() => {
      setIsLoading(false);
    });
  }, []);
  return !isLoading ? children : null;
}
