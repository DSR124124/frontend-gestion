import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstadisticaLanzamiento } from '../../interfaces/estadistica-lanzamiento.interface';
import { EstadisticaLanzamientoService } from '../../services/estadistica-lanzamiento.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { LanzamientoService } from '../../../lanzamientos/services/lanzamiento.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Aplicacion } from '../../../aplicaciones/interfaces/aplicacion.interface';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ...PrimeNGModules
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [MessageService]
})
export class DashboardComponent implements OnInit, OnDestroy {
  estadisticas: EstadisticaLanzamiento[] = [];
  aplicaciones: Aplicacion[] = [];
  totalAplicaciones: number = 0;
  totalLanzamientos: number = 0;
  totalUsuarios: number = 0;
  totalGrupos: number = 0;
  promedioGrupos: number = 0;
  loading: boolean = false;

  // Datos para gráficos
  chartUsuariosPorAplicacion: any;
  chartLanzamientosPorEstado: any;
  chartLanzamientosPorAplicacion: any;
  chartUsuariosConAcceso: any;

  private loadingSubscription?: Subscription;
  private subscriptions: Subscription[] = [];

  constructor(
    private estadisticaLanzamientoService: EstadisticaLanzamientoService,
    private aplicacionService: AplicacionService,
    private lanzamientoService: LanzamientoService,
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.loading = loading
    );
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chartUsuariosPorAplicacion) {
      this.chartUsuariosPorAplicacion.destroy();
    }
    if (this.chartLanzamientosPorEstado) {
      this.chartLanzamientosPorEstado.destroy();
    }
    if (this.chartLanzamientosPorAplicacion) {
      this.chartLanzamientosPorAplicacion.destroy();
    }
    if (this.chartUsuariosConAcceso) {
      this.chartUsuariosConAcceso.destroy();
    }
  }

  async cargarDatos(): Promise<void> {
    this.loadingService.show();

    try {
      // Cargar estadísticas
      const estadisticas = await firstValueFrom(this.estadisticaLanzamientoService.listarTodas());
      this.estadisticas = estadisticas;
      this.calcularPromedioGrupos();
      this.crearGraficos();

      // Cargar aplicaciones
      const aplicaciones = await firstValueFrom(this.aplicacionService.listar());
      this.aplicaciones = aplicaciones.filter(a => a.activo);
      this.totalAplicaciones = this.aplicaciones.length;

      // Cargar lanzamientos
      const lanzamientos = await firstValueFrom(this.lanzamientoService.listar());
      this.totalLanzamientos = lanzamientos.length;

      // Cargar usuarios
      const usuarios = await firstValueFrom(this.usuarioService.listar());
      this.totalUsuarios = usuarios.filter(u => u.activo).length;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos del dashboard',
        life: 5000
      });
    } finally {
      this.loadingService.hide();
    }
  }

  calcularPromedioGrupos(): void {
    if (this.estadisticas.length > 0) {
      const totalGrupos = this.estadisticas.reduce((acc, est) => acc + (est.gruposAsignados || 0), 0);
      this.promedioGrupos = totalGrupos / this.estadisticas.length;
    } else {
      this.promedioGrupos = 0;
    }
  }

  crearGraficos(): void {
    this.crearGraficoUsuariosPorAplicacion();
    this.crearGraficoLanzamientosPorEstado();
    this.crearGraficoLanzamientosPorAplicacion();
    this.crearGraficoUsuariosConAcceso();
  }

  crearGraficoUsuariosPorAplicacion(): void {
    const canvas = document.getElementById('chartUsuariosPorAplicacion') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas chartUsuariosPorAplicacion no encontrado');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chartUsuariosPorAplicacion) {
      this.chartUsuariosPorAplicacion.destroy();
    }

    const datosPorAplicacion = new Map<string, number>();

    this.estadisticas.forEach(est => {
      const nombre = est.nombreAplicacion || 'Sin nombre';
      const actual = datosPorAplicacion.get(nombre) || 0;
      datosPorAplicacion.set(nombre, actual + (est.usuariosConAcceso || 0));
    });

    const labels = Array.from(datosPorAplicacion.keys());
    const data = Array.from(datosPorAplicacion.values());

    if (labels.length === 0 || data.length === 0) {
      console.warn('No hay datos para el gráfico de usuarios por aplicación');
      return;
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Usuarios con Acceso',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: 'Usuarios con Acceso por Aplicación'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    try {
      this.chartUsuariosPorAplicacion = new Chart(canvas, config);
    } catch (error) {
      console.error('Error al crear gráfico de usuarios por aplicación:', error);
    }
  }

  crearGraficoLanzamientosPorEstado(): void {
    const canvas = document.getElementById('chartLanzamientosPorEstado') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas chartLanzamientosPorEstado no encontrado');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chartLanzamientosPorEstado) {
      this.chartLanzamientosPorEstado.destroy();
    }

    const datosPorEstado = new Map<string, number>();

    this.estadisticas.forEach(est => {
      const estado = est.estado || 'Sin estado';
      const actual = datosPorEstado.get(estado) || 0;
      datosPorEstado.set(estado, actual + 1);
    });

    const labels = Array.from(datosPorEstado.keys());
    const data = Array.from(datosPorEstado.values());

    if (labels.length === 0 || data.length === 0) {
      console.warn('No hay datos para el gráfico de lanzamientos por estado');
      return;
    }

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Lanzamientos',
          data: data,
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Lanzamientos por Estado'
          }
        }
      }
    };

    try {
      this.chartLanzamientosPorEstado = new Chart(canvas, config);
    } catch (error) {
      console.error('Error al crear gráfico de lanzamientos por estado:', error);
    }
  }

  crearGraficoLanzamientosPorAplicacion(): void {
    const canvas = document.getElementById('chartLanzamientosPorAplicacion') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas chartLanzamientosPorAplicacion no encontrado');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chartLanzamientosPorAplicacion) {
      this.chartLanzamientosPorAplicacion.destroy();
    }

    const datosPorAplicacion = new Map<string, number>();

    this.estadisticas.forEach(est => {
      const nombre = est.nombreAplicacion || 'Sin nombre';
      const actual = datosPorAplicacion.get(nombre) || 0;
      datosPorAplicacion.set(nombre, actual + 1);
    });

    const labels = Array.from(datosPorAplicacion.keys());
    const data = Array.from(datosPorAplicacion.values());

    if (labels.length === 0 || data.length === 0) {
      console.warn('No hay datos para el gráfico de lanzamientos por aplicación');
      return;
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Lanzamientos',
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Lanzamientos por Aplicación'
          }
        }
      }
    };

    try {
      this.chartLanzamientosPorAplicacion = new Chart(canvas, config);
    } catch (error) {
      console.error('Error al crear gráfico de lanzamientos por aplicación:', error);
    }
  }

  crearGraficoUsuariosConAcceso(): void {
    const canvas = document.getElementById('chartUsuariosConAcceso') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas chartUsuariosConAcceso no encontrado');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chartUsuariosConAcceso) {
      this.chartUsuariosConAcceso.destroy();
    }

    // Top 10 lanzamientos con más usuarios
    const topLanzamientos = [...this.estadisticas]
      .sort((a, b) => (b.usuariosConAcceso || 0) - (a.usuariosConAcceso || 0))
      .slice(0, 10);

    if (topLanzamientos.length === 0) {
      console.warn('No hay datos para el gráfico de usuarios con acceso');
      return;
    }

    const labels = topLanzamientos.map(est =>
      `${est.nombreAplicacion || 'N/A'} - ${est.version || 'N/A'}`
    );
    const data = topLanzamientos.map(est => est.usuariosConAcceso || 0);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Usuarios con Acceso',
          data: data,
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: 'Top 10 Lanzamientos por Usuarios con Acceso'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    try {
      this.chartUsuariosConAcceso = new Chart(canvas, config);
    } catch (error) {
      console.error('Error al crear gráfico de usuarios con acceso:', error);
    }
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return fecha;
    }
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
}

