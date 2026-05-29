'use client'

const PILLARS = [
  { icon: '🏆', label: 'Profesionalismo' },
  { icon: '🤖', label: 'Tecnología' },
  { icon: '✅', label: 'Precalificación' },
  { icon: '📣', label: 'Mercadeo moderno' },
  { icon: '🤝', label: 'Experiencia humana' },
]

const STATS = [
  { num: '+30',  label: 'Agentes activos' },
  { num: '#1',   label: 'Team en el este de San José' },
  { num: '100%', label: 'Respaldo RE/MAX' },
]

export default function NosotrosClientSunrise() {
  return (
    <div style={{ paddingTop: 'var(--nav-h,68px)', fontFamily: 'var(--font-body,system-ui,sans-serif)' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(36px,4vw,56px) clamp(24px,3vw,48px) clamp(44px,5vw,68px)',
        maxWidth: 1440, margin: '0 auto',
      }}>
        <div style={{ maxWidth: 860 }}>
            <h1 style={{
            fontFamily: 'var(--font-heading,serif)',
            fontSize: 'clamp(52px,7vw,88px)',
            fontWeight: 900, lineHeight: .93,
            letterSpacing: '-.03em', marginBottom: 36,
          }}>
            Bienes raíces{' '}
            <span style={{
              background: 'linear-gradient(90deg,var(--primary,#6b2fa0),#D44E2A,#E8920A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>de personas.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px,1.8vw,20px)', fontWeight: 300,
            color: '#888480', lineHeight: 1.7, marginBottom: 0, maxWidth: 780,
          }}>
            En Sunrise creemos que los bienes raíces se tratan de personas, estrategia y resultados.
            Somos un team de RE/MAX Central especializado en la zona este de San José, enfocado en
            brindar una experiencia profesional, cercana y respaldada por conocimiento real del mercado.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap', marginTop: 56, paddingTop: 44, borderTop: '1px solid #e8e4df' }}>
          {STATS.map(({ num, label }) => (
            <div key={label}>
              <div style={{
                fontFamily: 'var(--font-heading,serif)',
                fontSize: 44, fontWeight: 700, lineHeight: 1,
                letterSpacing: '-.02em', color: '#111',
              }}>{num}</div>
              <div style={{ fontSize: 12, color: '#888480', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 6 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESCRIPCIÓN ──────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(44px,5vw,68px) clamp(24px,3vw,48px)',
        maxWidth: 1440, margin: '0 auto',
        borderTop: '1px solid #e8e4df',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--primary,#6b2fa0)', marginBottom: 16, marginTop: 0 }}>
              Cómo trabajamos
            </p>
            <h2 style={{
              fontFamily: 'var(--font-heading,serif)',
              fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700,
              lineHeight: 1.15, letterSpacing: '-.02em', color: '#111',
              margin: '0 0 24px',
            }}>
              Tecnología, proceso y acompañamiento real.
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.75, margin: 0 }}>
              Combinamos experiencia inmobiliaria, mercadeo digital, fotografía profesional y herramientas
              de inteligencia artificial para posicionar propiedades de forma efectiva y acompañar a
              nuestros clientes en cada paso del proceso.
            </p>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.75, margin: 0 }}>
              Trabajamos con procesos claros y organizados, precalificando cada etapa de la operación,
              tanto para vendedores como compradores, asegurando negociaciones más serias, eficientes
              y seguras para todas las partes.
            </p>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.75, margin: 0 }}>
              Ya sea para comprar, vender o alquilar, en Sunrise trabajamos con compromiso, transparencia
              y atención personalizada para lograr resultados reales.
            </p>
          </div>
        </div>
      </section>

      {/* ── MISIÓN & VISIÓN ──────────────────────────────────── */}
      <section style={{
        padding: 'clamp(44px,5vw,68px) clamp(24px,3vw,48px)',
        maxWidth: 1440, margin: '0 auto',
        borderTop: '1px solid #e8e4df',
      }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--primary,#6b2fa0)', marginBottom: 14, textAlign: 'center', marginTop: 0 }}>
          Propósito
        </p>
        <h2 style={{
          fontFamily: 'var(--font-heading,serif)',
          fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 700,
          lineHeight: 1.1, letterSpacing: '-.02em',
          marginBottom: 48, textAlign: 'center', marginTop: 0,
        }}>
          Lo que nos mueve.
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 2, background: '#e8e4df',
          border: '1px solid #e8e4df', borderRadius: 20, overflow: 'hidden',
        }}>
          {/* Misión */}
          <div style={{ background: '#111', padding: 'clamp(32px,4vw,52px)' }}>
            <div style={{
              fontFamily: 'var(--font-heading,serif)',
              fontSize: 'clamp(52px,6vw,72px)', fontWeight: 900, lineHeight: .9,
              letterSpacing: '-.03em', color: 'rgba(255,255,255,.08)',
              marginBottom: 24,
            }}>Misión</div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', lineHeight: 1.75, margin: 0 }}>
              Brindar un servicio inmobiliario profesional, estratégico y humano, acompañando a nuestros
              clientes en cada etapa del proceso de compra, venta o alquiler. En Sunrise trabajamos con
              transparencia, innovación y conocimiento del mercado, utilizando herramientas digitales,
              inteligencia artificial y procesos de precalificación para generar negociaciones seguras,
              eficientes y orientadas a resultados.
            </p>
          </div>

          {/* Visión */}
          <div style={{ background: '#fff', padding: 'clamp(32px,4vw,52px)' }}>
            <div style={{
              fontFamily: 'var(--font-heading,serif)',
              fontSize: 'clamp(52px,6vw,72px)', fontWeight: 900, lineHeight: .9,
              letterSpacing: '-.03em', color: 'rgba(0,0,0,.05)',
              marginBottom: 24,
            }}>Visión</div>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.75, margin: 0 }}>
              Ser el team inmobiliario líder de la zona este de San José, reconocido por su
              profesionalismo, innovación y excelencia en el servicio, transformando la experiencia
              inmobiliaria mediante tecnología, mercadeo de alto nivel y un acompañamiento cercano
              que genere confianza y crecimiento para nuestros clientes y asesores.
            </p>
          </div>
        </div>
      </section>

      {/* ── PILARES ──────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(44px,5vw,68px) clamp(24px,3vw,48px) clamp(64px,6vw,88px)',
        maxWidth: 1440, margin: '0 auto',
        borderTop: '1px solid #e8e4df',
      }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--primary,#6b2fa0)', marginBottom: 14, textAlign: 'center', marginTop: 0 }}>
          Nuestros pilares
        </p>
        <h2 style={{
          fontFamily: 'var(--font-heading,serif)',
          fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 700,
          lineHeight: 1.1, letterSpacing: '-.02em',
          marginBottom: 48, textAlign: 'center', marginTop: 0,
        }}>
          Lo que nos define.
        </h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {PILLARS.map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: '1.5px solid #e8e4df',
              borderRadius: 100, padding: '14px 24px',
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{
                fontFamily: 'var(--font-heading,serif)',
                fontSize: 16, fontWeight: 700, color: '#111', letterSpacing: '-.01em',
              }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
