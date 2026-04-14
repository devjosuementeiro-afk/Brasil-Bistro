'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { PromotionComputeResult } from '@/lib/promotions-compute'

const CART_STORAGE_KEY = 'brasil-bistro-cart-v2'

export interface ItemCardapio {
  id: string
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  categoria_id: string | null
  comboId?: string | null
  isCombo?: boolean
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

function safeParseCartItems(parsed: unknown): CartItem[] {
  if (!Array.isArray(parsed)) return []
  const result: CartItem[] = []
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const ci = entry as Partial<CartItem>
    const item = ci.item
    if (!item || typeof item !== 'object') continue
    const ic = item as Partial<ItemCardapio>
    if (typeof ic.id !== 'string' || typeof ic.nome !== 'string' || typeof ic.preco !== 'number') continue
    if (typeof ci.cartItemId !== 'string' || typeof ci.quantity !== 'number' || ci.quantity < 1) continue
    const unitPrice = typeof ci.unitPrice === 'number' && Number.isFinite(ci.unitPrice) ? ci.unitPrice : ic.preco
    const observation = typeof ci.observation === 'string' ? ci.observation : ''
    const selectedOptions = Array.isArray(ci.selectedOptions) ? (ci.selectedOptions as SelectedOption[]) : []
    const optionSignature =
      typeof ci.optionSignature === 'string'
        ? ci.optionSignature
        : selectedOptions
            .map((opt) => opt.optionId)
            .sort()
            .join('|')
    const qty = Math.floor(ci.quantity)
    result.push({
      cartItemId: ci.cartItemId,
      item: item as ItemCardapio,
      quantity: qty,
      observation,
      selectedOptions,
      unitPrice,
      optionSignature,
      totalPrice: unitPrice * qty,
    })
  }
  return result
}

function loadCartFromStorage(): { items: CartItem[]; promoCode: string } {
  if (typeof window === 'undefined') return { items: [], promoCode: '' }
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      const legacy = localStorage.getItem('brasil-bistro-cart-v1')
      if (!legacy) return { items: [], promoCode: '' }
      const data = JSON.parse(legacy) as unknown
      const items =
        data && typeof data === 'object' && 'items' in data
          ? safeParseCartItems((data as { items?: unknown }).items)
          : safeParseCartItems(data)
      return { items, promoCode: '' }
    }
    const data = JSON.parse(raw) as unknown
    if (data && typeof data === 'object' && 'v' in data && (data as { v: number }).v === 2) {
      const d = data as { items?: unknown; promoCode?: unknown }
      return {
        items: safeParseCartItems(d.items),
        promoCode: typeof d.promoCode === 'string' ? d.promoCode : '',
      }
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return {
        items: safeParseCartItems((data as { items?: unknown }).items),
        promoCode: '',
      }
    }
    return { items: safeParseCartItems(data), promoCode: '' }
  } catch {
    return { items: [], promoCode: '' }
  }
}

function saveCartToStorage(items: CartItem[], promoCode: string) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ v: 2, items, promoCode }))
  } catch {
    /* quota / private mode */
  }
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: ItemCardapio, quantity: number, meta?: AddItemMeta) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  promoCode: string
  setPromoCode: (code: string) => void
  promotionResult: PromotionComputeResult | null
  promotionLoading: boolean
  promotionError: string | null
  /** Subtotal (soma das linhas); igual a totalPrice do carrinho. */
  subtotalBeforePromo: number
  /** Total a pagar após promoções (servidor é a fonte da verdade no checkout). */
  totalWithPromotion: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [promoCode, setPromoCodeState] = useState('')
  const [promotionResult, setPromotionResult] = useState<PromotionComputeResult | null>(null)
  const [promotionLoading, setPromotionLoading] = useState(false)
  const [promotionError, setPromotionError] = useState<string | null>(null)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    const { items: loaded, promoCode: code } = loadCartFromStorage()
    setItems(loaded)
    setPromoCodeState(code)
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    saveCartToStorage(items, promoCode)
  }, [items, promoCode, storageReady])

  useEffect(() => {
    if (!storageReady) return
    if (items.length === 0) {
      setPromotionResult(null)
      setPromotionLoading(false)
      setPromotionError(null)
      return
    }
    const ac = new AbortController()
    setPromotionLoading(true)
    setPromotionError(null)
    const payload = {
      items: items.map((ci) => ({
        item: { id: ci.item.id, categoria_id: ci.item.categoria_id },
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        totalPrice: ci.totalPrice,
      })),
      promoCode: promoCode.trim() || null,
    }
    fetch('/api/promotions/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ac.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as PromotionComputeResult & { error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Promoções indisponíveis.')
        setPromotionResult(data)
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return
        setPromotionResult(null)
        setPromotionError(e instanceof Error ? e.message : 'Erro ao calcular promoções.')
      })
      .finally(() => {
        if (!ac.signal.aborted) setPromotionLoading(false)
      })
    return () => ac.abort()
  }, [items, promoCode, storageReady])

  const setPromoCode = useCallback((code: string) => {
    setPromoCodeState(code)
  }, [])

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

  const clearCart = useCallback(() => {
    setItems([])
    setPromoCodeState('')
  }, [])

  const totalItems = items.reduce((acc, ci) => acc + ci.quantity, 0)
  const totalPrice = items.reduce((acc, ci) => acc + ci.totalPrice, 0)
  const subtotalBeforePromo = promotionResult?.subtotal ?? totalPrice
  const totalWithPromotion = promotionResult?.totalPayable ?? totalPrice

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        promoCode,
        setPromoCode,
        promotionResult,
        promotionLoading,
        promotionError,
        subtotalBeforePromo,
        totalWithPromotion,
      }}
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
