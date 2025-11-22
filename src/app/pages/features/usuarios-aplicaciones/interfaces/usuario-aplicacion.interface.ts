export interface UsuarioAplicacion {
  idUsuarioAplicacion: number;
  idUsuario: number;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  idAplicacion: number;
  aplicacionNombre: string | null;
  fechaRegistro: string;
  fechaUltimoAcceso: string | null;
  licenciaActiva: boolean;
  fechaExpiracionLicencia: string | null;
  registradoPor: number | null;
  registradoPorNombre: string | null;
  notas: string | null;
}

export interface UsuarioAplicacionDTO {
  idUsuario: number;
  idAplicacion: number;
  fechaUltimoAcceso?: string;
  licenciaActiva?: boolean;
  fechaExpiracionLicencia?: string;
  registradoPor?: number;
  notas?: string;
}

