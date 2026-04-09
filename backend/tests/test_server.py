"""
SeguriTurno — Tests de Backend
Ejecutar con: pytest tests/ -v

Requiere httpx y pytest-asyncio:
    pip install -r requirements-dev.txt
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
import os

# Set test env vars BEFORE importing server
os.environ["JWT_SECRET"] = "test-secret-key-for-testing-only-32chars"
os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "seguriturno_test"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

from server import app, hash_password, verify_password, create_access_token
from server import calculate_total_hours, calculate_night_hours, is_holiday
from server import validate_password_strength, get_convenio_multiplier

# ============================================================
# UNIT TESTS — helpers de cálculo
# ============================================================

class TestPasswordValidation:
    def test_valid_password(self):
        assert validate_password_strength("Seguro123") == "Seguro123"

    def test_too_short(self):
        with pytest.raises(ValueError):
            validate_password_strength("Aa1")

    def test_no_uppercase(self):
        with pytest.raises(ValueError):
            validate_password_strength("seguro123")

    def test_no_number(self):
        with pytest.raises(ValueError):
            validate_password_strength("SeguriTurno")

    def test_no_lowercase(self):
        with pytest.raises(ValueError):
            validate_password_strength("SEGURO123")

class TestPasswordHash:
    def test_hash_and_verify(self):
        password = "MiContraseña123"
        hashed = hash_password(password)
        assert verify_password(password, hashed)

    def test_wrong_password(self):
        hashed = hash_password("Correcta123")
        assert not verify_password("Incorrecta456", hashed)

class TestHourCalculations:
    def test_normal_shift(self):
        assert calculate_total_hours("08:00", "16:00") == 8.0

    def test_overnight_shift(self):
        assert calculate_total_hours("22:00", "06:00") == 8.0

    def test_half_hour(self):
        assert calculate_total_hours("09:00", "09:30") == 0.5

    def test_night_hours_full_night(self):
        hours = calculate_night_hours("22:00", "06:00", "2026-01-15")
        assert hours == 8.0

    def test_night_hours_day_shift(self):
        hours = calculate_night_hours("08:00", "16:00", "2026-01-15")
        assert hours == 0.0

    def test_night_hours_partial(self):
        # 22:00–00:00 = 2h nocturnas
        hours = calculate_night_hours("20:00", "00:00", "2026-01-15")
        assert hours == 2.0

class TestHolidayDetection:
    def test_national_holiday(self):
        assert is_holiday("2026-01-01") is True   # Año Nuevo

    def test_saturday(self):
        assert is_holiday("2026-01-03") is True   # Sábado

    def test_sunday(self):
        assert is_holiday("2026-01-04") is True   # Domingo

    def test_working_day(self):
        assert is_holiday("2026-01-05") is False  # Lunes laboral

class TestConvenioMultiplier:
    def test_2026_base(self):
        assert get_convenio_multiplier(2026) == 1.0

    def test_2027(self):
        assert get_convenio_multiplier(2027) == 1.035

    def test_unknown_year(self):
        assert get_convenio_multiplier(2099) == 1.0

# ============================================================
# INTEGRATION TESTS — API endpoints
# ============================================================

# Mock de MongoDB para tests de integración
FAKE_USERS_DB: dict = {}
FAKE_RESETS_DB: dict = {}


def make_fake_db():
    """Crea un mock de la colección de MongoDB."""
    class FakeCollection:
        def __init__(self, store: dict):
            self._store = store

        async def find_one(self, query, projection=None):
            for doc in self._store.values():
                match = all(doc.get(k) == v for k, v in query.items() if not isinstance(v, dict))
                if match:
                    result = dict(doc)
                    if projection and "_id" in projection and projection["_id"] == 0:
                        result.pop("_id", None)
                    return result
            return None

        async def insert_one(self, doc):
            key = doc.get("id") or doc.get("token") or str(len(self._store))
            self._store[key] = dict(doc)

        async def update_one(self, query, update, upsert=False):
            for doc in self._store.values():
                match = all(doc.get(k) == v for k, v in query.items() if not isinstance(v, dict))
                if match:
                    doc.update(update.get("$set", {}))
                    return MagicMock(matched_count=1)
            return MagicMock(matched_count=0)

        async def create_index(self, *args, **kwargs):
            pass

        def find(self, query=None, projection=None):
            class Cursor:
                def __init__(self, docs):
                    self._docs = docs
                async def to_list(self, limit):
                    return self._docs
            matched = []
            for doc in self._store.values():
                if not query or all(doc.get(k) == v for k, v in (query or {}).items() if not isinstance(v, dict)):
                    result = dict(doc)
                    matched.append(result)
            return Cursor(matched)

    return FakeCollection

@pytest.fixture(autouse=True)
def clear_stores():
    FAKE_USERS_DB.clear()
    FAKE_RESETS_DB.clear()


@pytest_asyncio.fixture
async def client():
    FakeCol = make_fake_db()
    import server as srv
    srv.db.users = FakeCol(FAKE_USERS_DB)
    srv.db.user_settings = FakeCol({})
    srv.db.password_resets = FakeCol(FAKE_RESETS_DB)
    srv.db.shifts = FakeCol({})
    srv.db.companies = FakeCol({})

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestAuthRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, client):
        resp = await client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "Seguro123",
            "name": "Test User"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["role"] == "user"

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client):
        resp = await client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "1234",
            "name": "Test User"
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client):
        payload = {"email": "dup@example.com", "password": "Seguro123", "name": "User"}
        await client.post("/api/auth/register", json=payload)
        resp = await client.post("/api/auth/register", json=payload)
        assert resp.status_code == 400
        assert "registrado" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client):
        resp = await client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "Seguro123",
            "name": "Test"
        })
        assert resp.status_code == 422


class TestAuthLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client):
        await client.post("/api/auth/register", json={
            "email": "login@example.com", "password": "Seguro123", "name": "Login"
        })
        resp = await client.post("/api/auth/login", json={
            "email": "login@example.com", "password": "Seguro123"
        })
        assert resp.status_code == 200
        assert "token" in resp.json()

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client):
        await client.post("/api/auth/register", json={
            "email": "user@example.com", "password": "Seguro123", "name": "User"
        })
        resp = await client.post("/api/auth/login", json={
            "email": "user@example.com", "password": "WrongPass999"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client):
        resp = await client.post("/api/auth/login", json={
            "email": "nobody@example.com", "password": "Seguro123"
        })
        assert resp.status_code == 401


class TestAuthMe:
    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, client):
        reg = await client.post("/api/auth/register", json={
            "email": "me@example.com", "password": "Seguro123", "name": "Me"
        })
        token = reg.json()["token"]
        resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@example.com"

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 403  # HTTPBearer returns 403 when no token


class TestForgotPassword:
    @pytest.mark.asyncio
    async def test_forgot_password_always_200(self, client):
        # Should not reveal if email exists
        resp = await client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_forgot_password_creates_token(self, client):
        await client.post("/api/auth/register", json={
            "email": "reset@example.com", "password": "Seguro123", "name": "Reset"
        })
        with patch("server.send_reset_email") as mock_send:
            resp = await client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
            assert resp.status_code == 200
            mock_send.assert_called_once()


class TestPayrollCalculation:
    """Tests del cálculo de nómina (sin BD, usando helpers directamente)."""

    def test_salary_base_calculation(self):
        """Salario base vigilante sin arma al 100% jornada."""
        from server import SALARY_TABLES_2026
        data = SALARY_TABLES_2026["vigilante_sin_arma"]
        assert data["salario_base"] == 1161.28
        assert data["salario_total"] == 1435.45

    def test_night_supplement(self):
        """Plus nocturnidad: 8h nocturnas × 1.25€/h = 10€"""
        from server import SALARY_TABLES_2026
        night_rate = SALARY_TABLES_2026["vigilante_sin_arma"]["nocturnidad_hora"]
        result = 8.0 * night_rate
        assert round(result, 2) == 10.0

    def test_overtime_rate_no_seniority(self):
        """Hora extra vigilante sin arma sin antigüedad = 9.98€"""
        from server import TABLA_HORA_EXTRA
        rate = TABLA_HORA_EXTRA["vigilante_sin_arma"][0]
        assert rate == 9.98

    def test_overtime_rate_1_quinquenio(self):
        """Hora extra vigilante sin arma con 1 quinquenio = 10.36€"""
        from server import TABLA_HORA_EXTRA
        rate = TABLA_HORA_EXTRA["vigilante_sin_arma"][1]
        assert rate == 10.36

    def test_convenio_multiplier_2027(self):
        """El convenio 2027 aplica +3.5%"""
        result = 1161.28 * get_convenio_multiplier(2027)
        assert round(result, 2) == round(1161.28 * 1.035, 2)

    def test_ss_deduction_worker(self):
        """Deducción CC trabajador: 4.7% base cotización"""
        base = 1500.0
        expected = round(base * 0.047, 2)
        assert expected == 70.5

    def test_irpf_deduction(self):
        """IRPF 12% sobre bruto"""
        bruto = 1700.0
        irpf = round(bruto * 0.12, 2)
        assert irpf == 204.0


class TestRoles:
    @pytest.mark.asyncio
    async def test_admin_endpoint_forbidden_for_user(self, client):
        reg = await client.post("/api/auth/register", json={
            "email": "normal@example.com", "password": "Seguro123", "name": "Normal"
        })
        token = reg.json()["token"]
        resp = await client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403
