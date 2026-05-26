'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useFilters, USD_STEPS, CRC_STEPS, stepToPrice, fmtPrice } from '@/contexts/FilterContext'
import type { Tenant } from '@/types'

const PROPERTY_TYPES = [
  { value: '', label: 'Todas' },
  { value: 'Casa', label: 'Casa / Villa' },
  { value: 'Apto', label: 'Apto / Condo' },
  { value: 'Lote', label: 'Lote / Terreno' },
  { value: 'Multifamiliar', label: 'Multifamiliar' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Oficina', label: 'Oficina' },
  { value: 'Bodega', label: 'Bodega' },
]

interface NavProps {
  tenant: Tenant | null
}

export default function Nav({ tenant }: NavProps) {
  const f = useFilters()
  const [advOpen, setAdvOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const steps = f.currency === 'CRC' ? CRC_STEPS : USD_STEPS
  const pMin = stepToPrice(f.priceMinStep, steps)
  const pMax = stepToPrice(f.priceMaxStep, steps)
  const isMax = f.isMaxPrice()
  const maxLabel = f.currency === 'CRC' ? '₡1B+' : '$5M+'

  // Update --nav-h whenever nav size changes
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const update = () => document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px')
    update()
    const ro = new ResizeObserver(update)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [])

  // Compact on scroll
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  function handleMin(v: number) {
    f.setPriceRange(Math.min(v, f.priceMaxStep - 1), f.priceMaxStep)
  }
  function handleMax(v: number) {
    f.setPriceRange(f.priceMinStep, Math.max(v, f.priceMinStep + 1))
  }

  return (
    <nav
      ref={navRef}
      id="main-nav"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
        background: '#fff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        flexWrap: 'wrap', alignContent: 'flex-start',
        padding: compact ? '0 24px' : '8px 16px 0',
        columnGap: 8, rowGap: 0,
        transition: 'padding .2s',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', padding: '0 20px 0 8px', flexShrink: 0, alignSelf: 'center', textDecoration: 'none', minWidth: 120 }}>
        {tenant?.logo_url ? (
          <img src={tenant.logo_url} alt={tenant.name} style={{ height: compact ? 32 : 34, objectFit: 'contain', transition: 'height .2s' }} />
        ) : (
          <span style={{ fontWeight: 800, fontSize: 16, color: '#111', letterSpacing: '-.02em' }}>{tenant?.name ?? 'PropCLOUD'}</span>
        )}
      </Link>

      {/* Center */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <NavTab active={f.tab === 'sale'} onClick={() => f.setTab('sale')} compact={compact} icon={<HouseIcon size={compact ? 16 : 20} />} label="Compra" />
          <NavTab active={f.tab === 'rent'} onClick={() => f.setTab('rent')} compact={compact} icon={<KeyIcon size={compact ? 16 : 20} />} label="Alquiler" />
        </div>

        <NavSep />

        {/* Price slider */}
        <div style={{ minWidth: 160, maxWidth: 300, flex: 1, padding: '0 12px', marginTop: compact ? 0 : 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Precio</span>
              {/* Currency toggle */}
              <div style={{ display: 'flex', background: '#efefef', borderRadius: 10, padding: 2, gap: 1 }}>
                {(['USD', 'CRC'] as const).map(c => (
                  <button key={c} onClick={() => f.setCurrency(c)} style={{
                    padding: '1px 7px', border: 'none',
                    background: f.currency === c ? '#fff' : 'transparent',
                    borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    color: f.currency === c ? '#111' : '#999', fontFamily: 'inherit',
                    boxShadow: f.currency === c ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all .15s',
                  }}>
                    {c === 'USD' ? 'USD $' : 'CRC ₡'}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
              {fmtPrice(pMin, f.currency)} — {isMax ? maxLabel : fmtPrice(pMax, f.currency)}
            </span>
          </div>
          {/* Dual range */}
          <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: '#ddd', borderRadius: 2 }} />
            <div style={{
              position: 'absolute',
              left: f.priceMinStep + '%',
              width: (f.priceMaxStep - f.priceMinStep) + '%',
              height: 3,
              background: 'linear-gradient(90deg, var(--accent, #f5a623), var(--primary, #6b2fa0))',
              borderRadius: 2,
            }} />
            <input type="range" min={0} max={100} value={f.priceMinStep}
              onChange={e => handleMin(Number(e.target.value))}
              style={{ position: 'absolute', width: '100%' }} />
            <input type="range" min={0} max={100} value={f.priceMaxStep}
              onChange={e => handleMax(Number(e.target.value))}
              style={{ position: 'absolute', width: '100%' }} />
          </div>
        </div>

        <NavSep />

        {/* Filtros */}
        <button
          onClick={() => setAdvOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid #ddd', borderRadius: 22,
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', marginLeft: 4,
            boxShadow: advOpen ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
            transition: 'box-shadow .2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Filtros <span style={{ fontSize: 10 }}>{advOpen ? '▴' : '▾'}</span>
        </button>
      </div>

      {/* Right: menu */}
      <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative', minWidth: 60, justifyContent: 'flex-end' }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            width: 40, height: 40, background: '#fff', border: '1px solid #ddd',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16, transition: 'box-shadow .2s',
          }}
        >
          ☰
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: 220,
            zIndex: 10001, padding: 8, animation: 'dropdownFade .18s ease',
          }}>
            {[
              { href: '/listings', icon: '🏠', label: 'Propiedades' },
              { href: '/about', icon: '👥', label: 'Nosotros' },
              { href: '/contact', icon: '✉️', label: 'Contacto' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', color: '#222', fontSize: 14, fontWeight: 500, borderRadius: 8, transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#f7f7f7'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Advanced search panel */}
      <div style={{
        flexBasis: '100%', width: '100%', order: 10,
        background: '#fafafa',
        maxHeight: advOpen ? 500 : 0,
        overflow: 'hidden',
        padding: advOpen ? '16px 24px' : '0 24px',
        borderTop: advOpen ? '1px solid #ebebeb' : '0px solid #ebebeb',
        transition: 'max-height .35s cubic-bezier(0.4,0,0.2,1), padding .35s',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end', marginBottom: 12 }}>
          <AdvField label="Palabra clave">
            <input value={f.keyword} onChange={e => f.setKeyword(e.target.value)}
              placeholder="Ej: piscina, condominio..." style={advInput} />
          </AdvField>
          <AdvField label="Cuartos">
            <select value={f.minBeds} onChange={e => f.setMinBeds(Number(e.target.value))} style={advInput}>
              <option value={0}>Cualquiera</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
            </select>
          </AdvField>
          <AdvField label="Baños">
            <select value={f.minBaths} onChange={e => f.setMinBaths(Number(e.target.value))} style={advInput}>
              <option value={0}>Cualquiera</option>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+</option>)}
            </select>
          </AdvField>
          <button
            onClick={f.resetFilters}
            style={{ padding: '8px 12px', background: 'none', border: '1px solid #ddd', borderRadius: 5, fontSize: 12, color: '#999', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', alignSelf: 'flex-end', height: 35 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary,#6b2fa0)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary,#6b2fa0)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ddd'; (e.currentTarget as HTMLButtonElement).style.color = '#999' }}
          >
            ✕ Limpiar
          </button>
        </div>

        {/* Property type chips */}
        <div style={{ paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
            Tipo de Propiedad
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PROPERTY_TYPES.map(t => (
              <button key={t.value} onClick={() => f.setPropertyType(t.value)} style={{
                padding: '7px 14px',
                background: f.propertyType === t.value ? '#1a1a1a' : '#f7f7f7',
                border: `1px solid ${f.propertyType === t.value ? '#1a1a1a' : '#e8e8e8'}`,
                borderRadius: 24, fontSize: 13, fontFamily: 'inherit',
                color: f.propertyType === t.value ? '#fff' : '#444',
                cursor: 'pointer', fontWeight: f.propertyType === t.value ? 500 : 400,
                transition: 'all .2s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavSep() {
  return <div style={{ width: 1, height: 36, background: '#e0e0e0', flexShrink: 0, margin: '0 4px' }} />
}

function NavTab({ active, onClick, compact, icon, label }: { active: boolean; onClick: () => void; compact: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      padding: compact ? '8px 16px' : '14px 26px',
      background: 'none', border: 'none',
      borderBottom: `1px solid ${active ? '#aaa' : 'transparent'}`,
      cursor: 'pointer', color: active ? '#1a1a1a' : '#bbb',
      fontFamily: 'inherit', outline: 'none',
      transition: 'color .25s',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#666' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = active ? '#1a1a1a' : '#bbb' }}
    >
      {icon}
      <span style={{ fontSize: '9.5px', fontWeight: 400, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{label}</span>
    </button>
  )
}

function AdvField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#999', marginBottom: 5, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}

const advInput: React.CSSProperties = {
  width: '100%', padding: '8px 11px', border: '1px solid #ddd', borderRadius: 5,
  fontSize: 13, fontFamily: 'inherit', background: '#fafafa', outline: 'none',
  color: '#111',
}

function HouseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function KeyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="M11 15.5h9" />
      <path d="M17 12.5V9l-3 2.5" />
      <path d="M20 12.5V9" />
    </svg>
  )
}
