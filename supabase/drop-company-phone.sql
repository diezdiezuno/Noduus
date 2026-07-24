-- ══════════════════════════════════════════════════════════════
-- Quitar crm_companies.phone: columna muerta.
--
-- Ningún formulario la cargaba nunca —el alta de empresa solo guarda
-- nombre, nombre comercial y cédula jurídica— así que estaba vacía en
-- las 6 empresas. Lo único que la leía era la vCard de empresa, que
-- mostraba botones de llamar/WhatsApp que en la práctica nunca
-- aparecían; ese bloque ya se quitó del código.
--
-- OJO: esto borra la columna. Está vacía hoy, pero confirmá antes de
-- correrlo:
--   select count(*) from crm_companies where phone is not null and phone <> '';
-- Debe dar 0.
-- ══════════════════════════════════════════════════════════════

alter table crm_companies drop column if exists phone;
