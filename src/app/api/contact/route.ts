import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { domainCandidates } from '@/lib/tenant'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ponytail: rate-limit en memoria por IP — 5 envíos / 10 min. Suficiente
// contra spam de un solo origen; si escala a varias instancias en Vercel
// cada una tiene su mapa, pasar a Upstash/Redis.
const RATE = new Map<string, number[]>()
const RATE_MAX = 5, RATE_WINDOW = 10 * 60_000
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (RATE.get(ip) ?? []).filter(t => now - t < RATE_WINDOW)
  hits.push(now)
  RATE.set(ip, hits)
  if (RATE.size > 5000) for (const [k, v] of RATE) if (v.every(t => now - t >= RATE_WINDOW)) RATE.delete(k)
  return hits.length > RATE_MAX
}

const clip = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s ? s.slice(0, max) : null
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Demasiados envíos. Esperá unos minutos.' }, { status: 429 })
    }

    const domain = request.headers.get('x-tenant-domain') ?? 'localhost'
    const body = await request.json()
    // Validar/acortar entradas (formulario público — no confiar en el cliente)
    const name    = clip(body.name, 120)
    const email   = clip(body.email, 200)
    const phone   = clip(body.phone, 40)
    const message = clip(body.message, 4000)
    const source  = clip(body.source, 40)
    const { property_id, property_title, property_url, listar_metadata } = body
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
    }

    // Resolve tenant (with logo)
    let { data: tenant } = await supabase
      .from('tenants').select('id, name, logo_url')
      .in('domain', domainCandidates(domain)).limit(1).single()
    if (!tenant) {
      const { data: fallback } = await supabase
        .from('tenants').select('id, name, logo_url').limit(1).single()
      tenant = fallback
    }
    if (!tenant) return NextResponse.json({ error: 'no tenant' }, { status: 400 })

    // Get notification emails
    const { data: cfg } = await supabase
      .from('tenant_config')
      .select('contact_email, contact_email_2')
      .eq('tenant_id', tenant.id)
      .single()

    const cfgData = cfg as Record<string, string | null> | null
    const notifEmails = [cfgData?.contact_email, cfgData?.contact_email_2].filter(Boolean) as string[]

    // Build metadata
    let metadata: Record<string, string> | null = null
    if (listar_metadata) {
      metadata = listar_metadata
    } else if (source === 'propiedad') {
      metadata = {
        ...(property_title ? { property_title } : {}),
        ...(property_url   ? { property_url }   : {}),
      }
    }

    // Save lead
    const { error: insertError } = await supabase.from('leads').insert({
      tenant_id: tenant.id,
      property_id: property_id ?? null,
      name: name ?? '',
      email: email ?? null,
      phone: phone ?? null,
      message: message ?? null,
      source: source ?? 'contacto',
      metadata,
    })
    if (insertError) console.error('[contact] DB insert error:', JSON.stringify(insertError))

    // Send email notification
    if (notifEmails.length > 0) {
      const isProperty = source === 'propiedad' && property_title
      const isListar   = source === 'listar'

      const FIELD_LABELS: Record<string, string> = {
        type: 'Tipo de propiedad', transaction: 'Transacción',
        provincia: 'Provincia', canton: 'Cantón', distrito: 'Distrito',
        address: 'Dirección', finca: 'Número de finca',
        plano: 'Número de plano', plano_url: 'Plano PDF',
        price: 'Precio estimado', area: 'Área construida (m²)',
        lot: 'Área del lote (m²)', bedrooms: 'Habitaciones',
        bathrooms: 'Baños', description: 'Descripción',
        timeline: '¿Cuándo vender?', coordinates: 'Coordenadas',
        contact_pref: 'Contacto preferido',
      }

      const contactRows: [string, string][] = [
        ['Nombre',   name ?? ''],
        ['Email',    email ?? ''],
        ...(phone ? [['Teléfono', phone] as [string, string]] : []),
      ]

      const listarRows: [string, string][] = isListar && listar_metadata
        ? Object.entries(listar_metadata as Record<string, string>)
            .filter(([, v]) => v)
            .map(([k, v]) => {
              const label = FIELD_LABELS[k] ?? k
              // Render URLs and coordinates as clickable links
              let displayVal = v
              if (k === 'plano_url' || k === 'property_url') {
                displayVal = `<a href="${v}" style="color:#6b2fa0;">Ver archivo →</a>`
              } else if (k === 'coordinates') {
                const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(v)}`
                displayVal = `<a href="${mapsUrl}" style="color:#6b2fa0;" target="_blank">Ver en Google Maps →</a><br><span style="color:#999;font-size:12px;">${v}</span>`
              }
              return [label, displayVal] as [string, string]
            })
        : []

      const messageRows: [string, string][] = (!isListar && message)
        ? [['Mensaje', message]]
        : []

      const rows: [string, string][] = [...contactRows, ...listarRows, ...messageRows]

      const tableRows = rows.map(([label, value]) => `
        <tr>
          <td style="padding:12px 20px;font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap;border-bottom:1px solid #f0f0f0;vertical-align:top;width:120px;">${label}</td>
          <td style="padding:12px 20px;font-size:14px;color:#111;border-bottom:1px solid #f0f0f0;line-height:1.6;word-break:break-word;">${value}</td>
        </tr>`).join('')

      const subject = isProperty
        ? `Nueva consulta — ${property_title}`
        : isListar
          ? `Nueva propiedad para listar — ${name}`
          : `Nuevo mensaje de contacto — ${name}`

      const propertyBlock = isProperty ? `
        <div style="margin-bottom:28px;border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;">
          <div style="padding:16px 20px 12px;">
            <div style="font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px;">Propiedad consultada</div>
            <div style="font-size:17px;font-weight:700;color:#111;line-height:1.3;">${property_title}</div>
            ${property_url ? `<a href="${property_url}" style="display:inline-block;margin-top:10px;font-size:13px;color:#6b2fa0;text-decoration:none;font-weight:500;">Ver propiedad →</a>` : ''}
          </div>
        </div>` : ''

      // El envoltorio (encabezado, marca, pie) lo pone send-email; aca solo el contenido.
      const html = `
        ${propertyBlock}
        <div style="font-size:13px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px;">Datos del contacto</div>
        <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #ebebeb;">
          ${tableRows}
        </table>`

      // Todo el correo transaccional sale por send-email: un solo layout y un
      // solo lugar donde queda registrado lo que se envio.
      const mail = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          tenant_id: tenant.id,
          to: notifEmails,
          reply_to: email ?? undefined,
          kind: source ?? 'contacto',
          subject,
          heading: isProperty ? 'Nueva consulta de propiedad' : isListar ? 'Nueva propiedad para listar' : 'Nuevo mensaje de contacto',
          body_html: html,
          footnote: 'Respondé este email para contactar al cliente directamente.',
        }),
      })
      if (!mail.ok) console.error('[contact] send-email:', (await mail.text()).slice(0, 300))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
