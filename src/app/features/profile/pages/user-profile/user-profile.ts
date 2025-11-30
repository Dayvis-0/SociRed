import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileHeader } from '../../components/profile-header/profile-header';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { CreatePostModalComponent } from '../../../home/components/create-post-modal/create-post-modal'; 
import { CommentSectionComponent } from '../../../home/components/comment-section/comment-section';
import { LikeButtonComponent } from '../../../home/components/like-button/like-button'; 
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { Subscription } from 'rxjs';

interface Suggestion {
  initials: string;
  name: string;
  mutualFriends: number;
  gradient: string;
  following: boolean;
}

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

interface AboutInfo {
  icon: string;
  title: string;
  description: string;
}

interface Friend {
  initials: string;
  name: string;
  mutualFriends: number;
  gradient: string;
}

interface Video {
  emoji: string;
  title: string;
  views: string;
  time: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ProfileHeader, 
    NavbarComponent,
    CreatePostModalComponent,
    CommentSectionComponent,
    LikeButtonComponent
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  
  @ViewChild(CreatePostModalComponent) createPostModal!: CreatePostModalComponent;

  activeTab: string = 'publicaciones';
  editingPostId: number | null = null;

  // Datos del usuario desde Firebase
  currentUser: User | null = null;
  userName: string = '';
  userInitials: string = '';
  friendsCount: number = 248;
  
  private userSubscription?: Subscription;

  suggestions: Suggestion[] = [
    { initials: 'RM', name: 'Roberto Morales', mutualFriends: 4, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', following: false },
    { initials: 'PT', name: 'Patricia Torres', mutualFriends: 6, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', following: false },
    { initials: 'MV', name: 'Miguel Vargas', mutualFriends: 2, gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', following: false },
    { initials: 'CL', name: 'Carmen López', mutualFriends: 3, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', following: false },
    { initials: 'AL', name: 'Alberto Luna', mutualFriends: 5, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', following: false },
    { initials: 'VH', name: 'Valeria Herrera', mutualFriends: 7, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', following: false }
  ];

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
      author: 'María González',
      initials: 'MG',
      time: 'Hace 5 horas',
      content: 'Compartiendo mi experiencia aprendiendo nuevas tecnologías. ¡El conocimiento no tiene límites! 💻✨',
      hasImage: false,
      likes: 18,
      comments: 7,
      liked: false,
      avatarClass: ''
    },
    {
      id: 3,
      author: 'María González',
      initials: 'MG',
      time: 'Hace 1 día',
      content: 'Reflexionando sobre la importancia del aprendizaje continuo en tecnología 💭✨',
      hasImage: true,
      imageEmoji: '📚',
      likes: 32,
      comments: 8,
      liked: false,
      avatarClass: ''
    },
    {
      id: 4,
      author: 'María González',
      initials: 'MG',
      time: 'Hace 2 días',
      content: '¡Feliz inicio de semana! Que sea productiva para todos 🌟',
      hasImage: false,
      likes: 45,
      comments: 12,
      liked: false,
      avatarClass: ''
    }
  ];

  aboutInfo: AboutInfo[] = [
    { icon: '🎓', title: 'Estudios', description: 'Ingeniería de Sistemas en Universidad Nacional' },
    { icon: '💼', title: 'Trabajo', description: 'Desarrolladora Web en TechCorp' },
    { icon: '🌐', title: 'Sitio web', description: 'www.mariagonzalez.dev' }
  ];

  interests: string[] = [
    '💻 Programación',
    '🎨 Diseño UI/UX',
    '📚 Lectura',
    '✈️ Viajes',
    '☕ Café',
    '🎵 Música'
  ];

  friends: Friend[] = [
    { initials: 'AP', name: 'Ana Pérez', mutualFriends: 12, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { initials: 'DL', name: 'Diego López', mutualFriends: 8, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { initials: 'SF', name: 'Sofía Fernández', mutualFriends: 15, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { initials: 'RM', name: 'Roberto Morales', mutualFriends: 6, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { initials: 'PT', name: 'Patricia Torres', mutualFriends: 9, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { initials: 'MV', name: 'Miguel Vargas', mutualFriends: 4, gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { initials: 'CL', name: 'Carmen López', mutualFriends: 11, gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    { initials: 'AL', name: 'Alberto Luna', mutualFriends: 7, gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)' },
    { initials: 'VH', name: 'Valeria Herrera', mutualFriends: 13, gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }
  ];

  photoEmojis: string[] = ['🏔️', '🌅', '🎨', '📸', '🌸', '🌊', '🖼️', '🌆', '🎭', '🎪', '🎡', '🎢'];

  ngOnInit(): void {
    // Suscribirse al usuario actual de Firebase
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userName = user.displayName;
        this.userInitials = this.getInitials(user.displayName);
        
        // Actualizar posts con datos del usuario
        this.posts = this.posts.map(post => ({
          ...post,
          author: this.userName,
          initials: this.userInitials
        }));
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

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
  }

  toggleFollow(suggestion: Suggestion): void {
    suggestion.following = !suggestion.following;
  }

  toggleLike(post: Post): void {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
  }

  openCreatePostModal(): void {
    this.editingPostId = null;
    this.createPostModal.open();
  }

  onEdit(post: Post): void {
    this.editingPostId = post.id;
    this.createPostModal.open(post.content);
    console.log('Editando post:', post.id);
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
      // Crear nuevo post
      const newPost: Post = {
        id: Date.now(),
        author: this.userName,
        initials: this.userInitials,
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

  onEditAvatar(): void {
    console.log('Editar avatar');
  }

  onEditCover(): void {
    console.log('Editar portada');
  }

  get placeholderText(): string {
    const firstName = this.userName.split(' ')[0] || 'Usuario';
    return `¿Qué estás pensando, ${firstName}?`;
  }
}