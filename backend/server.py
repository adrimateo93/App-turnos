from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import time
from collections import defaultdict
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ============================================================
# CONFIG
# ============================================================
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'seguriturno_db')
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET env var is required and must be set in .env")
JWT_ALGORITHM = "HS256"

SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
APP_URL   = os.environ.get('APP_URL', 'http://localhost:3000')

ALLOWED_ORIGINS = [o.strip() for o in os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',') if o.strip()]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================
# DB
# ============================================================
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# ============================================================
# APP
# ============================================================
app = FastAPI(title="SeguriTurno API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============================================================
# RATE LIMITER (in-memory, simple sliding window)
# ============================================================
_rate_store: dict[str, list] = defaultdict(list)

def check_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 60):
    now = time.time()
    window_start = now - window_seconds
    calls = [t for t in _rate_store[key] if t > window_start]
    if len(calls) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Demasiados intentos. Espera {window_seconds // 60} minuto(s)."
        )
    calls.append(now)
    _rate_store[key] = calls

# ============================================================
# PASSWORD VALIDATION
# ============================================================
PASSWORD_RE = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$')

def validate_password_strength(password: str) -> str:
    if not PASSWORD_RE.match(password):
        raise ValueError(
            "La contraseña debe tener al menos 8 caracteres, "
            "una mayúscula, una minúscula y un número."
        )
    return password

# ============================================================
# SALARY TABLES & CONSTANTS (unchanged from original)
# ============================================================
SPANISH_HOLIDAYS_2026 = [
    "2026-01-01","2026-01-06","2026-04-02","2026-04-03",
    "2026-05-01","2026-08-15","2026-10-12","2026-11-02",
    "2026-12-07","2026-12-08","2026-12-25",
]

SALARY_TABLES_2026 = {
    "vigilante_sin_arma": {
        "name": "Vigilante de Seguridad Sin Arma",
        "salario_base": 1161.28, "plus_peligrosidad": 24.08, "plus_actividad": 0,
        "plus_transporte": 137.81, "plus_vestuario": 112.28, "salario_total": 1435.45,
        "trienio": 25.51, "quinquenio": 45.86, "nocturnidad_hora": 1.25,
        "hora_extra_base": 9.98, "hora_extra_por_quinquenio": 0.38
    },
    "vigilante_con_arma": {
        "name": "Vigilante de Seguridad Con Arma",
        "salario_base": 1161.28, "plus_peligrosidad": 179.90, "plus_actividad": 0,
        "plus_transporte": 137.81, "plus_vestuario": 112.28, "salario_total": 1591.27,
        "trienio": 25.51, "quinquenio": 45.86, "nocturnidad_hora": 1.25,
        "hora_extra_base": 11.29, "hora_extra_por_quinquenio": 0.38
    },
    "vigilante_transporte_conductor": {
        "name": "V.S. Transporte - Conductor",
        "salario_base": 1285.56, "plus_peligrosidad": 179.90, "plus_actividad": 210.20,
        "plus_transporte": 137.81, "plus_vestuario": 114.55, "salario_total": 1928.01,
        "trienio": 27.61, "quinquenio": 50.23, "nocturnidad_hora": 1.36
    },
    "vigilante_transporte": {
        "name": "V.S. Transporte",
        "salario_base": 1227.74, "plus_peligrosidad": 179.90, "plus_actividad": 210.20,
        "plus_transporte": 137.81, "plus_vestuario": 113.27, "salario_total": 1868.91,
        "trienio": 25.61, "quinquenio": 46.58, "nocturnidad_hora": 1.26
    },
    "vigilante_explosivos_conductor": {
        "name": "V.S.T. Explosivos Conductor",
        "salario_base": 1285.56, "plus_peligrosidad": 191.59, "plus_actividad": 152.44,
        "plus_transporte": 137.81, "plus_vestuario": 114.55, "salario_total": 1881.94,
        "trienio": 27.61, "quinquenio": 50.23, "nocturnidad_hora": 1.36
    },
    "vigilante_explosivos": {
        "name": "V.S. Transp - Explosivos",
        "salario_base": 1227.74, "plus_peligrosidad": 191.59, "plus_actividad": 152.44,
        "plus_transporte": 137.81, "plus_vestuario": 113.27, "salario_total": 1822.85,
        "trienio": 25.61, "quinquenio": 46.58, "nocturnidad_hora": 1.26
    },
    "vigilante_seguridad_explosivos": {
        "name": "V.S. Explosivos",
        "salario_base": 1161.28, "plus_peligrosidad": 210.56, "plus_actividad": 40.17,
        "plus_transporte": 137.81, "plus_vestuario": 112.24, "salario_total": 1662.06,
        "trienio": 25.51, "quinquenio": 45.85, "nocturnidad_hora": 1.25
    },
    "escolta": {
        "name": "Escolta",
        "salario_base": 1161.28, "plus_peligrosidad": 177.15, "plus_actividad": 0,
        "plus_transporte": 137.81, "plus_vestuario": 115.66, "salario_total": 1591.90,
        "trienio": 0, "quinquenio": 45.85, "nocturnidad_hora": 1.25
    },
    "operador_seguridad": {
        "name": "Operador de Seguridad",
        "salario_base": 1091.57, "plus_peligrosidad": 0, "plus_actividad": 0,
        "plus_transporte": 137.81, "plus_vestuario": 68.53, "salario_total": 1297.92,
        "trienio": 21.28, "quinquenio": 38.73, "nocturnidad_hora": 0.99
    },
    "contador_pagador": {
        "name": "Contador - Pagador",
        "salario_base": 1078.17, "plus_peligrosidad": 0, "plus_actividad": 80.32,
        "plus_transporte": 137.81, "plus_vestuario": 72.84, "salario_total": 1369.14,
        "trienio": 21.28, "quinquenio": 38.73, "nocturnidad_hora": 1.06
    }
}

PLUS_FESTIVO_HORA = 1.02
PLUS_RESPONSABLE_EQUIPO_PERCENT = 0.10
PLUS_KILOMETRAJE = 0.35
PLUS_AEROPUERTO_HORA = 0.82
PLUS_RADIOSCOPIA_AEROPORTUARIA_HORA = 1.46
PLUS_FILTRO_ROTACION_HORA = 0.74
PLUS_RADIOSCOPIA_BASICA_HORA = 0.21
PLUS_RADIOSCOPIA_BASICA_TOPE = 236.52
PLUS_ESCOLTA_HORA = 1.93
PLUS_NOCHEBUENA_NOCHEVIEJA = 83.48
PLUS_HIJO_DISCAPACITADO = 150.70

TABLA_HORA_EXTRA = {
    "vigilante_sin_arma": {
        0: 9.98, 1: 10.36, 2: 10.75, 3: 11.13, 4: 11.52, 5: 11.90,
        "4q1t": 11.72, "4q2t": 11.95, "4q3t": 12.17
    },
    "vigilante_con_arma": {
        0: 11.29, 1: 11.67, 2: 12.06, 3: 12.44, 4: 12.83, 5: 13.21,
        "4q1t": 13.05, "4q2t": 13.27, "4q3t": 13.50
    }
}

PRECIO_BASE_HORA_FORMACION = 9.98
PRECIO_BASE_HORA_ASISTENCIA_TIRO = 9.98

PRECIO_HORA_ASISTENCIA_JUICIO = {
    "vigilante_sin_arma": 9.98, "vigilante_con_arma": 11.29,
    "guarda_rural": 11.28, "escolta": 11.13,
    "vigilante_explosivos": 11.55, "vigilante_transporte_explosivos": 12.18,
    "vigilante_transporte": 11.84, "vigilante_transporte_conductor": 12.52,
    "operador_seguridad": 9.07, "contador_pagador": 8.96
}

# ============================================================
# MODELS
# ============================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        return validate_password_strength(v)

    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError('El nombre no puede estar vacío')
        return v.strip()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        return validate_password_strength(v)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        return validate_password_strength(v)

class UserSettingsUpdate(BaseModel):
    categoria: Optional[str] = None
    porcentaje_jornada: Optional[int] = None
    trienios: Optional[int] = None
    quinquenios: Optional[int] = None
    año_entrada: Optional[int] = None
    es_responsable_equipo: Optional[bool] = None
    horas_anuales: Optional[float] = None
    meses_trabajo: Optional[int] = None
    pagas_prorrateadas: Optional[bool] = None
    tipo_contrato: Optional[str] = None
    irpf_porcentaje: Optional[float] = None
    horas_extra_fuerza_mayor: Optional[bool] = None
    plus_servicio_nombre: Optional[str] = None
    plus_servicio_importe: Optional[float] = None
    plus_kilometraje_km: Optional[float] = None
    plus_aeropuerto_horas: Optional[float] = None
    plus_radioscopia_aeroportuaria_horas: Optional[float] = None
    plus_filtro_rotacion_horas: Optional[float] = None
    plus_radioscopia_basica_horas: Optional[float] = None
    plus_escolta_horas: Optional[float] = None
    plus_nochebuena: Optional[bool] = None
    plus_nochevieja: Optional[bool] = None
    plus_hijo_discapacitado: Optional[bool] = None
    plus_asistencia_juicio_horas: Optional[float] = None
    plus_formacion_horas: Optional[float] = None
    plus_asistencia_tiro_horas: Optional[float] = None
    año_convenio: Optional[int] = 2026
    dieta_una_comida: Optional[int] = None
    dieta_dos_comidas: Optional[int] = None
    dieta_pernocta_desayuno: Optional[int] = None
    dieta_pernocta_dos_comidas: Optional[int] = None
    dieta_completa_8_dia: Optional[int] = None

class ShiftCreate(BaseModel):
    date: str
    start_time: str
    end_time: str
    start_time_2: Optional[str] = None
    end_time_2: Optional[str] = None
    overtime_hours: float = 0
    color: str = "#10B981"
    comment: str = ""
    alarm_enabled: bool = False
    alarm_times: List[str] = []
    shift_type: str = "normal"
    symbol: str = ""
    label: str = ""
    company_id: int = 1

class ShiftUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    start_time_2: Optional[str] = None
    end_time_2: Optional[str] = None
    overtime_hours: Optional[float] = None
    color: Optional[str] = None
    comment: Optional[str] = None
    alarm_enabled: Optional[bool] = None
    alarm_times: Optional[List[str]] = None
    shift_type: Optional[str] = None
    symbol: Optional[str] = None
    label: Optional[str] = None
    company_id: Optional[int] = None

class ShiftResponse(BaseModel):
    id: str
    user_id: str
    date: str
    start_time: str
    end_time: str
    start_time_2: Optional[str] = None
    end_time_2: Optional[str] = None
    overtime_hours: float
    color: str
    comment: str
    alarm_enabled: bool
    alarm_times: List[str] = []
    shift_type: str
    symbol: str = ""
    label: str = ""
    company_id: int = 1
    total_hours: float
    night_hours: float
    holiday_hours: float
    created_at: str

class ShiftTemplateCreate(BaseModel):
    name: str
    label: str
    start_time: str
    end_time: str
    start_time_2: Optional[str] = None
    end_time_2: Optional[str] = None
    color: str = "#10B981"
    symbol: str = "none"
    company_id: int = 1

class ShiftTemplateUpdate(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    start_time_2: Optional[str] = None
    end_time_2: Optional[str] = None
    color: Optional[str] = None
    symbol: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    alarms_enabled: Optional[bool] = None
    alarm_1_time: Optional[str] = None
    alarm_1_enabled: Optional[bool] = None
    alarm_2_time: Optional[str] = None
    alarm_2_enabled: Optional[bool] = None
    alarm_3_time: Optional[str] = None
    alarm_3_enabled: Optional[bool] = None

# ============================================================
# ROLE HELPERS
# ============================================================

def require_role(*roles: str):
    """Dependency factory: ensures user has one of the given roles."""
    async def _checker(user=Depends(get_current_user)):
        user_role = user.get("role", "user")
        if user_role not in roles:
            raise HTTPException(status_code=403, detail="No tienes permisos suficientes.")
        return user
    return _checker

# ============================================================
# AUTH HELPERS
# ============================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, expires_hours: int = 24 * 7) -> str:
    payload = {
        "user_id": user_id,
        "type": "access",
        "exp": datetime.now(timezone.utc).timestamp() + 3600 * expires_hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_reset_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesión expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============================================================
# EMAIL
# ============================================================

def send_reset_email(to_email: str, reset_token: str, user_name: str):
    if not SMTP_HOST or not SMTP_USER:
        logger.warning("SMTP not configured — skipping password reset email.")
        return
    reset_url = f"{APP_URL}/reset-password?token={reset_token}"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SeguriTurno — Recuperación de contraseña"
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    html = f"""
    <html><body>
    <h2>Hola {user_name},</h2>
    <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
    <p><a href="{reset_url}" style="background:#10B981;color:white;padding:12px 24px;
       border-radius:6px;text-decoration:none;">Restablecer contraseña</a></p>
    <p>Este enlace expira en <strong>1 hora</strong>.</p>
    <p>Si no solicitaste este cambio, ignora este correo.</p>
    <p>— Equipo SeguriTurno</p>
    </body></html>"""
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"Reset email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")

# ============================================================
# CALCULATION HELPERS (unchanged)
# ============================================================

def calculate_night_hours(start_time: str, end_time: str, shift_date: str) -> float:
    start_h, start_m = map(int, start_time.split(':'))
    end_h, end_m = map(int, end_time.split(':'))
    start_minutes = start_h * 60 + start_m
    end_minutes = end_h * 60 + end_m
    if end_minutes <= start_minutes:
        end_minutes += 24 * 60
    night_start = 22 * 60
    night_end = 6 * 60
    night_end_next_day = 30 * 60
    night_minutes = 0
    if start_minutes < 24 * 60 and end_minutes > night_start:
        overlap_start = max(start_minutes, night_start)
        overlap_end = min(end_minutes, 24 * 60)
        if overlap_end > overlap_start:
            night_minutes += overlap_end - overlap_start
    if start_minutes < night_end:
        overlap_start = max(start_minutes, 0)
        overlap_end = min(end_minutes, night_end)
        if overlap_end > overlap_start:
            night_minutes += overlap_end - overlap_start
    if end_minutes > 24 * 60:
        overlap_start = max(start_minutes, 24 * 60)
        overlap_end = min(end_minutes, night_end_next_day)
        if overlap_end > overlap_start:
            night_minutes += overlap_end - overlap_start
    return round(night_minutes / 60, 2)

def is_holiday(date_str: str) -> bool:
    d = datetime.strptime(date_str, "%Y-%m-%d")
    if d.weekday() >= 5:
        return True
    if date_str in SPANISH_HOLIDAYS_2026:
        return True
    return False

def calculate_total_hours(start_time: str, end_time: str) -> float:
    start_h, start_m = map(int, start_time.split(':'))
    end_h, end_m = map(int, end_time.split(':'))
    start_minutes = start_h * 60 + start_m
    end_minutes = end_h * 60 + end_m
    if end_minutes <= start_minutes:
        end_minutes += 24 * 60
    return round((end_minutes - start_minutes) / 60, 2)

def get_convenio_multiplier(año: int) -> float:
    multipliers = {2026: 1.0, 2027: 1.035, 2028: 1.0764, 2029: 1.119456, 2030: 1.1698355}
    return multipliers.get(año, 1.0)

# ============================================================
# ROUTES — AUTH
# ============================================================

@api_router.get("/")
async def root():
    return {"message": "SeguriTurno API v2.0", "status": "ok"}

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserRegister, request: Request):
    client_ip = request.client.host
    check_rate_limit(f"register:{client_ip}", max_requests=5, window_seconds=300)

    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name.strip(),
        "password": hash_password(user.password),
        "role": "user",                           # <-- ROLE FIELD
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)

    settings_doc = {
        "user_id": user_id,
        "company_id": 1,
        "categoria": "vigilante_sin_arma",
        "porcentaje_jornada": 100,
        "trienios": 0, "quinquenios": 0,
        "es_responsable_equipo": False,
        "horas_anuales": 1782, "meses_trabajo": 11,
        "pagas_prorrateadas": True,
        "tipo_contrato": "indefinido",
        "irpf_porcentaje": 12.0,
        "horas_extra_fuerza_mayor": False,
        "plus_servicio_nombre": "", "plus_servicio_importe": 0.0
    }
    await db.user_settings.insert_one(settings_doc)
    logger.info(f"New user registered: {user.email}")
    return {
        "token": create_access_token(user_id),
        "user": {"id": user_id, "email": user.email, "name": user.name, "role": "user"}
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user: UserLogin, request: Request):
    client_ip = request.client.host
    check_rate_limit(f"login:{client_ip}", max_requests=10, window_seconds=60)
    check_rate_limit(f"login_email:{user.email}", max_requests=5, window_seconds=300)

    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if not db_user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    logger.info(f"Login: {user.email}")
    return {
        "token": create_access_token(db_user["id"]),
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "name": db_user["name"],
            "role": db_user.get("role", "user")
        }
    }

@api_router.get("/auth/me", response_model=dict)
async def get_me(user=Depends(get_current_user)):
    return {
        "id": user["id"], "email": user["email"],
        "name": user["name"], "role": user.get("role", "user")
    }

@api_router.post("/auth/change-password")
async def change_password(data: ChangePassword, user=Depends(get_current_user)):
    db_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if not db_user or not verify_password(data.current_password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    return {"message": "Contraseña actualizada correctamente"}

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request):
    client_ip = request.client.host
    check_rate_limit(f"forgot:{client_ip}", max_requests=3, window_seconds=300)

    db_user = await db.users.find_one({"email": data.email})
    # Always return success to avoid email enumeration
    if db_user:
        reset_token = create_reset_token()
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        await db.password_resets.insert_one({
            "user_id": db_user["id"],
            "token": reset_token,
            "expires_at": expires_at,
            "used": False
        })
        send_reset_email(data.email, reset_token, db_user.get("name", ""))
    return {"message": "Si el email existe, recibirás un enlace de recuperación."}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest, request: Request):
    client_ip = request.client.host
    check_rate_limit(f"reset:{client_ip}", max_requests=5, window_seconds=300)

    record = await db.password_resets.find_one({"token": data.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Token inválido o ya usado")

    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token expirado")

    await db.users.update_one(
        {"id": record["user_id"]},
        {"$set": {"password": hash_password(data.new_password)}}
    )
    await db.password_resets.update_one({"_id": record["_id"]}, {"$set": {"used": True}})
    return {"message": "Contraseña restablecida correctamente"}

# ============================================================
# ROUTES — ADMIN (role: admin only)
# ============================================================

@api_router.get("/admin/users")
async def list_users(user=Depends(require_role("admin"))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(500)
    return users

@api_router.patch("/admin/users/{user_id}/role")
async def set_user_role(user_id: str, role: str, admin=Depends(require_role("admin"))):
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Rol inválido. Usa 'user' o 'admin'.")
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": f"Rol actualizado a '{role}'"}

@api_router.patch("/admin/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, admin=Depends(require_role("admin"))):
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario desactivado"}

# ============================================================
# ROUTES — SETTINGS
# ============================================================

@api_router.get("/settings")
async def get_settings(company_id: int = 1, user=Depends(get_current_user)):
    settings = await db.user_settings.find_one({"user_id": user["id"], "company_id": company_id})
    if not settings:
        settings = {
            "user_id": user["id"], "company_id": company_id,
            "categoria": "vigilante_sin_arma", "porcentaje_jornada": 100,
            "trienios": 0, "quinquenios": 0, "es_responsable_equipo": False,
            "horas_anuales": 1782, "meses_trabajo": 11, "pagas_prorrateadas": True,
            "paga_extra_marzo": "integra", "paga_extra_julio": "integra",
            "paga_extra_diciembre": "integra", "tipo_contrato": "indefinido",
            "irpf_porcentaje": 12.0, "horas_extra_fuerza_mayor": False,
            "plus_servicio_nombre": "", "plus_servicio_importe": 0.0, "año_convenio": 2026
        }
        await db.user_settings.insert_one(settings)
    settings.pop("_id", None)
    return settings

@api_router.put("/settings")
async def update_settings(settings: UserSettingsUpdate, company_id: int = 1, user=Depends(get_current_user)):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    update_data["company_id"] = company_id
    if update_data:
        await db.user_settings.update_one(
            {"user_id": user["id"], "company_id": company_id},
            {"$set": update_data}, upsert=True
        )
    updated = await db.user_settings.find_one({"user_id": user["id"], "company_id": company_id})
    if updated:
        updated.pop("_id", None)
    return updated

# ============================================================
# ROUTES — SHIFTS
# ============================================================

@api_router.post("/shifts", response_model=ShiftResponse)
async def create_shift(shift: ShiftCreate, user=Depends(get_current_user)):
    shift_id = str(uuid.uuid4())
    total_hours = calculate_total_hours(shift.start_time, shift.end_time)
    night_hours = calculate_night_hours(shift.start_time, shift.end_time, shift.date)
    if shift.start_time_2 and shift.end_time_2:
        total_hours += calculate_total_hours(shift.start_time_2, shift.end_time_2)
        night_hours += calculate_night_hours(shift.start_time_2, shift.end_time_2, shift.date)
    holiday_hours = total_hours if is_holiday(shift.date) else 0
    shift_doc = {
        "id": shift_id, "user_id": user["id"],
        "date": shift.date, "start_time": shift.start_time, "end_time": shift.end_time,
        "start_time_2": shift.start_time_2, "end_time_2": shift.end_time_2,
        "overtime_hours": shift.overtime_hours, "color": shift.color,
        "comment": shift.comment, "alarm_enabled": shift.alarm_enabled,
        "alarm_times": shift.alarm_times, "shift_type": shift.shift_type,
        "symbol": shift.symbol, "label": shift.label, "company_id": shift.company_id,
        "total_hours": total_hours, "night_hours": night_hours,
        "holiday_hours": holiday_hours, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shifts.insert_one(shift_doc)
    shift_doc.pop("_id", None)
    return shift_doc

@api_router.get("/shifts")
async def get_shifts(month: Optional[int] = None, year: Optional[int] = None,
                     company_id: Optional[int] = None, user=Depends(get_current_user)):
    query = {"user_id": user["id"]}
    if month and year:
        query["date"] = {"$regex": f"^{year}-{str(month).zfill(2)}"}
    if company_id:
        query["company_id"] = company_id
    shifts = await db.shifts.find(query, {"_id": 0}).to_list(1000)
    for s in shifts:
        s.setdefault("start_time_2", None)
        s.setdefault("end_time_2", None)
        s.setdefault("symbol", "")
        s.setdefault("label", "")
        s.setdefault("company_id", 1)
    return shifts

@api_router.get("/shifts/{shift_id}")
async def get_shift(shift_id: str, user=Depends(get_current_user)):
    shift = await db.shifts.find_one({"id": shift_id, "user_id": user["id"]}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return shift

@api_router.put("/shifts/{shift_id}")
async def update_shift(shift_id: str, shift: ShiftUpdate, user=Depends(get_current_user)):
    existing = await db.shifts.find_one({"id": shift_id, "user_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    update_data = {k: v for k, v in shift.model_dump().items() if v is not None}
    start_time = update_data.get("start_time", existing.get("start_time"))
    end_time = update_data.get("end_time", existing.get("end_time"))
    start_time_2 = update_data.get("start_time_2", existing.get("start_time_2"))
    end_time_2 = update_data.get("end_time_2", existing.get("end_time_2"))
    if any(k in update_data for k in ("start_time","end_time","start_time_2","end_time_2")):
        total_hours = calculate_total_hours(start_time, end_time)
        night_hours = calculate_night_hours(start_time, end_time, existing["date"])
        if start_time_2 and end_time_2:
            total_hours += calculate_total_hours(start_time_2, end_time_2)
            night_hours += calculate_night_hours(start_time_2, end_time_2, existing["date"])
        update_data["total_hours"] = total_hours
        update_data["night_hours"] = night_hours
        update_data["holiday_hours"] = total_hours if is_holiday(existing["date"]) else 0
    if update_data:
        await db.shifts.update_one({"id": shift_id}, {"$set": update_data})
    updated = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
    updated.setdefault("start_time_2", None)
    updated.setdefault("end_time_2", None)
    updated.setdefault("symbol", "")
    updated.setdefault("label", "")
    updated.setdefault("company_id", 1)
    return updated

@api_router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: str, user=Depends(get_current_user)):
    result = await db.shifts.delete_one({"id": shift_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return {"message": "Turno eliminado"}

# ============================================================
# ROUTES — SHIFT TEMPLATES
# ============================================================

@api_router.get("/shift-templates")
async def get_shift_templates(company_id: int = 1, user=Depends(get_current_user)):
    return await db.shift_templates.find({"user_id": user["id"], "company_id": company_id}, {"_id": 0}).to_list(100)

@api_router.post("/shift-templates")
async def create_shift_template(template: ShiftTemplateCreate, user=Depends(get_current_user)):
    if len(template.label) > 3:
        raise HTTPException(status_code=400, detail="La etiqueta debe tener máximo 3 caracteres")
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "company_id": template.company_id,
        "name": template.name, "label": template.label.upper(),
        "start_time": template.start_time, "end_time": template.end_time,
        "start_time_2": template.start_time_2, "end_time_2": template.end_time_2,
        "color": template.color, "symbol": template.symbol or "none",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shift_templates.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/shift-templates/{template_id}")
async def update_shift_template(template_id: str, template: ShiftTemplateUpdate, user=Depends(get_current_user)):
    existing = await db.shift_templates.find_one({"id": template_id, "user_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    update_data = {k: v for k, v in template.model_dump().items() if v is not None}
    if update_data:
        await db.shift_templates.update_one({"id": template_id}, {"$set": update_data})
    return await db.shift_templates.find_one({"id": template_id}, {"_id": 0})

@api_router.delete("/shift-templates/{template_id}")
async def delete_shift_template(template_id: str, user=Depends(get_current_user)):
    result = await db.shift_templates.delete_one({"id": template_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"message": "Plantilla eliminada"}

# ============================================================
# ROUTES — COMPANIES
# ============================================================

@api_router.get("/companies")
async def get_companies(user=Depends(get_current_user)):
    companies = await db.companies.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    if not companies:
        default_companies = [
            {"id": str(uuid.uuid4()), "user_id": user["id"], "company_number": i,
             "name": f"Empresa {'ABC'[i-1]}", "created_at": datetime.now(timezone.utc).isoformat()}
            for i in range(1, 4)
        ]
        await db.companies.insert_many(default_companies)
        for c in default_companies:
            c.pop("_id", None)
        return default_companies
    return companies

@api_router.put("/companies/{company_number}")
async def update_company(company_number: int, company: CompanyUpdate, user=Depends(get_current_user)):
    existing = await db.companies.find_one({"company_number": company_number, "user_id": user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    update_data = {k: v for k, v in company.model_dump().items() if v is not None}
    if update_data:
        await db.companies.update_one({"company_number": company_number, "user_id": user["id"]}, {"$set": update_data})
    return await db.companies.find_one({"company_number": company_number, "user_id": user["id"]}, {"_id": 0})

# ============================================================
# ROUTES — PROFILE
# ============================================================

@api_router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    return {"name": user.get("name",""), "email": user.get("email","")}

@api_router.put("/profile")
async def update_profile(profile_update: UserProfileUpdate, user=Depends(get_current_user)):
    update_data = {k: v for k, v in profile_update.model_dump().items() if v is not None}
    if "name" in update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": {"name": update_data["name"]}})
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"name": updated_user.get("name",""), "email": updated_user.get("email","")}

# ============================================================
# ROUTES — PAYROLL (unchanged logic, same as original)
# ============================================================

@api_router.get("/payroll/{year}/{month}")
async def calculate_payroll(year: int, month: int, company_id: Optional[int] = None, user=Depends(get_current_user)):
    import calendar
    settings = await db.user_settings.find_one({"user_id": user["id"]}, {"_id": 0}) or {
        "categoria": "vigilante_sin_arma", "porcentaje_jornada": 100, "trienios": 0,
        "quinquenios": 0, "es_responsable_equipo": False, "horas_anuales": 1782,
        "meses_trabajo": 11, "pagas_prorrateadas": True, "tipo_contrato": "indefinido",
        "irpf_porcentaje": 12.0, "horas_extra_fuerza_mayor": False
    }
    categoria = settings.get("categoria", "vigilante_sin_arma")
    salary_data_raw = SALARY_TABLES_2026.get(categoria, SALARY_TABLES_2026["vigilante_sin_arma"])
    año_convenio = settings.get("año_convenio", 2026)
    multiplier = get_convenio_multiplier(año_convenio)
    salary_data = {k: v * multiplier if isinstance(v,(int,float)) and k != "name" else v for k,v in salary_data_raw.items()}

    horas_anuales = settings.get("horas_anuales", 1782)
    meses_trabajo = settings.get("meses_trabajo", 11)
    days_in_month = calendar.monthrange(year, month)[1]
    porcentaje = settings.get("porcentaje_jornada", 100) / 100
    HORAS_MES_OBJETIVO = 162
    horas_mes_objetivo = HORAS_MES_OBJETIVO * porcentaje

    month_str = f"{year}-{str(month).zfill(2)}"
    query = {"user_id": user["id"], "date": {"$regex": f"^{month_str}"}}
    if company_id:
        query["company_id"] = company_id
    shifts = await db.shifts.find(query, {"_id": 0}).to_list(1000)

    total_hours_normal = sum(s.get("total_hours",0) for s in shifts if s.get("shift_type")=="normal")
    total_overtime_hours = sum(s.get("overtime_hours",0) for s in shifts if s.get("shift_type")=="normal")
    night_hours = sum(s.get("night_hours",0) for s in shifts if s.get("shift_type")=="normal")
    holiday_hours = sum(s.get("holiday_hours",0) for s in shifts if s.get("shift_type")=="normal")
    overtime_hours = total_overtime_hours
    horas_permisos = sum(s.get("total_hours",0) for s in shifts if s.get("shift_type")=="permiso_retribuido")
    horas_it = sum(s.get("total_hours",0) for s in shifts if s.get("shift_type")=="incapacidad_temporal")
    horas_at = sum(s.get("total_hours",0) for s in shifts if s.get("shift_type")=="accidente_trabajo")
    permisos = len([s for s in shifts if s.get("shift_type")=="permiso_retribuido"])
    incapacidad = len([s for s in shifts if s.get("shift_type")=="incapacidad_temporal"])
    accidente = len([s for s in shifts if s.get("shift_type")=="accidente_trabajo"])
    horas_computadas = total_hours_normal + total_overtime_hours

    salario_base = salary_data["salario_base"] * porcentaje
    plus_peligrosidad = salary_data["plus_peligrosidad"] * porcentaje
    plus_actividad = salary_data["plus_actividad"] * porcentaje
    plus_transporte = salary_data["plus_transporte"] * porcentaje
    plus_vestuario = salary_data["plus_vestuario"] * porcentaje
    trienios = settings.get("trienios",0)
    quinquenios = settings.get("quinquenios",0)
    plus_antiguedad = (salary_data["trienio"]*trienios + salary_data["quinquenio"]*quinquenios)*porcentaje
    plus_responsable = salary_data["salario_base"]*PLUS_RESPONSABLE_EQUIPO_PERCENT*porcentaje if settings.get("es_responsable_equipo") else 0
    plus_nocturnidad = night_hours * salary_data["nocturnidad_hora"]
    plus_festivo = holiday_hours * PLUS_FESTIVO_HORA
    plus_servicio_nombre = settings.get("plus_servicio_nombre","")
    plus_servicio_importe = settings.get("plus_servicio_importe",0.0)

    horas_mes_obj2 = settings.get("horas_anuales",1782) / settings.get("meses_trabajo",11)
    antiguedad_completa = salary_data["trienio"]*trienios + salary_data["quinquenio"]*quinquenios
    antiguedad_por_hora = antiguedad_completa / horas_mes_obj2 if horas_mes_obj2 > 0 else 0

    plus_kilometraje = settings.get("plus_kilometraje_km",0) * PLUS_KILOMETRAJE
    plus_aeropuerto = settings.get("plus_aeropuerto_horas",0) * PLUS_AEROPUERTO_HORA
    plus_radioscopia_aeroportuaria = settings.get("plus_radioscopia_aeroportuaria_horas",0) * PLUS_RADIOSCOPIA_AEROPORTUARIA_HORA
    plus_filtro_rotacion = settings.get("plus_filtro_rotacion_horas",0) * PLUS_FILTRO_ROTACION_HORA
    plus_radioscopia_basica = settings.get("plus_radioscopia_basica_horas",0) * PLUS_RADIOSCOPIA_BASICA_HORA
    plus_escolta = settings.get("plus_escolta_horas",0) * PLUS_ESCOLTA_HORA
    plus_nochebuena = PLUS_NOCHEBUENA_NOCHEVIEJA if settings.get("plus_nochebuena") else 0
    plus_nochevieja = PLUS_NOCHEBUENA_NOCHEVIEJA if settings.get("plus_nochevieja") else 0
    plus_hijo_discapacitado = PLUS_HIJO_DISCAPACITADO if settings.get("plus_hijo_discapacitado") else 0

    valor_base_hora_juicio = PRECIO_HORA_ASISTENCIA_JUICIO.get(categoria, 9.98)
    plus_asistencia_juicio = settings.get("plus_asistencia_juicio_horas",0) * (valor_base_hora_juicio + antiguedad_por_hora)
    plus_formacion_horas = settings.get("plus_formacion_horas",0)
    valor_hora_formacion = PRECIO_BASE_HORA_FORMACION + antiguedad_por_hora
    plus_formacion = plus_formacion_horas * valor_hora_formacion
    plus_asistencia_tiro_horas = settings.get("plus_asistencia_tiro_horas",0)
    valor_hora_asistencia_tiro = PRECIO_BASE_HORA_ASISTENCIA_TIRO + antiguedad_por_hora
    plus_asistencia_tiro = plus_asistencia_tiro_horas * valor_hora_asistencia_tiro

    dieta_una_comida = settings.get("dieta_una_comida",0) * 11.93
    dieta_dos_comidas = settings.get("dieta_dos_comidas",0) * 22.00
    dieta_pernocta_desayuno = settings.get("dieta_pernocta_desayuno",0) * 20.18
    dieta_pernocta_dos_comidas = settings.get("dieta_pernocta_dos_comidas",0) * 40.35
    dieta_completa_8_dia = settings.get("dieta_completa_8_dia",0) * 32.07
    total_dietas = dieta_una_comida+dieta_dos_comidas+dieta_pernocta_desayuno+dieta_pernocta_dos_comidas+dieta_completa_8_dia
    total_pluses_convenio = (plus_kilometraje+plus_aeropuerto+plus_radioscopia_aeroportuaria+plus_filtro_rotacion+
                             plus_radioscopia_basica+plus_escolta+plus_nochebuena+plus_nochevieja+
                             plus_hijo_discapacitado+plus_asistencia_juicio+plus_formacion+plus_asistencia_tiro)

    pagas_prorrateadas = settings.get("pagas_prorrateadas", True)
    paga_extra_base = salario_base + plus_antiguedad + plus_peligrosidad
    if pagas_prorrateadas:
        paga_extra_mes = (paga_extra_base*3)/12
        es_mes_paga_extra = False
    else:
        paga_extra_mes = paga_extra_base if month in [3,7,12] else 0
        es_mes_paga_extra = month in [3,7,12]

    num_quinquenios = settings.get("quinquenios",0)
    num_trienios = settings.get("trienios",0)
    if categoria in TABLA_HORA_EXTRA:
        tabla_cat = TABLA_HORA_EXTRA[categoria]
        if num_quinquenios >= 4 and num_trienios > 0:
            clave = f"4q{min(num_trienios,3)}t"
            valor_hora_extra = tabla_cat.get(clave, tabla_cat.get(5,9.98))
        else:
            valor_hora_extra = tabla_cat.get(min(num_quinquenios,5),9.98)
    else:
        valor_hora_extra = PRECIO_HORA_ASISTENCIA_JUICIO.get(categoria,9.98) + antiguedad_por_hora
    importe_horas_extras = overtime_hours * valor_hora_extra

    salario_bruto_base = salario_base+plus_peligrosidad+plus_actividad+plus_antiguedad+plus_responsable
    pluses_cotizables = plus_nocturnidad+plus_festivo+paga_extra_mes+plus_servicio_importe+total_pluses_convenio
    pluses_no_cotizables = plus_transporte+plus_vestuario+total_dietas
    total_bruto = salario_bruto_base+pluses_cotizables+pluses_no_cotizables+importe_horas_extras
    base_cotizacion = salario_bruto_base+pluses_cotizables

    tipo_contrato = settings.get("tipo_contrato","indefinido")
    irpf_porcentaje = settings.get("irpf_porcentaje",12.0)
    horas_extra_fuerza_mayor = settings.get("horas_extra_fuerza_mayor",False)
    deduccion_cc = base_cotizacion*0.047
    tasa_desempleo_trabajador = 0.0155 if tipo_contrato=="indefinido" else 0.0160
    deduccion_desempleo = base_cotizacion*tasa_desempleo_trabajador
    deduccion_fp = base_cotizacion*0.001
    deduccion_mei = base_cotizacion*0.0013
    tasa_horas_extras = 0.02 if horas_extra_fuerza_mayor else 0.047
    deduccion_horas_extras = importe_horas_extras*tasa_horas_extras
    total_deducciones_ss = deduccion_cc+deduccion_desempleo+deduccion_fp+deduccion_mei+deduccion_horas_extras
    deduccion_irpf = total_bruto*(irpf_porcentaje/100)
    total_deducciones = total_deducciones_ss+deduccion_irpf
    salario_neto = total_bruto-total_deducciones

    coste_cc_empresa = base_cotizacion*0.2360
    tasa_desempleo_empresa = 0.0550 if tipo_contrato=="indefinido" else 0.0670
    coste_desempleo_empresa = base_cotizacion*tasa_desempleo_empresa
    coste_fogasa = base_cotizacion*0.0020
    coste_fp_empresa = base_cotizacion*0.0060
    coste_at_ep = base_cotizacion*0.0150
    coste_mei_empresa = base_cotizacion*0.0058
    coste_horas_extras_empresa = importe_horas_extras*(0.12 if horas_extra_fuerza_mayor else 0.2360)
    total_coste_ss_empresa = coste_cc_empresa+coste_desempleo_empresa+coste_fogasa+coste_fp_empresa+coste_at_ep+coste_mei_empresa+coste_horas_extras_empresa
    coste_total_empresa = total_bruto+total_coste_ss_empresa

    return {
        "year": year, "month": month, "categoria": salary_data["name"],
        "porcentaje_jornada": settings.get("porcentaje_jornada",100),
        "tipo_contrato": tipo_contrato,
        "jornada": {"horas_anuales": horas_anuales, "meses_trabajo": meses_trabajo,
                    "horas_mes_objetivo": round(horas_mes_objetivo,2), "dias_mes": days_in_month},
        "desglose_bruto": {
            "salario_base": round(salario_base,2), "plus_peligrosidad": round(plus_peligrosidad,2),
            "plus_actividad": round(plus_actividad,2), "plus_transporte": round(plus_transporte,2),
            "plus_vestuario": round(plus_vestuario,2), "plus_antiguedad": round(plus_antiguedad,2),
            "plus_responsable_equipo": round(plus_responsable,2),
            "plus_nocturnidad": round(plus_nocturnidad,2), "plus_festivo": round(plus_festivo,2),
            "plus_servicio_nombre": plus_servicio_nombre, "plus_servicio_importe": round(plus_servicio_importe,2),
            "paga_extra": round(paga_extra_mes,2),
            "horas_extras": round(importe_horas_extras,2), "horas_extras_cantidad": round(overtime_hours,2),
            "valor_hora_extra": round(valor_hora_extra,2),
            "pluses_convenio": {"total": round(total_pluses_convenio,2)},
            "dietas": {"total": round(total_dietas,2)}
        },
        "pagas_extras": {"prorrateadas": pagas_prorrateadas, "importe_paga": round(paga_extra_base,2),
                         "meses_cobro": [3,7,12] if not pagas_prorrateadas else "mensual",
                         "es_mes_paga": es_mes_paga_extra if not pagas_prorrateadas else False},
        "horas": {"trabajadas": round(total_hours_normal,2), "computadas": round(horas_computadas,2),
                  "nocturnas": round(night_hours,2), "festivas": round(holiday_hours,2),
                  "extras": round(overtime_hours,2), "permisos": round(horas_permisos,2),
                  "it": round(horas_it,2), "at": round(horas_at,2),
                  "importe_horas_extras": round(importe_horas_extras,2)},
        "ausencias": {"permisos_retribuidos": permisos, "incapacidad_temporal": incapacidad, "accidente_trabajo": accidente},
        "base_cotizacion": round(base_cotizacion,2), "total_bruto": round(total_bruto,2),
        "deducciones_trabajador": {
            "contingencias_comunes": round(deduccion_cc,2), "desempleo": round(deduccion_desempleo,2),
            "formacion_profesional": round(deduccion_fp,2), "mei": round(deduccion_mei,2),
            "horas_extras": round(deduccion_horas_extras,2), "total_ss": round(total_deducciones_ss,2),
            "irpf_porcentaje": irpf_porcentaje, "irpf": round(deduccion_irpf,2), "total": round(total_deducciones,2)
        },
        "salario_neto": round(salario_neto,2),
        "costes_empresa": {
            "contingencias_comunes": round(coste_cc_empresa,2), "desempleo": round(coste_desempleo_empresa,2),
            "fogasa": round(coste_fogasa,2), "formacion_profesional": round(coste_fp_empresa,2),
            "at_ep": round(coste_at_ep,2), "mei": round(coste_mei_empresa,2),
            "horas_extras": round(coste_horas_extras_empresa,2), "total_ss": round(total_coste_ss_empresa,2),
            "coste_total": round(coste_total_empresa,2)
        },
        "shifts_count": len(shifts)
    }

# ============================================================
# ROUTES — MISC
# ============================================================

@api_router.get("/holidays/{year}")
async def get_holidays(year: int):
    if year == 2026:
        return {"year": year, "holidays": [
            {"date": d, "name": n} for d, n in [
                ("2026-01-01","Año Nuevo"),("2026-01-06","Epifanía del Señor"),
                ("2026-04-02","Jueves Santo"),("2026-04-03","Viernes Santo"),
                ("2026-05-01","Fiesta del Trabajo"),("2026-08-15","Asunción de la Virgen"),
                ("2026-10-12","Fiesta Nacional de España"),("2026-11-02","Día de Todos los Santos"),
                ("2026-12-07","Día de la Constitución"),("2026-12-08","Inmaculada Concepción"),
                ("2026-12-25","Navidad"),
            ]
        ]}
    return {"year": year, "holidays": []}

@api_router.get("/categories")
async def get_categories():
    return [{"id": k, "name": v["name"], "salario_total": v["salario_total"]} for k,v in SALARY_TABLES_2026.items()]

@api_router.get("/salary-table/{categoria}")
async def get_salary_table(categoria: str):
    if categoria not in SALARY_TABLES_2026:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return SALARY_TABLES_2026[categoria]

@api_router.get("/stats/monthly/{year}")
async def get_monthly_stats(year: int, company_id: Optional[int] = None, user=Depends(get_current_user)):
    stats_by_month = []
    for month_num in range(1, 13):
        month_str = f"{year}-{str(month_num).zfill(2)}"
        query = {"user_id": user["id"], "date": {"$regex": f"^{month_str}"}}
        if company_id:
            query["company_id"] = company_id
        shifts = await db.shifts.find(query, {"_id": 0}).to_list(1000)
        stats_by_month.append({
            "month": month_num,
            "total_hours": round(sum(s.get("total_hours",0) for s in shifts),2),
            "night_hours": round(sum(s.get("night_hours",0) for s in shifts),2),
            "holiday_hours": round(sum(s.get("holiday_hours",0) for s in shifts),2),
            "overtime_hours": round(sum(s.get("overtime_hours",0) for s in shifts),2),
            "shifts_count": len(shifts)
        })
    return {"year": year, "company_id": company_id, "monthly_stats": stats_by_month}

# ============================================================
# APP STARTUP
# ============================================================

app.include_router(api_router)

@app.on_event("startup")
async def startup_db_indexes():
    try:
        await db.shifts.create_index([("user_id",1),("date",-1)])
        await db.shifts.create_index([("user_id",1),("company_id",1),("date",-1)])
        await db.users.create_index("email", unique=True)
        await db.user_settings.create_index([("user_id",1),("company_id",1)], unique=True)
        await db.shift_templates.create_index([("user_id",1),("name",1)])
        await db.companies.create_index([("user_id",1),("company_id",1)])
        await db.password_resets.create_index("token")
        await db.password_resets.create_index("expires_at", expireAfterSeconds=0)
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
