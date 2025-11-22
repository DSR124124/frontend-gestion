import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LanzamientoService } from '../../services/lanzamiento.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Lanzamiento, LanzamientoDTO } from '../../interfaces/lanzamiento.interface';
import { Aplicacion } from '../../../aplicaciones/interfaces/aplicacion.interface';
import { Usuario } from '../../../usuarios/interfaces/usuario.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-lanzamiento',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-lanzamiento.component.html',
  styleUrl: './crear-lanzamiento.component.css',
  providers: [MessageService]
})
export class CrearLanzamientoComponent implements OnInit, OnDestroy {
  @Output() lanzamientoCreado = new EventEmitter<void>();
  @Output() lanzamientoActualizado = new EventEmitter<void>();

  lanzamientoForm!: FormGroup;
  aplicaciones: Aplicacion[] = [];
  usuarios: Usuario[] = [];
  estados: { label: string; value: string }[] = [
    { label: 'Borrador', value: 'borrador' },
    { label: 'Activo', value: 'activo' },
    { label: 'Deprecado', value: 'deprecado' },
    { label: 'Retirado', value: 'retirado' }
  ];
  visible: boolean = false;
  submitted: boolean = false;
  modoEdicion: boolean = false;
  lanzamientoId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private lanzamientoService: LanzamientoService,
    private aplicacionService: AplicacionService,
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarAplicaciones();
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.lanzamientoForm = this.fb.group({
      idAplicacion: [null, [Validators.required]],
      version: ['', [Validators.required, Validators.maxLength(50)]],
      estado: ['borrador', [Validators.required]],
      fechaLanzamiento: [null],
      notasVersion: ['', [Validators.required]],
      urlDescarga: ['', [Validators.maxLength(500)]],
      tamanoArchivo: [null],
      checksumSha256: ['', [Validators.maxLength(64)]],
      esCritico: [false],
      requiereReinicio: [false],
      publicadoPor: [null]
    });
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

  showDialog(lanzamiento?: Lanzamiento): void {
    this.modoEdicion = !!lanzamiento;
    this.lanzamientoId = lanzamiento?.idLanzamiento || null;
    this.visible = true;
    this.submitted = false;

    if (lanzamiento) {
      // Cargar datos del lanzamiento para editar
      // Convertir fecha ISO a formato datetime-local (YYYY-MM-DDTHH:mm)
      let fechaLanzamiento: string | null = null;
      if (lanzamiento.fechaLanzamiento) {
        const date = new Date(lanzamiento.fechaLanzamiento);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        fechaLanzamiento = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      this.lanzamientoForm.patchValue({
        idAplicacion: lanzamiento.idAplicacion,
        version: lanzamiento.version,
        estado: lanzamiento.estado,
        fechaLanzamiento: fechaLanzamiento,
        notasVersion: lanzamiento.notasVersion,
        urlDescarga: lanzamiento.urlDescarga || '',
        tamanoArchivo: lanzamiento.tamanoArchivo || null,
        checksumSha256: lanzamiento.checksumSha256 || '',
        esCritico: lanzamiento.esCritico,
        requiereReinicio: lanzamiento.requiereReinicio,
        publicadoPor: lanzamiento.publicadoPor || null
      });
    } else {
      // Resetear formulario para crear
      this.lanzamientoForm.reset({
        estado: 'borrador',
        esCritico: false,
        requiereReinicio: false
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.lanzamientoId = null;
    this.lanzamientoForm.reset({
      estado: 'borrador',
      esCritico: false,
      requiereReinicio: false
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.lanzamientoForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor, complete todos los campos requeridos correctamente',
        life: 5000
      });
      return;
    }

    const formValue = this.lanzamientoForm.value;
    // Convertir formato datetime-local (YYYY-MM-DDTHH:mm) a ISO string
    let fechaLanzamiento: string | undefined = undefined;
    if (formValue.fechaLanzamiento) {
      // El input datetime-local devuelve el formato YYYY-MM-DDTHH:mm
      // Necesitamos agregar segundos y zona horaria para convertirlo a ISO
      const fechaStr = formValue.fechaLanzamiento;
      fechaLanzamiento = new Date(fechaStr).toISOString();
    }

    const lanzamientoDTO: LanzamientoDTO = {
      idAplicacion: formValue.idAplicacion,
      version: formValue.version,
      estado: formValue.estado || undefined,
      fechaLanzamiento: fechaLanzamiento,
      notasVersion: formValue.notasVersion,
      urlDescarga: formValue.urlDescarga || undefined,
      tamanoArchivo: formValue.tamanoArchivo || undefined,
      checksumSha256: formValue.checksumSha256 || undefined,
      esCritico: formValue.esCritico ?? false,
      requiereReinicio: formValue.requiereReinicio ?? false,
      publicadoPor: formValue.publicadoPor || undefined
    };

    this.loadingService.show();

    if (this.modoEdicion && this.lanzamientoId) {
      // Actualizar lanzamiento existente
      const sub = this.lanzamientoService.actualizar(this.lanzamientoId, lanzamientoDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Lanzamiento actualizado correctamente',
            life: 5000
          });
          this.hideDialog();
          this.lanzamientoActualizado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar el lanzamiento';
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
      // Crear nuevo lanzamiento
      const sub = this.lanzamientoService.crear(lanzamientoDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Lanzamiento creado correctamente',
            life: 5000
          });
          this.hideDialog();
          this.lanzamientoCreado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear el lanzamiento';
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
    return this.lanzamientoForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.lanzamientoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }
}

