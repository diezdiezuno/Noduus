-- ══════════════════════════════════════════════════════════════
-- Permitir transaction = 'sale_rent' (venta y alquiler a la vez).
--
-- La UI ya ofrecía "Venta y alquiler" pero el check original solo
-- aceptaba 'sale' | 'rent', así que guardarla fallaba en silencio.
-- El precio de alquiler vive en features.rent_price / rent_currency
-- (no necesita columna).
-- ══════════════════════════════════════════════════════════════

alter table properties drop constraint if exists properties_transaction_check;
alter table properties add  constraint properties_transaction_check
  check (transaction in ('sale', 'rent', 'sale_rent'));
