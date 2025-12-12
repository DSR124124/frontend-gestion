export interface UsuarioLanzamientoDisponible {
  idUsuario: number;
  username: string | null;
  email: string | null;
  idAplicacion: number;
  nombreAplicacion: string | null;
  idLanzamiento: number;
  version: string | null;
  estado: string | null;
  fechaLanzamiento: string | null;
  notasVersion: string | null;
  urlDescarga: string | null;
  tamanoArchivo: number | null;
  esCritico: boolean | null;
  idGrupo: number;
  nombreGrupo: string | null;
  fechaDisponibilidad: string | null;
  fechaFinDisponibilidad: string | null;
}

