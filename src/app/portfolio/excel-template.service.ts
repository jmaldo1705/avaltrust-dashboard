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
      'Obligacion',
      'Tipo Documento',
      'Numero Documento',
      'Nombres',
      'Apellidos',
      'Tipo Cliente',
      'WhatsApp',
      'Email',
      'Fecha Desembolso',
      'Cuotas',
      'Valor Desembolso',
      'Valor Aval',
      'Interes',
      'Tasa Aval (%)',
      'Otros Conceptos',
      'Abono Aval',
      'Abono Capital',
      'Fecha Vencimiento',
      'Dias Mora',
      'Fecha Pago',
      'Estado Credito',
      'Periodicidad'
    ];

    // Crear filas de ejemplo
    const sampleData = [
      [
        'OBL-2025-0001',
        'CC',
        '12345678',
        'Juan Carlos',
        'Perez Gonzalez',
        'NATURAL',
        '+57 300 1234567',
        'juan.perez@email.com',
        '2025-01-15',
        '360',
        '50000000',
        '5000000',
        '2500000',
        '18.5',
        '0',
        '0',
        '0',
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
        '+57 311 9876543',
        'contacto@empresa.com',
        '2025-01-20',
        '180',
        '100000000',
        '10000000',
        '5000000',
        '15.0',
        '500000',
        '1000000',
        '2000000',
        '2026-07-20',
        '5',
        '',
        'VENCIDO',
        'TRIMESTRAL'
      ]
    ];

    // Crear instrucciones
    const instructions = [
      ['INSTRUCCIONES PARA EL ARCHIVO DE CARGA MASIVA'],
      [''],
      ['1. Complete todos los campos obligatorios'],
      ['2. Respete el formato de fechas: YYYY-MM-DD (Ej: 2025-01-15)'],
      ['3. Para numeros decimales use punto como separador (Ej: 18.5)'],
      ['4. Valores permitidos para campos especificos:'],
      ['   - Tipo Documento: CC, CE, NIT, TI'],
      ['   - Tipo Cliente: NATURAL, JURIDICA'],
      ['   - Estado Credito: VIGENTE, VENCIDO, CANCELADO, CASTIGADO'],
      ['   - Periodicidad: MENSUAL, BIMESTRAL, TRIMESTRAL, SEMESTRAL, ANUAL'],
      [''],
      ['5. Los siguientes campos son OBLIGATORIOS:'],
      ['   Obligacion, Tipo Documento, Numero Documento, Nombres, Apellidos,'],
      ['   Tipo Cliente, Fecha Desembolso, Cuotas, Valor Desembolso,'],
      ['   Valor Aval, Interes, Tasa Aval, Fecha Vencimiento,'],
      ['   Estado Credito, Periodicidad'],
      [''],
      ['6. Los campos opcionales son:'],
      ['   Otros Conceptos, Abono Aval, Abono Capital, Dias Mora, Fecha Pago'],
      [''],
      ['7. El Total Deuda se calcula automaticamente como:'],
      ['   Valor Desembolso + Valor Aval + Interes + Otros Conceptos - Abono Aval - Abono Capital'],
      [''],
      ['8. Coherencia de estado y mora:'],
      ['   - Si "Dias Mora" > 0, "Estado Credito" no puede ser VIGENTE (use VENCIDO o CASTIGADO).'],
      ['   - Si "Dias Mora" = 0, use "Estado Credito" = VIGENTE.']
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
