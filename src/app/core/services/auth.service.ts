import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  updateProfile,
  authState,
  User as FirebaseUser
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from '@angular/fire/firestore';
import { Observable, from, of, BehaviorSubject, firstValueFrom } from 'rxjs';
import { switchMap, map, catchError, tap, filter } from 'rxjs/operators';
import { User, RegisterData, LoginData, CompleteProfileData } from '../models/user.model';
import { PresenceService } from './presence.service'; // 🆕 IMPORTAR

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private presenceService = inject(PresenceService); // 🆕 INYECTAR

  // BehaviorSubject para manejar el estado del usuario actual
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Estado de carga
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  // Estado de inicialización
  private initializedSubject = new BehaviorSubject<boolean>(false);
  public initialized$ = this.initializedSubject.asObservable();

  constructor() {
    this.initAuthStateListener();
  }

  // ==================== LISTENER DE AUTENTICACIÓN ====================
  private initAuthStateListener(): void {
    authState(this.auth).pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(firebaseUser => {
        if (firebaseUser) {
          // 🆕 MARCAR COMO ONLINE
          this.presenceService.setUserOnline(firebaseUser.uid);
          return this.getUserData(firebaseUser.uid);
        } else {
          return of(null);
        }
      })
    ).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        this.loadingSubject.next(false);
        
        if (!this.initializedSubject.value) {
          this.initializedSubject.next(true);
        }
      },
      error: (error) => {
        console.error('Error en auth state:', error);
        this.loadingSubject.next(false);
        this.initializedSubject.next(true);
      }
    });
  }

  // ==================== REGISTRO ====================
  async register(data: RegisterData): Promise<void> {
    try {
      this.loadingSubject.next(true);

      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      const firebaseUser = userCredential.user;
      const displayName = `${data.firstName} ${data.lastName}`;

      await updateProfile(firebaseUser, { displayName });

      const birthDate = Timestamp.fromDate(
        new Date(data.year, data.month - 1, data.day)
      );
      
      const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
        userId: firebaseUser.uid,
        email: data.email,
        displayName: displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
        bio: '',
        friendsCount: 0,
        postsCount: 0,
        birthDate: birthDate,
        gender: data.gender,
        isOnline: true, // 🆕
        lastSeen: Timestamp.now() // 🆕
      };

      await this.createUserDocument(firebaseUser.uid, userData);
      
      // 🆕 MARCAR COMO ONLINE
      await this.presenceService.setUserOnline(firebaseUser.uid);
      
      const completeUser = await firstValueFrom(this.getUserData(firebaseUser.uid));
      
      if (completeUser) {
        this.currentUserSubject.next(completeUser);
      }
      
      await this.router.navigate(['/feed']);
      
    } catch (error: any) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // ==================== LOGIN ====================
  async login(data: LoginData): Promise<void> {
    try {
      this.loadingSubject.next(true);

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      // 🆕 MARCAR COMO ONLINE
      await this.presenceService.setUserOnline(userCredential.user.uid);

      const userData = await firstValueFrom(
        this.getUserData(userCredential.user.uid)
      );
      
      if (userData) {
        this.currentUserSubject.next(userData);
        await this.router.navigate(['/feed']);
      } else {
        throw new Error('No se encontraron datos del usuario');
      }

    } catch (error: any) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // ==================== LOGIN CON GOOGLE ====================
  async loginWithGoogle(): Promise<void> {
    try {
      this.loadingSubject.next(true);
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const userCredential = await signInWithPopup(this.auth, provider);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(this.firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await this.router.navigate(['/auth/complete-profile']);
      } else {
        // 🆕 MARCAR COMO ONLINE
        await this.presenceService.setUserOnline(firebaseUser.uid);
        
        const userData = await firstValueFrom(this.getUserData(firebaseUser.uid));
        
        if (userData) {
          this.currentUserSubject.next(userData);
          await this.router.navigate(['/feed']);
        }
      }

    } catch (error: any) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // ==================== COMPLETAR PERFIL (GOOGLE) ====================
  async completeProfile(data: CompleteProfileData): Promise<void> {
    const firebaseUser = this.auth.currentUser;
    
    if (!firebaseUser) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      this.loadingSubject.next(true);

      const displayName = data.displayName || firebaseUser.displayName || 'Usuario';

      const userData: any = {
        userId: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: displayName,
        photoURL: data.photoURL || firebaseUser.photoURL || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
        bio: data.bio || '',
        friendsCount: 0,
        postsCount: 0,
        isOnline: true, // 🆕
        lastSeen: Timestamp.now() // 🆕
      };

      if (data.coverPhotoURL) userData.coverPhotoURL = data.coverPhotoURL;
      if (data.website) userData.website = data.website;
      if (data.location) userData.location = data.location;
      if (data.occupation) userData.occupation = data.occupation;

      await this.createUserDocument(firebaseUser.uid, userData);
      
      // 🆕 MARCAR COMO ONLINE
      await this.presenceService.setUserOnline(firebaseUser.uid);
      
      const completeUser = await firstValueFrom(this.getUserData(firebaseUser.uid));
      
      if (completeUser) {
        this.currentUserSubject.next(completeUser);
      }

      await this.router.navigate(['/feed']);

    } catch (error: any) {
      console.error('Error al completar perfil:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // ==================== LOGOUT ====================
  async logout(): Promise<void> {
    try {
      const userId = this.auth.currentUser?.uid;
      
      // 🆕 MARCAR COMO OFFLINE ANTES DE CERRAR SESIÓN
      if (userId) {
        await this.presenceService.setUserOffline(userId);
      }
      
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      await this.router.navigate(['/auth/login']);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  // ==================== RECUPERAR CONTRASEÑA ====================
  async resetPassword(email: string): Promise<void> {
    this.loadingSubject.next(true);
    
    try {
      const methods = await fetchSignInMethodsForEmail(this.auth, email);
      
      if (methods.length === 0) {
        throw { code: 'auth/user-not-found' };
      }
      
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // ==================== OBTENER DATOS DEL USUARIO ====================
  private getUserData(userId: string): Observable<User | null> {
    const userDocRef = doc(this.firestore, 'users', userId);
    
    return from(getDoc(userDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          return {
            userId: data['userId'] || userId,
            email: data['email'] || '',
            displayName: data['displayName'] || '',
            photoURL: data['photoURL'],
            bio: data['bio'],
            coverPhotoURL: data['coverPhotoURL'],
            friendsCount: data['friendsCount'] || 0,
            postsCount: data['postsCount'] || 0,
            website: data['website'],
            location: data['location'],
            birthDate: data['birthDate'] ? this.convertToTimestamp(data['birthDate']) : undefined,
            occupation: data['occupation'],
            gender: data['gender'],
            isOnline: data['isOnline'] || false, // 🆕
            lastSeen: data['lastSeen'] ? this.convertToTimestamp(data['lastSeen']) : undefined, // 🆕
            createdAt: this.convertToTimestamp(data['createdAt']),
            updatedAt: this.convertToTimestamp(data['updatedAt'])
          } as User;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error al obtener datos del usuario:', error);
        return of(null);
      })
    );
  }

  // ==================== CREAR DOCUMENTO DE USUARIO ====================
  private async createUserDocument(
    userId: string, 
    userData: Omit<User, 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', userId);
    
    await setDoc(userDocRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // ==================== ACTUALIZAR PERFIL ====================
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      
      const { createdAt, userId: _, ...updateData } = updates as any;
      
      await updateDoc(userDocRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      const updatedUser = await firstValueFrom(this.getUserData(userId));
      
      if (updatedUser) {
        this.currentUserSubject.next(updatedUser);
      }
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  // ==================== VERIFICAR SI ESTÁ AUTENTICADO ====================
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // ==================== OBTENER USUARIO ACTUAL ====================
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ==================== OBTENER UID ACTUAL ====================
  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  // ==================== ESPERAR INICIALIZACIÓN ====================
  async waitForInitialization(): Promise<void> {
    if (this.initializedSubject.value) {
      return;
    }

    await firstValueFrom(
      this.initialized$.pipe(
        filter(initialized => initialized === true)
      )
    );
  }

  // ==================== HELPER: CONVERTIR A TIMESTAMP ====================
  private convertToTimestamp(value: any): Timestamp {
    if (!value) {
      return Timestamp.now();
    }
    
    if (value instanceof Timestamp) {
      return value;
    }
    
    if (value.toDate && typeof value.toDate === 'function') {
      return Timestamp.fromDate(value.toDate());
    }
    
    if (value instanceof Date) {
      return Timestamp.fromDate(value);
    }
    
    return Timestamp.now();
  }

  // ==================== MANEJO DE ERRORES ====================
  private handleAuthError(error: any): void {
    let errorMessage = 'Ha ocurrido un error';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Este correo ya está registrado';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Operación no permitida';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Este usuario ha sido deshabilitado';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Credenciales inválidas';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Ventana de autenticación cerrada';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu internet';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        errorMessage = error.message || 'Error desconocido';
    }

    console.error('Error de autenticación:', errorMessage, error);
  }
}