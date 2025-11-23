import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileHeader } from '../../components/profile-header/profile-header';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';

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
  imports: [CommonModule, ProfileHeader, NavbarComponent],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {
  activeTab: string = 'publicaciones';
  showEditProfileModal: boolean = false;
  showEditPostModal: boolean = false;
  showCreatePostModal: boolean = false;
  editingPostId: number | null = null;

  userName: string = 'María González';
  userInitials: string = 'MG';
  friendsCount: number = 248;

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
      liked: true
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
      liked: false
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
      liked: false
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
      liked: false
    }
  ];

  aboutInfo: AboutInfo[] = [
    { icon: '🎓', title: 'Estudios', description: 'Ingeniería de Sistemas en Universidad Nacional' },
    { icon: '💼', title: 'Trabajo', description: 'Desarrolladora Web en TechCorp' },
    { icon: '📍', title: 'Ubicación', description: 'Lima, Perú' },
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

  videos: Video[] = [
    { emoji: '🎬', title: 'Mi proyecto web favorito', views: '1.2k vistas', time: 'Hace 3 días' },
    { emoji: '📹', title: 'Tutorial de CSS Grid', views: '856 vistas', time: 'Hace 1 semana' },
    { emoji: '🎥', title: 'Viaje a las montañas', views: '2.3k vistas', time: 'Hace 2 semanas' },
    { emoji: '🎞️', title: 'Aprendiendo React', views: '1.8k vistas', time: 'Hace 3 semanas' }
  ];

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
    this.showCreatePostModal = true;
  }

  closeCreatePostModal(): void {
    this.showCreatePostModal = false;
  }

  openEditPostModal(postId: number): void {
    this.editingPostId = postId;
    this.showEditPostModal = true;
  }

  closeEditPostModal(): void {
    this.showEditPostModal = false;
    this.editingPostId = null;
  }

  openEditProfileModal(): void {
    this.showEditProfileModal = true;
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal = false;
  }

  saveProfile(): void {
    console.log('Guardando perfil...');
    this.closeEditProfileModal();
  }

  savePost(): void {
    console.log('Guardando post...');
    this.closeEditPostModal();
  }

  publishPost(): void {
    console.log('Publicando post...');
    this.closeCreatePostModal();
  }

  onEditAvatar(): void {
    console.log('Editar avatar');
  }

  onEditCover(): void {
    console.log('Editar portada');
  }
}