import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ImportService, ImportResult } from '../../../core/services/import.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="im-wrap">
    <div class="im-head">
      <h2>{{ 'admin.import.title' | translate }}</h2>
      <p class="im-sub">{{ 'admin.import.subtitle' | translate }}</p>
    </div>

    <div class="im-tabs">
      <button [class.on]="source === 'trello'" (click)="setSource('trello')">Trello</button>
      <button [class.on]="source === 'asana'" (click)="setSource('asana')">Asana</button>
      <button [class.on]="source === 'jira'" (click)="setSource('jira')">Jira</button>
    </div>

    <!-- Trello -->
    <div class="im-card" *ngIf="source === 'trello'">
      <div class="im-badge trello">Trello</div>
      <p class="im-how">{{ 'admin.import.trelloHow' | translate }}</p>

      <label class="im-file">
        <input type="file" accept=".json,application/json" (change)="onTrelloFile($event)" />
        <span>{{ fileName || ('admin.import.chooseFile' | translate) }}</span>
      </label>

      <div class="im-preview" *ngIf="board && !result">{{ 'admin.import.preview' | translate:{ name: boardName, cards: cardCount } }}</div>
      <div class="im-error" *ngIf="parseError">{{ 'admin.import.badFile' | translate }}</div>

      <button class="btn-primary" [disabled]="!board || importing" (click)="doImportTrello()">
        {{ importing ? ('admin.import.importing' | translate) : ('admin.import.import' | translate) }}
      </button>
    </div>

    <!-- Asana / Jira (both CSV) -->
    <div class="im-card" *ngIf="source === 'asana' || source === 'jira'">
      <div class="im-badge" [ngClass]="source">{{ source === 'jira' ? 'Jira' : 'Asana' }}</div>
      <p class="im-how">{{ (source === 'jira' ? 'admin.import.jiraHow' : 'admin.import.asanaHow') | translate }}</p>

      <label class="im-lbl">{{ 'admin.import.projectName' | translate }}</label>
      <input class="im-input" [(ngModel)]="asanaProjectName" [placeholder]="'admin.import.projectNamePh' | translate" />

      <label class="im-file">
        <input type="file" accept=".csv,text/csv" (change)="onCsvFile($event)" />
        <span>{{ asanaFileName || ('admin.import.chooseCsv' | translate) }}</span>
      </label>

      <div class="im-preview" *ngIf="csvText && !result">{{ 'admin.import.csvPreview' | translate:{ rows: asanaRows } }}</div>
      <div class="im-error" *ngIf="asanaError">{{ 'admin.import.badCsv' | translate }}</div>

      <button class="btn-primary" [disabled]="!csvText || importing" (click)="doImportCsv()">
        {{ importing ? ('admin.import.importing' | translate) : ('admin.import.import' | translate) }}
      </button>
    </div>

    <div class="im-card im-result" *ngIf="result">
      <div class="im-ok">✓ {{ 'admin.import.done' | translate:{ tasks: result.tasksImported, project: result.projectName } }}</div>
      <div class="im-skip" *ngIf="result.cardsSkipped > 0">{{ 'admin.import.skipped' | translate:{ n: result.cardsSkipped } }}</div>
      <button class="btn-ghost" (click)="openProject()">{{ 'admin.import.openProject' | translate }}</button>
    </div>
  </div>
  `,
  styles: [`
    .im-wrap { padding: 24px; max-width: 620px; }
    .im-head h2 { font-size: 20px; font-weight: 700; margin: 0; }
    .im-sub { color: var(--text-muted, #64748b); font-size: 13px; margin: 4px 0 16px; }
    .im-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
    .im-tabs button { padding: 8px 16px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 9px; cursor: pointer; font-weight: 600; font-size: 13px; color: var(--text-muted, #64748b); }
    .im-tabs button.on { background: var(--primary, #2563eb); color: #fff; border-color: var(--primary, #2563eb); }
    .im-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
    .im-badge { display: inline-block; color: #fff; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; }
    .im-badge.trello { background: #0079bf; }
    .im-badge.asana { background: #f06a6a; }
    .im-badge.jira { background: #0052cc; }
    .im-how { color: var(--text-muted, #64748b); font-size: 13px; margin: 12px 0 16px; line-height: 1.5; }
    .im-lbl { display: block; font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); margin: 6px 0 5px; }
    .im-input { height: 40px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13.5px; outline: none; font-family: inherit; background: var(--bg-card); color: var(--text); width: 100%; box-sizing: border-box; margin-bottom: 14px; }
    .im-file { display: block; border: 1.5px dashed var(--border); border-radius: 10px; padding: 16px; text-align: center; cursor: pointer; font-size: 13.5px; color: var(--text-muted, #64748b); }
    .im-file input { display: none; }
    .im-preview { margin: 14px 0; font-size: 13.5px; color: var(--text); }
    .im-error { margin: 14px 0; font-size: 13px; color: #dc2626; }
    .btn-primary { margin-top: 14px; background: var(--primary, #2563eb); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { margin-top: 12px; background: transparent; border: 1px solid var(--border); padding: 8px 14px; border-radius: 9px; cursor: pointer; font-size: 13px; color: var(--text); }
    .im-result { margin-top: 16px; }
    .im-ok { color: #16a34a; font-weight: 700; font-size: 14px; }
    .im-skip { color: var(--text-muted, #64748b); font-size: 12.5px; margin-top: 4px; }
  `]
})
export class ImportComponent {
  source: 'trello' | 'asana' | 'jira' = 'trello';

  // Trello
  board: any = null;
  boardName = '';
  cardCount = 0;
  fileName = '';
  parseError = false;

  // Asana
  csvText = '';
  asanaFileName = '';
  asanaProjectName = '';
  asanaRows = 0;
  asanaError = false;

  importing = false;
  result: ImportResult | null = null;

  constructor(private svc: ImportService, private toast: ToastService,
              private translate: TranslateService, private router: Router, private cdr: ChangeDetectorRef) {}

  setSource(s: 'trello' | 'asana' | 'jira'): void { this.source = s; this.reset(); }

  onTrelloFile(event: Event): void {
    this.reset();
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        this.board = parsed;
        this.boardName = parsed?.name || this.translate.instant('admin.import.untitled');
        this.cardCount = Array.isArray(parsed?.cards) ? parsed.cards.length : 0;
      } catch { this.parseError = true; this.board = null; }
      this.cdr.detectChanges();
    };
    reader.readAsText(file);
  }

  onCsvFile(event: Event): void {
    const keepSource = this.source;
    this.reset();
    this.source = keepSource;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.asanaFileName = file.name;
    if (!this.asanaProjectName) this.asanaProjectName = file.name.replace(/\.csv$/i, '');
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string) || '';
      if (!text.trim()) { this.asanaError = true; }
      else { this.csvText = text; this.asanaRows = Math.max(0, text.split(/\r\n|\n/).filter(l => l.trim()).length - 1); }
      this.cdr.detectChanges();
    };
    reader.readAsText(file);
  }

  doImportTrello(): void {
    if (!this.board) return;
    this.run(this.svc.importTrello(this.board));
  }

  doImportCsv(): void {
    if (!this.csvText) return;
    const obs = this.source === 'jira'
      ? this.svc.importJira(this.asanaProjectName, this.csvText)
      : this.svc.importAsana(this.asanaProjectName, this.csvText);
    this.run(obs);
  }

  private run(obs: any): void {
    this.importing = true;
    obs.subscribe({
      next: (r: any) => { this.importing = false; this.result = r?.data || r; this.toast.show(this.translate.instant('admin.import.done', { tasks: this.result?.tasksImported, project: this.result?.projectName }), 'success'); this.cdr.detectChanges(); },
      error: (e: any) => { this.importing = false; this.toast.show(e?.error?.message || this.translate.instant('admin.import.failed'), 'error'); this.cdr.detectChanges(); }
    });
  }

  openProject(): void {
    if (this.result?.projectId) this.router.navigate(['/admin/projects', this.result.projectId]);
  }

  private reset(): void {
    this.board = null; this.boardName = ''; this.cardCount = 0; this.fileName = ''; this.parseError = false;
    this.csvText = ''; this.asanaFileName = ''; this.asanaRows = 0; this.asanaError = false;
    this.result = null;
  }
}
