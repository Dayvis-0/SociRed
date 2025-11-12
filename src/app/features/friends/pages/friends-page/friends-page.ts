import { Component } from '@angular/core';
import { FriendsList } from '../../components/friends-list/friends-list';
import { FriendsHeader } from '../../components/friends-header/friends-header';

@Component({
  selector: 'app-friends-page',
  imports: [FriendsList, FriendsHeader],
  templateUrl: './friends-page.html',
  styleUrl: './friends-page.css',
})
export class FriendsPage {

}
