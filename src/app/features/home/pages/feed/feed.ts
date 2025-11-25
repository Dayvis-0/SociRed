import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatePostModalComponent } from '../../components/create-post-modal/create-post-modal';
import { CommentSectionComponent } from '../../components/comment-section/comment-section';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { SidebarLeftComponent } from '../../../../shared/components/sidebar-left/sidebar-left';
import { SidebarRightComponent } from '../../../../shared/components/sidebar-right/sidebar-right';
import { LikeButtonComponent } from '../../components/like-button/like-button';

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
    LikeButtonComponent
  ],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent {
  @ViewChild(CreatePostModalComponent) createPostModal!: CreatePostModalComponent;

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
      // Crear nuevo post
      const newPost: Post = {
        id: Date.now(),
        author: 'María González',
        initials: 'MG',
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
}