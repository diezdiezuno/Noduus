'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import PageHeader from '@/components/admin/PageHeader'

// Bitácora de salida de agentes: qué fichas creó cada persona que ya no está.
//
// No hace falta resolver el tenant ni comprobar el rol acá: la policy de
// `agent_offboarding_log` solo devuelve filas a los admins de la oficina, así
// que un agente ve una tabla vacía y otra oficina no ve nada. La seguridad es
// la RLS, no esta pantalla.

interface Fila {
  id: string
  agent_name: string | null
  agent_email: string | null
  entidad: string
  registro_id: string
  registro_label: string | null
  archivado_en: string
}

const ENTIDAD: Record<string, { label: string; icon: string; href: (id: string) => string }> = {
  crm_contacts:  { label: 'Contacto',  icon: '👤', href: id => `/admin/contactos?id=${id}` },
  crm_companies: { label: 'Empresa',   icon: '🏢', href: id => `/admin/empresas?id=${id}` },
  properties:    { label: 'Propiedad', icon: '🏠', href: id => `/admin/propiedades/${id}` },
}

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })

const th: React.CSSProperties = {
  textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8a909b', textTransform: 'uppercase',
  letterSpacing: '.04em', padding: '0 14px 10px', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = { padding: '13px 14px', fontSize: 13.5, color: '#0d0f12', borderTop: '1px solid #f0f1f4' }

export default function BitacoraPage() {
  const [filas, setFilas] = useState<Fila[]>([])
  const [loading, setLoading] = useState(true)
  const [agente, setAgente] = useState('')

  useEffect(() => {
    createClient()
      .from('agent_offboarding_log')
      .select('id, agent_name, agent_email, entidad, registro_id, registro_label, archivado_en')
      .order('archivado_en', { ascending: false })
      .then(({ data }) => { setFilas((data ?? []) as Fila[]); setLoading(false) })
  }, [])

  const agentes = [...new Set(filas.map(f => f.agent_name ?? '—'))]
  const visibles = agente ? filas.filter(f => (f.agent_name ?? '—') === agente) : filas

  return (
    <>
      <PageHeader
        title={<>Bitácora</>}
        subtitle={<>Fichas que creó cada agente que ya no está en la oficina.</>}
      />

      {loading ? (
        <div style={{ color: '#8a909b', fontSize: 13.5 }}>Cargando…</div>
      ) : filas.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #ececf0', borderRadius: 14, padding: '38px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🗂️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No hay nada registrado</div>
          <p style={{ fontSize: 12.5, color: '#8a909b', margin: 0, lineHeight: 1.6, maxWidth: 460, marginInline: 'auto' }}>
            Acá se anota, al eliminar a un agente, qué contactos, empresas y propiedades
            había creado. Esas fichas quedan sin dueño y solo las ve el administrador
            hasta que se reasignen.
          </p>
        </div>
      ) : (
        <>
          {agentes.length > 1 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
              {['', ...agentes].map(a => (
                <button key={a || 'todos'} onClick={() => setAgente(a)}
                  style={{
                    fontSize: 12, borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${agente === a ? '#111' : '#edeef1'}`,
                    background: agente === a ? '#111' : '#f7f8fa',
                    color: agente === a ? '#fff' : '#555',
                  }}>
                  {a || 'Todos'}
                </button>
              ))}
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #ececf0', borderRadius: 14, padding: '18px 6px 6px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  <th style={th}>Agente</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Ficha</th>
                  <th style={th}>Salida</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(f => {
                  const e = ENTIDAD[f.entidad]
                  return (
                    <tr key={f.id}>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{f.agent_name ?? '—'}</div>
                        {f.agent_email && <div style={{ fontSize: 11.5, color: '#8a909b' }}>{f.agent_email}</div>}
                      </td>
                      <td style={{ ...td, color: '#5a6070', whiteSpace: 'nowrap' }}>
                        {e ? `${e.icon} ${e.label}` : f.entidad}
                      </td>
                      <td style={td}>
                        {/* La ficha puede haberse borrado después; el enlace es
                            una comodidad, el dato que se audita es el nombre. */}
                        {e
                          ? <a href={e.href(f.registro_id)} style={{ color: '#0d0f12', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                              {f.registro_label ?? '(sin nombre)'}
                            </a>
                          : (f.registro_label ?? '(sin nombre)')}
                      </td>
                      <td style={{ ...td, color: '#8a909b', whiteSpace: 'nowrap' }}>{fecha(f.archivado_en)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 12, color: '#8a909b', marginTop: 14, lineHeight: 1.6 }}>
            {visibles.length} ficha{visibles.length === 1 ? '' : 's'} de {agente ? '1 agente' : `${agentes.length} agente${agentes.length === 1 ? '' : 's'}`}.
            Quedaron sin dueño al salir la persona: asignalas desde cada ficha.
          </p>
        </>
      )}
    </>
  )
}
