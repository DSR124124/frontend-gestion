import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Notificacion } from '../interfaces/notificacion.interface';
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
   * Obtiene la lista de todas las notificaciones (solo lectura para administrador)
   */
  listar(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

