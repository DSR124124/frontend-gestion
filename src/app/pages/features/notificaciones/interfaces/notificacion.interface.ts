export interface Notificacion {
  idNotificacion: number;
  titulo: string;
  mensaje: string;
  tipoNotificacion: string; // info, warning, error, success, critical
  prioridad: string; // baja, normal, alta, urgente
  idAplicacion: number;
  nombreAplicacion: string | null;
  creadoPor: number;
  creadorNombre: string | null;
  fechaCreacion: string;
  fechaExpiracion: string | null;
  fechaEnvio: string | null;
  requiereConfirmacion: boolean;
  mostrarComoRecordatorio: boolean;
  activo: boolean;
  datosAdicionales: any | null;
  fechaModificacion: string;
  totalDestinatarios?: number | null;
  totalLeidas?: number | null;
  totalConfirmadas?: number | null;
}

