import { create } from "zustand";
import { toast } from "sonner";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  hasCustomerAccessToken,
} from "@/lib/apiClient";
import { customerProductApi } from "@/services/customerProductApi";
import { loadImagesByIds } from "@/shared/utils/load-images-by-ids";
import { cartApi } from "../api/cart.api";
import { guestCartService } from "../services/guest-cart.service";
import type { CartResponse, GuestCartItem } from "../types/cart.types";

const FALLBACK_IMAGE = "/favicon.ico";
const MERGE_REQUEST_STORAGE_KEY = "pramukhraj-cart-merge-request-v1";
type LegacyLine = { productId: string; quantity: number };
type PendingMergeRequest = { fingerprint: string; requestId: string };

let mergeGuestCartPromise: Promise<boolean> | null = null;

interface CartState {
  cart: CartResponse | null;
  lines: LegacyLine[];
  isCartOpen: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  loadCart: () => Promise<void>;
  addToCart: (productVariantId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productVariantId: string) => Promise<void>;
  setQuantity: (productVariantId: string, quantity: number) => Promise<void>;
  setSelection: (productVariantId: string, selected: boolean) => Promise<void>;
  changeVariant: (
    productVariantId: string,
    nextVariantId: string
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<boolean>;
  openCart: () => void;
  closeCart: () => void;
}

function authenticated(): boolean {
  return hasCustomerAccessToken();
}

function guestCartFingerprint(items: GuestCartItem[]): string {
  return items
    .map(item => `${item.productVariantId.toLowerCase()}:${item.quantity}`)
    .sort()
    .join("|");
}

function getMergeRequestId(items: GuestCartItem[]): string {
  const fingerprint = guestCartFingerprint(items);
  try {
    const raw = sessionStorage.getItem(MERGE_REQUEST_STORAGE_KEY);
    if (raw) {
      const pending = JSON.parse(raw) as Partial<PendingMergeRequest>;
      if (
        pending.fingerprint === fingerprint &&
        typeof pending.requestId === "string" &&
        pending.requestId.length > 0
      ) {
        return pending.requestId;
      }
    }
  } catch {
    // A new request ID is safe when session storage is unavailable or malformed.
  }

  const requestId = crypto.randomUUID();
  try {
    sessionStorage.setItem(
      MERGE_REQUEST_STORAGE_KEY,
      JSON.stringify({ fingerprint, requestId } satisfies PendingMergeRequest)
    );
  } catch {
    // The backend still validates and processes this request without persistence.
  }
  return requestId;
}

function clearPendingMergeRequest(): void {
  try {
    sessionStorage.removeItem(MERGE_REQUEST_STORAGE_KEY);
  } catch {
    // No action is required when session storage is unavailable.
  }
}

function lines(cart: CartResponse | null): LegacyLine[] {
  return (
    cart?.items.map(item => ({
      productId: item.productVariantId,
      quantity: item.quantity,
    })) ?? []
  );
}

function initialLines(): LegacyLine[] {
  try {
    return guestCartService
      .read()
      .items.map(item => ({
        productId: item.productVariantId,
        quantity: item.quantity,
      }));
  } catch {
    return [];
  }
}

async function withImages(cart: CartResponse): Promise<CartResponse> {
  try {
    const items = await loadImagesByIds(
      cart.items,
      customerProductApi.getImagesByIds,
      image => image.imageurl || FALLBACK_IMAGE
    );
    return { ...cart, items };
  } catch {
    return {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        imageUrl: item.imageUrl || FALLBACK_IMAGE,
      })),
    };
  }
}

function preserveLoadedImages(
  cart: CartResponse,
  previousCart: CartResponse
): CartResponse {
  const imageByProductId = new Map(
    previousCart.items
      .filter(item => item.imageUrl.length > 0)
      .map(item => [item.productId.toLowerCase(), item.imageUrl])
  );

  return {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      imageUrl:
        item.imageUrl ||
        imageByProductId.get(item.productId.toLowerCase()) ||
        FALLBACK_IMAGE,
    })),
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  lines: initialLines(),
  isCartOpen: false,
  isLoading: false,
  isUpdating: false,
  error: null,
  loadCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const guest = guestCartService.read();
      if (authenticated() && guest.items.length > 0) {
        const merged = await get().mergeGuestCart();
        if (merged) {
          set({ isLoading: false });
          return;
        }
      }

      const result = authenticated()
        ? await cartApi.get()
        : await cartApi.resolveGuest(guest.items);
      if (!result) throw new Error("Cart response was empty.");
      // Cart content must not wait for the optional second-stage image request.
      set({ cart: result, lines: lines(result), isLoading: false });

      const cartWithImages = await withImages(result);
      set(state =>
        state.cart === result
          ? { cart: cartWithImages, lines: lines(cartWithImages) }
          : {}
      );
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoading: false });
    }
  },
  addToCart: async (productVariantId, quantity = 1) => {
    if (get().isUpdating) return;
    set({ isUpdating: true, error: null });
    try {
      if (!authenticated()) {
        const guest = guestCartService.add(productVariantId, quantity);
        set({
          cart: null,
          lines: guest.items.map(item => ({
            productId: item.productVariantId,
            quantity: item.quantity,
          })),
        });
        toast.success("Added to cart");
        return;
      }

      const result = await cartApi.add(productVariantId, quantity);
      if (!result) throw new Error("Cart response was empty.");
      const cart = await withImages(result);
      set({ cart, lines: lines(cart), isCartOpen: true });
      toast.success("Added to cart");
    } catch (error) {
      const message = getApiErrorMessage(error);
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isUpdating: false });
    }
  },
  removeFromCart: async productVariantId => {
    if (get().isUpdating) return;
    set({ isUpdating: true });
    try {
      const current = get().cart?.items.find(
        x => x.productVariantId === productVariantId
      );
      const result =
        authenticated() && current?.cartItemId
          ? await cartApi.remove(current.cartItemId)
          : await cartApi.resolveGuest(
              guestCartService.remove(productVariantId).items
            );
      if (result) {
        const cart = await withImages(result);
        set({ cart, lines: lines(cart) });
      }
      toast.success("Item removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      set({ isUpdating: false });
    }
  },
  setQuantity: async (productVariantId, quantity) => {
    if (quantity < 1) return get().removeFromCart(productVariantId);
    if (get().isUpdating) return;
    set({ isUpdating: true });
    try {
      const currentCart = get().cart;
      const current = currentCart?.items.find(
        x => x.productVariantId === productVariantId
      );
      const result =
        authenticated() && current?.cartItemId && currentCart
          ? await cartApi.updateQuantity(
              current.cartItemId,
              quantity,
              currentCart.cartVersion
            )
          : await cartApi.resolveGuest(
              guestCartService.update(productVariantId, quantity).items
            );
      if (result) {
        const cart = await withImages(result);
        set({ cart, lines: lines(cart) });
      }
    } catch (error) {
      if (getApiErrorStatus(error) === 409) void get().loadCart();
      toast.error(getApiErrorMessage(error));
    } finally {
      set({ isUpdating: false });
    }
  },
  setSelection: async (productVariantId, selected) => {
    const currentCart = get().cart;
    const item = currentCart?.items.find(
      x => x.productVariantId === productVariantId
    );
    if (
      !authenticated() ||
      !currentCart ||
      !item?.cartItemId ||
      get().isUpdating
    )
      return;
    set({ isUpdating: true });
    try {
      const result = await cartApi.updateSelection(
        item.cartItemId,
        selected,
        currentCart.cartVersion
      );
      if (result) {
        const cart = preserveLoadedImages(result, currentCart);
        set({ cart, lines: lines(cart) });
      }
    } catch (error) {
      if (getApiErrorStatus(error) === 409) void get().loadCart();
      toast.error(getApiErrorMessage(error));
    } finally {
      set({ isUpdating: false });
    }
  },
  changeVariant: async (productVariantId, nextVariantId) => {
    const currentCart = get().cart;
    const item = currentCart?.items.find(
      x => x.productVariantId === productVariantId
    );
    if (!currentCart || !item || get().isUpdating) return;
    set({ isUpdating: true });
    try {
      const result =
        authenticated() && item.cartItemId
          ? await cartApi.changeVariant(
              item.cartItemId,
              nextVariantId,
              currentCart.cartVersion
            )
          : (guestCartService.remove(productVariantId),
            await cartApi.resolveGuest(
              guestCartService.add(nextVariantId, item.quantity).items
            ));
      if (result) {
        const cart = await withImages(result);
        set({ cart, lines: lines(cart) });
        toast.success("Variant changed");
      }
    } catch (error) {
      if (getApiErrorStatus(error) === 409) void get().loadCart();
      toast.error(getApiErrorMessage(error));
    } finally {
      set({ isUpdating: false });
    }
  },
  clearCart: async () => {
    set({ isUpdating: true });
    try {
      const result = authenticated()
        ? await cartApi.clear()
        : (guestCartService.clear(), await cartApi.resolveGuest([]));
      if (result) set({ cart: result, lines: [] });
      toast.success("Cart cleared");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      set({ isUpdating: false });
    }
  },
  mergeGuestCart: async () => {
    if (!authenticated()) return false;
    if (mergeGuestCartPromise) return mergeGuestCartPromise;

    mergeGuestCartPromise = (async () => {
      const guest = guestCartService.read();
      try {
        const result =
          guest.items.length > 0
            ? await cartApi.merge(guest.items, getMergeRequestId(guest.items))
            : await cartApi.get();
        if (!result) return false;

        if (guest.items.length > 0) {
          guestCartService.clear();
          clearPendingMergeRequest();
        }

        const cart = await withImages(result);
        set({ cart, lines: lines(cart) });
        result.availabilityWarnings.forEach(warning =>
          toast.warning(warning.message)
        );
        return true;
      } catch (error) {
        toast.error(
          `Your saved cart could not be merged: ${getApiErrorMessage(error)}`
        );
        return false;
      }
    })().finally(() => {
      mergeGuestCartPromise = null;
    });

    return mergeGuestCartPromise;
  },
  openCart: () => {
    set({ isCartOpen: true });
    void get().loadCart();
  },
  closeCart: () => set({ isCartOpen: false }),
}));
