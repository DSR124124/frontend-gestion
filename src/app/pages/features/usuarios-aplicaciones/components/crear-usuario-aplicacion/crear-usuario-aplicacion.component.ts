import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioAplicacionService } from '../../services/usuario-aplicacion.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { UsuarioAplicacion, UsuarioAplicacionDTO } from '../../interfaces/usuario-aplicacion.interface';
import { Usuario } from '../../../usuarios/interfaces/usuario.interface';
import { Aplicacion } from '../../../aplicaciones/interfaces/aplicacion.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-usuario-aplicacion',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-usuario-aplicacion.component.html',
  styleUrl: './crear-usuario-aplicacion.component.css',
  providers: [MessageService]
})
export class CrearUsuarioAplicacionComponent implements OnInit, OnDestroy {
  @Output() usuarioAplicacionCreado = new EventEmitter<void>();
  @Output() usuarioAplicacionActualizado = new EventEmitter<void>();

  usuarioAplicacionForm!: FormGroup;
  usuarios: Usuario[] = [];
  aplicaciones: Aplicacion[] = [];
  visible: boolean = false;
  submitted: boolean = false;
  modoEdicion: boolean = false;
  usuarioAplicacionId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private usuarioAplicacionService: UsuarioAplicacionService,
    private usuarioService: UsuarioService,
    private aplicacionService: AplicacionService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarAplicaciones();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.usuarioAplicacionForm = this.fb.group({
      idUsuario: [null, [Validators.required]],
      idAplicacion: [null, [Validators.required]],
      fechaUltimoAcceso: [null],
      licenciaActiva: [true],
      fechaExpiracionLicencia: [null],
      registradoPor: [null],
      notas: ['']
    });
  }

  cargarUsuarios(): void {
    this.loadingService.show();
    const sub = this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.filter(usuario => usuario.activo);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Error al cargar los usuarios',
          life: 5000
        });
      }
    });
    this.subscriptions.push(sub);
  }

  cargarAplicaciones(): void {
    this.loadingService.show();
    const sub = this.aplicacionService.listar().subscribe({
      next: (aplicaciones) => {
        this.aplicaciones = aplicaciones.filter(app => app.activo);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Error al cargar las aplicaciones',
          life: 5000
        });
      }
    });
    this.subscriptions.push(sub);
  }

  showDialog(usuarioAplicacion?: UsuarioAplicacion): void {
    this.modoEdicion = !!usuarioAplicacion;
    this.usuarioAplicacionId = usuarioAplicacion?.idUsuarioAplicacion || null;
    this.visible = true;
    this.submitted = false;

    if (usuarioAplicacion) {
      const fechaUltimoAcceso = usuarioAplicacion.fechaUltimoAcceso 
        ? new Date(usuarioAplicacion.fechaUltimoAcceso).toISOString().slice(0, 16)
        : null;
      
      const fechaExpiracion = usuarioAplicacion.fechaExpiracionLicencia 
        ? new Date(usuarioAplicacion.fechaExpiracionLicencia).toISOString().slice(0, 16)
        : null;
      
      this.usuarioAplicacionForm.patchValue({
        idUsuario: usuarioAplicacion.idUsuario,
        idAplicacion: usuarioAplicacion.idAplicacion,
        fechaUltimoAcceso: fechaUltimoAcceso,
        licenciaActiva: usuarioAplicacion.licenciaActiva,
        fechaExpiracionLicencia: fechaExpiracion,
        registradoPor: usuarioAplicacion.registradoPor || null,
        notas: usuarioAplicacion.notas || ''
      });
    } else {
      this.usuarioAplicacionForm.reset({
        licenciaActiva: true
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.usuarioAplicacionId = null;
    this.usuarioAplicacionForm.reset({
      licenciaActiva: true
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.usuarioAplicacionForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor, complete todos los campos requeridos correctamente',
        life: 5000
      });
      return;
    }

    const formValue = this.usuarioAplicacionForm.value;
    const fechaUltimoAcceso = formValue.fechaUltimoAcceso 
      ? new Date(formValue.fechaUltimoAcceso).toISOString() 
      : undefined;
    
    const fechaExpiracion = formValue.fechaExpiracionLicencia 
      ? new Date(formValue.fechaExpiracionLicencia).toISOString() 
      : undefined;

    const usuarioAplicacionDTO: UsuarioAplicacionDTO = {
      idUsuario: formValue.idUsuario,
      idAplicacion: formValue.idAplicacion,
      fechaUltimoAcceso: fechaUltimoAcceso,
      licenciaActiva: formValue.licenciaActiva ?? true,
      fechaExpiracionLicencia: fechaExpiracion,
      registradoPor: formValue.registradoPor || undefined,
      notas: formValue.notas || undefined
    };

    this.loadingService.show();

    if (this.modoEdicion && this.usuarioAplicacionId) {
      const sub = this.usuarioAplicacionService.actualizar(this.usuarioAplicacionId, usuarioAplicacionDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Relación usuario-aplicación actualizada correctamente',
            life: 5000
          });
          this.hideDialog();
          this.usuarioAplicacionActualizado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar la relación usuario-aplicación';
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
      const sub = this.usuarioAplicacionService.crear(usuarioAplicacionDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Relación usuario-aplicación creada correctamente',
            life: 5000
          });
          this.hideDialog();
          this.usuarioAplicacionCreado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear la relación usuario-aplicación';
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
    return this.usuarioAplicacionForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.usuarioAplicacionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }
}

