import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UsuarioAplicacion } from '../../interfaces/usuario-aplicacion.interface';
import { UsuarioAplicacionService } from '../../services/usuario-aplicacion.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearUsuarioAplicacionComponent } from '../crear-usuario-aplicacion/crear-usuario-aplicacion.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-usuarios-aplicaciones',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearUsuarioAplicacionComponent
  ],
  templateUrl: './listar-usuarios-aplicaciones.component.html',
  styleUrl: './listar-usuarios-aplicaciones.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarUsuariosAplicacionesComponent implements OnInit, OnDestroy {
  usuariosAplicaciones: UsuarioAplicacion[] = [];
  usuariosAplicacionesFiltrados: UsuarioAplicacion[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  private loadingSubscription?: Subscription;

  @ViewChild(CrearUsuarioAplicacionComponent) crearUsuarioAplicacionComponent?: CrearUsuarioAplicacionComponent;

  constructor(
    private usuarioAplicacionService: UsuarioAplicacionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarUsuariosAplicaciones();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarUsuariosAplicaciones(): void {
    this.loadingService.show();
    this.usuarioAplicacionService.listar().subscribe({
      next: (usuariosAplicaciones) => {
        this.usuariosAplicaciones = usuariosAplicaciones;
        this.usuariosAplicacionesFiltrados = usuariosAplicaciones;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las relaciones usuario-aplicación';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarUsuariosAplicaciones(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.usuariosAplicacionesFiltrados = this.usuariosAplicaciones;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.usuariosAplicacionesFiltrados = this.usuariosAplicaciones.filter(relacion =>
      (relacion.usuarioNombre && relacion.usuarioNombre.toLowerCase().includes(termino)) ||
      (relacion.usuarioEmail && relacion.usuarioEmail.toLowerCase().includes(termino)) ||
      (relacion.aplicacionNombre && relacion.aplicacionNombre.toLowerCase().includes(termino)) ||
      (relacion.notas && relacion.notas.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.usuariosAplicacionesFiltrados = this.usuariosAplicaciones;
  }

  getSeverity(licenciaActiva: boolean): string {
    return licenciaActiva ? 'success' : 'danger';
  }

  getEstadoLabel(licenciaActiva: boolean): string {
    return licenciaActiva ? 'Activa' : 'Inactiva';
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
    if (this.crearUsuarioAplicacionComponent) {
      this.crearUsuarioAplicacionComponent.showDialog();
    }
  }

  onUsuarioAplicacionCreado(): void {
    this.cargarUsuariosAplicaciones();
  }

  onUsuarioAplicacionActualizado(): void {
    this.cargarUsuariosAplicaciones();
  }

  editarUsuarioAplicacion(usuarioAplicacion: UsuarioAplicacion): void {
    if (this.crearUsuarioAplicacionComponent) {
      this.crearUsuarioAplicacionComponent.showDialog(usuarioAplicacion);
    }
  }

  confirmarEliminar(usuarioAplicacion: UsuarioAplicacion): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la relación entre "${usuarioAplicacion.usuarioNombre}" y "${usuarioAplicacion.aplicacionNombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarUsuarioAplicacion(usuarioAplicacion.idUsuarioAplicacion);
      }
    });
  }

  eliminarUsuarioAplicacion(id: number): void {
    this.loadingService.show();
    this.usuarioAplicacionService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Relación usuario-aplicación eliminada correctamente',
          life: 5000
        });
        this.cargarUsuariosAplicaciones();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la relación usuario-aplicación';
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

