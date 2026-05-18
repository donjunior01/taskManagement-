import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-pm-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './pm-layout.html',
  styleUrls: ['./pm-layout.scss']
})
export class PmLayoutComponent {}
