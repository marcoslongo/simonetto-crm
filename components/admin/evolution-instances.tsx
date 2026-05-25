'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, RefreshCw, Trash2, Search, UserCircle } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { toast } from 'sonner'

interface UsuarioWpp {
  id: number
  nome: string
  email: string
  role: string
  instance: string | null
  connection_state: string
}

const stateStyle: Record<string, string> = {
  open:           'text-emerald-700 bg-emerald-100',
  connected:      'text-emerald-700 bg-emerald-100',
  close:          'text-amber-700 bg-amber-100',
  connecting:     'text-amber-700 bg-amber-100',
  not_configured: 'text-slate-600 bg-slate-100',
  unknown:        'text-slate-600 bg-slate-100',
}

const stateLabel: Record<string, string> = {
  open:           'Conectado',
  connected:      'Conectado',
  close:          'Desconectado',
  connecting:     'Conectando…',
  not_configured: 'Não conf.',
  unknown:        'Verificando…',
}

const stateDot: Record<string, string> = {
  open:      'bg-emerald-500 animate-pulse',
  connected: 'bg-emerald-500 animate-pulse',
}

export function EvolutionInstances() {
  const [usuarios, setUsuarios] = useState<UsuarioWpp[]>([])
  const [filtered, setFiltered] = useState<UsuarioWpp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/evolution/instances?t=${Date.now()}`)
      if (res.status === 401) { window.location.href = '/login'; return }
      const data = await res.json()
      if (data.success) {
        const list: UsuarioWpp[] = Array.isArray(data.usuarios) ? data.usuarios : []
        setUsuarios(list)
        setFiltered(list)
      } else {
        toast.error(data.mensagem ?? 'Erro ao carregar instâncias.')
      }
    } catch {
      toast.error('Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? usuarios.filter(u =>
            u.nome.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.instance ?? '').toLowerCase().includes(q)
          )
        : usuarios
    )
  }, [search, usuarios])

  const handleDelete = async (u: UsuarioWpp) => {
    if (!u.instance) return
    if (!confirm(`Excluir instância "${u.instance}" de ${u.nome}? Esta ação desconecta o WhatsApp e remove a instância do servidor.`)) return
    setDeleting(u.instance)
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}/whatsapp/delete`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.mensagem ?? 'Erro ao excluir instância.')
        return
      }
      toast.success(`Instância "${u.instance}" excluída.`)
      // Atualiza estado local imediatamente (WP pode retornar cache na próxima leitura)
      const semInstancia = (u: UsuarioWpp) => ({ ...u, instance: null, connection_state: 'not_configured' })
      setUsuarios(prev => prev.map(x => x.id === u.id ? semInstancia(x) : x))
      setFiltered(prev => prev.map(x => x.id === u.id ? semInstancia(x) : x))
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setDeleting(null)
    }
  }

  const withInstance = filtered.filter(u => u.instance)

  return (
    <div className="rounded-xl border shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-sm font-semibold">Instâncias configuradas</p>
          <p className="text-xs text-muted-foreground">Usuários com instância WhatsApp ativa no servidor Evolution</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsuarios} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar por nome, e-mail ou instância…"
            className="pl-9 bg-white"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : withInstance.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">
            {usuarios.filter(u => u.instance).length === 0
              ? 'Nenhum usuário possui instância configurada.'
              : 'Nenhuma instância corresponde à busca.'}
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Usuário</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Instância</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withInstance.map(u => {
                  const rawState = (u.connection_state ?? 'unknown').toLowerCase()
                  const style = stateStyle[rawState] ?? stateStyle.unknown
                  const label = stateLabel[rawState] ?? rawState
                  const dot = stateDot[rawState] ?? 'bg-amber-400'
                  const isDeleting = deleting === u.instance

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#16255c]/10 flex items-center justify-center shrink-0">
                            <UserCircle className="h-5 w-5 text-[#16255c]" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{u.nome}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <FaWhatsapp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <code className="text-xs font-mono text-slate-700">{u.instance}</code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u)}
                          disabled={isDeleting || !!deleting}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {isDeleting
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t bg-slate-50">
              <p className="text-xs text-slate-400">
                {withInstance.length} instância{withInstance.length !== 1 ? 's' : ''} configurada{withInstance.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
