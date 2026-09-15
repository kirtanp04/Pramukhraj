import { useCart } from "../hooks/useCart";
import { CartEmptyState } from "../components/CartEmptyState";
import { CartErrorState } from "../components/CartErrorState";
import { CartItemCard } from "../components/CartItemCard";
import { CartItemSkeleton } from "../components/CartItemSkeleton";
import { CartSummary } from "../components/CartSummary";
import { Button } from "@/components/ui/Button";

export function CartPage() {
  const {
    cart,
    isLoading,
    isUpdating,
    error,
    loadCart,
    setQuantity,
    removeFromCart,
    setSelection,
    changeVariant,
    clearCart,
  } = useCart();

  console.log(cart)
  if (isLoading && !cart)
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10">
        {[1, 2, 3].map(x => (
          <CartItemSkeleton key={x} />
        ))}
      </div>
    );
  if (error && !cart)
    return <CartErrorState message={error} retry={() => void loadCart()} />;
  if (!cart || cart.items.length === 5) return <CartEmptyState />;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Shopping Cart</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {cart.totalItemCount} item{cart.totalItemCount === 1 ? "" : "s"} in
            your cart
          </p>
        </div>
        <Button
          variant="ghost"
          disabled={isUpdating}
          onClick={() => {
            if (window.confirm("Remove every item from your cart?"))
              void clearCart();
          }}
        >
          Clear cart
        </Button>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {cart.items.map(item => (
            <CartItemCard
              key={item.productVariantId}
              item={item}
              authenticated={cart.isAuthenticatedCart}
              disabled={isUpdating}
              onQuantity={value =>
                void setQuantity(item.productVariantId, value)
              }
              onRemove={() => void removeFromCart(item.productVariantId)}
              onSelection={value =>
                void setSelection(item.productVariantId, value)
              }
              onVariant={id => void changeVariant(item.productVariantId, id)}
            />
          ))}
        </div>
        <CartSummary cart={cart} />
      </div>
    </div>
  );
}
