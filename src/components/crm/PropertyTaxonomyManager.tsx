'use client'

/* Gestión de taxonomías de propiedades: estados CRM, tipos y amenidades.
   Editable solo por admins. Se usa en la config del CRM. */

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

interface Status  { id: string; value: string; label: string; web_status: string; position: number }
interface Ptype   { id: string; value: string; label: string; sort_order: number }
interface Amenity { id: string; name: string; position: number }

const WEB_STATUS = [
  { v: 'active',   l: 'Publicada' },
  { v: 'inactive', l: 'Oculta' },
  { v: 'sold',     l: 'Vendida / Alquilada' },
]

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const inputSt: React.CSSProperties = {
  height: 34, border: '1px solid #e2e5ea', borderRadius: 8, padding: '0 10px',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#0d0f12',
}

export default function PropertyTaxonomyManager({ tenantId, canEdit }: { tenantId: string; canEdit: boolean }) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [types,    setTypes]    = useState<Ptype[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const sb = createClient()
    const [{ data: s }, { data: t }, { data: a }] = await Promise.all([
      sb.from('property_statuses').select('id,value,label,web_status,position').eq('tenant_id', tenantId).order('position'),
      sb.from('property_types').select('id,value,label,sort_order').eq('tenant_id', tenantId).order('sort_order'),
      sb.from('property_amenities').select('id,name,position').eq('tenant_id', tenantId).order('position'),
    ])
    setStatuses((s ?? []) as Status[])
    setTypes((t ?? []) as Ptype[])
    setAmenities((a ?? []) as Amenity[])
    setLoading(false)
  }, [tenantId])
  useEffect(() => { reload() }, [reload])

  const sb = () => createClient()

  if (loading) return <div style={{ padding: 20, color: '#9ca3af', fontSize: 13 }}>Cargando…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

      {/* ESTADOS */}
      <section>
        <Head title="Estados del CRM" hint="Etapas por las que pasa una propiedad. «Visibilidad» controla cómo se ve en el sitio web." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {statuses.map(st => (
            <StatusRow key={st.id} st={st} editable={canEdit}
              onSave={async (label, web_status) => { await sb().from('property_statuses').update({ label, web_status }).eq('id', st.id); reload() }}
              onDelete={async () => { if (!confirm(`¿Borrar el estado "${st.label}"?`)) return; await sb().from('property_statuses').delete().eq('id', st.id); reload() }} />
          ))}
          {statuses.length === 0 && <Empty>Sin estados aún.</Empty>}
        </div>
        {canEdit && <AddRow placeholder="Nuevo estado…" onAdd={async name => { await sb().from('property_statuses').insert({ tenant_id: tenantId, value: slug(name), label: name, web_status: 'inactive', position: statuses.length }); reload() }} />}
      </section>

      {/* TIPOS */}
      <section>
        <Head title="Tipos de propiedad" hint="Casa, apartamento, lote, etc." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {types.map(t => (
            <SimpleRow key={t.id} name={t.label} editable={canEdit}
              onSave={async label => { await sb().from('property_types').update({ label, value: slug(label) }).eq('id', t.id); reload() }}
              onDelete={async () => { if (!confirm(`¿Borrar el tipo "${t.label}"?`)) return; await sb().from('property_types').delete().eq('id', t.id); reload() }} />
          ))}
          {types.length === 0 && <Empty>Sin tipos aún.</Empty>}
        </div>
        {canEdit && <AddRow placeholder="Nuevo tipo…" onAdd={async label => { await sb().from('property_types').insert({ tenant_id: tenantId, label, value: slug(label), sort_order: types.length }); reload() }} />}
      </section>

      {/* AMENIDADES */}
      <section>
        <Head title="Amenidades" hint="Comodidades disponibles para marcar en cada propiedad." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {amenities.map(a => (
            <SimpleRow key={a.id} name={a.name} editable={canEdit}
              onSave={async name => { await sb().from('property_amenities').update({ name }).eq('id', a.id); reload() }}
              onDelete={async () => { if (!confirm(`¿Borrar la amenidad "${a.name}"?`)) return; await sb().from('property_amenities').delete().eq('id', a.id); reload() }} />
          ))}
          {amenities.length === 0 && <Empty>Sin amenidades aún.</Empty>}
        </div>
        {canEdit && <AddRow placeholder="Nueva amenidad…" onAdd={async name => { await sb().from('property_amenities').insert({ tenant_id: tenantId, name, position: amenities.length }); reload() }} />}
      </section>

      {!canEdit && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Solo los administradores pueden editar las taxonomías.</p>}
    </div>
  )
}

/* ── Rows ── */
function StatusRow({ st, editable, onSave, onDelete }: {
  st: Status; editable: boolean; onSave: (label: string, web: string) => void; onDelete: () => void
}) {
  const [label, setLabel] = useState(st.label)
  const [web, setWeb]     = useState(st.web_status)
  const dirty = editable && (label.trim() !== st.label || web !== st.web_status) && label.trim().length > 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input value={label} disabled={!editable} onChange={e => setLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && dirty) onSave(label.trim(), web) }}
        style={{ ...inputSt, flex: 1 }} />
      <select value={web} disabled={!editable} onChange={e => setWeb(e.target.value)}
        style={{ ...inputSt, width: 180, cursor: editable ? 'pointer' : 'default', flexShrink: 0 }}>
        {WEB_STATUS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      {dirty && <SaveBtn onClick={() => onSave(label.trim(), web)} />}
      {editable && <DelBtn onClick={onDelete} />}
    </div>
  )
}

function SimpleRow({ name, editable, onSave, onDelete }: {
  name: string; editable: boolean; onSave: (name: string) => void; onDelete: () => void
}) {
  const [v, setV] = useState(name)
  const dirty = editable && v.trim() !== name && v.trim().length > 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input value={v} disabled={!editable} onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && dirty) onSave(v.trim()) }}
        style={{ ...inputSt, flex: 1 }} />
      {dirty && <SaveBtn onClick={() => onSave(v.trim())} />}
      {editable && <DelBtn onClick={onDelete} />}
    </div>
  )
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  function add() { if (name.trim()) { onAdd(name.trim()); setName('') } }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={placeholder}
        onKeyDown={e => { if (e.key === 'Enter') add() }} style={{ ...inputSt, flex: 1 }} />
      <button type="button" onClick={add} disabled={!name.trim()}
        style={{ height: 34, padding: '0 14px', border: 'none', borderRadius: 8, background: 'var(--color-primary, #111)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : .5, fontFamily: 'inherit', flexShrink: 0 }}>
        + Agregar
      </button>
    </div>
  )
}

function SaveBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} title="Guardar"
    style={{ height: 34, minWidth: 34, border: 'none', borderRadius: 8, background: '#15803d', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>✓</button>
}
function DelBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} title="Borrar"
    style={{ width: 34, height: 34, border: '1px solid #FECACA', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🗑</button>
}
function Head({ title, hint }: { title: string; hint: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0f12' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>{hint}</div>
    </div>
  )
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#9ca3af', padding: '6px 0' }}>{children}</div>
}
