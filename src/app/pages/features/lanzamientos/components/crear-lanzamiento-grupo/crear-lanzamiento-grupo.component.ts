import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LanzamientoGrupoService } from '../../services/lanzamiento-grupo.service';
import { LanzamientoService } from '../../../lanzamientos/services/lanzamiento.service';
import { GrupoDespliegueService } from '../../../grupos-despliegue/services/grupo-despliegue.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { LanzamientoGrupo, LanzamientoGrupoDTO } from '../../interfaces/lanzamiento-grupo.interface';
import { Lanzamiento } from '../../../lanzamientos/interfaces/lanzamiento.interface';
import { GrupoDespliegue } from '../../../grupos-despliegue/interfaces/grupo-despliegue.interface';
import { Usuario } from '../../../usuarios/interfaces/usuario.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-lanzamiento-grupo',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-lanzamiento-grupo.component.html',
  styleUrl: './crear-lanzamiento-grupo.component.css',
  providers: [MessageService]
})
export class CrearLanzamientoGrupoComponent implements OnInit, OnDestroy {
  @Output() lanzamientoGrupoCreado = new EventEmitter<void>();
  @Output() lanzamientoGrupoActualizado = new EventEmitter<void>();

  lanzamientoGrupoForm!: FormGroup;
  lanzamientos: Lanzamiento[] = [];
  gruposDespliegue: GrupoDespliegue[] = [];
  usuarios: Usuario[] = [];
  visible: boolean = false;
  submitted: boolean = false;
  modoEdicion: boolean = false;
  lanzamientoGrupoId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private lanzamientoGrupoService: LanzamientoGrupoService,
    private lanzamientoService: LanzamientoService,
    private grupoDespliegueService: GrupoDespliegueService,
    private usuarioService: UsuarioService,
    private messageService: MessageService,
    private loadingService: LoadingService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarLanzamientos();
    this.cargarGruposDespliegue();
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.lanzamientoGrupoForm = this.fb.group({
      idLanzamiento: [null, [Validators.required]],
      idGrupo: [null, [Validators.required]],
      fechaDisponibilidad: [null],
      fechaFinDisponibilidad: [null],
      asignadoPor: [null],
      notificacionEnviada: [false],
      activo: [true],
      notas: ['']
    });
  }

  cargarLanzamientos(): void {
    this.loadingService.show();
    const sub = this.lanzamientoService.listar().subscribe({
      next: (lanzamientos) => {
        this.lanzamientos = lanzamientos;
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Error al cargar los lanzamientos',
          life: 5000
        });
      }
    });
    this.subscriptions.push(sub);
  }

  cargarGruposDespliegue(): void {
    this.loadingService.show();
    const sub = this.grupoDespliegueService.listar().subscribe({
      next: (grupos) => {
        this.gruposDespliegue = grupos.filter(grupo => grupo.activo);
        this.loadingService.hide();
      },
      error: (error) => {
        this.loadingService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Error al cargar los grupos de despliegue',
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

  showDialog(lanzamientoGrupo?: LanzamientoGrupo): void {
    this.modoEdicion = !!lanzamientoGrupo;
    this.lanzamientoGrupoId = lanzamientoGrupo?.idLanzamientoGrupo || null;
    this.visible = true;
    this.submitted = false;

    if (lanzamientoGrupo) {
      const fechaDisponibilidad = lanzamientoGrupo.fechaDisponibilidad 
        ? new Date(lanzamientoGrupo.fechaDisponibilidad).toISOString().slice(0, 16)
        : null;
      
      const fechaFinDisponibilidad = lanzamientoGrupo.fechaFinDisponibilidad 
        ? new Date(lanzamientoGrupo.fechaFinDisponibilidad).toISOString().slice(0, 16)
        : null;
      
      this.lanzamientoGrupoForm.patchValue({
        idLanzamiento: lanzamientoGrupo.idLanzamiento,
        idGrupo: lanzamientoGrupo.idGrupo,
        fechaDisponibilidad: fechaDisponibilidad,
        fechaFinDisponibilidad: fechaFinDisponibilidad,
        asignadoPor: lanzamientoGrupo.asignadoPor || null,
        notificacionEnviada: lanzamientoGrupo.notificacionEnviada,
        activo: lanzamientoGrupo.activo,
        notas: lanzamientoGrupo.notas || ''
      });
    } else {
      this.lanzamientoGrupoForm.reset({
        notificacionEnviada: false,
        activo: true
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.lanzamientoGrupoId = null;
    this.lanzamientoGrupoForm.reset({
      notificacionEnviada: false,
      activo: true
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.lanzamientoGrupoForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor, complete todos los campos requeridos correctamente',
        life: 5000
      });
      return;
    }

    const formValue = this.lanzamientoGrupoForm.value;
    const fechaDisponibilidad = formValue.fechaDisponibilidad 
      ? new Date(formValue.fechaDisponibilidad).toISOString() 
      : undefined;
    
    const fechaFinDisponibilidad = formValue.fechaFinDisponibilidad 
      ? new Date(formValue.fechaFinDisponibilidad).toISOString() 
      : undefined;

    const lanzamientoGrupoDTO: LanzamientoGrupoDTO = {
      idLanzamiento: formValue.idLanzamiento,
      idGrupo: formValue.idGrupo,
      fechaDisponibilidad: fechaDisponibilidad,
      fechaFinDisponibilidad: fechaFinDisponibilidad,
      asignadoPor: formValue.asignadoPor || undefined,
      notificacionEnviada: formValue.notificacionEnviada ?? false,
      activo: formValue.activo ?? true,
      notas: formValue.notas || undefined
    };

    this.loadingService.show();

    if (this.modoEdicion && this.lanzamientoGrupoId) {
      const sub = this.lanzamientoGrupoService.actualizar(this.lanzamientoGrupoId, lanzamientoGrupoDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Asignación lanzamiento-grupo actualizada correctamente',
            life: 5000
          });
          this.hideDialog();
          this.lanzamientoGrupoActualizado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar la asignación lanzamiento-grupo';
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
      const sub = this.lanzamientoGrupoService.crear(lanzamientoGrupoDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Asignación lanzamiento-grupo creada correctamente',
            life: 5000
          });
          this.hideDialog();
          this.lanzamientoGrupoCreado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear la asignación lanzamiento-grupo';
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
    return this.lanzamientoGrupoForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.lanzamientoGrupoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getLanzamientoDisplay(lanzamiento: Lanzamiento): string {
    return `${lanzamiento.version} - ${lanzamiento.nombreAplicacion || ''}`;
  }
}

