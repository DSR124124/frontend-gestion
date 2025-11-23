import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Usuario } from '../../interfaces/usuario.interface';
import { UsuarioService } from '../../services/usuario.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearUsuarioComponent } from '../crear-usuario/crear-usuario.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearUsuarioComponent
  ],
  templateUrl: './listar-usuarios.component.html',
  styleUrl: './listar-usuarios.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarUsuariosComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  private loadingSubscription?: Subscription;

  @ViewChild(CrearUsuarioComponent) crearUsuarioComponent?: CrearUsuarioComponent;

  constructor(
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de loading del servicio
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarUsuarios(): void {
    this.loadingService.show();
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = usuarios;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los usuarios';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarUsuarios(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.usuariosFiltrados = this.usuarios;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.username.toLowerCase().includes(termino) ||
      usuario.email.toLowerCase().includes(termino) ||
      (usuario.nombreCompleto && usuario.nombreCompleto.toLowerCase().includes(termino)) ||
      (usuario.nombreRol && usuario.nombreRol.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.usuariosFiltrados = this.usuarios;
  }

  getSeverity(activo: boolean): string {
    return activo ? 'success' : 'danger';
  }

  getEstadoLabel(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      const ahora = new Date();
      const diffMs = ahora.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'Hace un momento';
      } else if (diffMins < 60) {
        return `Hace ${diffMins} min`;
      } else if (diffHours < 24) {
        return `Hace ${diffHours} h`;
      } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
      } else {
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
    } catch {
      return fecha;
    }
  }

  formatearFechaCompleta(fecha: string | null): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  abrirDialogoCrear(): void {
    if (this.crearUsuarioComponent) {
      this.crearUsuarioComponent.showDialog();
    }
  }

  onUsuarioCreado(): void {
    this.cargarUsuarios();
  }

  onUsuarioActualizado(): void {
    this.cargarUsuarios();
  }

  editarUsuario(usuario: Usuario): void {
    if (this.crearUsuarioComponent) {
      this.crearUsuarioComponent.showDialog(usuario);
    }
  }

  confirmarEliminar(usuario: Usuario): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar al usuario "${usuario.username}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarUsuario(usuario.idUsuario);
      }
    });
  }

  eliminarUsuario(id: number): void {
    this.loadingService.show();
    this.usuarioService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario eliminado correctamente',
          life: 5000
        });
        this.cargarUsuarios();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el usuario';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }
}

