export interface Aplicacion {
  idAplicacion: number;
  nombreAplicacion: string;
  descripcion: string | null;
  codigoProducto: string | null;
  repositorioUrl: string | null;
  url: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface AplicacionDTO {
  nombreAplicacion: string;
  descripcion?: string;
  codigoProducto?: string;
  repositorioUrl?: string;
  url?: string;
  responsableId?: number;
  activo?: boolean;
}

