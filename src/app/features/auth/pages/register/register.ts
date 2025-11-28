import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  registerForm: FormGroup;
  errorMessage: string = '';
  loading$ = this.authService.loading$;
  
  // Arrays para los selectores
  days: number[] = [];
  months = [
    { value: 1, label: 'Ene' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Ago' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dic' }
  ];
  years: number[] = [];

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      day: ['', Validators.required],
      month: ['', Validators.required],
      year: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Generar días (1-31)
    this.days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // Generar años (últimos 90 años desde 2025)
    const currentYear = 2025;
    this.years = Array.from({ length: 90 }, (_, i) => currentYear - i);
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.valid) {
      this.errorMessage = '';
      
      try {
        await this.authService.register(this.registerForm.value);
        // El servicio ya maneja la redirección
      } catch (error: any) {
        this.errorMessage = this.getErrorMessage(error.code);
      }
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.markFormGroupTouched(this.registerForm);
    }
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // Obtener mensaje de error personalizado
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/weak-password': 'La contraseña es muy débil',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };

    return errorMessages[errorCode] || 'Error al crear la cuenta. Intenta nuevamente';
  }

  // Método auxiliar para marcar todos los campos como touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getters para acceder fácilmente a los controles
  get firstName() {
    return this.registerForm.get('firstName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get day() {
    return this.registerForm.get('day');
  }

  get month() {
    return this.registerForm.get('month');
  }

  get year() {
    return this.registerForm.get('year');
  }

  get gender() {
    return this.registerForm.get('gender');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }
}