"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

type CommerceState = {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (productId: string, quantity?: number, options?: { color?: string; size?: string }) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  toggleWishlist: (productId: string) => void;
  clearCart: () => void;
};

export const useCommerceStore = create<CommerceState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      addToCart: (productId, quantity = 1, options = {}) =>
        set((state) => {
          const line = state.cart.find((item) => item.productId === productId && item.color === options.color && item.size === options.size);
          if (line) {
            return {
              cart: state.cart.map((item) =>
                item.productId === productId && item.color === options.color && item.size === options.size
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            };
          }
          return { cart: [...state.cart, { productId, quantity, ...options }] };
        }),
      removeFromCart: (productId, color, size) =>
        set((state) => ({
          cart: state.cart.filter((item) => !(item.productId === productId && item.color === color && item.size === size))
        })),
      updateQuantity: (productId, quantity, color, size) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productId === productId && item.color === color && item.size === size
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          )
        })),
      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId]
        })),
      clearCart: () => set({ cart: [] })
    }),
    {
      name: "monimala-commerce"
    }
  )
);
