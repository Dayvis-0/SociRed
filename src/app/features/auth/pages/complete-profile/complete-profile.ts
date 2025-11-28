import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthFooterComponent } from '../../../../shared/components/auth-footer/auth-footer';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthFooterComponent],
  templateUrl: './complete-profile.html',
  styleUrls: ['./complete-profile.css']
})
export class CompleteProfileComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  profileForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.valid) {
      this.errorMessage = '';
      this.loading = true;
      
      try {
        await this.authService.completeProfile(
          this.profileForm.value.firstName,
          this.profileForm.value.lastName
        );
        this.router.navigate(['/feed']);
      } catch (error: any) {
        this.errorMessage = 'Error al guardar la información. Intenta nuevamente';
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
}