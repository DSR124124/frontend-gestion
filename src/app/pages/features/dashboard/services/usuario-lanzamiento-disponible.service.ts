import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { UsuarioLanzamientoDisponible } from '../interfaces/usuario-lanzamiento-disponible.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioLanzamientoDisponibleService {
  private readonly API_URL = `${environment.urlAuth}api/usuarios-lanzamientos-disponibles`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Obtiene la lista de todos los lanzamientos disponibles para todos los usuarios
   */
  listarTodos(): Observable<UsuarioLanzamientoDisponible[]> {
    return this.http.get<UsuarioLanzamientoDisponible[]>(this.API_URL).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene los lanzamientos disponibles para un usuario específico
   */
  listarPorUsuario(idUsuario: number): Observable<UsuarioLanzamientoDisponible[]> {
    return this.http.get<UsuarioLanzamientoDisponible[]>(`${this.API_URL}/usuario/${idUsuario}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene los lanzamientos disponibles para una aplicación específica
   */
  listarPorAplicacion(idAplicacion: number): Observable<UsuarioLanzamientoDisponible[]> {
    return this.http.get<UsuarioLanzamientoDisponible[]>(`${this.API_URL}/aplicacion/${idAplicacion}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Obtiene los lanzamientos disponibles para un grupo específico
   */
  listarPorGrupo(idGrupo: number): Observable<UsuarioLanzamientoDisponible[]> {
    return this.http.get<UsuarioLanzamientoDisponible[]>(`${this.API_URL}/grupo/${idGrupo}`).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

