import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Noxus - Lead Ops',
  description: 'Sistema de gestão de leads para múltiplas unidades',
  icons: {
    icon: [
      {
        url: '/icon-dark.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-light.ico',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon-dark.ico',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Toaster />
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  )
}
