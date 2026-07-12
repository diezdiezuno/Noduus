-- País del tenant → habilita funciones específicas por país.
-- Default 'CR' (los tenants actuales son de Costa Rica).
alter table tenants add column if not exists country text not null default 'CR';
