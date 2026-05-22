import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SupportTicketService, SupportTicket } from '../../../core/services/support-ticket.service';
import { ToastService } from '../../../core/services/toast.service';

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
  totalTickets: number = 0;
  openTickets: number = 0;
  inProgressTickets: number = 0;
  resolvedTickets: number = 0;

  // Filters State
  searchTerm: string = '';
  statusFilter: string = '';
  priorityFilter: string = '';

  // Tickets List
  ticketsList: AdminTicket[] = [];

  filteredTickets: AdminTicket[] = [];

  // Reply Overlay Modal state
  selectedTicket: AdminTicket | null = null;
  showReplyModal: boolean = false;
  adminReplyMessage: string = '';
  nextStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' = 'IN_PROGRESS';
  submittingReply: boolean = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ticketService: SupportTicketService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.adminName = user.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator';
    }
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

        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.ticketsList = [];
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
    this.toast.show(msg, 'success');
  }

}
