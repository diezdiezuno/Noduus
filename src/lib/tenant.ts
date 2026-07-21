import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from './supabase'
import type { Tenant, TenantConfig } from '@/types'

/** Simple anon client — no cookies needed, safe to call anywhere */
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/** The root domain of the platform (e.g. noduus.com).
 *  Set APP_DOMAIN in env vars. Defaults to noduus.com. */
const APP_DOMAIN = process.env.APP_DOMAIN ?? 'noduus.com'

/** Formas del host que pueden estar guardadas en tenants.domain.
 *
 *  Cada dominio se arma distinto en Vercel: sunrisecr.com sirve el apex y el
 *  www por separado, forsale-re.com redirige el apex hacia www. El host que
 *  llega depende de eso, y tenants.domain guarda una sola de las dos formas.
 *  Exigir coincidencia exacta hace que la mitad de las visitas no encuentre su
 *  tenant: en el sitio público caen en la landing, y en los formularios el lead
 *  se guarda bajo el tenant equivocado por el fallback al primero de la lista.
 */
export function domainCandidates(domain: string): string[] {
  const bare = domain.replace(/^www\./, '')
  return bare === domain ? [domain, `www.${domain}`] : [domain, bare]
}

/** Resolve a request host to a tenant.
 *
 *  Rules (in order):
 *  1. noduus.com / www.noduus.com  → null  (landing page)
 *  2. {slug}.noduus.com              → lookup by slug
 *  3. any other domain                  → lookup by domain (custom domain)
 *  4. localhost / *.localhost (dev)     → fallback to first tenant
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  // Use a simple client (no cookies) — tenant lookup is public, no auth needed
  const supabase = publicClient()

  // 1. Root app domain → no tenant, show landing page
  if (domain === APP_DOMAIN || domain === `www.${APP_DOMAIN}`) {
    return null
  }

  // 2. Subdomain of app domain → lookup by slug
  if (domain.endsWith(`.${APP_DOMAIN}`)) {
    const slug = domain.slice(0, domain.length - APP_DOMAIN.length - 1)
    const { data } = await supabase
      .from('tenants').select('*').eq('slug', slug).single()
    return data ?? null
  }

  // 3. Custom domain → lookup by domain, con o sin www.
  if (!domain.includes('localhost') && !domain.endsWith('.localhost')) {
    const { data } = await supabase
      .from('tenants').select('*')
      .in('domain', domainCandidates(domain))
      .limit(1).single()
    return data ?? null
  }

  // 4. localhost (dev) → fallback to first tenant so local dev works
  const { data } = await supabase
    .from('tenants').select('*').limit(1).single()
  return data ?? null
}

export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  // Use the public anon client — tenant_config is read by public pages and
  // must not require an authenticated session. RLS must have a public-read policy.
  const supabase = publicClient()
  const { data } = await supabase
    .from('tenant_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export const DEFAULT_THEME = {
  primaryColor: '#6b2fa0',
  accentColor: '#f59e0b',
  fontHeading: 'Playfair Display',
  fontBody: 'Outfit',
  mapStyle: 'mapbox://styles/mapbox/streets-v12',
}
