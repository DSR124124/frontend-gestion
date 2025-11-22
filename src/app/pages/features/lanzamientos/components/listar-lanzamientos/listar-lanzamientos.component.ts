import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Lanzamiento } from '../../interfaces/lanzamiento.interface';
import { LanzamientoService } from '../../services/lanzamiento.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearLanzamientoComponent } from '../crear-lanzamiento/crear-lanzamiento.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-lanzamientos',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearLanzamientoComponent
  ],
  templateUrl: './listar-lanzamientos.component.html',
  styleUrl: './listar-lanzamientos.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarLanzamientosComponent implements OnInit, OnDestroy {
  lanzamientos: Lanzamiento[] = [];
  lanzamientosFiltrados: Lanzamiento[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  private loadingSubscription?: Subscription;

  @ViewChild(CrearLanzamientoComponent) crearLanzamientoComponent?: CrearLanzamientoComponent;

  constructor(
    private lanzamientoService: LanzamientoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de loading del servicio
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarLanzamientos();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarLanzamientos(): void {
    this.loadingService.show();
    this.lanzamientoService.listar().subscribe({
      next: (lanzamientos) => {
        this.lanzamientos = lanzamientos;
        this.lanzamientosFiltrados = lanzamientos;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los lanzamientos';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarLanzamientos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.lanzamientosFiltrados = this.lanzamientos;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.lanzamientosFiltrados = this.lanzamientos.filter(lanzamiento =>
      lanzamiento.version.toLowerCase().includes(termino) ||
      (lanzamiento.nombreAplicacion && lanzamiento.nombreAplicacion.toLowerCase().includes(termino)) ||
      (lanzamiento.notasVersion && lanzamiento.notasVersion.toLowerCase().includes(termino)) ||
      (lanzamiento.estado && lanzamiento.estado.toLowerCase().includes(termino)) ||
      (lanzamiento.publicadoPorNombre && lanzamiento.publicadoPorNombre.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.lanzamientosFiltrados = this.lanzamientos;
  }

  getSeverityEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'success';
      case 'borrador':
        return 'warning';
      case 'deprecado':
        return 'info';
      case 'retirado':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getEstadoLabel(estado: string): string {
    if (!estado) return '-';
    return estado.charAt(0).toUpperCase() + estado.slice(1);
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

  formatearTamano(tamano: number | null): string {
    if (!tamano) return '-';
    const unidades = ['B', 'KB', 'MB', 'GB'];
    let tamanoFormateado = tamano;
    let unidadIndex = 0;
    
    while (tamanoFormateado >= 1024 && unidadIndex < unidades.length - 1) {
      tamanoFormateado /= 1024;
      unidadIndex++;
    }
    
    return `${tamanoFormateado.toFixed(2)} ${unidades[unidadIndex]}`;
  }

  abrirDialogoCrear(): void {
    if (this.crearLanzamientoComponent) {
      this.crearLanzamientoComponent.showDialog();
    }
  }

  onLanzamientoCreado(): void {
    this.cargarLanzamientos();
  }

  onLanzamientoActualizado(): void {
    this.cargarLanzamientos();
  }

  editarLanzamiento(lanzamiento: Lanzamiento): void {
    if (this.crearLanzamientoComponent) {
      this.crearLanzamientoComponent.showDialog(lanzamiento);
    }
  }

  confirmarEliminar(lanzamiento: Lanzamiento): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el lanzamiento versión "${lanzamiento.version}" de "${lanzamiento.nombreAplicacion}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarLanzamiento(lanzamiento.idLanzamiento);
      }
    });
  }

  eliminarLanzamiento(id: number): void {
    this.loadingService.show();
    this.lanzamientoService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Lanzamiento eliminado correctamente',
          life: 5000
        });
        this.cargarLanzamientos();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el lanzamiento';
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

