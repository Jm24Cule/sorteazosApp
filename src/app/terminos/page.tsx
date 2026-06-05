'use client'

export default function TerminosPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1c1c1e',
      color: '#fafafa',
      fontFamily: "'Syne', sans-serif",
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <a href="/sorteo" style={{ color: '#f97316', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← Volver a Sorteazos
        </a>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, marginBottom: 8, background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Términos y Condiciones
        </h1>
        <p style={{ color: '#71717a', fontSize: 14, marginBottom: 40 }}>Última actualización: junio 2025</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, color: '#a1a1aa', lineHeight: 1.7, fontSize: 15 }}>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>1. Aceptación de los términos</h2>
            <p>Al usar Sorteazos aceptas estos términos. Si no estás de acuerdo, no uses la aplicación.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>2. Descripción del servicio</h2>
            <p>Sorteazos es una herramienta gratuita de selección aleatoria para sorteos en Instagram. No está afiliada, patrocinada ni respaldada por Instagram o Meta Platforms.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>3. Uso permitido</h2>
            <p>Sorteazos está diseñado para que los propietarios de cuentas de Instagram organicen sorteos entre los comentarios de sus propias publicaciones. Queda prohibido:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Usar la app para acceder a cuentas de terceros sin su consentimiento</li>
              <li>Manipular resultados del sorteo</li>
              <li>Usar la app con fines fraudulentos o ilegales</li>
              <li>Realizar sorteos que incumplan las políticas de Instagram o la legislación vigente</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>4. Aleatoriedad y transparencia</h2>
            <p>El ganador se selecciona mediante un algoritmo de selección aleatoria aplicado sobre los comentarios que cumplen los requisitos definidos por el organizador. Sorteazos no garantiza ningún resultado específico ni puede ser responsabilizado por la percepción de imparcialidad de los participantes.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>5. Responsabilidad del organizador</h2>
            <p>El organizador del sorteo es el único responsable de:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Definir y comunicar claramente las bases del sorteo</li>
              <li>Verificar que el ganador cumple todos los requisitos</li>
              <li>Entregar el premio en los términos prometidos</li>
              <li>Cumplir con la legislación aplicable sobre sorteos y promociones</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>6. Limitación de responsabilidad</h2>
            <p>Sorteazos se proporciona "tal cual", sin garantías de ningún tipo. No nos responsabilizamos de interrupciones del servicio, pérdida de datos, errores en la selección debidos a datos incorrectos introducidos por el usuario, ni de ningún daño derivado del uso de la aplicación.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>7. Disponibilidad</h2>
            <p>Sorteazos es un servicio gratuito que puede interrumpirse, modificarse o cerrarse en cualquier momento sin previo aviso.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>8. Contacto</h2>
            <p>Para cualquier consulta: <a href="mailto:jm24cule@gmail.com" style={{color:'#f97316'}}>jm24cule@gmail.com</a></p>
          </section>

        </div>
      </div>
    </div>
  )
}
