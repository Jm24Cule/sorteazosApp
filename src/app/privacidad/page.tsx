'use client'

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p style={{ color: '#71717a', fontSize: 14, marginBottom: 40 }}>Última actualización: junio 2025</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, color: '#a1a1aa', lineHeight: 1.7, fontSize: 15 }}>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>1. Quiénes somos</h2>
            <p>Sorteazos es una herramienta web gratuita para realizar sorteos en Instagram, disponible en <strong style={{color:'#f97316'}}>sorteazos-app.vercel.app</strong>. Ha sido desarrollada por Juan María García como proyecto personal sin ánimo de lucro.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>2. Datos que recopilamos</h2>
            <p><strong style={{color:'#fafafa'}}>No almacenamos ningún dato personal.</strong> Sorteazos procesa toda la información exclusivamente en el navegador del usuario y en memoria temporal del servidor durante la sesión activa.</p>
            <p style={{marginTop: 12}}>Cuando un usuario conecta su cuenta de Instagram mediante OAuth de Meta, obtenemos temporalmente:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Nombre de usuario de Instagram</li>
              <li>Nombre público del perfil</li>
              <li>Foto de perfil (URL pública)</li>
              <li>Token de acceso temporal (almacenado únicamente en sessionStorage del navegador del usuario)</li>
            </ul>
            <p style={{marginTop: 12}}>Estos datos <strong style={{color:'#fafafa'}}>nunca se envían a ninguna base de datos</strong>, no se comparten con terceros y se eliminan automáticamente al cerrar la sesión o el navegador.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>3. Uso de la API de Instagram / Meta</h2>
            <p>Sorteazos utiliza la API de Instagram Graph de Meta únicamente para:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Autenticar al usuario con su propia cuenta de Instagram</li>
              <li>Leer los comentarios de publicaciones propias del usuario autenticado</li>
            </ul>
            <p style={{marginTop: 12}}>En ningún caso accedemos a cuentas de terceros, mensajes privados, datos de seguidores ni cualquier otra información más allá de la estrictamente necesaria para el funcionamiento del sorteo.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>4. Cookies</h2>
            <p>Sorteazos no utiliza cookies de seguimiento ni analítica. No hay publicidad ni rastreo de ningún tipo.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>5. Servicios de terceros</h2>
            <p>La aplicación está alojada en <strong style={{color:'#fafafa'}}>Vercel</strong> y utiliza la <strong style={{color:'#fafafa'}}>API de Meta/Instagram</strong> para la autenticación. Consulta sus respectivas políticas de privacidad:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{color:'#f97316'}}>Política de privacidad de Vercel</a></li>
              <li><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" style={{color:'#f97316'}}>Política de privacidad de Meta</a></li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>6. Derechos del usuario</h2>
            <p>Dado que no almacenamos datos personales, no hay datos que eliminar o exportar. Si tienes alguna duda, puedes contactarnos en:</p>
            <p style={{marginTop: 8}}><a href="mailto:jm24cule@gmail.com" style={{color:'#f97316'}}>jm24cule@gmail.com</a></p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>7. Eliminación de datos</h2>
            <p>Si has autorizado a Sorteazos a acceder a tu cuenta de Instagram y deseas revocar ese acceso, puedes hacerlo directamente desde la configuración de tu cuenta de Instagram en <strong style={{color:'#fafafa'}}>Configuración → Seguridad → Apps y sitios web autorizados</strong>.</p>
          </section>

          <section>
            <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>8. Cambios en esta política</h2>
            <p>Podemos actualizar esta política ocasionalmente. La fecha de última actualización siempre aparecerá al inicio de esta página.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
