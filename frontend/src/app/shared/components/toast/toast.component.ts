import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: (Toast & { exiting: boolean })[] = [];
  private sub!: Subscription;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts$.subscribe(toast => {
      // Defer to a fresh macrotask so we never run change detection *inside* the caller's
      // CD/event cycle (which triggers NG0100 ExpressionChangedAfterItHasBeenCheckedError
      // on the component that fired the toast, e.g. a button's [disabled] binding).
      setTimeout(() => {
        const entry = { ...toast, exiting: false };
        this.toasts.push(entry);
        this.cdr.detectChanges();

        // Start exit animation at 2700ms, remove at 3000ms
        const exitTimer = setTimeout(() => this.dismiss(toast.id), 2700);
        const removeTimer = setTimeout(() => this.remove(toast.id), 3000);
        this.timers.set(toast.id, exitTimer);
        this.timers.set(toast.id + 100000, removeTimer);
      });
    });
  }

  dismiss(id: number): void {
    const entry = this.toasts.find(t => t.id === id);
    if (entry) {
      entry.exiting = true;
      this.cdr.detectChanges();
    }
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }

  close(id: number): void {
    clearTimeout(this.timers.get(id));
    clearTimeout(this.timers.get(id + 100000));
    this.dismiss(id);
    setTimeout(() => this.remove(id), 300);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.timers.forEach(t => clearTimeout(t));
  }
}
