import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UsuariosWhatsAppList } from '@/components/admin/usuarios-whatsapp-list'

export const metadata = {
  title: 'Usuários | Admin',
}

export default async function AdminUsuariosPage() {
  const user = await requireAdmin()

  // Restrito ao administrador principal (ID 1)
  if (user.id !== 1) redirect('/admin')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#16255c]">Usuários</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie as instâncias WhatsApp dos usuários do sistema.
        </p>
      </div>

      <UsuariosWhatsAppList />
    </div>
  )
}
