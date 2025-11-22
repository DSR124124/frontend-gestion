export interface Aplicacion {
  idAplicacion: number;
  nombreAplicacion: string;
  descripcion: string | null;
  codigoProducto: string | null;
  iconoUrl: string | null;
  repositorioUrl: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
  metadata: { [key: string]: any } | null;
}

export interface AplicacionDTO {
  nombreAplicacion: string;
  descripcion?: string;
  codigoProducto?: string;
  iconoUrl?: string;
  repositorioUrl?: string;
  responsableId?: number;
  activo?: boolean;
  metadata?: { [key: string]: any };
}

