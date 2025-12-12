import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificacionService } from '../../services/notificacion.service';
import { AplicacionService } from '../../../aplicaciones/services/aplicacion.service';
import { UsuarioService } from '../../../usuarios/services/usuario.service';
import { GrupoDespliegueService } from '../../../grupos-despliegue/services/grupo-despliegue.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../../../../../shared/services/loading.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { Notificacion, NotificacionDTO } from '../../interfaces/notificacion.interface';
import { Aplicacion } from '../../../aplicaciones/interfaces/aplicacion.interface';
import { Usuario } from '../../../usuarios/interfaces/usuario.interface';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../full-pages/auth/services/auth.service';

@Component({
  selector: 'app-crear-notificacion',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule
  ],
  templateUrl: './crear-notificacion.component.html',
  styleUrl: './crear-notificacion.component.css',
  providers: [MessageService]
})
export class CrearNotificacionComponent implements OnInit, OnDestroy {
  @Output() notificacionCreada = new EventEmitter<void>();
  @Output() notificacionActualizada = new EventEmitter<void>();

  notificacionForm!: FormGroup;
  aplicaciones: Aplicacion[] = [];
  usuarios: Usuario[] = [];
  grupos: any[] = [];
  visible: boolean = false;
  submitted: boolean = false;
  modoEdicion: boolean = false;
  notificacionId: number | null = null;
  private subscriptions: Subscription[] = [];

  tiposNotificacion = [
    { label: 'Info', value: 'info' },
    { label: 'Warning', value: 'warning' },
    { label: 'Error', value: 'error' },
    { label: 'Success', value: 'success' },
    { label: 'Critical', value: 'critical' }
  ];

  prioridades = [
    { label: 'Baja', value: 'baja' },
    { label: 'Normal', value: 'normal' },
    { label: 'Alta', value: 'alta' },
    { label: 'Urgente', value: 'urgente' }
  ];

  constructor(
    private fb: FormBuilder,
    private notificacionService: NotificacionService,
    private aplicacionService: AplicacionService,
    private usuarioService: UsuarioService,
    private grupoService: GrupoDespliegueService,
    private messageService: MessageService,
    private loadingService: LoadingService,
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.notificacionForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(255)]],
      mensaje: ['', [Validators.required]],
      tipoNotificacion: ['info'],
      prioridad: ['normal'],
      idAplicacion: [null, [Validators.required]],
      fechaExpiracion: [null],
      fechaEnvio: [null],
      requiereConfirmacion: [false],
      mostrarComoRecordatorio: [true],
      activo: [true],
      datosAdicionales: [null],
      idUsuarios: [[]],
      idGrupos: [[]]
    });
  }

  cargarDatos(): void {
    this.loadingService.show();

    // Cargar aplicaciones
    const subAplicaciones = this.aplicacionService.listar().subscribe({
      next: (aplicaciones) => {
        this.aplicaciones = aplicaciones.filter(app => app.activo);
      },
      error: (error) => {
        console.error('Error al cargar aplicaciones:', error);
      }
    });

    // Cargar usuarios
    const subUsuarios = this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.filter(usuario => usuario.activo);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });

    // Cargar grupos
    const subGrupos = this.grupoService.listar().subscribe({
      next: (grupos) => {
        this.grupos = grupos.filter(grupo => grupo.activo).map(grupo => ({
          label: grupo.nombreGrupo,
          value: grupo.idGrupo
        }));
      },
      error: (error) => {
        console.error('Error al cargar grupos:', error);
      }
    });

    this.subscriptions.push(subAplicaciones, subUsuarios, subGrupos);
    this.loadingService.hide();
  }

  showDialog(notificacion?: Notificacion): void {
    this.modoEdicion = !!notificacion;
    this.notificacionId = notificacion?.idNotificacion || null;
    this.visible = true;
    this.submitted = false;

    if (notificacion) {
      // Cargar datos de la notificación para editar
      this.notificacionForm.patchValue({
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        tipoNotificacion: notificacion.tipoNotificacion,
        prioridad: notificacion.prioridad,
        idAplicacion: notificacion.idAplicacion,
        fechaExpiracion: notificacion.fechaExpiracion ? new Date(notificacion.fechaExpiracion) : null,
        fechaEnvio: notificacion.fechaEnvio ? new Date(notificacion.fechaEnvio) : null,
        requiereConfirmacion: notificacion.requiereConfirmacion,
        mostrarComoRecordatorio: notificacion.mostrarComoRecordatorio,
        activo: notificacion.activo,
        datosAdicionales: notificacion.datosAdicionales
      });
    } else {
      // Resetear formulario para crear
      const currentUser = this.authService.getCurrentUser();
      this.notificacionForm.reset({
        tipoNotificacion: 'info',
        prioridad: 'normal',
        requiereConfirmacion: false,
        mostrarComoRecordatorio: true,
        activo: true,
        idUsuarios: [],
        idGrupos: []
      });
    }
  }

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.modoEdicion = false;
    this.notificacionId = null;
    this.notificacionForm.reset({
      tipoNotificacion: 'info',
      prioridad: 'normal',
      requiereConfirmacion: false,
      mostrarComoRecordatorio: true,
      activo: true,
      idUsuarios: [],
      idGrupos: []
    });
  }

  guardar(): void {
    this.submitted = true;

    if (this.notificacionForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor, complete todos los campos requeridos correctamente',
        life: 5000
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado',
        life: 5000
      });
      return;
    }

    const formValue = this.notificacionForm.value;
    const notificacionDTO: NotificacionDTO = {
      titulo: formValue.titulo,
      mensaje: formValue.mensaje,
      tipoNotificacion: formValue.tipoNotificacion || 'info',
      prioridad: formValue.prioridad || 'normal',
      idAplicacion: formValue.idAplicacion,
      creadoPor: currentUser.idUsuario,
      fechaExpiracion: formValue.fechaExpiracion ? formValue.fechaExpiracion.toISOString() : null,
      fechaEnvio: formValue.fechaEnvio ? formValue.fechaEnvio.toISOString() : null,
      requiereConfirmacion: formValue.requiereConfirmacion ?? false,
      mostrarComoRecordatorio: formValue.mostrarComoRecordatorio ?? true,
      activo: formValue.activo ?? true,
      datosAdicionales: formValue.datosAdicionales || null,
      idUsuarios: formValue.idUsuarios && formValue.idUsuarios.length > 0 ? formValue.idUsuarios : undefined,
      idGrupos: formValue.idGrupos && formValue.idGrupos.length > 0 ? formValue.idGrupos : undefined
    };

    this.loadingService.show();

    if (this.modoEdicion && this.notificacionId) {
      // Actualizar notificación existente
      const sub = this.notificacionService.actualizar(this.notificacionId, notificacionDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Notificación actualizada correctamente',
            life: 5000
          });
          this.hideDialog();
          this.notificacionActualizada.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al actualizar la notificación';
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
      // Crear nueva notificación
      const sub = this.notificacionService.crear(notificacionDTO).subscribe({
        next: () => {
          this.loadingService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Notificación creada correctamente',
            life: 5000
          });
          this.hideDialog();
          this.notificacionCreada.emit();
        },
        error: (error) => {
          this.loadingService.hide();
          const errorMessage = error?.message || error?.error?.message || 'Error al crear la notificación';
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
    return this.notificacionForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.notificacionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }
}

