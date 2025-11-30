// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, tap, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Guard para proteger rutas que requieren autenticación
 * CORREGIDO: Ahora espera a que el servicio se inicialice antes de verificar
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // CLAVE: Esperar a que initialized$ sea true antes de verificar el usuario
  return authService.initialized$.pipe(
    filter(initialized => initialized === true), // Esperar hasta que esté inicializado
    take(1),
    switchMap(() => authService.currentUser$), // Ahora sí verificar el usuario
    take(1),
    map(user => {
      if (user) {
        console.log('✅ Auth Guard: Usuario autenticado', user.displayName);
        return true;
      } else {
        console.log('🔒 Auth Guard: Usuario NO autenticado - Redirigiendo a login');
        // Redirigir al login si no está autenticado
        router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return false;
      }
    })
  );
};

/**
 * Guard para rutas públicas (login/register)
 * Redirige al feed si ya está autenticado
 * CORREGIDO: También espera la inicialización
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // CLAVE: Esperar a que initialized$ sea true antes de verificar
  return authService.initialized$.pipe(
    filter(initialized => initialized === true), // Esperar hasta que esté inicializado
    take(1),
    switchMap(() => authService.currentUser$), // Ahora sí verificar el usuario
    take(1),
    map(user => {
      if (user) {
        console.log('✅ Public Guard: Usuario ya autenticado - Redirigiendo a feed');
        // Si ya está autenticado, redirigir al feed
        router.navigate(['/feed']);
        return false;
      } else {
        console.log('🔓 Public Guard: Usuario NO autenticado - Permitiendo acceso');
        return true;
      }
    })
  );
};

/**
 * Guard opcional para verificar si el perfil está completo
 * Útil después del login con Google
 */
export const profileCompleteGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.initialized$.pipe(
    filter(initialized => initialized === true),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      if (!user) {
        // No hay usuario, redirigir al login
        router.navigate(['/auth/login']);
        return false;
      }

      // Verificar si el perfil está completo
      const isProfileComplete = user.displayName && user.displayName.length > 0;
      
      if (!isProfileComplete) {
        console.log('⚠️ Perfil incompleto - Redirigiendo a completar perfil');
        router.navigate(['/auth/complete-profile']);
        return false;
      }

      console.log('✅ Perfil completo - Acceso permitido');
      return true;
    })
  );
};