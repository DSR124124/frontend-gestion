import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { UsuarioAplicacion, UsuarioAplicacionDTO } from '../../aplicaciones/interfaces/usuario-aplicacion.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioAplicacionService {
  private readonly API_URL = `${environment.urlAuth}api/usuarios-aplicaciones`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todas las relaciones usuario-aplicación
   */
  listar(): Observable<UsuarioAplicacion[]> {
    return this.http.get<UsuarioAplicacion[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene una relación usuario-aplicación por su ID
   */
  obtenerPorId(id: number): Observable<UsuarioAplicacion> {
    return this.http.get<UsuarioAplicacion>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea una nueva relación usuario-aplicación
   */
  crear(usuarioAplicacion: UsuarioAplicacionDTO): Observable<UsuarioAplicacion> {
    return this.http.post<UsuarioAplicacion>(this.API_URL, usuarioAplicacion).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza una relación usuario-aplicación existente
   */
  actualizar(id: number, usuarioAplicacion: UsuarioAplicacionDTO): Observable<UsuarioAplicacion> {
    return this.http.put<UsuarioAplicacion>(`${this.API_URL}/${id}`, usuarioAplicacion).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina una relación usuario-aplicación
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

