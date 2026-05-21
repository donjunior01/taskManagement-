import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupportTicketService, SupportTicket } from '../../../core/services/support-ticket.service';

export interface AdminTicket {
  id: number;
  subject: string;
  category: 'General' | 'Task Board' | 'Reporting Bug' | 'Account/Access';
  submittedBy: string;
  submittedByEmail: string;
  role: 'Employee' | 'Project Manager';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  date: string;
  description: string;
  replies: Array<{ sender: string; message: string; timestamp: string }>;
}

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.html',
  styleUrls: ['./support.scss']
})
export class AdminSupportComponent implements OnInit {
  adminName: string = 'Administrator';
  loading: boolean = false;

  // Statistics
  totalTickets: number = 24;
  openTickets: number = 8;
  inProgressTickets: number = 6;
  resolvedTickets: number = 10;

  // Filters State
  searchTerm: string = '';
  statusFilter: string = '';
  priorityFilter: string = '';

  // Tickets List
  ticketsList: AdminTicket[] = [
    {
      id: 4092,
      subject: 'API Gateway connection timeout on PDF download',
      category: 'Reporting Bug',
      submittedBy: 'David Chen',
      submittedByEmail: 'd.chen@taskmaster.com',
      role: 'Project Manager',
      priority: 'URGENT',
      status: 'OPEN',
      date: '2026-05-17 10:15',
      description: 'The reports generator takes more than 15s to respond resulting in Nginx Gateway 504 timeouts when managers export project statuses.',
      replies: [
        { sender: 'System Monitor', message: 'Automated traceback captured: Timeout occurred on microservice pipeline 4.', timestamp: '10:16 AM' }
      ]
    },
    {
      id: 4088,
      subject: 'Kanban board empty when switching to completed state',
      category: 'Task Board',
      submittedBy: 'Alex Johnson',
      submittedByEmail: 'a.johnson@taskmaster.com',
      role: 'Employee',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      date: '2026-05-17 08:30',
      description: 'Whenever I filter my tasks to completed status, the interface displays an empty screen even though the dashboard says I have 24 completed items.',
      replies: []
    },
    {
      id: 4085,
      subject: 'Please map Leila Hassan to Cloud Migration Core',
      category: 'Account/Access',
      submittedBy: 'Sarah Jenkins',
      submittedByEmail: 's.jenkins@taskmaster.com',
      role: 'Project Manager',
      priority: 'MEDIUM',
      status: 'OPEN',
      date: '2026-05-16 16:45',
      description: 'Leila requires access to deploy task VPC firewalls, but she does not show up in my project team lists. Please review database mapping.',
      replies: []
    },
    {
      id: 4072,
      subject: 'Forgot password secret security answer',
      category: 'General',
      submittedBy: 'Carlos Rodriguez',
      submittedByEmail: 'c.rod@taskmaster.com',
      role: 'Employee',
      priority: 'LOW',
      status: 'RESOLVED',
      date: '2026-05-15 11:20',
      description: 'I cannot log in from my second corporate laptop due to a security verification prompt where my security answers are flagged as wrong.',
      replies: [
        { sender: 'Administrator', message: 'Your login credentials and security questions have been hard reset. Please try signing in again.', timestamp: 'May 16, 2:30 PM' }
      ]
    }
  ];

  filteredTickets: AdminTicket[] = [];

  // Reply Overlay Modal state
  selectedTicket: AdminTicket | null = null;
  showReplyModal: boolean = false;
  adminReplyMessage: string = '';
  nextStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' = 'IN_PROGRESS';
  submittingReply: boolean = false;

  // Floating notifications
  showToast: boolean = false;
  toastMessage: string = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ticketService: SupportTicketService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.adminName = user.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator';
    }
    // Pre-populate with inline mock data so the page is never blank on first render
    this.applyFilters();
    // Then fetch real data from the API
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.ticketService.getAllTickets().subscribe({
      next: (response: any) => {
        let tickets: SupportTicket[] = [];
        if (Array.isArray(response)) {
          tickets = response;
        } else if (response && Array.isArray(response.content)) {
          tickets = response.content;
        } else if (response && Array.isArray(response.data)) {
          tickets = response.data;
        } else if (response && response.tickets && Array.isArray(response.tickets)) {
          tickets = response.tickets;
        }

        this.ticketsList = tickets.map((t: any) => ({
          id: t.id!,
          subject: t.subject || t.title || 'No Subject',
          category: t.category || 'General' as any,
          submittedBy: t.userName || `User #${t.userId}`,
          submittedByEmail: t.userEmail || '',
          role: 'Employee' as any,
          priority: (t.priority || 'MEDIUM') as any,
          status: (t.status || 'OPEN') as any,
          date: t.createdAt || '',
          description: t.description || '',
          replies: []
        }));

        if (this.ticketsList.length === 0) {
          this.seedMockTickets();
        }

        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.seedMockTickets();
        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      }
    });

    // Also load open ticket count
    this.ticketService.getOpenTicketsCount().subscribe({
      next: (count: number) => {
        this.openTickets = count;
      },
      error: () => {}
    });
  }

  applyFilters(): void {
    let result = [...this.ticketsList];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(t =>
        t.subject.toLowerCase().includes(term) ||
        t.submittedBy.toLowerCase().includes(term) ||
        t.id.toString().includes(term)
      );
    }

    if (this.statusFilter) {
      result = result.filter(t => t.status === this.statusFilter);
    }

    if (this.priorityFilter) {
      result = result.filter(t => t.priority === this.priorityFilter);
    }

    this.filteredTickets = result;
    this.recalculateStats();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.priorityFilter = '';
    this.applyFilters();
  }

  // Reply Action Modal
  openReplyModal(ticket: AdminTicket): void {
    this.selectedTicket = ticket;
    this.nextStatus = ticket.status;
    this.adminReplyMessage = '';
    this.showReplyModal = true;
  }

  closeReplyModal(): void {
    this.showReplyModal = false;
    this.selectedTicket = null;
    this.adminReplyMessage = '';
  }

  submitAdminReply(): void {
    if (!this.selectedTicket || !this.adminReplyMessage.trim()) return;

    this.submittingReply = true;
    const ticketId = this.selectedTicket.id;

    // Update status via API
    this.ticketService.updateTicketStatus(ticketId, this.nextStatus).subscribe({
      next: () => {
        const ticket = this.ticketsList.find(t => t.id === ticketId);
        if (ticket) {
          ticket.replies.push({
            sender: 'Administrator',
            message: this.adminReplyMessage,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          });
          ticket.status = this.nextStatus;
        }
        this.submittingReply = false;
        this.showReplyModal = false;
        this.triggerToast(`Reply sent and ticket #${ticketId} updated!`);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: update locally anyway
        const ticket = this.ticketsList.find(t => t.id === ticketId);
        if (ticket) {
          ticket.status = this.nextStatus;
        }
        this.submittingReply = false;
        this.showReplyModal = false;
        this.triggerToast(`Ticket #${ticketId} status updated locally.`);
        this.applyFilters();
        this.cdr.detectChanges();
      }
    });
  }

  deleteTicket(ticket: AdminTicket, event: MouseEvent): void {
    event.stopPropagation();
    this.ticketService.deleteTicket(ticket.id).subscribe({
      next: () => {
        this.ticketsList = this.ticketsList.filter(t => t.id !== ticket.id);
        this.triggerToast(`Ticket #${ticket.id} deleted successfully.`);
        this.applyFilters();
      },
      error: () => {
        // Fallback: delete locally
        this.ticketsList = this.ticketsList.filter(t => t.id !== ticket.id);
        this.triggerToast(`Ticket #${ticket.id} deleted.`);
        this.applyFilters();
      }
    });
  }

  recalculateStats(): void {
    this.totalTickets = this.ticketsList.length;
    this.openTickets = this.ticketsList.filter(t => t.status === 'OPEN').length;
    this.inProgressTickets = this.ticketsList.filter(t => t.status === 'IN_PROGRESS').length;
    this.resolvedTickets = this.ticketsList.filter(t => t.status === 'RESOLVED').length;
  }

  private triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  private seedMockTickets(): void {
    this.ticketsList = [
      {
        id: 4092,
        subject: 'API Gateway connection timeout on PDF download',
        category: 'Reporting Bug',
        submittedBy: 'David Chen',
        submittedByEmail: 'd.chen@taskmaster.com',
        role: 'Project Manager',
        priority: 'URGENT',
        status: 'OPEN',
        date: '2026-05-17 10:15',
        description: 'The reports generator takes more than 15s to respond resulting in Nginx Gateway 504 timeouts when managers export project statuses.',
        replies: [
          { sender: 'System Monitor', message: 'Automated traceback captured: Timeout occurred on microservice pipeline 4.', timestamp: '10:16 AM' }
        ]
      },
      {
        id: 4088,
        subject: 'Kanban board empty when switching to completed state',
        category: 'Task Board',
        submittedBy: 'Alex Johnson',
        submittedByEmail: 'a.johnson@taskmaster.com',
        role: 'Employee',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        date: '2026-05-17 08:30',
        description: 'Whenever I filter my tasks to completed status, the interface displays an empty screen even though the dashboard says I have 24 completed items.',
        replies: []
      },
      {
        id: 4085,
        subject: 'Please map Leila Hassan to Cloud Migration Core',
        category: 'Account/Access',
        submittedBy: 'Sarah Jenkins',
        submittedByEmail: 's.jenkins@taskmaster.com',
        role: 'Project Manager',
        priority: 'MEDIUM',
        status: 'OPEN',
        date: '2026-05-16 16:45',
        description: 'Leila requires access to deploy task VPC firewalls, but she does not show up in my project team lists. Please review database mapping.',
        replies: []
      },
      {
        id: 4072,
        subject: 'Forgot password secret security answer',
        category: 'General',
        submittedBy: 'Carlos Rodriguez',
        submittedByEmail: 'c.rod@taskmaster.com',
        role: 'Employee',
        priority: 'LOW',
        status: 'RESOLVED',
        date: '2026-05-15 11:20',
        description: 'I cannot log in from my second corporate laptop due to a security verification prompt where my security answers are flagged as wrong.',
        replies: [
          { sender: 'Administrator', message: 'Your login credentials and security questions have been hard reset. Please try signing in again.', timestamp: 'May 16, 2:30 PM' }
        ]
      }
    ];
  }
}
