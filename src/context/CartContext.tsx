"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { Artwork, CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  isCheckoutComplete: boolean;
  orderNumber: string | null;
}

type CartAction =
  | { type: "ADD_ITEM"; artwork: Artwork }
  | { type: "REMOVE_ITEM"; artworkId: string }
  | { type: "UPDATE_QUANTITY"; artworkId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "COMPLETE_CHECKOUT"; orderNumber: string }
  | { type: "RESET_CHECKOUT" }
  | { type: "HYDRATE"; state: CartState };

const initialState: CartState = {
  items: [],
  isCheckoutComplete: false,
  orderNumber: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.artwork.id === action.artwork.id
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.artwork.id === action.artwork.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { artwork: action.artwork, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.artwork.id !== action.artworkId
        ),
      };
    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.artwork.id !== action.artworkId
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.artwork.id === action.artworkId
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    case "CLEAR_CART":
      return { ...initialState };
    case "COMPLETE_CHECKOUT":
      return {
        items: [],
        isCheckoutComplete: true,
        orderNumber: action.orderNumber,
      };
    case "RESET_CHECKOUT":
      return { ...initialState };
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  isCheckoutComplete: boolean;
  orderNumber: string | null;
  addItem: (artwork: Artwork) => void;
  removeItem: (artworkId: string) => void;
  updateQuantity: (artworkId: string, quantity: number) => void;
  clearCart: () => void;
  completeCheckout: () => void;
  resetCheckout: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("canvas-cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: "HYDRATE", state: parsed });
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("canvas-cart", JSON.stringify(state));
    }
  }, [state, hydrated]);

  const addItem = useCallback(
    (artwork: Artwork) => dispatch({ type: "ADD_ITEM", artwork }),
    []
  );
  const removeItem = useCallback(
    (artworkId: string) => dispatch({ type: "REMOVE_ITEM", artworkId }),
    []
  );
  const updateQuantity = useCallback(
    (artworkId: string, quantity: number) =>
      dispatch({ type: "UPDATE_QUANTITY", artworkId, quantity }),
    []
  );
  const clearCart = useCallback(
    () => dispatch({ type: "CLEAR_CART" }),
    []
  );
  const completeCheckout = useCallback(() => {
    const orderNumber = `CNV-${Date.now().toString(36).toUpperCase()}`;
    dispatch({ type: "COMPLETE_CHECKOUT", orderNumber });
  }, []);
  const resetCheckout = useCallback(
    () => dispatch({ type: "RESET_CHECKOUT" }),
    []
  );

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.artwork.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isCheckoutComplete: state.isCheckoutComplete,
        orderNumber: state.orderNumber,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        completeCheckout,
        resetCheckout,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
