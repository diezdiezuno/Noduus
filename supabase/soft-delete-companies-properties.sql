-- ══════════════════════════════════════════════════════════════
-- Soft-delete (archivar) para empresas y propiedades, igual que en
-- crm_contacts. "Archivar" = active=false; se puede restaurar.
-- Las consultas del admin/públicas filtran active=true.
-- ══════════════════════════════════════════════════════════════

alter table crm_companies add column if not exists active boolean not null default true;
alter table properties    add column if not exists active boolean not null default true;
