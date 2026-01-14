import { Component, OnInit, OnDestroy } from '@angular/core';
import { Notificacion } from '../../interfaces/notificacion.interface';
import { NotificacionService } from '../../services/notificacion.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';

@Component({
  selector: 'app-listar-notificaciones',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent
  ],
  templateUrl: './listar-notificaciones.component.html',
  styleUrl: './listar-notificaciones.component.css'
})
export class ListarNotificacionesComponent implements OnInit, OnDestroy {
  notificaciones: Notificacion[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  filtroTipo: string = '';
  filtroPrioridad: string = '';
  filtroAplicacion: number | null = null;
  aplicaciones: any[] = [];
  notificacionesTableConfig!: TableConfig;
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
    this.notificacionesTableConfig = this.buildNotificacionesTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.notificacionesTableConfig = { ...this.notificacionesTableConfig, loading };
      }
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
        this.messageService.error('Error al cargar aplicaciones', 'Error', 5000);
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
        this.messageService.error(errorMessage, 'Error', 5000);
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

    this.notificacionesTableConfig = this.buildNotificacionesTableConfig(filtradas);
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

  private buildNotificacionesTableConfig(data: Notificacion[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} notificaciones',
      emptyMessage: 'No se encontraron notificaciones',
      globalSearchPlaceholder: 'Buscar por título, mensaje o aplicación...',
      columns: [
        {
          field: 'idNotificacion',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'titulo',
          header: 'Título',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '200px',
          mobileVisible: true,
        },
        {
          field: 'tipoText',
          header: 'Tipo',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Info', value: 'Info' },
            { label: 'Advertencia', value: 'Advertencia' },
            { label: 'Error', value: 'Error' },
            { label: 'Éxito', value: 'Éxito' },
            { label: 'Crítica', value: 'Crítica' },
          ],
          width: '120px',
          mobileVisible: true,
        },
        {
          field: 'prioridadText',
          header: 'Prioridad',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Baja', value: 'Baja' },
            { label: 'Normal', value: 'Normal' },
            { label: 'Alta', value: 'Alta' },
            { label: 'Urgente', value: 'Urgente' },
          ],
          width: '120px',
          mobileVisible: false,
        },
        {
          field: 'nombreAplicacion',
          header: 'Aplicación',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'creadorNombre',
          header: 'Creador',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'estadoText',
          header: 'Estado',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Activa', value: 'Activa' },
            { label: 'Inactiva', value: 'Inactiva' },
            { label: 'Expirada', value: 'Expirada' },
            { label: 'Programada', value: 'Programada' },
          ],
          width: '120px',
          mobileVisible: true,
        },
        {
          field: 'destinatariosText',
          header: 'Destinatarios',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          width: '150px',
          mobileVisible: false,
        },
        {
          field: 'fechaCreacion',
          header: 'Fecha Creación',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => this.formatearFecha(value),
        },
      ],
      globalFilterFields: ['titulo', 'mensaje', 'nombreAplicacion', 'tipoText', 'prioridadText', 'estadoText'],
      data: data.map(n => ({
        ...n,
        titulo: n.titulo + (n.mensaje ? ` - ${n.mensaje.length > 50 ? n.mensaje.substring(0, 50) + '...' : n.mensaje}` : ''),
        tipoText: this.getLabelTipo(n.tipoNotificacion),
        prioridadText: this.getLabelPrioridad(n.prioridad),
        estadoText: this.getEstadoCompleto(n),
        destinatariosText: this.getDestinatariosText(n),
      })),
    };
  }

  private getEstadoCompleto(notificacion: Notificacion): string {
    if (this.estaExpirada(notificacion)) {
      return 'Expirada';
    }
    if (this.estaProgramada(notificacion)) {
      return 'Programada';
    }
    return notificacion.activo ? 'Activa' : 'Inactiva';
  }

  private getDestinatariosText(notificacion: Notificacion): string {
    const total = notificacion.totalDestinatarios || 0;
    const leidas = notificacion.totalLeidas || 0;
    const confirmadas = notificacion.totalConfirmadas || 0;
    let text = `${total} total, ${leidas} leídas`;
    if (confirmadas > 0) {
      text += `, ${confirmadas} confirmadas`;
    }
    return text;
  }
}

