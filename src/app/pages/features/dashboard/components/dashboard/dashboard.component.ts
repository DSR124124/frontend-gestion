import { Component, OnInit, OnDestroy } from '@angular/core';
import { EstadisticaLanzamiento } from '../../interfaces/estadistica-lanzamiento.interface';
import { EstadisticaLanzamientoService } from '../../services/estadistica-lanzamiento.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { LanzamientoService } from '../../../lanzamientos/services/lanzamiento.service';
import { Lanzamiento } from '../../../lanzamientos/interfaces/lanzamiento.interface';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Aplicacion } from '../../../aplicaciones/interfaces/aplicacion.interface';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ColumnType, FilterType, TableConfig } from '../../../../../shared/components/data-table/interfaces/table-column.interface';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    DataTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  estadisticas: EstadisticaLanzamiento[] = [];
  estadisticasTableConfig!: TableConfig;
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
    this.estadisticasTableConfig = this.buildEstadisticasTableConfig([]);
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => {
        this.loading = loading;
        this.estadisticasTableConfig = { ...this.estadisticasTableConfig, loading };
      }
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
  }

  async cargarDatos(): Promise<void> {
    this.loadingService.show();

    try {
      // Cargar estadísticas y lanzamientos en paralelo
      const [estadisticas, lanzamientos] = await Promise.all([
        firstValueFrom(this.estadisticaLanzamientoService.listarTodas()),
        firstValueFrom(this.lanzamientoService.listar())
      ]);

      // Crear un mapa de lanzamientos por idLanzamiento para enriquecer las estadísticas
      const lanzamientosMap = new Map<number, Lanzamiento>();
      lanzamientos.forEach(lanzamiento => {
        lanzamientosMap.set(lanzamiento.idLanzamiento, lanzamiento);
      });

      // Enriquecer estadísticas con fecha de lanzamiento
      this.estadisticas = estadisticas.map(estadistica => {
        const lanzamiento = lanzamientosMap.get(estadistica.idLanzamiento);
        if (lanzamiento && !estadistica.fechaLanzamiento) {
          estadistica.fechaLanzamiento = lanzamiento.fechaLanzamiento || lanzamiento.fechaPublicacion || null;
        }
        return estadistica;
      });

      // Preparar data para la tabla compartida (evitar booleanos crudos en UI)
      const estadisticasTableData = this.estadisticas.map(est => ({
        ...est,
        critico: est.esCritico ? 'Sí' : '-',
        usuariosConAcceso: est.usuariosConAcceso ?? 0,
        gruposAsignados: est.gruposAsignados ?? 0,
      }));
      this.estadisticasTableConfig = this.buildEstadisticasTableConfig(estadisticasTableData);

      this.totalLanzamientos = lanzamientos.length;
      this.calcularPromedioGrupos();
      this.crearGraficos();

      // Cargar aplicaciones
      const aplicaciones = await firstValueFrom(this.aplicacionService.listar());
      this.aplicaciones = aplicaciones.filter(a => a.activo);
      this.totalAplicaciones = this.aplicaciones.length;

      // Cargar usuarios
      const usuarios = await firstValueFrom(this.usuarioService.listar());
      this.totalUsuarios = usuarios.filter(u => u.activo).length;
    } catch (error) {
      this.messageService.error('Error al cargar los datos del dashboard');
    } finally {
      this.loadingService.hide();
    }
  }

  private buildEstadisticasTableConfig(data: any[]): TableConfig {
    return {
      data,
      loading: this.loading,
      rowsPerPage: 10,
      rowsPerPageOptions: [10, 25, 50],
      showCurrentPageReport: true,
      currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} lanzamientos',
      emptyMessage: 'No se encontraron estadísticas',
      globalSearchPlaceholder: 'Buscar en estadísticas...',
      columns: [
        {
          field: 'nombreAplicacion',
          header: 'Aplicación',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          align: 'left',
          width: '260px',
          mobileVisible: true,
        },
        {
          field: 'version',
          header: 'Versión',
          type: ColumnType.TEXT,
          filterType: FilterType.TEXT,
          width: '120px',
          mobileVisible: true,
        },
        {
          field: 'estado',
          header: 'Estado',
          type: ColumnType.DROPDOWN,
          filterType: FilterType.DROPDOWN,
          width: '150px',
          dropdownOptions: [
            { label: 'Activo', value: 'activo' },
            { label: 'Borrador', value: 'borrador' },
            { label: 'Deprecado', value: 'deprecado' },
            { label: 'Retirado', value: 'retirado' },
          ],
          getLabel: (value: any) => {
            if (!value) return '-';
            const v = String(value).toLowerCase();
            return v.charAt(0).toUpperCase() + v.slice(1);
          },
          mobileVisible: true,
        },
        {
          field: 'fechaLanzamiento',
          header: 'Fecha Lanzamiento',
          type: ColumnType.DATE,
          filterType: FilterType.DATE,
          dateFormat: 'dd/MM/yyyy',
          width: '170px',
          mobileVisible: false,
        },
        {
          field: 'usuariosConAcceso',
          header: 'Usuarios',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          align: 'right',
          width: '120px',
          mobileVisible: false,
        },
        {
          field: 'gruposAsignados',
          header: 'Grupos',
          type: ColumnType.NUMBER,
          filterType: FilterType.NUMBER,
          align: 'right',
          width: '110px',
          mobileVisible: false,
        },
        {
          field: 'critico',
          header: 'Crítico',
          type: ColumnType.TEXT,
          filterType: FilterType.DROPDOWN,
          dropdownOptions: [
            { label: 'Sí', value: 'Sí' },
            { label: 'No', value: '-' },
          ],
          width: '90px',
          mobileVisible: true,
        },
      ],
    };
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
  }

  crearGraficoUsuariosPorAplicacion(): void {
    const canvas = document.getElementById('chartUsuariosPorAplicacion') as HTMLCanvasElement;
    if (!canvas) {
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
      // Silenciar errores de render de chart en UI
    }
  }

  crearGraficoLanzamientosPorEstado(): void {
    const canvas = document.getElementById('chartLanzamientosPorEstado') as HTMLCanvasElement;
    if (!canvas) {
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
      // Silenciar errores de render de chart en UI
    }
  }

  crearGraficoLanzamientosPorAplicacion(): void {
    const canvas = document.getElementById('chartLanzamientosPorAplicacion') as HTMLCanvasElement;
    if (!canvas) {
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
      // Silenciar errores de render de chart en UI
    }
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
    } catch (error) {
      return fecha || '-';
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

