import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
  
  footerLinks = [
    { label: 'Acerca de', url: '#' },
    { label: 'Ayuda', url: '#' },
    { label: 'Condiciones', url: '#' },
    { label: 'Privacidad', url: '#' },
    { label: 'Cookies', url: '#' },
    { label: 'Publicidad', url: '#' },
    { label: 'Más', url: '#' }
  ];
}