import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { LanzamientoGrupo } from '../../interfaces/lanzamiento-grupo.interface';
import { LanzamientoGrupoService } from '../../services/lanzamiento-grupo.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearLanzamientoGrupoComponent } from '../crear-lanzamiento-grupo/crear-lanzamiento-grupo.component';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-lanzamientos-grupos',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearLanzamientoGrupoComponent
  ],
  templateUrl: './listar-lanzamientos-grupos.component.html',
  styleUrl: './listar-lanzamientos-grupos.component.css',
  providers: [DialogService]
})
export class ListarLanzamientosGruposComponent implements OnInit, OnDestroy {
  lanzamientosGrupos: LanzamientoGrupo[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  lanzamientosGruposTableConfig!: TableConfig;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearLanzamientoGrupoComponent) crearLanzamientoGrupoComponent?: CrearLanzamientoGrupoComponent;

  constructor(
    private lanzamientoGrupoService: LanzamientoGrupoService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.lanzamientosGruposTableConfig = this.buildLanzamientosGruposTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.lanzamientosGruposTableConfig = { ...this.lanzamientosGruposTableConfig, loading };
      }
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
        this.lanzamientosGruposTableConfig = this.buildLanzamientosGruposTableConfig(lanzamientosGrupos);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las asignaciones lanzamiento-grupo';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  filtrarLanzamientosGrupos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.lanzamientosGruposTableConfig = this.buildLanzamientosGruposTableConfig(this.lanzamientosGrupos);
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const filtrados = this.lanzamientosGrupos.filter(asignacion =>
      (asignacion.lanzamientoVersion && asignacion.lanzamientoVersion.toLowerCase().includes(termino)) ||
      (asignacion.aplicacionNombre && asignacion.aplicacionNombre.toLowerCase().includes(termino)) ||
      (asignacion.grupoNombre && asignacion.grupoNombre.toLowerCase().includes(termino)) ||
      (asignacion.notas && asignacion.notas.toLowerCase().includes(termino))
    );
    this.lanzamientosGruposTableConfig = this.buildLanzamientosGruposTableConfig(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.lanzamientosGruposTableConfig = this.buildLanzamientosGruposTableConfig(this.lanzamientosGrupos);
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
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar la asignación del lanzamiento "<strong>${lanzamientoGrupo.lanzamientoVersion || 'versión'}</strong>" al grupo "<strong>${lanzamientoGrupo.grupoNombre || 'grupo'}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarLanzamientoGrupo(lanzamientoGrupo.idLanzamientoGrupo);
      }
    });
  }

  eliminarLanzamientoGrupo(id: number): void {
    this.loadingService.show();
    this.lanzamientoGrupoService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Asignación lanzamiento-grupo eliminada correctamente', 'Éxito', 5000);
        this.cargarLanzamientosGrupos();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la asignación lanzamiento-grupo';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private buildLanzamientosGruposTableConfig(data: LanzamientoGrupo[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} asignaciones',
      emptyMessage: 'No se encontraron asignaciones lanzamiento-grupo',
      globalSearchPlaceholder: 'Buscar por versión, aplicación, grupo o notas...',
      columns: [
        {
          field: 'idLanzamientoGrupo',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'lanzamientoVersion',
          header: 'Lanzamiento',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: true,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'aplicacionNombre',
          header: 'Aplicación',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: true,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'grupoNombre',
          header: 'Grupo',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: true,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'ordenPrioridad',
          header: 'Orden',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          align: 'center',
          width: '100px',
          mobileVisible: false,
          getLabel: (value: any) => value !== null && value !== undefined ? value.toString() : '-',
        },
        {
          field: 'estadoText',
          header: 'Estado',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Activo', value: 'Activo' },
            { label: 'Inactivo', value: 'Inactivo' },
          ],
          width: '120px',
          mobileVisible: true,
        },
        {
          field: 'fechaDisponibilidad',
          header: 'Fecha Disponibilidad',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => this.formatearFecha(value),
        },
        {
          field: 'notificacionText',
          header: 'Notificación',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Enviada', value: 'Enviada' },
            { label: 'Pendiente', value: 'Pendiente' },
          ],
          width: '130px',
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
          tooltip: 'Editar asignación',
          action: (row: LanzamientoGrupo) => this.editarLanzamientoGrupo(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar asignación',
          action: (row: LanzamientoGrupo) => this.confirmarEliminar(row),
        },
      ],
      globalFilterFields: ['lanzamientoVersion', 'aplicacionNombre', 'grupoNombre', 'notas', 'estadoText', 'notificacionText'],
      data: data.map(lg => ({
        ...lg,
        estadoText: this.getEstadoLabel(lg.activo),
        notificacionText: lg.notificacionEnviada ? 'Enviada' : 'Pendiente',
      })),
    };
  }
}

