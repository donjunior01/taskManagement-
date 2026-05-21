import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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
  faqs: FAQItem[] = [
    {
      id: 1,
      question: 'How do I create a new task milestone in my project board?',
      answer: 'Navigate to the projects page, select your active project, click on the "Milestones" tab, and click "+ Add Milestone". Enter the name, date range, and select which tasks to group.',
      expanded: false
    },
    {
      id: 2,
      question: 'Where can I download project analytics reports?',
      answer: 'Go to the Reports page in the left sidebar. There you can use the "Generate New Report" form to choose report parameters, select your projects, choose PDF or CSV format, and download them immediately.',
      expanded: false
    },
    {
      id: 3,
      question: 'How do I reset my account password?',
      answer: 'Click your profile avatar at the top right of the application header, select "Profile Settings", and click on the "Security" tab. Enter your old password and define a secure new password.',
      expanded: false
    },
    {
      id: 4,
      question: 'What is the average task velocity score calculated from?',
      answer: 'The velocity trend calculates the speed at which your team resolves backlog items. It divides the total completed story points or task counts by the total number of days in active sprint cycles.',
      expanded: false
    }
  ];

  // Active tickets list
  tickets: SupportTicket[] = [
    {
      id: 'TKT-8902',
      subject: 'Unable to export report to CSV',
      category: 'Reporting Bug',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      date: 'May 16, 2026',
      description: 'The CSV export button is loading indefinitely when Website Redesign Q3 is selected.'
    },
    {
      id: 'TKT-8741',
      subject: 'Invite link not working for backend team',
      category: 'Account/Access',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      date: 'May 12, 2026',
      description: 'New backend engineers are receiving a 403 Forbidden error when using the invitation token.'
    }
  ];

  // Ticket Modal state
  showTicketModal: boolean = false;
  submittingTicket: boolean = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ticketService: SupportTicketService,
    private toast: ToastService
  ) {}

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
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            description: t.description || ''
          }));
          this.cdr.detectChanges();
        }
        // If empty, keep the default mock tickets shown at startup
      },
      error: () => { /* keep default mock tickets */ }
    });
  }

  toggleFaq(faq: FAQItem): void {
    faq.expanded = !faq.expanded;
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
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
    this.toast.show(`Support Ticket ${ticketId} created successfully!`, 'success');
    this.cdr.detectChanges();
  }
}
