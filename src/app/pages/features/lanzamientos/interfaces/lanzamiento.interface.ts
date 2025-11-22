export interface Lanzamiento {
  idLanzamiento: number;
  idAplicacion: number;
  nombreAplicacion: string | null;
  version: string;
  estado: string;
  fechaLanzamiento: string | null;
  fechaPublicacion: string;
  notasVersion: string;
  urlDescarga: string | null;
  tamanoArchivo: number | null;
  checksumSha256: string | null;
  esCritico: boolean;
  requiereReinicio: boolean;
  publicadoPor: number | null;
  publicadoPorNombre: string | null;
  metadata: { [key: string]: any } | null;
}

export interface LanzamientoDTO {
  idAplicacion: number;
  version: string;
  estado?: string;
  fechaLanzamiento?: string;
  notasVersion: string;
  urlDescarga?: string;
  tamanoArchivo?: number;
  checksumSha256?: string;
  esCritico?: boolean;
  requiereReinicio?: boolean;
  publicadoPor?: number;
  metadata?: { [key: string]: any };
}

