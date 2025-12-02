import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProfileHeader } from '../../components/profile-header/profile-header';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { CreatePostModal } from '../../../home/components/create-post-modal/create-post-modal'; 
import { CommentSection } from '../../../home/components/comment-section/comment-section';
import { LikeButton } from '../../../home/components/like-button/like-button'; 
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileService } from '../../../../core/services/profile.service'; 
import { User } from '../../../../core/models/user.model';
import { Suggestion, Post, AboutInfo, Friend } from '../../../../core/models/profile.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ProfileHeader, 
    Navbar,
    CreatePostModal,
    CommentSection,
    LikeButton
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private route = inject(ActivatedRoute);
  
  @ViewChild(CreatePostModal) createPostModal!: CreatePostModal;

  activeTab: string = 'publicaciones';
  editingPostId: string | null = null; // Cambiado de number a string

  // Datos del usuario desde Firebase
  currentUser: User | null = null; // Usuario autenticado
  profileUser: User | null = null; // Usuario del perfil que se está viendo
  isOwnProfile: boolean = true; // ¿Es mi propio perfil?
  
  userName: string = '';
  userInitials: string = '';
  friendsCount: number = 0;
  postsCount: number = 0;
  
  private userSubscription?: Subscription;
  private routeSubscription?: Subscription;

  // Arrays que se cargarán desde Firebase
  suggestions: Suggestion[] = [];
  posts: Post[] = [];
  aboutInfo: AboutInfo[] = [];
  interests: string[] = [];
  friends: Friend[] = [];
  photoEmojis: string[] = ['🏔️', '🌅', '🎨', '📸', '🌸', '🌊', '🖼️', '🌆', '🎭', '🎪', '🎡', '🎢'];

  ngOnInit(): void {
    // Suscribirse al usuario autenticado actual
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Escuchar cambios en la ruta para detectar el userName
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const userName = params.get('userName');
      
      if (userName) {
        // Estamos viendo el perfil de otro usuario
        console.log('🔍 Cargando perfil de usuario:', userName);
        this.isOwnProfile = this.currentUser?.displayName === userName;
        
        if (this.isOwnProfile) {
          this.loadOwnProfile();
        } else {
          this.loadUserProfile(userName);
        }
      } else {
        // Estamos viendo nuestro propio perfil
        console.log('👤 Mostrando perfil propio');
        this.isOwnProfile = true;
        this.loadOwnProfile();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  /**
   * Cargar perfil propio
   */
  private loadOwnProfile(): void {
    if (this.currentUser) {
      this.profileUser = this.currentUser;
      this.userName = this.currentUser.displayName;
      this.userInitials = this.profileService.getInitials(this.currentUser.displayName);
      this.friendsCount = this.currentUser.friendsCount || 0;
      this.postsCount = this.currentUser.postsCount || 0;
      
      // Cargar datos adicionales del perfil desde Firebase
      this.loadAboutInfo();
      this.loadInterests();
      this.loadPosts();
      this.loadFriends();
      this.loadSuggestions();
      
      console.log('✅ Perfil propio cargado:', this.userName);
    }
  }

  /**
   * Cargar perfil de otro usuario desde Firestore
   */
  private loadUserProfile(userName: string): void {
    this.profileService.getUserProfileByName(userName).subscribe({
      next: (userData) => {
        if (userData) {
          this.profileUser = userData;
          this.userName = userData.displayName;
          this.userInitials = this.profileService.getInitials(userData.displayName);
          this.friendsCount = userData.friendsCount || 0;
          this.postsCount = userData.postsCount || 0;
          
          // Cargar datos adicionales del perfil desde Firebase
          this.loadAboutInfo();
          this.loadInterests();
          this.loadPosts();
          this.loadFriends();
          this.loadSuggestions();
          
          console.log('✅ Perfil de usuario cargado:', this.userName);
        } else {
          console.error('❌ Usuario no encontrado');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar perfil:', error);
      }
    });
  }

  /**
   * Cargar información "Acerca de"
   */
  private loadAboutInfo(): void {
    if (!this.profileUser) return;
    
    this.aboutInfo = [];
    
    // Agregar información si existe
    if (this.profileUser.occupation) {
      this.aboutInfo.push({
        icon: '💼',
        title: 'Trabajo',
        description: this.profileUser.occupation
      });
    }
    
    if (this.profileUser.location) {
      this.aboutInfo.push({
        icon: '📍',
        title: 'Ubicación',
        description: this.profileUser.location
      });
    }
    
    if (this.profileUser.website) {
      this.aboutInfo.push({
        icon: '🌐',
        title: 'Sitio web',
        description: this.profileUser.website
      });
    }
  }

  /**
   * Cargar intereses
   * TODO: Implementar cuando tengas la colección de interests en Firebase
   */
  private loadInterests(): void {
    // Por ahora vacío, se puede implementar después
    this.interests = [];
  }

  /**
   * Cargar posts del usuario
   * TODO: Implementar cuando tengas los posts en Firebase
   */
  private loadPosts(): void {
    // Por ahora vacío, se implementará con el servicio de posts
    this.posts = [];
  }

  /**
   * Cargar amigos
   * TODO: Implementar con el FriendService
   */
  private loadFriends(): void {
    // Por ahora vacío, se puede implementar con FriendService.getFriends()
    this.friends = [];
  }

  /**
   * Cargar sugerencias
   * TODO: Implementar con el FriendService
   */
  private loadSuggestions(): void {
    // Por ahora vacío, se puede implementar con FriendService.getSuggestions()
    this.suggestions = [];
  }

  /**
   * Obtiene las iniciales del nombre del usuario
   */
  getInitials(displayName: string): string {
    return this.profileService.getInitials(displayName);
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
    // Solo permitir crear posts en el perfil propio
    if (!this.isOwnProfile) {
      console.log('⚠️ No puedes crear posts en el perfil de otro usuario');
      return;
    }
    
    this.editingPostId = null;
    this.createPostModal.open();
  }

  onEdit(post: Post): void {
    // Solo permitir editar posts propios
    if (!this.isOwnProfile) {
      console.log('⚠️ No puedes editar posts de otro usuario');
      return;
    }
    
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
        id: Date.now().toString(), // Convertir a string
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