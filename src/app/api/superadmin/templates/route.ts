import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, serviceClient } from '@/lib/superadmin'

// Plantillas de rótulos y tarjetas (tool_templates).
// tenant_id null = genérica (todos los tenants la ven).
// La RLS ya restringe la escritura al superadmin; acá se verifica igual
// porque estas rutas usan service_role, que ignora RLS.

export async function GET(request: NextRequest) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = serviceClient()
  const [{ data: templates }, { data: tenants }] = await Promise.all([
    db.from('tool_templates')
      .select('id, kind, tenant_id, slug, label, config, position, active')
      .order('kind').order('position'),
    db.from('tenants').select('id, name, slug').order('name'),
  ])
  return NextResponse.json({ templates: templates ?? [], tenants: tenants ?? [] })
}

export async function POST(request: NextRequest) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const { kind, tenant_id, slug, label, config, position } = body

  if (!kind || !['rotulos', 'tarjetas'].includes(kind)) {
    return NextResponse.json({ error: 'kind debe ser rotulos o tarjetas' }, { status: 400 })
  }
  if (!slug?.trim() || !label?.trim()) {
    return NextResponse.json({ error: 'slug y label son obligatorios' }, { status: 400 })
  }

  const { data, error } = await serviceClient().from('tool_templates').insert({
    kind,
    tenant_id: tenant_id || null,          // '' o undefined → genérica
    slug: slug.trim(),
    label: label.trim(),
    config: config ?? {},
    position: position ?? 0,
  }).select().single()

  if (error) {
    const msg = error.message.includes('duplicate') || error.message.includes('unique')
      ? 'Ya existe una plantilla con ese slug para ese tenant'
      : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
