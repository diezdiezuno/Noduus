-- Taxonomías de propiedades editables por tenant: estados CRM, tipos y
-- amenidades. Antes estaban hardcoded en el código (CRM_STATUSES,
-- AMENITIES_LIST) o en una tabla sin migración (property_types).
-- Correr una vez. Idempotente (if not exists + seed solo si el tenant no tiene).

-- ── Tablas ──────────────────────────────────────────────────────
create table if not exists property_types (
  id         uuid default gen_random_uuid() primary key,
  tenant_id  uuid references tenants(id) on delete cascade not null,
  label      text not null,
  value      text not null,
  icon       text,
  sort_order int not null default 0
);

create table if not exists property_statuses (
  id         uuid default gen_random_uuid() primary key,
  tenant_id  uuid references tenants(id) on delete cascade not null,
  value      text not null,
  label      text not null,
  -- Cómo se refleja en el sitio web (properties.status): publicada / oculta / vendida
  web_status text not null default 'inactive' check (web_status in ('active', 'inactive', 'sold')),
  position   int not null default 0
);

create table if not exists property_amenities (
  id         uuid default gen_random_uuid() primary key,
  tenant_id  uuid references tenants(id) on delete cascade not null,
  name       text not null,
  position   int not null default 0
);

-- ── RLS (mismo patrón que las demás tablas del tenant) ──────────
do $$
declare t text;
begin
  foreach t in array array['property_types', 'property_statuses', 'property_amenities'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "tenant member" on %I', t);
    execute format('create policy "tenant member" on %I for all to authenticated using (is_tenant_member(tenant_id)) with check (is_tenant_member(tenant_id))', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select to anon using (true)', t);
  end loop;
end $$;

-- ── Seed estados (mapeo web_status = comportamiento actual del código) ──
insert into property_statuses (tenant_id, value, label, web_status, position)
select t.id, d.value, d.label, d.web_status, d.position
from tenants t
cross join (values
  ('draft',       'Borrador',              'inactive', 0),
  ('captacion',   'En captación',          'inactive', 1),
  ('preparacion', 'En preparación',        'inactive', 2),
  ('lista',       'Lista para publicar',   'inactive', 3),
  ('active',      'Publicada',             'active',   4),
  ('bajo_oferta', 'Bajo oferta',           'inactive', 5),
  ('sold',        'Vendida / Alquilada',   'sold',     6),
  ('archived',    'Archivada',             'inactive', 7)
) as d(value, label, web_status, position)
where not exists (select 1 from property_statuses ps where ps.tenant_id = t.id);

-- ── Seed amenidades ─────────────────────────────────────────────
insert into property_amenities (tenant_id, name, position)
select t.id, a.name, a.ord
from tenants t
cross join (values
  ('Piscina',0),('Jacuzzi',1),('Sauna',2),('Gimnasio',3),('Cancha deportiva',4),
  ('Área de juegos',5),('Seguridad 24h',6),('Portón eléctrico',7),('Cámaras de seguridad',8),
  ('BBQ / Rancho',9),('Jardín',10),('Terraza',11),('Balcón',12),('Cuarto de servicio',13),
  ('Bodega',14),('Elevador',15),('Generador',16),('Placas solares',17),('Cisterna',18),
  ('Vista al mar',19),('Vista al volcán',20),('Vista al valle',21),('Aire acondicionado',22),
  ('Calefacción',23),('Área gourmet',24),('Salón de eventos',25),('Parqueo visitas',26)
) as a(name, ord)
where not exists (select 1 from property_amenities pa where pa.tenant_id = t.id);

-- ── Seed tipos por si algún tenant no tiene ninguno ─────────────
insert into property_types (tenant_id, label, value, sort_order)
select t.id, d.label, d.value, d.ord
from tenants t
cross join (values
  ('Casa','casa',0),('Apartamento','apartamento',1),('Lote / Terreno','lote',2),
  ('Oficina','oficina',3),('Local comercial','local',4),('Bodega','bodega',5),('Finca','finca',6)
) as d(label, value, ord)
where not exists (select 1 from property_types pt where pt.tenant_id = t.id);
