'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface ItemCardapio {
  id: string
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  categoria_id: string | null
  quantidade_info?: string | null
  tamanhos_disponiveis?: string | null
  ingredientes_info?: string | null
  alergenicos_alerta?: string | null
}

export interface SelectedOption {
  optionId: string
  groupType: 'size' | 'quantity' | 'extra'
  /** Nome do grupo no cardápio (ex.: Sabor, Complemento) — usado em extras */
  groupName?: string
  label: string
  priceDelta: number
  info?: string | null
}

type AddItemMeta =
  | string
  | {
      observation?: string
      selectedOptions?: SelectedOption[]
      unitPrice?: number
    }

export interface CartItem {
  cartItemId: string
  item: ItemCardapio
  quantity: number
  observation: string
  selectedOptions: SelectedOption[]
  unitPrice: number
  optionSignature: string
  totalPrice: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: ItemCardapio, quantity: number, meta?: AddItemMeta) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: ItemCardapio, quantity: number, meta?: AddItemMeta) => {
    const observation =
      typeof meta === 'string' ? meta : (meta?.observation ?? '')
    const selectedOptions =
      typeof meta === 'string' ? [] : (meta?.selectedOptions ?? [])
    const unitPrice =
      typeof meta === 'string'
        ? item.preco
        : (meta?.unitPrice ?? item.preco)

    const normalizedObservation = observation.trim()
    const optionSignature = selectedOptions
      .map((opt) => opt.optionId)
      .sort()
      .join('|')

    setItems((prev) => {
      const existing = prev.find(
        (ci) =>
          ci.item.id === item.id &&
          ci.observation.trim().toLowerCase() === normalizedObservation.toLowerCase() &&
          ci.optionSignature === optionSignature
      )
      if (existing) {
        return prev.map((ci) =>
          ci.cartItemId === existing.cartItemId
            ? {
                ...ci,
                quantity: ci.quantity + quantity,
                totalPrice: (ci.quantity + quantity) * ci.unitPrice,
              }
            : ci
        )
      }
      return [
        ...prev,
        {
          cartItemId: crypto.randomUUID(),
          item,
          quantity,
          observation: normalizedObservation,
          selectedOptions,
          unitPrice,
          optionSignature,
          totalPrice: unitPrice * quantity,
        },
      ]
    })
  }, [])

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId))
  }, [])

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(cartItemId)
        return
      }
      setItems((prev) =>
        prev.map((ci) =>
          ci.cartItemId === cartItemId
            ? { ...ci, quantity, totalPrice: ci.unitPrice * quantity }
            : ci
        )
      )
    },
    [removeItem]
  )

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((acc, ci) => acc + ci.quantity, 0)
  const totalPrice = items.reduce((acc, ci) => acc + ci.totalPrice, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
