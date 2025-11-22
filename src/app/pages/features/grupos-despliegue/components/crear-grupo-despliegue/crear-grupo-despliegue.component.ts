import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GrupoDespliegueService } from '../../services/grupo-despliegue.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { GrupoDespliegue, GrupoDespliegueDTO } from '../../interfaces/grupo-despliegue.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-grupo-despliegue',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-grupo-despliegue.component.html',
  styleUrl: './crear-grupo-despliegue.component.css',
  providers: [MessageService]
})
export class CrearGrupoDespliegueComponent implements OnInit, OnDestroy {
  @Output() grupoDespliegueCreado = new EventEmitter<void>();
  @Output() grupoDespliegueActualizado = new EventEmitter<void>();

  grupoDespliegueForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  modoEdicion: boolean = false;
  grupoDespliegueId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private grupoDespliegueService: GrupoDespliegueService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.grupoDespliegueForm = this.fb.group({
      nombreGrupo: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      ordenPrioridad: [null, [Validators.min(1)]],
      porcentajeUsuarios: [null, [Validators.min(0), Validators.max(100)]],
      activo: [true]
    });
  }

  showDialog(grupoDespliegue?: GrupoDespliegue): void {
    this.modoEdicion = !!grupoDespliegue;
    this.grupoDespliegueId = grupoDespliegue?.idGrupo || null;
    this.visible = true;
    this.submitted = false;

    if (grupoDespliegue) {
      this.grupoDespliegueForm.patchValue({
        nombreGrupo: grupoDespliegue.nombreGrupo,
        descripcion: grupoDespliegue.descripcion || '',
        ordenPrioridad: grupoDespliegue.ordenPrioridad || null,
        porcentajeUsuarios: grupoDespliegue.porcentajeUsuarios || null,
        activo: grupoDespliegue.activo
      });
    } else {
      this.grupoDespliegueForm.reset({
        activo: true
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.grupoDespliegueId = null;
    this.grupoDespliegueForm.reset({
      activo: true
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.grupoDespliegueForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor, complete todos los campos requeridos correctamente',
        life: 5000
      });
      return;
    }

    const grupoDespliegueDTO: GrupoDespliegueDTO = {
      nombreGrupo: this.grupoDespliegueForm.value.nombreGrupo,
      descripcion: this.grupoDespliegueForm.value.descripcion || undefined,
      ordenPrioridad: this.grupoDespliegueForm.value.ordenPrioridad || undefined,
      porcentajeUsuarios: this.grupoDespliegueForm.value.porcentajeUsuarios || undefined,
      activo: this.grupoDespliegueForm.value.activo ?? true
    };

    this.loadingService.show();

    if (this.modoEdicion && this.grupoDespliegueId) {
      const sub = this.grupoDespliegueService.actualizar(this.grupoDespliegueId, grupoDespliegueDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Grupo de despliegue actualizado correctamente',
            life: 5000
          });
          this.hideDialog();
          this.grupoDespliegueActualizado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar el grupo de despliegue';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
          });
        }
      });
      this.subscriptions.push(sub);
    } else {
      const sub = this.grupoDespliegueService.crear(grupoDespliegueDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Grupo de despliegue creado correctamente',
            life: 5000
          });
          this.hideDialog();
          this.grupoDespliegueCreado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear el grupo de despliegue';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
          });
        }
      });
      this.subscriptions.push(sub);
    }
  }

  get f() {
    return this.grupoDespliegueForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.grupoDespliegueForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }
}

