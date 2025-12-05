import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FriendService } from '../../../core/services/friend.service';
import { User } from '../../../core/models/user.model';
import { SuggestionUI, getRandomGradient } from '../../../core/models/suggestion.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar-left',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-left.html',
  styleUrl: './sidebar-left.css'
})
export class SidebarLeft implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private friendService = inject(FriendService);

  currentUser: User | null = null;
  userInitials: string = '';
  userName: string = '';
  
  suggestions: SuggestionUI[] = [];
  loadingSuggestions: boolean = true;
  processingFollow: Set<string> = new Set();
  
  private userSubscription?: Subscription;
  private suggestionsSubscription?: Subscription;
  private suggestionsLoaded: boolean = false; // 🆕 Bandera para evitar recarga constante

  ngOnInit(): void {
    // Suscribirse al usuario actual de Firebase
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userName = user.displayName;
        this.userInitials = this.getInitials(user.displayName);
        
        // Solo cargar sugerencias si no se han cargado antes
        if (!this.suggestionsLoaded) {
          this.loadSuggestions(user.userId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.suggestionsSubscription?.unsubscribe();
  }

  /**
   * Cargar sugerencias de amigos desde Firebase (MEJORADO)
   */
  async loadSuggestions(userId: string): Promise<void> {
    if (this.suggestionsLoaded) {
      console.log('ℹ️ Sugerencias ya cargadas, omitiendo recarga');
      return;
    }

    this.loadingSuggestions = true;
    
    try {
      // Suscribirse a las sugerencias (pueden actualizarse en tiempo real si el servicio lo implementa)
      this.suggestionsSubscription = this.friendService.getSuggestions(userId, 3).subscribe({
        next: async (suggestions) => {
          console.log('📥 Sugerencias recibidas:', suggestions.length);

          if (suggestions.length === 0) {
            // Si no hay sugerencias, generar algunas SOLO UNA VEZ
            console.log('🔄 No hay sugerencias, generando nuevas...');
            
            try {
              const generatedSuggestions = await this.friendService.generateSuggestions(userId, 3);
              console.log('✅ Sugerencias generadas:', generatedSuggestions.length);
              
              this.suggestions = generatedSuggestions.map(s => ({
                suggestionId: s.suggestionId,
                suggestedUserId: s.suggestedUserId,
                name: s.suggestedUserName,
                initials: s.suggestedUserInitials,
                photoURL: s.suggestedUserPhotoURL,
                mutualFriends: s.mutualFriends,
                gradient: getRandomGradient(),
                following: false
              }));
              
              this.suggestionsLoaded = true;
            } catch (genError) {
              console.error('❌ Error al generar sugerencias:', genError);
              this.suggestions = [];
            }
          } else {
            // Convertir sugerencias de Firebase a UI
            this.suggestions = suggestions.map(s => ({
              suggestionId: s.suggestionId,
              suggestedUserId: s.suggestedUserId,
              name: s.suggestedUserName,
              initials: s.suggestedUserInitials,
              photoURL: s.suggestedUserPhotoURL,
              mutualFriends: s.mutualFriends,
              gradient: getRandomGradient(),
              following: false
            }));
            
            this.suggestionsLoaded = true;
          }
          
          this.loadingSuggestions = false;
          console.log('✅ Sugerencias cargadas exitosamente:', this.suggestions.length);
        },
        error: (error) => {
          console.error('❌ Error al cargar sugerencias:', error);
          this.loadingSuggestions = false;
          this.suggestions = [];
        }
      });
    } catch (error) {
      console.error('❌ Error al cargar sugerencias:', error);
      this.loadingSuggestions = false;
      this.suggestions = [];
    }
  }

  /**
   * Seguir/Dejar de seguir (enviar solicitud de amistad) - MEJORADO
   */
  async toggleFollow(suggestion: SuggestionUI): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      alert('Debes iniciar sesión para seguir a otros usuarios');
      return;
    }

    // Evitar múltiples clics
    if (this.processingFollow.has(suggestion.suggestedUserId)) {
      console.log('⏳ Ya se está procesando esta solicitud');
      return;
    }

    this.processingFollow.add(suggestion.suggestedUserId);

    try {
      if (suggestion.following) {
        // Dejar de seguir (cancelar solicitud o eliminar amistad)
        console.log('👋 Dejando de seguir a:', suggestion.name);
        
        // Aquí podrías implementar la lógica para cancelar solicitud
        // Por ahora solo cambiamos el estado local
        suggestion.following = false;
        
        console.log('✅ Dejaste de seguir a', suggestion.name);
      } else {
        // Enviar solicitud de amistad
        console.log('📤 Enviando solicitud de amistad a:', suggestion.name);
        
        await this.friendService.sendFriendRequest(
          this.currentUser.userId,
          suggestion.suggestedUserId
        );
        
        suggestion.following = true;
        
        console.log('✅ Solicitud de amistad enviada a', suggestion.name);
        console.log('📬 La notificación debería haber llegado al usuario:', suggestion.suggestedUserId);
        
        // 🆕 Opcional: Remover la sugerencia después de seguir
        // this.removeSuggestion(suggestion.suggestedUserId);
      }
    } catch (error: any) {
      console.error('❌ Error al seguir/dejar de seguir:', error);
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al enviar la solicitud. Intenta nuevamente.';
      
      if (error.message) {
        if (error.message.includes('ya existe')) {
          errorMessage = 'Ya enviaste una solicitud a este usuario.';
        } else if (error.message.includes('ya son amigos')) {
          errorMessage = 'Ya son amigos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
      suggestion.following = false; // Revertir el estado en caso de error
    } finally {
      this.processingFollow.delete(suggestion.suggestedUserId);
    }
  }

  /**
   * 🆕 Remover una sugerencia de la lista (cuando se envía solicitud)
   */
  private removeSuggestion(suggestedUserId: string): void {
    const index = this.suggestions.findIndex(s => s.suggestedUserId === suggestedUserId);
    if (index !== -1) {
      this.suggestions.splice(index, 1);
      console.log('🗑️ Sugerencia removida de la lista');
    }
  }

  /**
   * 🆕 Refrescar sugerencias manualmente
   */
  async refreshSuggestions(): Promise<void> {
    if (!this.currentUser) return;
    
    console.log('🔄 Refrescando sugerencias...');
    this.suggestionsLoaded = false;
    this.suggestions = [];
    await this.loadSuggestions(this.currentUser.userId);
  }

  /**
   * Verificar si está procesando
   */
  isProcessing(suggestedUserId: string): boolean {
    return this.processingFollow.has(suggestedUserId);
  }

  /**
   * Obtiene las iniciales del nombre del usuario
   */
  getInitials(displayName: string): string {
    if (!displayName) return '??';
    
    const names = displayName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }
}