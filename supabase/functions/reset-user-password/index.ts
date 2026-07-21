// reset-user-password — un admin fija la contraseña de un agente de su oficina.
//
// Deploy:  supabase functions deploy reset-user-password --no-verify-jwt --project-ref <ref>
//
// Recibe:  { auth_id, new_password }
//
// Misma comprobación de pertenencia que delete-user: cambiar la contraseña usa
// service role y se saltea RLS, así que sin verificar el tenant un admin podría
// apropiarse de la cuenta de un agente de otra oficina.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { auth_id, new_password } = await req.json()

    if (!auth_id) return json({ error: 'auth_id es requerido' }, 400)
    if (!new_password || String(new_password).length < 8) {
      return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
    }

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
      .from('users').select('role, tenant_id').eq('auth_id', caller.id).single()
    if (!profile || profile.role !== 'admin') {
      return json({ error: 'Solo los administradores pueden cambiar contraseñas' }, 403)
    }

    const sbAdmin = createClient(
      Deno.env.get('SUPABASE_URL')              ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: target } = await sbAdmin
      .from('users').select('id, tenant_id').eq('auth_id', auth_id).single()
    if (!target) return json({ error: 'El agente no existe' }, 404)
    if (target.tenant_id !== profile.tenant_id) {
      return json({ error: 'Ese agente es de otra oficina' }, 403)
    }

    const { error } = await sbAdmin.auth.admin.updateUserById(auth_id, { password: new_password })
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true })

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error interno' }, 500)
  }
})
