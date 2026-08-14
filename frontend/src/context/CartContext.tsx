import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { FoodItem } from "../data";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  total: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: FoodItem) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return {
      items,
      isOpen,
      count,
      total,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem: (item) => {
        setItems((prev) => {
          const existing = prev.find((cartItem) => cartItem.id === item.id);
          if (existing) {
            return prev.map((cartItem) =>
              cartItem.id === item.id
                ? { ...cartItem, qty: cartItem.qty + 1 }
                : cartItem
            );
          }
          return [
            ...prev,
            { id: item.id, name: item.name, price: item.price, qty: 1 },
          ];
        });
      },
      removeItem: (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      },
      updateQty: (id, qty) => {
        if (qty <= 0) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          return;
        }
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, qty } : item))
        );
      },
      clear: () => setItems([]),
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}