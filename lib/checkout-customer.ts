export const CHECKOUT_STORAGE_KEY = 'nmfc-checkout-v1'

export type FulfillmentType = 'take_out' | 'delivery'

export type CheckoutCustomer = {
  nome: string
  email: string
  telefone: string
  userId: string | null
  fulfillmentType: FulfillmentType
  enderecoEntrega: string
  aceitaSmsAtualizacoes: boolean
  aceitaEmailAtualizacoes: boolean
  prefereSalvarCartao: boolean
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

function readBool(v: unknown, fallback = false): boolean {
  if (v === true || v === 'true') return true
  if (v === false || v === 'false') return false
  return fallback
}

export function isValidCheckoutCustomer(c: CheckoutCustomer | null): boolean {
  if (!c) return false
  const nome = c.nome.trim()
  const email = c.email.trim()
  const tel = normalizePhone(c.telefone)
  if (nome.length < 2) return false
  if (!email.includes('@') || email.length < 5) return false
  if (tel.length < 8) return false
  if (c.fulfillmentType !== 'take_out' && c.fulfillmentType !== 'delivery') return false
  if (c.fulfillmentType === 'delivery' && c.enderecoEntrega.trim().length < 6) return false
  return true
}

export function loadCheckoutCustomer(): CheckoutCustomer | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<CheckoutCustomer>
    if (typeof p.nome !== 'string' || typeof p.email !== 'string' || typeof p.telefone !== 'string') {
      return null
    }
    return {
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      userId: typeof p.userId === 'string' ? p.userId : null,
      fulfillmentType: p.fulfillmentType === 'delivery' ? 'delivery' : 'take_out',
      enderecoEntrega: typeof p.enderecoEntrega === 'string' ? p.enderecoEntrega : '',
      aceitaSmsAtualizacoes: readBool(p.aceitaSmsAtualizacoes),
      aceitaEmailAtualizacoes: readBool(p.aceitaEmailAtualizacoes),
      prefereSalvarCartao: readBool(p.prefereSalvarCartao),
    }
  } catch {
    return null
  }
}

export function saveCheckoutCustomer(c: CheckoutCustomer): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(c))
}

export function clearCheckoutCustomer(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CHECKOUT_STORAGE_KEY)
}

export type CustomerPayload = {
  nome: string
  email: string
  telefone: string
  userId: string | null
  fulfillmentType: FulfillmentType
  enderecoEntrega: string | null
  aceitaSmsAtualizacoes: boolean
  aceitaEmailAtualizacoes: boolean
  consentiuSalvarCartao: boolean
}

/** Validação compartilhada (API + cliente). */
export function parseCustomerPayload(
  input: unknown
): { ok: true; customer: CustomerPayload } | { ok: false; message: string } {
  const c = input as Record<string, unknown> | null
  if (!c) return { ok: false, message: 'Dados do cliente obrigatórios.' }

  const nome = String(c.nome ?? '').trim()
  const email = String(c.email ?? '').trim().toLowerCase()
  const telefone = normalizePhone(String(c.telefone ?? ''))
  const rawUid = c.userId
  const userId =
    rawUid === null || rawUid === undefined || rawUid === ''
      ? null
      : String(rawUid)
  const fulfillmentType = c.fulfillmentType === 'delivery' ? 'delivery' : 'take_out'
  const enderecoEntregaRaw = String(c.enderecoEntrega ?? '').trim()
  const enderecoEntrega = fulfillmentType === 'delivery' ? enderecoEntregaRaw : null

  const aceitaSmsAtualizacoes = readBool(c.aceitaSmsAtualizacoes)
  const aceitaEmailAtualizacoes = readBool(c.aceitaEmailAtualizacoes)
  const consentiuSalvarCartao = readBool(c.consentiuSalvarCartao)

  if (nome.length < 2) return { ok: false, message: 'Nome inválido.' }
  if (!email.includes('@') || email.length < 5) return { ok: false, message: 'E-mail inválido.' }
  if (telefone.length < 8) return { ok: false, message: 'Telefone inválido.' }
  if (fulfillmentType === 'delivery' && enderecoEntregaRaw.length < 6) {
    return { ok: false, message: 'Endereço de entrega inválido.' }
  }

  return {
    ok: true,
    customer: {
      nome,
      email,
      telefone,
      userId,
      fulfillmentType,
      enderecoEntrega,
      aceitaSmsAtualizacoes,
      aceitaEmailAtualizacoes,
      consentiuSalvarCartao,
    },
  }
}
