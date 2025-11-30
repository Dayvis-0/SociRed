// src/app/features/auth/pages/complete-profile/complete-profile.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthFooter } from '../../../../shared/components/auth-footer/auth-footer';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthFooter],
  templateUrl: './complete-profile.html',
  styleUrls: ['./complete-profile.css']
})
export class CompleteProfile {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  profileForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      bio: [''],
      website: [''],
      location: [''],
      occupation: ['']
    });
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.valid) {
      this.errorMessage = '';
      this.loading = true;
      
      try {
        const firebaseUser = this.authService['auth'].currentUser;
        const displayName = `${this.profileForm.value.firstName} ${this.profileForm.value.lastName}`;
        
        // Actualizar el displayName en Firebase Auth
        if (firebaseUser) {
          await import('@angular/fire/auth').then(({ updateProfile }) => {
            return updateProfile(firebaseUser, { displayName });
          });
        }

        // Enviar los datos al servicio
        await this.authService.completeProfile({
          bio: this.profileForm.value.bio,
          website: this.profileForm.value.website,
          location: this.profileForm.value.location,
          occupation: this.profileForm.value.occupation
        });
        
        this.router.navigate(['/feed']);
      } catch (error: any) {
        this.errorMessage = 'Error al guardar la información. Intenta nuevamente';
        console.error('Error:', error);
      } finally {
        this.loading = false;
      }
    } else {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }

  get firstName() {
    return this.profileForm.get('firstName');
  }

  get lastName() {
    return this.profileForm.get('lastName');
  }

  get bio() {
    return this.profileForm.get('bio');
  }

  get website() {
    return this.profileForm.get('website');
  }

  get location() {
    return this.profileForm.get('location');
  }

  get occupation() {
    return this.profileForm.get('occupation');
  }
}