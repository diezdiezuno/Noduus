-- ══════════════════════════════════════════════════════════════
-- Documentos de contrato generados (tab Contratos de la propiedad).
--
-- Cada vez que el agente genera un contrato de una plantilla, se congela
-- acá el texto ya resuelto (con los datos de la propiedad metidos). Se
-- guarda el texto renderizado, no una referencia viva: un contrato que se
-- va a firmar no puede cambiar si mañana cambia el precio. Por eso también
-- se copian el nombre de la plantilla y del autor.
--
-- No reemplaza a contracts (que guarda los términos: precio, comisión,
-- fechas). Esto es el papel; aquello es el trato.
-- ══════════════════════════════════════════════════════════════

create table if not exists contract_documents (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id)    on delete cascade,
  property_id  uuid not null references properties(id) on delete cascade,
  template_id  uuid references contract_templates(id) on delete set null,
  nombre       text not null,             -- copiado de la plantilla
  cuerpo       text not null,             -- texto YA resuelto, congelado
  autor_id     uuid,
  autor_nombre text,
  created_at   timestamptz not null default now()
);

create index if not exists contract_documents_prop_idx
  on contract_documents (property_id, created_at desc);

alter table contract_documents enable row level security;

-- Los ve toda la oficina.
drop policy if exists "contract_docs leer" on contract_documents;
create policy "contract_docs leer" on contract_documents
  for select to authenticated
  using (is_tenant_member(tenant_id));

-- Los genera cualquier miembro, a nombre propio.
drop policy if exists "contract_docs generar" on contract_documents;
create policy "contract_docs generar" on contract_documents
  for insert to authenticated
  with check (is_tenant_member(tenant_id) and autor_id = auth.uid());

-- Se pueden quitar (borrador equivocado), pero no editar: un documento
-- congelado que cambia deja de ser prueba de lo que se generó.
drop policy if exists "contract_docs borrar" on contract_documents;
create policy "contract_docs borrar" on contract_documents
  for delete to authenticated
  using (is_tenant_member(tenant_id));
