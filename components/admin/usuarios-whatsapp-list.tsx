'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaWhatsapp } from 'react-icons/fa'
import { Loader2, Plus, RefreshCw, Search, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

interface UsuarioWpp {
  id: number
  nome: string
  email: string
  role: string
  loja_ids: number[]
  instance: string | null
  connection_state: 'open' | 'close' | 'connecting' | 'not_configured' | 'unknown'
}

const stateLabel: Record<string, { label: string; color: string; dot: string }> = {
  open:           { label: 'Conectado',           color: 'text-emerald-700 bg-emerald-100', dot: 'bg-emerald-500' },
  close:          { label: 'Desconectado',         color: 'text-amber-700 bg-amber-100',    dot: 'bg-amber-400' },
  connecting:     { label: 'Conectando…',          color: 'text-amber-700 bg-amber-100',    dot: 'bg-amber-400' },
  not_configured: { label: 'Não configurado',      color: 'text-slate-600 bg-slate-100',    dot: 'bg-slate-400' },
  unknown:        { label: 'Verificando…',         color: 'text-slate-600 bg-slate-100',    dot: 'bg-slate-400' },
}

export function UsuariosWhatsAppList() {
  const [usuarios, setUsuarios] = useState<UsuarioWpp[]>([])
  const [filtered, setFiltered] = useState<UsuarioWpp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState<number | null>(null)

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      const data = await res.json()
      if (data.success) {
        setUsuarios(data.usuarios)
        setFiltered(data.usuarios)
      }
    } catch {
      toast.error('Erro ao carregar usuários.')
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
            u.email.toLowerCase().includes(q)
          )
        : usuarios
    )
  }, [search, usuarios])

  const handleCreate = async (userId: number) => {
    setCreating(userId)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/whatsapp/create`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao criar instância.')
        return
      }
      toast.success(`Instância ${data.instance} criada!`)
      await fetchUsuarios()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCreating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca + refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsuarios}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-600">Usuário</th>
              <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Perfil</th>
              <th className="px-4 py-3 font-semibold text-slate-600">WhatsApp</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Instância</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : filtered.map(u => {
              const st = stateLabel[u.connection_state] ?? stateLabel.unknown
              const isCreating = creating === u.id

              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  {/* Usuário */}
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

                  {/* Perfil */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === 'administrator'
                        ? 'bg-[#16255c]/10 text-[#16255c]'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role === 'administrator' ? 'Admin' : 'Loja'}
                    </span>
                  </td>

                  {/* Status WhatsApp */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${
                        u.connection_state === 'open' ? 'animate-pulse' : ''
                      }`} />
                      {st.label}
                    </span>
                  </td>

                  {/* Instância */}
                  <td className="px-4 py-3">
                    {u.instance ? (
                      <div className="flex items-center gap-1.5">
                        <FaWhatsapp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <code className="text-xs font-mono text-slate-600 truncate max-w-[140px]">
                          {u.instance}
                        </code>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Ação */}
                  <td className="px-4 py-3 text-right">
                    {!u.instance ? (
                      <Button
                        size="sm"
                        onClick={() => handleCreate(u.id)}
                        disabled={isCreating}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {isCreating
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                        Criar Instância
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Configurado</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length} usuário{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}.
      </p>
    </div>
  )
}
