export interface VerificarAcceso {
  idUsuario: number;
  idLanzamiento: number;
  tieneAcceso: boolean;
}

export interface VerificarAccesoRequest {
  idUsuario: number;
  idLanzamiento: number;
}

