// Teléfonos internacionales.
//
// Había tres copias de la misma heurística ("hasta 8 dígitos es local, si no ya
// trae el código"), y dos de ellas resolvían el código de país con
// `country === 'US' ? '1' : country === 'MX' ? '52' : '506'`: para un contacto
// de cualquier otro país el enlace de WhatsApp apuntaba a un número equivocado.
//
// Con contactos de varios países la heurística no alcanza: saber si "50612345678"
// ya trae el código depende de cuántos dígitos tiene un número nacional en ese
// país. Esa metadata es justo lo que trae libphonenumber-js, así que se usa en
// vez de escribir a mano las reglas de ~200 países.
//
// Los números viejos se cargaron de cualquier forma (con +, sin +, con el código
// pegado, o solo el nacional). parsePhoneNumberFromString con el país del
// contacto resuelve los cuatro casos.

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

function parsear(phone: string | null | undefined, country: string | null | undefined) {
  if (!phone) return null
  const iso = (country || 'CR').toUpperCase()
  try {
    return parsePhoneNumberFromString(phone, iso as CountryCode) ?? null
  } catch {
    return null
  }
}

/** Para mostrar: siempre con código de país. Ej: "+506 8888 8888". */
export function phoneDisplay(phone: string | null | undefined, country: string | null | undefined): string {
  if (!phone) return ''
  const p = parsear(phone, country)
  // Si no se puede interpretar (número incompleto o basura), se muestra tal cual
  // en vez de inventar un código que podría ser falso.
  return p ? p.formatInternational() : phone
}

/** Enlace de WhatsApp (wa.me exige solo dígitos, con código de país). */
export function whatsappHref(phone: string | null | undefined, country: string | null | undefined): string {
  const p = parsear(phone, country)
  if (!p) return '#'
  return `https://wa.me/${p.number.replace(/\D/g, '')}`
}

export function openWhatsapp(phone: string | null | undefined, country: string | null | undefined) {
  const href = whatsappHref(phone, country)
  if (href === '#') return
  window.open(href, '_blank')
}
