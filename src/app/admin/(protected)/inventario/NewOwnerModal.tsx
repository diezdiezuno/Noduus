'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import PhoneInput from '@/components/PhoneInput'

/* ── Types ───────────────────────────────────────────────────── */
interface ContactType   { id: string; name: string; color: string }
interface ContactSource { id: string; name: string }
interface DupeHint      { id: string; name: string; last_name: string | null }

export interface NewOwnerResult {
  type: 'contact' | 'company'
  id: string; name: string; subtitle: string
}

interface Props {
  type:     'contact' | 'company'
  tenantId: string
  initial?: string           // Pre-fill name/search term
  onCreated: (owner: NewOwnerResult) => void
  onClose:   () => void
}

/* ── Helpers ─────────────────────────────────────────────────── */
function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }

const CEDULA_TIPOS = [
  { value: 'nacional',  label: 'Cédula nacional' },
  { value: 'dimex',     label: 'DIMEX'            },
  { value: 'pasaporte', label: 'Pasaporte'         },
]
function cedulaMaxLength(tipo: string) {
  if (tipo === 'dimex') return 13
  if (tipo === 'pasaporte') return 20
  return 11
}

const inputSt: React.CSSProperties = {
  width: '100%', border: '1px solid #e2e5ea', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
}
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>{children}{required && <span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>}</div>
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.07em', margin: '20px 0 12px', paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{children}</div>
}

/* ══════════════════════════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════════════════════════ */
function ContactForm({ tenantId, initial, onCreated, onClose }: Omit<Props, 'type'>) {
  const [types,   setTypes]   = useState<ContactType[]>([])
  const [sources, setSources] = useState<ContactSource[]>([])

  const [cedulaTipo, setCedulaTipo] = useState('nacional')
  const [cedula,     setCedula]     = useState('')
  const [name,       setName]       = useState(initial ?? '')
  const [lastName,   setLastName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [phoneCountry, setPhoneCountry] = useState('CR')
  const [phoneAlt,   setPhoneAlt]   = useState('')
  const [phoneAltCountry, setPhoneAltCountry] = useState('CR')
  const [typeId,     setTypeId]     = useState('')
  const [sourceId,   setSourceId]   = useState('')
  const [notes,      setNotes]      = useState('')

  const [cedulaDupe, setCedulaDupe] = useState<DupeHint | null>(null)
  const [emailDupe,  setEmailDupe]  = useState<DupeHint | null>(null)
  const [emailErr,   setEmailErr]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('contact_types').select('id,name,color').eq('tenant_id', tenantId).order('position'),
      sb.from('contact_sources').select('id,name').eq('tenant_id', tenantId).order('position'),
    ]).then(([{ data: t }, { data: s }]) => {
      setTypes((t ?? []) as ContactType[])
      setSources((s ?? []) as ContactSource[])
    })
  }, [tenantId])

  async function checkCedulaDupe() {
    const raw = cedula.trim()
    if (!raw) { setCedulaDupe(null); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createClient() as any)
      .from('crm_contacts').select('id,name,last_name')
      .eq('tenant_id', tenantId).eq('cedula', raw).eq('active', true).limit(1)
    setCedulaDupe(data?.[0] ?? null)
  }

  async function checkEmailDupe() {
    const val = email.trim()
    if (!val || !isValidEmail(val)) { setEmailDupe(null); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createClient() as any)
      .from('crm_contacts').select('id,name,last_name')
      .eq('tenant_id', tenantId).eq('email', val).eq('active', true).limit(1)
    setEmailDupe(data?.[0] ?? null)
  }

  async function save() {
    setError('')
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    if (email && !isValidEmail(email)) { setEmailErr(true); setError('Email inválido.'); return }

    setSaving(true)
    const sb = createClient()

    // Final dupe checks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb0 = sb as any
    if (cedula.trim()) {
      const { data } = await sb0.from('crm_contacts').select('id,name,last_name').eq('tenant_id', tenantId).eq('cedula', cedula.trim()).eq('active', true).limit(1)
      if (data?.[0]) { setCedulaDupe(data[0]); setSaving(false); setError('Ya existe un cliente con esta cédula.'); return }
    }
    if (email.trim()) {
      const { data } = await sb0.from('crm_contacts').select('id,name,last_name').eq('tenant_id', tenantId).eq('email', email.trim()).eq('active', true).limit(1)
      if (data?.[0]) { setEmailDupe(data[0]); setSaving(false); setError('Ya existe un cliente con este email.'); return }
    }

    const { data, error: dbErr } = await sb.from('crm_contacts').insert({
      tenant_id:         tenantId,
      name:              name.trim(),
      last_name:         lastName.trim() || null,
      cedula:            cedula.trim()   || null,
      cedula_tipo:       cedulaTipo,
      email:             email.trim()    || null,
      phone:             phone.trim()    || null,
      phone_country:     phoneCountry,
      phone_alt:         phoneAlt.trim() || null,
      phone_alt_country: phoneAltCountry,
      type_id:           typeId   || null,
      source_id:         sourceId || null,
      notes:             notes.trim() || null,
      active:            true,
    }).select('id,name,last_name,email,cedula').single()

    if (dbErr) { setError(`Error: ${dbErr.message}`); setSaving(false); return }

    onCreated({
      type:     'contact',
      id:       data.id,
      name:     [data.name, data.last_name].filter(Boolean).join(' '),
      subtitle: data.email ?? data.cedula ?? 'Persona física',
    })
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 24px' }}>
      <SectionTitle>Identificación</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <select value={cedulaTipo} onChange={e => { setCedulaTipo(e.target.value); setCedula(''); setCedulaDupe(null) }} style={inputSt}>
            {CEDULA_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Número</FieldLabel>
          <input value={cedula} onChange={e => { setCedula(e.target.value); setCedulaDupe(null) }}
            onBlur={checkCedulaDupe} maxLength={cedulaMaxLength(cedulaTipo)}
            placeholder={cedulaTipo === 'pasaporte' ? 'AA123456' : cedulaTipo === 'dimex' ? '1234567890123' : '10000000000'}
            style={{ ...inputSt, borderColor: cedulaDupe ? '#FDE68A' : '#e2e5ea', background: cedulaDupe ? '#FFFBEB' : '#fff' }} />
          {cedulaDupe && (
            <div style={{ fontSize: 12, color: '#92400e', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '5px 10px', marginTop: 4 }}>
              ⚠ Ya existe: <strong>{cedulaDupe.name}{cedulaDupe.last_name ? ' ' + cedulaDupe.last_name : ''}</strong>
            </div>
          )}
        </div>
      </div>

      <SectionTitle>Datos personales</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <FieldLabel required>Nombre</FieldLabel>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" style={inputSt} />
        </div>
        <div>
          <FieldLabel>Apellido</FieldLabel>
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido" style={inputSt} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Email</FieldLabel>
        <input value={email}
          onChange={e => { setEmail(e.target.value); setEmailErr(false); setEmailDupe(null) }}
          onBlur={checkEmailDupe}
          placeholder="correo@ejemplo.com"
          style={{ ...inputSt, borderColor: (emailErr || emailDupe) ? '#FDE68A' : '#e2e5ea', background: (emailErr || emailDupe) ? '#FFFBEB' : '#fff' }} />
        {emailDupe && (
          <div style={{ fontSize: 12, color: '#92400e', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '5px 10px', marginTop: 4 }}>
            ⚠ Ya existe: <strong>{emailDupe.name}{emailDupe.last_name ? ' ' + emailDupe.last_name : ''}</strong>
          </div>
        )}
        {emailErr && !emailDupe && <div style={{ fontSize: 12, color: '#e53e3e', marginTop: 4 }}>Email inválido.</div>}
      </div>

      <SectionTitle>Teléfonos</SectionTitle>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Teléfono principal</FieldLabel>
        <PhoneInput phoneValue={phone} countryIso={phoneCountry} onPhoneChange={setPhone} onCountryChange={setPhoneCountry} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Teléfono alternativo</FieldLabel>
        <PhoneInput phoneValue={phoneAlt} countryIso={phoneAltCountry} onPhoneChange={setPhoneAlt} onCountryChange={setPhoneAltCountry} />
      </div>

      {(types.length > 0 || sources.length > 0) && <SectionTitle>Clasificación</SectionTitle>}
      {types.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <FieldLabel>Tipo de cliente</FieldLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t.id} type="button" onClick={() => setTypeId(prev => prev === t.id ? '' : t.id)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${typeId === t.id ? t.color : '#e2e5ea'}`, background: typeId === t.id ? t.color + '22' : '#fff', color: typeId === t.id ? t.color : '#555', fontSize: 12, fontWeight: typeId === t.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {sources.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <FieldLabel>Fuente</FieldLabel>
          <select value={sourceId} onChange={e => setSourceId(e.target.value)} style={{ ...inputSt, maxWidth: 280 }}>
            <option value="">Sin fuente</option>
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <SectionTitle>Notas</SectionTitle>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
        placeholder="Observaciones o comentarios…"
        style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5, marginBottom: 4 }} />

      {error && <div style={{ fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button onClick={save} disabled={saving}
          style={{ flex: 1, height: 40, background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Guardando…' : 'Registrar cliente'}
        </button>
        <button onClick={onClose}
          style={{ height: 40, padding: '0 18px', background: 'none', border: '1px solid #e2e5ea', borderRadius: 10, fontSize: 13, cursor: 'pointer', color: '#555', fontFamily: 'inherit' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   COMPANY FORM
══════════════════════════════════════════════════════════════ */
function CompanyForm({ tenantId, initial, onCreated, onClose }: Omit<Props, 'type'>) {
  const [cedJur,      setCedJur]      = useState('')
  const [name,        setName]        = useState(initial ?? '')
  const [tradeName,   setTradeName]   = useState('')
  const [looking,     setLooking]     = useState(false)
  const [lookResult,  setLookResult]  = useState<{ name: string } | null>(null)
  const [cedJurDupe,  setCedJurDupe]  = useState<{ id: string; name: string } | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function lookupCedJur(v: string) {
    setCedJur(v); setLookResult(null); setCedJurDupe(null)
    const digits = v.replace(/\D/g, '')
    if (digits.length < 9) return
    setLooking(true)
    // Hacienda lookup
    try {
      const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${digits}`)
      if (res.ok) {
        const j = await res.json()
        if (j.nombre) { setLookResult({ name: j.nombre }); if (!name) setName(j.nombre) }
      }
    } catch { /* silent */ }
    // Dupe check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createClient() as any)
      .from('crm_companies').select('id,name,trade_name')
      .eq('tenant_id', tenantId).eq('cedula_juridica', digits).limit(1)
    setCedJurDupe(data?.[0] ?? null)
    setLooking(false)
  }

  async function save() {
    setError('')
    if (!name.trim()) { setError('La razón social es obligatoria.'); return }
    if (cedJurDupe) { setError('Ya existe una empresa con esta cédula jurídica.'); return }
    setSaving(true)

    const { data, error: dbErr } = await createClient().from('crm_companies').insert({
      tenant_id:       tenantId,
      name:            name.trim(),
      trade_name:      tradeName.trim() || null,
      cedula_juridica: cedJur.replace(/\D/g, '') || null,
    }).select('id,name,trade_name,cedula_juridica').single()

    if (dbErr) { setError(`Error: ${dbErr.message}`); setSaving(false); return }

    onCreated({
      type:     'company',
      id:       data.id,
      name:     data.trade_name || data.name,
      subtitle: data.trade_name ? data.name : (data.cedula_juridica ?? 'Empresa'),
    })
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 24px' }}>
      <SectionTitle>Identificación fiscal</SectionTitle>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Cédula jurídica</FieldLabel>
        <div style={{ position: 'relative' }}>
          <input value={cedJur} onChange={e => lookupCedJur(e.target.value)}
            placeholder="Ej: 3-101-123456"
            style={{ ...inputSt, borderColor: cedJurDupe ? '#FDE68A' : '#e2e5ea', background: cedJurDupe ? '#FFFBEB' : '#fff' }} />
          {looking && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#aaa' }}>Consultando…</span>}
        </div>
        {lookResult && <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 500 }}>✓ {lookResult.name}</div>}
        {cedJurDupe && (
          <div style={{ fontSize: 12, color: '#92400e', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '5px 10px', marginTop: 4 }}>
            ⚠ Ya existe: <strong>{cedJurDupe.name}</strong>
          </div>
        )}
        <p style={{ fontSize: 11, color: '#aaa', margin: '4px 0 0' }}>Se consulta automáticamente al Ministerio de Hacienda para obtener el nombre.</p>
      </div>

      <SectionTitle>Datos de la empresa</SectionTitle>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel required>Razón social</FieldLabel>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre legal registrado" style={inputSt} />
        <p style={{ fontSize: 11, color: '#aaa', margin: '4px 0 0' }}>Nombre completo como aparece en el Registro Nacional.</p>
      </div>
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>Nombre fantasía</FieldLabel>
        <input value={tradeName} onChange={e => setTradeName(e.target.value)} placeholder="Nombre comercial (si aplica)" style={inputSt} />
        <p style={{ fontSize: 11, color: '#aaa', margin: '4px 0 0' }}>Nombre con el que opera el negocio (puede ser diferente a la razón social).</p>
      </div>

      {error && <div style={{ fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button onClick={save} disabled={saving || !!cedJurDupe}
          style={{ flex: 1, height: 40, background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: (saving || !!cedJurDupe) ? 'not-allowed' : 'pointer', opacity: (saving || !!cedJurDupe) ? 0.7 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Guardando…' : 'Registrar empresa'}
        </button>
        <button onClick={onClose}
          style={{ height: 40, padding: '0 18px', background: 'none', border: '1px solid #e2e5ea', borderRadius: 10, fontSize: 13, cursor: 'pointer', color: '#555', fontFamily: 'inherit' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MODAL WRAPPER
══════════════════════════════════════════════════════════════ */
export default function NewOwnerModal({ type, tenantId, initial, onCreated, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose])

  const title = type === 'contact' ? '👤 Nuevo cliente' : '🏢 Nueva empresa'

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,15,18,.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{
        width: 560, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 48px)',
        background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.22)', fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Header */}
        <div style={{ height: 52, background: '#f4f5f7', borderBottom: '1px solid #e2e5ea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0d0f12' }}>{title}</span>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #e2e5ea', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#5a6070' }}>✕</button>
        </div>

        {/* Form */}
        {type === 'contact'
          ? <ContactForm tenantId={tenantId} initial={initial} onCreated={onCreated} onClose={onClose} />
          : <CompanyForm tenantId={tenantId} initial={initial} onCreated={onCreated} onClose={onClose} />
        }
      </div>
    </div>
  )
}
