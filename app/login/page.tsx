import { LoginForm } from './login-form'

export const metadata = {
  title: 'Login | CRM Multi-Unidades',
  description: 'Acesse o CRM da sua unidade',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            CRM Multi-Unidades
          </h1>
          <p className="text-muted-foreground mt-2">
            Acesse o sistema com suas credenciais
          </p>
        </div>
        
        <LoginForm />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="font-medium mb-2">Usuários de demonstração:</p>
          <div className="space-y-1">
            <p><code className="bg-muted px-1.5 py-0.5 rounded text-xs">admin@empresa.com</code> / admin123</p>
            <p><code className="bg-muted px-1.5 py-0.5 rounded text-xs">loja1@empresa.com</code> / loja123</p>
            <p><code className="bg-muted px-1.5 py-0.5 rounded text-xs">loja2@empresa.com</code> / loja123</p>
          </div>
        </div>
      </div>
    </main>
  )
}
