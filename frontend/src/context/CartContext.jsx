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

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(itemId)
    }
    const res = await api.patch(`/cart/items/${itemId}`, { quantity })
    if (res.data) {
      setCart(res.data)
    }
    return res.data
  }

  const removeFromCart = async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`)
    if (res.data) {
      setCart(res.data)
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
