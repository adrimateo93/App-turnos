import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsChart } from "@/components/StatsChart";
import { 
  ChevronLeft, ChevronRight, Plus, Bell, Moon, Sun as SunIcon, Trash2, Edit2, 
  Target, TrendingUp, CalendarPlus, Clock, MessageSquare, Building2, Bookmark, 
  Settings2, Zap, BarChart3
} from "lucide-react";

const SPANISH_HOLIDAYS_2026 = [
  "2026-01-01", "2026-01-06", "2026-04-02", "2026-04-03", "2026-05-01",
  "2026-08-15", "2026-10-12", "2026-11-02", "2026-12-07", "2026-12-08", "2026-12-25"
];

const SHIFT_COLORS = [
  { id: "#EF4444", name: "Rojo" },
  { id: "#DC2626", name: "Rojo Oscuro" },
  { id: "#F97316", name: "Naranja" },
  { id: "#EA580C", name: "Naranja Oscuro" },
  { id: "#EAB308", name: "Amarillo" },
  { id: "#CA8A04", name: "Amarillo Oscuro" },
  { id: "#84CC16", name: "Lima" },
  { id: "#65A30D", name: "Lima Oscuro" },
  { id: "#22C55E", name: "Verde" },
  { id: "#16A34A", name: "Verde Oscuro" },
  { id: "#10B981", name: "Esmeralda" },
  { id: "#059669", name: "Esmeralda Oscuro" },
  { id: "#14B8A6", name: "Turquesa" },
  { id: "#0D9488", name: "Turquesa Oscuro" },
  { id: "#06B6D4", name: "Cyan" },
  { id: "#0891B2", name: "Cyan Oscuro" },
  { id: "#3B82F6", name: "Azul" },
  { id: "#2563EB", name: "Azul Oscuro" },
  { id: "#6366F1", name: "Índigo" },
  { id: "#4F46E5", name: "Índigo Oscuro" },
  { id: "#8B5CF6", name: "Morado" },
  { id: "#7C3AED", name: "Morado Oscuro" },
  { id: "#A855F7", name: "Púrpura" },
  { id: "#9333EA", name: "Púrpura Oscuro" },
  { id: "#EC4899", name: "Rosa" },
  { id: "#DB2777", name: "Rosa Oscuro" },
  { id: "#F43F5E", name: "Rosa Intenso" },
  { id: "#E11D48", name: "Rosa Muy Oscuro" },
  { id: "#FB923C", name: "Naranja Claro" },
  { id: "#FBBF24", name: "Ámbar" },
  { id: "#FCD34D", name: "Amarillo Claro" },
  { id: "#FDE047", name: "Amarillo Brillante" },
  { id: "#FFFFFF", name: "Blanco" },
  { id: "#E5E7EB", name: "Gris Claro" },
  { id: "#9CA3AF", name: "Gris" },
  { id: "#6B7280", name: "Gris Oscuro" },
  { id: "#374151", name: "Gris Muy Oscuro" },
  { id: "#1F2937", name: "Negro" }
];

const SHIFT_SYMBOLS = [
  { id: "none", name: "Sin símbolo" },
  // Turnos horarios
  { id: "☀️", name: "☀️ Mañana" },
  { id: "🌆", name: "🌆 Tarde" },
  { id: "🌙", name: "🌙 Noche" },
  // Servicios de Seguridad Específicos
  { id: "🚚", name: "🚚 Transporte" },
  { id: "🚨", name: "🚨 ACUDA" },
  { id: "🏘️", name: "🏘️ Urbanización" },
  { id: "🛒", name: "🛒 C. Comercial" },
  { id: "🏥", name: "🏥 Hospital" },
  { id: "📡", name: "📡 Rayos X" },
  { id: "✈️", name: "✈️ Aeropuerto" },
  { id: "⚓", name: "⚓ Puerto" },
  { id: "🚢", name: "🚢 Buque" },
  { id: "⚛️", name: "⚛️ Nuclear" },
  { id: "🐕", name: "🐕 Perros" },
  { id: "⚽", name: "⚽ Eventos" },
  { id: "🔒", name: "🔒 Internamiento" },
  { id: "🏛️", name: "🏛️ Patrimonio" },
  { id: "⚖️", name: "⚖️ Juzgado" },
  { id: "🚔", name: "🚔 Comisaría" },
  // Símbolos generales
  { id: "★", name: "★ Estrella" },
  { id: "●", name: "● Círculo" },
  { id: "■", name: "■ Cuadrado" },
  { id: "▲", name: "▲ Triángulo" },
  { id: "♦", name: "♦ Diamante" },
  { id: "✓", name: "✓ Check" },
  { id: "!", name: "! Importante" },
  { id: "?", name: "? Duda" },
  { id: "⚠", name: "⚠ Alerta" },
  { id: "♥", name: "♥ Corazón" },
  { id: "⚡", name: "⚡ Rayo" }
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function Dashboard() {
  const { authAxios } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showClearMonthModal, setShowClearMonthModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [horasObjetivoMes, setHorasObjetivoMes] = useState(162); // Dinámico basado en porcentaje_jornada
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const saved = localStorage.getItem('selectedCompany');
    return saved ? parseInt(saved) : 1;
  });
  const [localHolidays, setLocalHolidays] = useState(() => {
    const saved = localStorage.getItem('localHolidays');
    return saved ? JSON.parse(saved) : [];
  });
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [isTurnoPartido, setIsTurnoPartido] = useState(false);
  
  const [templateForm, setTemplateForm] = useState({
    name: "",
    label: "",
    start_time: "08:00",
    end_time: "16:00",
    start_time_2: "",
    end_time_2: "",
    color: "#3B82F6",
    symbol: "none"
  });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [companyNames, setCompanyNames] = useState({ 1: "Empresa A", 2: "Empresa B", 3: "Empresa C" });
  
  // New states for charts
  const [showStats, setShowStats] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState(null);
  
  const [formData, setFormData] = useState({
    label: "",
    start_time: "08:00",
    end_time: "14:00",
    start_time_2: "",
    end_time_2: "",
    overtime_hours: "",  // String vacío para no auto-borrar al escribir
    color: "#3B82F6",
    comment: "",
    alarm_enabled: false,
    alarm_times: [], // Array de tiempos: ['30min', '1hour', '1.5hours']
    symbol: "none"
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    localStorage.setItem('selectedCompany', selectedCompany.toString());
  }, [selectedCompany]);

  useEffect(() => {
    localStorage.setItem('localHolidays', JSON.stringify(localHolidays));
  }, [localHolidays]);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/shifts?year=${year}&month=${month + 1}&company_id=${selectedCompany}`);
      setShifts(response.data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast.error("Error al cargar turnos");
    } finally {
      setLoading(false);
    }
  }, [authAxios, year, month, selectedCompany]);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await authAxios.get(`/shift-templates?company_id=${selectedCompany}`);
      setShiftTemplates(response.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, [authAxios, selectedCompany]);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await authAxios.get('/companies');
      setCompanies(response.data);
      const names = {};
      response.data.forEach(c => {
        names[c.company_number] = c.name;
      });
      setCompanyNames(names);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, [authAxios]);

  useEffect(() => {
    fetchShifts();
    fetchTemplates(); // Recargar plantillas al cambiar empresa
  }, [fetchShifts, fetchTemplates]);

  // Fetch monthly statistics for charts
  const fetchMonthlyStats = useCallback(async () => {
    try {
      const response = await authAxios.get(`/stats/monthly/${year}?company_id=${selectedCompany}`);
      setMonthlyStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [authAxios, year, selectedCompany]);

  useEffect(() => {
    fetchTemplates();
    fetchCompanies();
    fetchMonthlyStats();
  }, [fetchTemplates, fetchCompanies, fetchMonthlyStats]);

  // Fetch settings to calculate dynamic target hours based on porcentaje_jornada
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await authAxios.get(`/settings?company_id=${selectedCompany}`);
        const porcentaje = response.data.porcentaje_jornada || 100;
        const horas_anuales = response.data.horas_anuales || 1782;
        const meses_trabajo = response.data.meses_trabajo || 11;
        
        // Calcular horas mensuales basadas en porcentaje de jornada
        const horasMesBase = horas_anuales / meses_trabajo;
        const horasMesConJornada = (horasMesBase * porcentaje) / 100;
        setHorasObjetivoMes(Math.round(horasMesConJornada));
      } catch (error) {
        console.error("Error fetching settings for target hours:", error);
        // Fallback to 162h (100%)
        setHorasObjetivoMes(162);
      }
    };
    
    fetchSettings();
  }, [authAxios, selectedCompany]);

  // Prepare chart data
  const chartData = monthlyStats ? {
    labels: MONTHS,
    datasets: [
      {
        label: 'Horas Totales',
        data: monthlyStats.monthly_stats.map(m => m.total_hours),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Horas Nocturnas',
        data: monthlyStats.monthly_stats.map(m => m.night_hours),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Horas Festivas',
        data: monthlyStats.monthly_stats.map(m => m.holiday_hours),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Horas Extras',
        data: monthlyStats.monthly_stats.map(m => m.overtime_hours),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  const isLocalHoliday = (dateStr) => localHolidays.some(h => h.date === dateStr);

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, currentMonth: false, date: null });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayOfWeek = new Date(year, month, i).getDay();
      const isSaturday = dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;
      const isNationalHoliday = SPANISH_HOLIDAYS_2026.includes(dateStr);
      const isLocalHol = isLocalHoliday(dateStr);
      const isToday = dateStr === new Date().toISOString().split("T")[0];
      
      days.push({
        day: i,
        currentMonth: true,
        date: dateStr,
        isSaturday,
        isSunday,
        isWeekend: isSaturday || isSunday,
        isNationalHoliday,
        isLocalHoliday: isLocalHol,
        isHoliday: isNationalHoliday || isLocalHol,
        isToday,
        shifts: shifts.filter(s => s.date === dateStr)
      });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: null });
    }
    
    return days;
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    if (!day.currentMonth || !day.date) return;
    
    // Si estamos en modo eliminar, eliminamos todos los turnos del día
    if (deleteMode) {
      if (day.shifts && day.shifts.length > 0) {
        day.shifts.forEach(async (shift) => {
          try {
            await authAxios.delete(`/shifts/${shift.id}`);
          } catch (error) {
            console.error("Error deleting shift:", error);
          }
        });
        toast.success(`${day.shifts.length} turno(s) eliminado(s)`);
        fetchShifts();
      } else {
        toast.info("No hay turnos en este día");
      }
      return;
    }
    
    setSelectedDate(day.date);
    setEditingShift(null);
    setIsTurnoPartido(false);
    setFormData({
      label: "",
      start_time: "08:00",
      end_time: "14:00",
      start_time_2: "",
      end_time_2: "",
      overtime_hours: 0,
      color: "#3B82F6",
      comment: "",
      alarm_enabled: false,
      alarm_times: [],
      symbol: "none"
    });
    setShowModal(true);
  };

  const handleEditShift = (e, shift) => {
    e.stopPropagation();
    
    // Si estamos en modo eliminar, eliminamos este turno
    if (deleteMode) {
      handleDeleteShiftDirect(shift.id);
      return;
    }
    
    setSelectedDate(shift.date);
    setEditingShift(shift);
    const hasSecondShift = shift.start_time_2 && shift.end_time_2;
    setIsTurnoPartido(hasSecondShift);
    setFormData({
      label: shift.label || "",
      start_time: shift.start_time,
      end_time: shift.end_time,
      start_time_2: shift.start_time_2 || "",
      end_time_2: shift.end_time_2 || "",
      overtime_hours: shift.overtime_hours,
      color: shift.color,
      comment: shift.comment || "",
      alarm_enabled: shift.alarm_enabled,
      alarm_times: shift.alarm_times || [],
      symbol: shift.symbol || "none"
    });
    setShowModal(true);
  };

  const handleDeleteShiftDirect = async (shiftId) => {
    try {
      await authAxios.delete(`/shifts/${shiftId}`);
      toast.success("Turno eliminado");
      fetchShifts();
    } catch (error) {
      toast.error("Error al eliminar turno");
    }
  };

  const handleDeleteShift = async (e, shiftId) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar este turno?")) return;
    handleDeleteShiftDirect(shiftId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    // Validación: La etiqueta es obligatoria
    if (!formData.label || formData.label.trim() === "") {
      toast.error("Debes seleccionar una plantilla o turno especial. La etiqueta es obligatoria.");
      return;
    }
    
    // Verificar límite de 2 turnos por día (solo al crear nuevo)
    if (!editingShift) {
      const existingShifts = shifts.filter(s => s.date === selectedDate && s.company_id === selectedCompany);
      if (existingShifts.length >= 2) {
        toast.error("Máximo 2 turnos por día");
        return;
      }
    }
    
    const payload = {
      ...formData,
      date: selectedDate,
      company_id: selectedCompany,
      symbol: formData.symbol === "none" ? "" : formData.symbol,
      shift_type: "normal"
    };
    
    console.log("Payload con label:", payload.label); // Debug
    
    if (isTurnoPartido && formData.start_time_2 && formData.end_time_2) {
      payload.start_time_2 = formData.start_time_2;
      payload.end_time_2 = formData.end_time_2;
    } else {
      payload.start_time_2 = null;
      payload.end_time_2 = null;
    }
    
    try {
      if (editingShift) {
        await authAxios.put(`/shifts/${editingShift.id}`, payload);
        toast.success("Turno actualizado");
      } else {
        await authAxios.post("/shifts", payload);
        toast.success("Turno añadido");
      }
      setShowModal(false);
      setSelectedDate(null);
      fetchShifts();
    } catch (error) {
      toast.error("Error al guardar turno");
      console.error("Error detallado:", error);
    }
  };

  const applyTemplate = (template) => {
    if (!selectedDate) return;
    
    // Solo cargar los datos de la plantilla en el formulario, NO guardar
    setFormData({
      label: template.label || "",
      start_time: template.start_time,
      end_time: template.end_time,
      start_time_2: template.start_time_2 || "",
      end_time_2: template.end_time_2 || "",
      overtime_hours: 0,
      color: template.color,
      comment: "",
      alarm_enabled: false,
      alarm_times: [],
      symbol: template.symbol === "none" ? "none" : (template.symbol || "none")
    });
    
    setIsTurnoPartido(!!(template.start_time_2 && template.end_time_2));
    
    toast.success(`Plantilla "${template.name}" cargada`);
  };

  const handleQuickShift = async (type) => {
    if (!selectedDate) {
      toast.error("Selecciona una fecha primero");
      return;
    }
    
    // Calcular horas según el tipo
    let totalHours = 0;
    let shiftType = type;
    let shiftColor = "#10B981";
    let shiftLabel = "";
    
    // Obtener días del mes actual
    const [year, month] = selectedDate.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    switch(type) {
      case 'vacaciones':
        totalHours = horasObjetivoMes / daysInMonth;
        shiftType = "normal";
        shiftColor = "#10B981"; // Verde
        shiftLabel = "VAC";
        break;
      case 'incapacidad_temporal':
        totalHours = 5.335;
        shiftType = "incapacidad_temporal";
        shiftColor = "#F97316"; // Naranja
        shiftLabel = "IT";
        break;
      case 'accidente_trabajo':
        totalHours = 5.40;
        shiftType = "accidente_trabajo";
        shiftColor = "#EF4444"; // Rojo
        shiftLabel = "AT";
        break;
      case 'permiso_retribuido':
        totalHours = 5.335;
        shiftType = "permiso_retribuido";
        shiftColor = "#3B82F6"; // Azul
        shiftLabel = "PR";
        break;
      case 'asuntos_propios':
        totalHours = 0;
        shiftType = "normal";
        shiftColor = "#A855F7"; // Púrpura
        shiftLabel = "AP";
        break;
    }
    
    // Calcular horarios ficticios (08:00 + horas calculadas)
    const startHour = 8;
    const endHour = startHour + Math.floor(totalHours);
    const endMinutes = Math.round((totalHours % 1) * 60);
    
    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    
    const payload = {
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      start_time_2: null,
      end_time_2: null,
      overtime_hours: 0,
      color: shiftColor,
      comment: "",
      alarm_enabled: false,
      alarm_times: [],
      shift_type: shiftType,
      symbol: "",
      label: shiftLabel,
      company_id: selectedCompany
    };
    
    try {
      await authAxios.post("/shifts", payload);
      toast.success(`${shiftLabel} añadido (${totalHours.toFixed(2)}h)`);
      setShowModal(false);
      setSelectedDate(null);
      fetchShifts();
    } catch (error) {
      toast.error("Error al añadir turno especial");
    }
  };

  const [quickApplyTemplate, setQuickApplyTemplate] = useState(null);
  
  const handleQuickDayClick = async (day) => {
    if (!day.currentMonth || !day.date) return;
    
    if (deleteMode) {
      handleDayClick(day);
      return;
    }
    
    // Limitar a 2 turnos máximo por casilla
    if (day.shifts && day.shifts.length >= 2) {
      toast.error("Máximo 2 turnos por día");
      return;
    }
    
    if (quickApplyTemplate) {
      const payload = {
        date: day.date,
        start_time: quickApplyTemplate.start_time,
        end_time: quickApplyTemplate.end_time,
        start_time_2: quickApplyTemplate.start_time_2 || null,
        end_time_2: quickApplyTemplate.end_time_2 || null,
        overtime_hours: 0,
        color: quickApplyTemplate.color,
        comment: "",
        alarm_enabled: false,
        alarm_times: [],
        shift_type: "normal",
        symbol: quickApplyTemplate.symbol === "none" ? "" : (quickApplyTemplate.symbol || ""),
        label: quickApplyTemplate.label || "",
        company_id: selectedCompany
      };
      
      try {
        await authAxios.post("/shifts", payload);
        toast.success(`"${quickApplyTemplate.name}" añadido`);
        fetchShifts();
      } catch (error) {
        toast.error("Error al añadir turno");
      }
    } else {
      handleDayClick(day);
    }
  };

  const handleAddLocalHoliday = () => {
    if (!newHolidayDate || !newHolidayName) {
      toast.error("Introduce fecha y nombre del festivo");
      return;
    }
    if (localHolidays.some(h => h.date === newHolidayDate)) {
      toast.error("Este festivo ya existe");
      return;
    }
    setLocalHolidays([...localHolidays, { date: newHolidayDate, name: newHolidayName }]);
    setNewHolidayDate("");
    setNewHolidayName("");
    toast.success("Festivo local añadido");
  };

  const handleRemoveLocalHoliday = (date) => {
    setLocalHolidays(localHolidays.filter(h => h.date !== date));
    toast.success("Festivo eliminado");
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!templateForm.name || templateForm.name.trim() === "") {
      toast.error("El nombre es obligatorio");
      return;
    }
    
    if (!templateForm.label || templateForm.label.trim() === "") {
      toast.error("La etiqueta es obligatoria");
      return;
    }
    
    if (templateForm.label.length > 3) {
      toast.error("La etiqueta debe tener máximo 3 caracteres");
      return;
    }
    
    const payload = {
      name: templateForm.name,
      label: templateForm.label.toUpperCase(),
      start_time: templateForm.start_time,
      end_time: templateForm.end_time,
      start_time_2: isTurnoPartido ? templateForm.start_time_2 : null,
      end_time_2: isTurnoPartido ? templateForm.end_time_2 : null,
      color: templateForm.color,
      symbol: templateForm.symbol === "none" ? "none" : templateForm.symbol,
      company_id: selectedCompany
    };
    
    try {
      if (editingTemplate) {
        await authAxios.put(`/shift-templates/${editingTemplate.id}`, payload);
        toast.success("Plantilla actualizada");
      } else {
        await authAxios.post("/shift-templates", payload);
        toast.success("Plantilla creada");
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setIsTurnoPartido(false);
      setTemplateForm({
        name: "",
        label: "",
        start_time: "08:00",
        end_time: "16:00",
        start_time_2: "",
        end_time_2: "",
        color: "#3B82F6",
        symbol: "none"
      });
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar plantilla");
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name || "",
      label: template.label || "",
      start_time: template.start_time || "08:00",
      end_time: template.end_time || "16:00",
      start_time_2: template.start_time_2 || "",
      end_time_2: template.end_time_2 || "",
      color: template.color || "#3B82F6",
      symbol: template.symbol || "none"
    });
    setIsTurnoPartido(!!(template.start_time_2 && template.end_time_2));
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await authAxios.delete(`/shift-templates/${templateId}`);
      toast.success("Turno eliminado");
      fetchTemplates();
    } catch (error) {
      toast.error("Error al eliminar turno");
    }
  };

  const handleUpdateCompanyName = async (companyNumber, newName) => {
    try {
      await authAxios.put(`/companies/${companyNumber}`, { name: newName });
      setCompanyNames(prev => ({ ...prev, [companyNumber]: newName }));
      toast.success("Nombre actualizado");
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleClearMonth = async () => {
    try {
      const monthShifts = shifts.filter(s => {
        const shiftDate = new Date(s.date);
        return shiftDate.getFullYear() === year && shiftDate.getMonth() === month;
      });

      if (monthShifts.length === 0) {
        toast.info("No hay turnos para eliminar este mes");
        setShowClearMonthModal(false);
        return;
      }

      // Eliminar todos los turnos del mes
      await Promise.all(
        monthShifts.map(shift => authAxios.delete(`/shifts/${shift.id}`))
      );

      toast.success(`${monthShifts.length} turno(s) eliminado(s) de ${MONTHS[month]}`);
      setShowClearMonthModal(false);
      fetchShifts();
    } catch (error) {
      toast.error("Error al limpiar el mes");
      console.error(error);
    }
  };

  const monthStats = {
    totalHours: shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0),
    nightHours: shifts.reduce((sum, s) => sum + (s.night_hours || 0), 0),
    holidayHours: shifts.reduce((sum, s) => sum + (s.holiday_hours || 0), 0),
    overtimeHours: shifts.reduce((sum, s) => sum + (s.overtime_hours || 0), 0),
    shiftsCount: shifts.length
  };

  const horasComputadas = monthStats.totalHours;
  const cumpleJornada = horasComputadas >= horasObjetivoMes;
  const horasExtrasRealizadas = cumpleJornada ? horasComputadas - horasObjetivoMes : 0;
  const horasFaltantes = !cumpleJornada ? horasObjetivoMes - horasComputadas : 0;
  const progressPercent = Math.min(100, (horasComputadas / horasObjetivoMes) * 100);

  const days = getDaysInMonth();

  return (
    <div className="space-y-4" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Calendario de Turnos</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus turnos de trabajo</p>
          </div>
          
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setSelectedCompany(1)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${selectedCompany === 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {companyNames[1]}
            </button>
            <button
              onClick={() => setSelectedCompany(2)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${selectedCompany === 2 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {companyNames[2]}
            </button>
            <button
              onClick={() => setSelectedCompany(3)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${selectedCompany === 3 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {companyNames[3]}
            </button>
            <button onClick={() => setShowCompanyModal(true)} className="p-1.5 hover:bg-muted rounded">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="default" onClick={() => setShowTemplateModal(true)} className="w-11 h-11 p-0" title="Crear Turno">
              <Bookmark className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="default" onClick={() => setShowHolidayModal(true)} className="w-11 h-11 p-0" title="Festivos Locales">
              <CalendarPlus className="w-5 h-5" />
            </Button>
            <Button 
              variant={showStats ? "default" : "outline"} 
              size="default" 
              onClick={() => setShowStats(!showStats)} 
              className="w-11 h-11 p-0"
              title="Estadísticas"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button 
              variant={deleteMode ? "destructive" : "outline"} 
              size="default" 
              onClick={() => setDeleteMode(!deleteMode)} 
              className="w-11 h-11 p-0"
              title={deleteMode ? "Cancelar" : "Modo Eliminar"}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-secondary rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm sm:text-lg font-semibold min-w-[140px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-secondary rounded">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearMonthModal(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Limpiar todo el mes"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar Mes
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Mode Banner */}
      {deleteMode && (
        <div className="p-3 bg-red-500 text-white rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Modo Eliminar: Pulsa en una casilla o turno para borrarlo</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setDeleteMode(false)}>
            Terminar
          </Button>
        </div>
      )}

      {/* Statistics Charts */}
      {showStats && monthlyStats && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Estadísticas Anuales {year} - {companyNames[selectedCompany]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatsChart data={chartData} isDark={document.documentElement.classList.contains('dark')} />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {monthlyStats && monthlyStats.monthly_stats.map((stat, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-1">{MONTHS[idx]}</div>
                  <div className="text-sm font-semibold">{stat.total_hours}h</div>
                  <div className="text-xs text-muted-foreground">{stat.shifts_count} turnos</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Templates Bar */}
      {shiftTemplates.length > 0 && !deleteMode && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg overflow-x-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Zap className="w-3 h-3" /> Aplicar:
          </span>
          {shiftTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => setQuickApplyTemplate(quickApplyTemplate?.id === t.id ? null : t)}
              className={`px-3 py-1.5 rounded text-sm font-medium text-white whitespace-nowrap transition-all ${quickApplyTemplate?.id === t.id ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''}`}
              style={{ backgroundColor: t.color }}
            >
              {t.symbol && t.symbol !== "none" && <span className="mr-1">{t.symbol}</span>}
              {t.name}
            </button>
          ))}
          {quickApplyTemplate && (
            <span className="text-xs text-green-600 dark:text-green-400 ml-2">
              ✓ Pulsa en un día para añadir "{quickApplyTemplate.name}"
            </span>
          )}
        </div>
      )}

      {/* Cumplimiento Jornada */}
      <div className={`p-3 sm:p-4 rounded-lg border-2 ${cumpleJornada ? 'bg-green-50 dark:bg-green-950/30 border-green-500' : 'bg-red-50 dark:bg-red-950/30 border-red-500'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Target className={`w-5 h-5 ${cumpleJornada ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-semibold text-sm sm:text-base">Cumplimiento de Jornada ({companyNames[selectedCompany]})</span>
          </div>
          <div className="text-right">
            <span className={`text-xl sm:text-2xl font-bold tabular-nums ${cumpleJornada ? 'text-green-600' : 'text-red-600'}`}>
              {horasComputadas.toFixed(1)}h
            </span>
            <span className="text-muted-foreground text-sm"> / {horasObjetivoMes}h</span>
          </div>
        </div>
        <Progress value={progressPercent} className={`h-2 sm:h-3 ${cumpleJornada ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`} />
        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
          {cumpleJornada ? (
            <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">¡Jornada cumplida!</span>
              {horasExtrasRealizadas > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs font-bold">
                  +{horasExtrasRealizadas.toFixed(1)}h extras
                </span>
              )}
            </div>
          ) : (
            <span className="text-red-700 dark:text-red-400 font-medium">
              Faltan {horasFaltantes.toFixed(1)}h para cumplir
            </span>
          )}
          <span className="text-muted-foreground text-xs">Objetivo: {horasObjetivoMes}h/mes</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="stat-card p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-base sm:text-xl font-bold tabular-nums">{monthStats.totalHours.toFixed(1)}h</p>
        </div>
        <div className="stat-card p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Moon className="w-3 h-3" /> Noct.
          </p>
          <p className="text-base sm:text-xl font-bold tabular-nums">{monthStats.nightHours.toFixed(1)}h</p>
        </div>
        <div className="stat-card p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <SunIcon className="w-3 h-3" /> Fest.
          </p>
          <p className="text-base sm:text-xl font-bold tabular-nums">{monthStats.holidayHours.toFixed(1)}h</p>
        </div>
        <div className="stat-card p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Turnos</p>
          <p className="text-base sm:text-xl font-bold tabular-nums">{monthStats.shiftsCount}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="border rounded-md overflow-hidden bg-card -mx-2 sm:mx-0">
        <div className="grid grid-cols-7">
          {DAYS.map((day, i) => (
            <div 
              key={day} 
              className={`py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold uppercase tracking-wider border-b ${
                i === 5 ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30" : 
                i === 6 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" : 
                "text-muted-foreground bg-muted"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="calendar-grid-xl">
            {days.map((day, index) => (
              <div
                key={`day-${index}-${day.date || 'empty'}`}
                onClick={() => day.currentMonth && handleQuickDayClick(day)}
                className={`calendar-day-xl ${!day.currentMonth ? "opacity-30 cursor-default" : "cursor-pointer hover:bg-muted/50"} 
                  ${day.isToday ? "ring-2 ring-inset ring-primary" : ""} 
                  ${day.isSaturday && !day.isNationalHoliday && !day.isLocalHoliday ? "bg-blue-50 dark:bg-blue-950/20" : ""} 
                  ${day.isSunday && !day.isNationalHoliday && !day.isLocalHoliday ? "bg-red-50 dark:bg-red-950/20" : ""} 
                  ${day.isNationalHoliday ? "bg-orange-100 dark:bg-orange-950/30" : ""} 
                  ${day.isLocalHoliday && !day.isNationalHoliday ? "bg-purple-100 dark:bg-purple-950/30" : ""}
                  ${deleteMode ? "hover:bg-red-100 dark:hover:bg-red-950/30" : ""}
                  ${quickApplyTemplate && !deleteMode ? "hover:ring-2 hover:ring-primary" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm sm:text-base font-medium
                    ${day.isToday ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center" : ""} 
                    ${day.isSaturday && !day.isToday ? "text-blue-600 dark:text-blue-400" : ""} 
                    ${day.isSunday && !day.isToday ? "text-red-600 dark:text-red-400" : ""} 
                    ${day.isNationalHoliday && !day.isToday ? "text-orange-700 dark:text-orange-400 font-bold" : ""}
                    ${day.isLocalHoliday && !day.isNationalHoliday && !day.isToday ? "text-purple-700 dark:text-purple-400 font-bold" : ""}`}>
                    {day.day}
                  </span>
                </div>
                
                <div className="shifts-container-xl">
                  {day.shifts?.map((shift) => (
                    <div
                      key={shift.id}
                      className={`shift-chip-xl ${deleteMode ? 'ring-2 ring-red-500' : ''} relative`}
                      style={{ backgroundColor: shift.color }}
                      onClick={(e) => handleEditShift(e, shift)}
                    >
                      {shift.comment && (
                        <MessageSquare className="absolute top-1 right-1 w-3 h-3 text-white opacity-90 z-20" style={{ pointerEvents: 'none' }} />
                      )}
                      <div className="shift-time-row">
                        {shift.symbol && shift.symbol !== "none" && <span className="shift-symbol">{shift.symbol}</span>}
                        <span className="shift-label">{shift.label || "?"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-950/50 border border-blue-300" />
          <span className="text-muted-foreground">Sábado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950/50 border border-red-300" />
          <span className="text-muted-foreground">Domingo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-950/50 border border-orange-300" />
          <span className="text-muted-foreground">Festivo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Comentario</span>
        </div>
      </div>

      {/* Shift Modal - Simplified */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setSelectedDate(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? "Editar Turno" : "Añadir Turno"} - {selectedDate}
            </DialogTitle>
          </DialogHeader>
          
          {/* SECCIÓN 0: COMENTARIO - ARRIBA DE TODO */}
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <Label className="text-sm font-semibold">💬 Comentario del turno</Label>
            <Textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Añade una nota sobre este turno..."
              rows={2}
              className="text-sm"
            />
          </div>
          
          {/* SECCIÓN 1: PLANTILLAS - ARRIBA */}
          {!editingShift && shiftTemplates.length > 0 && (
            <div className="space-y-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <span>📋</span> Selecciona una plantilla de turno:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {shiftTemplates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="p-3 rounded-lg text-white hover:opacity-90 transition-all hover:scale-105 flex flex-col items-center gap-1 shadow-md"
                    style={{ backgroundColor: t.color }}
                    title={`${t.name}\n${t.start_time}-${t.end_time}${t.start_time_2 ? `\n${t.start_time_2}-${t.end_time_2}` : ''}`}
                  >
                    {t.symbol && t.symbol !== "none" && (
                      <span className="text-xl">{t.symbol}</span>
                    )}
                    <span className="font-bold text-base">{t.label}</span>
                    <span className="text-xs opacity-90">{t.name}</span>
                    <span className="text-xs opacity-75">{t.start_time}-{t.end_time}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">Click en una plantilla para cargar sus datos. Puedes editarlos antes de guardar.</p>
            </div>
          )}
          
          {/* SECCIÓN 2: TURNOS ESPECIALES */}
          {!editingShift && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg space-y-2 border-2 border-amber-200 dark:border-amber-800">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100">⚡ Turnos Especiales (se guardan automáticamente):</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickShift('vacaciones')}
                  className="px-3 py-2 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  Vacaciones
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShift('incapacidad_temporal')}
                  className="px-3 py-2 rounded text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                >
                  IT
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShift('accidente_trabajo')}
                  className="px-3 py-2 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  AT
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShift('permiso_retribuido')}
                  className="px-3 py-2 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Permiso Ret.
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickShift('asuntos_propios')}
                  className="px-3 py-2 rounded text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                >
                  Asuntos P.
                </button>
              </div>
            </div>
          )}
          
          {/* SECCIÓN 3: FORMULARIO DE EDICIÓN */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mostrar horarios cargados de la plantilla (solo lectura visual) */}
            {(formData.start_time !== "08:00" || formData.end_time !== "14:00" || formData.label) && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-300 dark:border-green-700">
                <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✓ Plantilla cargada:
                </p>
                <div className="flex items-center gap-2 text-sm">
                  {formData.label && (
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded font-bold">
                      {formData.label}
                    </span>
                  )}
                  <span className="text-green-700 dark:text-green-300">
                    {formData.start_time} - {formData.end_time}
                  </span>
                  {formData.start_time_2 && formData.end_time_2 && (
                    <span className="text-green-700 dark:text-green-300">
                      + {formData.start_time_2} - {formData.end_time_2}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold">Símbolo</Label>
              <Select value={formData.symbol} onValueChange={(value) => setFormData({ ...formData, symbol: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin símbolo" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_SYMBOLS.map((sym) => (
                    <SelectItem key={sym.id} value={sym.id}>{sym.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold">Color del Turno</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded border-2 border-gray-300" 
                      style={{ backgroundColor: formData.color }}
                    />
                    <span>{SHIFT_COLORS.find(c => c.id === formData.color)?.name || "Seleccionar color"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {SHIFT_COLORS.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded border-2 border-gray-300" 
                          style={{ backgroundColor: color.id }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alarmas (máximo 3)
              </Label>
              <p className="text-xs text-muted-foreground">El móvil te avisará antes del turno</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="alarm-30min"
                    checked={formData.alarm_times.includes('30min')}
                    onChange={(e) => {
                      const newTimes = e.target.checked
                        ? [...formData.alarm_times, '30min']
                        : formData.alarm_times.filter(t => t !== '30min');
                      if (newTimes.length <= 3) {
                        setFormData({ ...formData, alarm_times: newTimes, alarm_enabled: newTimes.length > 0 });
                      } else {
                        toast.error("Máximo 3 alarmas");
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="alarm-30min" className="cursor-pointer text-sm">
                    30 minutos antes
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="alarm-1hour"
                    checked={formData.alarm_times.includes('1hour')}
                    onChange={(e) => {
                      const newTimes = e.target.checked
                        ? [...formData.alarm_times, '1hour']
                        : formData.alarm_times.filter(t => t !== '1hour');
                      if (newTimes.length <= 3) {
                        setFormData({ ...formData, alarm_times: newTimes, alarm_enabled: newTimes.length > 0 });
                      } else {
                        toast.error("Máximo 3 alarmas");
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="alarm-1hour" className="cursor-pointer text-sm">
                    1 hora antes
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="alarm-1.5hours"
                    checked={formData.alarm_times.includes('1.5hours')}
                    onChange={(e) => {
                      const newTimes = e.target.checked
                        ? [...formData.alarm_times, '1.5hours']
                        : formData.alarm_times.filter(t => t !== '1.5hours');
                      if (newTimes.length <= 3) {
                        setFormData({ ...formData, alarm_times: newTimes, alarm_enabled: newTimes.length > 0 });
                      } else {
                        toast.error("Máximo 3 alarmas");
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="alarm-1.5hours" className="cursor-pointer text-sm">
                    1 hora y media antes
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              {editingShift && (
                <Button type="button" variant="destructive" onClick={(e) => { handleDeleteShift(e, editingShift.id); setShowModal(false); }}>
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); setSelectedDate(null); }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingShift ? "Guardar" : "Añadir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Local Holidays Modal */}
      <Dialog open={showHolidayModal} onOpenChange={setShowHolidayModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5" />
              Festivos Locales
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Input type="text" placeholder="Ej: San Jorge" value={newHolidayName} onChange={(e) => setNewHolidayName(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleAddLocalHoliday} className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Añadir Festivo
            </Button>

            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Festivos añadidos:</p>
              {localHolidays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay festivos locales</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {localHolidays.map((h) => (
                    <div key={h.date} className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 p-2 rounded text-sm">
                      <div>
                        <span className="font-medium">{h.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{h.date}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveLocalHoliday(h.date)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Modal */}
      <Dialog open={showTemplateModal} onOpenChange={(open) => { 
        setShowTemplateModal(open); 
        if (!open) { 
          setEditingTemplate(null); 
          setTemplateForm({ label: "", color: "#3B82F6", symbol: "none" }); 
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Gestionar Plantillas de Turnos
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Empresa: {companyNames[selectedCompany]}
            </p>
          </DialogHeader>
          
          <Tabs defaultValue="list">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Plantillas</TabsTrigger>
              <TabsTrigger value="create">{editingTemplate ? "Editar" : "Nueva"}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-3 pt-3">
              {shiftTemplates.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm text-muted-foreground">No hay plantillas creadas</p>
                  <p className="text-xs text-muted-foreground">Crea plantillas para añadirlas rápidamente al calendario</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {shiftTemplates.map(t => (
                    <div key={t.id} className="relative p-3 rounded-lg border group hover:border-primary transition-colors" style={{ backgroundColor: `${t.color}20` }}>
                      <div className="flex flex-col items-center gap-1">
                        {t.symbol && t.symbol !== "none" && (
                          <span className="text-xl">{t.symbol}</span>
                        )}
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-base"
                          style={{ backgroundColor: t.color }}
                        >
                          {t.label}
                        </div>
                        <p className="text-xs font-semibold text-center mt-1">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.start_time}-{t.end_time}</p>
                        {t.start_time_2 && (
                          <p className="text-xs text-muted-foreground">+{t.start_time_2}-{t.end_time_2}</p>
                        )}
                        <div className="flex gap-1 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEditTemplate(t)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteTemplate(t.id)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4 pt-3">
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <Label className="text-xs uppercase font-semibold">Nombre del Turno *</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Ej: Mañana, Tarde, Noche"
                    required
                  />
                </div>
                
                <div>
                  <Label className="text-xs uppercase font-semibold">Etiqueta (Máx. 3 caracteres) *</Label>
                  <Input
                    maxLength={3}
                    value={templateForm.label}
                    onChange={(e) => setTemplateForm({ ...templateForm, label: e.target.value.toUpperCase() })}
                    placeholder="Ej: M, T, N"
                    required
                    className="text-center text-lg font-bold"
                  />
                </div>
                
                <div>
                  <Label className="text-xs uppercase font-semibold">Horario Principal *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs text-muted-foreground">Entrada</Label>
                      <Input
                        type="time"
                        value={templateForm.start_time}
                        onChange={(e) => setTemplateForm({ ...templateForm, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Salida</Label>
                      <Input
                        type="time"
                        value={templateForm.end_time}
                        onChange={(e) => setTemplateForm({ ...templateForm, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="turno-partido"
                    checked={isTurnoPartido}
                    onChange={(e) => setIsTurnoPartido(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="turno-partido" className="text-sm cursor-pointer">
                    Turno partido (dos horarios)
                  </Label>
                </div>
                
                {isTurnoPartido && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs uppercase font-semibold">Segundo Horario</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Entrada</Label>
                        <Input
                          type="time"
                          value={templateForm.start_time_2}
                          onChange={(e) => setTemplateForm({ ...templateForm, start_time_2: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Salida</Label>
                        <Input
                          type="time"
                          value={templateForm.end_time_2}
                          onChange={(e) => setTemplateForm({ ...templateForm, end_time_2: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-xs uppercase font-semibold">Color</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {SHIFT_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`w-full h-10 rounded border-2 transition-all ${templateForm.color === c.id ? 'border-black dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c.id }}
                        onClick={() => setTemplateForm({ ...templateForm, color: c.id })}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs uppercase font-semibold">Símbolo (Opcional)</Label>
                  <select
                    value={templateForm.symbol}
                    onChange={(e) => setTemplateForm({ ...templateForm, symbol: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SHIFT_SYMBOLS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowTemplateModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingTemplate ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Company Settings Modal */}
      <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Configurar Empresas
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tres calendarios independientes para cada empresa.
            </p>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase">Empresa 1</Label>
                <Input
                  value={companyNames[1]}
                  onChange={(e) => setCompanyNames(prev => ({ ...prev, 1: e.target.value }))}
                  onBlur={() => handleUpdateCompanyName(1, companyNames[1])}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase">Empresa 2</Label>
                <Input
                  value={companyNames[2]}
                  onChange={(e) => setCompanyNames(prev => ({ ...prev, 2: e.target.value }))}
                  onBlur={() => handleUpdateCompanyName(2, companyNames[2])}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase">Empresa 3</Label>
                <Input
                  value={companyNames[3]}
                  onChange={(e) => setCompanyNames(prev => ({ ...prev, 3: e.target.value }))}
                  onBlur={() => handleUpdateCompanyName(3, companyNames[3])}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Month Confirmation Modal */}
      <Dialog open={showClearMonthModal} onOpenChange={setShowClearMonthModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirmar Borrado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que quieres <span className="font-bold text-red-600">borrar todos los turnos</span> del mes de <span className="font-bold">{MONTHS[month]} {year}</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              Esta acción <span className="font-bold">no se puede deshacer</span>.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClearMonthModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearMonth}
                className="flex-1"
              >
                Sí, Borrar Todo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

{/* Estilos CSS para el calendario */}
<style jsx>{`
  .calendar-grid-xl {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.25rem;
  }

  .calendar-day-xl {
    min-height: 100px;
    max-height: 100px;
    border: 1px solid hsl(var(--border));
    border-radius: 0.375rem;
    padding: 0.25rem;
    transition: all 0.2s;
    background-color: hsl(var(--card));
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .shifts-container-xl {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    flex: 1;
    margin-top: 0px;
  }

  .shift-chip-xl {
    border-radius: 0.375rem;
    padding: 2px 6px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
    color: white !important;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    cursor: pointer;
    transition: all 0.15s;
    min-height: 36px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    overflow: visible;
    position: relative;
  }

  .shift-chip-xl:hover {
    transform: scale(1.03);
    box-shadow: 0 3px 8px rgba(0,0,0,0.35);
  }

  .shift-time-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    line-height: 1.1;
    width: 100%;
  }

  .shift-time-main {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: -0.2px;
    line-height: 1.1;
  }

  .shift-label {
    font-size: 16px;
    font-weight: 800;
    white-space: nowrap;
    text-align: center;
    line-height: 1.1;
    letter-spacing: -0.5px;
  }

  .shift-time-secondary {
    font-size: 11px;
    opacity: 0.95;
    line-height: 1.1;
    margin-top: 1px;
    text-align: center;
    letter-spacing: -0.1px;
  }

  .shift-symbol {
    font-size: 14px;
    line-height: 1;
    font-weight: 700;
    margin-bottom: 1px;
  }

  .shift-icon {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
  }

  .overtime-indicator {
    position: absolute;
    top: 3px;
    right: 4px;
    font-size: 12px;
    font-weight: 700;
    color: #fbbf24;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  @media (max-width: 640px) {
    .calendar-day-xl {
      min-height: 80px;
      max-height: 80px;
      padding: 0.2rem;
    }

    .shift-chip-xl {
      font-size: 10px;
      padding: 2px 4px;
      min-height: 18px;
    }

    .shift-time-row {
      font-size: 10px;
    }

    .shift-time-main {
      font-size: 10px;
    }

    .shift-label {
      font-size: 10px;
    }

    .shift-time-secondary {
      font-size: 8px;
    }
  }
`}</style>
