'use client'

import { useActionState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Loader2, Mail, Lock, Clock } from 'lucide-react'
import { loginAction, type LoginState } from './actions'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  )
  const searchParams = useSearchParams()
  const isInactivity = searchParams.get('reason') === 'inatividade'

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password')

    if (!password) {
      e.preventDefault()
      toast.error('Informe a senha')
      return
    }
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl text-[#16255c]">Entrar</CardTitle>
        <CardDescription>
          Digite seu email e senha para acessar o sistema
        </CardDescription>
        {isInactivity && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 mt-2">
            <Clock className="h-4 w-4 shrink-0" />
            Sua sessão expirou por inatividade. Faça login novamente.
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form
          action={formAction}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                disabled={isPending}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#16255c] hover:opacity-90"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}