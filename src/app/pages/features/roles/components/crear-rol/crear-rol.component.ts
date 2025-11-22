import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RolService } from '../../services/rol.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Rol, RolDTO } from '../../interfaces/rol.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-rol',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-rol.component.html',
  styleUrl: './crear-rol.component.css',
  providers: [MessageService]
})
export class CrearRolComponent implements OnInit, OnDestroy {
  @Output() rolCreado = new EventEmitter<void>();
  @Output() rolActualizado = new EventEmitter<void>();

  rolForm!: FormGroup;
  visible: boolean = false;
  submitted: boolean = false;
  modoEdicion: boolean = false;
  rolId: number | null = null;
  permisosPlaceholder: string = '{"crear_app": true, "eliminar_app": false, ...}';
  permisosEjemplo: string = '{"crear_app": true, "eliminar_app": false}';
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private rolService: RolService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // No hay datos adicionales que cargar
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.rolForm = this.fb.group({
      nombreRol: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', [Validators.maxLength(500)]],
      permisos: [''],
      activo: [true]
    });
  }

  showDialog(rol?: Rol): void {
    this.modoEdicion = !!rol;
    this.rolId = rol?.idRol || null;
    this.visible = true;
    this.submitted = false;

    if (rol) {
      // Cargar datos del rol para editar
      const permisosText = rol.permisos ? JSON.stringify(rol.permisos, null, 2) : '';
      this.rolForm.patchValue({
        nombreRol: rol.nombreRol,
        descripcion: rol.descripcion || '',
        permisos: permisosText,
        activo: rol.activo
      });
    } else {
      // Resetear formulario para crear
      this.rolForm.reset({
        activo: true,
        permisos: ''
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.rolId = null;
    this.rolForm.reset({
      activo: true,
      permisos: ''
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.rolForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor, complete todos los campos requeridos correctamente',
        life: 5000
      });
      return;
    }

    // Procesar permisos si se proporcionaron
    let permisos: { [key: string]: any } | undefined = undefined;
    const permisosText = this.rolForm.value.permisos?.trim();
    if (permisosText) {
      try {
        permisos = JSON.parse(permisosText);
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'El formato de permisos JSON no es válido',
          life: 5000
        });
        return;
      }
    }

    const rolDTO: RolDTO = {
      nombreRol: this.rolForm.value.nombreRol,
      descripcion: this.rolForm.value.descripcion || undefined,
      permisos: permisos,
      activo: this.rolForm.value.activo ?? true
    };

    this.loadingService.show();

    if (this.modoEdicion && this.rolId) {
      // Actualizar rol existente
      const sub = this.rolService.actualizar(this.rolId, rolDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Rol actualizado correctamente',
            life: 5000
          });
          this.hideDialog();
          this.rolActualizado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar el rol';
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
      // Crear nuevo rol
      const sub = this.rolService.crear(rolDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Rol creado correctamente',
            life: 5000
          });
          this.hideDialog();
          this.rolCreado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear el rol';
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
    return this.rolForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.rolForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }
}

