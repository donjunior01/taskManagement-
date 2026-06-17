import { Component, ElementRef, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService, AiChatTurn } from '../../../core/services/ai-assistant.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

interface ChatMsg {
  text: string;
  isAi: boolean;
  time: number;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrls: ['./ai-assistant.scss']
})
export class AiAssistantWidgetComponent implements AfterViewChecked {
  @ViewChild('scrollArea') private scrollArea?: ElementRef<HTMLElement>;

  // Legacy global key (pre-fix). It was shared across all users on a browser, leaking one
  // user's conversation to the next. We migrate away from it and delete it on load.
  private static readonly LEGACY_KEY = 'ai_assistant_history';

  /** Per-user storage key so a conversation is only ever visible to the user who created it. */
  private storageKey(): string {
    const id = this.auth.getCurrentUser()?.id;
    return id != null ? `ai_assistant_history_${id}` : 'ai_assistant_history_guest';
  }

  isOpen = false;
  userInput = '';
  loading = false;
  messages: ChatMsg[] = [];
  private shouldScroll = false;

  // Starter questions are tailored to the signed-in user's role, mirroring what
  // their dashboard focuses on.
  suggestions: string[] = [];

  constructor(
    private ai: AiAssistantService,
    private auth: AuthService,
    private language: LanguageService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadHistory();
    // Starter prompts follow the selected language and update live when it's toggled.
    this.language.lang$.subscribe(() => {
      this.suggestions = this.suggestionsForRole();
      this.cdr.detectChanges();
    });
  }

  private suggestionsForRole(): string[] {
    const roles = this.auth.getUserRoles();
    const fr = this.language.current === 'fr';
    if (roles.includes('ROLE_ADMIN')) {
      return fr ? [
        'Comment utiliser mon tableau de bord administrateur ?',
        'Comment créer un utilisateur ou réinitialiser son mot de passe ?',
        'Donne-moi un aperçu de tous les projets et de leur statut',
        'Quels projets sont à risque ou en retard ?'
      ] : [
        'How do I use my admin dashboard?',
        'How do I create a user or reset their password?',
        'Give me an overview of all projects and their status',
        'Which projects are at risk or overdue?'
      ];
    }
    if (roles.includes('ROLE_PROJECT_MANAGER')) {
      return fr ? [
        'Quels de mes projets sont en retard ?',
        'Que doit prioriser mon équipe cette semaine ?',
        'Résume le statut de mes projets'
      ] : [
        'Which of my projects are behind schedule?',
        'What should my team prioritise this week?',
        'Summarise the status of my projects'
      ];
    }
    // Simple user / developer
    return fr ? [
      'Sur quoi devrais-je travailler ensuite ?',
      'Résume mes tâches assignées',
      'Comment terminer ma tâche en cours ?'
    ] : [
      'What should I work on next?',
      'Summarise my assigned tasks',
      'How do I complete my current task?'
    ];
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollArea) {
      this.scrollArea.nativeElement.scrollTop = this.scrollArea.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.shouldScroll = true;
  }

  useSuggestion(s: string): void {
    this.userInput = s;
    this.send();
  }

  send(): void {
    const text = this.userInput.trim();
    if (!text || this.loading) return;

    // History is the conversation so far (before this new message).
    const history: AiChatTurn[] = this.messages.map(m => ({
      role: m.isAi ? 'assistant' : 'user',
      content: m.text
    }));

    this.messages.push({ text, isAi: false, time: Date.now() });
    this.userInput = '';
    this.loading = true;
    this.shouldScroll = true;
    this.persist();

    this.ai.chat(text, { history }).subscribe({
      next: (r) => {
        this.messages.push({ text: r?.reply || 'No response.', isAi: true, time: Date.now() });
        this.loading = false;
        this.shouldScroll = true;
        this.persist();
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages.push({
          text: 'Sorry, I could not reach the assistant right now. Please try again.',
          isAi: true,
          time: Date.now()
        });
        this.loading = false;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      }
    });
  }

  clear(): void {
    this.messages = [];
    localStorage.removeItem(this.storageKey());
  }

  private loadHistory(): void {
    // Remove the legacy shared key so no other user's conversation can ever be read.
    try { localStorage.removeItem(AiAssistantWidgetComponent.LEGACY_KEY); } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(this.storageKey());
      this.messages = raw ? JSON.parse(raw) : [];
    } catch {
      this.messages = [];
    }
  }

  private persist(): void {
    try {
      // Keep the last 40 messages to bound storage.
      const trimmed = this.messages.slice(-40);
      localStorage.setItem(this.storageKey(), JSON.stringify(trimmed));
    } catch { /* ignore quota errors */ }
  }
}
