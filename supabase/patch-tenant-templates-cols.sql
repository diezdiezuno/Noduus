-- Patch: columnas planas de tenant_templates.
-- El esquema inicial la creó con name/html/config, pero la herramienta de
-- firmas lee columnas planas del PropTools viejo (template_id decide el
-- layout, logo_url y extra_website por template). Correr una vez, luego
-- re-correr migrate-proptools-data.mjs para poblarlas.

alter table tenant_templates
  add column if not exists template_id   text,
  add column if not exists logo_url      text,
  add column if not exists extra_website text;
