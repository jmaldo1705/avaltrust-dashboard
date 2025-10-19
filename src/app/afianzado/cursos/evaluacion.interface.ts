/**
 * Interfaces para el sistema de evaluaciones de cursos
 */

export interface OpcionDTO {
  id: number;
  textoOpcion: string;
  orden: number;
}

export interface PreguntaDTO {
  id: number;
  pregunta: string;
  orden: number;
  puntos: number;
  opciones: OpcionDTO[];
}

export interface EvaluacionCursoDTO {
  cursoId: number;
  cursoTitulo: string;
  totalPreguntas: number;
  puntajeTotal: number;
  preguntas: PreguntaDTO[];
}

export interface RespuestaDTO {
  preguntaId: number;
  opcionSeleccionadaId: number;
}

export interface SubmitEvaluacionDTO {
  cursoId: number;
  respuestas: RespuestaDTO[];
  tiempoCompletadoSegundos?: number;
}

export interface DetalleRespuestaDTO {
  preguntaId: number;
  pregunta: string;
  opcionSeleccionadaId: number;
  opcionSeleccionadaTexto: string;
  esCorrecta: boolean;
  puntosObtenidos: number;
  puntosPosibles: number;
  opcionCorrectaId: number;
  opcionCorrectaTexto: string;
}

export interface ResultadoEvaluacionDTO {
  evaluacionId: number;
  cursoId: number;
  cursoTitulo: string;
  cursoIcono: string;
  puntajeObtenido: number;
  puntajeTotal: number;
  porcentaje: number;
  aprobado: boolean;
  totalPreguntas: number;
  respuestasCorrectas: number;
  respuestasIncorrectas: number;
  fechaRealizacion: string;
  tiempoCompletadoSegundos?: number;
  mensajeCierre: string;
  detalleRespuestas: DetalleRespuestaDTO[];
}

export interface HistorialEvaluacionDTO {
  evaluacionId: number;
  cursoId: number;
  cursoTitulo: string;
  cursoIcono: string;
  puntajeObtenido: number;
  puntajeTotal: number;
  porcentaje: number;
  aprobado: boolean;
  totalPreguntas: number;
  respuestasCorrectas: number;
  fechaRealizacion: string;
  tiempoCompletadoSegundos?: number;
}

export interface EstadisticasUsuarioDTO {
  totalEvaluaciones: number;
  cursosAprobados: number;
  totalCursosDisponibles: number;
  promedioGeneral: number;
}
