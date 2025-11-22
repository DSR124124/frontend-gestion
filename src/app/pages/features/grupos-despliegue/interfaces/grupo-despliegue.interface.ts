export interface GrupoDespliegue {
  idGrupo: number;
  nombreGrupo: string;
  descripcion: string | null;
  ordenPrioridad: number | null;
  porcentajeUsuarios: number | null;
  activo: boolean;
  fechaCreacion: string;
  metadata: { [key: string]: any } | null;
}

export interface GrupoDespliegueDTO {
  nombreGrupo: string;
  descripcion?: string;
  ordenPrioridad?: number;
  porcentajeUsuarios?: number;
  activo?: boolean;
  metadata?: { [key: string]: any };
}

