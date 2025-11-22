import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UsuarioGrupo } from '../../interfaces/usuario-grupo.interface';
import { UsuarioGrupoService } from '../../services/usuario-grupo.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearUsuarioGrupoComponent } from '../crear-usuario-grupo/crear-usuario-grupo.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-usuarios-grupos',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearUsuarioGrupoComponent
  ],
  templateUrl: './listar-usuarios-grupos.component.html',
  styleUrl: './listar-usuarios-grupos.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarUsuariosGruposComponent implements OnInit, OnDestroy {
  usuariosGrupos: UsuarioGrupo[] = [];
  usuariosGruposFiltrados: UsuarioGrupo[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  private loadingSubscription?: Subscription;

  @ViewChild(CrearUsuarioGrupoComponent) crearUsuarioGrupoComponent?: CrearUsuarioGrupoComponent;

  constructor(
    private usuarioGrupoService: UsuarioGrupoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarUsuariosGrupos();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarUsuariosGrupos(): void {
    this.loadingService.show();
    this.usuarioGrupoService.listar().subscribe({
      next: (usuariosGrupos) => {
        this.usuariosGrupos = usuariosGrupos;
        this.usuariosGruposFiltrados = usuariosGrupos;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las asignaciones usuario-grupo';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarUsuariosGrupos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.usuariosGruposFiltrados = this.usuariosGrupos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.usuariosGruposFiltrados = this.usuariosGrupos.filter(asignacion =>
      (asignacion.usuarioNombre && asignacion.usuarioNombre.toLowerCase().includes(termino)) ||
      (asignacion.usuarioEmail && asignacion.usuarioEmail.toLowerCase().includes(termino)) ||
      (asignacion.grupoNombre && asignacion.grupoNombre.toLowerCase().includes(termino)) ||
      (asignacion.notas && asignacion.notas.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.usuariosGruposFiltrados = this.usuariosGrupos;
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
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  abrirDialogoCrear(): void {
    if (this.crearUsuarioGrupoComponent) {
      this.crearUsuarioGrupoComponent.showDialog();
    }
  }

  onUsuarioGrupoCreado(): void {
    this.cargarUsuariosGrupos();
  }

  onUsuarioGrupoActualizado(): void {
    this.cargarUsuariosGrupos();
  }

  editarUsuarioGrupo(usuarioGrupo: UsuarioGrupo): void {
    if (this.crearUsuarioGrupoComponent) {
      this.crearUsuarioGrupoComponent.showDialog(usuarioGrupo);
    }
  }

  confirmarEliminar(usuarioGrupo: UsuarioGrupo): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la asignación de "${usuarioGrupo.usuarioNombre}" al grupo "${usuarioGrupo.grupoNombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarUsuarioGrupo(usuarioGrupo.idUsuarioGrupo);
      }
    });
  }

  eliminarUsuarioGrupo(id: number): void {
    this.loadingService.show();
    this.usuarioGrupoService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignación usuario-grupo eliminada correctamente',
          life: 5000
        });
        this.cargarUsuariosGrupos();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la asignación usuario-grupo';
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

