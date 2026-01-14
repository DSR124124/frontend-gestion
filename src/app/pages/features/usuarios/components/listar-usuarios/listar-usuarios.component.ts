import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Usuario } from '../../interfaces/usuario.interface';
import { UsuarioService } from '../../services/usuario.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearUsuarioComponent } from '../crear-usuario/crear-usuario.component';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearUsuarioComponent
  ],
  templateUrl: './listar-usuarios.component.html',
  styleUrl: './listar-usuarios.component.css',
  providers: [DialogService]
})
export class ListarUsuariosComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  usuariosTableConfig!: TableConfig;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearUsuarioComponent) crearUsuarioComponent?: CrearUsuarioComponent;

  constructor(
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.usuariosTableConfig = this.buildUsuariosTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.usuariosTableConfig = { ...this.usuariosTableConfig, loading };
      }
    );
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarUsuarios(): void {
    this.loadingService.show();
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosTableConfig = this.buildUsuariosTableConfig(usuarios);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los usuarios';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  filtrarUsuarios(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.usuariosTableConfig = this.buildUsuariosTableConfig(this.usuarios);
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const filtrados = this.usuarios.filter(usuario =>
      usuario.username.toLowerCase().includes(termino) ||
      usuario.email.toLowerCase().includes(termino) ||
      (usuario.nombreCompleto && usuario.nombreCompleto.toLowerCase().includes(termino)) ||
      (usuario.nombreRol && usuario.nombreRol.toLowerCase().includes(termino))
    );
    this.usuariosTableConfig = this.buildUsuariosTableConfig(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.usuariosTableConfig = this.buildUsuariosTableConfig(this.usuarios);
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
    if (this.crearUsuarioComponent) {
      this.crearUsuarioComponent.showDialog();
    }
  }

  onUsuarioCreado(): void {
    this.cargarUsuarios();
  }

  onUsuarioActualizado(): void {
    this.cargarUsuarios();
  }

  editarUsuario(usuario: Usuario): void {
    if (this.crearUsuarioComponent) {
      this.crearUsuarioComponent.showDialog(usuario);
    }
  }

  confirmarEliminar(usuario: Usuario): void {
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar al usuario "<strong>${usuario.username}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarUsuario(usuario.idUsuario);
      }
    });
  }

  eliminarUsuario(id: number): void {
    this.loadingService.show();
    this.usuarioService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Usuario eliminado correctamente', 'Éxito', 5000);
        this.cargarUsuarios();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el usuario';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private buildUsuariosTableConfig(data: Usuario[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} usuarios',
      emptyMessage: 'No se encontraron usuarios',
      columns: [
        {
          field: 'idUsuario',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'username',
          header: 'Usuario',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: true,
        },
        {
          field: 'email',
          header: 'Email',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '220px',
          mobileVisible: false,
        },
        {
          field: 'nombreCompleto',
          header: 'Nombre Completo',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '200px',
          mobileVisible: false,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'nombreRol',
          header: 'Rol',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '150px',
          mobileVisible: true,
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
          field: 'fechaUltimoAcceso',
          header: 'Último Acceso',
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
          tooltip: 'Editar usuario',
          action: (row: Usuario) => this.editarUsuario(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar usuario',
          action: (row: Usuario) => this.confirmarEliminar(row),
        },
      ],
      globalFilterFields: ['username', 'email', 'nombreCompleto', 'nombreRol', 'estadoText'],
      data: data.map(u => ({
        ...u,
        estadoText: this.getEstadoLabel(u.activo),
      })),
    };
  }
}

