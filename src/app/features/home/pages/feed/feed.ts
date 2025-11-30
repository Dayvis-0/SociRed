import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatePostModalComponent } from '../../components/create-post-modal/create-post-modal';
import { CommentSectionComponent } from '../../components/comment-section/comment-section';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { SidebarLeftComponent } from '../../../../shared/components/sidebar-left/sidebar-left';
import { SidebarRightComponent } from '../../../../shared/components/sidebar-right/sidebar-right';
import { LikeButtonComponent } from '../../components/like-button/like-button';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { Subscription } from 'rxjs';

interface Post {
  id: number;
  author: string;
  initials: string;
  time: string;
  content: string;
  hasImage: boolean;
  imageEmoji?: string;
  likes: number;
  comments: number;
  liked: boolean;
  avatarClass: string;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    SidebarLeftComponent,
    SidebarRightComponent,
    CreatePostModalComponent,
    CommentSectionComponent,
    LikeButtonComponent,

  ],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  
  @ViewChild(CreatePostModalComponent) createPostModal!: CreatePostModalComponent;

  currentUser: User | null = null;
  currentUserInitials: string = '';
  private userSubscription?: Subscription;

  posts: Post[] = [
    {
      id: 1,
      author: 'María González',
      initials: 'MG',
      time: 'Hace 2 horas',
      content: '¡Acabo de terminar mi nuevo proyecto web! Estoy muy emocionada de compartirlo con todos ustedes. Ha sido un viaje increíble de aprendizaje 🚀',
      hasImage: true,
      imageEmoji: '🎨',
      likes: 24,
      comments: 5,
      liked: true,
      avatarClass: ''
    },
    {
      id: 2,
      author: 'Juan Rodríguez',
      initials: 'JR',
      time: 'Hace 5 horas',
      content: 'Buenos días a todos! ☀️ Comenzando el día con mucha energía. ¿Qué planes tienen para hoy?',
      hasImage: false,
      likes: 18,
      comments: 12,
      liked: false,
      avatarClass: 'alt1'
    },
    {
      id: 3,
      author: 'Laura Castro',
      initials: 'LC',
      time: 'Hace 8 horas',
      content: 'Compartiendo algunas fotos de mi viaje reciente. ¡Fue una experiencia maravillosa! 🌍✈️',
      hasImage: true,
      imageEmoji: '📷',
      likes: 45,
      comments: 8,
      liked: false,
      avatarClass: 'alt2'
    },
    {
      id: 4,
      author: 'Carlos Martínez',
      initials: 'CM',
      time: 'Hace 1 día',
      content: 'Reflexionando sobre la importancia de la tecnología en nuestras vidas. ¿Qué opinan ustedes? 💭',
      hasImage: false,
      likes: 32,
      comments: 15,
      liked: false,
      avatarClass: 'alt3'
    }
  ];

  private editingPostId: number | null = null;

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
    // Limpiar suscripción
    this.userSubscription?.unsubscribe();
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

  openCreatePostModal(): void {
    this.editingPostId = null;
    this.createPostModal.open();
  }
  
  onPublishPost(data: {content: string, imageUrl?: string}): void {
    if (this.editingPostId) {
      // Editar post existente
      const postIndex = this.posts.findIndex(p => p.id === this.editingPostId);
      if (postIndex !== -1) {
        this.posts[postIndex].content = data.content;
        this.posts[postIndex].time = 'Editado justo ahora';
        if (data.imageUrl) {
          this.posts[postIndex].hasImage = true;
          this.posts[postIndex].imageEmoji = '🖼️';
        }
        console.log('Publicación editada:', this.posts[postIndex]);
      }
      this.editingPostId = null;
    } else {
      // Crear nuevo post con los datos del usuario autenticado
      const newPost: Post = {
        id: Date.now(),
        author: this.currentUser?.displayName || 'Usuario',
        initials: this.currentUserInitials || '??',
        time: 'Justo ahora',
        content: data.content,
        hasImage: !!data.imageUrl,
        imageEmoji: data.imageUrl ? '🖼️' : undefined,
        likes: 0,
        comments: 0,
        liked: false,
        avatarClass: ''
      };
      
      this.posts.unshift(newPost);
      console.log('Nueva publicación creada:', newPost);
    }
  }

  toggleLike(post: Post): void {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  }

  onEdit(post: Post): void {
    this.editingPostId = post.id;
    this.createPostModal.open(post.content);
    console.log('Editando post:', post.id);
  }

  get placeholderText(): string {
    const name = this.currentUser?.displayName || '';
    const firstName = name.split(' ')[0] || 'Usuario';
    return `¿Qué estás pensando, ${firstName}?`;
  }
}