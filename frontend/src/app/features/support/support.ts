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
      question: 'Comment créer un nouveau jalon dans mon tableau de projet ?',
      answer: 'Allez sur la page des projets, sélectionnez votre projet actif, ouvrez l\'onglet « Jalons » puis cliquez sur « + Ajouter un jalon ». Saisissez le nom, la période et choisissez les tâches à regrouper.',
      expanded: false
    },
    {
      id: 2,
      question: 'Où puis-je télécharger les rapports d\'analyse de projet ?',
      answer: 'Rendez-vous sur la page Rapports dans la barre latérale. Vous pouvez y choisir les paramètres, sélectionner vos projets, choisir le format PDF ou CSV et les exporter immédiatement.',
      expanded: false
    },
    {
      id: 3,
      question: 'Comment réinitialiser le mot de passe de mon compte ?',
      answer: 'Cliquez sur votre avatar en haut à droite de l\'en-tête, ouvrez « Modifier le profil » puis l\'onglet « Sécurité ». Saisissez votre ancien mot de passe et définissez-en un nouveau, sécurisé.',
      expanded: false
    },
    {
      id: 4,
      question: 'Sur quoi se base le score de vélocité des tâches ?',
      answer: 'La tendance de vélocité mesure la vitesse à laquelle votre équipe résout le backlog. Elle divise le nombre total de tâches terminées par le nombre de jours des cycles de sprint actifs.',
      expanded: false
    }
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
            date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
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

  priorityLabel(p: string): string {
    return ({ LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Haute', URGENT: 'Urgente' } as Record<string, string>)[(p || '').toUpperCase()] || p;
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
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
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
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
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
    this.toast.show(`Ticket de support ${ticketId} créé avec succès !`, 'success');
    this.cdr.detectChanges();
  }
}
