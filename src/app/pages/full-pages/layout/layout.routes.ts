import { Routes } from '@angular/router';

export const layoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout-main/layout-main.component').then(m => m.LayoutMainComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../../features/dashboard/components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('../../features/usuarios/components/listar-usuarios/listar-usuarios.component').then(m => m.ListarUsuariosComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('../../features/roles/components/listar-roles/listar-roles.component').then(m => m.ListarRolesComponent)
      },
      {
        path: 'aplicaciones',
        loadComponent: () => import('../../features/aplicaciones/components/listar-aplicaciones/listar-aplicaciones.component').then(m => m.ListarAplicacionesComponent)
      },
      {
        path: 'lanzamientos',
        loadComponent: () => import('../../features/lanzamientos/components/listar-lanzamientos/listar-lanzamientos.component').then(m => m.ListarLanzamientosComponent)
      },
      {
        path: 'grupos-despliegue',
        loadComponent: () => import('../../features/grupos-despliegue/components/listar-grupos-despliegue/listar-grupos-despliegue.component').then(m => m.ListarGruposDespliegueComponent)
      },
      {
        path: 'usuarios-aplicaciones',
        loadComponent: () => import('../../features/usuarios-aplicaciones/components/listar-usuarios-aplicaciones/listar-usuarios-aplicaciones.component').then(m => m.ListarUsuariosAplicacionesComponent)
      },
      {
        path: 'usuarios-grupos',
        loadComponent: () => import('../../features/usuarios-grupos/components/listar-usuarios-grupos/listar-usuarios-grupos.component').then(m => m.ListarUsuariosGruposComponent)
      },
      {
        path: 'lanzamientos-grupos',
        loadComponent: () => import('../../features/lanzamientos-grupos/components/listar-lanzamientos-grupos/listar-lanzamientos-grupos.component').then(m => m.ListarLanzamientosGruposComponent)
      },
      {
        path: 'lanzamientos-disponibles',
        loadComponent: () => import('../../features/usuarios-lanzamientos-disponibles/components/listar-usuarios-lanzamientos-disponibles/listar-usuarios-lanzamientos-disponibles.component').then(m => m.ListarUsuariosLanzamientosDisponiblesComponent)
      }
    ]
  }
];

