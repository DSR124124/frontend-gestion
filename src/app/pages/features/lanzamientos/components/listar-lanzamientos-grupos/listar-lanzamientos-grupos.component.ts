import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { LanzamientoGrupo } from '../../interfaces/lanzamiento-grupo.interface';
import { LanzamientoGrupoService } from '../../services/lanzamiento-grupo.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearLanzamientoGrupoComponent } from '../crear-lanzamiento-grupo/crear-lanzamiento-grupo.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-lanzamientos-grupos',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearLanzamientoGrupoComponent
  ],
  templateUrl: './listar-lanzamientos-grupos.component.html',
  styleUrl: './listar-lanzamientos-grupos.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarLanzamientosGruposComponent implements OnInit, OnDestroy {
  lanzamientosGrupos: LanzamientoGrupo[] = [];
  lanzamientosGruposFiltrados: LanzamientoGrupo[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  private loadingSubscription?: Subscription;

  @ViewChild(CrearLanzamientoGrupoComponent) crearLanzamientoGrupoComponent?: CrearLanzamientoGrupoComponent;

  constructor(
    private lanzamientoGrupoService: LanzamientoGrupoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarLanzamientosGrupos();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarLanzamientosGrupos(): void {
    this.loadingService.show();
    this.lanzamientoGrupoService.listar().subscribe({
      next: (lanzamientosGrupos) => {
        this.lanzamientosGrupos = lanzamientosGrupos;
        this.lanzamientosGruposFiltrados = lanzamientosGrupos;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las asignaciones lanzamiento-grupo';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarLanzamientosGrupos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.lanzamientosGruposFiltrados = this.lanzamientosGrupos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.lanzamientosGruposFiltrados = this.lanzamientosGrupos.filter(asignacion =>
      (asignacion.lanzamientoVersion && asignacion.lanzamientoVersion.toLowerCase().includes(termino)) ||
      (asignacion.aplicacionNombre && asignacion.aplicacionNombre.toLowerCase().includes(termino)) ||
      (asignacion.grupoNombre && asignacion.grupoNombre.toLowerCase().includes(termino)) ||
      (asignacion.notas && asignacion.notas.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.lanzamientosGruposFiltrados = this.lanzamientosGrupos;
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
    if (this.crearLanzamientoGrupoComponent) {
      this.crearLanzamientoGrupoComponent.showDialog();
    }
  }

  onLanzamientoGrupoCreado(): void {
    this.cargarLanzamientosGrupos();
  }

  onLanzamientoGrupoActualizado(): void {
    this.cargarLanzamientosGrupos();
  }

  editarLanzamientoGrupo(lanzamientoGrupo: LanzamientoGrupo): void {
    if (this.crearLanzamientoGrupoComponent) {
      this.crearLanzamientoGrupoComponent.showDialog(lanzamientoGrupo);
    }
  }

  confirmarEliminar(lanzamientoGrupo: LanzamientoGrupo): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la asignación del lanzamiento "${lanzamientoGrupo.lanzamientoVersion}" al grupo "${lanzamientoGrupo.grupoNombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarLanzamientoGrupo(lanzamientoGrupo.idLanzamientoGrupo);
      }
    });
  }

  eliminarLanzamientoGrupo(id: number): void {
    this.loadingService.show();
    this.lanzamientoGrupoService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignación lanzamiento-grupo eliminada correctamente',
          life: 5000
        });
        this.cargarLanzamientosGrupos();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la asignación lanzamiento-grupo';
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

