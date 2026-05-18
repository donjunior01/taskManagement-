import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.scss'
})
export class ErrorModalComponent {
  message: string = '';
  isVisible: boolean = false;

  show(message: string): void {
    this.message = message;
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }
}
