// ──────────────────────────────────────────────────────────────────────────────
// Edge Function: invite-agent
// Despliegue:  supabase functions deploy invite-agent --no-verify-jwt
// Secrets:     RESEND_API_KEY, RESEND_FROM_EMAIL (opcional, default noreply@noduus.com)
//              SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (ya provistos)
//
// Recibe:  { email, name?, job_title?, message?, tenant_id, tenant_name?, invited_by? }
// Requiere: Authorization Bearer con el JWT del admin
// Valida:  caller es admin (users.role='admin') del mismo tenant
// Acción:  crea la invitación (token), envía email Noduus con link de registro
//
// Requiere el SQL companion: supabase/functions/invite-agent/invited_by-text.sql
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const esc = (s: string) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { email, name, job_title, message, tenant_id, tenant_name, invited_by } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Correo electrónico inválido' }, 400)
    }
    if (!tenant_id) return json({ error: 'tenant_id es requerido' }, 400)

    // ── Auth: caller autenticado y admin del mismo tenant ──────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    const sbCaller = createClient(
      Deno.env.get('SUPABASE_URL')      ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await sbCaller.auth.getUser()
    if (!caller) return json({ error: 'No autorizado' }, 401)

    const { data: profile } = await sbCaller
      .from('users').select('role, tenant_id, name').eq('auth_id', caller.id).single()
    if (!profile || profile.role !== 'admin') {
      return json({ error: 'Solo los administradores pueden invitar agentes' }, 403)
    }
    if (profile.tenant_id !== tenant_id) {
      return json({ error: 'No autorizado para este tenant' }, 403)
    }

    // ── Crear invitación (service role) ────────────────────────────────────────
    const sbAdmin = createClient(
      Deno.env.get('SUPABASE_URL')              ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: invite, error: insErr } = await sbAdmin
      .from('invitations')
      .insert({
        tenant_id,
        email: String(email).toLowerCase(),
        name: name || null,
        job_title: job_title || null,
        invited_by: invited_by || profile.name || 'tu equipo',
        status: 'pending',
        expires_at: expires,
      })
      .select('token')
      .single()

    if (insErr || !invite) return json({ error: insErr?.message || 'No se pudo crear la invitación' }, 500)

    // ── Enviar email (Resend) ──────────────────────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      // Sin email configurado: la invitación quedó creada, devolver el link.
      const origin = req.headers.get('origin') || Deno.env.get('APP_URL') || ''
      return json({ ok: true, warning: 'RESEND_API_KEY no configurada — email no enviado',
        link: `${origin}/tools/registro/?token=${invite.token}` })
    }

    const origin = req.headers.get('origin') || Deno.env.get('APP_URL') || 'https://noduus.com'
    const link   = `${origin}/tools/registro/?token=${invite.token}`
    const office = esc(tenant_name || 'tu oficina')
    const who    = esc(name || 'Agente')
    const extra  = message
      ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">${esc(message)}</p>`
      : ''

    // El armado y el envio viven en send-email: aca solo se define el contenido.
    const mail = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        tenant_id,
        to: email,
        kind: 'invitacion',
        subject: `Invitación para unirte a ${office}`,
        heading: `${who}, te invitamos a unirte al equipo`,
        body_html: `
          <p style="margin:0 0 16px;font-size:15px;color:#111;">Hola <strong>${who}</strong>,</p>
          ${extra}
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
            Has sido invitado/a a unirte a <strong>${office}</strong> en Noduus, la plataforma para profesionales inmobiliarios.
          </p>`,
        cta: { label: 'Crear mi cuenta →', url: link },
        footnote: 'Si no esperabas esta invitación, podés ignorar este mensaje.<br/>El enlace expirará en 7 días.',
      }),
    })

    if (!mail.ok) {
      const detail = await mail.text()
      return json({ ok: true, warning: `Invitación creada pero el email falló: ${detail.slice(0, 200)}`, link })
    }

    return json({ ok: true })

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error interno' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
