# SeguriTurno - Sistema de Gestión de Turnos y Nóminas

Sistema completo de gestión de turnos y cálculo de nóminas para el sector de seguridad privada en España, basado en el Convenio Colectivo 2026.

## 🚀 Características Principales

### ✨ Gestión de Turnos
- **3 calendarios independientes** para múltiples empresas
- **Turnos partidos** (dos horarios en el mismo día)
- **Plantillas de turnos** personalizables y reutilizables
- **Aplicación rápida** de plantillas con un click
- **Festivos nacionales** + festivos locales personalizables
- **Cálculo automático** de horas nocturnas, festivas y extras

### 💰 Cálculo de Nóminas
- **Cálculo completo** según Convenio Colectivo 2026
- **Todos los conceptos**: salario base, pluses, antigüedad, SS, IRPF
- **Exportación PDF** con desglose completo
- **Exportación Excel** con múltiples hojas detalladas
- **Tipos de contrato**: indefinido / temporal
- **Porcentaje de jornada** personalizable

### 📊 Estadísticas y Análisis
- **Gráficos interactivos** de horas mensuales
- **Tendencias anuales** por empresa
- **Filtros avanzados**: por tipo, fecha, comentario
- **Búsqueda** en comentarios de turnos
- **Cumplimiento de jornada** visual
- **Resumen mensual** detallado

### 🎨 Interfaz de Usuario
- **Diseño moderno** con Tailwind CSS y Radix UI
- **Modo oscuro** persistente
- **Responsive** optimizado para móvil y tablet
- **Animaciones suaves** en todas las interacciones
- **Accesibilidad mejorada** con aria-labels
- **PWA** con Service Workers

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web moderno y rápido
- **MongoDB** - Base de datos NoSQL
- **Motor** - Driver async para MongoDB
- **JWT** - Autenticación segura
- **Bcrypt** - Encriptación de contraseñas
- **Pydantic** - Validación de datos

### Frontend
- **React 18** - Framework UI
- **Tailwind CSS** - Estilos utility-first
- **Radix UI** - Componentes accesibles
- **Chart.js** - Gráficos interactivos
- **XLSX** - Exportación a Excel
- **Sonner** - Notificaciones elegantes

## 📦 Instalación

### Requisitos Previos
- Python 3.9+
- Node.js 16+
- MongoDB 4.4+

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Editar .env con tus configuraciones
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env
# Editar .env con la URL del backend
yarn start
```

## 🔧 Configuración

### Variables de Entorno

#### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=seguriturno_db
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
PORT=8001
HOST=0.0.0.0
ENVIRONMENT=development
```

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_NAME=SeguriTurno
REACT_APP_VERSION=1.5.0
```

## 📚 Estructura del Proyecto

```
/
├── backend/
│   ├── server.py          # Aplicación FastAPI principal
│   ├── requirements.txt   # Dependencias Python
│   └── .env              # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── App.js                      # Componente principal
│   │   ├── pages/                      # Páginas
│   │   │   ├── Dashboard.js           # Calendario de turnos
│   │   │   ├── Payroll.js            # Cálculo de nóminas
│   │   │   ├── Settings.js           # Configuración
│   │   │   ├── Login.js              # Inicio de sesión
│   │   │   └── Register.js           # Registro
│   │   ├── components/                # Componentes reutilizables
│   │   │   ├── ui/                   # Componentes UI base
│   │   │   ├── StatsChart.js         # Gráficos estadísticas
│   │   │   └── AdvancedFilters.js    # Filtros avanzados
│   │   ├── services/                  # Servicios API
│   │   │   └── api.js                # Cliente API centralizado
│   │   ├── utils/                     # Utilidades
│   │   │   └── excelExport.js        # Exportación Excel
│   │   └── hooks/                     # Custom hooks
│   │       └── useCustomHooks.js     # Hooks reutilizables
│   ├── package.json       # Dependencias Node
│   └── .env              # Variables de entorno
└── README.md             # Este archivo
```

## 🎯 Uso

### 1. Registro e Inicio de Sesión
- Crear cuenta con email y contraseña
- Iniciar sesión para acceder al sistema

### 2. Configuración Inicial (Settings)
- Seleccionar **categoría profesional**
- Configurar **porcentaje de jornada**
- Establecer **años de antigüedad**
- Definir **tipo de contrato** (indefinido/temporal)
- Configurar **IRPF** y otros parámetros fiscales
- Personalizar **pluses de servicio** si aplica

### 3. Gestión de Turnos (Dashboard)
- Seleccionar empresa (A, B o C)
- Hacer click en un día para añadir turno
- Usar **plantillas rápidas** para turnos recurrentes
- Activar **alarmas** para recordatorios
- Añadir **festivos locales** si es necesario

### 4. Cálculo de Nóminas (Payroll)
- Seleccionar mes y empresa
- Ver desglose completo automático
- Exportar a **PDF** o **Excel**
- Comparar diferentes meses

### 5. Estadísticas
- Ver gráficos de tendencias anuales
- Filtrar turnos por tipo, fecha o comentario
- Analizar cumplimiento de jornada
- Exportar datos a Excel

## 🔐 Seguridad

- **Autenticación JWT** con tokens seguros
- **Contraseñas encriptadas** con bcrypt
- **Sesiones expiradas** manejadas automáticamente
- **Validación de datos** en backend y frontend
- **CORS configurado** correctamente
- **Variables de entorno** para secretos

## ⚡ Optimizaciones

### Backend
- **Índices MongoDB** para queries rápidas
- **Async/Await** para operaciones concurrentes
- **Pydantic** para validación eficiente
- **Logging estructurado** para debugging

### Frontend
- **Custom hooks** para lógica reutilizable
- **Servicios API** centralizados
- **Memoización** de cálculos pesados
- **Lazy loading** preparado
- **Code splitting** optimizado

## 🐛 Solución de Problemas

### Backend no inicia
```bash
# Verificar que MongoDB está corriendo
pgrep -f mongod

# Revisar logs
tail -f /var/log/supervisor/backend.err.log
```

### Frontend no carga
```bash
# Limpiar caché
rm -rf node_modules
yarn install

# Verificar que .env tiene la URL correcta
cat frontend/.env
```

### Error de autenticación
```bash
# Limpiar localStorage
# En consola del navegador:
localStorage.clear()
```

## 📈 Mejoras Futuras

- [ ] Multi-idioma (catalán, gallego, euskera)
- [ ] Integración con Google Calendar
- [ ] Backup automático de datos
- [ ] Comparativas anuales
- [ ] Notificaciones push
- [ ] Modo offline con PWA
- [ ] Tests unitarios y E2E
- [ ] API REST documentada con OpenAPI

## 📄 Licencia

Este proyecto es privado y de uso exclusivo.

## 👥 Soporte

Para soporte técnico o consultas, contactar con el desarrollador.

---

**Versión:** 1.5.0  
**Última actualización:** Marzo 2026  
**Convenio aplicable:** Convenio Colectivo Estatal de Empresas de Seguridad 2026
