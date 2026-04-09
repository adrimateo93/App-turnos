# 🚀 SeguriTurno — Guía de despliegue en Vercel + Render + MongoDB Atlas

## Arquitectura
```
[Usuario] → Vercel (React) → Render (FastAPI) → MongoDB Atlas
```

---

## PASO 1 — MongoDB Atlas (base de datos gratuita)

1. Ve a https://cloud.mongodb.com y crea una cuenta gratuita
2. Crea un **Cluster** → elige el plan **Free (M0)**
3. En **Database Access** → Add New User:
   - Usuario: `seguriturno`
   - Contraseña: genera una fuerte y guárdala
   - Role: `readWriteAnyDatabase`
4. En **Network Access** → Add IP Address → `0.0.0.0/0` (permitir todos)
5. En **Clusters** → Connect → Drivers → copia el **Connection String**:
   ```
   mongodb+srv://seguriturno:TU_PASSWORD@cluster0.xxxxx.mongodb.net/seguriturno_db
   ```
   Guarda esta URL, la necesitarás en el Paso 2.

---

## PASO 2 — Render (backend FastAPI)

1. Ve a https://render.com y crea una cuenta gratuita
2. **New → Web Service**
3. Conecta tu repositorio de GitHub (el que tiene este proyecto)
4. Configura:
   - **Name**: `seguriturno-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
   - **Region**: Frankfurt (EU)

5. En **Environment Variables** añade estas variables:

   | Key | Value |
   |-----|-------|
   | `MONGO_URL` | `mongodb+srv://seguriturno:PASSWORD@cluster0.xxxxx.mongodb.net/seguriturno_db` |
   | `DB_NAME` | `seguriturno_db` |
   | `JWT_SECRET` | *(genera en https://generate-secret.vercel.app/32)* |
   | `ENVIRONMENT` | `production` |
   | `ALLOWED_ORIGINS` | `https://seguriturno.vercel.app` *(tu URL de Vercel)* |
   | `APP_URL` | `https://seguriturno.vercel.app` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | tu correo Gmail |
   | `SMTP_PASS` | contraseña de aplicación Gmail |

6. **Create Web Service** → espera ~3 minutos
7. Copia la URL que te da Render: `https://seguriturno-api.onrender.com`

---

## PASO 3 — Vercel (frontend React)

1. Ve a https://vercel.com y crea una cuenta gratuita
2. **Add New Project** → importa tu repositorio de GitHub
3. Configura:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`

4. En **Environment Variables** añade:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_BACKEND_URL` | `https://seguriturno-api.onrender.com` *(tu URL de Render)* |
   | `REACT_APP_NAME` | `SeguriTurno` |
   | `REACT_APP_VERSION` | `2.0.0` |

5. **Deploy** → espera ~2 minutos
6. Tu app estará en: `https://seguriturno.vercel.app`

---

## PASO 4 — Actualizar CORS en Render

Una vez tengas la URL de Vercel, vuelve a Render y actualiza:
- `ALLOWED_ORIGINS` → `https://seguriturno.vercel.app`
- `APP_URL` → `https://seguriturno.vercel.app`

Render redesplegará automáticamente.

---

## ✅ Verificación final

Abre tu URL de Vercel y comprueba:
- [ ] La página de login carga correctamente
- [ ] Puedes registrar un usuario nuevo
- [ ] Puedes crear un turno
- [ ] El cálculo de nómina funciona

---

## ⚠️ Nota sobre Render gratuito

El plan gratuito de Render **hiberna** el servidor tras 15 min sin uso.
La primera petición tras la hibernación tarda ~30 segundos.
Para evitarlo, puedes usar https://cron-job.org para hacer un ping cada 10 minutos a `https://seguriturno-api.onrender.com/api/`
