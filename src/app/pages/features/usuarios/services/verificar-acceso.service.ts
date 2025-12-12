import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { VerificarAcceso, VerificarAccesoRequest } from '../interfaces/verificar-acceso.interface';
import { environment } from '../../../../../environment/environment';
import { HttpUtilsService } from '../../../../shared/services/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class VerificarAccesoService {
  private readonly API_URL = `${environment.urlAuth}api/verificar-acceso`;

  constructor(
    private http: HttpClient,
    private httpUtils: HttpUtilsService
  ) {}

  /**
   * Verifica si un usuario tiene acceso a un lanzamiento específico (GET)
   */
  verificarAcceso(idUsuario: number, idLanzamiento: number): Observable<VerificarAcceso> {
    return this.http.get<VerificarAcceso>(
      `${this.API_URL}/usuario/${idUsuario}/lanzamiento/${idLanzamiento}`
    ).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }

  /**
   * Verifica si un usuario tiene acceso a un lanzamiento específico (POST)
   */
  verificarAccesoPost(request: VerificarAccesoRequest): Observable<VerificarAcceso> {
    return this.http.post<VerificarAcceso>(this.API_URL, request).pipe(
      catchError(error => this.httpUtils.handleError(error))
    );
  }
}

