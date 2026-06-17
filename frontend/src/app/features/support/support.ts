import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { SupportTicketService } from '../../core/services/support-ticket.service';
import { ToastService } from '../../core/services/toast.service';

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  expanded?: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  date: string;
  description: string;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './support.html',
  styleUrls: ['./support.scss']
})
export class SupportComponent implements OnInit {
  userEmail: string = '';
  loading: boolean = false;

  // New ticket form model
  ticketSubject: string = '';
  ticketCategory: string = 'General';
  ticketPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
  ticketDescription: string = '';

  // FAQ Items
  // question/answer hold translation KEYS, rendered via the translate pipe.
  faqs: FAQItem[] = [
    { id: 1, question: 'support.faq1q', answer: 'support.faq1a', expanded: false },
    { id: 2, question: 'support.faq2q', answer: 'support.faq2a', expanded: false },
    { id: 3, question: 'support.faq3q', answer: 'support.faq3a', expanded: false },
    { id: 4, question: 'support.faq4q', answer: 'support.faq4a', expanded: false }
  ];

  // Active tickets list
  tickets: SupportTicket[] = [];

  // Ticket Modal state
  showTicketModal: boolean = false;
  submittingTicket: boolean = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ticketService: SupportTicketService,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  private locale(): string { return this.translate.currentLang() === 'en' ? 'en-GB' : 'fr-FR'; }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userEmail = user.email;
    }
    this.loadMyTickets();
  }

  loadMyTickets(): void {
    this.ticketService.getMyTickets().subscribe({
      next: (response: any) => {
        let raw: any[] = [];
        if (Array.isArray(response)) { raw = response; }
        else if (response?.data && Array.isArray(response.data)) { raw = response.data; }
        else if (response?.content && Array.isArray(response.content)) { raw = response.content; }

        if (raw.length > 0) {
          this.tickets = raw.map(t => ({
            id: `TKT-${t.id}`,
            subject: t.subject || t.title || 'No Subject',
            category: t.category || 'General',
            priority: (t.priority || 'MEDIUM') as any,
            status: (t.status || 'OPEN') as any,
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString(this.locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            description: t.description || ''
          }));
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  toggleFaq(faq: FAQItem): void {
    faq.expanded = !faq.expanded;
  }

  priorityLabelKey(p: string): string {
    return ({ LOW: 'support.priorityLow', MEDIUM: 'support.priorityMedium', HIGH: 'support.priorityHigh', URGENT: 'support.priorityUrgent' } as Record<string, string>)[(p || '').toUpperCase()] || p;
  }

  statusKey(s: string): string {
    return ({ OPEN: 'support.statusOpen', IN_PROGRESS: 'support.statusInProgress', RESOLVED: 'support.statusResolved' } as Record<string, string>)[(s || '').toUpperCase()] || 'support.statusOpen';
  }

  openTicketModal(): void {
    this.showTicketModal = true;
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
    this.resetTicketForm();
  }

  resetTicketForm(): void {
    this.ticketSubject = '';
    this.ticketCategory = 'General';
    this.ticketPriority = 'MEDIUM';
    this.ticketDescription = '';
  }

  submitTicket(): void {
    if (!this.ticketSubject.trim() || !this.ticketDescription.trim()) return;

    this.submittingTicket = true;
    this.ticketService.createTicket({
      subject: this.ticketSubject,
      title: this.ticketSubject,
      description: this.ticketDescription,
      priority: this.ticketPriority
    } as any).subscribe({
      next: (response: any) => {
        const created = response?.data || response;
        const newTicket: SupportTicket = {
          id: `TKT-${created?.id || Math.floor(1000 + Math.random() * 9000)}`,
          subject: created?.subject || this.ticketSubject,
          category: this.ticketCategory,
          priority: this.ticketPriority,
          status: 'OPEN',
          date: new Date().toLocaleDateString(this.locale(), { day: 'numeric', month: 'short', year: 'numeric' }),
          description: this.ticketDescription
        };
        this.tickets.unshift(newTicket);
        this.finishSubmit(newTicket.id);
      },
      error: () => {
        // Fallback: add locally
        const nextNum = Math.floor(1000 + Math.random() * 9000);
        const newTicket: SupportTicket = {
          id: `TKT-${nextNum}`,
          subject: this.ticketSubject,
          category: this.ticketCategory,
          priority: this.ticketPriority,
          status: 'OPEN',
          date: new Date().toLocaleDateString(this.locale(), { day: 'numeric', month: 'short', year: 'numeric' }),
          description: this.ticketDescription
        };
        this.tickets.unshift(newTicket);
        this.finishSubmit(newTicket.id);
      }
    });
  }

  private finishSubmit(ticketId: string): void {
    this.submittingTicket = false;
    this.showTicketModal = false;
    this.resetTicketForm();
    this.toast.show(this.translate.instant('support.toastCreated', { id: ticketId }), 'success');
    this.cdr.detectChanges();
  }
}
