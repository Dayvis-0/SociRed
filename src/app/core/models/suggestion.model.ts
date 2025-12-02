import { Timestamp } from '@angular/fire/firestore';

/**
 * Interface de Sugerencia de Amigo (Suggestion Document en Firestore)
 * Ruta: /suggestions/{suggestionId}
 */
export interface Suggestion {
  suggestionId: string;              // ID único de la sugerencia
  userId: string;                    // Usuario al que se le sugiere
  suggestedUserId: string;           // Usuario sugerido
  suggestedUserName: string;         // Nombre del usuario sugerido
  suggestedUserInitials: string;     // Iniciales del usuario sugerido
  suggestedUserPhotoURL?: string;    // Foto del usuario sugerido
  mutualFriends: number;             // Cantidad de amigos en común
  reason: 'mutual_friends' | 'same_interests' | 'location' | 'random'; // Razón de la sugerencia
  createdAt: Timestamp;              // Fecha de creación
}

/**
 * Interface para UI de Sugerencias
 */
export interface SuggestionUI {
  suggestionId: string;
  suggestedUserId: string;
  name: string;
  initials: string;
  photoURL?: string;
  mutualFriends: number;
  gradient: string;
  following: boolean;
}

/**
 * Interface de Amistad (Friendship Document en Firestore)
 * Ruta: /friends/{friendshipId}
 */
export interface Friendship {
  friendshipId: string;              // ID único de la amistad
  userId1: string;                   // Primer usuario
  userId2: string;                   // Segundo usuario
  status: 'pending' | 'accepted' | 'rejected'; // Estado de la amistad
  requestedBy: string;               // Usuario que envió la solicitud
  requestedTo: string;               // Usuario que recibió la solicitud
  createdAt: Timestamp;              // Fecha de creación
  updatedAt: Timestamp;              // Fecha de actualización
}

/**
 * Función helper para generar gradientes aleatorios
 */
export function getRandomGradient(): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffd3a5 0%, #fd6585 100%)',
    'linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)'
  ];
  
  return gradients[Math.floor(Math.random() * gradients.length)];
}