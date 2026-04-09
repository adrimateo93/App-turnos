# SeguriTurno — Cambios de Producción

## ✅ Qué se implementó

### 🔐 Seguridad crítica
| Problema | Solución |
|---|---|
| CORS `*` abierto | `ALLOWED_ORIGINS` por variable de entorno |
| `JWT_SECRET` hardcodeado | Obligatorio en `.env`, falla si no está |
| Sin rate limiting | Sliding window: 5 intentos/5min en login por IP y email |
| Contraseña sin validación | Mínimo 8 chars, mayúscula, minúscula y número |
| Token sin tipo | Campo `type: "access"` para futura implementación de refresh |

### 👥 Sistema de roles
- Campo `role` en usuarios: `"user"` | `"admin"`
- Dependency `require_role("admin")` reutilizable en cualquier endpoint
- Endpoints admin: `GET /api/admin/users`, `PATCH /api/admin/users/{id}/role`, `PATCH /api/admin/users/{id}/deactivate`
- Usuarios desactivados no pueden hacer login

### 🔑 Recuperación de contraseña
- `POST /api/auth/forgot-password` — genera token seguro, envía email
- `POST /api/auth/reset-password` — valida token, actualiza contraseña
- Token expira en 1 hora, se marca como usado tras el reset
- TTL index en MongoDB para limpieza automática de tokens expirados
- No revela si el email existe (protección anti-enumeración)

### 🧪 Tests (38 tests)
```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```
Cubre: validación de contraseñas, cálculo de horas, festivos, nóminas, auth completo, roles.

### 📦 Dependencias separadas
- `requirements.txt` — solo producción
- `requirements-dev.txt` — extiende prod, añade pytest/black/flake8/mypy

### 🐳 Docker
```bash
# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores reales

# Levantar todo
docker compose up -d

# Ver logs
docker compose logs -f backend
```

---

## 🚀 Pasos para desplegar

1. **Copia los archivos** de esta carpeta a tu proyecto
2. **Configura `.env`**:
   ```bash
   cp backend/.env.example backend/.env
   # Edita: JWT_SECRET, MONGO_URL, ALLOWED_ORIGINS, SMTP_*
   ```
3. **Genera un JWT_SECRET seguro**:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
4. **Ejecuta los tests**:
   ```bash
   cd backend && pytest tests/ -v
   ```
5. **Despliega con Docker**:
   ```bash
   docker compose up -d
   ```

---

## ⚠️ Pendientes antes de ir a producción real

- [ ] Configurar dominio real en `ALLOWED_ORIGINS` y `APP_URL`
- [ ] Configurar SMTP real (Gmail App Password, SendGrid, etc.)
- [ ] Añadir HTTPS con certificado SSL (Let's Encrypt + Nginx)
- [ ] Configurar backup automático de MongoDB
- [ ] Añadir festivos para 2027+ (o integrar API de festivos)
- [ ] Paginación en `GET /shifts` para usuarios con muchos datos
