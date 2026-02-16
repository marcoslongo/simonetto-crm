import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Mail, Hash, Building2 } from 'lucide-react'
import type { Loja } from '@/lib/types'

interface LojaInfoCardProps {
  loja: Loja
}

export function LojaInfoCard({ loja }: LojaInfoCardProps) {
  return (
    <Card className="border-0 shadow-lg bg-linear-to-br from-slate-50 to-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#16255c] flex items-center gap-3">
          <div className="bg-[#16255c] p-2.5 rounded-xl shadow-md">
            <Building2 className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          Informações da Loja
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Nome */}
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
          <div className="bg-[#16255c]/10 p-2 rounded-lg">
            <Building2 className="h-5 w-5 text-[#16255c]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Nome da Loja
            </p>
            <p className="text-lg font-bold text-[#16255c]">
              {loja.nome}
            </p>
          </div>
        </div>

        {/* Localização */}
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
          <div className="bg-[#16255c]/10 p-2 rounded-lg">
            <MapPin className="h-5 w-5 text-[#16255c]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Localização
            </p>
            <p className="text-base font-semibold text-[#16255c]">
              {loja.cidade} / {loja.estado}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {loja.localizacao}
            </p>
          </div>
        </div>

        {/* ID */}
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
          <div className="bg-[#16255c]/10 p-2 rounded-lg">
            <Hash className="h-5 w-5 text-[#16255c]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              ID da Loja
            </p>
            <p className="text-base font-mono font-bold text-[#16255c]">
              {loja.id}
            </p>
          </div>
        </div>

        {/* Emails */}
        {loja.emails && loja.emails.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
            <div className="bg-[#16255c]/10 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-[#16255c]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                E-mails de Contato
              </p>

              <div className="space-y-2">
                {loja.emails.map((emailObj, index) => (
                  <a
                    key={index}
                    href={`mailto:${emailObj.email}`}
                    className="flex items-center gap-2 text-sm text-[#16255c] hover:opacity-80 hover:underline transition"
                  >
                    <span className="w-1.5 h-1.5 bg-[#16255c] rounded-full" />
                    {emailObj.email}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}