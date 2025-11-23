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
    
    // Mapeo completo de rutas a breadcrumbs basado en el sidebar
    // Formato: [labelPadre, labelHijo, rutaPadre]
    const routeBreadcrumbs: { [key: string]: { parent: string; child: string; parentRoute: string } } = {
      '/dashboard': { parent: 'Inicio', child: 'Dashboard', parentRoute: '/dashboard' },
      '/lanzamientos-disponibles': { parent: 'Inicio', child: 'Ver Disponibles', parentRoute: '/dashboard' },
      '/roles': { parent: 'Roles', child: 'Listar Roles', parentRoute: '/roles' },
      '/usuarios': { parent: 'Usuarios', child: 'Listar Usuarios', parentRoute: '/usuarios' },
      '/grupos-despliegue': { parent: 'Grupos', child: 'Listar Grupos', parentRoute: '/grupos-despliegue' },
      '/usuarios-grupos': { parent: 'Grupos', child: 'Usuarios por Grupo', parentRoute: '/grupos-despliegue' },
      '/aplicaciones': { parent: 'Aplicaciones', child: 'Listar Aplicaciones', parentRoute: '/aplicaciones' },
      '/usuarios-aplicaciones': { parent: 'Aplicaciones', child: 'Usuario por Aplicación', parentRoute: '/aplicaciones' },
      '/lanzamientos': { parent: 'Lanzamientos', child: 'Listar Lanzamientos', parentRoute: '/lanzamientos' },
      '/lanzamientos-grupos': { parent: 'Lanzamientos', child: 'Listar Asignaciones', parentRoute: '/lanzamientos' }
    };

    // Si hay un mapeo específico para esta ruta, usarlo
    if (routeBreadcrumbs[currentUrl]) {
      const routeInfo = routeBreadcrumbs[currentUrl];
      
      // Agregar el nivel padre
      breadcrumbs.push({
        label: routeInfo.parent,
        routerLink: routeInfo.parentRoute
      });
      
      // Agregar el nivel hijo (página actual)
      breadcrumbs.push({
        label: routeInfo.child,
        routerLink: currentUrl
      });
    } else {
      // Fallback: construir breadcrumb desde los segmentos de URL
      const urlSegments = currentUrl.split('/').filter(segment => segment !== '');

      if (urlSegments.length === 0) {
        this.items = [];
        return;
      }

      let accumulatedPath = '';
      urlSegments.forEach((segment, index) => {
        accumulatedPath += '/' + segment;
        const label = this.formatLabel(segment);
        
        breadcrumbs.push({
          label: label,
          routerLink: accumulatedPath
        });
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

