import { Component, Output, EventEmitter, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../../../auth/services/auth.service';
import { UserInfo } from '../../../auth/interfaces/auth.interfaces';
import { MessageService } from '../../../../../core/services/message.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { LayoutService } from '../../services/layout.service';
import { LayoutConfig } from '../../interfaces/layout-config.interface';
import { Subscription } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    AvatarModule,
    AvatarGroupModule,
    MenuModule,
    BreadcrumbComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('userMenu') userMenu!: Menu;

  config: LayoutConfig;
  currentUser?: UserInfo | null;
  userMenuItems: MenuItem[] = [];
  private configSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private layoutService: LayoutService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.config = this.layoutService.getConfig();
  }

  ngOnInit() {
    this.configSubscription = this.layoutService.config$.subscribe(config => {
      this.config = config;
    });
    this.buildUserMenu();
  }

  buildUserMenu() {
    this.userMenuItems = [
      {
        label: 'Mi Perfil',
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
        label: 'Salir',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  ngOnDestroy() {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }

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
    this.messageService.info('Sesión cerrada correctamente', 'Hasta luego');
    // Pequeño delay para que el usuario vea el mensaje antes de navegar
    setTimeout(() => {
      this.authService.logout();
    }, 500);
  }

  getUserInitials(): string {
    if (!this.currentUser) {
      return 'U';
    }
    const username = this.currentUser.username || '';
    if (username.length > 0) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  }


}

