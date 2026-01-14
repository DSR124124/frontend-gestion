import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Lanzamiento } from '../../interfaces/lanzamiento.interface';
import { LanzamientoService } from '../../services/lanzamiento.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearLanzamientoComponent } from '../crear-lanzamiento/crear-lanzamiento.component';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-lanzamientos',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearLanzamientoComponent
  ],
  templateUrl: './listar-lanzamientos.component.html',
  styleUrl: './listar-lanzamientos.component.css',
  providers: [DialogService]
})
export class ListarLanzamientosComponent implements OnInit, OnDestroy {
  lanzamientos: Lanzamiento[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  lanzamientosTableConfig!: TableConfig;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearLanzamientoComponent) crearLanzamientoComponent?: CrearLanzamientoComponent;

  constructor(
    private lanzamientoService: LanzamientoService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.lanzamientosTableConfig = this.buildLanzamientosTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.lanzamientosTableConfig = { ...this.lanzamientosTableConfig, loading };
      }
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
        this.lanzamientosTableConfig = this.buildLanzamientosTableConfig(lanzamientos);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los lanzamientos';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  filtrarLanzamientos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.lanzamientosTableConfig = this.buildLanzamientosTableConfig(this.lanzamientos);
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const filtrados = this.lanzamientos.filter(lanzamiento =>
      lanzamiento.version.toLowerCase().includes(termino) ||
      (lanzamiento.nombreAplicacion && lanzamiento.nombreAplicacion.toLowerCase().includes(termino)) ||
      (lanzamiento.notasVersion && lanzamiento.notasVersion.toLowerCase().includes(termino)) ||
      (lanzamiento.estado && lanzamiento.estado.toLowerCase().includes(termino)) ||
      (lanzamiento.publicadoPorNombre && lanzamiento.publicadoPorNombre.toLowerCase().includes(termino))
    );
    this.lanzamientosTableConfig = this.buildLanzamientosTableConfig(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.lanzamientosTableConfig = this.buildLanzamientosTableConfig(this.lanzamientos);
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
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar el lanzamiento versión "<strong>${lanzamiento.version}</strong>" de "<strong>${lanzamiento.nombreAplicacion || 'aplicación'}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarLanzamiento(lanzamiento.idLanzamiento);
      }
    });
  }

  eliminarLanzamiento(id: number): void {
    this.loadingService.show();
    this.lanzamientoService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Lanzamiento eliminado correctamente', 'Éxito', 5000);
        this.cargarLanzamientos();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el lanzamiento';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private buildLanzamientosTableConfig(data: Lanzamiento[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} lanzamientos',
      emptyMessage: 'No se encontraron lanzamientos',
      globalSearchPlaceholder: 'Buscar por versión, aplicación, estado, notas o publicador...',
      columns: [
        {
          field: 'idLanzamiento',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'nombreAplicacion',
          header: 'Aplicación',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: true,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'version',
          header: 'Versión',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          width: '120px',
          mobileVisible: true,
        },
        {
          field: 'estadoText',
          header: 'Estado',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Activo', value: 'Activo' },
            { label: 'Borrador', value: 'Borrador' },
            { label: 'Deprecado', value: 'Deprecado' },
            { label: 'Retirado', value: 'Retirado' },
          ],
          width: '120px',
          mobileVisible: true,
        },
        {
          field: 'fechaLanzamiento',
          header: 'Fecha Lanzamiento',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => this.formatearFecha(value),
        },
        {
          field: 'fechaPublicacion',
          header: 'Fecha Publicación',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => this.formatearFecha(value),
        },
        {
          field: 'notasVersion',
          header: 'Notas',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '200px',
          mobileVisible: false,
          getLabel: (value: any) => {
            if (!value) return '-';
            return value.length > 50 ? value.substring(0, 50) + '...' : value;
          },
        },
        {
          field: 'tamanoArchivoText',
          header: 'Tamaño',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          width: '100px',
          mobileVisible: false,
        },
        {
          field: 'criticoText',
          header: 'Crítico',
          type: ColumnType.TEXT,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Sí', value: 'Sí' },
            { label: 'No', value: '-' },
          ],
          width: '100px',
          align: 'center',
          mobileVisible: false,
        },
        {
          field: 'acciones',
          header: 'Acciones',
          type: ColumnType.TEXT,
          isAction: true,
          sortable: false,
          filterType: FilterType.NONE,
          width: '140px',
          align: 'center',
          mobileVisible: true,
        },
      ],
      rowActions: [
        {
          icon: 'pi pi-pencil',
          severity: 'success',
          tooltip: 'Editar lanzamiento',
          action: (row: Lanzamiento) => this.editarLanzamiento(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar lanzamiento',
          action: (row: Lanzamiento) => this.confirmarEliminar(row),
        },
      ],
      globalFilterFields: ['version', 'nombreAplicacion', 'estadoText', 'notasVersion', 'publicadoPorNombre'],
      data: data.map(l => ({
        ...l,
        estadoText: this.getEstadoLabel(l.estado),
        tamanoArchivoText: this.formatearTamano(l.tamanoArchivo),
        criticoText: l.esCritico ? 'Sí' : '-',
      })),
    };
  }
}

