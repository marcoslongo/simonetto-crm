import { LoginForm } from './login-form'
import Image from 'next/image'

export const metadata = {
  title: 'Login | Noxus - Lead Ops',
  description: 'Acesse o CRM da sua unidade',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#16255c]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="noxus.webp"
              width={150}
              height={120}
              alt="Noxus"
              priority
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
