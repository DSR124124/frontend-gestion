import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { EstadisticaLanzamiento } from '../interfaces/estadistica-lanzamiento.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class EstadisticaLanzamientoService {
  private readonly API_URL = `${environment.urlAuth}api/estadisticas-lanzamientos`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene todas las estadísticas de lanzamientos
   */
  listarTodas(): Observable<EstadisticaLanzamiento[]> {
    return this.http.get<EstadisticaLanzamiento[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene las estadísticas de lanzamientos por aplicación
   */
  listarPorAplicacion(idAplicacion: number): Observable<EstadisticaLanzamiento[]> {
    return this.http.get<EstadisticaLanzamiento[]>(`${this.API_URL}/aplicacion/${idAplicacion}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

