import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Rol } from '../../interfaces/rol.interface';
import { RolService } from '../../services/rol.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearRolComponent } from '../crear-rol/crear-rol.component';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-roles',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearRolComponent
  ],
  templateUrl: './listar-roles.component.html',
  styleUrl: './listar-roles.component.css',
  providers: [DialogService]
})
export class ListarRolesComponent implements OnInit, OnDestroy {
  roles: Rol[] = [];
  loading: boolean = false;
  rolesTableConfig!: TableConfig;
  terminoBusqueda: string = '';
  filtrosVisibles: boolean = false;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearRolComponent) crearRolComponent?: CrearRolComponent;
  @ViewChild(DataTableComponent) dataTableComponent?: DataTableComponent;

  constructor(
    private rolService: RolService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.rolesTableConfig = this.buildRolesTableConfig([]);
    // Suscribirse al estado de loading del servicio
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.rolesTableConfig = { ...this.rolesTableConfig, loading };
      }
    );
    this.cargarRoles();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarRoles(): void {
    this.loadingService.show();
    this.rolService.listar().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.rolesTableConfig = this.buildRolesTableConfig(roles);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los roles';
        this.messageService.error(errorMessage, 'Error');
      }
    });
  }

  filtrarRoles(): void {
    const termino = (this.terminoBusqueda || '').toLowerCase().trim();
    if (!termino) {
      this.rolesTableConfig = this.buildRolesTableConfig(this.roles);
      return;
    }

    const filtrados = this.roles.filter(r => {
      const nombre = (r.nombreRol || '').toLowerCase();
      const descripcion = (r.descripcion || '').toLowerCase();
      return nombre.includes(termino) || descripcion.includes(termino);
    });

    this.rolesTableConfig = this.buildRolesTableConfig(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.rolesTableConfig = this.buildRolesTableConfig(this.roles);
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

  formatearPermisos(permisos: { [key: string]: any } | null): string {
    if (!permisos) return '-';
    try {
      const permisosArray = Object.keys(permisos).filter(key => permisos[key] === true);
      return permisosArray.length > 0 ? permisosArray.join(', ') : 'Sin permisos';
    } catch {
      return '-';
    }
  }

  abrirDialogoCrear(): void {
    if (this.crearRolComponent) {
      this.crearRolComponent.showDialog();
    }
  }

  onRolCreado(): void {
    this.cargarRoles();
  }

  onRolActualizado(): void {
    this.cargarRoles();
  }

  editarRol(rol: Rol): void {
    if (this.crearRolComponent) {
      this.crearRolComponent.showDialog(rol);
    }
  }

  confirmarEliminar(rol: Rol): void {
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar el rol "<strong>${rol.nombreRol}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarRol(rol.idRol);
      }
    });
  }

  eliminarRol(id: number): void {
    this.loadingService.show();
    this.rolService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Rol eliminado correctamente', 'Éxito', 5000);
        this.cargarRoles();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el rol';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private buildRolesTableConfig(data: Rol[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} roles',
      emptyMessage: 'No se encontraron roles',
      globalSearchPlaceholder: 'Buscar por nombre o descripción...',
      columns: [
        {
          field: 'idRol',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'nombreRol',
          header: 'Nombre',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '180px',
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
        },
        {
          field: 'permisosText',
          header: 'Permisos',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '260px',
          mobileVisible: false,
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
          width: '140px',
          mobileVisible: true,
        },
        {
          field: 'fechaCreacion',
          header: 'Fecha Creación',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '160px',
          mobileVisible: false,
        },
        {
          field: 'fechaModificacion',
          header: 'Última Modificación',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '180px',
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
          mobileVisible: true,
        },
      ],
      rowActions: [
        {
          icon: 'pi pi-pencil',
          severity: 'success',
          tooltip: 'Editar rol',
          action: (row: Rol) => this.editarRol(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar rol',
          action: (row: Rol) => this.confirmarEliminar(row),
        },
      ],
      // Preparar campos para búsqueda global dentro del componente
      globalFilterFields: ['nombreRol', 'descripcion', 'permisosText', 'estadoText'],
      // Adaptar data para UI (sin tocar el modelo original)
      // Nota: el DataTable toma `config.data` tal cual; aquí lo preprocesamos.
      data: data.map(r => ({
        ...r,
        permisosText: this.formatearPermisos(r.permisos),
        estadoText: this.getEstadoLabel(r.activo),
      })),
    };
  }
}

