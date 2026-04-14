import { createAdminClient } from '@/lib/supabase/admin'

const PRINTNODE_API_BASE = 'https://api.printnode.com'

export type PrintNodeConfig = {
  enabled: boolean
  apiKey: string
  printerId: number | null
}

export async function getPrintNodeConfig(): Promise<PrintNodeConfig> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('configuracoes_loja')
    .select('printnode_ativo, printnode_api_key, printnode_printer_id')
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle<{
      printnode_ativo?: boolean | null
      printnode_api_key?: string | null
      printnode_printer_id?: number | null
    }>()

  const envKey = String(process.env.PRINTNODE_API_KEY ?? '').trim()
  const dbKey = String(data?.printnode_api_key ?? '').trim()
  const apiKey = dbKey || envKey
  const printerRaw = Number(data?.printnode_printer_id ?? 0)
  const printerId = Number.isFinite(printerRaw) && printerRaw > 0 ? Math.floor(printerRaw) : null

  return {
    enabled: Boolean(data?.printnode_ativo) && Boolean(apiKey) && printerId != null,
    apiKey,
    printerId,
  }
}

function toBasicAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
}

export async function fetchPrintNodePrinters(apiKey: string) {
  const response = await fetch(`${PRINTNODE_API_BASE}/printers`, {
    method: 'GET',
    headers: {
      Authorization: toBasicAuthHeader(apiKey),
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`PrintNode printers failed: ${response.status} ${body}`)
  }

  return (await response.json()) as Array<{
    id: number
    name?: string
    description?: string
    computer?: { id?: number; name?: string }
  }>
}

export async function createPrintNodeRawJob(input: {
  apiKey: string
  printerId: number
  title: string
  content: string
  source?: string
  idempotencyKey?: string
}) {
  const response = await fetch(`${PRINTNODE_API_BASE}/printjobs`, {
    method: 'POST',
    headers: {
      Authorization: toBasicAuthHeader(input.apiKey),
      'Content-Type': 'application/json',
      ...(input.idempotencyKey ? { 'X-Idempotency-Key': input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      printerId: input.printerId,
      title: input.title,
      contentType: 'raw_base64',
      content: Buffer.from(input.content, 'utf8').toString('base64'),
      source: input.source ?? 'Brasil Bistro',
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`PrintNode printjobs failed: ${response.status} ${body}`)
  }

  const body = await response.text()
  const id = Number(body)
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`PrintNode returned invalid print job id: ${body}`)
  }
  return id
}

export function buildKitchenReceiptText(input: {
  orderNumber: string
  createdAtISO: string
  customerName: string
  customerPhone: string
  fulfillmentType: 'take_out' | 'delivery'
  address?: string | null
  items: Array<{
    name: string
    quantity: number
    unitAmount: number
    subtotal: number
    observation?: string
    options?: Array<{ label: string; groupName?: string; groupType: 'size' | 'quantity' | 'extra' }>
  }>
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  currency: string
}) {
  const lines: string[] = []
  lines.push('BRASIL BISTRO')
  lines.push('PEDIDO CONFIRMADO')
  lines.push('------------------------------')
  lines.push(`Pedido: #${input.orderNumber}`)
  lines.push(`Data: ${new Date(input.createdAtISO).toLocaleString('pt-BR')}`)
  lines.push(`Cliente: ${input.customerName}`)
  lines.push(`Telefone: ${input.customerPhone}`)
  lines.push(
    `Atendimento: ${input.fulfillmentType === 'delivery' ? 'DELIVERY' : 'RETIRADA'}`
  )
  if (input.fulfillmentType === 'delivery' && input.address?.trim()) {
    lines.push(`Endereco: ${input.address.trim()}`)
  }
  lines.push('------------------------------')

  for (const item of input.items) {
    lines.push(`${item.quantity}x ${item.name}`)
    lines.push(
      `  ${input.currency}${item.unitAmount.toFixed(2)}  ->  ${input.currency}${item.subtotal.toFixed(2)}`
    )
    if (item.options?.length) {
      for (const op of item.options) {
        const label = op.groupType === 'extra' && op.groupName ? `${op.groupName}: ${op.label}` : op.label
        lines.push(`  - ${label}`)
      }
    }
    if (item.observation?.trim()) {
      lines.push(`  Obs: ${item.observation.trim()}`)
    }
  }

  lines.push('------------------------------')
  lines.push(`Subtotal: ${input.currency}${input.subtotal.toFixed(2)}`)
  if (input.discount > 0) lines.push(`Desconto: -${input.currency}${input.discount.toFixed(2)}`)
  if (input.deliveryFee > 0) lines.push(`Entrega: ${input.currency}${input.deliveryFee.toFixed(2)}`)
  lines.push(`TOTAL: ${input.currency}${input.total.toFixed(2)}`)
  lines.push('------------------------------')
  lines.push('Fim do pedido')
  lines.push('\n\n\n')
  return lines.join('\n')
}
