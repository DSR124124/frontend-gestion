import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { GrupoDespliegue, GrupoDespliegueDTO } from '../interfaces/grupo-despliegue.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class GrupoDespliegueService {
  private readonly API_URL = `${environment.urlAuth}api/grupos-despliegue`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todos los grupos de despliegue
   */
  listar(): Observable<GrupoDespliegue[]> {
    return this.http.get<GrupoDespliegue[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene un grupo de despliegue por su ID
   */
  obtenerPorId(id: number): Observable<GrupoDespliegue> {
    return this.http.get<GrupoDespliegue>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea un nuevo grupo de despliegue
   */
  crear(grupoDespliegue: GrupoDespliegueDTO): Observable<GrupoDespliegue> {
    return this.http.post<GrupoDespliegue>(this.API_URL, grupoDespliegue).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza un grupo de despliegue existente
   */
  actualizar(id: number, grupoDespliegue: GrupoDespliegueDTO): Observable<GrupoDespliegue> {
    return this.http.put<GrupoDespliegue>(`${this.API_URL}/${id}`, grupoDespliegue).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina un grupo de despliegue
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

