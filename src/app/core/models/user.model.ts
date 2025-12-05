import { Timestamp } from '@angular/fire/firestore';

/**
 * Interface principal del Usuario (User Document en Firestore)
 * Ruta: /users/{userId}
 */
export interface User {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  coverPhotoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  friendsCount: number;
  postsCount: number;
  
  // 🆕 CAMPOS DE PRESENCIA ONLINE
  isOnline?: boolean;                // Si el usuario está conectado
  lastSeen?: Timestamp;              // Última vez que estuvo activo
  
  // Campos adicionales opcionales
  website?: string;
  location?: string;
  birthDate?: Timestamp;
  occupation?: string;
  gender?: 'male' | 'female' | 'custom';
}

/**
 * Interface para Registro de Usuario
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
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Interface para Completar Perfil
 */
export interface CompleteProfileData {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  occupation?: string;
  photoURL?: string;
  coverPhotoURL?: string;
}

/**
 * Interface para Actualizar Perfil
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
 */
export interface PublicUserInfo {
  userId: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  occupation?: string;
  isOnline?: boolean;              // 🆕
  lastSeen?: Timestamp;            // 🆕
}

/**
 * Interface para Perfil de Usuario (vista completa)
 */
export interface UserProfile extends User {
  isFriend?: boolean;
  friendshipStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
  mutualFriendsCount?: number;
}

/**
 * Interface para Usuario Simple (listas, búsquedas)
 */
export interface UserSimple {
  userId: string;
  displayName: string;
  photoURL?: string;
  occupation?: string;
  friendsCount: number;
  isOnline?: boolean;              // 🆕
  lastSeen?: Timestamp;            // 🆕
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
    occupation: user.occupation,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen
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
    isOnline: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
}