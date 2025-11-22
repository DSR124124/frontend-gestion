export interface Rol {
  idRol: number;
  nombreRol: string;
  descripcion: string | null;
  permisos: { [key: string]: any } | null;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface RolDTO {
  nombreRol: string;
  descripcion?: string;
  permisos?: { [key: string]: any };
  activo?: boolean;
}

