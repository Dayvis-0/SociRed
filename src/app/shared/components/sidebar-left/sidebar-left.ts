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
  processingFollow: Set<string> = new Set(); // Para evitar múltiples clics
  
  private userSubscription?: Subscription;

  ngOnInit(): void {
    // Suscribirse al usuario actual de Firebase
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userName = user.displayName;
        this.userInitials = this.getInitials(user.displayName);
        this.loadSuggestions(user.userId);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  /**
   * Cargar sugerencias de amigos desde Firebase
   */
  async loadSuggestions(userId: string): Promise<void> {
    this.loadingSuggestions = true;
    
    try {
      // Intentar obtener sugerencias existentes
      this.friendService.getSuggestions(userId, 3).subscribe({
        next: async (suggestions) => {
          if (suggestions.length === 0) {
            // Si no hay sugerencias, generar algunas
            const generatedSuggestions = await this.friendService.generateSuggestions(userId, 3);
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
          }
          
          this.loadingSuggestions = false;
          console.log('✅ Sugerencias cargadas:', this.suggestions.length);
        },
        error: (error) => {
          console.error('❌ Error al cargar sugerencias:', error);
          this.loadingSuggestions = false;
        }
      });
    } catch (error) {
      console.error('❌ Error al cargar sugerencias:', error);
      this.loadingSuggestions = false;
    }
  }

  /**
   * Seguir/Dejar de seguir (enviar solicitud de amistad)
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
        // Aquí podrías implementar "dejar de seguir"
        // Por ahora solo cambiamos el estado local
        suggestion.following = false;
        console.log('👋 Dejaste de seguir a', suggestion.name);
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
      }
    } catch (error: any) {
      console.error('❌ Error al seguir/dejar de seguir:', error);
      alert(error.message || 'Error al enviar la solicitud. Intenta nuevamente.');
      suggestion.following = false; // Revertir el estado en caso de error
    } finally {
      this.processingFollow.delete(suggestion.suggestedUserId);
    }
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