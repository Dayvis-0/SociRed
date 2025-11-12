import { Component } from '@angular/core';
import { FriendsCard } from '../friends-card/friends-card';

@Component({
  selector: 'app-friends-list',
  imports: [FriendsCard],
  templateUrl: './friends-list.html',
  styleUrl: './friends-list.css',
})
export class FriendsList {

}
