'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/login/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const INACTIVITY_LIMIT_MS = 10 * 60 * 60 * 1000      // 10 horas
const WARNING_BEFORE_MS   = 5 * 60 * 1000              // avisa 5 min antes
const CHECK_INTERVAL_MS   = 30 * 1000                  // checa a cada 30s

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function SessionTimeout() {
  const router = useRouter()
  const lastActivityRef = useRef<number>(Date.now())
  const [showWarning, setShowWarning] = useState(false)

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (showWarning) setShowWarning(false)
  }, [showWarning])

  const handleLogout = useCallback(async () => {
    await logoutAction()
  }, [])

  const handleStayLoggedIn = useCallback(() => {
    resetActivity()
    // Faz uma navegação leve para o middleware atualizar o cookie last_activity
    router.refresh()
  }, [resetActivity, router])

  useEffect(() => {
    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, resetActivity, { passive: true })
    )
    return () => {
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, resetActivity)
      )
    }
  }, [resetActivity])

  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current

      if (idle >= INACTIVITY_LIMIT_MS) {
        clearInterval(interval)
        handleLogout()
        return
      }

      if (idle >= INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS && !showWarning) {
        setShowWarning(true)
      }
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [showWarning, handleLogout])

  const minutesLeft = Math.max(
    0,
    Math.ceil((INACTIVITY_LIMIT_MS - (Date.now() - lastActivityRef.current)) / 60000)
  )

  return (
    <AlertDialog open={showWarning} onOpenChange={open => { if (!open) handleStayLoggedIn() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão prestes a expirar</AlertDialogTitle>
          <AlertDialogDescription>
            Você está inativo há quase 10 horas. Sua sessão será encerrada em aproximadamente{' '}
            <strong>{minutesLeft} {minutesLeft === 1 ? 'minuto' : 'minutos'}</strong>.
            Deseja continuar conectado?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            Sair agora
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleStayLoggedIn} className="bg-[#2463eb] hover:bg-[#1d4ed8]">
            Continuar conectado
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
