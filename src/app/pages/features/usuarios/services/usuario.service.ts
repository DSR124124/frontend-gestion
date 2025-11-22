import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Usuario, UsuarioDTO } from '../interfaces/usuario.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly API_URL = `${environment.urlAuth}api/usuarios`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todos los usuarios
   */
  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene un usuario por su ID
   */
  obtenerPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Crea un nuevo usuario
   */
  crear(usuario: UsuarioDTO): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, usuario).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Actualiza un usuario existente
   */
  actualizar(id: number, usuario: UsuarioDTO): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.API_URL}/${id}`, usuario).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Elimina un usuario
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

