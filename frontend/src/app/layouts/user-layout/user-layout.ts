import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './user-layout.html',
  styleUrls: ['./user-layout.scss']
})
export class UserLayoutComponent {}
