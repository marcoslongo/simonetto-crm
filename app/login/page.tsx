import { LoginForm } from './login-form'
import Image from 'next/image'

export const metadata = {
  title: 'Login | Noxus - Lead Ops',
  description: 'Acesse o CRM da sua unidade',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#0b1437]">

      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full blur-[120px] opacity-40"
          style={{
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, #3b5bdb 0%, #1971c2 50%, transparent 100%)',
            top: '-150px',
            left: '-100px',
            animation: 'float1 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-[100px] opacity-30"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, #7048e8 0%, #5c37c7 50%, transparent 100%)',
            bottom: '-100px',
            right: '-100px',
            animation: 'float2 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-[80px] opacity-20"
          style={{
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, #22d3ee 0%, #0e7490 50%, transparent 100%)',
            top: '40%',
            right: '20%',
            animation: 'float3 12s ease-in-out infinite',
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(255,255,255,1) 0px,
            rgba(255,255,255,1) 1px,
            transparent 1px,
            transparent 20px
          )`,
        }}
      />

      <div
        className="absolute pointer-events-none"
        style={{
          width: '800px',
          height: '800px',
          border: '1px solid rgba(91, 130, 235, 0.15)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-ring 4s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          border: '1px solid rgba(91, 130, 235, 0.1)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-ring 4s ease-in-out infinite 1s',
        }}
      />

      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.5 + 0.1,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 3}s`,
          }}
        />
      ))}

      <div className="w-full max-w-md relative z-10" style={{ animation: 'fade-up 0.6s ease-out both' }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="absolute inset-0 blur-2xl opacity-50 rounded-full"
                style={{ background: 'radial-gradient(circle, #4c73e8 0%, transparent 70%)', transform: 'scale(1.5)' }}
              />
              <Image
                src="noxus.webp"
                width={150}
                height={120}
                alt="Noxus"
                priority
                className="relative"
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <LoginForm />
        </div>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.98); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.04); }
          66% { transform: translate(20px, -20px) scale(0.97); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 40px); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.4); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}