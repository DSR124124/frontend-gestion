import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../../../../core/services/message.service';
import { FullscreenService } from '../../../../../shared/services/fullscreen.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  logoFloating = true;
  buttonLabel = 'Pantalla completa';
  isFullscreen = false;
  backgroundImageStyle: { [key: string]: string } = {};
  private fullscreenSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private fullscreenService: FullscreenService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit(): void {
    // Configurar imagen de fondo
    this.backgroundImageStyle = {
      'background-image': `url('img/logo/fondo.jpg')`
    };

    // Verificar si hay un error en los query params
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.messageService.error(params['error'], 'Acceso Denegado');
      }
    });

    // Suscribirse al estado de pantalla completa
    this.fullscreenSubscription = this.fullscreenService.isFullscreen$.subscribe(isFullscreen => {
      this.isFullscreen = isFullscreen;
      this.buttonLabel = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';
    });
  }

  ngOnDestroy(): void {
    if (this.fullscreenSubscription) {
      this.fullscreenSubscription.unsubscribe();
    }
  }

  toggleFullscreen(): void {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  private enterFullscreen(): void {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.loginForm.invalid) {
      this.messageService.warn('Por favor, complete todos los campos correctamente', 'Validación');
      return;
    }

    this.loading = true;
    const credentials = {
      usernameOrEmail: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;

        // Verificar si es administrador antes de mostrar mensajes
        if (this.authService.isAdmin()) {
          this.messageService.success(`Hola ${response.nombreCompleto || response.username}`, 'Bienvenido');
          this.router.navigate(['/']);
        } else {
          this.authService.logout();
          this.messageService.error('Solo los administradores pueden acceder al sistema', 'Acceso Denegado');
        }
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error.error?.mensaje || error.error?.message || 'Credenciales inválidas';
        this.messageService.error(errorMessage, 'Error de Autenticación');
      }
    });
  }
}

