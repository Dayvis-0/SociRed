import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';

interface OnlineUser {
  initials: string;
  name: string;
  gradient: string;
}

@Component({
  selector: 'app-sidebar-right',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar-right.html',
  styleUrl: './sidebar-right.css'
})
export class SidebarRightComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  currentUser: User | null = null;
  userInitials: string = '';
  userName: string = '';
  userBio: string = '';
  friendsCount: number = 0;
  postsCount: number = 0;
  
  private userSubscription?: Subscription;

  onlineUsers: OnlineUser[] = [
    {
      initials: 'AP',
      name: 'Ana Pérez',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      initials: 'DL',
      name: 'Diego López',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      initials: 'SF',
      name: 'Sofía Fernández',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  ngOnInit(): void {
    // Suscribirse al usuario actual de Firebase
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userName = user.displayName;
        this.userInitials = this.getInitials(user.displayName);
        this.userBio = user.bio || 'Sin biografía';
        // Valores temporales hasta que se implementen en el modelo User
        this.friendsCount = 0;
        this.postsCount = 0;
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    this.userSubscription?.unsubscribe();
  }

  /**
   * Obtiene las iniciales del nombre del usuario
   * Ejemplo: "Juan Pérez" -> "JP"
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