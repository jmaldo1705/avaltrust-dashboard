import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ClaimsTemplateService {

  /**
   * Genera una plantilla de Excel para carga masiva de siniestros
   */
  generateClaimsTemplate(): void {
    // Crear encabezados
    const headers = [
      'Obligacion',
      'Fecha Solicitud',
      'Valor Capital',
      'Intereses',
      'Otros Conceptos',
      'Aval',
      'Direccion',
      'Codigo Departamento',
      'Codigo Ciudad',
      'Email',
      'Celular',
      'Convenio Nit',
      'Nit Empresa'
    ];

    // Datos de ejemplo
    const exampleData = [
      [
        'OBL-2025-0001',
        '2025-01-15',
        50000000,
        2500000,
        100000,
        'Si',
        'Calle 123 # 45-67',
        '11',
        '11001',
        'ejemplo@correo.com',
        '3001234567',
        '900123456',
        '900654321'
      ],
      [
        'OBL-2025-0002',
        '2025-01-20',
        30000000,
        1500000,
        0,
        'No',
        'Carrera 50 # 30-40',
        '05',
        '05001',
        'cliente@email.com',
        '3109876543',
        '900123456',
        '900654321'
      ]
    ];

    // Instrucciones
    const instructions = [
      ['INSTRUCCIONES PARA LA CARGA MASIVA DE SINIESTROS'],
      [''],
      ['1. Complete todos los campos obligatorios'],
      ['2. Respete el formato de cada columna:'],
      ['   - Obligacion: Texto único identificador'],
      ['   - Fecha Solicitud: Formato YYYY-MM-DD (Ej: 2025-01-15)'],
      ['   - Valor Capital: Número decimal (Ej: 50000000)'],
      ['   - Intereses: Número decimal (Ej: 2500000)'],
      ['   - Otros Conceptos: Número decimal (puede ser 0)'],
      ['   - Aval: Texto (Ej: Si/No)'],
      ['   - Direccion: Texto completo'],
      ['   - Codigo Departamento: Código numérico (Ej: 11)'],
      ['   - Codigo Ciudad: Código numérico (Ej: 11001)'],
      ['   - Email: Formato válido de correo'],
      ['   - Celular: 10 dígitos (Ej: 3001234567)'],
      ['   - Convenio Nit: NIT del convenio'],
      ['   - Nit Empresa: NIT de la empresa'],
      [''],
      ['3. Elimine las filas de ejemplo antes de cargar'],
      ['4. No modifique los nombres de las columnas'],
      ['5. Máximo 5,000 registros por archivo'],
      ['']
    ];

    // Crear el libro de trabajo
    const wb = XLSX.utils.book_new();

    // Hoja de datos con encabezados y ejemplos (primera hoja)
    const wsData = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Configurar anchos de columna
    wsData['!cols'] = [
      { wch: 20 },  // Obligacion
      { wch: 15 },  // Fecha Solicitud
      { wch: 15 },  // Valor Capital
      { wch: 12 },  // Intereses
      { wch: 15 },  // Otros Conceptos
      { wch: 10 },  // Aval
      { wch: 30 },  // Direccion
      { wch: 20 },  // Codigo Departamento
      { wch: 15 },  // Codigo Ciudad
      { wch: 25 },  // Email
      { wch: 12 },  // Celular
      { wch: 15 },  // Convenio Nit
      { wch: 15 }   // Nit Empresa
    ];

    // Aseguramos que la primera hoja sea 'Datos' (algunos backends leen solo la hoja 1)
    XLSX.utils.book_append_sheet(wb, wsData, 'Datos');

    // Hoja de instrucciones
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');

    // Generar archivo
    const fileName = `Plantilla_Siniestros_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    console.log(`Plantilla de siniestros generada: ${fileName}`);
  }
}
