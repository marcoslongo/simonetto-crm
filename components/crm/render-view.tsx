'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sparkles,
  Upload,
  Download,
  Trash2,
  ImageIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const DEFAULT_PROMPT =
  'Make this render photorealistic. Maintain the exact same composition and structure, ' +
  'but replace the render appearance with realistic materials, natural lighting, detailed ' +
  'textures, and shadows to make it look like a professional photograph.'

interface RenderRecord {
  id: number
  loja_id: number
  usuario_id: number
  usuario_nome: string
  titulo: string | null
  prompt_usado: string | null
  imagem_original: string | null
  imagem_resultado: string | null
  criado_em: string
}

interface RenderViewProps {
  lojaId: number | null
}

export function RenderView({ lojaId }: RenderViewProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [titulo, setTitulo] = useState('')
  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<{ base64: string; url: string | null } | null>(null)
  const [historico, setHistorico] = useState<RenderRecord[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const carregarHistorico = useCallback(async () => {
    if (!lojaId) { setLoadingHistorico(false); return }
    try {
      const res = await fetch(`/api/render?loja_id=${lojaId}`)
      const data = await res.json()
      setHistorico(data.renders ?? [])
    } catch {
      // silencioso
    } finally {
      setLoadingHistorico(false)
    }
  }, [lojaId])

  useEffect(() => { carregarHistorico() }, [carregarHistorico])

  const handleFile = (f: File) => {
    if (f.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 20 MB).')
      return
    }
    if (!f.type.startsWith('image/')) {
      toast.error('Apenas imagens são aceitas.')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResultado(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const gerar = async () => {
    if (!file || !lojaId || gerando) return
    setGerando(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('prompt', prompt)
      fd.append('loja_id', String(lojaId))
      if (titulo.trim()) fd.append('titulo', titulo.trim())

      const res = await fetch('/api/render', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.mensagem ?? 'Erro ao gerar imagem.')
        return
      }

      setResultado({
        base64: data.resultado_base64,
        url: data.render?.imagem_resultado ?? null,
      })

      if (data.render) {
        setHistorico(prev => [data.render, ...prev])
      }

      toast.success('Render realista gerado com sucesso!')
    } catch {
      toast.error('Erro ao comunicar com o servidor.')
    } finally {
      setGerando(false)
    }
  }

  const baixar = (src: string, nome: string) => {
    const a = document.createElement('a')
    a.href = src
    a.download = nome
    a.click()
  }

  const excluir = async (id: number) => {
    try {
      const res = await fetch(`/api/render/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setHistorico(prev => prev.filter(r => r.id !== id))
      toast.success('Render excluído.')
    } catch {
      toast.error('Erro ao excluir render.')
    }
  }

  const resultadoSrc = resultado
    ? (resultado.url ?? `data:image/png;base64,${resultado.base64}`)
    : null

  return (
    <div className="space-y-6">
      {/* Geração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-[#2463eb]" />
            Gerar Render Realista
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Área de upload */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !preview && fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-xl transition-colors',
              dragging
                ? 'border-[#2463eb] bg-[#2463eb]/5'
                : 'border-border hover:border-[#2463eb]/50',
              !preview && 'cursor-pointer'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />

            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Render enviado"
                  className="w-full max-h-80 object-contain rounded-xl"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 text-xs"
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                >
                  Trocar imagem
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-center select-none">
                <div className="h-14 w-14 rounded-2xl bg-[#2463eb]/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[#2463eb]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Arraste e solte ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP · Máx. 20 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Título e prompt (visíveis após upload) */}
          {file && (
            <>
              <input
                type="text"
                placeholder="Título do render (opcional)"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-[#2463eb]"
              />

              <div>
                <button
                  type="button"
                  onClick={() => setShowPrompt(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPrompt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Personalizar instrução de geração
                </button>
                {showPrompt && (
                  <Textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={3}
                    className="mt-2 text-xs resize-none"
                    placeholder="Descreva como a imagem deve ser transformada..."
                  />
                )}
              </div>
            </>
          )}

          <Button
            onClick={gerar}
            disabled={!file || gerando}
            className="w-full bg-[#2463eb] hover:bg-[#1d4ed8] text-white font-medium"
          >
            {gerando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando… pode levar até 30 segundos
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Render Realista
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      {resultado && resultadoSrc && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-500" />
                Resultado
              </span>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                onClick={() => baixar(resultadoSrc, `render-realista-${Date.now()}.png`)}
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Original
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview!}
                  alt="Original"
                  className="w-full rounded-lg object-cover aspect-square"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">
                  Fotorrealista
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultadoSrc}
                  alt="Resultado fotorrealista"
                  className="w-full rounded-lg object-cover aspect-square"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Renders</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Nenhum render gerado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {historico.map(r => (
                <div
                  key={r.id}
                  className="group relative rounded-xl border border-border overflow-hidden bg-card hover:shadow-md transition-shadow"
                >
                  {/* Miniaturas lado a lado */}
                  <div className="grid grid-cols-2 gap-px bg-muted">
                    {r.imagem_original ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imagem_original}
                        alt="Original"
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                    {r.imagem_resultado ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imagem_resultado}
                        alt="Resultado"
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate">
                      {r.titulo ?? 'Sem título'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(r.criado_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.usuario_nome}</p>
                  </div>

                  {/* Ações (hover) */}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {r.imagem_resultado && (
                      <button
                        onClick={() => baixar(r.imagem_resultado!, `render-${r.id}.png`)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
                        title="Baixar resultado"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => excluir(r.id)}
                      className="h-6 w-6 flex items-center justify-center rounded bg-black/60 text-white hover:bg-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
