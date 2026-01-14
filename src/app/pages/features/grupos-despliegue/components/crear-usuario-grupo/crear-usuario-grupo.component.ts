import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioGrupoService } from '../../services/usuario-grupo.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { GrupoDespliegueService } from '../../services/grupo-despliegue.service';
import { MessageService } from '../../../../../core/services/message.service';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { UsuarioGrupo, UsuarioGrupoDTO } from '../../interfaces/usuario-grupo.interface';
import { Usuario } from '../../../usuarios/interfaces/usuario.interface';
import { GrupoDespliegue } from '../../interfaces/grupo-despliegue.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crear-usuario-grupo',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-usuario-grupo.component.html',
  styleUrl: './crear-usuario-grupo.component.css'
})
export class CrearUsuarioGrupoComponent implements OnInit, OnDestroy {
  @Output() usuarioGrupoCreado = new EventEmitter<void>();
  @Output() usuarioGrupoActualizado = new EventEmitter<void>();

  usuarioGrupoForm!: FormGroup;
  usuarios: Usuario[] = [];
  gruposDespliegue: GrupoDespliegue[] = [];
  visible: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;
  modoEdicion: boolean = false;
  usuarioGrupoId: number | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private usuarioGrupoService: UsuarioGrupoService,
    private usuarioService: UsuarioService,
    private grupoDespliegueService: GrupoDespliegueService,
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
    this.cargarGruposDespliegue();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.usuarioGrupoForm = this.fb.group({
      idUsuario: [null, [Validators.required]],
      idGrupo: [null, [Validators.required]],
      asignadoPor: [null],
      activo: [true],
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
        const errorMessage = error?.message || 'Error al cargar los usuarios';
        this.messageService.error(errorMessage, 'Error', 5000);
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
        const errorMessage = error?.message || 'Error al cargar los grupos de despliegue';
        this.messageService.error(errorMessage, 'Error', 5000);
      }
    });
    this.subscriptions.push(sub);
  }

  showDialog(usuarioGrupo?: UsuarioGrupo): void {
    this.modoEdicion = !!usuarioGrupo;
    this.usuarioGrupoId = usuarioGrupo?.idUsuarioGrupo || null;
    this.visible = true;
    this.submitted = false;

    if (usuarioGrupo) {
      this.usuarioGrupoForm.patchValue({
        idUsuario: usuarioGrupo.idUsuario,
        idGrupo: usuarioGrupo.idGrupo,
        asignadoPor: usuarioGrupo.asignadoPor || null,
        activo: usuarioGrupo.activo,
        notas: usuarioGrupo.notas || ''
      });
    } else {
      this.usuarioGrupoForm.reset({
        activo: true
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.usuarioGrupoId = null;
    this.usuarioGrupoForm.reset({
      activo: true
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.usuarioGrupoForm.invalid) {
      this.messageService.warn('Por favor, complete todos los campos requeridos correctamente', 'Validación', 5000);
      this.usuarioGrupoForm.markAllAsTouched();
      return;
    }

    const usuarioGrupoDTO: UsuarioGrupoDTO = {
      idUsuario: this.usuarioGrupoForm.value.idUsuario,
      idGrupo: this.usuarioGrupoForm.value.idGrupo,
      asignadoPor: this.usuarioGrupoForm.value.asignadoPor || undefined,
      activo: this.usuarioGrupoForm.value.activo ?? true,
      notas: this.usuarioGrupoForm.value.notas || undefined
    };

    this.loadingService.show();

    if (this.modoEdicion && this.usuarioGrupoId) {
      const sub = this.usuarioGrupoService.actualizar(this.usuarioGrupoId, usuarioGrupoDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.success('Asignación usuario-grupo actualizada correctamente', 'Éxito', 5000);
          this.hideDialog();
          this.usuarioGrupoActualizado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar la asignación usuario-grupo';
          this.messageService.error(errorMessage, 'Error', 5000);
        }
      });
      this.subscriptions.push(sub);
    } else {
      const sub = this.usuarioGrupoService.crear(usuarioGrupoDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.success('Asignación usuario-grupo creada correctamente', 'Éxito', 5000);
          this.hideDialog();
          this.usuarioGrupoCreado.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear la asignación usuario-grupo';
          this.messageService.error(errorMessage, 'Error', 5000);
        }
      });
      this.subscriptions.push(sub);
    }
  }

  get f() {
    return this.usuarioGrupoForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.usuarioGrupoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  onFieldChange(fieldName: string): void {
    const field = this.usuarioGrupoForm.get(fieldName);
    if (field) {
      field.markAsDirty();
      field.updateValueAndValidity();
    }
  }
}

