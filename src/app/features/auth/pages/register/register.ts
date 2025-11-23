import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  
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

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
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

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
      console.log('Register form data:', formData);
      
      // Construcción de la fecha completa
      const birthDate = new Date(
        formData.year,
        formData.month - 1,
        formData.day
      );
      
      console.log('Fecha de nacimiento:', birthDate);
      
      // Simulación de registro exitoso
      alert('¡Cuenta creada exitosamente! Bienvenido a SociAmigos');
      this.router.navigate(['/feed']);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.markFormGroupTouched(this.registerForm);
    }
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
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