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
      </div>
    </main>
  )
}
