import { Component, Input, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../../../core/services/comment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommentUI } from '../../../../core/models/comment.model';
import { User } from '../../../../core/models/user.model';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.css'
})
export class CommentSection implements OnInit, OnDestroy {
  private commentService = inject(CommentService);
  private authService = inject(AuthService);

  @Input() postId!: string;
  @Input() commentsCount: number = 0;
  
  @ViewChild('commentsContainer') commentsContainer?: ElementRef;
  
  showComments = false;
  newCommentText = '';
  currentUser: User | null = null;
  currentUserInitials: string = '??';
  
  comments: CommentUI[] = [];
  loading: boolean = false;
  
  private userSubscription?: Subscription;
  private commentsSubscription?: Subscription;
  private timeAgoInterval?: any;
  private shouldScrollToBottom: boolean = false; // 🆕 Bandera para saber si TÚ comentaste

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserInitials = this.getInitials(user.displayName);
      }
    });

    // Actualizar "timeAgo" cada minuto
    this.timeAgoInterval = setInterval(() => {
      this.updateTimeAgo();
    }, 60000);
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.commentsSubscription?.unsubscribe();
    
    if (this.timeAgoInterval) {
      clearInterval(this.timeAgoInterval);
    }
  }

  /**
   * Actualizar el "timeAgo" de todos los comentarios
   */
  private updateTimeAgo(): void {
    this.comments = this.comments.map(comment => ({
      ...comment,
      timeAgo: this.getTimeAgo(comment.fecha)
    }));
  }

  /**
   * Mostrar/ocultar comentarios y cargarlos desde Firebase
   */
  toggleComments(): void {
    this.showComments = !this.showComments;
    
    // Solo cargar si se está expandiendo Y no hay comentarios cargados
    if (this.showComments && !this.commentsSubscription) {
      this.loadComments();
    }
  }

  /**
   * Cargar comentarios en TIEMPO REAL desde Firebase
   */
  loadComments(): void {
    this.loading = true;
    
    // El listener en tiempo real se mantiene activo
    this.commentsSubscription = this.commentService.getCommentsByPost(this.postId, 100).subscribe({
      next: (comments) => {
        const oldCount = this.comments.length;
        
        this.comments = comments.map(comment => ({
          ...comment,
          timeAgo: this.getTimeAgo(comment.fecha),
          isLikedByCurrentUser: this.currentUser ? 
            comment.likedBy.includes(this.currentUser.userId) : false,
          replies: []
        }));
        
        this.loading = false;
        console.log('🔄 Comentarios actualizados en tiempo real:', this.comments.length);
        
        // ✅ SOLO hacer scroll si TÚ comentaste (shouldScrollToBottom = true)
        if (this.shouldScrollToBottom && this.comments.length > oldCount) {
          this.scrollToBottom();
          this.shouldScrollToBottom = false; // Resetear la bandera
          console.log('📜 Scroll automático porque TÚ comentaste');
        } else if (this.comments.length > oldCount) {
          console.log('ℹ️ Nuevo comentario de otro usuario - NO se hace scroll');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar comentarios:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Hacer scroll automático hacia el último comentario
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector(`[data-post-id="${this.postId}"] .comments-container`) as HTMLElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  /**
   * Dar/quitar like a un comentario
   */
  async toggleLike(comment: CommentUI): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    try {
      // Actualización optimista
      const wasLiked = comment.isLikedByCurrentUser;
      comment.isLikedByCurrentUser = !wasLiked;
      comment.likes += comment.isLikedByCurrentUser ? 1 : -1;
      
      if (comment.isLikedByCurrentUser) {
        comment.likedBy.push(this.currentUser.userId);
      } else {
        comment.likedBy = comment.likedBy.filter(id => id !== this.currentUser!.userId);
      }

      // Enviar a Firebase
      await this.commentService.toggleLike(this.postId, comment.comentarioId, this.currentUser.userId);
      
      console.log('✅ Like actualizado en comentario');
    } catch (error) {
      console.error('❌ Error al dar/quitar like:', error);
      
      // Revertir en caso de error
      comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
      comment.likes += comment.isLikedByCurrentUser ? 1 : -1;
    }
  }

  /**
   * ✅ Agregar un comentario (SOLO hace scroll cuando TÚ comentas)
   */
  async addComment(): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    if (this.newCommentText.trim()) {
      try {
        // Si los comentarios están ocultos, mostrarlos primero
        if (!this.showComments) {
          this.showComments = true;
          
          // Si no hay suscripción activa, iniciar el listener
          if (!this.commentsSubscription) {
            this.loadComments();
          }
        }

        // 🔑 ACTIVAR la bandera ANTES de crear el comentario
        // Esto indica que TÚ eres quien está comentando
        this.shouldScrollToBottom = true;

        // Crear el comentario
        await this.commentService.createComment(
          this.postId,
          this.currentUser.userId,
          this.currentUser.displayName,
          this.currentUser.photoURL,
          this.newCommentText.trim()
        );
        
        // Limpiar el input
        this.newCommentText = '';
        this.commentsCount++;
        
        console.log('✅ Comentario agregado - Se actualizará automáticamente y hará scroll');
      } catch (error) {
        console.error('❌ Error al agregar comentario:', error);
        this.shouldScrollToBottom = false; // Resetear en caso de error
      }
    }
  }

  /**
   * Responder a un comentario
   */
  onReply(comment: CommentUI): void {
    console.log('Responder a:', comment.autorName);
    this.newCommentText = `@${comment.autorName} `;
    
    // Enfocar el input de comentario
    setTimeout(() => {
      const input = document.querySelector(`[data-post-id="${this.postId}"] .comment-input`) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 100);
  }

  /**
   * Obtener iniciales
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
   * Calcular tiempo transcurrido
   */
  getTimeAgo(timestamp: Timestamp): string {
    const now = new Date();
    const date = timestamp.toDate();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins === 1) return '1 min';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours === 1) return '1 h';
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // Funciones para botones adicionales
  onEmojiClick(): void {
    this.newCommentText += '😊';
  }
  
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addComment();
    }
  }
}