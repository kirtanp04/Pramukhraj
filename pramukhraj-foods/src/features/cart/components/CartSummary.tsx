import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import type { CartResponse } from "../types/cart.types";

export function CartSummary({ cart }: { cart: CartResponse }) {
  return (
    <aside className="h-fit rounded-card border border-ink/10 bg-ivory-dim p-5">
      <h2 className="font-display text-lg!">Order Summary</h2>
      <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm!">
        <div className="flex justify-between text-ink-soft">
          <span>MRP</span>
          <span>{formatINR(cart.totalMRP)}</span>
        </div>
        <div className="flex justify-between text-green-700">
          <span>Discount</span>
          <span>-{formatINR(cart.totalDiscount)}</span>
        </div>
        <div className="flex justify-between border-t border-ink/10 pt-3 font-semibold text-ink">
          <span>Subtotal</span>
          <span>{formatINR(cart.subtotal)}</span>
        </div>
        <p className="text-right text-[11px]! text-ink-soft">Inclusive of all taxes</p>
      </div>
      {cart.availabilityWarnings.length > 0 && (
        <p className="mt-3 text-xs! text-red-700">
          Resolve unavailable selected items before checkout.
        </p>
      )}
      <Button
        size="lg"
        className="mt-5 w-full"
        disabled={!cart.canCheckout}
        asChild={cart.canCheckout}
      >
        {cart.canCheckout ? (
          <Link to="/checkout">
            <ShoppingBag size={16} /> Proceed to Checkout
          </Link>
        ) : (
          <span>
            <ShoppingBag size={16} /> Checkout unavailable
          </span>
        )}
      </Button>
      <Link
        to="/products"
        className="mt-3 block text-center text-sm! text-ink-soft"
      >
        Continue Shopping
      </Link>
    </aside>
  );
}
