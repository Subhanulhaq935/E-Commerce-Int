import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const updateTimers = useRef(new Map())

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

  // Lightning-fast debounced quantity update (0ms UI reaction on every click + single debounced network call)
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      if (updateTimers.current.has(itemId)) {
        clearTimeout(updateTimers.current.get(itemId))
        updateTimers.current.delete(itemId)
      }
      return removeFromCart(itemId)
    }

    // 1. INSTANT (0ms) screen update on EVERY single click!
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

    // 2. Debounce the network request by 350ms so rapid clicks are unified
    if (updateTimers.current.has(itemId)) {
      clearTimeout(updateTimers.current.get(itemId))
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        updateTimers.current.delete(itemId)
        try {
          const res = await api.patch(`/cart/items/${itemId}`, { quantity })
          if (res.data) {
            setCart(res.data)
          }
          resolve(res.data)
        } catch (err) {
          // If rejected (e.g. stock exceeded or 404), fetch fresh server state
          const fresh = await api.get('/cart/').catch(() => null)
          if (fresh?.data) {
            setCart(fresh.data)
          }
          resolve(null)
        }
      }, 350)

      updateTimers.current.set(itemId, timer)
    })
  }

  // Optimistic Instant Remove (Never resurrects deleted items)
  const removeFromCart = async (itemId) => {
    if (updateTimers.current.has(itemId)) {
      clearTimeout(updateTimers.current.get(itemId))
      updateTimers.current.delete(itemId)
    }

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
      if (err.response?.status === 404) {
        return // Already deleted on server
      }
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
