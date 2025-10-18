/**
 * Interfaz para Aliado Estratégico (Empresa Cliente)
 */
export interface AliadoEstrategico {
  id: number;
  nombre: string;
  nit: string;
  correo: string;
  direccion?: string;
  telefono?: string;
  activo: boolean;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
  usuarioCreacion?: string;
  usuarioModificacion?: string;
  observaciones?: string;
  porcentajeCapitalizacion?: number;
}

/**
 * Request para crear o actualizar aliado
 */
export interface AliadoEstrategicoRequest {
  nombre: string;
  nit: string;
  correo: string;
  direccion?: string;
  telefono?: string;
  activo?: boolean;
  observaciones?: string;
  porcentajeCapitalizacion?: number;
}

/**
 * Filtros para búsqueda de aliados
 */
export interface AliadoFiltros {
  activo?: boolean;
  searchTerm?: string;
}
