import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';

interface Suggestion {
  initials: string;
  name: string;
  mutualFriends: number;
  gradient: string;
  following: boolean;
}

@Component({
  selector: 'app-sidebar-left',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-left.html',
  styleUrl: './sidebar-left.css'
})
export class SidebarLeftComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  currentUser: User | null = null;
  userInitials: string = '';
  userName: string = '';
  
  private userSubscription?: Subscription;

  suggestions: Suggestion[] = [
    {
      initials: 'RM',
      name: 'Roberto Morales',
      mutualFriends: 4,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      following: false
    },
    {
      initials: 'PT',
      name: 'Patricia Torres',
      mutualFriends: 6,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      following: false
    },
    {
      initials: 'MV',
      name: 'Miguel Vargas',
      mutualFriends: 2,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      following: false
    }
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

  toggleFollow(suggestion: Suggestion): void {
    suggestion.following = !suggestion.following;
  }
}