import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Login form data:', this.loginForm.value);
      // Simulación de login exitoso - redirige al feed
      this.router.navigate(['/feed']);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  onGoogleLogin(): void {
    console.log('Login with Google clicked');
    // Simulación de login con Google
    alert('Funcionalidad de Google Login pendiente de implementar');
  }

  onCreateAccount(): void {
    this.router.navigate(['/register']);
  }

  onForgotPassword(): void {
    console.log('Forgot password clicked');
    alert('Funcionalidad de recuperar contraseña pendiente de implementar');
  }

  // Getters para acceder fácilmente a los controles del formulario
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}