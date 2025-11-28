import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthFooterComponent } from '../../../../shared/components/auth-footer/auth-footer';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, AuthFooterComponent, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  forgotPasswordForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  emailSent: boolean = false;
  loading$ = this.authService.loading$;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.valid) {
      this.errorMessage = '';
      this.successMessage = '';
      
      try {
        await this.authService.resetPassword(this.forgotPasswordForm.value.email);
        this.successMessage = '¡Correo enviado! Revisa tu bandeja de entrada para recuperar tu contraseña.';
        this.emailSent = true;
      } catch (error: any) {
        this.errorMessage = this.getErrorMessage(error.code);
      }
    } else {
      this.forgotPasswordForm.get('email')?.markAsTouched();
    }
  }

  onBackToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };

    return errorMessages[errorCode] || 'Error al enviar el correo. Verifica que el email sea correcto.';
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }
}