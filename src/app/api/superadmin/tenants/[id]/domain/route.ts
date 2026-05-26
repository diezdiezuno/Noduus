import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, serviceClient } from '@/lib/superadmin'
import { addDomain, getDomainStatus, verifyDomain, removeDomain } from '@/lib/vercel-api'

/** GET — current Vercel status for the tenant's domain */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { data: tenant } = await serviceClient()
    .from('tenants').select('domain').eq('id', id).single()
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const status = await getDomainStatus(tenant.domain)
  return NextResponse.json({ domain: tenant.domain, status })
}

/** POST — add tenant domain to Vercel (or re-add if changed) */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { data: tenant } = await serviceClient()
    .from('tenants').select('domain').eq('id', id).single()
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const status = await addDomain(tenant.domain)
  return NextResponse.json({ domain: tenant.domain, status })
}

/** PUT — trigger re-verification */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { data: tenant } = await serviceClient()
    .from('tenants').select('domain').eq('id', id).single()
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const status = await verifyDomain(tenant.domain)
  return NextResponse.json({ domain: tenant.domain, status })
}

/** DELETE — remove domain from Vercel */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { domain } = await request.json()
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  const ok = await removeDomain(domain)
  return NextResponse.json({ ok })
}
