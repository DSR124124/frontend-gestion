import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Rol, RolDTO } from '../interfaces/rol.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private readonly API_URL = `${environment.urlAuth}api/roles`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todos los roles
   */
  listar(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene un rol por su ID
   */
  obtenerPorId(id: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea un nuevo rol
   */
  crear(rol: RolDTO): Observable<Rol> {
    return this.http.post<Rol>(this.API_URL, rol).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza un rol existente
   */
  actualizar(id: number, rol: RolDTO): Observable<Rol> {
    return this.http.put<Rol>(`${this.API_URL}/${id}`, rol).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina un rol
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

