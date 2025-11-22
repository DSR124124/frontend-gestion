import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    OverlayPanelModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  userMenuItems: MenuItem[] = [
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      command: () => this.navigateToProfile()
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      command: () => this.navigateToSettings()
    },
    {
      separator: true
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  constructor(private router: Router) {}

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  navigateToProfile() {
    // Implementar navegación a perfil
    console.log('Navegar a perfil');
  }

  navigateToSettings() {
    // Implementar navegación a configuración
    console.log('Navegar a configuración');
  }

  logout() {
    // Implementar logout
    console.log('Cerrar sesión');
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login']);
  }
}

