-- ══════════════════════════════════════════════════════════════
-- Comisión flexible + división de negocio externo (tab Contrato).
--
-- Comisión: se pacta como porcentaje O como monto fijo (excluyentes).
--   commission_type  dice cuál escribió el usuario ('pct' | 'amount').
--   commission        se conserva SIEMPRE como el %, computado si hace
--                     falta, para no romper a quien ya lo lee así.
--   commission_amount el monto, computado si hace falta.
--
-- Negocio externo: parte de la comisión que se lleva la otra parte
--   (co-broker). Aplica a cualquier propiedad.
--   split_type  'pct' = % de la comisión | 'amount' = monto fijo.
--   split_value el número que escribió el usuario según split_type.
--   Nuestra parte neta = comisión − parte de la otra = se calcula, no
--   se guarda (es derivable).
-- ══════════════════════════════════════════════════════════════

alter table contracts add column if not exists commission_type   text default 'pct'
  check (commission_type in ('pct', 'amount'));
alter table contracts add column if not exists commission_amount numeric;
alter table contracts add column if not exists split_type        text default 'pct'
  check (split_type in ('pct', 'amount'));
alter table contracts add column if not exists split_value       numeric;
