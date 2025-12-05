import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  
  private unsubscribePresence?: Unsubscribe;
  private isPresenceActive: boolean = false;

  constructor() {
    // Detectar cuando el usuario cierra la pestaña/navegador
    this.setupBeforeUnloadListener();
    
    // Detectar cuando el usuario cambia de pestaña (opcional)
    this.setupVisibilityChangeListener();
  }

  /**
   * 🟢 Marcar usuario como ONLINE
   */
  async setUserOnline(userId: string): Promise<void> {
    if (this.isPresenceActive) {
      console.log('⚠️ La presencia ya está activa');
      return;
    }

    try {
      const userRef = doc(this.firestore, 'users', userId);
      
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp()
      });
      
      this.isPresenceActive = true;
      console.log('🟢 Usuario marcado como ONLINE:', userId);
      
      // Iniciar heartbeat para mantener la presencia activa
      this.startHeartbeat(userId);
      
    } catch (error) {
      console.error('❌ Error al marcar usuario como online:', error);
    }
  }

  /**
   * 🔴 Marcar usuario como OFFLINE
   */
  async setUserOffline(userId: string): Promise<void> {
    if (!this.isPresenceActive) {
      return;
    }

    try {
      const userRef = doc(this.firestore, 'users', userId);
      
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      });
      
      this.isPresenceActive = false;
      console.log('🔴 Usuario marcado como OFFLINE:', userId);
      
      // Detener heartbeat
      this.stopHeartbeat();
      
    } catch (error) {
      console.error('❌ Error al marcar usuario como offline:', error);
    }
  }

  /**
   * 💓 Heartbeat - Actualizar lastSeen cada 2 minutos
   */
  private heartbeatInterval?: any;
  
  private startHeartbeat(userId: string): void {
    // Limpiar heartbeat anterior si existe
    this.stopHeartbeat();
    
    // Actualizar cada 2 minutos (120000ms)
    this.heartbeatInterval = setInterval(async () => {
      try {
        const userRef = doc(this.firestore, 'users', userId);
        await updateDoc(userRef, {
          lastSeen: serverTimestamp()
        });
        console.log('💓 Heartbeat actualizado');
      } catch (error) {
        console.error('❌ Error en heartbeat:', error);
      }
    }, 120000); // 2 minutos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * 🚪 Detectar cuando el usuario cierra la pestaña/navegador
   */
  private setupBeforeUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      const userId = this.auth.currentUser?.uid;
      if (userId) {
        // Usar sendBeacon para enviar la actualización de forma confiable
        // incluso cuando se cierra la pestaña
        const userRef = doc(this.firestore, 'users', userId);
        
        // Nota: sendBeacon no funciona directamente con Firestore
        // Por eso usamos un enfoque síncrono con updateDoc
        this.setUserOfflineSync(userId);
      }
    });
  }

  /**
   * Versión síncrona para beforeunload (no espera promesa)
   */
  private setUserOfflineSync(userId: string): void {
    const userRef = doc(this.firestore, 'users', userId);
    
    // Intentar actualizar de forma síncrona
    updateDoc(userRef, {
      isOnline: false,
      lastSeen: serverTimestamp()
    }).catch(err => {
      console.error('Error al marcar offline en beforeunload:', err);
    });
  }

  /**
   * 👁️ Detectar cuando el usuario cambia de pestaña (opcional)
   */
  private setupVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', async () => {
      const userId = this.auth.currentUser?.uid;
      if (!userId) return;

      if (document.hidden) {
        // Usuario cambió a otra pestaña - marcar como offline después de 5 minutos
        console.log('👁️ Usuario cambió de pestaña');
        
        // Opcional: podrías marcar como offline después de un tiempo
        // setTimeout(() => {
        //   if (document.hidden) {
        //     this.setUserOffline(userId);
        //   }
        // }, 300000); // 5 minutos
      } else {
        // Usuario regresó a la pestaña - marcar como online
        console.log('👁️ Usuario regresó a la pestaña');
        if (!this.isPresenceActive) {
          await this.setUserOnline(userId);
        }
      }
    });
  }

  /**
   * 🧹 Limpiar listeners al destruir el servicio
   */
  cleanup(): void {
    this.stopHeartbeat();
    if (this.unsubscribePresence) {
      this.unsubscribePresence();
    }
  }
}