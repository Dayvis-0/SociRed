import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
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
  
  showComments = false;
  newCommentText = '';
  currentUser: User | null = null;
  currentUserInitials: string = '??';
  
  comments: CommentUI[] = [];
  loading: boolean = false;
  
  private userSubscription?: Subscription;
  private commentsSubscription?: Subscription;

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserInitials = this.getInitials(user.displayName);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.commentsSubscription?.unsubscribe();
  }

  /**
   * Mostrar/ocultar comentarios y cargarlos desde Firebase
   */
  toggleComments(): void {
    this.showComments = !this.showComments;
    
    if (this.showComments && this.comments.length === 0) {
      this.loadComments();
    }
  }

  /**
   * Cargar comentarios desde Firebase
   */
  loadComments(): void {
    this.loading = true;
    
    this.commentsSubscription = this.commentService.getCommentsByPost(this.postId, 100).subscribe({
      next: (comments) => {
        this.comments = comments.map(comment => ({
          ...comment,
          timeAgo: this.getTimeAgo(comment.fecha),
          isLikedByCurrentUser: this.currentUser ? 
            comment.likedBy.includes(this.currentUser.userId) : false,
          replies: []
        }));
        
        this.loading = false;
        console.log('✅ Comentarios cargados:', this.comments.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar comentarios:', error);
        this.loading = false;
      }
    });
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
      await this.commentService.toggleLike(this.postId, comment.comentarioId, this.currentUser.userId);
      
      // Actualizar UI localmente
      comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
      comment.likes += comment.isLikedByCurrentUser ? 1 : -1;
      
      if (comment.isLikedByCurrentUser) {
        comment.likedBy.push(this.currentUser.userId);
      } else {
        comment.likedBy = comment.likedBy.filter(id => id !== this.currentUser!.userId);
      }
    } catch (error) {
      console.error('❌ Error al dar/quitar like:', error);
    }
  }

  /**
   * Agregar un comentario
   */
  async addComment(): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    if (this.newCommentText.trim()) {
      try {
        await this.commentService.createComment(
          this.postId,
          this.currentUser.userId,
          this.currentUser.displayName,
          this.currentUser.photoURL,
          this.newCommentText.trim()
        );
        
        this.newCommentText = '';
        this.commentsCount++;
        
        // Recargar comentarios
        this.loadComments();
        
        console.log('✅ Comentario agregado');
      } catch (error) {
        console.error('❌ Error al agregar comentario:', error);
      }
    }
  }

  /**
   * Responder a un comentario
   */
  onReply(comment: CommentUI): void {
    console.log('Responder a:', comment.autorName);
    this.newCommentText = `@${comment.autorName} `;
    // TODO: Implementar respuestas como comentarios hijos
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
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
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