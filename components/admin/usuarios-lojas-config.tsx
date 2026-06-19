'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RefreshCw, Search, Store, UserCircle, ShieldCheck, UserPlus, Eye, EyeOff, Copy, Shuffle } from 'lucide-react'
import { toast } from 'sonner'

interface PerfilAcesso {
  id: number
  nome: string
  ver_leads_nao_atribuidos: boolean
  pode_atribuir_leads: boolean
  nivel_atribuicao: 'supervisor' | 'gerente' | 'atendente'
  acesso_multiplas_lojas: boolean
}

interface Usuario {
  id: number
  nome: string
  email: string
  role: string
  loja_ids: number[]
  is_gerente: boolean
  perfil_acesso_id?: number | null
}

interface Loja {
  id: string
  nome: string
  localizacao: string
}

interface DialogState {
  open: boolean
  usuario: Usuario | null
}

export function UsuariosLojasConfig() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([])
  const [filtered, setFiltered] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<DialogState>({ open: false, usuario: null })

  const [selectedLojasIds, setSelectedLojasIds] = useState<number[]>([])
  const [isGerente, setIsGerente] = useState(false)
  const [selectedPerfilId, setSelectedPerfilId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [lojaSearch, setLojaSearch] = useState('')

  // Modal de criação de usuário
  const [createOpen, setCreateOpen] = useState(false)
  const [createNome, setCreateNome] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createSenha, setCreateSenha] = useState('')
  const [createRole, setCreateRole] = useState<'loja' | 'administrator'>('loja')
  const [showSenha, setShowSenha] = useState(false)
  const [creating, setCreating] = useState(false)

  const gerarSenha = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghjkmnpqrstuvwxyz'
    const digits = '23456789'
    const special = '!@#$%&*'
    const all = upper + lower + digits + special
    const rand = (s: string) => s[Math.floor(Math.random() * s.length)]
    const base = [rand(upper), rand(lower), rand(digits), rand(special)]
    for (let i = 0; i < 8; i++) base.push(rand(all))
    setCreateSenha(base.sort(() => Math.random() - 0.5).join(''))
    setShowSenha(true)
  }

  const copiarSenha = async () => {
    if (!createSenha) return
    await navigator.clipboard.writeText(createSenha)
    toast.success('Senha copiada!')
  }

  const resetCreate = () => {
    setCreateNome('')
    setCreateEmail('')
    setCreateSenha('')
    setCreateRole('loja')
    setShowSenha(false)
  }

  const handleCreate = async () => {
    if (!createNome.trim() || !createEmail.trim() || !createSenha) {
      toast.error('Preencha todos os campos.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: createNome.trim(), email: createEmail.trim(), senha: createSenha, role: createRole }),
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      const data = await res.json()
      if (!data.success) {
        toast.error(data.mensagem ?? 'Erro ao criar usuário.')
        return
      }
      toast.success(`Usuário ${createNome} criado com sucesso.`)
      setUsuarios(prev => [...prev, data.usuario])
      setCreateOpen(false)
      resetCreate()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setCreating(false)
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usuariosRes, lojasRes, perfisRes] = await Promise.all([
        fetch('/api/admin/usuarios'),
        fetch('/api/lojas'),
        fetch('/api/admin/perfis-acesso'),
      ])

      if (usuariosRes.status === 401) {
        window.location.href = '/login'
        return
      }

      const usuariosData = await usuariosRes.json()
      const lojasData = await lojasRes.json()
      const perfisData = await perfisRes.json()

      if (usuariosData.success) {
        setUsuarios(usuariosData.usuarios)
        setFiltered(usuariosData.usuarios)
      }

      if (perfisData.success) {
        setPerfis(perfisData.perfis ?? [])
      }

      const lojasArray: Loja[] = Array.isArray(lojasData)
        ? lojasData
        : Array.isArray(lojasData.lojas)
          ? lojasData.lojas
          : []
      setLojas(lojasArray)
    } catch {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? usuarios.filter(u =>
            u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
          )
        : usuarios
    )
  }, [search, usuarios])

  const openDialog = (usuario: Usuario) => {
    setDialog({ open: true, usuario })
    setSelectedLojasIds(usuario.loja_ids ?? [])
    setIsGerente(usuario.is_gerente ?? false)
    setSelectedPerfilId(usuario.perfil_acesso_id ?? null)
  }

  const closeDialog = () => {
    setDialog({ open: false, usuario: null })
    setSelectedLojasIds([])
    setIsGerente(false)
    setSelectedPerfilId(null)
    setLojaSearch('')
  }

  const toggleLoja = (lojaId: number) => {
    setSelectedLojasIds(prev =>
      prev.includes(lojaId)
        ? prev.filter(id => id !== lojaId)
        : [...prev, lojaId]
    )
  }

  const handleSave = async () => {
    if (!dialog.usuario) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${dialog.usuario.id}/lojas-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loja_ids: selectedLojasIds, is_gerente: isGerente, perfil_acesso_id: selectedPerfilId }),
      })
      if (res.status === 401) { window.location.href = '/login'; return }
      const data = await res.json()
      if (!data.success) {
        toast.error(data.mensagem ?? 'Erro ao salvar.')
        return
      }
      toast.success('Configuração de lojas salva com sucesso.')
      const uid = dialog.usuario.id
      setUsuarios(prev =>
        prev.map(u =>
          u.id === uid ? { ...u, loja_ids: selectedLojasIds, is_gerente: isGerente, perfil_acesso_id: selectedPerfilId } : u
        )
      )
      closeDialog()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSaving(false)
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
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Atualizar
        </Button>
        <Button size="sm" onClick={() => { resetCreate(); setCreateOpen(true) }} className="bg-[#16255c] hover:bg-[#16255c]/90 text-white">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Novo usuário
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-600">Usuário</th>
              <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Lojas atribuídas</th>
              <th className="px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Perfil</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : filtered.map(u => {
              const lojaNames = (u.loja_ids ?? [])
                .map(id => lojas.find(l => Number(l.id) === id)?.nome)
                .filter(Boolean)

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
                    {lojaNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lojaNames.map(nome => (
                          <span
                            key={nome}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#16255c]/10 text-[#16255c]"
                          >
                            <Store className="h-3 w-3" />
                            {nome}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Nenhuma loja</span>
                    )}
                  </td>

                  <td className="px-4 py-3 hidden sm:table-cell">
                    {(() => {
                      const perfil = perfis.find(p => p.id === u.perfil_acesso_id)
                      if (perfil) {
                        return (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#16255c]/10 text-[#16255c]">
                            <ShieldCheck className="h-3 w-3" />
                            {perfil.nome}
                          </span>
                        )
                      }
                      if (u.is_gerente) {
                        return (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            <ShieldCheck className="h-3 w-3" />
                            Gerente
                          </span>
                        )
                      }
                      return <span className="text-xs text-slate-400">Atendente</span>
                    })()}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(u)}
                      className="text-slate-600"
                    >
                      <Store className="h-3.5 w-3.5 mr-1.5" />
                      Gerenciar
                    </Button>
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

      <Dialog open={dialog.open} onOpenChange={open => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Gerenciar acesso às lojas</DialogTitle>
            <DialogDescription>
              {dialog.usuario?.nome} — selecione as lojas e o nível de acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Header da seção com contador */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Lojas com acesso</p>
              {lojas.length > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  selectedLojasIds.length > 0
                    ? 'bg-[#16255c] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedLojasIds.length} de {lojas.length}
                </span>
              )}
            </div>

            {lojas.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma loja cadastrada.</p>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={lojaSearch}
                    onChange={e => setLojaSearch(e.target.value)}
                    placeholder="Buscar loja…"
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto -mx-1 px-1">
                {lojas.filter(l =>
                  l.nome.toLowerCase().includes(lojaSearch.toLowerCase()) ||
                  l.localizacao?.toLowerCase().includes(lojaSearch.toLowerCase())
                ).map(loja => {
                  const checked = selectedLojasIds.includes(Number(loja.id))
                  return (
                    <label
                      key={loja.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                        checked
                          ? 'border-[#16255c]/30 bg-[#16255c]/5'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleLoja(Number(loja.id))}
                      />
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                        checked ? 'bg-[#16255c]/10' : 'bg-slate-100'
                      }`}>
                        <Store className={`h-3.5 w-3.5 ${checked ? 'text-[#16255c]' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors ${
                          checked ? 'text-[#16255c]' : 'text-slate-800'
                        }`}>
                          {loja.nome}
                        </p>
                        {loja.localizacao && (
                          <p className="text-xs text-slate-400">{loja.localizacao}</p>
                        )}
                      </div>
                      {checked && (
                        <span className="shrink-0 text-[10px] font-semibold text-[#16255c]/70 uppercase tracking-wide">
                          Ativo
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
              </>
            )}

            {/* Perfil de Acesso */}
            {perfis.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Perfil de Acesso</Label>
                <Select
                  value={selectedPerfilId ? String(selectedPerfilId) : 'sem-perfil'}
                  onValueChange={v => setSelectedPerfilId(v === 'sem-perfil' ? null : Number(v))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione um perfil…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-perfil">
                      <span className="text-slate-400">— Usar configuração legada —</span>
                    </SelectItem>
                    {perfis.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPerfilId && (() => {
                  const p = perfis.find(x => x.id === selectedPerfilId)
                  if (!p) return null
                  return (
                    <p className="text-[11px] text-slate-400">
                      {p.ver_leads_nao_atribuidos ? 'Vê todos os leads' : 'Vê apenas leads atribuídos'}
                      {p.pode_atribuir_leads ? ` · Atribui para ${p.nivel_atribuicao === 'supervisor' ? 'gerentes' : 'atendentes'}` : ' · Não atribui leads'}
                    </p>
                  )
                })()}
              </div>
            )}

            {/* Seção Gerente (legado — mantido para redes sem perfil configurado) */}
            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-all cursor-pointer ${
                isGerente
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              } ${selectedPerfilId ? 'opacity-40 pointer-events-none' : ''}`}
              onClick={() => { if (!selectedPerfilId) setIsGerente(v => !v) }}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isGerente ? 'bg-emerald-100' : 'bg-slate-200'
                }`}>
                  <ShieldCheck className={`h-4 w-4 ${isGerente ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <Label htmlFor="is-gerente" className={`text-sm font-medium cursor-pointer ${isGerente ? 'text-emerald-800' : 'text-slate-700'}`}>
                    Gerente de todas as lojas
                  </Label>
                  <p className={`text-xs mt-0.5 ${isGerente ? 'text-emerald-600' : 'text-slate-400'}`}>
                    Configura leads, metas e vendas em cada loja
                  </p>
                </div>
              </div>
              <Switch
                id="is-gerente"
                checked={isGerente}
                onCheckedChange={setIsGerente}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de criação de usuário */}
      <Dialog open={createOpen} onOpenChange={open => { if (!open) { setCreateOpen(false); resetCreate() } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>Preencha os dados para criar o acesso.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="create-nome">Nome completo</Label>
              <Input
                id="create-nome"
                placeholder="Ex: João Silva"
                value={createNome}
                onChange={e => setCreateNome(e.target.value)}
              />
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <Label htmlFor="create-email">E-mail</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="joao@exemplo.com"
                value={createEmail}
                onChange={e => setCreateEmail(e.target.value)}
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="create-senha">Senha</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="create-senha"
                    type={showSenha ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={createSenha}
                    onChange={e => setCreateSenha(e.target.value)}
                    className="pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={gerarSenha} title="Gerar senha">
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={copiarSenha} disabled={!createSenha} title="Copiar senha">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {createSenha && (
                <p className="text-[11px] text-slate-400">
                  Guarde a senha antes de salvar — ela não poderá ser recuperada aqui.
                </p>
              )}
            </div>

            {/* Perfil */}
            <div className="space-y-1.5">
              <Label>Perfil de acesso</Label>
              <Select value={createRole} onValueChange={v => setCreateRole(v as 'loja' | 'administrator')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loja">Lojista</SelectItem>
                  <SelectItem value="administrator">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreate() }}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createNome.trim() || !createEmail.trim() || !createSenha}
              className="bg-[#16255c] hover:bg-[#16255c]/90 text-white"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Criar usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
