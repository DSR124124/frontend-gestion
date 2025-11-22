export interface LanzamientoGrupo {
  idLanzamientoGrupo: number;
  idLanzamiento: number;
  lanzamientoVersion: string | null;
  aplicacionNombre: string | null;
  idGrupo: number;
  grupoNombre: string | null;
  ordenPrioridad: number | null;
  fechaAsignacion: string;
  fechaDisponibilidad: string | null;
  fechaFinDisponibilidad: string | null;
  asignadoPor: number | null;
  asignadoPorNombre: string | null;
  notificacionEnviada: boolean;
  activo: boolean;
  notas: string | null;
}

export interface LanzamientoGrupoDTO {
  idLanzamiento: number;
  idGrupo: number;
  fechaDisponibilidad?: string;
  fechaFinDisponibilidad?: string;
  asignadoPor?: number;
  notificacionEnviada?: boolean;
  activo?: boolean;
  notas?: string;
}

