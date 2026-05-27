'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useFilters, USD_STEPS, CRC_STEPS, stepToPrice, fmtPrice } from '@/contexts/FilterContext'
import type { ZoneCenter } from '@/contexts/FilterContext'
import { useIsMobile } from '@/hooks/useIsMobile'
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

// Zone pills: [display label, search term, optional fixed center [lng, lat, zoom]]
const ZONES: [string, string, ZoneCenter?][] = [
  ['Curridabat', 'Curridabat'],
  ['Tres Ríos', 'La union'],
  ['San Pedro', 'Montes de Oca'],
  ['Escalante', 'Escalante', [-84.06344934624333, 9.936704621817613, 15]],
  ['Tibás', 'Tibas'],
  ['Moravia', 'Moravia'],
  ['Coronado', 'Coronado'],
  ['Escazú', 'Escazu'],
  ['Santa Ana', 'Santa Ana'],
  ['Rohrmoser', 'Pavas'],
  ['Nunciatura', 'Nunciatura', [-84.10319412103462, 9.936022992526121, 15]],
  ['La Garita', 'La Garita'],
  ['Cartago', 'Cartago'],
  ['Heredia', 'Heredia'],
  ['Alajuela', 'Alajuela'],
]

interface NavProps { tenant: Tenant | null }

export default function Nav({ tenant }: NavProps) {
  const f = useFilters()
  const isMobile = useIsMobile(768)
  const [advOpen, setAdvOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const steps = f.currency === 'CRC' ? CRC_STEPS : USD_STEPS
  const pMin = stepToPrice(f.priceMinStep, steps)
  const pMax = stepToPrice(f.priceMaxStep, steps)
  const isMax = f.isMaxPrice()
  const maxLabel = f.currency === 'CRC' ? '₡1B+' : '$5M+'

  // Contar filtros activos (para el badge del botón)
  const activeFilters = [
    f.tab !== 'sale',
    f.priceMinStep > 0,
    f.priceMaxStep < 100,
    f.minBeds > 0,
    f.minBaths > 0,
    f.propertyType !== '',
    f.keyword !== '',
    f.zone !== '',
  ].filter(Boolean).length

  // Update --nav-h
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

  // Close mobile filter on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileFilterOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleMin(v: number) {
    f.setPriceRange(Math.min(v, f.priceMaxStep - 1), f.priceMaxStep)
  }
  function handleMax(v: number) {
    f.setPriceRange(f.priceMinStep, Math.max(v, f.priceMinStep + 1))
  }

  // ── MOBILE NAV ──────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <nav ref={navRef} style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
          background: '#fff', borderBottom: '1px solid #e0e0e0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 56,
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} style={{ height: 30, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontWeight: 800, fontSize: 16, color: '#111', letterSpacing: '-.02em' }}>{tenant?.name ?? 'PropCLOUD'}</span>
            )}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Filtros button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: activeFilters > 0 ? '#1a1a1a' : '#fff',
                border: `1px solid ${activeFilters > 0 ? '#1a1a1a' : '#ddd'}`,
                borderRadius: 22, padding: '7px 14px', fontSize: 13,
                fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                color: activeFilters > 0 ? '#fff' : '#333',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filtros
              {activeFilters > 0 && (
                <span style={{ background: 'var(--accent,#f5a623)', color: '#111', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ width: 36, height: 36, background: '#fff', border: '1px solid #ddd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15 }}
              >
                ☰
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: 200,
                  zIndex: 10001, padding: 8, animation: 'dropdownFade .18s ease',
                }}>
                  {[
                    { href: '/listings', icon: '🏠', label: 'Propiedades' },
                    { href: '/about', icon: '👥', label: 'Nosotros' },
                    { href: '/contact', icon: '✉️', label: 'Contacto' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', color: '#222', fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                    >
                      <span>{item.icon}</span> {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile filter drawer */}
        {mobileFilterOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileFilterOpen(false)}
          >
            <div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: '#fff', borderRadius: '20px 20px 0 0',
                padding: '0 0 32px',
                maxHeight: '90vh', overflowY: 'auto',
                animation: 'slideUp .25s cubic-bezier(0.4,0,0.2,1)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
                <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Filtros</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  {activeFilters > 0 && (
                    <button onClick={f.resetFilters} style={{ fontSize: 12, color: '#999', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✕ Limpiar
                    </button>
                  )}
                  <button onClick={() => setMobileFilterOpen(false)} style={{ fontSize: 12, fontWeight: 600, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Aplicar
                  </button>
                </div>
              </div>

              <div style={{ padding: '20px 20px 0' }}>

                {/* Tabs */}
                <div style={{ marginBottom: 24 }}>
                  <FilterLabel>Tipo de transacción</FilterLabel>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: 'sale', l: 'Compra' }, { v: 'rent', l: 'Alquiler' }].map(t => (
                      <button key={t.v} onClick={() => f.setTab(t.v as 'sale' | 'rent')} style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${f.tab === t.v ? '#1a1a1a' : '#e0e0e0'}`,
                        background: f.tab === t.v ? '#1a1a1a' : '#fff',
                        color: f.tab === t.v ? '#fff' : '#555',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>{t.l}</button>
                    ))}
                  </div>
                </div>

                {/* Currency + price */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <FilterLabel>Precio</FilterLabel>
                    <div style={{ display: 'flex', background: '#efefef', borderRadius: 10, padding: 2, gap: 1 }}>
                      {(['USD', 'CRC'] as const).map(c => (
                        <button key={c} onClick={() => f.setCurrency(c)} style={{
                          padding: '3px 10px', border: 'none',
                          background: f.currency === c ? '#fff' : 'transparent',
                          borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          color: f.currency === c ? '#111' : '#999', fontFamily: 'inherit',
                          boxShadow: f.currency === c ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                        }}>
                          {c === 'USD' ? 'USD $' : 'CRC ₡'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10, textAlign: 'center' }}>
                    {fmtPrice(pMin, f.currency)} — {isMax ? maxLabel : fmtPrice(pMax, f.currency)}
                  </div>
                  <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: '#ddd', borderRadius: 2 }} />
                    <div style={{ position: 'absolute', left: f.priceMinStep + '%', width: (f.priceMaxStep - f.priceMinStep) + '%', height: 3, background: 'linear-gradient(90deg, var(--accent, #f5a623), var(--primary, #6b2fa0))', borderRadius: 2 }} />
                    <input type="range" min={0} max={100} value={f.priceMinStep} onChange={e => handleMin(Number(e.target.value))} style={{ position: 'absolute', width: '100%' }} />
                    <input type="range" min={0} max={100} value={f.priceMaxStep} onChange={e => handleMax(Number(e.target.value))} style={{ position: 'absolute', width: '100%' }} />
                  </div>
                </div>

                {/* Keyword */}
                <div style={{ marginBottom: 20 }}>
                  <FilterLabel>Palabra clave</FilterLabel>
                  <input value={f.keyword} onChange={e => f.setKeyword(e.target.value)}
                    placeholder="Ej: piscina, condominio..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Beds / Baths */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div>
                    <FilterLabel>Cuartos mín.</FilterLabel>
                    <select value={f.minBeds} onChange={e => f.setMinBeds(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fafafa' }}>
                      <option value={0}>Cualquiera</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <FilterLabel>Baños mín.</FilterLabel>
                    <select value={f.minBaths} onChange={e => f.setMinBaths(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fafafa' }}>
                      <option value={0}>Cualquiera</option>
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                </div>

                {/* Property type chips */}
                <div style={{ marginBottom: 20 }}>
                  <FilterLabel>Tipo de propiedad</FilterLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {PROPERTY_TYPES.map(t => (
                      <button key={t.value} onClick={() => f.setPropertyType(t.value)} style={{
                        padding: '8px 14px', borderRadius: 24, fontSize: 13, fontFamily: 'inherit',
                        background: f.propertyType === t.value ? '#1a1a1a' : '#f7f7f7',
                        border: `1px solid ${f.propertyType === t.value ? '#1a1a1a' : '#e8e8e8'}`,
                        color: f.propertyType === t.value ? '#fff' : '#444',
                        cursor: 'pointer', fontWeight: f.propertyType === t.value ? 500 : 400,
                      }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zone pills */}
                <div style={{ marginBottom: 8 }}>
                  <FilterLabel>Zona</FilterLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ZONES.map(([label, search, center]) => {
                      const active = f.zone === search
                      return (
                        <button key={search} onClick={() => f.setZone(active ? '' : search, active ? undefined : center)} style={{
                          padding: '8px 14px', borderRadius: 24, fontSize: 13, fontFamily: 'inherit',
                          background: active ? '#1a1a1a' : '#f7f7f7',
                          border: `1px solid ${active ? '#1a1a1a' : '#e8e8e8'}`,
                          color: active ? '#fff' : '#444',
                          cursor: 'pointer', fontWeight: active ? 500 : 400,
                        }}>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
      </>
    )
  }

  // ── DESKTOP NAV ─────────────────────────────────────────────────────────────
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

        <div style={{ paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
            Zona
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ZONES.map(([label, search, center]) => {
              const active = f.zone === search
              return (
                <button key={search} onClick={() => f.setZone(active ? '' : search, active ? undefined : center)} style={{
                  padding: '7px 14px',
                  background: active ? '#1a1a1a' : '#f7f7f7',
                  border: `1px solid ${active ? '#1a1a1a' : '#e8e8e8'}`,
                  borderRadius: 24, fontSize: 13, fontFamily: 'inherit',
                  color: active ? '#fff' : '#444',
                  cursor: 'pointer', fontWeight: active ? 500 : 400,
                  transition: 'all .2s',
                }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>{children}</div>
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
