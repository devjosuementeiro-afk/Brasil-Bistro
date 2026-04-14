import { NextResponse } from 'next/server'
import { getDeliveryFeeAmount } from '@/lib/store-settings'

export async function GET() {
  try {
    const deliveryFee = await getDeliveryFeeAmount()
    return NextResponse.json({ deliveryFee })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao carregar configuração do checkout.',
      },
      { status: 500 }
    )
  }
}
