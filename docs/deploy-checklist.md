# Checklist de deploy — Vendra (Next.js + Supabase + Vercel)

Modelo: 1 dominio de plataforma (`vendra.app`) + subdominios por dealer
(`demo.vendra.app`). El middleware identifica el tenant por hostname.

---

## 0. Pre-deploy (código) — dejar listo antes de subir

- [ ] **Migraciones aplicadas en Supabase** (SQL Editor): `0002`, `0003`, `0004`.
      Verifica que existan las columnas/políticas (soft delete, notas, features).
- [ ] **Build local OK** — con el `pnpm dev` DETENIDO:
      ```bash
      rm -rf .next && pnpm build
      ```
      Debe terminar sin errores. (No lo corras con el dev arriba: corrompe `.next`.)
- [ ] `.env` está en `.gitignore` (✔) y `.env.example` lista todas las variables (✔).
- [ ] Link "Ver sitio" del admin ya es environment-aware (✔, corregido).

---

## 1. GitHub

- [ ] Commit de todo:
      ```bash
      git add -A && git commit -m "MVP listo para deploy"
      ```
- [ ] Crear el repo (privado) y hacer push:
      ```bash
      gh repo create vendra --private --source=. --remote=origin --push
      ```
      (o crea el repo en github.com y `git remote add origin … && git push -u origin main`)

---

## 2. Supabase (base de datos de producción)

Dos opciones:

- **Reusar el proyecto actual** (rápido, para el demo). Ya tiene migraciones,
  bucket `car-photos` y datos. Contra: mezcla datos de dev y prod.
- **Proyecto nuevo de prod** (más limpio, recomendado para lanzar de verdad).
  Implica: correr las 4 migraciones, `node --env-file=.env scripts/setup-storage.mjs`,
  y crear admin + dealer en ese proyecto.

Para el primer demo: reusar el actual está bien.

- [ ] Confirmar bucket `car-photos` (público) existe.
- [ ] Anotar del panel de Supabase → Settings → API: URL, anon key, service_role key.

---

## 3. Dominio

- [ ] Comprar el dominio de plataforma (ej. `vendra.app`).
- [ ] El DNS se configura DESDE Vercel (paso 4) — no necesitas tocarlo aún.

---

## 4. Vercel

- [ ] **Import Project** → selecciona el repo `vendra` de GitHub.
- [ ] Framework: **Next.js** (autodetectado). Package manager: **pnpm** (autodetectado por el lockfile).
- [ ] **Environment Variables** (Production + Preview):

      | Variable | Valor |
      |---|---|
      | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
      | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` |
      | `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_…` (⚠ secreto) |
      | `NEXT_PUBLIC_BASE_DOMAIN` | `vendra.app` (tu dominio de plataforma) |
      | `PLATFORM_ADMIN_EMAILS` | tu correo de admin |
      | `RESEND_API_KEY` | `re_…` (opcional; sin esto no se envían emails de leads) |

      > `DEV_AUTH_BYPASS` NO se pone: en prod (`NODE_ENV=production`) el login siempre se exige.

- [ ] **Deploy**. Espera a que compile.
- [ ] **Domains** (Settings → Domains):
      - Agrega `vendra.app` y `www.vendra.app` → sigue las instrucciones de DNS que da Vercel.
      - Agrega el **wildcard `*.vendra.app`** (⚠ requiere **Vercel Pro**) para que cualquier subdominio de dealer resuelva.

---

## 5. Post-deploy — datos en producción

Estos scripts corren LOCAL pero apuntan a la Supabase que tengas en `.env`
(la misma de prod si reusas el proyecto):

- [ ] **Crear el usuario admin de plataforma**:
      ```bash
      node --env-file=.env scripts/create-admin.mjs --email tu@correo.com --password "TuClaveSegura"
      ```
      (ese correo debe estar en `PLATFORM_ADMIN_EMAILS` de Vercel)
- [ ] **Crear el dealer demo con el subdominio de prod**:
      ```bash
      pnpm dealer:create -- --name "AutosDemo" --domain demo.vendra.app --email dueno@demo.mx --password "ClaveDemo"
      ```
- [ ] (Opcional) Autos de ejemplo: súbelos desde `demo.vendra.app/dashboard/inventario`
      o adapta `scripts/seed-demo.mjs`.
- [ ] **Resend (para emails de leads)**: verifica tu dominio en resend.com y pon
      `RESEND_FROM="Vendra <leads@vendra.app>"` en Vercel. Sin verificar, solo llegan
      a tu propio correo.

---

## 6. Smoke test (verificar en producción)

- [ ] `https://vendra.app` → landing de plataforma.
- [ ] `https://vendra.app/admin` → login admin → lista de dealers.
- [ ] `https://demo.vendra.app` → storefront del dealer (home, /autos, ficha).
- [ ] `https://demo.vendra.app/dashboard` → login del dealer → panel con datos.
- [ ] Enviar un lead desde `demo.vendra.app` (Apartar / contacto) → aparece en el panel
      y (si Resend está configurado) llega el email.
- [ ] Subir una foto de auto → se ve en el storefront (Storage OK).

---

## Notas / gotchas

- **`NEXT_PUBLIC_BASE_DOMAIN`** es crítico: de él depende que el middleware distinga
  plataforma (`vendra.app`) de dealer (`*.vendra.app`). Si está mal, todo se trata
  como dealer o como plataforma.
- **Vercel Pro** hace falta para el wildcard de dominios y para uso comercial (un SaaS).
  Para un demo con 1-2 subdominios puntuales, Hobby puede alcanzar agregándolos a mano.
- **Fotos**: ya se sirven desde Supabase Storage; `next.config.js` ya permite `*.supabase.co`.
- **Dealer con dominio propio** (a futuro): agrega su dominio en Vercel → él pone un
  CNAME a Vercel → das de alta el dealer con ese dominio en el admin.
