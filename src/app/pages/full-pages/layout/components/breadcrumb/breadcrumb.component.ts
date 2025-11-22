import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbModule,
    RouterModule
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css'
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  items: MenuItem[] = [];
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    // Construir breadcrumb inicial
    this.buildBreadcrumb();

    // Suscribirse a cambios de navegación
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.buildBreadcrumb();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildBreadcrumb() {
    const breadcrumbs: MenuItem[] = [];
    const currentUrl = this.router.url;
    
    // Remover la barra inicial y dividir en segmentos
    const urlSegments = currentUrl.split('/').filter(segment => segment !== '');

    // Si no hay segmentos, solo mostrar "Inicio"
    if (urlSegments.length === 0) {
      this.items = [];
      return;
    }

    // Construir breadcrumb acumulando segmentos
    let accumulatedPath = '';
    urlSegments.forEach((segment, index) => {
      accumulatedPath += '/' + segment;
      const label = this.formatLabel(segment);
      
      breadcrumbs.push({
        label: label,
        routerLink: accumulatedPath
      });
    });

    // Agregar nivel adicional basado en la ruta actual y el componente
    // Mapeo de rutas a sus acciones/páginas específicas
    const routeActions: { [key: string]: string } = {
      '/usuarios': 'Lista de Usuarios',
      '/roles': 'Lista de Roles',
      '/usuarios/crear': 'Crear Usuario',
      '/usuarios/editar': 'Editar Usuario',
      '/roles/crear': 'Crear Rol',
      '/roles/editar': 'Editar Rol'
    };

    // Si hay una acción definida para esta ruta, agregarla como último nivel
    if (routeActions[currentUrl]) {
      breadcrumbs.push({
        label: routeActions[currentUrl],
        routerLink: currentUrl
      });
    }

    this.items = breadcrumbs;
  }

  private formatLabel(path: string): string {
    // Mapeo de rutas comunes a labels más amigables
    const routeLabels: { [key: string]: string } = {
      'usuarios': 'Usuarios',
      'roles': 'Roles',
      'listar-usuarios': 'Listar Usuarios',
      'listar-roles': 'Listar Roles',
      'crear-usuario': 'Crear Usuario',
      'editar-usuario': 'Editar Usuario',
      'crear-rol': 'Crear Rol',
      'editar-rol': 'Editar Rol'
    };

    if (routeLabels[path]) {
      return routeLabels[path];
    }

    // Si no hay mapeo, formatear el path
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

