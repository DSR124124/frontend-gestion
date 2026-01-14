import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { UsuarioAplicacion } from '../../interfaces/usuario-aplicacion.interface';
import { UsuarioAplicacionService } from '../../services/usuario-aplicacion.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearUsuarioAplicacionComponent } from '../crear-usuario-aplicacion/crear-usuario-aplicacion.component';
import { Subscription } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-usuarios-aplicaciones',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearUsuarioAplicacionComponent
  ],
  templateUrl: './listar-usuarios-aplicaciones.component.html',
  styleUrl: './listar-usuarios-aplicaciones.component.css',
  providers: [DialogService]
})
export class ListarUsuariosAplicacionesComponent implements OnInit, OnDestroy {
  usuariosAplicaciones: UsuarioAplicacion[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  usuariosAplicacionesTableConfig!: TableConfig;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearUsuarioAplicacionComponent) crearUsuarioAplicacionComponent?: CrearUsuarioAplicacionComponent;

  constructor(
    private usuarioAplicacionService: UsuarioAplicacionService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.usuariosAplicacionesTableConfig = this.buildUsuariosAplicacionesTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.usuariosAplicacionesTableConfig = { ...this.usuariosAplicacionesTableConfig, loading };
      }
    );
    this.cargarUsuariosAplicaciones();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarUsuariosAplicaciones(): void {
    this.loadingService.show();
    this.usuarioAplicacionService.listar().subscribe({
      next: (usuariosAplicaciones) => {
        this.usuariosAplicaciones = usuariosAplicaciones;
        this.usuariosAplicacionesTableConfig = this.buildUsuariosAplicacionesTableConfig(usuariosAplicaciones);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las relaciones usuario-aplicación';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  filtrarUsuariosAplicaciones(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.usuariosAplicacionesTableConfig = this.buildUsuariosAplicacionesTableConfig(this.usuariosAplicaciones);
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const filtrados = this.usuariosAplicaciones.filter(relacion =>
      (relacion.usuarioNombre && relacion.usuarioNombre.toLowerCase().includes(termino)) ||
      (relacion.usuarioEmail && relacion.usuarioEmail.toLowerCase().includes(termino)) ||
      (relacion.aplicacionNombre && relacion.aplicacionNombre.toLowerCase().includes(termino)) ||
      (relacion.notas && relacion.notas.toLowerCase().includes(termino))
    );
    this.usuariosAplicacionesTableConfig = this.buildUsuariosAplicacionesTableConfig(filtrados);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.usuariosAplicacionesTableConfig = this.buildUsuariosAplicacionesTableConfig(this.usuariosAplicaciones);
  }

  getSeverity(licenciaActiva: boolean): string {
    return licenciaActiva ? 'success' : 'danger';
  }

  getEstadoLabel(licenciaActiva: boolean): string {
    return licenciaActiva ? 'Activa' : 'Inactiva';
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      const ahora = new Date();
      const diffMs = date.getTime() - ahora.getTime();
      const diffMins = Math.floor(Math.abs(diffMs) / 60000);
      const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
      const diffDays = Math.floor(Math.abs(diffMs) / 86400000);
      const esFuturo = diffMs > 0;

      if (Math.abs(diffMs) < 60000) { // Menos de 1 minuto
        return 'Ahora';
      } else if (diffMins < 60) {
        return esFuturo ? `Dentro de ${diffMins} min` : `Hace ${diffMins} min`;
      } else if (diffHours < 24) {
        return esFuturo ? `Dentro de ${diffHours} h` : `Hace ${diffHours} h`;
      } else if (diffDays < 7) {
        return esFuturo ? `Dentro de ${diffDays} días` : `Hace ${diffDays} días`;
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
    if (this.crearUsuarioAplicacionComponent) {
      this.crearUsuarioAplicacionComponent.showDialog();
    }
  }

  onUsuarioAplicacionCreado(): void {
    this.cargarUsuariosAplicaciones();
  }

  onUsuarioAplicacionActualizado(): void {
    this.cargarUsuariosAplicaciones();
  }

  editarUsuarioAplicacion(usuarioAplicacion: UsuarioAplicacion): void {
    if (this.crearUsuarioAplicacionComponent) {
      this.crearUsuarioAplicacionComponent.showDialog(usuarioAplicacion);
    }
  }

  confirmarEliminar(usuarioAplicacion: UsuarioAplicacion): void {
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar la relación entre "<strong>${usuarioAplicacion.usuarioNombre || 'usuario'}</strong>" y "<strong>${usuarioAplicacion.aplicacionNombre || 'aplicación'}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarUsuarioAplicacion(usuarioAplicacion.idUsuarioAplicacion);
      }
    });
  }

  eliminarUsuarioAplicacion(id: number): void {
    this.loadingService.show();
    this.usuarioAplicacionService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Relación usuario-aplicación eliminada correctamente', 'Éxito', 5000);
        this.cargarUsuariosAplicaciones();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la relación usuario-aplicación';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private buildUsuariosAplicacionesTableConfig(data: UsuarioAplicacion[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} relaciones',
      emptyMessage: 'No se encontraron relaciones usuario-aplicación',
      columns: [
        {
          field: 'idUsuarioAplicacion',
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
          field: 'aplicacionNombre',
          header: 'Aplicación',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '180px',
          mobileVisible: true,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'licenciaText',
          header: 'Licencia',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Activa', value: 'Activa' },
            { label: 'Inactiva', value: 'Inactiva' },
          ],
          width: '120px',
          mobileVisible: true,
        },
        {
          field: 'fechaRegistro',
          header: 'Fecha Registro',
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
              const diffMs = date.getTime() - ahora.getTime();
              const diffMins = Math.floor(Math.abs(diffMs) / 60000);
              const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
              const diffDays = Math.floor(Math.abs(diffMs) / 86400000);
              const esFuturo = diffMs > 0;

              if (Math.abs(diffMs) < 60000) {
                return 'Ahora';
              } else if (diffMins < 60) {
                return esFuturo ? `Dentro de ${diffMins} min` : `Hace ${diffMins} min`;
              } else if (diffHours < 24) {
                return esFuturo ? `Dentro de ${diffHours} h` : `Hace ${diffHours} h`;
              } else if (diffDays < 7) {
                return esFuturo ? `Dentro de ${diffDays} días` : `Hace ${diffDays} días`;
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
              const diffMs = date.getTime() - ahora.getTime();
              const diffMins = Math.floor(Math.abs(diffMs) / 60000);
              const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
              const diffDays = Math.floor(Math.abs(diffMs) / 86400000);
              const esFuturo = diffMs > 0;

              if (Math.abs(diffMs) < 60000) {
                return 'Ahora';
              } else if (diffMins < 60) {
                return esFuturo ? `Dentro de ${diffMins} min` : `Hace ${diffMins} min`;
              } else if (diffHours < 24) {
                return esFuturo ? `Dentro de ${diffHours} h` : `Hace ${diffHours} h`;
              } else if (diffDays < 7) {
                return esFuturo ? `Dentro de ${diffDays} días` : `Hace ${diffDays} días`;
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
          field: 'fechaExpiracionLicencia',
          header: 'Expiración',
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
              const diffMs = date.getTime() - ahora.getTime();
              const diffMins = Math.floor(Math.abs(diffMs) / 60000);
              const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
              const diffDays = Math.floor(Math.abs(diffMs) / 86400000);
              const esFuturo = diffMs > 0;

              if (Math.abs(diffMs) < 60000) {
                return 'Ahora';
              } else if (diffMins < 60) {
                return esFuturo ? `Dentro de ${diffMins} min` : `Hace ${diffMins} min`;
              } else if (diffHours < 24) {
                return esFuturo ? `Dentro de ${diffHours} h` : `Hace ${diffHours} h`;
              } else if (diffDays < 7) {
                return esFuturo ? `Dentro de ${diffDays} días` : `Hace ${diffDays} días`;
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
          tooltip: 'Editar relación',
          action: (row: UsuarioAplicacion) => this.editarUsuarioAplicacion(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar relación',
          action: (row: UsuarioAplicacion) => this.confirmarEliminar(row),
        },
      ],
      globalFilterFields: ['usuarioNombre', 'usuarioEmail', 'aplicacionNombre', 'notas', 'licenciaText'],
      data: data.map(u => ({
        ...u,
        usuarioInfo: u.usuarioNombre && u.usuarioEmail
          ? `${u.usuarioNombre} (${u.usuarioEmail})`
          : u.usuarioNombre || u.usuarioEmail || '-',
        licenciaText: this.getEstadoLabel(u.licenciaActiva),
      })),
    };
  }
}

