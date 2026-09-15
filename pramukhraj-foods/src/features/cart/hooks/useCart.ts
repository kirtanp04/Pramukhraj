import { useEffect } from "react";
import { useCartStore } from "../store/cart.store";
import { useCustomerAuthStore } from "@/features/customer-auth/store/customerAuthStore";

export function useCart() {
  const state = useCartStore();
  const loadCart = useCartStore(value => value.loadCart);
  const initialized = useCustomerAuthStore(value => value.isInitialized);
  const authenticated = useCustomerAuthStore(value => value.isAuthenticated);
  useEffect(() => {
    if (initialized) void loadCart();
  }, [initialized, authenticated, loadCart]);
  return state;
}
