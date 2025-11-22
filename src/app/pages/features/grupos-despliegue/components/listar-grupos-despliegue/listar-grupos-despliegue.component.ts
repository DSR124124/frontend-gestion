import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { GrupoDespliegue } from '../../interfaces/grupo-despliegue.interface';
import { GrupoDespliegueService } from '../../services/grupo-despliegue.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearGrupoDespliegueComponent } from '../crear-grupo-despliegue/crear-grupo-despliegue.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-grupos-despliegue',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearGrupoDespliegueComponent
  ],
  templateUrl: './listar-grupos-despliegue.component.html',
  styleUrl: './listar-grupos-despliegue.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarGruposDespliegueComponent implements OnInit, OnDestroy {
  gruposDespliegue: GrupoDespliegue[] = [];
  gruposDespliegueFiltrados: GrupoDespliegue[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  private loadingSubscription?: Subscription;

  @ViewChild(CrearGrupoDespliegueComponent) crearGrupoDespliegueComponent?: CrearGrupoDespliegueComponent;

  constructor(
    private grupoDespliegueService: GrupoDespliegueService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarGruposDespliegue();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarGruposDespliegue(): void {
    this.loadingService.show();
    this.grupoDespliegueService.listar().subscribe({
      next: (gruposDespliegue) => {
        this.gruposDespliegue = gruposDespliegue;
        this.gruposDespliegueFiltrados = gruposDespliegue;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los grupos de despliegue';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarGruposDespliegue(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.gruposDespliegueFiltrados = this.gruposDespliegue;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.gruposDespliegueFiltrados = this.gruposDespliegue.filter(grupo =>
      grupo.nombreGrupo.toLowerCase().includes(termino) ||
      (grupo.descripcion && grupo.descripcion.toLowerCase().includes(termino)) ||
      (grupo.ordenPrioridad && grupo.ordenPrioridad.toString().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.gruposDespliegueFiltrados = this.gruposDespliegue;
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
    if (this.crearGrupoDespliegueComponent) {
      this.crearGrupoDespliegueComponent.showDialog();
    }
  }

  onGrupoDespliegueCreado(): void {
    this.cargarGruposDespliegue();
  }

  onGrupoDespliegueActualizado(): void {
    this.cargarGruposDespliegue();
  }

  editarGrupoDespliegue(grupoDespliegue: GrupoDespliegue): void {
    if (this.crearGrupoDespliegueComponent) {
      this.crearGrupoDespliegueComponent.showDialog(grupoDespliegue);
    }
  }

  confirmarEliminar(grupoDespliegue: GrupoDespliegue): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el grupo de despliegue "${grupoDespliegue.nombreGrupo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarGrupoDespliegue(grupoDespliegue.idGrupo);
      }
    });
  }

  eliminarGrupoDespliegue(id: number): void {
    this.loadingService.show();
    this.grupoDespliegueService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Grupo de despliegue eliminado correctamente',
          life: 5000
        });
        this.cargarGruposDespliegue();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el grupo de despliegue';
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

