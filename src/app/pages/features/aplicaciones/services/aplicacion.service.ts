import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Aplicacion, AplicacionDTO } from '../interfaces/aplicacion.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class AplicacionService {
  private readonly API_URL = `${environment.urlAuth}api/aplicaciones`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todas las aplicaciones
   */
  listar(): Observable<Aplicacion[]> {
    return this.http.get<Aplicacion[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene una aplicación por su ID
   */
  obtenerPorId(id: number): Observable<Aplicacion> {
    return this.http.get<Aplicacion>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea una nueva aplicación
   */
  crear(aplicacion: AplicacionDTO): Observable<Aplicacion> {
    return this.http.post<Aplicacion>(this.API_URL, aplicacion).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza una aplicación existente
   */
  actualizar(id: number, aplicacion: AplicacionDTO): Observable<Aplicacion> {
    return this.http.put<Aplicacion>(`${this.API_URL}/${id}`, aplicacion).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina una aplicación
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

