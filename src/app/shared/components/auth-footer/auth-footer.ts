import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-footer.html',
  styleUrls: ['./auth-footer.css']
})
export class AuthFooterComponent {
  currentYear: number = new Date().getFullYear();
}