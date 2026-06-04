import { Component, ElementRef, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAssistantService, AiChatTurn } from '../../../core/services/ai-assistant.service';
import { AuthService } from '../../../core/services/auth.service';

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

  private readonly STORAGE_KEY = 'ai_assistant_history';

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
    private cdr: ChangeDetectorRef
  ) {
    this.loadHistory();
    this.suggestions = this.suggestionsForRole();
  }

  private suggestionsForRole(): string[] {
    const roles = this.auth.getUserRoles();
    if (roles.includes('ROLE_ADMIN')) {
      return [
        'Give me an overview of all projects and their status',
        'Which projects are at risk or overdue?',
        'Summarise overall team workload and activity'
      ];
    }
    if (roles.includes('ROLE_PROJECT_MANAGER')) {
      return [
        'Which of my projects are behind schedule?',
        'What should my team prioritise this week?',
        'Summarise the status of my projects'
      ];
    }
    // Simple user / developer
    return [
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
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private loadHistory(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) this.messages = JSON.parse(raw);
    } catch {
      this.messages = [];
    }
  }

  private persist(): void {
    try {
      // Keep the last 40 messages to bound storage.
      const trimmed = this.messages.slice(-40);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* ignore quota errors */ }
  }
}
