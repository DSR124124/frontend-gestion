import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Rol } from '../../interfaces/rol.interface';
import { RolService } from '../../services/rol.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CrearRolComponent } from '../crear-rol/crear-rol.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-roles',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    CrearRolComponent
  ],
  templateUrl: './listar-roles.component.html',
  styleUrl: './listar-roles.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ListarRolesComponent implements OnInit, OnDestroy {
  roles: Rol[] = [];
  rolesFiltrados: Rol[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  private loadingSubscription?: Subscription;

  @ViewChild(CrearRolComponent) crearRolComponent?: CrearRolComponent;

  constructor(
    private rolService: RolService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de loading del servicio
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
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
        this.rolesFiltrados = roles;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los roles';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarRoles(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.rolesFiltrados = this.roles;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.rolesFiltrados = this.roles.filter(rol =>
      rol.nombreRol.toLowerCase().includes(termino) ||
      (rol.descripcion && rol.descripcion.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.rolesFiltrados = this.roles;
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
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el rol "${rol.nombreRol}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarRol(rol.idRol);
      }
    });
  }

  eliminarRol(id: number): void {
    this.loadingService.show();
    this.rolService.eliminar(id).subscribe({
      next: () => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Rol eliminado correctamente',
          life: 5000
        });
        this.cargarRoles();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al eliminar el rol';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }
}

