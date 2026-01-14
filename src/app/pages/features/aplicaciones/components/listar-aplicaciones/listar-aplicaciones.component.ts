import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Aplicacion } from '../../interfaces/aplicacion.interface';
import { AplicacionService } from '../../services/aplicacion.service';
import { LanzamientoService } from '../../../lanzamientos/services/lanzamiento.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearAplicacionComponent } from '../crear-aplicacion/crear-aplicacion.component';
import { Subscription, forkJoin } from 'rxjs';
import { ExternalSystemService } from '../../../../../core/services/external-system.service';
import { AuthService } from '../../../../full-pages/auth/services/auth.service';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';
import { DialogoComponent } from '../../../../../shared/components/dialogo/dialogo.component';

@Component({
  selector: 'app-listar-aplicaciones',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent,
    CrearAplicacionComponent
  ],
  templateUrl: './listar-aplicaciones.component.html',
  styleUrl: './listar-aplicaciones.component.css',
  providers: [DialogService]
})
export class ListarAplicacionesComponent implements OnInit, OnDestroy {
  aplicaciones: Aplicacion[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  conteoLanzamientos: Map<number, number> = new Map();
  aplicacionesTableConfig!: TableConfig;
  filtrosVisibles: boolean = false;
  private loadingSubscription?: Subscription;

  @ViewChild(CrearAplicacionComponent) crearAplicacionComponent?: CrearAplicacionComponent;
  @ViewChild(DataTableComponent) dataTableComponent?: DataTableComponent;

  constructor(
    private aplicacionService: AplicacionService,
    private lanzamientoService: LanzamientoService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private loadingService: LoadingService,
    private router: Router,
    private externalSystemService: ExternalSystemService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.aplicacionesTableConfig = this.buildAplicacionesTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.aplicacionesTableConfig = { ...this.aplicacionesTableConfig, loading };
      }
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

    // Cargar aplicaciones primero (obligatorio)
    this.aplicacionService.listar().subscribe({
      next: (aplicaciones) => {
        this.aplicaciones = aplicaciones;
        this.aplicacionesTableConfig = this.buildAplicacionesTableConfig(aplicaciones);
        this.loadingService.hide();

        // Intentar cargar lanzamientos de forma opcional (no bloquea si falla)
        this.cargarLanzamientosOpcional();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar las aplicaciones';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
  }

  private cargarLanzamientosOpcional(): void {
    // Intentar cargar lanzamientos, pero no mostrar error si falla por permisos
    this.lanzamientoService.listar().subscribe({
      next: (lanzamientos) => {
        // Contar lanzamientos por aplicación
        this.conteoLanzamientos.clear();
        lanzamientos.forEach(lanzamiento => {
          const idAplicacion = lanzamiento.idAplicacion;
          const conteoActual = this.conteoLanzamientos.get(idAplicacion) || 0;
          this.conteoLanzamientos.set(idAplicacion, conteoActual + 1);
        });
        // Actualizar la configuración de la tabla con los nuevos conteos
        this.aplicacionesTableConfig = this.buildAplicacionesTableConfig(this.aplicaciones);
      },
      error: (error) => {
        // Si es un error 403 (Forbidden), simplemente no cargar los conteos
        // No mostrar error al usuario ya que es opcional
        if (error?.status === 403) {
          this.conteoLanzamientos.clear();
        } else {
          // Para otros errores, solo loguear sin mostrar mensaje al usuario
          this.messageService.warn('No se pudieron cargar los lanzamientos', 'Advertencia', 3000);
          this.conteoLanzamientos.clear();
        }
      }
    });
  }

  filtrarAplicaciones(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.aplicacionesTableConfig = this.buildAplicacionesTableConfig(this.aplicaciones);
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const filtradas = this.aplicaciones.filter(aplicacion =>
      aplicacion.nombreAplicacion.toLowerCase().includes(termino) ||
      (aplicacion.descripcion && aplicacion.descripcion.toLowerCase().includes(termino)) ||
      (aplicacion.codigoProducto && aplicacion.codigoProducto.toLowerCase().includes(termino)) ||
      (aplicacion.responsableNombre && aplicacion.responsableNombre.toLowerCase().includes(termino))
    );
    this.aplicacionesTableConfig = this.buildAplicacionesTableConfig(filtradas);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.aplicacionesTableConfig = this.buildAplicacionesTableConfig(this.aplicaciones);
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
    const ref: DynamicDialogRef = this.dialogService.open(DialogoComponent, {
      header: 'Confirmar Eliminación',
      width: '500px',
      modal: true,
      closable: true,
      data: {
        mensaje: `¿Está seguro de que desea eliminar la aplicación "<strong>${aplicacion.nombreAplicacion}</strong>"?`,
        severidad: 'warn',
        mostrarBotones: true,
        labelAceptar: 'Sí, eliminar',
        labelCerrar: 'Cancelar'
      }
    });

    ref.onClose.subscribe((result: string | undefined) => {
      if (result === 'aceptar') {
        this.eliminarAplicacion(aplicacion.idAplicacion);
      }
    });
  }

  eliminarAplicacion(id: number): void {
    this.loadingService.show();
    this.aplicacionService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.success('Aplicación eliminada correctamente', 'Éxito', 5000);
        this.cargarAplicaciones();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar la aplicación';
        this.messageService.error(errorMessage, 'Error', 5000);
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

  tienePermisosParaSistema(aplicacion: Aplicacion): boolean {
    // Verificar que el usuario esté autenticado
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    // Por ahora, permitir acceso si el usuario está autenticado
    // Puedes agregar lógica adicional aquí basada en roles o permisos específicos
    const user = this.authService.getCurrentUser();
    if (!user) {
      return false;
    }

    // Si la aplicación está inactiva, no permitir acceso
    if (!aplicacion.activo) {
      return false;
    }

    // Aquí puedes agregar validaciones adicionales basadas en roles
    // Por ejemplo: solo administradores pueden acceder a ciertos sistemas
    // if (aplicacion.codigoProducto === 'SISTEMA_ADMIN' && user.nombreRol !== 'ADMINISTRADOR') {
    //   return false;
    // }

    return true;
  }

  abrirSistema(aplicacion: Aplicacion): void {
    if (!aplicacion.url) {
      this.messageService.warn('Esta aplicación no tiene una URL configurada', 'URL no disponible', 5000);
      return;
    }

    if (!this.tienePermisosParaSistema(aplicacion)) {
      this.messageService.warn('No tiene permisos para acceder a este sistema', 'Acceso Denegado', 5000);
      return;
    }

    // Obtener el token del usuario autenticado
    const token = this.authService.getToken();
    let url = aplicacion.url;

    // Agregar el token como parámetro si está disponible
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(token)}`;
    }

    // Abrir en una nueva ventana
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private buildAplicacionesTableConfig(data: Aplicacion[]): TableConfig {
    return {
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      showGlobalSearch: false,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} aplicaciones',
      emptyMessage: 'No se encontraron aplicaciones',
      columns: [
        {
          field: 'idAplicacion',
          header: 'ID',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          width: '80px',
          mobileVisible: true,
        },
        {
          field: 'nombreAplicacion',
          header: 'Nombre',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '180px',
          mobileVisible: true,
        },
        {
          field: 'codigoProducto',
          header: 'Código',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '120px',
          mobileVisible: false,
          getLabel: (value: any) => value || '-',
        },
        {
          field: 'responsableNombre',
          header: 'Responsable',
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
          field: 'fechaModificacion',
          header: 'Última Modificación',
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
          field: 'conteoLanzamientos',
          header: 'Lanzamientos',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          align: 'center',
          width: '130px',
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
          icon: 'pi pi-external-link',
          severity: 'info',
          tooltip: 'Abrir sistema',
          action: (row: Aplicacion) => this.abrirSistema(row),
          disabled: (row: Aplicacion) => !row.url || !this.tienePermisosParaSistema(row),
        },
        {
          icon: 'pi pi-pencil',
          severity: 'success',
          tooltip: 'Editar aplicación',
          action: (row: Aplicacion) => this.editarAplicacion(row),
        },
        {
          icon: 'pi pi-trash',
          severity: 'danger',
          tooltip: 'Eliminar aplicación',
          action: (row: Aplicacion) => this.confirmarEliminar(row),
        },
      ],
      globalFilterFields: ['nombreAplicacion', 'descripcion', 'codigoProducto', 'responsableNombre', 'estadoText'],
      data: data.map(a => ({
        ...a,
        estadoText: this.getEstadoLabel(a.activo),
        conteoLanzamientos: this.obtenerConteoLanzamientos(a.idAplicacion),
      })),
    };
  }
}

