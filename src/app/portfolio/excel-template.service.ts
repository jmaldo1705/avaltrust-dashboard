import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelTemplateService {

  /**
   * Genera una plantilla Excel basada en la estructura del formulario
   */
  generatePortfolioTemplate(): void {
    // Definir las columnas basadas en el formulario
    const headers = [
      'Obligación',
      'Tipo Documento',
      'Número Documento',
      'Nombres',
      'Apellidos',
      'Tipo Cliente',
      'Fecha Desembolso',
      'Cuotas',
      'Valor Desembolso',
      'Valor Aval',
      'Interés',
      'Tasa Aval (%)',
      'Otros Conceptos',
      'Abono Aval',
      'Abono Capital',
      'Total Deuda',
      'Fecha Vencimiento',
      'Días Mora',
      'Fecha Pago',
      'Estado Crédito',
      'Periodicidad'
    ];

    // Crear filas de ejemplo
    const sampleData = [
      [
        'OBL-2025-0001',
        'CC',
        '12345678',
        'Juan Carlos',
        'Pérez González',
        'NATURAL',
        '2025-01-15',
        '360',
        '50000000',
        '5000000',
        '2500000',
        '18.5',
        '0',
        '0',
        '0',
        '57500000',
        '2025-12-31',
        '0',
        '',
        'VIGENTE',
        'MENSUAL'
      ],
      [
        'OBL-2025-0002',
        'NIT',
        '900123456',
        'Empresa',
        'Ejemplo SAS',
        'JURIDICA',
        '2025-01-20',
        '180',
        '100000000',
        '10000000',
        '5000000',
        '15.0',
        '500000',
        '1000000',
        '2000000',
        '112500000',
        '2026-07-20',
        '5',
        '2025-01-25',
        'VIGENTE',
        'TRIMESTRAL'
      ]
    ];

    // Crear instrucciones
    const instructions = [
      ['INSTRUCCIONES PARA EL ARCHIVO DE CARGA MASIVA'],
      [''],
      ['1. Complete todos los campos obligatorios'],
      ['2. Respete el formato de fechas: YYYY-MM-DD (Ej: 2025-01-15)'],
      ['3. Para números decimales use punto como separador (Ej: 18.5)'],
      ['4. Valores permitidos para campos específicos:'],
      ['   - Tipo Documento: CC, CE, NIT, TI'],
      ['   - Tipo Cliente: NATURAL, JURIDICA'],
      ['   - Estado Crédito: VIGENTE, VENCIDO, CANCELADO, CASTIGADO'],
      ['   - Periodicidad: MENSUAL, BIMESTRAL, TRIMESTRAL, SEMESTRAL, ANUAL'],
      [''],
      ['5. Los siguientes campos son OBLIGATORIOS:'],
      ['   Obligación, Tipo Documento, Número Documento, Nombres, Apellidos,'],
      ['   Tipo Cliente, Fecha Desembolso, Cuotas, Valor Desembolso,'],
      ['   Valor Aval, Interés, Tasa Aval, Total Deuda, Fecha Vencimiento,'],
      ['   Estado Crédito, Periodicidad'],
      [''],
      ['6. Los campos opcionales son:'],
      ['   Otros Conceptos, Abono Aval, Abono Capital, Días Mora, Fecha Pago'],
      ['']
    ];

    // Crear el workbook
    const wb = XLSX.utils.book_new();

    // Hoja de instrucciones
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

    // Hoja de datos
    const wsData = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Aplicar estilos a los headers
    const headerRange = XLSX.utils.decode_range(wsData['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!wsData[cellAddress]) continue;
      wsData[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'D3D3D3' } },
        alignment: { horizontal: 'center' }
      };
    }

    // Configurar ancho de columnas
    wsData['!cols'] = headers.map(() => ({ width: 15 }));

    XLSX.utils.book_append_sheet(wb, wsData, 'Plantilla Cartera');

    // Descargar el archivo
    const fileName = `Plantilla_Cartera_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
