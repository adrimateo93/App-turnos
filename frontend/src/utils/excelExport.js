import * as XLSX from 'xlsx';

export const exportToExcel = (payrollData, month, year, companyName) => {
  if (!payrollData) return;

  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const d = payrollData.desglose_bruto || {};
  const ded = payrollData.deducciones_trabajador || {};
  const emp = payrollData.costes_empresa || {};

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen
  const resumenData = [
    ['NÓMINA - ' + MONTHS[month] + ' ' + year],
    ['Empresa:', companyName],
    ['Categoría:', payrollData.categoria],
    ['Jornada:', payrollData.porcentaje_jornada + '%'],
    [''],
    ['RESUMEN ECONÓMICO'],
    ['Concepto', 'Importe'],
    ['Total Bruto', payrollData.total_bruto?.toFixed(2) + ' €'],
    ['Total Deducciones', '-' + ded.total?.toFixed(2) + ' €'],
    ['SALARIO NETO', payrollData.salario_neto?.toFixed(2) + ' €'],
    [''],
    ['Coste Total Empresa', emp.coste_total?.toFixed(2) + ' €']
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ width: 30 }, { width: 15 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Sheet 2: Devengos
  const devengosData = [
    ['DEVENGOS (Salario Bruto)'],
    ['Concepto', 'Importe'],
    ['Salario Base', d.salario_base?.toFixed(2) + ' €'],
    ['Plus Peligrosidad', d.plus_peligrosidad?.toFixed(2) + ' €'],
    ['Plus Actividad', d.plus_actividad?.toFixed(2) + ' €'],
    ['Plus Transporte', d.plus_transporte?.toFixed(2) + ' €'],
    ['Plus Vestuario', d.plus_vestuario?.toFixed(2) + ' €'],
    ['Plus Antigüedad', d.plus_antiguedad?.toFixed(2) + ' €'],
    ['Plus Responsable', d.plus_responsable_equipo?.toFixed(2) + ' €'],
    ['Plus Nocturnidad', d.plus_nocturnidad?.toFixed(2) + ' €'],
    ['Plus Festivo', d.plus_festivo?.toFixed(2) + ' €']
  ];

  if (d.plus_servicio_importe > 0) {
    devengosData.push([d.plus_servicio_nombre || 'Plus Servicio', d.plus_servicio_importe?.toFixed(2) + ' €']);
  }

  if (d.paga_extra > 0) {
    devengosData.push(['Paga Extra', d.paga_extra?.toFixed(2) + ' €']);
  }

  if (d.horas_extras > 0) {
    devengosData.push(['Horas Extras (' + d.horas_extras_cantidad?.toFixed(1) + 'h)', d.horas_extras?.toFixed(2) + ' €']);
  }

  devengosData.push(['', '']);
  devengosData.push(['TOTAL BRUTO', payrollData.total_bruto?.toFixed(2) + ' €']);

  const wsDevengos = XLSX.utils.aoa_to_sheet(devengosData);
  wsDevengos['!cols'] = [{ width: 30 }, { width: 15 }];
  XLSX.utils.book_append_sheet(wb, wsDevengos, 'Devengos');

  // Sheet 3: Deducciones
  const deduccionesData = [
    ['DEDUCCIONES DEL TRABAJADOR'],
    ['Concepto', 'Tipo', 'Importe'],
    ['Contingencias Comunes', '4,70%', '-' + ded.contingencias_comunes?.toFixed(2) + ' €'],
    ['Desempleo', (payrollData.tipo_contrato === 'indefinido' ? '1,55%' : '1,60%'), '-' + ded.desempleo?.toFixed(2) + ' €'],
    ['Formación Profesional', '0,10%', '-' + ded.formacion_profesional?.toFixed(2) + ' €'],
    ['MEI', '0,13%', '-' + ded.mei?.toFixed(2) + ' €'],
    ['Total Seg. Social', '', '-' + ded.total_ss?.toFixed(2) + ' €'],
    ['IRPF', ded.irpf_porcentaje + '%', '-' + ded.irpf?.toFixed(2) + ' €'],
    ['', '', ''],
    ['TOTAL DEDUCCIONES', '', '-' + ded.total?.toFixed(2) + ' €'],
    ['', '', ''],
    ['SALARIO NETO', '', payrollData.salario_neto?.toFixed(2) + ' €']
  ];

  const wsDeducciones = XLSX.utils.aoa_to_sheet(deduccionesData);
  wsDeducciones['!cols'] = [{ width: 30 }, { width: 10 }, { width: 15 }];
  XLSX.utils.book_append_sheet(wb, wsDeducciones, 'Deducciones');

  // Sheet 4: Horas
  const horasData = [
    ['RESUMEN DE HORAS'],
    ['Concepto', 'Horas'],
    ['Horas Trabajadas', payrollData.horas?.trabajadas?.toFixed(1) + 'h'],
    ['Horas Computadas', payrollData.horas?.computadas?.toFixed(1) + 'h'],
    ['Horas Nocturnas', payrollData.horas?.nocturnas?.toFixed(1) + 'h'],
    ['Horas Festivas', payrollData.horas?.festivas?.toFixed(1) + 'h'],
    ['Horas Extras', payrollData.horas?.extras?.toFixed(1) + 'h'],
    ['', ''],
    ['Horas Objetivo', payrollData.jornada?.horas_mes_objetivo?.toFixed(1) + 'h'],
    ['Días del Mes', payrollData.jornada?.dias_mes],
    ['Turnos Registrados', payrollData.shifts_count]
  ];

  const wsHoras = XLSX.utils.aoa_to_sheet(horasData);
  wsHoras['!cols'] = [{ width: 25 }, { width: 15 }];
  XLSX.utils.book_append_sheet(wb, wsHoras, 'Horas');

  // Generate and download
  const fileName = `Nomina_${companyName}_${MONTHS[month]}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportShiftsToExcel = (shifts, month, year, companyName) => {
  if (!shifts || shifts.length === 0) return;

  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const wb = XLSX.utils.book_new();

  // Prepare shifts data
  const shiftsData = [
    ['TURNOS - ' + MONTHS[month] + ' ' + year],
    ['Empresa:', companyName],
    [''],
    ['Fecha', 'Entrada', 'Salida', 'Entrada 2', 'Salida 2', 'Horas Total', 'Horas Nocturnas', 'Horas Festivas', 'Horas Extras', 'Comentario']
  ];

  shifts.forEach(shift => {
    shiftsData.push([
      shift.date,
      shift.start_time,
      shift.end_time,
      shift.start_time_2 || '',
      shift.end_time_2 || '',
      shift.total_hours?.toFixed(2),
      shift.night_hours?.toFixed(2),
      shift.holiday_hours?.toFixed(2),
      shift.overtime_hours?.toFixed(2),
      shift.comment || ''
    ]);
  });

  // Add totals
  const totalHours = shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0);
  const totalNight = shifts.reduce((sum, s) => sum + (s.night_hours || 0), 0);
  const totalHoliday = shifts.reduce((sum, s) => sum + (s.holiday_hours || 0), 0);
  const totalOvertime = shifts.reduce((sum, s) => sum + (s.overtime_hours || 0), 0);

  shiftsData.push(['', '', '', '', '', '', '', '', '', '']);
  shiftsData.push(['TOTALES', '', '', '', '', totalHours.toFixed(2), totalNight.toFixed(2), totalHoliday.toFixed(2), totalOvertime.toFixed(2), '']);

  const ws = XLSX.utils.aoa_to_sheet(shiftsData);
  ws['!cols'] = [
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 30 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Turnos');

  const fileName = `Turnos_${companyName}_${MONTHS[month]}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
