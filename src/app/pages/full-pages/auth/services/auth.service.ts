import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginDTO, LoginResponseDTO, UserInfo } from '../interfaces/auth.interfaces';
import { environment } from '../../../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.urlAuth}api/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_info';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginDTO): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.API_URL}/login`, credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => {
        this.setToken(response.token);
        this.setUserInfo({
          idUsuario: response.idUsuario,
          username: response.username,
          email: response.email,
          nombreCompleto: response.nombreCompleto,
          idRol: response.idRol,
          nombreRol: response.nombreRol,
          fechaUltimoAcceso: response.fechaUltimoAcceso
        });
      })
    );
  }

  logout(): void {
    this.removeToken();
    this.removeUserInfo();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getUserInfo(): UserInfo | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  setUserInfo(user: UserInfo): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  removeUserInfo(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUserInfo();
    if (!user) return false;
    return user.nombreRol?.toLowerCase() === 'administrador';
  }

  getCurrentUser(): UserInfo | null {
    return this.getUserInfo();
  }
}

