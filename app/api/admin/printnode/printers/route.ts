import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAppUser } from '@/lib/admin-access'
import { fetchPrintNodePrinters, getPrintNodeConfig } from '@/lib/printnode'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!isAdminAppUser(user)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const cfg = await getPrintNodeConfig()
    if (!cfg.apiKey) {
      return NextResponse.json({ error: 'API key do PrintNode nao configurada.' }, { status: 400 })
    }

    const printers = await fetchPrintNodePrinters(cfg.apiKey)
    return NextResponse.json({
      printers: printers.map((p) => ({
        id: p.id,
        name: p.name ?? p.description ?? `Printer ${p.id}`,
        computerName: p.computer?.name ?? null,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar impressoras.' },
      { status: 500 }
    )
  }
}
