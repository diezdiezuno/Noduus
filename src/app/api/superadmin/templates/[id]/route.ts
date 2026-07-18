import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin, serviceClient } from '@/lib/superadmin'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()

  // Solo los campos editables; kind y slug no se tocan (el slug lo referencia
  // el material ya guardado en rotulos.template / tarjetas.template).
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.label !== undefined)     patch.label     = String(body.label).trim()
  if (body.config !== undefined)    patch.config    = body.config
  if (body.position !== undefined)  patch.position  = body.position
  if (body.active !== undefined)    patch.active    = body.active
  if (body.tenant_id !== undefined) patch.tenant_id = body.tenant_id || null

  const { data, error } = await serviceClient()
    .from('tool_templates').update(patch).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifySuperAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const db = serviceClient()

  // El material guardado referencia la plantilla por slug. Si hay material
  // usándola, se desactiva en vez de borrarla, para no dejarlo huérfano.
  const { data: tpl } = await db.from('tool_templates').select('kind, slug').eq('id', id).single()
  if (tpl) {
    const table = tpl.kind === 'rotulos' ? 'rotulos' : 'tarjetas'
    const { count } = await db.from(table).select('*', { count: 'exact', head: true }).eq('template', tpl.slug)
    if ((count ?? 0) > 0) {
      const { error } = await db.from('tool_templates').update({ active: false }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true, deactivated: true, usedBy: count })
    }
  }

  const { error } = await db.from('tool_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, deactivated: false })
}
