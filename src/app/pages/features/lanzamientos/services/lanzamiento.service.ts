import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Lanzamiento, LanzamientoDTO } from '../interfaces/lanzamiento.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class LanzamientoService {
  private readonly API_URL = `${environment.urlAuth}api/lanzamientos`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todos los lanzamientos
   */
  listar(): Observable<Lanzamiento[]> {
    return this.http.get<Lanzamiento[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene un lanzamiento por su ID
   */
  obtenerPorId(id: number): Observable<Lanzamiento> {
    return this.http.get<Lanzamiento>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea un nuevo lanzamiento
   */
  crear(lanzamiento: LanzamientoDTO): Observable<Lanzamiento> {
    return this.http.post<Lanzamiento>(this.API_URL, lanzamiento).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza un lanzamiento existente
   */
  actualizar(id: number, lanzamiento: LanzamientoDTO): Observable<Lanzamiento> {
    return this.http.put<Lanzamiento>(`${this.API_URL}/${id}`, lanzamiento).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina un lanzamiento
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

