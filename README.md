# 🎁 Sorteazos

Herramienta gratuita para hacer sorteos en Instagram. Sin registro, sin límites, sin suscripción.

**🌐 Web:** [sorteazos.es](https://sorteazos.es)

---

## ✨ Características

- **Login con Instagram** — el usuario conecta su propia cuenta via OAuth de Meta
- **Carga automática de comentarios** — pega la URL de tu post y se cargan solos
- **Filtros configurables** — menciones mínimas, hashtags, palabras clave, excluir duplicados
- **Requisitos declarativos** — seguir una cuenta, dar like (checklist de verificación manual al mostrar ganador)
- **Reroll instantáneo** — si el ganador no cumple las bases, nuevo ganador sin repetir
- **Modo claro/oscuro**
- **Sin almacenamiento de datos** — todo se procesa en el navegador y en sesión temporal

---

## 🛠 Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **Meta Graph API** (OAuth + Instagram comments)
- **Deploy:** Vercel
- **Dominio:** PiensaSolutions

---

## 🚀 Deploy

### Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_URL` | URL base de la app, ej: `https://sorteazos.es` |
| `META_APP_ID` | App ID de Meta Developers |
| `META_APP_SECRET` | App Secret de Meta Developers |
| `INSTAGRAM_TOKEN` | Token de Instagram (legacy, no necesario con OAuth) |
| `INSTAGRAM_USER_ID` | User ID de Instagram (legacy, no necesario con OAuth) |

### Desarrollo local

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local
# Edita .env.local con tus variables
npm run dev
```

---

## 🔑 Configuración de Meta Developers

### App: Sorteazos (`1520020703240602`)

**Configuración → Básica:**
- Dominio: `sorteazos.es`
- Política de privacidad: `https://sorteazos.es/privacidad`
- Términos: `https://sorteazos.es/terminos`
- Categoría: Utilidad y productividad

**Inicio de sesión con Facebook → Configuración:**
- URI OAuth válido: `https://sorteazos.es/api/auth/callback`
- Dominio SDK: `sorteazos.es`

**Permisos solicitados:**
- `instagram_business_basic`
- `instagram_business_manage_comments`
- `pages_show_list`

**Estado:** En proceso de revisión para acceso avanzado.

---

## 📁 Estructura

```
src/
  app/
    page.tsx                      # Raíz → renderiza sorteo directamente
    sorteo/page.tsx               # UI principal del sorteo
    privacidad/page.tsx           # Política de privacidad
    terminos/page.tsx             # Términos y condiciones
    api/
      auth/
        instagram/route.ts        # Inicia flujo OAuth con Meta
        callback/route.ts         # Recibe token y redirige con sesión
      comments/route.ts           # Carga comentarios via Graph API
    auth/
      callback/page.tsx           # Página intermedia del callback OAuth
public/
  logo.svg                        # Logo SVG
  apple-touch-icon.png            # Icono iOS 180x180
  icon-1024.png                   # Icono Meta Developers 1024x1024
  juan.jpeg                       # Foto de perfil @jagarcia95
  nana.png                        # Foto de perfil @la_nana_de_nala
```

---

## 🎥 Vídeo para revisión de Meta

El vídeo debe mostrar el flujo completo:
1. Abrir `sorteazos.es`
2. Pulsar "Conectar con Instagram"
3. Login con cuenta Business de Instagram
4. Pegar URL de un post propio
5. Cargar comentarios automáticamente
6. Configurar requisitos del sorteo
7. Realizar sorteo y mostrar ganador
8. Hacer reroll

---

## 🤝 Créditos

Desarrollado por **Juan María** ([@jagarcia95](https://instagram.com/jagarcia95)) en colaboración con **La Ñañá de Nala** ([@la_nana_de_nala](https://instagram.com/la_nana_de_nala)).

Si te resulta útil: [paypal.me/juanm95](https://paypal.me/juanm95) ☕

---

## 📄 Licencia

MIT — libre para usar, modificar y distribuir.
