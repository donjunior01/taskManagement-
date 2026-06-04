import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';

/**
 * Small reusable button that drafts a description from a title using the AI assistant.
 * Drop it next to any description field in any creation/edit modal:
 *
 *   <app-ai-describe [type]="'PROJECT'" [title]="form.name"
 *                    (generated)="form.description = $event"></app-ai-describe>
 *
 * It is disabled until a title is present, shows its own loading state, and falls back
 * to a rule-based description when no AI key is configured (handled server-side).
 */
@Component({
  selector: 'app-ai-describe',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="ai-describe-btn"
            [disabled]="loading || !title || !title.trim()"
            (click)="generate()"
            title="Generate a description from the title using AI">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"></path>
      </svg>
      <span *ngIf="!loading">{{ label }}</span>
      <span *ngIf="loading">Generating…</span>
    </button>
  `,
  styles: [`
    .ai-describe-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 1px solid var(--primary, #2563eb);
      background: transparent;
      color: var(--primary, #2563eb);
      font-size: 11.5px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s ease, color .15s ease, opacity .15s ease;
    }
    .ai-describe-btn svg { width: 13px; height: 13px; }
    .ai-describe-btn:hover:not(:disabled) { background: var(--primary, #2563eb); color: #fff; }
    .ai-describe-btn:disabled { opacity: .5; cursor: default; }
  `]
})
export class AiDescribeButtonComponent {
  /** Entity type, e.g. PROJECT, TASK, DELIVERABLE, EVENT, TEAM. */
  @Input() type = 'TASK';
  /** The title/name the description should be generated from. */
  @Input() title = '';
  /** Optional extra context (e.g. parent project name). */
  @Input() context?: string;
  /** Button label. */
  @Input() label = 'Generate with AI';
  /** Emits the generated description text. */
  @Output() generated = new EventEmitter<string>();

  loading = false;

  constructor(private ai: AiAssistantService) {}

  generate(): void {
    const title = (this.title || '').trim();
    if (!title || this.loading) return;
    this.loading = true;
    this.ai.generateDescription(this.type, title, this.context).subscribe({
      next: (desc) => {
        if (desc) this.generated.emit(desc);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
