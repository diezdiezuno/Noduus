// Funciones específicas por país. El país vive en `tenants.country` (ISO-2).
//
// Para agregar un país nuevo: sumá su código con las features que soporta.
// Una feature ausente = deshabilitada para ese país.
//
// Features actuales (todas exclusivas de Costa Rica hoy):
//   hacienda      → consulta de cédula en api.hacienda.go.cr (autocompleta nombre/razón social)
//   cr_divisions  → provincia/cantón/distrito de CR
//   cr_cedula     → tipos de identificación de CR (física, jurídica, DIMEX, pasaporte)
//   bccr_tc       → tipo de cambio del BCCR (valoraciones)
const COUNTRY_FEATURES: Record<string, string[]> = {
  CR: ['hacienda', 'cr_divisions', 'cr_cedula', 'bccr_tc'],
}

export type CountryFeature = 'hacienda' | 'cr_divisions' | 'cr_cedula' | 'bccr_tc'

export function countryHas(country: string | null | undefined, feature: CountryFeature): boolean {
  return (COUNTRY_FEATURES[(country || 'CR').toUpperCase()] ?? []).includes(feature)
}
