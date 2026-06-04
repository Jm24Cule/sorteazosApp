# 🎁 Sorteazos — La Ñañá de Nala

Herramienta propia para realizar sorteos en Instagram sin depender de apps de terceros.

## Stack
- **Next.js 14** (App Router)
- **TypeScript + Tailwind CSS**
- **Deploy:** Vercel
- **API:** Instagram Graph API v19

---

## 🚀 Deploy en Vercel (desde cero)

### 1. Sube el código a GitHub
```bash
git init
git add .
git commit -m "feat: sorteazos inicial"
gh repo create sorteazos --private --push --source=.
```

### 2. Importa en Vercel
- Ve a [vercel.com/new](https://vercel.com/new)
- Selecciona el repo `sorteazos`
- Framework: **Next.js** (detección automática)
- Añade las variables de entorno (ver paso 3)
- Deploy ✓

### 3. Variables de entorno en Vercel

En **Settings → Environment Variables** añade:

| Variable | Valor |
|---|---|
| `INSTAGRAM_TOKEN` | Tu token de larga duración |
| `INSTAGRAM_USER_ID` | ID numérico de tu cuenta IG |

---

## 🔑 Obtener el token de Instagram

### Requisitos previos
- Cuenta de Instagram **Business** o **Creator**
- Página de Facebook vinculada
- App en [Meta for Developers](https://developers.facebook.com/)

### Pasos

1. **Crea una app en Meta Developers**
   - Tipo: Business
   - Añade el producto "Instagram Graph API"

2. **Genera un token de acceso de usuario**
   - En Graph API Explorer, selecciona tu app
   - Permisos necesarios: `instagram_basic`, `instagram_manage_comments`
   - Genera el token

3. **Conviértelo en token de larga duración** (60 días)
   ```
   GET https://graph.facebook.com/v19.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={APP_ID}
     &client_secret={APP_SECRET}
     &fb_exchange_token={SHORT_TOKEN}
   ```

4. **Obtén tu INSTAGRAM_USER_ID**
   ```
   GET https://graph.facebook.com/v19.0/me/accounts?access_token={TOKEN}
   ```
   Busca tu cuenta de Instagram en la respuesta y copia el `id`.

---

## 📋 Uso sin API (fallback)

Si no tienes token configurado, la app funciona igual:

- **Pegar texto:** Copia los comentarios de Instagram manualmente y pégalos
- **Archivo:** Exporta los comentarios con una extensión de Chrome (ej: *IG Comment Exporter*) y carga el TXT

---

## 🎮 Cómo usar en directo

1. Abre la app en el navegador
2. Carga los comentarios (API / pegar / archivo)
3. Configura requisitos (menciones, hashtags, etc.)
4. Pulsa **REALIZAR SORTEO** — animación de ruleta
5. Se muestra el ganador con aviso de verificación de story
6. Si el ganador no cumple requisitos → **Reroll**

---

## 📁 Estructura

```
src/
  app/
    api/comments/route.ts   # API Route → Instagram Graph API
    sorteo/page.tsx          # UI principal del sorteo
    layout.tsx
    globals.css
```

---

## 🛠 Desarrollo local

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local
# Edita .env.local con tus tokens
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)
