'use client'

import { useState } from 'react'
import { track } from '@/lib/gtag'

interface Props {
  fields: string[]
  intro: string
  submissionWhatsapp: string | null
}

const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Local comercial', 'Oficina', 'Lote', 'Finca', 'Otro']

const PROVINCIAS = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón']

const FIELD_LABELS: Record<string, string> = {
  phone:       'Teléfono',
  type:        'Tipo de propiedad',
  transaction: 'Tipo de transacción',
  provincia:   'Provincia',
  canton:      'Cantón',
  distrito:    'Distrito',
  address:     'Dirección exacta',
  finca:       'Número de finca',
  price:       'Precio estimado',
  area:        'Área construida (m²)',
  lot:         'Área del lote (m²)',
  bedrooms:    'Habitaciones',
  bathrooms:   'Baños',
  description: 'Descripción adicional',
}

export default function ListarClient({ fields, intro, submissionWhatsapp }: Props) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [values,  setValues]  = useState<Record<string, string>>({})
  const [sent,    setSent]    = useState(false)
  const [sending, setSending] = useState(false)

  function set(key: string, val: string) { setValues(p => ({ ...p, [key]: val })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSending(true)
    track('contact_form_submit', { source: 'listar' })

    // Build metadata with all filled fields
    const metadata: Record<string, string> = {}
    fields.forEach(key => { if (values[key]?.trim()) metadata[key] = values[key].trim() })

    // Human-readable summary for the message field
    const summary = fields
      .filter(k => values[k]?.trim())
      .map(k => `${FIELD_LABELS[k] ?? k}: ${values[k]}`)
      .join('\n')

    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email,
        phone: values.phone ?? '',
        message: summary || null,
        source: 'listar',
        listar_metadata: metadata,
      }),
    }).catch(() => {})

    if (submissionWhatsapp) {
      const msg = encodeURIComponent(`Hola, quiero listar mi propiedad.\n\nNombre: ${name}\nEmail: ${email}\n${summary}`)
      window.open(`https://wa.me/${submissionWhatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
    }

    setSending(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ paddingTop: 'var(--nav-h,68px)', minHeight: '100vh', background: '#f9f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>¡Solicitud enviada!</div>
          <p style={{ color: '#888' }}>Nos pondremos en contacto para continuar con el proceso.</p>
        </div>
      </div>
    )
  }

  const show = (key: string) => fields.includes(key)

  return (
    <div style={{ paddingTop: 'var(--nav-h,68px)', minHeight: '100vh', background: '#f9f9fb' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading,serif)', fontSize: 'clamp(26px,5vw,40px)', fontWeight: 700, color: 'var(--dark,#111)', marginBottom: 8 }}>
          Listá tu propiedad
        </h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 36, lineHeight: 1.7 }}>
          {intro || 'Completá el formulario y un agente se comunicará con vos.'}
        </p>

        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Datos de contacto */}
          <div>
            <SectionLabel>Tus datos</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Inp label="Nombre *" value={name} onChange={setName} placeholder="Tu nombre" />
              <Inp label="Email *" value={email} onChange={setEmail} placeholder="tu@email.com" type="email" />
            </div>
            {show('phone') && (
              <div style={{ marginTop: 14 }}>
                <Inp label="Teléfono" value={values.phone ?? ''} onChange={v => set('phone', v)} placeholder="+506 8888-8888" type="tel" />
              </div>
            )}
          </div>

          {/* Datos de la propiedad */}
          <div>
            <SectionLabel>Datos de la propiedad</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {(show('type') || show('transaction')) && (
                <div style={{ display: 'grid', gridTemplateColumns: show('type') && show('transaction') ? '1fr 1fr' : '1fr', gap: 14 }}>
                  {show('type') && (
                    <div>
                      <label style={labelSt}>Tipo de propiedad</label>
                      <select value={values.type ?? ''} onChange={e => set('type', e.target.value)} style={inpSt}>
                        <option value="">Seleccionar…</option>
                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                  {show('transaction') && (
                    <div>
                      <label style={labelSt}>Tipo de transacción</label>
                      <select value={values.transaction ?? ''} onChange={e => set('transaction', e.target.value)} style={inpSt}>
                        <option value="">Seleccionar…</option>
                        <option value="Venta">Venta</option>
                        <option value="Alquiler">Alquiler</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Ubicación */}
              {(show('provincia') || show('canton') || show('distrito')) && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[show('provincia'), show('canton'), show('distrito')].filter(Boolean).length}, 1fr)`, gap: 14 }}>
                  {show('provincia') && (
                    <div>
                      <label style={labelSt}>Provincia</label>
                      <select value={values.provincia ?? ''} onChange={e => set('provincia', e.target.value)} style={inpSt}>
                        <option value="">Seleccionar…</option>
                        {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}
                  {show('canton') && (
                    <Inp label="Cantón" value={values.canton ?? ''} onChange={v => set('canton', v)} placeholder="Ej: Escazú" />
                  )}
                  {show('distrito') && (
                    <Inp label="Distrito" value={values.distrito ?? ''} onChange={v => set('distrito', v)} placeholder="Ej: San Rafael" />
                  )}
                </div>
              )}

              {show('address') && (
                <Inp label="Dirección exacta" value={values.address ?? ''} onChange={v => set('address', v)} placeholder="Ej: 200m norte del parque central" />
              )}

              {show('finca') && (
                <Inp label="Número de finca" value={values.finca ?? ''} onChange={v => set('finca', v)} placeholder="Ej: 1-12345-000" />
              )}

              {/* Métricas */}
              {(show('area') || show('lot') || show('bedrooms') || show('bathrooms')) && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[show('area'), show('lot'), show('bedrooms'), show('bathrooms')].filter(Boolean).length}, 1fr)`, gap: 14 }}>
                  {show('area')      && <Inp label="Área construida (m²)" value={values.area ?? ''}      onChange={v => set('area', v)}      placeholder="120" type="number" />}
                  {show('lot')       && <Inp label="Área del lote (m²)"   value={values.lot ?? ''}       onChange={v => set('lot', v)}       placeholder="300" type="number" />}
                  {show('bedrooms')  && <Inp label="Habitaciones"          value={values.bedrooms ?? ''}  onChange={v => set('bedrooms', v)}  placeholder="3"   type="number" />}
                  {show('bathrooms') && <Inp label="Baños"                 value={values.bathrooms ?? ''} onChange={v => set('bathrooms', v)} placeholder="2"   type="number" />}
                </div>
              )}

              {show('price') && (
                <Inp label="Precio estimado" value={values.price ?? ''} onChange={v => set('price', v)} placeholder="$250,000" />
              )}

              {show('description') && (
                <div>
                  <label style={labelSt}>Descripción adicional</label>
                  <textarea value={values.description ?? ''} onChange={e => set('description', e.target.value)} rows={4}
                    placeholder="Información adicional sobre la propiedad…"
                    style={{ ...inpSt, resize: 'vertical' }} />
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={sending || !name.trim() || !email.trim()}
            style={{ padding: 13, borderRadius: 10, background: 'var(--primary,#6b2fa0)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: (sending || !name.trim() || !email.trim()) ? 0.6 : 1, marginTop: 4 }}>
            {sending ? 'Enviando…' : submissionWhatsapp ? '📲 Enviar por WhatsApp' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>{children}</div>
}

function Inp({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inpSt} />
    </div>
  )
}

const labelSt: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }
const inpSt: React.CSSProperties = { width: '100%', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }
