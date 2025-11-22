import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { UsuarioGrupo, UsuarioGrupoDTO } from '../interfaces/usuario-grupo.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioGrupoService {
  private readonly API_URL = `${environment.urlAuth}api/usuarios-grupos`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todas las asignaciones usuario-grupo
   */
  listar(): Observable<UsuarioGrupo[]> {
    return this.http.get<UsuarioGrupo[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene una asignación usuario-grupo por su ID
   */
  obtenerPorId(id: number): Observable<UsuarioGrupo> {
    return this.http.get<UsuarioGrupo>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea una nueva asignación usuario-grupo
   */
  crear(usuarioGrupo: UsuarioGrupoDTO): Observable<UsuarioGrupo> {
    return this.http.post<UsuarioGrupo>(this.API_URL, usuarioGrupo).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza una asignación usuario-grupo existente
   */
  actualizar(id: number, usuarioGrupo: UsuarioGrupoDTO): Observable<UsuarioGrupo> {
    return this.http.put<UsuarioGrupo>(`${this.API_URL}/${id}`, usuarioGrupo).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina una asignación usuario-grupo
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

