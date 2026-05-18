import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  currentUser: any;
  userRole: string = '';

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser = this.authService.getCurrentUser();
    this.userRole = this.currentUser?.role || 'USER';
  }

  isUser(): boolean {
    return this.userRole === 'USER' || this.userRole === 'ROLE_USER';
  }

  isProjectManager(): boolean {
    return this.userRole === 'PROJECT_MANAGER' || this.userRole === 'ROLE_PROJECT_MANAGER';
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN' || this.userRole === 'ROLE_ADMIN';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
