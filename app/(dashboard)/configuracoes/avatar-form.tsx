'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AvatarFormProps {
  currentAvatarUrl?: string | null
  userName: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

export function AvatarForm({ currentAvatarUrl, userName }: AvatarFormProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(currentAvatarUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview imediato
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setStatus('idle')
    setErrorMsg('')

    // Valida no cliente antes de enviar
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setStatus('error')
      setErrorMsg('Formato inválido. Use JPG, PNG ou WEBP.')
      setPreview(currentAvatarUrl ?? null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('error')
      setErrorMsg('Arquivo muito grande. Máximo 5 MB.')
      setPreview(currentAvatarUrl ?? null)
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)

      const res = await fetch('/api/usuarios/me/avatar', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.mensagem ?? 'Erro ao fazer upload.')
      }

      setStatus('success')
      // Atualiza o server component para refletir o novo avatar_url da sessão
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao fazer upload.')
      setPreview(currentAvatarUrl ?? null)
    } finally {
      setUploading(false)
      // Limpa o input para permitir re-upload do mesmo arquivo
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar circular clicável */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-white shadow-md focus-visible:outline-none focus-visible:ring-[#2463eb] disabled:cursor-not-allowed"
        aria-label="Alterar foto de perfil"
      >
        {preview ? (
          <img
            src={preview}
            alt={userName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0b1437] text-white text-2xl font-bold">
            {getInitials(userName)}
          </div>
        )}

        {/* Overlay ao hover */}
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white transition-opacity',
          uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          {uploading
            ? <Loader2 className="h-6 w-6 animate-spin" />
            : <Camera className="h-6 w-6" />
          }
          {!uploading && <span className="text-[10px] font-medium">Alterar</span>}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-gray-900">{userName}</p>
        <p className="text-xs text-muted-foreground">
          Clique na foto para alterar
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          JPG, PNG ou WEBP · Máx 5 MB
        </p>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Foto atualizada com sucesso!
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  )
}
