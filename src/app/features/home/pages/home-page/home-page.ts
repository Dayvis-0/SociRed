import { Component } from '@angular/core';
import { SidebarLeft } from '../../../../shared/components/sidebar-left/sidebar-left';
import { SidebarRight } from '../../../../shared/components/sidebar-right/sidebar-right';
import { CreatePost } from '../components/create-post/create-post';
import { Feed } from '../components/feed/feed';

@Component({
  selector: 'app-home-page',
  imports: [SidebarLeft, SidebarRight, CreatePost, Feed],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {

}
