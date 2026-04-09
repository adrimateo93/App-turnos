import React, { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Save, User, Briefcase, Clock, Award, Bell, BellRing, Percent, Receipt, Building2, BadgeEuro, Plane, Car, Shield, Trash2 } from "lucide-react";

const CATEGORIES = [
  { id: "vigilante_sin_arma", name: "V. S. Sin Arma" },
  { id: "vigilante_con_arma", name: "V. S. Con Arma" },
  { id: "vigilante_transporte_conductor", name: "V.S. Transp. - Conductor" },
  { id: "vigilante_transporte", name: "V.S. Transporte" },
  { id: "vigilante_explosivos_conductor", name: "V.S.T. Explosivos Conductor" },
  { id: "vigilante_explosivos", name: "V.S. Transp - Explosivos" },
  { id: "vigilante_seguridad_explosivos", name: "V. S. Explosivos" },
  { id: "escolta", name: "Escolta" },
  { id: "operador_seguridad", name: "Operador de Seguridad" },
  { id: "contador_pagador", name: "Contador - Pagador" },
];

export default function Settings() {
  const { authAxios, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const saved = localStorage.getItem('selectedCompany');
    return saved ? parseInt(saved) : 1;
  });
  
  // Helper function to parse decimal numbers with comma or dot
  const parseDecimal = (value) => {
    if (!value || value === '') return 0;
    // Replace comma with dot for parsing
    const normalizedValue = String(value).replace(',', '.');
    const parsed = parseFloat(normalizedValue);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  // Helper to format number for display (keep user's format)
  const handleDecimalInput = (value, fieldName) => {
    // Allow empty, numbers, comma, and dot
    const cleanValue = String(value).replace(/[^\d,.-]/g, '');
    return cleanValue;
  };
  
  // Decimal Input Component
  const DecimalInput = ({ value, onChange, className = "w-24 text-center" }) => {
    const [displayValue, setDisplayValue] = useState(value === 0 ? '0' : value || '');
    
    // Update displayValue when prop value changes
    useEffect(() => {
      setDisplayValue(value === 0 ? '0' : value || '');
    }, [value]);
    
    return (
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={(e) => {
          const cleaned = handleDecimalInput(e.target.value);
          setDisplayValue(cleaned);
        }}
        onBlur={(e) => {
          const parsed = parseDecimal(e.target.value);
          setDisplayValue(parsed === 0 ? '0' : parsed);
          onChange(parsed);
        }}
        onFocus={(e) => e.target.select()}
        className={className}
      />
    );
  };
  
  const [settings, setSettings] = useState({
    categoria: "vigilante_sin_arma",
    trienios: 0,
    quinquenios: 0,
    año_entrada: null, // Año de entrada en la empresa
    es_responsable_equipo: false,
    porcentaje_jornada: 100,
    horas_anuales: 1782,
    meses_trabajo: 11,
    paga_extra_marzo: "integra",
    paga_extra_julio: "integra",
    paga_extra_diciembre: "integra",
    irpf: 12,
    company_id: 1,
    año_convenio: 2026,
    // Pluses del Convenio
    plus_kilometraje_km: 0,
    plus_aeropuerto_horas: 0,
    plus_radioscopia_aeroportuaria_horas: 0,
    plus_filtro_rotacion_horas: 0,
    plus_radioscopia_basica_horas: 0,
    plus_escolta_horas: 0,
    plus_nochebuena: false,
    plus_nochevieja: false,
    plus_hijo_discapacitado: false,
    plus_asistencia_juicio_horas: 0,
    plus_formacion_horas: 0,
    plus_asistencia_tiro_horas: 0,
    // Plus Específico de Servicio
    plus_servicio_nombre: "",
    plus_servicio_importe: 0,
    // Dietas
    dieta_una_comida: 0,
    dieta_dos_comidas: 0,
    dieta_pernocta_desayuno: 0,
    dieta_pernocta_dos_comidas: 0,
    dieta_completa_8_dia: 0
  });
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [companyNames, setCompanyNames] = useState({
    1: "Empresa A",
    2: "Empresa B",
    3: "Empresa C"
  });

  useEffect(() => {
    localStorage.setItem('selectedCompany', selectedCompany);
    fetchSettings();
  }, [selectedCompany]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/settings?company_id=${selectedCompany}`);
      setSettings({ ...response.data, company_id: selectedCompany });
      
      if (response.data.categoria) {
        const salaryResponse = await authAxios.get(`/salary-table/${response.data.categoria}`);
        setSalaryInfo(salaryResponse.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoria) => {
    setSettings({ ...settings, categoria });
    try {
      const salaryResponse = await authAxios.get(`/salary-table/${categoria}`);
      if (salaryResponse.data) {
        setSalaryInfo(salaryResponse.data);
      }
    } catch (error) {
      console.error("Error fetching salary info:", error);
      toast.error("Error al cargar información salarial");
      // Set default salary info to prevent UI issues
      setSalaryInfo(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await authAxios.put(`/settings?company_id=${selectedCompany}`, settings);
      toast.success(`Configuración de ${companyNames[selectedCompany]} guardada`);
    } catch (error) {
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleLimpiarDatos = () => {
    // Resetear pluses, dietas, antigüedad e IRPF a valores por defecto
    setSettings(prev => ({
      ...prev,
      // Antigüedad
      trienios: 0,
      quinquenios: 0,
      año_entrada: null,
      es_responsable_equipo: false,
      // IRPF
      irpf: 10,
      // Pluses del Convenio
      plus_kilometraje_km: 0,
      plus_aeropuerto_horas: 0,
      plus_radioscopia_aeroportuaria_horas: 0,
      plus_filtro_rotacion_horas: 0,
      plus_radioscopia_basica_horas: 0,
      plus_escolta_horas: 0,
      plus_nochebuena: false,
      plus_nochevieja: false,
      plus_hijo_discapacitado: false,
      plus_asistencia_juicio_horas: 0,
      plus_formacion_horas: 0,
      plus_asistencia_tiro_horas: 0,
      // Plus Específico de Servicio
      plus_servicio_nombre: "",
      plus_servicio_importe: 0,
      // Dietas
      dieta_una_comida: 0,
      dieta_dos_comidas: 0,
      dieta_pernocta_desayuno: 0,
      dieta_pernocta_dos_comidas: 0,
      dieta_completa_8_dia: 0
    }));
    
    toast.success("Datos limpiados: pluses, dietas, antigüedad e IRPF reseteados");
  };

  // Calcular multiplicador según año de convenio
  const getConvenioMultiplier = (año) => {
    const multipliers = {
      2026: 1.0,      // Base
      2027: 1.035,    // +3.5%
      2028: 1.0764,   // +3.5% +4% = 7.64%
      2029: 1.119456, // +3.5% +4% +4% = 11.9456%
      2030: 1.1698355 // +3.5% +4% +4% +4.5% = 16.98355%
    };
    return multipliers[año] || 1.0;
  };

  // Calcular antigüedad automáticamente según año de entrada
  // Regla: Trienios solo hasta 1994, después solo Quinquenios
  const calculateAntiguedad = (añoEntrada) => {
    if (!añoEntrada || añoEntrada < 1900 || añoEntrada > new Date().getFullYear()) {
      return { trienios: 0, quinquenios: 0 };
    }

    const currentYear = new Date().getFullYear();
    let trienios = 0;
    let quinquenios = 0;

    if (añoEntrada < 1994) {
      // Calcular trienios desde año de entrada hasta 1994
      const añosHasta1994 = 1994 - añoEntrada;
      trienios = Math.floor(añosHasta1994 / 3);
      
      // Calcular quinquenios desde 1994 hasta hoy
      const añosDesde1994 = currentYear - 1994;
      quinquenios = Math.floor(añosDesde1994 / 5);
    } else {
      // Entró en 1994 o después: solo quinquenios
      const añosTotales = currentYear - añoEntrada;
      quinquenios = Math.floor(añosTotales / 5);
      trienios = 0;
    }

    return { trienios, quinquenios };
  };

  // Auto-calcular antigüedad cuando cambia el año de entrada
  useEffect(() => {
    if (settings.año_entrada) {
      const { trienios, quinquenios } = calculateAntiguedad(settings.año_entrada);
      setSettings(prev => ({
        ...prev,
        trienios,
        quinquenios
      }));
    }
  }, [settings.año_entrada]);


  // Aplicar multiplicador de convenio a salaryInfo
  const appliedSalaryInfo = salaryInfo ? {
    ...salaryInfo,
    salario_base: salaryInfo.salario_base * getConvenioMultiplier(settings.año_convenio),
    plus_peligrosidad: salaryInfo.plus_peligrosidad * getConvenioMultiplier(settings.año_convenio),
    trienio: salaryInfo.trienio * getConvenioMultiplier(settings.año_convenio),
    quinquenio: salaryInfo.quinquenio * getConvenioMultiplier(settings.año_convenio),
    plus_turnicidad: salaryInfo.plus_turnicidad * getConvenioMultiplier(settings.año_convenio),
    plus_nocturnidad_hora: salaryInfo.plus_nocturnidad_hora * getConvenioMultiplier(settings.año_convenio),
    plus_festivo_hora: salaryInfo.plus_festivo_hora * getConvenioMultiplier(settings.año_convenio),
    hora_extra_base: salaryInfo.hora_extra_base * getConvenioMultiplier(settings.año_convenio),
    hora_extra_por_trienio: salaryInfo.hora_extra_por_trienio * getConvenioMultiplier(settings.año_convenio),
    hora_extra_por_quinquenio: salaryInfo.hora_extra_por_quinquenio * getConvenioMultiplier(settings.año_convenio)
  } : null;

  // Calculate paga extra preview usando valores aplicados
  const pagaExtraIntegra = appliedSalaryInfo ? 
    (appliedSalaryInfo.salario_base + (appliedSalaryInfo.trienio * settings.trienios) + (appliedSalaryInfo.quinquenio * settings.quinquenios) + appliedSalaryInfo.plus_peligrosidad) * (settings.porcentaje_jornada / 100) 
    : 0;
  
  // Paga extra prorrateada mensual = (salario_base + antigüedad + plus_peligrosidad) / 12
  const pagaExtraProrrateo = pagaExtraIntegra / 12;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground">Configura tu información laboral</p>
        <div className="flex justify-between gap-2 mt-4">
          <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="save-settings-btn">
            {saving ? (
              <>
                <span className="spinner w-4 h-4" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </Button>
          <Button 
            onClick={handleLimpiarDatos} 
            variant="destructive" 
            className="gap-2"
            data-testid="limpiar-datos-btn"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Datos
          </Button>
        </div>
      </div>

      {/* Selector de Empresa - Vertical */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Configuración por Empresa
          </CardTitle>
          <CardDescription>Los ajustes se guardan por empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            {[1, 2, 3].map((companyNum) => (
              <button
                key={companyNum}
                onClick={() => setSelectedCompany(companyNum)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  selectedCompany === companyNum
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <Building2 className={`w-5 h-5 ${selectedCompany === companyNum ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${selectedCompany === companyNum ? 'text-primary' : ''}`}>
                    {companyNames[companyNum]}
                  </p>
                  {selectedCompany === companyNum && (
                    <p className="text-xs text-muted-foreground mt-0.5">Configuración activa</p>
                  )}
                </div>
                {selectedCompany === companyNum && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selector de Año de Convenio */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Año de Convenio
          </CardTitle>
          <CardDescription>Selecciona el año del convenio aplicable (afecta todos los valores salariales)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="form-label">Año del Convenio</Label>
            <select
              value={(settings.año_convenio || 2026).toString()}
              onChange={(e) => setSettings({ ...settings, año_convenio: parseInt(e.target.value) })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="2026">2026 - Convenio actual</option>
              <option value="2027">2027 - +3.5% anual (Total: +3.5%)</option>
              <option value="2028">2028 - +4% anual (Total: +7.64%)</option>
              <option value="2029">2029 - +4% anual (Total: +11.95%)</option>
              <option value="2030">2030 - +4.5% anual (Total: +16.98%)</option>
            </select>
          </div>
          <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ El año del convenio aplica incrementos automáticos a:
              <br/>• Salario base • Plus peligrosidad • Antigüedad (trienios/quinquenios)
              <br/>• Horas extras • Nocturnidad • Festivos • Todos los complementos
            </p>
          </div>
          {settings.año_convenio && settings.año_convenio > 2026 && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                ✓ Incremento total aplicado: +{((getConvenioMultiplier(settings.año_convenio) - 1) * 100).toFixed(2)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Work Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Jornada Laboral
            </CardTitle>
            <CardDescription>1782 horas/año en 11 meses de trabajo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="form-label">Selección Rápida</Label>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <button
                    key={percentage}
                    type="button"
                    onClick={() => setSettings({ ...settings, porcentaje_jornada: percentage })}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      settings.porcentaje_jornada === percentage
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Porcentaje Personalizado</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={settings.porcentaje_jornada || ''}
                    onChange={(e) => {
                      const cleaned = handleDecimalInput(e.target.value);
                      setSettings({ ...settings, porcentaje_jornada: cleaned });
                    }}
                    onBlur={(e) => {
                      const value = Math.min(100, Math.max(0, parseDecimal(e.target.value)));
                      setSettings({ ...settings, porcentaje_jornada: value });
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-20 text-center"
                  />
                  <span className="text-sm font-medium">%</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[90px] text-right">
                    {((1782 * (settings.porcentaje_jornada || 0)) / 100).toFixed(0)} h/año
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Categoría Profesional
            </CardTitle>
            <CardDescription>Selecciona tu categoría</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="form-label">Categoría</Label>
              <select
                value={settings.categoria}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-testid="categoria-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Año de entrada - Auto-calcula antigüedad */}
            <div className="space-y-2">
              <Label className="form-label">Año de entrada en la empresa</Label>
              <Input
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                placeholder="Ej: 1995"
                value={settings.año_entrada || ''}
                onChange={(e) => {
                  const año = parseInt(e.target.value) || null;
                  setSettings({ ...settings, año_entrada: año });
                }}
                onFocus={(e) => e.target.select()}
                data-testid="año-entrada-input"
              />
              {settings.año_entrada && (
                <p className="text-xs text-muted-foreground">
                  ℹ️ Trienios y quinquenios se calculan automáticamente
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="form-label">Trienios (calculado automáticamente)</Label>
              <Input
                type="number"
                min="0"
                value={settings.trienios}
                onChange={(e) => setSettings({ ...settings, trienios: parseInt(e.target.value) || 0 })}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                disabled={!!settings.año_entrada}
                className={settings.año_entrada ? 'bg-muted cursor-not-allowed' : ''}
                data-testid="trienios-input"
              />
              {settings.año_entrada && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Auto-calculado desde año de entrada
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="form-label">Quinquenios (calculado automáticamente)</Label>
              <Input
                type="number"
                min="0"
                value={settings.quinquenios}
                onChange={(e) => setSettings({ ...settings, quinquenios: parseInt(e.target.value) || 0 })}
                onFocus={(e) => {
                  if (e.target.value === '0') e.target.select();
                }}
                disabled={!!settings.año_entrada}
                className={settings.año_entrada ? 'bg-muted cursor-not-allowed' : ''}
                data-testid="quinquenios-input"
              />
              {settings.año_entrada && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Auto-calculado desde año de entrada
                </p>
              )}
            </div>

            {/* Recordatorio del valor total de antigüedad */}
            {appliedSalaryInfo && (settings.trienios > 0 || settings.quinquenios > 0) && (
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  💰 Valor total de antigüedad mensual:
                </p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {((appliedSalaryInfo.trienio * settings.trienios) + 
                    (appliedSalaryInfo.quinquenio * settings.quinquenios)).toFixed(2)} €
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {settings.trienios > 0 && `${settings.trienios} trienio${settings.trienios > 1 ? 's' : ''} × ${appliedSalaryInfo.trienio.toFixed(2)}€`}
                  {settings.trienios > 0 && settings.quinquenios > 0 && ' + '}
                  {settings.quinquenios > 0 && `${settings.quinquenios} quinquenio${settings.quinquenios > 1 ? 's' : ''} × ${appliedSalaryInfo.quinquenio.toFixed(2)}€`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Pluses del Convenio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Pluses del Convenio
          </CardTitle>
          <CardDescription>Complementos salariales según convenio colectivo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Plus Kilómetraje */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Kilómetraje (km/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_kilometraje_km}
                    onChange={(val) => setSettings({ ...settings, plus_kilometraje_km: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_kilometraje_km || 0) * 0.35).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Aeropuerto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Aeropuerto (horas/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_aeropuerto_horas}
                    onChange={(val) => setSettings({ ...settings, plus_aeropuerto_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_aeropuerto_horas || 0) * 0.82).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Radioscopia Aeroportuaria */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Radioscopia Aeroportuaria (h/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_radioscopia_aeroportuaria_horas}
                    onChange={(val) => setSettings({ ...settings, plus_radioscopia_aeroportuaria_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_radioscopia_aeroportuaria_horas || 0) * 1.46).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Filtro Rotación */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Filtro Rotación (h/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_filtro_rotacion_horas}
                    onChange={(val) => setSettings({ ...settings, plus_filtro_rotacion_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_filtro_rotacion_horas || 0) * 1.46).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Radioscopia Básica */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Radioscopia Básica (h/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_radioscopia_basica_horas}
                    onChange={(val) => setSettings({ ...settings, plus_radioscopia_basica_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_radioscopia_basica_horas || 0) * 0.21).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Escolta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Escolta (h/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_escolta_horas}
                    onChange={(val) => setSettings({ ...settings, plus_escolta_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_escolta_horas || 0) * 1.93).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Asistencia Juicio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Asistencia Juicio (h/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_asistencia_juicio_horas}
                    onChange={(val) => setSettings({ ...settings, plus_asistencia_juicio_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_asistencia_juicio_horas || 0) * 9.98).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Formación */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Formación (h/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_formacion_horas}
                    onChange={(val) => setSettings({ ...settings, plus_formacion_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_formacion_horas || 0) * 9.98).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Plus Asistencia a Tiro */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Plus Asistencia a Tiro (h/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_asistencia_tiro_horas}
                    onChange={(val) => setSettings({ ...settings, plus_asistencia_tiro_horas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.plus_asistencia_tiro_horas || 0) * 9.98).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium">Pluses Festivos Especiales</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="plus_nochebuena" className="cursor-pointer">Plus Nochebuena</Label>
                <div className="flex items-center gap-3">
                  {settings.plus_nochebuena && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">83.48 €</span>
                  )}
                  <Switch
                    id="plus_nochebuena"
                    checked={settings.plus_nochebuena}
                    onCheckedChange={(checked) => setSettings({ ...settings, plus_nochebuena: checked })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="plus_nochevieja" className="cursor-pointer">Plus Nochevieja</Label>
                <div className="flex items-center gap-3">
                  {settings.plus_nochevieja && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">83.48 €</span>
                  )}
                  <Switch
                    id="plus_nochevieja"
                    checked={settings.plus_nochevieja}
                    onCheckedChange={(checked) => setSettings({ ...settings, plus_nochevieja: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium">Plus Familiar</p>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="plus_hijo_discapacitado" className="cursor-pointer">Plus Hijo Discapacitado</Label>
              <div className="flex items-center gap-3">
                {settings.plus_hijo_discapacitado && (
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">150.70 €</span>
                )}
                <Switch
                  id="plus_hijo_discapacitado"
                  checked={settings.plus_hijo_discapacitado}
                  onCheckedChange={(checked) => setSettings({ ...settings, plus_hijo_discapacitado: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium">Plus Responsabilidad</p>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="es_responsable_equipo" className="cursor-pointer">Responsable de Equipo</Label>
              <div className="flex items-center gap-3">
                {settings.es_responsable_equipo && salaryInfo && (
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {(salaryInfo.salario_base * 0.10).toFixed(2)} €
                  </span>
                )}
                <Switch
                  id="es_responsable_equipo"
                  checked={settings.es_responsable_equipo}
                  onCheckedChange={(checked) => setSettings({ ...settings, es_responsable_equipo: checked })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              10% del salario base mensual
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plus Específico de Servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Plus Específico de Servicio
          </CardTitle>
          <CardDescription>Complemento personalizado según servicio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="form-label">Nombre del Plus</Label>
              <Input
                type="text"
                placeholder="Ej: Plus Servicio Especial"
                value={settings.plus_servicio_nombre}
                onChange={(e) => setSettings({ ...settings, plus_servicio_nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Importe</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.plus_servicio_importe}
                    onChange={(val) => setSettings({ ...settings, plus_servicio_importe: val })}
                    className="w-28 text-center"
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    €
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Dietas
          </CardTitle>
          <CardDescription>Asignaciones para gastos de manutención</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Dieta Una Comida */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Dieta Una Comida (días/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.dieta_una_comida}
                    onChange={(val) => setSettings({ ...settings, dieta_una_comida: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.dieta_una_comida || 0) * 15.86).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Dieta Dos Comidas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Dieta Dos Comidas (días/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.dieta_dos_comidas}
                    onChange={(val) => setSettings({ ...settings, dieta_dos_comidas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.dieta_dos_comidas || 0) * 27.84).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Dieta Pernocta + Desayuno */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Dieta Pernocta + Desayuno (días/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.dieta_pernocta_desayuno}
                    onChange={(val) => setSettings({ ...settings, dieta_pernocta_desayuno: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.dieta_pernocta_desayuno || 0) * 34.78).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Dieta Pernocta + Dos Comidas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Dieta Pernocta + Dos Comidas (días/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.dieta_pernocta_dos_comidas}
                    onChange={(val) => setSettings({ ...settings, dieta_pernocta_dos_comidas: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.dieta_pernocta_dos_comidas || 0) * 52.46).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            {/* Dieta Completa 8h/día */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="form-label">Dieta Completa 8h/día (días/mes)</Label>
                <div className="flex items-center gap-2">
                  <DecimalInput
                    value={settings.dieta_completa_8_dia}
                    onChange={(val) => setSettings({ ...settings, dieta_completa_8_dia: val })}
                  />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                    {((settings.dieta_completa_8_dia || 0) * 13.48).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">💰 Total Dietas Mensual:</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {(
                  ((settings.dieta_una_comida || 0) * 15.86) +
                  ((settings.dieta_dos_comidas || 0) * 27.84) +
                  ((settings.dieta_pernocta_desayuno || 0) * 34.78) +
                  ((settings.dieta_pernocta_dos_comidas || 0) * 52.46) +
                  ((settings.dieta_completa_8_dia || 0) * 13.48)
                ).toFixed(2)} €
              </span>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Extra Pay Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Pagas Extras
          </CardTitle>
          <CardDescription>Configuración de pagas extras (marzo, julio, diciembre)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Marzo */}
            <div className="space-y-2">
              <Label className="form-label font-semibold">Marzo</Label>
              <RadioGroup
                value={settings.paga_extra_marzo}
                onValueChange={(value) => setSettings({ ...settings, paga_extra_marzo: value })}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="integra" id="marzo-integra" />
                  <Label htmlFor="marzo-integra" className="cursor-pointer">Íntegra</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prorrateada" id="marzo-prorr" />
                  <Label htmlFor="marzo-prorr" className="cursor-pointer">Prorrateada</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Julio */}
            <div className="space-y-2">
              <Label className="form-label font-semibold">Julio</Label>
              <RadioGroup
                value={settings.paga_extra_julio}
                onValueChange={(value) => setSettings({ ...settings, paga_extra_julio: value })}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="integra" id="julio-integra" />
                  <Label htmlFor="julio-integra" className="cursor-pointer">Íntegra</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prorrateada" id="julio-prorr" />
                  <Label htmlFor="julio-prorr" className="cursor-pointer">Prorrateada</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Diciembre */}
            <div className="space-y-2">
              <Label className="form-label font-semibold">Diciembre</Label>
              <RadioGroup
                value={settings.paga_extra_diciembre}
                onValueChange={(value) => setSettings({ ...settings, paga_extra_diciembre: value })}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="integra" id="dic-integra" />
                  <Label htmlFor="dic-integra" className="cursor-pointer">Íntegra</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prorrateada" id="dic-prorr" />
                  <Label htmlFor="dic-prorr" className="cursor-pointer">Prorrateada</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="p-3 rounded-md bg-muted/50 space-y-2">
            <p className="text-sm font-medium">Valor de cada paga extra:</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center p-2 bg-background rounded">
                <span className="text-sm">
                  Paga de Marzo: 
                  <span className="text-xs text-muted-foreground ml-1">
                    ({settings.paga_extra_marzo === "integra" ? "íntegra" : "prorrateada"})
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {settings.paga_extra_marzo === "integra" 
                    ? pagaExtraIntegra.toFixed(2) 
                    : pagaExtraProrrateo.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded">
                <span className="text-sm">
                  Paga de Julio:
                  <span className="text-xs text-muted-foreground ml-1">
                    ({settings.paga_extra_julio === "integra" ? "íntegra" : "prorrateada"})
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {settings.paga_extra_julio === "integra" 
                    ? pagaExtraIntegra.toFixed(2) 
                    : pagaExtraProrrateo.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded">
                <span className="text-sm">
                  Paga de Diciembre:
                  <span className="text-xs text-muted-foreground ml-1">
                    ({settings.paga_extra_diciembre === "integra" ? "íntegra" : "prorrateada"})
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {settings.paga_extra_diciembre === "integra" 
                    ? pagaExtraIntegra.toFixed(2) 
                    : pagaExtraProrrateo.toFixed(2)} €
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded border-2 border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-green-800 dark:text-green-200">Total Pagas Íntegras:</span>
                  <span className="text-base font-bold tabular-nums text-green-600 dark:text-green-400">
                    {(
                      (settings.paga_extra_marzo === "integra" ? pagaExtraIntegra : 0) +
                      (settings.paga_extra_julio === "integra" ? pagaExtraIntegra : 0) +
                      (settings.paga_extra_diciembre === "integra" ? pagaExtraIntegra : 0)
                    ).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-700 dark:text-green-300">Prorrateado mensual:</span>
                  <span className="tabular-nums text-green-700 dark:text-green-300">
                    {(
                      (settings.paga_extra_marzo === "prorrateada" ? pagaExtraProrrateo : 0) +
                      (settings.paga_extra_julio === "prorrateada" ? pagaExtraProrrateo : 0) +
                      (settings.paga_extra_diciembre === "prorrateada" ? pagaExtraProrrateo : 0)
                    ).toFixed(2)} €/mes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IRPF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Retención IRPF
          </CardTitle>
          <CardDescription>Porcentaje de retención fiscal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="form-label">Porcentaje IRPF</Label>
              <div className="flex items-center gap-2">
                <DecimalInput
                  value={settings.irpf}
                  onChange={(val) => setSettings({ ...settings, irpf: val })}
                />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[70px] text-right">
                  {(settings.irpf || 0).toFixed(2)} %
                </span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-md bg-muted/50 border">
            <p className="text-sm text-muted-foreground">
              ℹ️ El IRPF se aplica sobre el total de devengos (salario bruto mensual)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button - Alineado a la izquierda */}
      <div className="flex justify-start">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <span className="spinner w-4 h-4" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}