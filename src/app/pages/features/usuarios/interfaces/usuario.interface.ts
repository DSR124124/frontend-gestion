export interface Usuario {
  idUsuario: number;
  username: string;
  email: string;
  nombreCompleto: string | null;
  idRol: number;
  nombreRol: string;
  activo: boolean;
  fechaCreacion: string;
  fechaUltimoAcceso: string | null;
  metadata: { [key: string]: any } | null;
}

export interface UsuarioDTO {
  username: string;
  email: string;
  password?: string;
  nombreCompleto?: string;
  idRol: number;
  activo?: boolean;
  metadata?: { [key: string]: any };
}

