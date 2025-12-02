import { Timestamp } from '@angular/fire/firestore';

/**
 * Interface principal del Usuario (User Document en Firestore)
 * Ruta: /users/{userId}
 */
export interface User {
  userId: string;                    // UID de Firebase Auth
  email: string;
  displayName: string;
  photoURL?: string;                 // URL de la imagen de perfil
  bio?: string;
  coverPhotoURL?: string;            // URL de la foto de portada
  createdAt: Timestamp;              // Fecha de creación
  updatedAt: Timestamp;              // Fecha de última actualización
  friendsCount: number;              // Contador de amigos
  postsCount: number;                // Contador de publicaciones
  
  // Campos adicionales opcionales
  website?: string;                  // Sitio web personal
  location?: string;                 // Ubicación del usuario
  birthDate?: Timestamp;             // Fecha de nacimiento
  occupation?: string;               // Ocupación o profesión
  gender?: 'male' | 'female' | 'custom'; // Género
}

/**
 * Interface para Registro de Usuario
 * Datos necesarios para crear una cuenta
 */
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  day: number;
  month: number;
  year: number;
  gender: 'male' | 'female' | 'custom';
}

/**
 * Interface para Login de Usuario
 * Datos necesarios para iniciar sesión
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Interface para Completar Perfil
 * Datos adicionales después del registro con Google
 */
export interface CompleteProfileData {
  displayName?: string;              // Nombre completo del usuario
  bio?: string;
  website?: string;
  location?: string;
  occupation?: string;
  photoURL?: string;
  coverPhotoURL?: string;
}

/**
 * Interface para Actualizar Perfil
 * Datos que se pueden modificar en el perfil
 */
export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  occupation?: string;
  photoURL?: string;
  coverPhotoURL?: string;
  birthDate?: Timestamp;
  gender?: 'male' | 'female' | 'custom';
}

/**
 * Interface para Usuario Público
 * Información básica que se muestra en posts, comentarios, etc.
 */
export interface PublicUserInfo {
  userId: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  occupation?: string;
}

/**
 * Interface para Perfil de Usuario (vista completa)
 * Información detallada para la página de perfil
 */
export interface UserProfile extends User {
  isFriend?: boolean;                // Si es amigo del usuario actual
  friendshipStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
  mutualFriendsCount?: number;       // Amigos en común
}

/**
 * Interface para Usuario Simple (listas, búsquedas)
 * Versión simplificada para listados
 */
export interface UserSimple {
  userId: string;
  displayName: string;
  photoURL?: string;
  occupation?: string;
  friendsCount: number;
}

/**
 * Type Guard para verificar si un objeto es un User válido
 */
export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.userId === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.displayName === 'string' &&
    typeof obj.friendsCount === 'number' &&
    typeof obj.postsCount === 'number'
  );
}

/**
 * Función helper para convertir User a PublicUserInfo
 */
export function toPublicUserInfo(user: User): PublicUserInfo {
  return {
    userId: user.userId,
    displayName: user.displayName,
    photoURL: user.photoURL,
    bio: user.bio,
    occupation: user.occupation
  };
}

/**
 * Función helper para obtener iniciales del nombre
 */
export function getUserInitials(displayName: string): string {
  const names = displayName.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return names[0][0].toUpperCase();
}

/**
 * Función helper para crear un objeto User vacío/inicial
 */
export function createEmptyUser(userId: string, email: string): Partial<User> {
  return {
    userId,
    email,
    displayName: '',
    friendsCount: 0,
    postsCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
}