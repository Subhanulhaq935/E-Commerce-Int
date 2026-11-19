import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = async () => {
    if (!user || user.role === 'admin') {
      setCart(null)
      return
    }
    try {
      setLoading(true)
      const res = await api.get('/cart/')
      setCart(res.data)
    } catch (err) {
      console.error('Failed to fetch cart:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [user])

  // Direct fast state updates from backend response (no redundant second GET roundtrip)
  const addToCart = async (productId, quantity = 1) => {
    const res = await api.post('/cart/items', {
      product_id: productId,
      quantity,
    })
    if (res.data) {
      setCart(res.data)
    }
    return res.data
  }

  // Optimistic Instant Quantity Update (0ms UI feedback + background sync)
  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(itemId)
    }

    const previousCart = cart

    // 1. Instant local memory update (0ms UI feedback)
    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart
      const updatedItems = prevCart.items.map((it) => {
        if (it.id === itemId) {
          const subtotal = Number(it.unit_price) * quantity
          return { ...it, quantity, subtotal }
        }
        return it
      })
      const newTotal = updatedItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      return {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
      }
    })

    // 2. Background sync with backend
    try {
      const res = await api.patch(`/cart/items/${itemId}`, { quantity })
      if (res.data) {
        setCart(res.data)
      }
      return res.data
    } catch (err) {
      // Revert if rejected by backend (e.g. stock exceeded)
      setCart(previousCart)
      throw err
    }
  }

  // Optimistic Instant Remove (0ms UI removal + background sync)
  const removeFromCart = async (itemId) => {
    const previousCart = cart

    // 1. Instant local removal (0ms UI feedback)
    setCart((prevCart) => {
      if (!prevCart || !prevCart.items) return prevCart
      const updatedItems = prevCart.items.filter((it) => it.id !== itemId)
      const newTotal = updatedItems.reduce(
        (sum, it) => sum + Number(it.unit_price) * it.quantity,
        0
      )
      return {
        ...prevCart,
        items: updatedItems,
        total: newTotal,
      }
    })

    // 2. Background sync with backend
    try {
      const res = await api.delete(`/cart/items/${itemId}`)
      if (res.data) {
        setCart(res.data)
      }
    } catch (err) {
      setCart(previousCart)
      throw err
    }
  }

  const clearCartState = () => {
    setCart(null)
  }

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
