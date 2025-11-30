// src/app/shared/components/sidebar-right/sidebar-right.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FriendService } from '../../../core/services/friend.service';
import { User } from '../../../core/models/user.model';
import { getRandomGradient } from '../../../core/models/suggestion.model';
import { Subscription } from 'rxjs';

interface OnlineUser {
  userId: string;
  initials: string;
  name: string;
  photoURL?: string;
  gradient: string;
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

  currentUser: User | null = null;
  userInitials: string = '';
  userName: string = '';
  userBio: string = '';
  userPhotoURL: string = '';
  friendsCount: number = 0;
  postsCount: number = 0;
  
  onlineUsers: OnlineUser[] = [];
  loadingOnlineUsers: boolean = true;
  
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
        
        this.loadOnlineUsers(user.userId);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.friendsSubscription?.unsubscribe();
  }

  loadOnlineUsers(userId: string): void {
    this.loadingOnlineUsers = true;

    this.friendsSubscription = this.friendService.getFriends(userId).subscribe({
      next: (friends) => {
        if (friends.length > 0) {
          const randomFriends = this.shuffleArray(friends).slice(0, 5);
          
          this.onlineUsers = randomFriends.map(friend => ({
            userId: friend.userId,
            initials: this.getInitials(friend.displayName),
            name: friend.displayName,
            photoURL: friend.photoURL,
            gradient: getRandomGradient()
          }));
        } else {
          this.loadSuggestedUsers(userId);
        }
        
        this.loadingOnlineUsers = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios online:', error);
        this.loadSuggestedUsers(userId);
        this.loadingOnlineUsers = false;
      }
    });
  }

  async loadSuggestedUsers(userId: string): Promise<void> {
    try {
      const suggestions = await this.friendService.generateSuggestions(userId, 5);
      
      this.onlineUsers = suggestions.map(suggestion => ({
        userId: suggestion.suggestedUserId,
        initials: suggestion.suggestedUserInitials,
        name: suggestion.suggestedUserName,
        photoURL: suggestion.suggestedUserPhotoURL,
        gradient: getRandomGradient()
      }));
    } catch (error) {
      console.error('❌ Error al cargar usuarios sugeridos:', error);
      this.onlineUsers = [];
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getInitials(displayName: string): string {
    if (!displayName) return '??';
    
    const names = displayName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }
}