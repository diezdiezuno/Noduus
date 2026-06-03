'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

// ── Nav structure ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    key:   'sitio',
    label: 'Sitio web',
    icon:  '🌐',
    items: [
      { href: '/admin/general',     icon: '⚙️', label: 'General'     },
      { href: '/admin/mapa',        icon: '🗺️', label: 'Mapa'        },
      { href: '/admin/propiedades', icon: '🏠', label: 'Propiedades'  },
      { href: '/admin/paginas',     icon: '📄', label: 'Páginas'      },
      { href: '/admin/fuentes',     icon: '🔗', label: 'Fuentes'      },
      { href: '/admin/agentes',     icon: '👥', label: 'Agentes'      },
      { href: '/admin/seo',         icon: '🔍', label: 'SEO'          },
    ],
  },
  {
    key:   'crm',
    label: 'CRM',
    icon:  '🗂️',
    items: [
      { href: '/admin/inventario', icon: '🏘️', label: 'Inventario' },
      { href: '/admin/clientes',   icon: '👤', label: 'Clientes'   },
      { href: '/admin/empresas',   icon: '🏢', label: 'Empresas'   },
      { href: '/admin/leads',      icon: '📬', label: 'Leads'      },
    ],
  },
]

const NAV_STANDALONE = [
  { href: '/admin/metricas',      icon: '📊', label: 'Métricas'      },
  { href: '/admin/reclutamiento', icon: '🤝', label: 'Reclutamiento' },
]

// ── Types ─────────────────────────────────────────────────────
interface Tenant { id: string; name: string; slug: string; logo_url: string | null; theme: Record<string, string> }
interface Props   { tenant: Tenant; userEmail: string; children: React.ReactNode }

// ── Component ─────────────────────────────────────────────────
export default function AdminShell({ tenant, userEmail, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  // Collapsed state — keys match NAV_GROUPS[].key. true = collapsed.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Auto-expand the group that contains the active route
  useEffect(() => {
    for (const group of NAV_GROUPS) {
      const hasActive = group.items.some(item => pathname.startsWith(item.href))
      if (hasActive) {
        setCollapsed(prev => ({ ...prev, [group.key]: false }))
      }
    }
  }, [pathname])

  function toggle(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f7', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{
        width: 216, background: '#fff', borderRight: '1px solid #ebebeb',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 300,
      }}>

        {/* Brand */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #f0f0f0' }}>
          {tenant.logo_url && (
            <img src={tenant.logo_url} alt="" style={{ height: 28, objectFit: 'contain', marginBottom: 8, display: 'block' }} />
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>{tenant.name}</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>Panel de administración</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0 12px', overflowY: 'auto' }}>

          {/* ── Grouped sections ───────────────────────── */}
          {NAV_GROUPS.map(group => {
            const isOpen       = !collapsed[group.key]
            const hasActive    = group.items.some(item => pathname.startsWith(item.href))

            return (
              <div key={group.key} style={{ marginBottom: 4 }}>

                {/* Group header */}
                <button
                  onClick={() => toggle(group.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 20px 7px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13 }}>{group.icon}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      color: hasActive ? '#111' : '#999',
                    }}>
                      {group.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 9, color: '#bbb',
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform .15s',
                    display: 'inline-block',
                  }}>
                    ▼
                  </span>
                </button>

                {/* Group items */}
                {isOpen && (
                  <div>
                    {group.items.map(({ href, icon, label }) => {
                      const active = pathname.startsWith(href)
                      return (
                        <a key={href} href={href} style={{
                          display: 'flex', alignItems: 'center', gap: 9,
                          padding: '8px 20px 8px 28px',
                          textDecoration: 'none', fontSize: 13,
                          color: active ? '#111' : '#666',
                          background: active ? '#f5f5f7' : 'transparent',
                          fontWeight: active ? 600 : 400,
                          borderLeft: `3px solid ${active ? '#111' : 'transparent'}`,
                          transition: 'background .1s',
                        }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '#fafafa' }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                        >
                          <span style={{ fontSize: 14 }}>{icon}</span>
                          {label}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Divider ─────────────────────────────────── */}
          <div style={{ height: 1, background: '#f0f0f0', margin: '8px 16px' }} />

          {/* ── Standalone items ────────────────────────── */}
          {NAV_STANDALONE.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <a key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 20px',
                textDecoration: 'none', fontSize: 13,
                color: active ? '#111' : '#666',
                background: active ? '#f5f5f7' : 'transparent',
                fontWeight: active ? 600 : 400,
                borderLeft: `3px solid ${active ? '#111' : 'transparent'}`,
                transition: 'background .1s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '#fafafa' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                {label}
              </a>
            )
          })}

        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userEmail}
          </div>
          <a href="/" target="_blank" style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6, textDecoration: 'none' }}>
            Ver sitio →
          </a>
          <button onClick={signOut} style={{ fontSize: 12, color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main style={{ marginLeft: 216, flex: 1, padding: '36px 44px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100 }}>
          {children}
        </div>
      </main>

      {/* ── Global "+" button ───────────────────────────────────── */}
      <a
        href="/admin/clientes?new=1"
        title="Nuevo cliente"
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 48, height: 48, borderRadius: '50%',
          background: '#111', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,.25)',
          zIndex: 200, lineHeight: 1,
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.08)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(0,0,0,.32)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.25)'
        }}
      >
        +
      </a>
    </div>
  )
}
