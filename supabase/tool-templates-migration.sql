-- ══════════════════════════════════════════════════════════════
-- Plantillas de rótulos y tarjetas, por tenant.
--
-- Antes vivían hardcodeadas en el HTML de cada herramienta
-- (TEMPLATES = [remax-central, team-sunrise]), así que cualquier tenant
-- nuevo veía las marcas de REMAX y Sunrise. Ahora:
--
--   tenant_id IS NULL  → plantilla GENÉRICA, visible para todos los tenants
--   tenant_id = X      → plantilla PERSONALIZADA, solo la ve ese tenant
--
-- Crear/editar es exclusivo del superadmin (RLS). Los miembros de un
-- tenant solo leen: las genéricas + las suyas.
--
-- `slug` es el identificador estable que guarda el material ya creado
-- (rotulos.template / tarjetas.template), por eso se conservan los
-- valores actuales 'remax-central' y 'team-sunrise'.
-- ══════════════════════════════════════════════════════════════

create table if not exists tool_templates (
  id         uuid default gen_random_uuid() primary key,
  kind       text not null check (kind in ('rotulos', 'tarjetas')),
  tenant_id  uuid references tenants(id) on delete cascade,   -- NULL = genérica
  slug       text not null,
  label      text not null,
  config     jsonb not null default '{}'::jsonb,
  position   int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unicidad del slug: por tenant, y aparte entre las genéricas
-- (dos índices parciales porque en SQL NULL <> NULL).
create unique index if not exists tool_templates_generic_uq
  on tool_templates (kind, slug) where tenant_id is null;
create unique index if not exists tool_templates_tenant_uq
  on tool_templates (kind, tenant_id, slug) where tenant_id is not null;

create index if not exists tool_templates_lookup_idx
  on tool_templates (kind, tenant_id, position) where active;

-- ── Helper: ¿el usuario actual es superadmin? ─────────────────────
create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from super_admins where user_id = auth.uid())
$$;

-- ── RLS ───────────────────────────────────────────────────────────
alter table tool_templates enable row level security;

drop policy if exists "read generic or own tenant" on tool_templates;
create policy "read generic or own tenant" on tool_templates
  for select to authenticated
  using (tenant_id is null or is_tenant_member(tenant_id));

-- Solo el superadmin crea/edita/borra plantillas (genéricas o de cualquier tenant)
drop policy if exists "superadmin manage" on tool_templates;
create policy "superadmin manage" on tool_templates
  for all to authenticated
  using (is_super_admin()) with check (is_super_admin());

-- ══════════════════════════════════════════════════════════════
-- Seed: los 2 diseños actuales pasan a ser PERSONALIZADOS del tenant
-- que hoy los usa (sunrise). Se conservan los slugs para que el
-- material ya guardado los siga resolviendo.
--
-- `is_sunrise` era un flag de marca; acá se guarda como lo que
-- realmente controla: cuántas líneas ocupa el nombre y el offset Y.
-- ══════════════════════════════════════════════════════════════

insert into tool_templates (kind, tenant_id, slug, label, config, position)
select 'rotulos', t.id, 'remax-central', 'REMAX Central',
  jsonb_build_object(
    'v_url', 'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774988162/vertical-remax_no6qeh.png',
    'h_url', 'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774988162/horizontal-remax_e5rnn6.png',
    'agent_start_y', 1715,
    'h_name_lines', 2
  ), 0
from tenants t where t.slug = 'sunrise'
on conflict do nothing;

insert into tool_templates (kind, tenant_id, slug, label, config, position)
select 'rotulos', t.id, 'team-sunrise', 'Team Sunrise',
  jsonb_build_object(
    'v_url', 'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774988163/vertical-sunrise_i6ssjf.png',
    'h_url', 'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774988163/horizontal-sunrise_s62rqt.png',
    'agent_start_y', 1700,
    'h_name_lines', 1
  ), 1
from tenants t where t.slug = 'sunrise'
on conflict do nothing;

insert into tool_templates (kind, tenant_id, slug, label, config, position)
select 'tarjetas', t.id, 'remax-central', 'REMAX Central',
  jsonb_build_object(
    'front_url', 'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774576398/frente-remax_zhorik.png',
    'back_url',  'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774576399/reverso-remax_agzjhe.png',
    'name_lines', 2,
    'photo', jsonb_build_object('x',79,'y',28,'w',511,'h',797,'rTL',60,'rTR',0,'rBR',0,'rBL',89),
    'band',  jsonb_build_object('y',826,'h',189),
    'back',  jsonb_build_object('wx',46,'cx',319,'textY',730,'textEndY',880)
  ), 0
from tenants t where t.slug = 'sunrise'
on conflict do nothing;

insert into tool_templates (kind, tenant_id, slug, label, config, position)
select 'tarjetas', t.id, 'team-sunrise', 'Team Sunrise',
  jsonb_build_object(
    'front_url', 'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774576399/frente-sunrise_tl2bst.png',
    'back_url',  'https://res.cloudinary.com/dlgrhr6lh/image/upload/v1774576401/reverso-sunrise_fofnuw.png',
    'name_lines', 1,
    'photo', jsonb_build_object('x',79,'y',28,'w',511,'h',797,'rTL',60,'rTR',0,'rBR',0,'rBL',89),
    'band',  jsonb_build_object('y',826,'h',114),
    'back',  jsonb_build_object('wx',46,'cx',319,'textY',730,'textEndY',855)
  ), 1
from tenants t where t.slug = 'sunrise'
on conflict do nothing;

-- Verificación:
--   select kind, coalesce(t.slug,'(genérica)') as tenant, tt.slug, tt.label
--   from tool_templates tt left join tenants t on t.id = tt.tenant_id
--   order by kind, position;
