-- ══════════════════════════════════════════════════════════════
-- Multi-tipo de contacto: un contacto puede tener varios tipos.
-- Tabla puente crm_contact_types (many-to-many), igual patrón que
-- crm_contact_companies. Backfill desde el type_id single existente.
-- ══════════════════════════════════════════════════════════════

create table if not exists crm_contact_types (
  id         uuid default gen_random_uuid() primary key,
  tenant_id  uuid references tenants(id)       on delete cascade not null,
  contact_id uuid references crm_contacts(id)  on delete cascade not null,
  type_id    uuid references contact_types(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(contact_id, type_id)
);

alter table crm_contact_types enable row level security;

create policy "tenant_access" on crm_contact_types
  for all to authenticated
  using      (tenant_id in (select tenant_id from tenant_admins where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from tenant_admins where user_id = auth.uid()));

-- Backfill: mover cada type_id actual a la tabla puente
insert into crm_contact_types (tenant_id, contact_id, type_id)
select tenant_id, id, type_id
from crm_contacts
where type_id is not null
on conflict (contact_id, type_id) do nothing;

-- Nota: la columna crm_contacts.type_id queda pero la app ya no la usa.
-- Se puede eliminar más adelante con:  alter table crm_contacts drop column type_id;
