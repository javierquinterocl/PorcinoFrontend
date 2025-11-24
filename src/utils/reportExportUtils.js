import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ============================================================================
// CONFIGURACIÓN GLOBAL DE REPORTES
// ============================================================================

const REPORT_CONFIG = {
  primaryColor: [107, 124, 69], // Verde agropecuario
  secondaryColor: [59, 130, 246], // Azul
  dangerColor: [220, 38, 38], // Rojo
  successColor: [34, 197, 94], // Verde
  warningColor: [234, 179, 8], // Amarillo
  pageWidth: 210,
  pageHeight: 297,
  margin: 15,
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const addReportHeader = (doc, title, subtitle = '') => {
  doc.setFillColor(...REPORT_CONFIG.primaryColor);
  doc.rect(0, 0, REPORT_CONFIG.pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Sistema de Gestión Porcina', REPORT_CONFIG.margin, 15);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(title, REPORT_CONFIG.margin, 28);
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, REPORT_CONFIG.margin, 35);
  }
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(9);
  doc.text(`Generado: ${dateStr}`, REPORT_CONFIG.pageWidth - REPORT_CONFIG.margin, 15, { align: 'right' });
  
  doc.setTextColor(55, 65, 81);
};

const addReportFooter = (doc, currentPage, totalPages) => {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Página ${currentPage} de ${totalPages}`,
    REPORT_CONFIG.pageWidth / 2,
    REPORT_CONFIG.pageHeight - 10,
    { align: 'center' }
  );
};

// ============================================================================
// EXPORTACIÓN PDF - REPORTE DE REPRODUCTORES
// ============================================================================

export const exportReproductorsToPDF = (data) => {
  const doc = new jsPDF();
  let yPos = 50;
  
  addReportHeader(doc, 'Reporte de Reproductores', 'Estadísticas de cerdas, verracos y lechones');
  
  // SECCIÓN: CERDAS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...REPORT_CONFIG.primaryColor);
  doc.text('Estadísticas de Cerdas', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Cantidad', 'Porcentaje']],
    body: [
      ['Total de Cerdas', data.sows.total.toString(), '100%'],
      ['Cerdas Activas', data.sows.active.toString(), `${((data.sows.active / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
      ['En Gestación', data.sows.pregnant.toString(), `${((data.sows.pregnant / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
      ['Lactantes', data.sows.lactating.toString(), `${((data.sows.lactating / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
      ['En Celo', (data.sows.inHeat || 0).toString(), `${(((data.sows.inHeat || 0) / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
      ['Vacías', data.sows.empty.toString(), `${((data.sows.empty / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
      ['Descartadas', data.sows.discarded.toString(), `${((data.sows.discarded / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  if (data.sowsDetails) {
    autoTable(doc, {
      startY: yPos,
      head: [['Indicador', 'Valor']],
      body: [
        ['Promedio de Edad (meses)', data.sows.avgAge?.toFixed(1) || 'N/A'],
        ['Número de Parto Promedio', data.sows.avgParities?.toFixed(1) || 'N/A'],
        ['Partos Reales por Cerda', data.sows.avgBirthsPerSow?.toFixed(2) || 'N/A'],
        ['Lechones por Cerda', data.sows.avgPigletsPerSow?.toFixed(1) || 'N/A'],
        ['Cerdas de 1er Parto', data.sows.firstParity?.toString() || '0'],
        ['Cerdas de 2+ Partos', data.sows.multiparous?.toString() || '0'],
      ],
      theme: 'striped',
      headStyles: { fillColor: REPORT_CONFIG.secondaryColor },
      margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // SECCIÓN: INDICADORES PRODUCTIVOS TOTALES (sumatorias de todas las cerdas)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 152, 0); // Naranja
  doc.text('Indicadores Productivos Totales', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  // Calcular sumatorias de indicadores productivos
  const totalParities = data.sows.totalParities || 0;
  const totalPigletsBorn = data.sows.totalPigletsBorn || 0;
  const totalPigletsAlive = data.sows.totalPigletsAlive || 0;
  const totalPigletsDead = data.sows.totalPigletsDead || 0;
  const totalAbortions = data.sows.totalAbortions || 0;
  const avgPigletsAlive = data.sows.active > 0 ? (totalPigletsAlive / totalParities).toFixed(2) : '0.00';
  
  autoTable(doc, {
    startY: yPos,
    head: [['Indicador Productivo', 'Valor Total']],
    body: [
      ['Total de Partos (todas las cerdas)', totalParities.toString()],
      ['Total Lechones Nacidos', totalPigletsBorn.toString()],
      ['Total Lechones Vivos', totalPigletsAlive.toString()],
      ['Total Lechones Muertos', totalPigletsDead.toString()],
      ['Promedio General Lechones Vivos/Parto', avgPigletsAlive],
      ['Total Abortos', totalAbortions.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [255, 152, 0] }, // Naranja
    bodyStyles: {
      fillColor: [255, 248, 240]
    },
    alternateRowStyles: {
      fillColor: [255, 243, 224]
    },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Nueva página para verracos y lechones
  doc.addPage();
  yPos = 50;
  addReportHeader(doc, 'Reporte de Reproductores', 'Continuación - Verracos y Lechones');
  
  // SECCIÓN: VERRACOS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...REPORT_CONFIG.primaryColor);
  doc.text('Estadísticas de Verracos', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Cantidad']],
    body: [
      ['Total de Verracos', data.boars.total.toString()],
      ['Verracos Activos', data.boars.active.toString()],
      ['Servicios Realizados', data.boars.totalServices?.toString() || '0'],
      ['Promedio Servicios/Verraco', data.boars.avgServicesPerBoar?.toFixed(1) || '0'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // SECCIÓN: LECHONES
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...REPORT_CONFIG.primaryColor);
  doc.text('Estadísticas de Lechones', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Cantidad']],
    body: [
      ['Total de Lechones Vivos', data.piglets.total?.toString() || '0'],
      ['Lechones Machos', data.piglets.males?.toString() || '0'],
      ['Lechones Hembras', data.piglets.females?.toString() || '0'],
      ['Promedio Peso al Nacer (kg)', data.piglets.avgBirthWeight?.toFixed(2) || 'N/A'],
      ['Promedio Peso Actual (kg)', data.piglets.avgCurrentWeight?.toFixed(2) || 'N/A'],
      ['Lechones Destetados', data.piglets.weaned?.toString() || '0'],
      ['Lechones Vendidos', data.piglets.sold?.toString() || '0'],
      ['Lechones Muertos', data.piglets.dead?.toString() || '0'],
      ['Lechones Momificados', data.piglets.mummified?.toString() || '0'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addReportFooter(doc, i, totalPages);
  }
  
  doc.save(`Reporte_Reproductores_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================================================
// EXPORTACIÓN EXCEL - REPORTE DE REPRODUCTORES
// ============================================================================

export const exportReproductorsToExcel = (data) => {
  const workbook = XLSX.utils.book_new();
  
  // Hoja 1: Cerdas
  const sowsData = [
    ['ESTADÍSTICAS DE CERDAS'],
    [`Generado: ${new Date().toLocaleString('es-ES')}`],
    [],
    ['Métrica', 'Cantidad', 'Porcentaje'],
    ['Total de Cerdas', data.sows.total, '100%'],
    ['Cerdas Activas', data.sows.active, `${((data.sows.active / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
    ['En Gestación', data.sows.pregnant, `${((data.sows.pregnant / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
    ['Lactantes', data.sows.lactating, `${((data.sows.lactating / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
    ['En Celo', data.sows.inHeat || 0, `${(((data.sows.inHeat || 0) / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
    ['Vacías', data.sows.empty, `${((data.sows.empty / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
    ['Descartadas', data.sows.discarded, `${((data.sows.discarded / Math.max(data.sows.total, 1)) * 100).toFixed(1)}%`],
    [],
  ];
  
  if (data.sows) {
    // Calcular sumatorias de indicadores productivos
    const totalParities = data.sows.totalParities || 0;
    const totalPigletsBorn = data.sows.totalPigletsBorn || 0;
    const totalPigletsAlive = data.sows.totalPigletsAlive || 0;
    const totalPigletsDead = data.sows.totalPigletsDead || 0;
    const totalAbortions = data.sows.totalAbortions || 0;
    const avgPigletsAlive = totalParities > 0 ? (totalPigletsAlive / totalParities).toFixed(2) : '0.00';
    
    sowsData.push(
      ['DETALLES ADICIONALES'],
      ['Indicador', 'Valor'],
      ['Promedio de Edad (meses)', data.sows.avgAge?.toFixed(1) || 'N/A'],
      ['Número de Parto Promedio', data.sows.avgParities?.toFixed(1) || 'N/A'],
      ['Partos Reales por Cerda', data.sows.avgBirthsPerSow?.toFixed(2) || 'N/A'],
      ['Lechones por Cerda', data.sows.avgPigletsPerSow?.toFixed(1) || 'N/A'],
      ['Cerdas de 1er Parto', data.sows.firstParity || 0],
      ['Cerdas de 2+ Partos', data.sows.multiparous || 0],
      [],
      ['INDICADORES PRODUCTIVOS TOTALES'],
      ['Indicador Productivo', 'Valor Total'],
      ['Total de Partos (todas las cerdas)', totalParities],
      ['Total Lechones Nacidos', totalPigletsBorn],
      ['Total Lechones Vivos', totalPigletsAlive],
      ['Total Lechones Muertos', totalPigletsDead],
      ['Promedio General Lechones Vivos/Parto', avgPigletsAlive],
      ['Total Abortos', totalAbortions],
      []
    );
  }
  
  const ws1 = XLSX.utils.aoa_to_sheet(sowsData);
  ws1['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, ws1, 'Cerdas');
  
  // Hoja 2: Verracos
  const boarsData = [
    ['ESTADÍSTICAS DE VERRACOS'],
    [`Generado: ${new Date().toLocaleString('es-ES')}`],
    [],
    ['Métrica', 'Cantidad'],
    ['Total de Verracos', data.boars.total],
    ['Verracos Activos', data.boars.active],
    ['Servicios Realizados', data.boars.totalServices || 0],
    ['Promedio Servicios/Verraco', data.boars.avgServicesPerBoar?.toFixed(1) || '0'],
  ];
  
  const ws2 = XLSX.utils.aoa_to_sheet(boarsData);
  ws2['!cols'] = [{ wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, ws2, 'Verracos');
  
  // Hoja 3: Lechones
  const pigletsData = [
    ['ESTADÍSTICAS DE LECHONES'],
    [`Generado: ${new Date().toLocaleString('es-ES')}`],
    [],
    ['Métrica', 'Cantidad'],
    ['Total de Lechones Vivos', data.piglets.total || 0],
    ['Lechones Machos', data.piglets.males || 0],
    ['Lechones Hembras', data.piglets.females || 0],
    ['Promedio Peso al Nacer (kg)', data.piglets.avgBirthWeight?.toFixed(2) || 'N/A'],
    ['Promedio Peso Actual (kg)', data.piglets.avgCurrentWeight?.toFixed(2) || 'N/A'],
    ['Lechones Destetados', data.piglets.weaned || 0],
    ['Lechones Vendidos', data.piglets.sold || 0],
    ['Lechones Muertos', data.piglets.dead || 0],
    ['Lechones Momificados', data.piglets.mummified || 0],
  ];
  
  const ws3 = XLSX.utils.aoa_to_sheet(pigletsData);
  ws3['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, ws3, 'Lechones');
  
  XLSX.writeFile(workbook, `Reporte_Reproductores_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================================================
// EXPORTACIÓN PDF - REPORTE DE DATOS REPRODUCTIVOS
// ============================================================================

export const exportReproductiveDataToPDF = (data, sowFilter = null) => {
  const doc = new jsPDF();
  let yPos = 50;
  
  const subtitle = sowFilter 
    ? `Cerda: ${sowFilter.ear_tag}${sowFilter.alias ? ` - ${sowFilter.alias}` : ''}`
    : 'Datos generales de todas las cerdas';
  
  addReportHeader(doc, 'Reporte de Datos Reproductivos', subtitle);
  
  // SECCIÓN: CELOS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...REPORT_CONFIG.primaryColor);
  doc.text('Detección de Celos', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Celos Detectados', data.heats.total?.toString() || '0'],
      ['Celos Pendientes', data.heats.pending?.toString() || '0'],
      ['Celos Servidos', data.heats.serviced?.toString() || '0'],
      ['Tasa de Servicio', `${data.heats.serviceRate?.toFixed(1) || 0}%`],
      ['Intervalo Promedio (días)', data.heats.avgInterval?.toFixed(1) || 'N/A'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // SECCIÓN: SERVICIOS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Servicios de Monta', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Servicios', data.services.total?.toString() || '0'],
      ['Servicios Naturales', data.services.natural?.toString() || '0'],
      ['Servicios por IA', data.services.artificial?.toString() || '0'],
      ['Servicios Exitosos', data.services.successful?.toString() || '0'],
      ['Tasa de Éxito', `${data.services.successRate?.toFixed(1) || 0}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // SECCIÓN: GESTACIONES
  if (yPos > 200) {
    doc.addPage();
    yPos = 50;
    addReportHeader(doc, 'Reporte de Datos Reproductivos', 'Continuación');
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Gestaciones', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Gestaciones', data.pregnancies.total?.toString() || '0'],
      ['Gestaciones Confirmadas', data.pregnancies.confirmed?.toString() || '0'],
      ['Gestaciones Activas', data.pregnancies.active?.toString() || '0'],
      ['Gestaciones Finalizadas', data.pregnancies.completed?.toString() || '0'],
      ['Duración Promedio (días)', data.pregnancies.avgDuration?.toFixed(1) || 'N/A'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // SECCIÓN: PARTOS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Partos', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Partos', data.births.total?.toString() || '0'],
      ['Partos Naturales', data.births.natural?.toString() || '0'],
      ['Partos Asistidos', data.births.assisted?.toString() || '0'],
      ['Partos Complicados', data.births.complicated?.toString() || '0'],
      ['Total Lechones Nacidos', data.births.totalBorn?.toString() || '0'],
      ['Promedio Nacidos Vivos', data.births.avgBornAlive?.toFixed(1) || 'N/A'],
      ['Promedio Nacidos Muertos', data.births.avgBornDead?.toFixed(1) || 'N/A'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // SECCIÓN: ABORTOS
  if (yPos > 230) {
    doc.addPage();
    yPos = 50;
    addReportHeader(doc, 'Reporte de Datos Reproductivos', 'Continuación');
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Abortos', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de Abortos', data.abortions.total?.toString() || '0'],
      ['Tasa de Abortos', `${data.abortions.rate?.toFixed(1) || 0}%`],
      ['Abortos Tempranos (<60 días)', data.abortions.early?.toString() || '0'],
      ['Abortos Tardíos (>60 días)', data.abortions.late?.toString() || '0'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.dangerColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addReportFooter(doc, i, totalPages);
  }
  
  const filename = sowFilter 
    ? `Reporte_Reproductivo_${sowFilter.ear_tag}_${new Date().toISOString().split('T')[0]}.pdf`
    : `Reporte_Reproductivo_General_${new Date().toISOString().split('T')[0]}.pdf`;
  
  doc.save(filename);
};

// ============================================================================
// EXPORTACIÓN EXCEL - REPORTE DE DATOS REPRODUCTIVOS
// ============================================================================

export const exportReproductiveDataToExcel = (data, sowFilter = null) => {
  const workbook = XLSX.utils.book_new();
  
  const title = sowFilter 
    ? `REPORTE REPRODUCTIVO - Cerda ${sowFilter.ear_tag}`
    : 'REPORTE REPRODUCTIVO GENERAL';
  
  const summaryData = [
    [title],
    [`Generado: ${new Date().toLocaleString('es-ES')}`],
    [],
    ['CELOS'],
    ['Métrica', 'Valor'],
    ['Total de Celos', data.heats.total || 0],
    ['Pendientes', data.heats.pending || 0],
    ['Servidos', data.heats.serviced || 0],
    ['Tasa de Servicio', `${data.heats.serviceRate?.toFixed(1) || 0}%`],
    ['Intervalo Promedio (días)', data.heats.avgInterval?.toFixed(1) || 'N/A'],
    [],
    ['SERVICIOS'],
    ['Métrica', 'Valor'],
    ['Total', data.services.total || 0],
    ['Naturales', data.services.natural || 0],
    ['Inseminación Artificial', data.services.artificial || 0],
    ['Exitosos', data.services.successful || 0],
    ['Tasa de Éxito', `${data.services.successRate?.toFixed(1) || 0}%`],
    [],
    ['GESTACIONES'],
    ['Métrica', 'Valor'],
    ['Total', data.pregnancies.total || 0],
    ['Confirmadas', data.pregnancies.confirmed || 0],
    ['Activas', data.pregnancies.active || 0],
    ['Finalizadas', data.pregnancies.completed || 0],
    ['Duración Promedio (días)', data.pregnancies.avgDuration?.toFixed(1) || 'N/A'],
    [],
    ['PARTOS'],
    ['Métrica', 'Valor'],
    ['Total', data.births.total || 0],
    ['Naturales', data.births.natural || 0],
    ['Asistidos', data.births.assisted || 0],
    ['Complicados', data.births.complicated || 0],
    ['Total Lechones Nacidos', data.births.totalBorn || 0],
    ['Promedio Nacidos Vivos', data.births.avgBornAlive?.toFixed(1) || 'N/A'],
    ['Promedio Nacidos Muertos', data.births.avgBornDead?.toFixed(1) || 'N/A'],
    [],
    ['ABORTOS'],
    ['Métrica', 'Valor'],
    ['Total', data.abortions.total || 0],
    ['Tasa', `${data.abortions.rate?.toFixed(1) || 0}%`],
    ['Tempranos', data.abortions.early || 0],
    ['Tardíos', data.abortions.late || 0],
  ];
  
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, ws1, 'Resumen');
  
  const filename = sowFilter 
    ? `Reporte_Reproductivo_${sowFilter.ear_tag}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `Reporte_Reproductivo_General_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
};

// ============================================================================
// EXPORTACIÓN PDF - REPORTE DE KPIs
// ============================================================================

export const exportKPIsToPDF = (data, sowFilter = null) => {
  const doc = new jsPDF();
  let yPos = 50;
  
  const subtitle = sowFilter 
    ? `Cerda: ${sowFilter.ear_tag}${sowFilter.alias ? ` - ${sowFilter.alias}` : ''}`
    : 'Indicadores generales de todas las cerdas';
  
  addReportHeader(doc, 'Reporte de KPIs Productivos', subtitle);
  
  // KPIs Principales
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...REPORT_CONFIG.primaryColor);
  doc.text('Indicadores Clave de Rendimiento', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  const kpisBody = [
    ['Tasa de Fertilidad', `${data.fertilityRate?.toFixed(1) || 0}%`, 'Mayor o igual a 85%', data.fertilityRate >= 85 ? 'SI' : 'NO'],
    ['Tasa de Concepcion', `${data.conceptionRate?.toFixed(1) || 0}%`, 'Mayor o igual a 90%', data.conceptionRate >= 90 ? 'SI' : 'NO'],
    ['Tasa de Partos', `${data.farrowingRate?.toFixed(1) || 0}%`, 'Mayor o igual a 82%', data.farrowingRate >= 82 ? 'SI' : 'NO'],
    ['Lechones Nacidos Vivos/Parto', data.avgBornAlive?.toFixed(2) || '0.00', 'Mayor o igual a 11', (data.avgBornAlive >= 11) ? 'SI' : 'NO'],
    ['Lechones Nacidos Totales/Parto', data.avgTotalBorn?.toFixed(2) || '0.00', 'Mayor o igual a 12', (data.avgTotalBorn >= 12) ? 'SI' : 'NO'],
    ['Lechones Destetados/Parto', data.avgWeaned?.toFixed(2) || '0.00', 'Mayor o igual a 10', (data.avgWeaned >= 10) ? 'SI' : 'NO'],
    ['Mortalidad Pre-Destete', `${data.preWeaningMortality?.toFixed(1) || 0}%`, 'Menor o igual a 12%', (data.preWeaningMortality <= 12) ? 'SI' : 'NO'],
    ['Mortalidad al Nacer', `${data.birthMortality?.toFixed(1) || 0}%`, 'Menor o igual a 8%', (data.birthMortality <= 8) ? 'SI' : 'NO'],
    ['Tasa de Abortos', `${data.abortionRate?.toFixed(1) || 0}%`, 'Menor o igual a 3%', (data.abortionRate <= 3) ? 'SI' : 'NO'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['KPI', 'Valor Actual', 'Objetivo', 'Cumple']],
    body: kpisBody,
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    columnStyles: {
      3: { halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (cellData) => {
      if (cellData.column.index === 3 && cellData.section === 'body') {
        const value = cellData.cell.text[0];
        if (value === 'SI') {
          cellData.cell.styles.textColor = REPORT_CONFIG.successColor;
        } else if (value === 'NO') {
          cellData.cell.styles.textColor = REPORT_CONFIG.dangerColor;
        }
      }
    },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // KPIs Temporales
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores Temporales', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Indicador', 'Valor', 'Objetivo']],
    body: [
      ['Intervalo Destete-Celo (dias)', data.weanToHeatInterval?.toFixed(1) || '0.0', 'Menor o igual a 7 dias'],
      ['Intervalo Destete-Servicio (dias)', data.weanToServiceInterval?.toFixed(1) || '0.0', 'Menor o igual a 10 dias'],
      ['Intervalo entre Partos (dias)', data.farrowingInterval?.toFixed(1) || '0.0', 'Menor o igual a 150 dias'],
      ['Dias No Productivos', data.nonProductiveDays?.toFixed(1) || '0.0', 'Menor o igual a 30 dias'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.secondaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Productividad Anual
  if (yPos > 200) {
    doc.addPage();
    yPos = 50;
    addReportHeader(doc, 'Reporte de KPIs Productivos', 'Continuación');
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Productividad Anual', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Indicador', 'Valor', 'Objetivo']],
    body: [
      ['Partos/Cerda/Anio', data.farrowingsPerSowPerYear?.toFixed(2) || '0.00', 'Mayor o igual a 2.3'],
      ['Lechones Nacidos Vivos/Cerda/Anio', data.pigletsPerSowPerYear?.toFixed(1) || '0.0', 'Mayor o igual a 25'],
      ['Lechones Destetados/Cerda/Anio', data.weanedPerSowPerYear?.toFixed(1) || '0.0', 'Mayor o igual a 23'],
    ],
    theme: 'striped',
    headStyles: { fillColor: REPORT_CONFIG.secondaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Resumen de Cumplimiento
  const totalKPIs = kpisBody.length;
  const metKPIs = kpisBody.filter(row => row[3] === 'SI').length;
  const complianceRate = (metKPIs / totalKPIs) * 100;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Cumplimiento', REPORT_CONFIG.margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total de KPIs Evaluados', totalKPIs.toString()],
      ['KPIs Cumplidos', metKPIs.toString()],
      ['KPIs No Cumplidos', (totalKPIs - metKPIs).toString()],
      ['Tasa de Cumplimiento', `${complianceRate.toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: REPORT_CONFIG.primaryColor },
    margin: { left: REPORT_CONFIG.margin, right: REPORT_CONFIG.margin },
  });
  
  // Estado General
  yPos = doc.lastAutoTable.finalY + 10;
  const status = complianceRate >= 80 ? 'EXCELENTE' : complianceRate >= 60 ? 'BUENO' : 'REQUIERE MEJORA';
  const statusColor = complianceRate >= 80 ? REPORT_CONFIG.successColor : complianceRate >= 60 ? REPORT_CONFIG.warningColor : REPORT_CONFIG.dangerColor;
  
  doc.setTextColor(...statusColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Estado General: ${status}`, REPORT_CONFIG.pageWidth / 2, yPos, { align: 'center' });
  
  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addReportFooter(doc, i, totalPages);
  }
  
  const filename = sowFilter 
    ? `Reporte_KPIs_${sowFilter.ear_tag}_${new Date().toISOString().split('T')[0]}.pdf`
    : `Reporte_KPIs_General_${new Date().toISOString().split('T')[0]}.pdf`;
  
  doc.save(filename);
};

// ============================================================================
// EXPORTACIÓN EXCEL - REPORTE DE KPIs
// ============================================================================

export const exportKPIsToExcel = (data, sowFilter = null) => {
  const workbook = XLSX.utils.book_new();
  
  const title = sowFilter 
    ? `REPORTE DE KPIs - Cerda ${sowFilter.ear_tag}`
    : 'REPORTE DE KPIs GENERAL';
  
  const kpisData = [
    [title],
    [`Generado: ${new Date().toLocaleString('es-ES')}`],
    [],
    ['INDICADORES CLAVE DE RENDIMIENTO'],
    ['KPI', 'Valor Actual', 'Objetivo', 'Cumple'],
    ['Tasa de Fertilidad', `${data.fertilityRate?.toFixed(1) || 0}%`, 'Mayor o igual a 85%', data.fertilityRate >= 85 ? 'SI' : 'NO'],
    ['Tasa de Concepcion', `${data.conceptionRate?.toFixed(1) || 0}%`, 'Mayor o igual a 90%', data.conceptionRate >= 90 ? 'SI' : 'NO'],
    ['Tasa de Partos', `${data.farrowingRate?.toFixed(1) || 0}%`, 'Mayor o igual a 82%', data.farrowingRate >= 82 ? 'SI' : 'NO'],
    ['Lechones Nacidos Vivos/Parto', data.avgBornAlive?.toFixed(2) || '0.00', 'Mayor o igual a 11', (data.avgBornAlive >= 11) ? 'SI' : 'NO'],
    ['Lechones Nacidos Totales/Parto', data.avgTotalBorn?.toFixed(2) || '0.00', 'Mayor o igual a 12', (data.avgTotalBorn >= 12) ? 'SI' : 'NO'],
    ['Lechones Destetados/Parto', data.avgWeaned?.toFixed(2) || '0.00', 'Mayor o igual a 10', (data.avgWeaned >= 10) ? 'SI' : 'NO'],
    ['Mortalidad Pre-Destete', `${data.preWeaningMortality?.toFixed(1) || 0}%`, 'Menor o igual a 12%', (data.preWeaningMortality <= 12) ? 'SI' : 'NO'],
    ['Mortalidad al Nacer', `${data.birthMortality?.toFixed(1) || 0}%`, 'Menor o igual a 8%', (data.birthMortality <= 8) ? 'SI' : 'NO'],
    ['Tasa de Abortos', `${data.abortionRate?.toFixed(1) || 0}%`, 'Menor o igual a 3%', (data.abortionRate <= 3) ? 'SI' : 'NO'],
    [],
    ['INDICADORES TEMPORALES'],
    ['Indicador', 'Valor', 'Objetivo'],
    ['Intervalo Destete-Celo (dias)', data.weanToHeatInterval?.toFixed(1) || '0.0', 'Menor o igual a 7 dias'],
    ['Intervalo Destete-Servicio (dias)', data.weanToServiceInterval?.toFixed(1) || '0.0', 'Menor o igual a 10 dias'],
    ['Intervalo entre Partos (dias)', data.farrowingInterval?.toFixed(1) || '0.0', 'Menor o igual a 150 dias'],
    ['Dias No Productivos', data.nonProductiveDays?.toFixed(1) || '0.0', 'Menor o igual a 30 dias'],
    [],
    ['PRODUCTIVIDAD ANUAL'],
    ['Indicador', 'Valor', 'Objetivo'],
    ['Partos/Cerda/Anio', data.farrowingsPerSowPerYear?.toFixed(2) || '0.00', 'Mayor o igual a 2.3'],
    ['Lechones Nacidos Vivos/Cerda/Anio', data.pigletsPerSowPerYear?.toFixed(1) || '0.0', 'Mayor o igual a 25'],
    ['Lechones Destetados/Cerda/Anio', data.weanedPerSowPerYear?.toFixed(1) || '0.0', 'Mayor o igual a 23'],
  ];
  
  const ws1 = XLSX.utils.aoa_to_sheet(kpisData);
  ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, ws1, 'KPIs');
  
  const filename = sowFilter 
    ? `Reporte_KPIs_${sowFilter.ear_tag}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `Reporte_KPIs_General_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
};

