import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { Subscription } from 'rxjs';

interface Friend {
  initials: string;
  gradient: string;
}

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.html',
  styleUrl: './profile-header.css'
})
export class ProfileHeader implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  
  @Input() friendsCount: number = 0;
  @Input() isOwnProfile: boolean = true;
  
  @Output() editProfile = new EventEmitter<void>();
  @Output() editAvatar = new EventEmitter<void>();
  @Output() editCover = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<string>();

  // Datos del usuario desde Firebase
  currentUser: User | null = null;
  userName: string = '';
  userInitials: string = '';
  
  private userSubscription?: Subscription;

  activeTab: string = 'publicaciones';

  friendsPreviews: Friend[] = [
    { initials: 'AP', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { initials: 'DL', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { initials: 'SF', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { initials: 'RM', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { initials: 'PT', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { initials: 'MV', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
  ];

  tabs = [
    { id: 'publicaciones', icon: '📝', label: 'Publicaciones' },
    { id: 'acerca', icon: 'ℹ️', label: 'Acerca de' },
    { id: 'amigos', icon: '👥', label: 'Amigos' },
    { id: 'fotos', icon: '📷', label: 'Fotos' },
  ];

  ngOnInit(): void {
    // Suscribirse al usuario actual de Firebase
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userName = user.displayName;
        this.userInitials = this.getInitials(user.displayName);
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

  onTabClick(tabId: string): void {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onEditAvatar(): void {
    this.editAvatar.emit();
  }

  onEditCover(): void {
    this.editCover.emit();
  }
}