import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../../auth/services/auth.service';
import { UserInfo } from '../../../auth/interfaces/auth.interfaces';
import { MessageService } from '../../../../../core/services/message.service';

type UserMenuAction = 'profile' | 'settings' | 'logout';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    AvatarModule,
    SelectModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser?: UserInfo | null;
  userMenuItems = [
    { label: 'Mi Perfil', value: 'profile' as UserMenuAction },
    { label: 'Configuración', value: 'settings' as UserMenuAction },
    { label: 'Salir', value: 'logout' as UserMenuAction }
  ];
  selectedUserMenuItem: UserMenuAction | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onUserMenuSelection(action: UserMenuAction | null) {
    if (!action) {
      return;
    }

    switch (action) {
      case 'profile':
        this.navigateToProfile();
        break;
      case 'settings':
        this.navigateToSettings();
        break;
      case 'logout':
        this.logout();
        break;
    }

    // reset select so placeholder shows again
    setTimeout(() => (this.selectedUserMenuItem = null));
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
    this.authService.logout();
    this.messageService.info('Sesión cerrada correctamente', 'Hasta luego');
  }
}

