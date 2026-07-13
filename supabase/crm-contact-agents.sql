-- Asignación de agentes a clientes (many-to-many): un cliente puede
-- trabajar con 2+ agentes. Mismo patrón que crm_contact_companies.

create table if not exists crm_contact_agents (
  id         uuid default gen_random_uuid() primary key,
  tenant_id  uuid references tenants(id) on delete cascade not null,
  contact_id uuid references crm_contacts(id) on delete cascade not null,
  user_id    uuid references users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (contact_id, user_id)
);

alter table crm_contact_agents enable row level security;
drop policy if exists "tenant member" on crm_contact_agents;
create policy "tenant member" on crm_contact_agents
  for all to authenticated
  using (is_tenant_member(tenant_id)) with check (is_tenant_member(tenant_id));

-- Backfill: los clientes existentes quedan sin agente asignado (se asigna
-- manualmente desde el CRM). No hay dato previo de "agente único" que migrar.
