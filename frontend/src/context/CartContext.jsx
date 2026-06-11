import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (listing, qty = 100) => {
    setCart(prev => {
      const ex = prev.find(i => i.listing._id === listing._id);
      if (ex) return prev.map(i =>
        i.listing._id === listing._id
          ? { ...i, quantity: Math.min(i.quantity + qty, listing.quantityLitres) }
          : i
      );
      return [...prev, { listing, quantity: qty }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.listing._id === id ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.listing._id !== id));
  const clearCart      = ()    => setCart([]);

  const total     = cart.reduce((s, i) => s + i.quantity * i.listing.pricePerLitre, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
