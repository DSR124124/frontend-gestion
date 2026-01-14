import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AplicacionService } from '../../services/aplicacion.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Aplicacion, AplicacionDTO } from '../../interfaces/aplicacion.interface';
import { Usuario } from '../../../usuarios/interfaces/usuario.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-aplicacion',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-aplicacion.component.html',
  styleUrl: './crear-aplicacion.component.css'
})
export class CrearAplicacionComponent implements OnInit, OnDestroy {
  @Output() aplicacionCreada = new EventEmitter<void>();
  @Output() aplicacionActualizada = new EventEmitter<void>();

  aplicacionForm!: FormGroup;
  usuarios: Usuario[] = [];
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;
  modoEdicion: boolean = false;
  aplicacionId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private aplicacionService: AplicacionService,
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.loadingService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.aplicacionForm = this.fb.group({
      nombreAplicacion: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: ['', [Validators.maxLength(500)]],
      codigoProducto: ['', [Validators.maxLength(50)]],
      repositorioUrl: ['', [Validators.maxLength(500)]],
      url: ['', [Validators.maxLength(500)]],
      responsableId: [null],
      activo: [true]
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
        const errorMessage = error?.message || 'Error al cargar los usuarios';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
    this.subscriptions.push(sub);
  }

  showDialog(aplicacion?: Aplicacion): void {
    this.modoEdicion = !!aplicacion;
    this.aplicacionId = aplicacion?.idAplicacion || null;
    this.visible = true;
    this.submitted = false;

    if (aplicacion) {
      // Cargar datos de la aplicación para editar
      this.aplicacionForm.patchValue({
        nombreAplicacion: aplicacion.nombreAplicacion,
        descripcion: aplicacion.descripcion || '',
        codigoProducto: aplicacion.codigoProducto || '',
        repositorioUrl: aplicacion.repositorioUrl || '',
        url: aplicacion.url || '',
        responsableId: aplicacion.responsableId || null,
        activo: aplicacion.activo
      });
    } else {
      // Resetear formulario para crear
      this.aplicacionForm.reset({
        activo: true
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.aplicacionId = null;
    this.aplicacionForm.reset({
      activo: true
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.aplicacionForm.invalid) {
      this.messageService.warn('Por favor, complete todos los campos requeridos correctamente', 'Validación', 5000);
      this.aplicacionForm.markAllAsTouched();
      return;
    }

    const aplicacionDTO: AplicacionDTO = {
      nombreAplicacion: this.aplicacionForm.value.nombreAplicacion,
      descripcion: this.aplicacionForm.value.descripcion || undefined,
      codigoProducto: this.aplicacionForm.value.codigoProducto || undefined,
      repositorioUrl: this.aplicacionForm.value.repositorioUrl || undefined,
      url: this.aplicacionForm.value.url || undefined,
      responsableId: this.aplicacionForm.value.responsableId || undefined,
      activo: this.aplicacionForm.value.activo ?? true
    };

    this.loadingService.show();

    if (this.modoEdicion && this.aplicacionId) {
      const sub = this.aplicacionService.actualizar(this.aplicacionId, aplicacionDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.success('Aplicación actualizada correctamente', 'Éxito', 5000);
          this.hideDialog();
          this.aplicacionActualizada.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar la aplicación';
          this.messageService.error(errorMessage, 'Error', 5000);
        }
      });
      this.subscriptions.push(sub);
    } else {
      const sub = this.aplicacionService.crear(aplicacionDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.success('Aplicación creada correctamente', 'Éxito', 5000);
          this.hideDialog();
          this.aplicacionCreada.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear la aplicación';
          this.messageService.error(errorMessage, 'Error', 5000);
        }
      });
      this.subscriptions.push(sub);
    }
  }

  get f() {
    return this.aplicacionForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.aplicacionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  onFieldChange(fieldName: string): void {
    const field = this.aplicacionForm.get(fieldName);
    if (field) {
      field.markAsDirty();
      field.updateValueAndValidity();
    }
  }
}

