import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsuarioLanzamientoDisponible } from '../../interfaces/usuario-lanzamiento-disponible.interface';
import { UsuarioLanzamientoDisponibleService } from '../../services/usuario-lanzamiento-disponible.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { GrupoDespliegueService } from '../../../grupos-despliegue/services/grupo-despliegue.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Usuario } from '../../../usuarios/interfaces/usuario.interface';
import { Aplicacion } from '../../../aplicaciones/interfaces/aplicacion.interface';
import { GrupoDespliegue } from '../../../grupos-despliegue/interfaces/grupo-despliegue.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-usuarios-lanzamientos-disponibles',
  standalone: true,
  imports: [
    ...PrimeNGModules
  ],
  templateUrl: './listar-usuarios-lanzamientos-disponibles.component.html',
  styleUrl: './listar-usuarios-lanzamientos-disponibles.component.css',
  providers: [MessageService]
})
export class ListarUsuariosLanzamientosDisponiblesComponent implements OnInit, OnDestroy {
  lanzamientosDisponibles: UsuarioLanzamientoDisponible[] = [];
  lanzamientosDisponiblesFiltrados: UsuarioLanzamientoDisponible[] = [];
  loading: boolean = false;
  terminoBusqueda: string = '';
  filtroUsuario: number | null = null;
  filtroAplicacion: number | null = null;
  filtroGrupo: number | null = null;
  usuarios: Usuario[] = [];
  aplicaciones: Aplicacion[] = [];
  gruposDespliegue: GrupoDespliegue[] = [];
  private loadingSubscription?: Subscription;

  constructor(
    private usuarioLanzamientoDisponibleService: UsuarioLanzamientoDisponibleService,
    private usuarioService: UsuarioService,
    private aplicacionService: AplicacionService,
    private grupoDespliegueService: GrupoDespliegueService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarUsuarios();
    this.cargarAplicaciones();
    this.cargarGruposDespliegue();
    this.cargarLanzamientosDisponibles();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  cargarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.filter(u => u.activo);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  cargarAplicaciones(): void {
    this.aplicacionService.listar().subscribe({
      next: (aplicaciones) => {
        this.aplicaciones = aplicaciones.filter(a => a.activo);
      },
      error: (error) => {
        console.error('Error al cargar aplicaciones:', error);
      }
    });
  }

  cargarGruposDespliegue(): void {
    this.grupoDespliegueService.listar().subscribe({
      next: (grupos) => {
        this.gruposDespliegue = grupos.filter(g => g.activo);
      },
      error: (error) => {
        console.error('Error al cargar grupos de despliegue:', error);
      }
    });
  }

  cargarLanzamientosDisponibles(): void {
    this.loadingService.show();
    
    let observable;
    if (this.filtroUsuario) {
      observable = this.usuarioLanzamientoDisponibleService.listarPorUsuario(this.filtroUsuario);
    } else if (this.filtroAplicacion) {
      observable = this.usuarioLanzamientoDisponibleService.listarPorAplicacion(this.filtroAplicacion);
    } else if (this.filtroGrupo) {
      observable = this.usuarioLanzamientoDisponibleService.listarPorGrupo(this.filtroGrupo);
    } else {
      observable = this.usuarioLanzamientoDisponibleService.listarTodos();
    }

    observable.subscribe({
      next: (lanzamientos) => {
        this.lanzamientosDisponibles = lanzamientos;
        this.lanzamientosDisponiblesFiltrados = lanzamientos;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error?.message || error?.error?.message || 'Error al cargar los lanzamientos disponibles';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  filtrarLanzamientosDisponibles(): void {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      this.lanzamientosDisponiblesFiltrados = this.lanzamientosDisponibles;
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.lanzamientosDisponiblesFiltrados = this.lanzamientosDisponibles.filter(item =>
      (item.username && item.username.toLowerCase().includes(termino)) ||
      (item.email && item.email.toLowerCase().includes(termino)) ||
      (item.nombreAplicacion && item.nombreAplicacion.toLowerCase().includes(termino)) ||
      (item.version && item.version.toLowerCase().includes(termino)) ||
      (item.nombreGrupo && item.nombreGrupo.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.lanzamientosDisponiblesFiltrados = this.lanzamientosDisponibles;
  }

  limpiarFiltros(): void {
    this.filtroUsuario = null;
    this.filtroAplicacion = null;
    this.filtroGrupo = null;
    this.cargarLanzamientosDisponibles();
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return fecha;
      }
      const ahora = new Date();
      const diffMs = date.getTime() - ahora.getTime(); // Calculate difference from now
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
    } catch (error) {
      console.error('Error al formatear fecha:', fecha, error);
      return fecha || '-';
    }
  }

  formatearFechaCompleta(fecha: string | null): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return fecha || '-';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha completa:', fecha, error);
      return fecha || '-';
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

  getSeverityEstado(estado: string | null): string {
    if (!estado) return 'secondary';
    switch (estado.toLowerCase()) {
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

  getEstadoLabel(estado: string | null): string {
    if (!estado) return '-';
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  }
}

