import { useOutletContext } from 'react-router-dom'
import type { Barber, BarberRole } from './barbers'

/** Contexte partagé par AdminLayout à toutes les pages admin (via <Outlet context>). */
export type AdminContext = {
  myBarber: Barber | null
  myRole: BarberRole | null
  isAdmin: boolean
}

export function useAdminContext(): AdminContext {
  return useOutletContext<AdminContext>()
}
