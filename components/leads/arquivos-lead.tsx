'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload, Trash2, Download, FileText, FileImage,
  FileSpreadsheet, File, Loader2, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Arquivo {
  id: number
  lead_id: number
  nome_original: string
  mime_type: string
  tamanho: number
  arquivo_url: string
  usuario_id: number
  usuario_nome: string
  criado_em: string
}

interface ArquivosLeadProps {
  leadId: string | number
  currentUserId?: number
  isAdmin?: boolean
}

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/'))        return <FileImage className="h-5 w-5 text-blue-500" />
  if (mimeType === 'application/pdf')        return <FileText className="h-5 w-5 text-red-500" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
                                             return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
  if (mimeType.includes('word'))             return <FileText className="h-5 w-5 text-blue-600" />
  return <File className="h-5 w-5 text-slate-400" />
}

export function ArquivosLead({ leadId, currentUserId, isAdmin }: ArquivosLeadProps) {
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/leads/${leadId}/arquivos`)
      .then(r => r.json())
      .then(d => { if (d.success) setArquivos(d.arquivos ?? []) })
      .catch(() => toast.error('Erro ao carregar arquivos'))
      .finally(() => setLoading(false))
  }, [leadId])

  const validate = (file: File): string | null => {
    if (file.size > MAX_BYTES) return `"${file.name}" ultrapassa o limite de 10 MB.`
    if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" tem formato não permitido.`
    return null
  }

  const uploadFile = async (file: File) => {
    const err = validate(file)
    if (err) { toast.error(err); return }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('arquivo', file)

      const res = await fetch(`/api/leads/${leadId}/arquivos`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.mensagem ?? 'Erro ao enviar arquivo')

      setArquivos(prev => [data.arquivo, ...prev])
      toast.success(`"${file.name}" enviado`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    Array.from(files).forEach(uploadFile)
  }

  const handleDelete = async (arquivo: Arquivo) => {
    if (!confirm(`Excluir "${arquivo.nome_original}"?`)) return
    try {
      const res = await fetch(`/api/lead-arquivos/${arquivo.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.mensagem)
      setArquivos(prev => prev.filter(a => a.id !== arquivo.id))
      toast.success('Arquivo excluído')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const canDelete = (a: Arquivo) => isAdmin || a.usuario_id === currentUserId

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors select-none',
          dragOver   ? 'border-primary bg-primary/5'        : 'border-border hover:border-primary/50 hover:bg-muted/30',
          uploading  && 'pointer-events-none opacity-60'
        )}
      >
        {uploading
          ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          : <Upload className="h-7 w-7 text-muted-foreground" />
        }
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {uploading ? 'Enviando…' : 'Clique ou arraste arquivos aqui'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            PDF, Imagens, Word, Excel · Máx 10 MB por arquivo
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          className="sr-only"
          onChange={e => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : arquivos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <AlertCircle className="h-7 w-7 opacity-20" />
          <p className="text-sm">Nenhum arquivo anexado</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border overflow-hidden">
          {arquivos.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
              <FileIcon mimeType={a.mime_type} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.nome_original}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatBytes(a.tamanho)} · {a.usuario_nome} · {format(parseISO(a.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={a.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={a.nome_original}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Baixar"
                >
                  <Download className="h-4 w-4" />
                </a>
                {canDelete(a) && (
                  <button
                    onClick={() => handleDelete(a)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
