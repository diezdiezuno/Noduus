-- SEO fields for tenant_config
alter table tenant_config
  add column if not exists og_image text,
  add column if not exists google_sc_verification text;
