import { createClient } from '@/lib/supabase-browser'

/** Membresía del usuario actual: admin (tenant_admins) o agente (users). */
export interface Membership {
  tenantId: string
  userId: string
  isAdmin: boolean
  country: string   // país del tenant (ISO-2, default 'CR') — ver src/lib/country.ts
}

export async function getMembership(): Promise<Membership | null> {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  const { data: adm } = await sb
    .from('tenant_admins').select('tenant_id, role, tenants(country)').eq('user_id', user.id).single()
  if (adm) return { tenantId: adm.tenant_id, userId: user.id, isAdmin: adm.role === 'admin', country: (adm as { tenants?: { country?: string } }).tenants?.country ?? 'CR' }

  const { data: agent } = await sb
    .from('users').select('tenant_id, tenants(country)').eq('auth_id', user.id).single()
  if (agent) return { tenantId: agent.tenant_id, userId: user.id, isAdmin: false, country: (agent as { tenants?: { country?: string } }).tenants?.country ?? 'CR' }

  return null
}
