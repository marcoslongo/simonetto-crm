'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Link2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Zap,
  Code2,
  Globe,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface IntegracaoData {
  token: string | null
  endpoint: string | null
  snippet: string | null
}

interface IntegracaoLPProps {
  lojaId: string
  initialData: IntegracaoData
  isAdmin?: boolean
}

export function IntegracaoLP({ lojaId, initialData, isAdmin = false }: IntegracaoLPProps) {
  const [data, setData] = useState<IntegracaoData>(initialData)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [snippetOpen, setSnippetOpen] = useState(false)
  const [exampleOpen, setExampleOpen] = useState(false)

  const hasToken = !!data.token

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/lojas/${lojaId}/generate-token`, { method: 'POST' })
      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.mensagem || 'Erro ao gerar token.')
        return
      }

      setData({ token: json.token, endpoint: json.endpoint, snippet: json.snippet })
      setSnippetOpen(false)
      toast.success('Token gerado com sucesso!')
    } catch {
      toast.error('Erro de conexão ao gerar token.')
    } finally {
      setIsGenerating(false)
    }
  }, [lojaId])

  const copy = useCallback(
    async (text: string, type: 'endpoint' | 'snippet') => {
      await navigator.clipboard.writeText(text)
      if (type === 'endpoint') {
        setCopiedEndpoint(true)
        setTimeout(() => setCopiedEndpoint(false), 2000)
      } else {
        setCopiedSnippet(true)
        setTimeout(() => setCopiedSnippet(false), 2000)
      }
      toast.success('Copiado!')
    },
    []
  )

  const exampleCode = `<!-- Exemplo: enviar lead ao submeter o formulário -->
<form id="form-lp">
  <input name="nome"     placeholder="Seu nome"     required />
  <input name="email"    placeholder="Seu e-mail"   required />
  <input name="telefone" placeholder="Seu telefone" required />
  <textarea name="mensagem" placeholder="Mensagem"></textarea>
  <button type="submit">Enviar</button>
</form>

<script>
  document.getElementById('form-lp').addEventListener('submit', function(e) {
    e.preventDefault();
    var f = e.target;
    SimonettoCRM.enviarLead({
      nome:     f.nome.value,
      email:    f.email.value,
      telefone: f.telefone.value,
      mensagem: f.mensagem.value,
    }).then(function(res) {
      if (res.success) alert('Obrigado! Entraremos em contato em breve.');
      else alert('Erro ao enviar. Tente novamente.');
    });
  });
</script>`

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-xl font-bold text-[#16255c] flex items-center gap-3">
            <div className="bg-[#16255c] p-2.5 rounded-xl shadow-md">
              <Link2 className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            Integração LP
          </CardTitle>

          {isAdmin && (
            hasToken ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Regenerar Token
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                      Regenerar token de integração?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      O token atual será invalidado imediatamente. A LP da loja precisará ser atualizada
                      com o novo snippet para continuar enviando leads. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleGenerate}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Sim, regenerar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-[#16255c] hover:bg-[#1a2f75] text-white"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                )}
                Gerar Token
              </Button>
            )
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Conecte a landing page da loja ao CRM para capturar leads automaticamente.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasToken ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-slate-100 p-3 rounded-full">
                <Link2 className="h-6 w-6 text-slate-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Nenhum token gerado</p>
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'Clique em "Gerar Token" para criar o link de integração desta loja.'
                : 'Entre em contato com o administrador para gerar o token de integração.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Integração ativa
              </span>
            </div>

            {/* Endpoint URL */}
            <div className="rounded-xl bg-white shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-[#16255c]" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Endpoint — POST
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-[#16255c] bg-slate-50 px-3 py-2 rounded-lg border break-all">
                  {data.endpoint}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={() => copy(data.endpoint!, 'endpoint')}
                >
                  {copiedEndpoint ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Faça um <strong>POST</strong> com <code className="bg-slate-100 px-1 rounded">Content-Type: application/json</code> para este endpoint.
              </p>
            </div>

            {/* Snippet JS */}
            <div className="rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setSnippetOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#16255c]" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Snippet JS para embed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); copy(data.snippet!, 'snippet') }}
                  >
                    {copiedSnippet ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </Button>
                  {snippetOpen
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                  }
                </div>
              </button>

              {snippetOpen && (
                <div className="border-t">
                  <pre className="text-xs font-mono text-slate-700 bg-slate-950 text-slate-200 p-4 overflow-x-auto leading-relaxed max-h-72 overflow-y-auto">
                    {data.snippet}
                  </pre>
                  <div className="px-4 py-3 bg-slate-50 border-t">
                    <p className="text-xs text-slate-500">
                      Cole este snippet no <code className="bg-slate-100 px-1 rounded">&lt;head&gt;</code> ou antes do <code className="bg-slate-100 px-1 rounded">&lt;/body&gt;</code> da LP.
                      Depois use <code className="bg-slate-100 px-1 rounded font-mono">SimonettoCRM.enviarLead(dados)</code> no submit do formulário.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Exemplo de uso */}
            <div className="rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setExampleOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Exemplo de formulário
                  </span>
                </div>
                {exampleOpen
                  ? <ChevronUp className="h-4 w-4 text-slate-400" />
                  : <ChevronDown className="h-4 w-4 text-slate-400" />
                }
              </button>

              {exampleOpen && (
                <div className="border-t">
                  <pre className="text-xs font-mono bg-slate-950 text-slate-300 p-4 overflow-x-auto leading-relaxed max-h-80 overflow-y-auto">
                    {exampleCode}
                  </pre>
                  <div className="px-4 py-3 bg-slate-50 border-t">
                    <p className="text-xs text-slate-500">
                      UTM params (<code className="bg-slate-100 px-1 rounded">utm_source</code>, <code className="bg-slate-100 px-1 rounded">utm_medium</code>, etc.) e o <code className="bg-slate-100 px-1 rounded">landing_page</code> são
                      capturados automaticamente pelo snippet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Campos aceitos */}
            <div className="rounded-xl bg-white shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Campos aceitos no payload
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: 'nome', req: true },
                  { name: 'email', req: true },
                  { name: 'telefone', req: true },
                  { name: 'cidade', req: false },
                  { name: 'estado', req: false },
                  { name: 'interesse', req: false },
                  { name: 'expectativa_investimento', req: false },
                  { name: 'mensagem', req: false },
                ].map(({ name, req }) => (
                  <div
                    key={name}
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${req ? 'bg-red-400' : 'bg-slate-300'}`}
                    />
                    {name}
                    {req && <span className="text-red-400 font-bold">*</span>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                <span className="text-red-400 font-bold">*</span> Obrigatório
              </p>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  )
}
