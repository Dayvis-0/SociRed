import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FriendService } from '../../../core/services/friend.service';
import { User } from '../../../core/models/user.model';
import { getRandomGradient } from '../../../core/models/suggestion.model';
import { Subscription } from 'rxjs';

interface FriendDisplay {
  userId: string;
  initials: string;
  name: string;
  photoURL?: string;
  gradient: string;
  isOnline: boolean; // 🆕
}

@Component({
  selector: 'app-sidebar-right',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar-right.html',
  styleUrl: './sidebar-right.css'
})
export class SidebarRight implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private friendService = inject(FriendService);
  private router = inject(Router);

  currentUser: User | null = null;
  userInitials: string = '';
  userName: string = '';
  userBio: string = '';
  userPhotoURL: string = '';
  friendsCount: number = 0;
  postsCount: number = 0;
  
  friends: FriendDisplay[] = [];
  loadingFriends: boolean = true;

  private userSubscription?: Subscription;
  private friendsSubscription?: Subscription;

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userName = user.displayName;
        this.userInitials = this.getInitials(user.displayName);
        this.userBio = user.bio || 'Sin biografía';
        this.userPhotoURL = user.photoURL || '';
        this.friendsCount = user.friendsCount || 0;
        this.postsCount = user.postsCount || 0;
        
        // Cargar amigos ONLINE
        this.loadOnlineFriends(user.userId);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.friendsSubscription?.unsubscribe();
  }

  /**
   * 🟢 Cargar SOLO amigos que están ONLINE
   */
  loadOnlineFriends(userId: string): void {
    this.loadingFriends = true;

    this.friendsSubscription = this.friendService.getFriends(userId).subscribe({
      next: (friends) => {
        console.log('👥 Amigos totales:', friends.length);
        
        // 🟢 FILTRAR SOLO AMIGOS ONLINE
        const onlineFriends = friends.filter(friend => friend.isOnline === true);
        
        console.log('🟢 Amigos ONLINE:', onlineFriends.length);
        
        if (onlineFriends.length > 0) {
          // Mostrar máximo 8 amigos online
          const limitedFriends = onlineFriends.slice(0, 8);
          
          this.friends = limitedFriends.map(friend => ({
            userId: friend.userId,
            initials: this.getInitials(friend.displayName),
            name: friend.displayName,
            photoURL: friend.photoURL,
            gradient: getRandomGradient(),
            isOnline: true
          }));
          
          console.log('✅ Amigos online mostrados:', this.friends.length);
        } else {
          this.friends = [];
          console.log('ℹ️ No hay amigos online');
        }
        
        this.loadingFriends = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar amigos:', error);
        this.friends = [];
        this.loadingFriends = false;
      }
    });
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
}