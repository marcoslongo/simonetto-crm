'use client'

import { useActionState, useEffect, useRef } from 'react'
import { KeyRound, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordAction, type ConfigState } from './actions'

const initialState: ConfigState = {}

export function ConfiguracoesForm() {
  const [state, action, isPending] = useActionState(changePasswordAction, initialState)
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="senha_atual" className="text-sm font-medium text-gray-700">
          Senha atual
        </Label>
        <div className="relative">
          <Input
            id="senha_atual"
            name="senha_atual"
            type={showSenhaAtual ? 'text' : 'password'}
            placeholder="Digite sua senha atual"
            required
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowSenhaAtual(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nova_senha" className="text-sm font-medium text-gray-700">
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="nova_senha"
            name="nova_senha"
            type={showNovaSenha ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            required
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNovaSenha(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmar_senha" className="text-sm font-medium text-gray-700">
          Confirmar nova senha
        </Label>
        <div className="relative">
          <Input
            id="confirmar_senha"
            name="confirmar_senha"
            type={showConfirmar ? 'text' : 'password'}
            placeholder="Repita a nova senha"
            required
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmar(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Senha alterada com sucesso!
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#2463eb] hover:bg-[#1d4ed8]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Alterando...
          </>
        ) : (
          <>
            <KeyRound className="mr-2 h-4 w-4" />
            Alterar senha
          </>
        )}
      </Button>
    </form>
  )
}
