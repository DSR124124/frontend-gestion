import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LayoutConfig } from '../interfaces/layout-config.interface';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private configSubject = new BehaviorSubject<LayoutConfig>({
    sidebarVisible: true,
    sidebarCollapsed: false,
    headerVisible: true,
    footerVisible: true,
    breadcrumbVisible: true,
  });

  public config$: Observable<LayoutConfig> = this.configSubject.asObservable();

  /**
   * Obtiene la configuración actual del layout
   */
  getConfig(): LayoutConfig {
    return this.configSubject.value;
  }

  /**
   * Actualiza la configuración del layout
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    const currentConfig = this.configSubject.value;
    this.configSubject.next({ ...currentConfig, ...config });
  }

  /**
   * Alterna la visibilidad del sidebar
   */
  toggleSidebar(): void {
    const currentConfig = this.configSubject.value;
    this.updateConfig({ sidebarVisible: !currentConfig.sidebarVisible });
  }

  /**
   * Alterna el estado colapsado del sidebar
   */
  toggleSidebarCollapse(): void {
    const currentConfig = this.configSubject.value;
    this.updateConfig({ sidebarCollapsed: !currentConfig.sidebarCollapsed });
  }

  /**
   * Muestra el sidebar
   */
  showSidebar(): void {
    this.updateConfig({ sidebarVisible: true });
  }

  /**
   * Oculta el sidebar
   */
  hideSidebar(): void {
    this.updateConfig({ sidebarVisible: false });
  }
}

