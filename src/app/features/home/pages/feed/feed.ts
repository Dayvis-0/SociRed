import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatePostModal } from '../../components/create-post-modal/create-post-modal';
import { CommentSection } from '../../components/comment-section/comment-section';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { SidebarLeft } from '../../../../shared/components/sidebar-left/sidebar-left';
import { SidebarRight } from '../../../../shared/components/sidebar-right/sidebar-right';
import { LikeButton } from '../../components/like-button/like-button';
import { AuthService } from '../../../../core/services/auth.service';
import { PostService } from '../../../../core/services/post.service';
import { User } from '../../../../core/models/user.model';
import { Post } from '../../../../core/models/post.model';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

interface PostUI extends Post {
  timeAgo: string;
  isLikedByCurrentUser: boolean;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    Navbar,
    SidebarLeft,
    SidebarRight,
    CreatePostModal,
    CommentSection,
    LikeButton,
  ],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class Feed implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private postService = inject(PostService);
  
  @ViewChild(CreatePostModal) createPostModal!: CreatePostModal;

  currentUser: User | null = null;
  currentUserInitials: string = '';
  posts: PostUI[] = [];
  loading: boolean = true;
  
  private userSubscription?: Subscription;
  private postsSubscription?: Subscription;
  private editingPostId: string | null = null;
  private timeAgoInterval?: any;

  ngOnInit(): void {
    // Suscribirse al usuario actual
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserInitials = this.getInitials(user.displayName);
        this.loadPosts();
      }
    });

    // Actualizar "timeAgo" cada minuto
    this.timeAgoInterval = setInterval(() => {
      this.updateTimeAgo();
    }, 60000);
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.postsSubscription?.unsubscribe();
    
    if (this.timeAgoInterval) {
      clearInterval(this.timeAgoInterval);
    }
  }

  /**
   * 🔥 Cargar posts en TIEMPO REAL desde Firebase
   */
  loadPosts(): void {
    this.loading = true;
    
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
    
    this.postsSubscription = this.postService.getAllPosts(50).subscribe({
      next: (posts) => {
        console.log('🔄 Posts actualizados en tiempo real desde feed.ts');
        
        // Mapear posts a PostUI
        this.posts = posts.map(post => ({
          ...post,
          timeAgo: this.getTimeAgo(post.fecha),
          isLikedByCurrentUser: this.currentUser ? 
            post.likedBy.includes(this.currentUser.userId) : false
        }));
        
        this.loading = false;
        console.log('✅ Posts en el feed:', this.posts.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar posts:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Actualizar el "timeAgo" de todos los posts
   */
  private updateTimeAgo(): void {
    this.posts = this.posts.map(post => ({
      ...post,
      timeAgo: this.getTimeAgo(post.fecha)
    }));
  }

  /**
   * 🔑 TrackBy para evitar que Angular destruya los componentes
   */
  trackByPostId(index: number, post: PostUI): string {
    return post.postId;
  }

  /**
   * Abrir modal para crear nuevo post
   */
  openCreatePostModal(): void {
    this.editingPostId = null;
    this.createPostModal.open();
  }
  
  /**
   * Publicar o editar post
   */
  async onPublishPost(data: {content: string, imageUrl?: string}): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    try {
      if (this.editingPostId) {
        // Editar post existente
        await this.postService.updatePost(this.editingPostId, {
          contenido: data.content,
          imagenUrl: data.imageUrl
        });
        console.log('✅ Post actualizado');
        this.editingPostId = null;
      } else {
        // Crear nuevo post
        await this.postService.createPost(
          this.currentUser.userId,
          this.currentUser.displayName,
          this.currentUserInitials,
          this.currentUser.photoURL,
          {
            contenido: data.content,
            imagenUrl: data.imageUrl
          }
        );
        console.log('✅ Post creado');
      }
      
    } catch (error) {
      console.error('❌ Error al publicar post:', error);
    }
  }

  /**
   * Dar/quitar like a un post
   */
  async toggleLike(post: PostUI): Promise<void> {
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    try {
      const wasLiked = post.isLikedByCurrentUser;
      post.isLikedByCurrentUser = !wasLiked;
      post.likes += post.isLikedByCurrentUser ? 1 : -1;
      
      if (post.isLikedByCurrentUser) {
        post.likedBy.push(this.currentUser.userId);
      } else {
        post.likedBy = post.likedBy.filter(id => id !== this.currentUser!.userId);
      }

      await this.postService.toggleLike(post.postId, this.currentUser.userId);
      console.log('✅ Like actualizado');
      
    } catch (error) {
      console.error('❌ Error al dar/quitar like:', error);
      
      post.isLikedByCurrentUser = !post.isLikedByCurrentUser;
      post.likes += post.isLikedByCurrentUser ? 1 : -1;
      
      if (post.isLikedByCurrentUser) {
        post.likedBy.push(this.currentUser.userId);
      } else {
        post.likedBy = post.likedBy.filter(id => id !== this.currentUser!.userId);
      }
      
      alert('Error al dar like. Intenta nuevamente.');
    }
  }

  /**
   * Editar un post
   */
  onEdit(post: PostUI): void {
    if (this.currentUser && post.autorId === this.currentUser.userId) {
      this.editingPostId = post.postId;
      this.createPostModal.open(post.contenido);
      console.log('✏️ Editando post:', post.postId);
    } else {
      console.warn('⚠️ No tienes permiso para editar este post');
    }
  }

  /**
   * Eliminar un post
   */
  async deletePost(post: PostUI): Promise<void> {
    if (!this.currentUser || post.autorId !== this.currentUser.userId) {
      console.warn('⚠️ No tienes permiso para eliminar este post');
      return;
    }

    if (confirm('¿Estás seguro de eliminar esta publicación?')) {
      try {
        await this.postService.deletePost(post.postId);
        console.log('✅ Post eliminado');
      } catch (error) {
        console.error('❌ Error al eliminar post:', error);
        alert('Error al eliminar el post. Intenta nuevamente.');
      }
    }
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
   * Calcular tiempo transcurrido
   */
  getTimeAgo(timestamp: Timestamp): string {
    const now = new Date();
    const postDate = timestamp.toDate();
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);
    const diffMonths = Math.floor(diffMs / 2592000000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffWeeks === 1) return 'Hace 1 semana';
    if (diffWeeks < 4) return `Hace ${diffWeeks} semanas`;
    if (diffMonths === 1) return 'Hace 1 mes';
    if (diffMonths < 12) return `Hace ${diffMonths} meses`;
    
    return postDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Placeholder del input
   */
  get placeholderText(): string {
    const name = this.currentUser?.displayName || '';
    const firstName = name.split(' ')[0] || 'Usuario';
    return `¿Qué estás pensando, ${firstName}?`;
  }
}