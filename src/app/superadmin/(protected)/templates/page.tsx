'use client'

import { useEffect, useState } from 'react'

// Plantillas de rótulos y tarjetas. Solo el superadmin las crea/edita.
// tenant_id null = genérica (la ven todos los tenants).
// El `config` se edita como JSON crudo: la geometría (caja de foto, banda,
// coordenadas del reverso) es distinta por tipo y cambia con cada arte, así
// que un form fijo se quedaría corto. Se valida antes de guardar.

interface Template {
  id: string; kind: 'rotulos' | 'tarjetas'; tenant_id: string | null
  slug: string; label: string; config: Record<string, unknown>
  position: number; active: boolean
}
interface Tenant { id: string; name: string; slug: string }

const KINDS = [
  { value: 'rotulos',  label: 'Rótulos'  },
  { value: 'tarjetas', label: 'Tarjetas' },
] as const

// Plantillas de config para arrancar, con la forma que espera cada tool.
const CONFIG_SKELETON: Record<string, string> = {
  rotulos: JSON.stringify({
    v_url: '', h_url: '', agent_start_y: 1715, h_name_lines: 2,
  }, null, 2),
  tarjetas: JSON.stringify({
    front_url: '', back_url: '', name_lines: 2,
    photo: { x: 79, y: 28, w: 511, h: 797, rTL: 60, rTR: 0, rBR: 0, rBL: 89 },
    band: { y: 826, h: 189 },
    back: { wx: 46, cx: 319, textY: 730, textEndY: 880 },
  }, null, 2),
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [tenants,   setTenants]   = useState<Tenant[]>([])
  const [loading,   setLoading]   = useState(true)
  const [kind,      setKind]      = useState<'rotulos' | 'tarjetas'>('rotulos')
  const [editing,   setEditing]   = useState<Template | null>(null)
  const [showNew,   setShowNew]   = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({ slug: '', label: '', tenant_id: '', position: 0, configText: '' })

  async function load() {
    const res = await fetch('/api/superadmin/templates')
    if (res.ok) {
      const d = await res.json()
      setTemplates(d.templates); setTenants(d.tenants)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function startNew() {
    setEditing(null); setShowNew(true); setError('')
    setForm({ slug: '', label: '', tenant_id: '', position: 0, configText: CONFIG_SKELETON[kind] })
  }
  function startEdit(t: Template) {
    setShowNew(false); setEditing(t); setError('')
    setForm({
      slug: t.slug, label: t.label, tenant_id: t.tenant_id ?? '',
      position: t.position, configText: JSON.stringify(t.config ?? {}, null, 2),
    })
  }
  function cancel() { setEditing(null); setShowNew(false); setError('') }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError('')
    let config: unknown
    try { config = JSON.parse(form.configText) }
    catch { setError('El JSON de configuración no es válido'); return }

    setBusy(true)
    const isNew = !editing
    const res = await fetch(isNew ? '/api/superadmin/templates' : `/api/superadmin/templates/${editing!.id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind, slug: form.slug, label: form.label,
        tenant_id: form.tenant_id || null,
        position: Number(form.position) || 0,
        config,
      }),
    })
    setBusy(false)
    if (!res.ok) { setError((await res.json()).error ?? 'Error al guardar'); return }
    cancel(); await load()
  }

  async function toggleActive(t: Template) {
    await fetch(`/api/superadmin/templates/${t.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    })
    await load()
  }

  async function remove(t: Template) {
    if (!confirm(`¿Eliminar la plantilla "${t.label}"?\n\nSi hay material guardado que la usa, se desactiva en vez de borrarse.`)) return
    const res = await fetch(`/api/superadmin/templates/${t.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.deactivated) alert(`Se desactivó en vez de borrarse: hay ${d.usedBy} pieza(s) de material usándola.`)
    await load()
  }

  const shown = templates.filter(t => t.kind === kind)
  const tenantName = (id: string | null) =>
    id === null ? 'Genérica (todos)' : (tenants.find(x => x.id === id)?.name ?? '(tenant desconocido)')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Plantillas</h1>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
            Rótulos y tarjetas. Las genéricas las ven todos los tenants; las personalizadas, solo el suyo.
          </p>
        </div>
        {!showNew && !editing && (
          <button onClick={startNew} style={btnPrimary}>+ Nueva plantilla</button>
        )}
      </div>

      {/* Tabs por tipo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {KINDS.map(k => (
          <button key={k.value} onClick={() => { setKind(k.value); cancel() }}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              border: `1px solid ${kind === k.value ? '#fff' : '#333'}`,
              background: kind === k.value ? '#fff' : 'transparent',
              color: kind === k.value ? '#111' : '#888',
              fontWeight: kind === k.value ? 600 : 400,
            }}>
            {k.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {(showNew || editing) && (
        <form onSubmit={save} style={{ background: '#1a1a1a', borderRadius: 12, padding: '22px 24px', marginBottom: 20, border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {editing ? `Editar — ${editing.label}` : `Nueva plantilla de ${kind === 'rotulos' ? 'rótulos' : 'tarjetas'}`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 90px', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Slug</label>
              <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="remax-central" required disabled={!!editing}
                style={{ ...inputStyle, opacity: editing ? .5 : 1 }} />
              {editing && <p style={hintStyle}>No se cambia: el material guardado lo referencia.</p>}
            </div>
            <div>
              <label style={labelStyle}>Nombre visible</label>
              <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                placeholder="REMAX Central" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tenant</label>
              <select value={form.tenant_id} onChange={e => setForm(p => ({ ...p, tenant_id: e.target.value }))}
                style={inputStyle}>
                <option value="">Genérica (todos)</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Orden</label>
              <input type="number" value={form.position} onChange={e => setForm(p => ({ ...p, position: Number(e.target.value) }))}
                style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Configuración (JSON)</label>
            <textarea value={form.configText} onChange={e => setForm(p => ({ ...p, configText: e.target.value }))}
              rows={14} spellCheck={false}
              style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }} />
            <p style={hintStyle}>
              {kind === 'rotulos'
                ? 'v_url y h_url son las artes (vertical y horizontal). agent_start_y ajusta dónde arranca el bloque del agente; h_name_lines es 1 o 2 líneas para el nombre.'
                : 'front_url y back_url son las artes. name_lines es 1 o 2 líneas para el nombre. photo/band/back son coordenadas en píxeles del arte original.'}
            </p>
          </div>

          {error && <div style={{ padding: '9px 12px', background: '#2a1515', border: '1px solid #7f1d1d', borderRadius: 8, fontSize: 13, color: '#fca5a5', marginBottom: 14 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>
              {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear plantilla'}
            </button>
            <button type="button" onClick={cancel} style={btnGhost}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Listado */}
      {loading ? (
        <p style={{ color: '#666', fontSize: 14 }}>Cargando…</p>
      ) : shown.length === 0 ? (
        <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '40px 24px', textAlign: 'center', border: '1px solid #2a2a2a' }}>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
            No hay plantillas de {kind === 'rotulos' ? 'rótulos' : 'tarjetas'} todavía.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map(t => {
            const preview = (t.config?.v_url ?? t.config?.front_url) as string | undefined
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '12px 16px', opacity: t.active ? 1 : .5 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#111', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {preview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 10, color: '#444' }}>sin arte</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    {t.label}
                    {!t.active && <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>(inactiva)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', fontFamily: 'ui-monospace, monospace' }}>{t.slug}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                  background: t.tenant_id === null ? '#1e3a2f' : '#1e293b',
                  color:      t.tenant_id === null ? '#6ee7b7' : '#93c5fd',
                }}>
                  {tenantName(t.tenant_id)}
                </span>
                <button onClick={() => startEdit(t)} style={btnGhostSm}>Editar</button>
                <button onClick={() => toggleActive(t)} style={btnGhostSm}>{t.active ? 'Desactivar' : 'Activar'}</button>
                <button onClick={() => remove(t)} style={{ ...btnGhostSm, color: '#ef4444', borderColor: '#7f1d1d' }}>Eliminar</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const hintStyle:  React.CSSProperties = { fontSize: 11, color: '#666', margin: '6px 0 0', lineHeight: 1.5 }
const btnPrimary: React.CSSProperties = { background: '#fff', color: '#111', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhost:   React.CSSProperties = { background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhostSm: React.CSSProperties = { background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }
