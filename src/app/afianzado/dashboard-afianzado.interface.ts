export interface Obligacion {
  numeroObligacion: string;
  tipoObligacion: string;
  valorTotal: number;
  saldoActual: number;
  cuotaMensual: number;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: string;
  diasMora: number;
  valorMora: number;
  nombreEmpresa: string; // Nombre del aliado estratégico
}

export interface DashboardAfianzado {
  nombreAfianzado: string;
  documentoIdentidad: string;
  deudaTotal: number;
  moraTotal: number;
  totalObligaciones: number;
  obligacionesAlDia: number;
  obligacionesEnMora: number;
  obligaciones: Obligacion[];
}
