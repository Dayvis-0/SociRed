export interface Suggestion {
  initials: string;
  name: string;
  mutualFriends: number;
  gradient: string;
  following: boolean;
}

export interface Post {
  id: string;  // Cambiado de number a string para coincidir con Firebase
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

export interface AboutInfo {
  icon: string;
  title: string;
  description: string;
}

export interface Friend {
  initials: string;
  name: string;
  mutualFriends: number;
  gradient: string;
}

export interface Video {
  emoji: string;
  title: string;
  views: string;
  time: string;
}