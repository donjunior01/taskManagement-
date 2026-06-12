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
  adminName: string = 'Administrateur';
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
      this.adminName = user.firstName ? `${user.firstName} ${user.lastName}` : 'Administrateur';
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
          subject: t.subject || t.title || 'Sans sujet',
          category: t.category || 'General' as any,
          submittedBy: t.userName || `Utilisateur n°${t.userId}`,
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
            sender: 'Administrateur',
            message: this.adminReplyMessage,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          });
          ticket.status = this.nextStatus;
        }
        this.submittingReply = false;
        this.showReplyModal = false;
        this.triggerToast(`Réponse envoyée et ticket n°${ticketId} mis à jour !`);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.submittingReply = false;
        this.triggerToast(err?.error?.message || `Échec de la mise à jour du ticket n°${ticketId}.`, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  deleteTicket(ticket: AdminTicket, event: MouseEvent): void {
    event.stopPropagation();
    this.ticketService.deleteTicket(ticket.id).subscribe({
      next: () => {
        this.ticketsList = this.ticketsList.filter(t => t.id !== ticket.id);
        this.triggerToast(`Ticket n°${ticket.id} supprimé avec succès.`);
        this.applyFilters();
      },
      error: (err: any) => {
        this.triggerToast(err?.error?.message || `Échec de la suppression du ticket n°${ticket.id}.`, 'error');
      }
    });
  }

  // Status tabs (prototype)
  statusTabs: { label: string; value: string }[] = [
    { label: 'Tous', value: '' },
    { label: 'Ouverts', value: 'OPEN' },
    { label: 'En cours', value: 'IN_PROGRESS' },
    { label: 'Résolus', value: 'RESOLVED' }
  ];

  get criticalCount(): number {
    return this.ticketsList.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;
  }

  priorityEmoji(p: string): string {
    switch (p) {
      case 'URGENT': return '🔴';
      case 'HIGH':   return '🟠';
      case 'MEDIUM': return '🟡';
      default:       return '⚪';
    }
  }

  priorityLabel(p: string): string {
    switch (p) {
      case 'URGENT': return 'Critique';
      case 'HIGH':   return 'Haute';
      case 'MEDIUM': return 'Normale';
      default:       return 'Basse';
    }
  }

  markResolved(ticket: AdminTicket, event: MouseEvent): void {
    event.stopPropagation();
    this.ticketService.updateTicketStatus(ticket.id, 'RESOLVED').subscribe({
      next: () => { ticket.status = 'RESOLVED'; this.triggerToast(`Ticket n°${ticket.id} résolu.`); this.applyFilters(); this.cdr.detectChanges(); },
      error: (err: any) => { this.triggerToast(err?.error?.message || `Échec de la résolution du ticket n°${ticket.id}.`, 'error'); }
    });
  }

  recalculateStats(): void {
    this.totalTickets = this.ticketsList.length;
    this.openTickets = this.ticketsList.filter(t => t.status === 'OPEN').length;
    this.inProgressTickets = this.ticketsList.filter(t => t.status === 'IN_PROGRESS').length;
    this.resolvedTickets = this.ticketsList.filter(t => t.status === 'RESOLVED').length;
  }

  private triggerToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(msg, type);
  }

}
