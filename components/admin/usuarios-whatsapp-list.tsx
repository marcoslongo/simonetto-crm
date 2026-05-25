'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FaWhatsapp } from 'react-icons/fa'
import { Loader2, Pencil, Plus, RefreshCw, Search, Trash2, UserCircle, Zap, Eraser } from 'lucide-react'
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
  open:           { label: 'Conectado',      color: 'text-emerald-700 bg-emerald-100', dot: 'bg-emerald-500' },
  close:          { label: 'Desconectado',   color: 'text-amber-700 bg-amber-100',    dot: 'bg-amber-400' },
  connecting:     { label: 'Conectando…',    color: 'text-amber-700 bg-amber-100',    dot: 'bg-amber-400' },
  not_configured: { label: 'Não conf.',      color: 'text-slate-600 bg-slate-100',    dot: 'bg-slate-400' },
  unknown:        { label: 'Verificando…',   color: 'text-slate-600 bg-slate-100',    dot: 'bg-slate-400' },
}

interface DialogState {
  open: boolean
  usuario: UsuarioWpp | null
}

export function UsuariosWhatsAppList() {
  const [usuarios, setUsuarios] = useState<UsuarioWpp[]>([])
  const [filtered, setFiltered] = useState<UsuarioWpp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<DialogState>({ open: false, usuario: null })

  // Auto-create state
  const [autoCreating, setAutoCreating] = useState(false)
  const [autoError, setAutoError] = useState<string | null>(null)

  // Manual assign state
  const [manualInstance, setManualInstance] = useState('')
  const [manualKey, setManualKey] = useState('')
  const [manualSaving, setManualSaving] = useState(false)

  // Delete state
  const [deleting, setDeleting] = useState(false)

  // Clear all state
  const [clearingAll, setClearingAll] = useState(false)

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      if (res.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/usuarios'
        return
      }
      const data = await res.json()
      if (data.success) {
        setUsuarios(data.usuarios)
        setFiltered(data.usuarios)
      } else {
        toast.error(data.mensagem ?? 'Erro ao carregar usuários.')
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

  const openDialog = (usuario: UsuarioWpp) => {
    setDialog({ open: true, usuario })
    setAutoError(null)
    setManualInstance(usuario.instance ?? '')
    setManualKey('')
  }

  const closeDialog = () => {
    setDialog({ open: false, usuario: null })
    setAutoError(null)
    setManualInstance('')
    setManualKey('')
  }

  const handleAutoCreate = async () => {
    if (!dialog.usuario) return
    setAutoCreating(true)
    setAutoError(null)
    try {
      const res = await fetch(`/api/admin/usuarios/${dialog.usuario.id}/whatsapp/create`, { method: 'POST' })
      if (res.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/usuarios'
        return
      }
      const data = await res.json()
      if (!res.ok || !data.success) {
        setAutoError(data.mensagem ?? `Erro ${res.status} ao criar instância.`)
        return
      }
      toast.success(`Instância ${data.instance} criada com sucesso!`)
      closeDialog()
      await fetchUsuarios()
    } catch {
      setAutoError('Não foi possível conectar ao servidor.')
    } finally {
      setAutoCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!dialog.usuario) return
    if (!confirm(`Excluir a instância de ${dialog.usuario.nome}? Esta ação remove o WhatsApp configurado.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${dialog.usuario.id}/whatsapp/delete`, { method: 'DELETE' })
      if (res.status === 401) { window.location.href = '/login?callbackUrl=/configuracoes'; return }
      const data = await res.json()
      if (!data.success) { toast.error(data.mensagem ?? 'Erro ao excluir instância.'); return }
      if (data.aviso) {
        toast.warning(data.aviso)
      } else {
        toast.success('Instância excluída do servidor e configuração removida.')
      }
      const uid = dialog.usuario.id
      closeDialog()
      // Atualiza localmente sem depender do cache do WP
      setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, instance: null, connection_state: 'not_configured' } : u))
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setDeleting(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Isso vai remover a configuração WhatsApp de TODOS os usuários e deletar as instâncias do servidor Evolution. Confirma?')) return
    setClearingAll(true)
    try {
      const res = await fetch('/api/admin/whatsapp/clear-all', { method: 'POST' })
      if (res.status === 401) { window.location.href = '/login'; return }
      const data = await res.json()
      if (!data.success) { toast.error('Erro ao limpar instâncias.'); return }
      const total = data.limpados?.length ?? 0
      toast.success(`${total} instância${total !== 1 ? 's' : ''} removida${total !== 1 ? 's' : ''} com sucesso.`)
      await fetchUsuarios()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setClearingAll(false)
    }
  }

  const handleManualAssign = async () => {
    if (!dialog.usuario) return
    const instance = manualInstance.trim()
    if (!instance) {
      toast.error('Informe o nome da instância.')
      return
    }
    setManualSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${dialog.usuario.id}/whatsapp/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance, api_key: manualKey.trim() }),
      })
      if (res.status === 401) {
        window.location.href = '/login?callbackUrl=/admin/usuarios'
        return
      }
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao salvar.')
        return
      }
      toast.success(`Instância ${instance} atribuída com sucesso!`)
      closeDialog()
      await fetchUsuarios()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setManualSaving(false)
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={clearingAll}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          {clearingAll
            ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            : <Eraser className="h-4 w-4 mr-1.5" />}
          Limpar tudo
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

                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === 'administrator'
                        ? 'bg-[#16255c]/10 text-[#16255c]'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role === 'administrator' ? 'Admin' : 'Loja'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${
                        u.connection_state === 'open' ? 'animate-pulse' : ''
                      }`} />
                      {st.label}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {u.instance ? (
                      <div className="flex items-center gap-1.5">
                        <FaWhatsapp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <code className="text-xs font-mono text-slate-600 truncate max-w-35">
                          {u.instance}
                        </code>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {u.instance ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(u)}
                        className="text-slate-600"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openDialog(u)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Configurar
                      </Button>
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

      {/* Dialog de configuração */}
      <Dialog open={dialog.open} onOpenChange={open => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar WhatsApp</DialogTitle>
            <DialogDescription>
              {dialog.usuario?.nome} — escolha como configurar a instância.
            </DialogDescription>
          </DialogHeader>

          {dialog.usuario?.instance && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {deleting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                Excluir instância
              </Button>
            </div>
          )}

          <Tabs defaultValue="auto" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="auto" className="flex-1 gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Criar automaticamente
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Inserir manualmente
              </TabsTrigger>
            </TabsList>

            {/* Aba: auto-create */}
            <TabsContent value="auto" className="space-y-4 mt-4">
              <p className="text-sm text-slate-600">
                Tenta criar a instância <code className="text-xs bg-slate-100 px-1 rounded">user-{dialog.usuario?.id}</code> diretamente no servidor Evolution usando a chave global configurada.
              </p>
              {autoError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  <p className="font-semibold mb-0.5">Falha na criação automática</p>
                  <p className="text-xs">{autoError}</p>
                  <p className="text-xs mt-1.5 text-red-500">
                    Use a aba &quot;Inserir manualmente&quot; para registrar uma instância existente.
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button
                  onClick={handleAutoCreate}
                  disabled={autoCreating}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {autoCreating
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    : <Zap className="h-4 w-4 mr-1.5" />}
                  Criar instância
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Aba: manual */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <p className="text-sm text-slate-600">
                Registre uma instância já existente no painel do Evolution. Obtenha o nome e a API key da instância e cole abaixo.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="manual-instance">Nome da instância *</Label>
                  <Input
                    id="manual-instance"
                    placeholder="ex: user-5 ou 9b768abb-a144-4500-a23a-58b5ca755ca3"
                    value={manualInstance}
                    onChange={e => setManualInstance(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-key">API key da instância</Label>
                  <Input
                    id="manual-key"
                    placeholder="chave gerada pelo Evolution para esta instância"
                    value={manualKey}
                    onChange={e => setManualKey(e.target.value)}
                  />
                  <p className="text-xs text-slate-400">Deixe em branco para manter a chave atual (se já configurada).</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button
                  onClick={handleManualAssign}
                  disabled={manualSaving || !manualInstance.trim()}
                >
                  {manualSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Salvar
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
