import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { LanzamientoGrupo, LanzamientoGrupoDTO } from '../interfaces/lanzamiento-grupo.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class LanzamientoGrupoService {
  private readonly API_URL = `${environment.urlAuth}api/lanzamientos-grupos`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todas las asignaciones lanzamiento-grupo
   */
  listar(): Observable<LanzamientoGrupo[]> {
    return this.http.get<LanzamientoGrupo[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene una asignación lanzamiento-grupo por su ID
   */
  obtenerPorId(id: number): Observable<LanzamientoGrupo> {
    return this.http.get<LanzamientoGrupo>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea una nueva asignación lanzamiento-grupo
   */
  crear(lanzamientoGrupo: LanzamientoGrupoDTO): Observable<LanzamientoGrupo> {
    return this.http.post<LanzamientoGrupo>(this.API_URL, lanzamientoGrupo).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza una asignación lanzamiento-grupo existente
   */
  actualizar(id: number, lanzamientoGrupo: LanzamientoGrupoDTO): Observable<LanzamientoGrupo> {
    return this.http.put<LanzamientoGrupo>(`${this.API_URL}/${id}`, lanzamientoGrupo).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina una asignación lanzamiento-grupo
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

