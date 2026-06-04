# 🎁 Sorteazos

> **🚧 En desarrollo activo** — funcional pero con algunas características aún en progreso.

Herramienta gratuita para hacer sorteos en Instagram sin depender de apps de terceros. Sin registro, sin límites, sin suscripción.

**🌐 Web:** [sorteazos.es](https://sorteazos.es)

---

## ✨ Características

- **Carga de comentarios** — por URL (requiere token), pegando texto, o importando archivo TXT/CSV
- **Filtros configurables** — menciones mínimas, hashtags, palabras clave, excluir duplicados
- **Requisitos declarativos** — seguir una cuenta, dar like (con checklist de verificación manual al mostrar ganador)
- **Reroll instantáneo** — si el ganador no cumple las bases, nuevo ganador sin repetir
- **Modo claro/oscuro**
- **Sin almacenamiento de datos** — todo se procesa en el navegador

---

## 🚧 En desarrollo

- [ ] Carga automática de comentarios por URL (requiere configurar token de Instagram Business)
- [ ] Soporte para múltiples posts en el mismo sorteo
- [ ] Exportar acta del sorteo en PDF

---

## 🚀 Deploy

El proyecto usa **Next.js 14** desplegado en **Vercel** con dominio propio en PiensaSolutions.

### Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Descripción |
|---|---|
| `INSTAGRAM_TOKEN` | Token de larga duración de Instagram Graph API |
| `INSTAGRAM_USER_ID` | ID numérico de tu cuenta Instagram Business |

Sin estas variables la app funciona igualmente en modo manual (pegar texto / archivo).

### Desarrollo local

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local
npm run dev
```

---

## 🤝 Créditos

Desarrollado por **Juan María** ([@jagarcia95](https://instagram.com/jagarcia95)) en colaboración con **La Ñañá de Nala** ([@la_nana_de_nala](https://instagram.com/la_nana_de_nala)).

Si te resulta útil, puedes apoyar el proyecto en [paypal.me/juanm95](https://paypal.me/juanm95) ☕

---

## 📄 Licencia

MIT — libre para usar, modificar y distribuir.
