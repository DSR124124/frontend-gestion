import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ExternalSystem, ExternalSystemConfig } from '../interfaces/external-system.interface';
import { AuthService } from '../../pages/full-pages/auth/services/auth.service';
import { environment } from '../../../environment/environment';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class ExternalSystemService {
  private systems: ExternalSystem[] = [];
  private systemsSubject = new BehaviorSubject<ExternalSystem[]>([]);
  public systems$: Observable<ExternalSystem[]> = this.systemsSubject.asObservable();

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initializeSystems();
  }

  private initializeSystems(): void {
    const config: ExternalSystemConfig = {
      systems: [
        {
          id: 'seguridad',
          name: 'Gestión de Seguridad',
          description: 'Sistema de administración de seguridad y transporte',
          url: environment.externalSystems.seguridad.url,
          icon: 'pi pi-shield',
          requiresAuth: true,
          route: '/sistemas/seguridad',
          openInNewTab: false,
          iframeConfig: {
            allowFullscreen: true,
            sandbox: ['allow-same-origin', 'allow-scripts', 'allow-forms', 'allow-popups']
          }
        }
      ]
    };

    this.systems = config.systems;
    this.systemsSubject.next(this.systems);
  }

  getSystemById(id: string): ExternalSystem | undefined {
    return this.systems.find(system => system.id === id);
  }

  getAllSystems(): ExternalSystem[] {
    return this.systems.filter(system => this.canAccessSystem(system));
  }

  canAccessSystem(system: ExternalSystem): boolean {
    if (!system.requiresAuth) {
      return true;
    }

    if (!this.authService.isAuthenticated()) {
      return false;
    }

    if (system.allowedRoles && system.allowedRoles.length > 0) {
      const user = this.authService.getCurrentUser();
      if (!user || !user.nombreRol) {
        return false;
      }
      return system.allowedRoles.some(role =>
        user.nombreRol?.toLowerCase() === role.toLowerCase()
      );
    }

    return true;
  }

  getSystemUrlWithAuth(system: ExternalSystem): string {
    const token = this.authService.getToken();
    if (!token || !system.requiresAuth) {
      return system.url;
    }

    const separator = system.url.includes('?') ? '&' : '?';
    return `${system.url}${separator}token=${encodeURIComponent(token)}`;
  }

  openSystemInNewWindow(systemId: string): void {
    const system = this.getSystemById(systemId);
    if (!system) {
      this.messageService.error(
        `Sistema con ID "${systemId}" no encontrado`,
        'Error',
        5000
      );
      return;
    }

    if (!this.canAccessSystem(system)) {
      this.messageService.warn(
        'No tiene permisos para acceder a este sistema',
        'Acceso Denegado',
        5000
      );
      return;
    }

    const url = this.getSystemUrlWithAuth(system);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  registerSystem(system: ExternalSystem): void {
    const existingIndex = this.systems.findIndex(s => s.id === system.id);
    if (existingIndex >= 0) {
      this.systems[existingIndex] = system;
    } else {
      this.systems.push(system);
    }
    this.systemsSubject.next([...this.systems]);
  }

  unregisterSystem(id: string): void {
    this.systems = this.systems.filter(s => s.id !== id);
    this.systemsSubject.next([...this.systems]);
  }
}

