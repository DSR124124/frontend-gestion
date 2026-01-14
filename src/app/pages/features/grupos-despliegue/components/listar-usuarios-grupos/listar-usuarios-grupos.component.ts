import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UsuarioGrupo } from '../../interfaces/usuario-grupo.interface';
import { UsuarioGrupoService } from '../../services/usuario-grupo.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearUsuarioGrupoComponent } from '../crear-usuario-grupo/crear-usuario-grupo.component';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-usuarios-grupos',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearUsuarioGrupoComponent
  ],
  templateUrl: './listar-usuarios-grupos.component.html',
  styleUrl: './listar-usuarios-grupos.component.css',
  providers: [DialogService]
})
export class ListarUsuariosGruposComponent implements OnInit, OnDestroy {
  usuariosGrupos: UsuarioGrupo[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  usuariosGruposTableConfig!: TableConfig;
  filtrosVisibles: boolean = false;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearUsuarioGrupoComponent) crearUsuarioGrupoComponent?: CrearUsuarioGrupoComponent;
  @ViewChild(DataTableComponent) dataTableComponent?: DataTableComponent;

  constructor(
    private usuarioGrupoService: UsuarioGrupoService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.usuariosGruposTableConfig = this.buildUsuariosGruposTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.usuariosGruposTableConfig = { ...this.usuariosGruposTableConfig, loading };
      }
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
        this.usuariosGruposTableConfig = this.buildUsuariosGruposTableConfig(usuariosGrupos);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las asignaciones usuario-grupo';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  filtrarUsuariosGrupos(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.usuariosGruposTableConfig = this.buildUsuariosGruposTableConfig(this.usuariosGrupos);
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const filtrados = this.usuariosGrupos.filter(asignacion =>
      (asignacion.usuarioNombre && asignacion.usuarioNombre.toLowerCase().includes(termino)) ||
      (asignacion.usuarioEmail && asignacion.usuarioEmail.toLowerCase().includes(termino)) ||
      (asignacion.grupoNombre && asignacion.grupoNombre.toLowerCase().includes(termino)) ||
      (asignacion.notas && asignacion.notas.toLowerCase().includes(termino))
    );
    this.usuariosGruposTableConfig = this.buildUsuariosGruposTableConfig(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.usuariosGruposTableConfig = this.buildUsuariosGruposTableConfig(this.usuariosGrupos);
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
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar la asignación de "<strong>${usuarioGrupo.usuarioNombre || 'usuario'}</strong>" al grupo "<strong>${usuarioGrupo.grupoNombre || 'grupo'}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarUsuarioGrupo(usuarioGrupo.idUsuarioGrupo);
      }
    });
  }

  eliminarUsuarioGrupo(id: number): void {
    this.loadingService.show();
    this.usuarioGrupoService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Asignación usuario-grupo eliminada correctamente', 'Éxito', 5000);
        this.cargarUsuariosGrupos();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la asignación usuario-grupo';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private buildUsuariosGruposTableConfig(data: UsuarioGrupo[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} asignaciones',
      emptyMessage: 'No se encontraron asignaciones usuario-grupo',
      columns: [
        {
          field: 'idUsuarioGrupo',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'usuarioInfo',
          header: 'Usuario',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '220px',
          mobileVisible: true,
        },
        {
          field: 'grupoNombre',
          header: 'Grupo',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '180px',
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
          field: 'fechaAsignacion',
          header: 'Fecha Asignación',
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
          field: 'asignadoPorNombre',
          header: 'Asignado Por',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: false,
          getLabel: (value: any) => value || '-',
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
          tooltip: 'Editar asignación',
          action: (row: UsuarioGrupo) => this.editarUsuarioGrupo(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar asignación',
          action: (row: UsuarioGrupo) => this.confirmarEliminar(row),
        },
      ],
      globalFilterFields: ['usuarioNombre', 'usuarioEmail', 'grupoNombre', 'notas', 'estadoText'],
      data: data.map(u => ({
        ...u,
        usuarioInfo: `${u.usuarioNombre || '-'}\n${u.usuarioEmail || '-'}`,
        estadoText: this.getEstadoLabel(u.activo),
      })),
    };
  }
}

