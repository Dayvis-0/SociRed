import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private firestore = inject(Firestore);

  /**
   * Obtener perfil de usuario por nombre
   */
  getUserProfileByName(userName: string): Observable<User | null> {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(
      usersCollection, 
      where('displayName', '==', userName),
      limit(1)
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          return {
            userId: data['userId'] || doc.id,
            email: data['email'] || '',
            displayName: data['displayName'] || '',
            photoURL: data['photoURL'],
            bio: data['bio'],
            coverPhotoURL: data['coverPhotoURL'],
            friendsCount: data['friendsCount'] || 0,
            postsCount: data['postsCount'] || 0,
            website: data['website'],
            location: data['location'],
            birthDate: data['birthDate'],
            occupation: data['occupation'],
            gender: data['gender'],
            createdAt: data['createdAt'],
            updatedAt: data['updatedAt']
          } as User;
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener perfil:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener iniciales del nombre
   */
  getInitials(displayName: string): string {
    if (!displayName) return '??';
    
    const names = displayName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  /**
   * Normalizar nombre de usuario para URL
   * Ejemplo: "María González" -> "maria-gonzalez"
   */
  normalizeUserName(displayName: string): string {
    return displayName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones
  }

  /**
   * Desnormalizar nombre de usuario desde URL
   * Esto requiere buscar en la base de datos
   */
  denormalizeUserName(urlName: string): string {
    return urlName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}