import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchRemaxCCAProperties } from '@/lib/providers/remax-cca'
import type { Property } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get('x-tenant-domain') ?? 'localhost'
    console.log('[properties] domain:', domain)

    // Exact match first, then fallback to first tenant
    let { data: tenant, error: e1 } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('domain', domain)
      .single()

    if (!tenant) {
      console.log('[properties] no exact match, trying fallback. error:', e1?.message)
      const { data: fallback, error: e2 } = await supabase
        .from('tenants')
        .select('id, slug')
        .limit(1)
        .single()
      console.log('[properties] fallback result:', fallback, e2?.message)
      tenant = fallback
    }

    if (!tenant) {
      console.error('[properties] no tenant found for domain:', domain)
      return NextResponse.json([], { status: 200 })
    }

    console.log('[properties] using tenant:', tenant.slug)

    const { data: sources } = await supabase
      .from('property_sources')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    if (!sources || sources.length === 0) {
      console.log('[properties] no sources for tenant:', tenant.slug)
      return NextResponse.json([])
    }

    let properties: Property[] = []

    for (const source of sources) {
      if (source.type === 'remax_cca') {
        const officeId = source.config?.officeId
        if (officeId) {
          console.log('[properties] fetching CCA for officeId:', officeId)
          const props = await fetchRemaxCCAProperties(officeId, tenant.id)
          console.log('[properties] fetched', props.length, 'properties')
          properties = [...properties, ...props]
        }
      }
    }

    return NextResponse.json(properties, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' }
    })

  } catch (err) {
    console.error('[properties] unexpected error:', err)
    return NextResponse.json([], { status: 200 })
  }
}
