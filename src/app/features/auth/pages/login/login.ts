// src/app/features/auth/pages/login/login.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  submitting = false;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // getter rápido para el template
  get f(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    // Simulación
    setTimeout(() => {
      this.submitting = false;
      this.router.navigateByUrl('/');
    }, 600);
  }

  loginWithGoogle(): void {
    alert('Redirigiendo a autenticación con Google (simulación)');
  }

  forgotPassword(): void {
    alert('Ir a recuperar contraseña (simulación)');
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
