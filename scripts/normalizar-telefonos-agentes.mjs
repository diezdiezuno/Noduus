// Normaliza users.phone / users.whatsapp a formato internacional.
//
// A diferencia de los contactos —que guardan el número NACIONAL y el país en
// columna aparte— el teléfono del agente se guarda CON el código de país
// adentro ("+506 8868 9998"), así se describe solo. El país del tenant se usa
// solo para interpretar los que se escribieron sin código.
//
// Por qué importa: el sitio público arma el WhatsApp del agente desde este
// campo. Los que quedaron sin código generaban un wa.me que no resuelve.
//
// Uso:
//   node --env-file=.env.local scripts/normalizar-telefonos-agentes.mjs
//   node --env-file=.env.local scripts/normalizar-telefonos-agentes.mjs --apply

import { createClient } from '@supabase/supabase-js'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { writeFileSync } from 'node:fs'

const APPLY = process.argv.includes('--apply')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function internacional(valor, pais) {
  if (!valor || !valor.trim()) return null
  let p
  try { p = parsePhoneNumberFromString(valor, (pais || 'CR').toUpperCase()) } catch { return null }
  if (!p?.isValid()) return null
  const fmt = p.formatInternational()
  return fmt === valor ? null : fmt
}

// El país sale del tenant de cada agente.
const { data: tenants } = await sb.from('tenants').select('id,country')
const paisDe = Object.fromEntries((tenants ?? []).map(t => [t.id, t.country || 'CR']))

const { data, error } = await sb.from('users').select('id,name,tenant_id,phone,whatsapp,show_on_web')
if (error) { console.error('No se pudo leer:', error.message); process.exit(1) }

const cambios = []
const ilegibles = []
for (const u of data) {
  const pais = paisDe[u.tenant_id] ?? 'CR'
  const patch = {}, antes = {}
  for (const campo of ['phone', 'whatsapp']) {
    const valor = u[campo]
    if (!valor || !valor.trim()) continue
    const n = internacional(valor, pais)
    if (n) { antes[campo] = valor; patch[campo] = n; continue }
    // Solo es ilegible si de verdad no parsea (no si ya estaba bien).
    let p; try { p = parsePhoneNumberFromString(valor, pais) } catch { p = null }
    if (!p?.isValid()) ilegibles.push({ nombre: u.name, campo, valor, web: u.show_on_web })
  }
  if (Object.keys(patch).length) cambios.push({ id: u.id, nombre: u.name, antes, patch })
}

console.log(`\nAgentes leídos: ${data.length}`)
console.log(`A normalizar:   ${cambios.length}`)
console.log(`Ilegibles:      ${ilegibles.length}  (se dejan intactos)\n`)
for (const c of cambios) {
  for (const k of Object.keys(c.patch)) {
    console.log(`  ${(c.nombre ?? '').padEnd(24).slice(0, 24)} ${k.padEnd(9)} "${c.antes[k]}" → "${c.patch[k]}"`)
  }
}
if (ilegibles.length) {
  console.log('\nNo se pudieron interpretar (quedan como están):')
  for (const i of ilegibles) console.log(`  ${(i.nombre ?? '').padEnd(24).slice(0, 24)} ${i.campo} "${i.valor}"${i.web ? '  [en el sitio público]' : ''}`)
}

if (!APPLY) { console.log('\nDRY-RUN: no se escribió nada. Repetir con --apply.\n'); process.exit(0) }
if (!cambios.length) { console.log('\nNada que aplicar.\n'); process.exit(0) }

const respaldo = `respaldo-telefonos-agentes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
writeFileSync(respaldo, JSON.stringify(cambios, null, 2))
console.log(`\nRespaldo: ${respaldo}`)

let ok = 0, fallos = 0
for (const c of cambios) {
  const { error } = await sb.from('users').update(c.patch).eq('id', c.id)
  if (error) { fallos++; console.error(`  ✗ ${c.nombre}: ${error.message}`) } else ok++
}
console.log(`\nActualizados: ${ok}   Fallidos: ${fallos}\n`)
