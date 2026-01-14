import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { GrupoDespliegue } from '../../interfaces/grupo-despliegue.interface';
import { GrupoDespliegueService } from '../../services/grupo-despliegue.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearGrupoDespliegueComponent } from '../crear-grupo-despliegue/crear-grupo-despliegue.component';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-grupos-despliegue',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearGrupoDespliegueComponent
  ],
  templateUrl: './listar-grupos-despliegue.component.html',
  styleUrl: './listar-grupos-despliegue.component.css',
  providers: [DialogService]
})
export class ListarGruposDespliegueComponent implements OnInit, OnDestroy {
  gruposDespliegue: GrupoDespliegue[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  gruposDespliegueTableConfig!: TableConfig;
  filtrosVisibles: boolean = false;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearGrupoDespliegueComponent) crearGrupoDespliegueComponent?: CrearGrupoDespliegueComponent;
  @ViewChild(DataTableComponent) dataTableComponent?: DataTableComponent;

  constructor(
    private grupoDespliegueService: GrupoDespliegueService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.gruposDespliegueTableConfig = this.buildGruposDespliegueTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.gruposDespliegueTableConfig = { ...this.gruposDespliegueTableConfig, loading };
      }
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
        this.gruposDespliegueTableConfig = this.buildGruposDespliegueTableConfig(gruposDespliegue);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los grupos de despliegue';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  filtrarGruposDespliegue(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.gruposDespliegueTableConfig = this.buildGruposDespliegueTableConfig(this.gruposDespliegue);
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const filtrados = this.gruposDespliegue.filter(grupo =>
      grupo.nombreGrupo.toLowerCase().includes(termino) ||
      (grupo.descripcion && grupo.descripcion.toLowerCase().includes(termino)) ||
      (grupo.ordenPrioridad && grupo.ordenPrioridad.toString().includes(termino))
    );
    this.gruposDespliegueTableConfig = this.buildGruposDespliegueTableConfig(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.gruposDespliegueTableConfig = this.buildGruposDespliegueTableConfig(this.gruposDespliegue);
  }

  aplicarFiltros(): void {
    if (this.dataTableComponent) {
      this.dataTableComponent.toggleFiltros();
      // Sincronizar el estado de visibilidad
      this.filtrosVisibles = !this.filtrosVisibles;
    }
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
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar el grupo de despliegue "<strong>${grupoDespliegue.nombreGrupo}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarGrupoDespliegue(grupoDespliegue.idGrupo);
      }
    });
  }

  eliminarGrupoDespliegue(id: number): void {
    this.loadingService.show();
    this.grupoDespliegueService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Grupo de despliegue eliminado correctamente', 'Éxito', 5000);
        this.cargarGruposDespliegue();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el grupo de despliegue';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private buildGruposDespliegueTableConfig(data: GrupoDespliegue[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} grupos de despliegue',
      emptyMessage: 'No se encontraron grupos de despliegue',
      columns: [
        {
          field: 'idGrupo',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'nombreGrupo',
          header: 'Nombre',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '200px',
          mobileVisible: true,
        },
        {
          field: 'descripcion',
          header: 'Descripción',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '280px',
          mobileVisible: false,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'ordenPrioridad',
          header: 'Orden Prioridad',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          align: 'center',
          width: '140px',
          mobileVisible: false,
          getLabel: (value: any) => value !== null && value !== undefined ? value.toString() : '-',
        },
        {
          field: 'porcentajeUsuarios',
          header: '% Usuarios',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          align: 'center',
          width: '120px',
          mobileVisible: false,
          getLabel: (value: any) => {
            if (value !== null && value !== undefined) {
              return `${value}%`;
            }
            return '-';
          },
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
          field: 'fechaCreacion',
          header: 'Fecha Creación',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => {
            if (!value) return '-';
            try {
              const date = new Date(value);
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
              return value;
            }
          },
        },
        {
          field: 'acciones',
          header: 'Acciones',
          type: ColumnType.TEXT,
          isAction: true,
          sortable: false,
          filterType: FilterType.NONE,
          width: '140px',
          mobileVisible: true,
        },
      ],
      rowActions: [
        {
          icon: 'pi pi-pencil',
          severity: 'success',
          tooltip: 'Editar grupo',
          action: (row: GrupoDespliegue) => this.editarGrupoDespliegue(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar grupo',
          action: (row: GrupoDespliegue) => this.confirmarEliminar(row),
        },
      ],
      globalFilterFields: ['nombreGrupo', 'descripcion', 'ordenPrioridad', 'estadoText'],
      data: data.map(g => ({
        ...g,
        estadoText: this.getEstadoLabel(g.activo),
      })),
    };
  }
}

