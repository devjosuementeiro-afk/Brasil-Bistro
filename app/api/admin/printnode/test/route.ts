import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAppUser } from '@/lib/admin-access'
import { createPrintNodeRawJob, getPrintNodeConfig } from '@/lib/printnode'

type TestBody = {
  printerId?: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!isAdminAppUser(user)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as TestBody
    const cfg = await getPrintNodeConfig()
    if (!cfg.apiKey) {
      return NextResponse.json({ error: 'API key do PrintNode nao configurada.' }, { status: 400 })
    }

    const printerIdRaw = Number(body.printerId ?? cfg.printerId ?? 0)
    if (!Number.isFinite(printerIdRaw) || printerIdRaw <= 0) {
      return NextResponse.json({ error: 'printerId invalido.' }, { status: 400 })
    }

    const text = [
      'BRASIL BISTRO',
      'Teste de impressao PrintNode',
      '------------------------------',
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      `Admin: ${user?.email ?? '-'}`,
      'Configuracao valida!',
      '\n\n\n',
    ].join('\n')

    const printJobId = await createPrintNodeRawJob({
      apiKey: cfg.apiKey,
      printerId: Math.floor(printerIdRaw),
      title: 'Teste PrintNode - Brasil Bistro',
      content: text,
      source: 'Brasil Bistro Admin',
      idempotencyKey: `printnode-test-${Date.now()}`,
    })

    return NextResponse.json({ ok: true, printJobId })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha no teste de impressao.' },
      { status: 500 }
    )
  }
}
