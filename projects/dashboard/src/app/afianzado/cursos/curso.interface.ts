export interface Ejemplo {
  id?: number;
  texto: string;
  orden?: number;
}

export interface PuntoContenido {
  id?: number;
  titulo: string;
  descripcion?: string;
  orden?: number;
  ejemplos?: Ejemplo[];
}

export interface Seccion {
  id?: number;
  titulo: string;
  orden?: number;
  puntos: PuntoContenido[];
}

export interface Modulo {
  id: number;
  titulo: string;
  descripcion: string;
  duracionEstimada: string;
  icono: string;
  introduccion?: string;
  mensajeCierre?: string;
  orden?: number;
  completado?: boolean; // Indica si el usuario ha completado/aprobado el curso
  puntajeObtenido?: number; // Puntaje obtenido en la evaluación
  puntajeTotal?: number; // Puntaje total de la evaluación
  porcentaje?: number; // Porcentaje de aprobación (0-100)
  objetivos?: string[];
  secciones?: Seccion[];
}

export interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  modulos: Modulo[];
}

