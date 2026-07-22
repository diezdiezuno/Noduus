-- Registro de correo saliente.
--
-- Existe por una razón concreta: en esta base de código los fallos de envío se
-- perdían en silencio una y otra vez —el SDK de Resend devuelve { error } en vez
-- de lanzar, y nadie lo miraba—. Con esto queda rastro de cada intento aunque
-- el correo no salga, y se puede responder "¿le llegó el aviso al agente?"
-- sin depender de los logs de Vercel, que rotan.
--
-- Correr una vez.

create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete set null,
  kind        text,                       -- 'invitacion', 'contacto', 'reclutamiento'…
  recipients  text[]      not null,
  subject     text,
  ok          boolean     not null,
  error       text,
  created_at  timestamptz not null default now()
);

create index if not exists email_log_tenant_fecha_idx
  on email_log (tenant_id, created_at desc);

-- Solo lo consulta el equipo de cada oficina; lo escribe la edge function con
-- service role, que no pasa por RLS.
alter table email_log enable row level security;

drop policy if exists "Miembros leen su registro de correo" on email_log;
create policy "Miembros leen su registro de correo" on email_log
  for select to authenticated
  using (
    exists (select 1 from tenant_admins ta
             where ta.user_id = auth.uid() and ta.tenant_id = email_log.tenant_id)
  );
