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

  // Optimistic Instant Quantity Update
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
      // If item was already deleted on server, ensure it stays removed (never resurrect!)
      if (err.response?.status === 404) {
        setCart((prevCart) => {
          if (!prevCart || !prevCart.items) return prevCart
          const updatedItems = prevCart.items.filter((it) => it.id !== itemId)
          return {
            ...prevCart,
            items: updatedItems,
            total: updatedItems.reduce((sum, it) => sum + Number(it.unit_price) * it.quantity, 0),
          }
        })
        return
      }
      // Revert only if real validation error (e.g. stock exceeded)
      setCart(previousCart)
      throw err
    }
  }

  // Optimistic Instant Remove (Never resurrects deleted items)
  const removeFromCart = async (itemId) => {
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
      // If 404, item is already removed on server — keep it removed!
      if (err.response?.status === 404) {
        return
      }
      // If other network error, silently re-fetch to ensure sync
      console.error('Error removing item from server:', err)
      const fresh = await api.get('/cart/').catch(() => null)
      if (fresh?.data) setCart(fresh.data)
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
