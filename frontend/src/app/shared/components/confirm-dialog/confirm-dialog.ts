import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss'
})
export class ConfirmDialogComponent {
  title: string = 'Confirm';
  message: string = '';
  isVisible: boolean = false;
  onConfirm: () => void = () => {};
  onCancel: () => void = () => {};

  show(title: string, message: string, onConfirm: () => void, onCancel?: () => void): void {
    this.title = title;
    this.message = message;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel || (() => {});
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  confirm(): void {
    this.onConfirm();
    this.hide();
  }

  cancel(): void {
    this.onCancel();
    this.hide();
  }
}
