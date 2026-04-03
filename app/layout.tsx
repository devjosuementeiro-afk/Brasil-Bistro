import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import { LangProvider } from '@/lib/lang-context'
import { BottomNav } from '@/components/bottom-nav'
import './globals.css'

const fontBrand = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-brand',
  display: 'swap',
})

const fontBody = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Brasil Bistro',
  description: 'Cardápio digital — cozinha brasileira contemporânea.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className={`${fontBody.variable} ${fontBrand.variable} font-sans antialiased`}>
        <LangProvider>
          <CartProvider>
            {children}
            <BottomNav />
          </CartProvider>
        </LangProvider>
        <Analytics />
      </body>
    </html>
  )
}
