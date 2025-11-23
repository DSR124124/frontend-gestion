import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Aplicacion } from '../../interfaces/aplicacion.interface';
import { AplicacionService } from '../../services/aplicacion.service';
import { LanzamientoService } from '../../../lanzamientos/services/lanzamiento.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearAplicacionComponent } from '../crear-aplicacion/crear-aplicacion.component';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-listar-aplicaciones',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearAplicacionComponent
  ],
  templateUrl: './listar-aplicaciones.component.html',
  styleUrl: './listar-aplicaciones.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarAplicacionesComponent implements OnInit, OnDestroy {
  aplicaciones: Aplicacion[] = [];
  aplicacionesFiltradas: Aplicacion[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  conteoLanzamientos: Map<number, number> = new Map();
  private loadingSubscription?: Subscription;

  @ViewChild(CrearAplicacionComponent) crearAplicacionComponent?: CrearAplicacionComponent;

  constructor(
    private aplicacionService: AplicacionService,
    private lanzamientoService: LanzamientoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de loading del servicio
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarAplicaciones();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarAplicaciones(): void {
    this.loadingService.show();
    forkJoin({
      aplicaciones: this.aplicacionService.listar(),
      lanzamientos: this.lanzamientoService.listar()
    }).subscribe({
      next: ({ aplicaciones, lanzamientos }) => {
        this.aplicaciones = aplicaciones;
        this.aplicacionesFiltradas = aplicaciones;
        
        // Contar lanzamientos por aplicación
        this.conteoLanzamientos.clear();
        lanzamientos.forEach(lanzamiento => {
          const idAplicacion = lanzamiento.idAplicacion;
          const conteoActual = this.conteoLanzamientos.get(idAplicacion) || 0;
          this.conteoLanzamientos.set(idAplicacion, conteoActual + 1);
        });
        
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las aplicaciones';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarAplicaciones(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.aplicacionesFiltradas = this.aplicaciones;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.aplicacionesFiltradas = this.aplicaciones.filter(aplicacion =>
      aplicacion.nombreAplicacion.toLowerCase().includes(termino) ||
      (aplicacion.descripcion && aplicacion.descripcion.toLowerCase().includes(termino)) ||
      (aplicacion.codigoProducto && aplicacion.codigoProducto.toLowerCase().includes(termino)) ||
      (aplicacion.responsableNombre && aplicacion.responsableNombre.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.aplicacionesFiltradas = this.aplicaciones;
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
    if (this.crearAplicacionComponent) {
      this.crearAplicacionComponent.showDialog();
    }
  }

  onAplicacionCreada(): void {
    this.cargarAplicaciones();
  }

  onAplicacionActualizada(): void {
    this.cargarAplicaciones();
  }

  editarAplicacion(aplicacion: Aplicacion): void {
    if (this.crearAplicacionComponent) {
      this.crearAplicacionComponent.showDialog(aplicacion);
    }
  }

  confirmarEliminar(aplicacion: Aplicacion): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la aplicación "${aplicacion.nombreAplicacion}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarAplicacion(aplicacion.idAplicacion);
      }
    });
  }

  eliminarAplicacion(id: number): void {
    this.loadingService.show();
    this.aplicacionService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Aplicación eliminada correctamente',
          life: 5000
        });
        this.cargarAplicaciones();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la aplicación';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  obtenerConteoLanzamientos(idAplicacion: number): number {
    return this.conteoLanzamientos.get(idAplicacion) || 0;
  }

  verLanzamientos(aplicacion: Aplicacion): void {
    this.router.navigate(['/lanzamientos'], {
      queryParams: { aplicacion: aplicacion.idAplicacion }
    });
  }
}

