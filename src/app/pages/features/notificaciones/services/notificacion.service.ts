import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Notificacion, NotificacionDTO, NotificacionUsuarioDTO } from '../interfaces/notificacion.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly API_URL = `${environment.urlAuth}api/notificaciones`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todas las notificaciones
   */
  listar(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene una notificación por su ID
   */
  obtenerPorId(id: number): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene las notificaciones por aplicación
   */
  listarPorAplicacion(idAplicacion: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.API_URL}/por-aplicacion/${idAplicacion}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea una nueva notificación
   */
  crear(notificacion: NotificacionDTO): Observable<Notificacion> {
    return this.http.post<Notificacion>(this.API_URL, notificacion).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza una notificación existente
   */
  actualizar(id: number, notificacion: NotificacionDTO): Observable<Notificacion> {
    return this.http.put<Notificacion>(`${this.API_URL}/${id}`, notificacion).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina una notificación
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene las notificaciones no leídas de un usuario
   */
  obtenerNotificacionesNoLeidas(idUsuario: number): Observable<NotificacionUsuarioDTO[]> {
    return this.http.get<NotificacionUsuarioDTO[]>(`${this.API_URL}/usuario/${idUsuario}/no-leidas`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene las notificaciones no leídas de un usuario por aplicación
   */
  obtenerNotificacionesNoLeidasPorAplicacion(idUsuario: number, idAplicacion: number): Observable<NotificacionUsuarioDTO[]> {
    return this.http.get<NotificacionUsuarioDTO[]>(`${this.API_URL}/usuario/${idUsuario}/aplicacion/${idAplicacion}/no-leidas`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida(idNotificacion: number, idUsuario: number): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${idNotificacion}/usuario/${idUsuario}/marcar-leida`, {}).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Confirma una notificación
   */
  confirmarNotificacion(idNotificacion: number, idUsuario: number): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${idNotificacion}/usuario/${idUsuario}/confirmar`, {}).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Asigna una notificación a un grupo
   */
  asignarNotificacionAGrupo(idNotificacion: number, idGrupo: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${idNotificacion}/asignar-grupo/${idGrupo}`, {}).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Asigna una notificación a múltiples usuarios
   */
  asignarNotificacionAUsuarios(idNotificacion: number, idUsuarios: number[]): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${idNotificacion}/asignar-usuarios`, idUsuarios).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

