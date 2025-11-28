import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthFooterComponent } from '../../../../shared/components/auth-footer/auth-footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthFooterComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  errorMessage: string = '';
  loading$ = this.authService.loading$;
  showPassword: boolean = true;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      
      try {
        await this.authService.login(this.loginForm.value);
        // El servicio ya maneja la redirección
      } catch (error: any) {
        this.errorMessage = this.getErrorMessage(error.code);
      }
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.errorMessage = '';
    
    try {
      await this.authService.loginWithGoogle();
      // El servicio ya maneja la redirección
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        this.errorMessage = this.getErrorMessage(error.code);
      }
    }
  }

  onForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  onCreateAccount(): void {
    this.router.navigate(['/auth/register']);
  }

  // Obtener mensaje de error personalizado
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos',
      'auth/user-not-found': 'No existe una cuenta con este correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };

    return errorMessages[errorCode] || 'Error al iniciar sesión. Intenta nuevamente';
  }

  // Getters para acceder fácilmente a los controles del formulario
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}