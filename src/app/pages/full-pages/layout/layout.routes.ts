import { Routes } from '@angular/router';

export const layoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout-main/layout-main.component').then(m => m.LayoutMainComponent),
    children: [
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full'
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
      }
    ]
  }
];

