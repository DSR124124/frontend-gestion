import { Component, OnInit, OnDestroy } from '@angular/core';
import { Notificacion } from '../../interfaces/notificacion.interface';
import { NotificacionService } from '../../services/notificacion.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-notificaciones',
  standalone: true,
  imports: [
    ...PrimeNGModules
  ],
  templateUrl: './listar-notificaciones.component.html',
  styleUrl: './listar-notificaciones.component.css',
  providers: [MessageService]
})
export class ListarNotificacionesComponent implements OnInit, OnDestroy {
  notificaciones: Notificacion[] = [];
  notificacionesFiltradas: Notificacion[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  filtroTipo: string = '';
  filtroPrioridad: string = '';
  filtroAplicacion: number | null = null;
  aplicaciones: any[] = [];
  private loadingSubscription?: Subscription;

  tiposNotificacion = [
    { label: 'Todas', value: '' },
    { label: 'Info', value: 'info' },
    { label: 'Warning', value: 'warning' },
    { label: 'Error', value: 'error' },
    { label: 'Success', value: 'success' },
    { label: 'Critical', value: 'critical' }
  ];

  prioridades = [
    { label: 'Todas', value: '' },
    { label: 'Baja', value: 'baja' },
    { label: 'Normal', value: 'normal' },
    { label: 'Alta', value: 'alta' },
    { label: 'Urgente', value: 'urgente' }
  ];

  constructor(
    private notificacionService: NotificacionService,
    private aplicacionService: AplicacionService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarAplicaciones();
    this.cargarNotificaciones();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarAplicaciones(): void {
    this.aplicacionService.listar().subscribe({
      next: (aplicaciones) => {
        this.aplicaciones = aplicaciones.map(app => ({
          label: app.nombreAplicacion,
          value: app.idAplicacion
        }));
      },
      error: (error) => {
        console.error('Error al cargar aplicaciones:', error);
      }
    });
  }

  cargarNotificaciones(): void {
    this.loadingService.show();
    this.notificacionService.listar().subscribe({
      next: (notificaciones) => {
        this.notificaciones = notificaciones;
        this.aplicarFiltros();
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las notificaciones';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.notificaciones];

    // Filtro por búsqueda
    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(notif =>
        notif.titulo.toLowerCase().includes(termino) ||
        notif.mensaje.toLowerCase().includes(termino) ||
        (notif.nombreAplicacion && notif.nombreAplicacion.toLowerCase().includes(termino))
      );
    }

    // Filtro por tipo
    if (this.filtroTipo) {
      filtradas = filtradas.filter(notif => notif.tipoNotificacion === this.filtroTipo);
    }

    // Filtro por prioridad
    if (this.filtroPrioridad) {
      filtradas = filtradas.filter(notif => notif.prioridad === this.filtroPrioridad);
    }

    // Filtro por aplicación
    if (this.filtroAplicacion) {
      filtradas = filtradas.filter(notif => notif.idAplicacion === this.filtroAplicacion);
    }

    this.notificacionesFiltradas = filtradas;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroTipo = '';
    this.filtroPrioridad = '';
    this.filtroAplicacion = null;
    this.aplicarFiltros();
  }

  getSeverityTipo(tipo: string): string {
    const severities: { [key: string]: string } = {
      'info': 'info',
      'warning': 'warn',
      'error': 'danger',
      'success': 'success',
      'critical': 'danger'
    };
    return severities[tipo] || 'info';
  }

  getSeverityPrioridad(prioridad: string): string {
    const severities: { [key: string]: string } = {
      'baja': 'secondary',
      'normal': 'info',
      'alta': 'warn',
      'urgente': 'danger'
    };
    return severities[prioridad] || 'info';
  }

  getLabelTipo(tipo: string): string {
    const labels: { [key: string]: string } = {
      'info': 'Info',
      'warning': 'Advertencia',
      'error': 'Error',
      'success': 'Éxito',
      'critical': 'Crítica'
    };
    return labels[tipo] || tipo;
  }

  getLabelPrioridad(prioridad: string): string {
    const labels: { [key: string]: string } = {
      'baja': 'Baja',
      'normal': 'Normal',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[prioridad] || prioridad;
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
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }


  estaExpirada(notificacion: Notificacion): boolean {
    if (!notificacion.fechaExpiracion) return false;
    return new Date(notificacion.fechaExpiracion) < new Date();
  }

  estaProgramada(notificacion: Notificacion): boolean {
    if (!notificacion.fechaEnvio) return false;
    return new Date(notificacion.fechaEnvio) > new Date();
  }
}

