import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../../../../core/services/message.service';
import { PrimeNGModules } from '../../../../../prime-ng/prime-ng';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ...PrimeNGModules,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    // Verificar si hay un error en los query params
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.messageService.error(params['error'], 'Acceso Denegado');
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.messageService.warn('Por favor, complete todos los campos correctamente', 'Validación');
      return;
    }

    this.loading = true;
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        this.messageService.success(`Hola ${response.nombreCompleto || response.username}`, 'Bienvenido');

        // Verificar si es administrador
        if (this.authService.isAdmin()) {
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

