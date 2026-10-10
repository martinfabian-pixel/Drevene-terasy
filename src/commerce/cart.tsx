import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { findProduct, findVariant, productCatalog, type Product } from './catalog';
import { cartKey, getCartTotals, validProductQuantity, validateCart, type CartItem, type CartTotals } from './cart-core';
interface CartContextValue {
  items: CartItem[]; itemCount: number; totals: CartTotals; catalog: Product[];
  addItem: (productId: string, variantId: string, quantity: number) => void;
  updateItem: (key: string, quantity: number) => void; removeItem: (key: string) => void; clearCart: () => void;
  replaceCatalog: (products: Product[]) => void;
}
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE = 'drevene-terasy.cart.v1';
export function CartProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState(productCatalog);
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return validateCart(JSON.parse(localStorage.getItem(STORAGE) || 'null')); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify({ version: 1, items })); } catch { /* The cart remains usable without storage. */ } }, [items]);
  const addItem = (productId: string, variantId: string, quantity: number) => {
    const product = findProduct(productId, catalog);
    const variant = product && findVariant(product, variantId);
    if (!product || !variant || !validProductQuantity(quantity, variant)) return;
    const key = cartKey(productId, variantId);
    setItems(previous => {
      const existing = previous.find(item => item.key === key);
      return existing ? previous.map(item => item.key === key ? { ...item, quantity: Math.min(100_000, item.quantity + quantity) } : item) : [...previous, { key, productId, variantId, quantity }];
    });
  };
  const replaceCatalog = (products: Product[]) => { setCatalog(products); setItems(previous => validateCart({ version: 1, items: previous }, products)); };
  return <CartContext.Provider value={{ items, catalog, totals: getCartTotals(items, catalog), itemCount: items.reduce((count, item) => count + item.quantity, 0), addItem,
    updateItem: (key, quantity) => { setItems(previous => previous.map(item => { if (item.key !== key) return item; const product = findProduct(item.productId, catalog), variant = product && findVariant(product, item.variantId); return variant && validProductQuantity(quantity, variant) ? { ...item, quantity } : item; })); },
    removeItem: key => setItems(previous => previous.filter(item => item.key !== key)), clearCart: () => setItems([]), replaceCatalog }}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error('CartProvider is required.'); return value; }
