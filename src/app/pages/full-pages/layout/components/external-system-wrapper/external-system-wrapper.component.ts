import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExternalSystemService } from '../../../../../core/services/external-system.service';
import { ExternalSystem } from '../../../../../core/interfaces/external-system.interface';
import { MessageService } from 'primeng/api';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-external-system-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    ...PrimeNGModules
  ],
  templateUrl: './external-system-wrapper.component.html',
  styleUrl: './external-system-wrapper.component.css',
  providers: [MessageService]
})
export class ExternalSystemWrapperComponent implements OnInit, OnDestroy {
  @Input() systemId?: string;

  system?: ExternalSystem;
  systemUrl: string = '';
  loading: boolean = true;
  error: string | null = null;
  private routeSubscription?: Subscription;

  constructor(
    private externalSystemService: ExternalSystemService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe(params => {
      const id = this.systemId || params['id'];
      if (id) {
        this.loadSystem(id);
      } else {
        this.error = 'ID del sistema no proporcionado';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private loadSystem(id: string): void {
    this.loading = true;
    this.error = null;

    const system = this.externalSystemService.getSystemById(id);

    if (!system) {
      this.error = `Sistema con ID "${id}" no encontrado`;
      this.loading = false;
      return;
    }

    if (!this.externalSystemService.canAccessSystem(system)) {
      this.error = 'No tiene permisos para acceder a este sistema';
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Acceso Denegado',
        detail: 'No tiene los permisos necesarios para acceder a este sistema',
        life: 5000
      });
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
      return;
    }

    this.system = system;
    this.systemUrl = this.externalSystemService.getSystemUrlWithAuth(system);
    this.loading = false;
  }

  onIframeLoad(): void {
    this.loading = false;
  }

  onIframeError(): void {
    this.loading = false;
    this.error = 'Error al cargar el sistema externo';
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar el sistema externo. Verifique la URL y la conexión.',
      life: 5000
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  retry(): void {
    if (this.system) {
      this.loadSystem(this.system.id);
    }
  }
}

