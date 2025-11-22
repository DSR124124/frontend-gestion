export interface EstadisticaLanzamiento {
  idAplicacion: number;
  nombreAplicacion: string | null;
  idLanzamiento: number;
  version: string | null;
  estado: string | null;
  fechaLanzamiento: string | null;
  usuariosConAcceso: number;
  gruposAsignados: number;
  esCritico: boolean | null;
}

