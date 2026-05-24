'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Settings } from 'lucide-react'
import Link from 'next/link'
import { FaWhatsapp } from 'react-icons/fa'

interface WhatsAppSetupBannerProps {
  lojaId: number
  isAdmin?: boolean
}

export function WhatsAppSetupBanner({ lojaId, isAdmin = false }: WhatsAppSetupBannerProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    fetch(`/api/lojas/${lojaId}/whatsapp/status`)
      .then(r => r.json())
      .then(data => {
        if (data.state === 'not_configured' || data.state === 'close' || data.state === 'error') {
          setShow(true)
        }
      })
      .catch(() => {})
  }, [lojaId])

  if (!show) return null

  const configUrl = isAdmin
    ? `/admin/lojas/${lojaId}?tab=configuracoes`
    : `/configuracoes`

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <div className="shrink-0 bg-amber-100 p-1.5 rounded-lg">
        <FaWhatsapp className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-amber-800">WhatsApp não conectado.</span>
        <span className="text-amber-700 ml-1">
          Configure o WhatsApp da unidade para receber e enviar mensagens.
        </span>
      </div>
      <Link
        href={configUrl}
        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Settings className="h-3.5 w-3.5" />
        Configurar
      </Link>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label="Fechar"
      >
        <AlertTriangle className="h-4 w-4 sr-only" />
        <span className="text-lg leading-none">&times;</span>
      </button>
    </div>
  )
}
