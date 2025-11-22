export interface UsuarioGrupo {
  idUsuarioGrupo: number;
  idUsuario: number;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  idGrupo: number;
  grupoNombre: string | null;
  ordenPrioridad: number | null;
  fechaAsignacion: string;
  asignadoPor: number | null;
  asignadoPorNombre: string | null;
  activo: boolean;
  notas: string | null;
}

export interface UsuarioGrupoDTO {
  idUsuario: number;
  idGrupo: number;
  asignadoPor?: number;
  activo?: boolean;
  notas?: string;
}

