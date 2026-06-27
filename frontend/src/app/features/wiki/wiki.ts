import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WikiService, WikiPage } from '../../core/services/wiki.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

interface TreeNode { page: WikiPage; depth: number; }

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
  <div class="wk">
    <!-- Sidebar: page tree -->
    <aside class="wk-side">
      <div class="wk-side-top">
        <input class="wk-search" [(ngModel)]="search" [placeholder]="'wiki.searchPh' | translate" />
        <button class="wk-new" (click)="createPage(null)" [title]="'wiki.newPage' | translate">+</button>
      </div>
      <div class="wk-tree">
        <button *ngFor="let n of visibleTree"
                class="wk-node" [class.active]="selected?.id === n.page.id"
                [style.padding-left.px]="10 + n.depth * 14"
                (click)="select(n.page)">
          <span class="wk-ic">{{ n.page.icon || '📄' }}</span>
          <span class="wk-tt">{{ n.page.title || ('wiki.untitled' | translate) }}</span>
        </button>
        <div class="wk-empty" *ngIf="!loading && pages.length === 0">{{ 'wiki.emptyTree' | translate }}</div>
      </div>
    </aside>

    <!-- Main pane -->
    <section class="wk-main">
      <div class="wk-blank" *ngIf="!selected && !loading">
        <div class="wk-blank-ic">📚</div>
        <h3>{{ 'wiki.welcomeTitle' | translate }}</h3>
        <p>{{ 'wiki.welcomeText' | translate }}</p>
        <button class="btn-primary" (click)="createPage(null)">+ {{ 'wiki.newPage' | translate }}</button>
      </div>

      <ng-container *ngIf="selected">
        <!-- View mode -->
        <ng-container *ngIf="!editing">
          <div class="wk-head">
            <div class="wk-crumb" *ngIf="breadcrumb(selected).length">
              <span *ngFor="let c of breadcrumb(selected); let last = last">
                <a (click)="select(c)">{{ c.icon || '📄' }} {{ c.title }}</a><span *ngIf="!last"> / </span>
              </span>
            </div>
            <h1>{{ selected.icon || '📄' }} {{ selected.title }}</h1>
            <div class="wk-meta">
              <span *ngIf="selected.updatedByName">{{ 'wiki.editedBy' | translate:{ name: selected.updatedByName } }}</span>
              <span *ngIf="selected.updatedAt">· {{ selected.updatedAt | date:'dd MMM yyyy, HH:mm' }}</span>
            </div>
            <div class="wk-actions">
              <button class="btn-ghost" (click)="startEdit()">✎ {{ 'wiki.edit' | translate }}</button>
              <button class="btn-ghost" (click)="createPage(selected.id!)">+ {{ 'wiki.subPage' | translate }}</button>
              <button class="btn-ghost danger" *ngIf="canManage" (click)="remove(selected)">🗑 {{ 'wiki.delete' | translate }}</button>
            </div>
          </div>
          <article class="wk-content" *ngIf="selected.content; else noContent" [innerHTML]="rendered"></article>
          <ng-template #noContent><div class="wk-nocontent">{{ 'wiki.noContent' | translate }}</div></ng-template>
        </ng-container>

        <!-- Edit mode -->
        <ng-container *ngIf="editing">
          <div class="wk-edit-bar">
            <input class="wk-icon-in" [(ngModel)]="draft.icon" maxlength="2" placeholder="📄" />
            <input class="wk-title-in" [(ngModel)]="draft.title" [placeholder]="'wiki.titlePh' | translate" />
            <div class="wk-edit-actions">
              <button class="btn-ghost" (click)="cancelEdit()">{{ 'wiki.cancel' | translate }}</button>
              <button class="btn-primary" (click)="saveEdit()" [disabled]="!draft.title.trim() || busy">{{ 'wiki.save' | translate }}</button>
            </div>
          </div>
          <div class="wk-edit-body">
            <textarea class="wk-editor" [(ngModel)]="draft.content" (ngModelChange)="onDraftChange()" [placeholder]="'wiki.contentPh' | translate"></textarea>
            <div class="wk-preview">
              <div class="wk-preview-label">{{ 'wiki.preview' | translate }}</div>
              <article class="wk-content" [innerHTML]="draftRendered"></article>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </section>
  </div>
  `,
  styles: [`
    .wk { display: grid; grid-template-columns: 270px 1fr; gap: 0; height: calc(100vh - var(--header-h, 64px) - 40px); min-height: 480px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .wk-side { border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg-muted); min-width: 0; }
    .wk-side-top { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid var(--border-light); }
    .wk-search { flex: 1; min-width: 0; padding: 8px 11px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; background: var(--bg-card); color: var(--text-primary); }
    .wk-new { width: 34px; flex-shrink: 0; border: none; background: var(--primary); color: #fff; border-radius: 8px; font-size: 18px; cursor: pointer; }
    .wk-tree { flex: 1; overflow-y: auto; padding: 8px; }
    .wk-node { width: 100%; display: flex; align-items: center; gap: 7px; background: none; border: none; padding: 7px 10px; border-radius: 7px; cursor: pointer; text-align: left; font-size: 13px; color: var(--text-secondary); }
    .wk-node:hover { background: var(--bg-subtle); }
    .wk-node.active { background: var(--primary-bg); color: var(--primary); font-weight: 600; }
    .wk-ic { flex-shrink: 0; }
    .wk-tt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wk-empty, .wk-nocontent { padding: 16px; color: var(--text-muted); font-size: 13px; }
    .wk-main { overflow-y: auto; padding: 28px 34px; min-width: 0; }
    .wk-blank { text-align: center; max-width: 420px; margin: 8% auto; color: var(--text-muted); }
    .wk-blank-ic { font-size: 46px; }
    .wk-blank h3 { color: var(--text-primary); margin: 12px 0 6px; }
    .wk-crumb { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }
    .wk-crumb a { color: var(--text-muted); cursor: pointer; }
    .wk-crumb a:hover { color: var(--primary); text-decoration: underline; }
    .wk-head h1 { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px; }
    .wk-meta { font-size: 12px; color: var(--text-muted); display: flex; gap: 6px; margin-bottom: 14px; }
    .wk-actions { display: flex; gap: 8px; margin-bottom: 18px; border-bottom: 1px solid var(--border-light); padding-bottom: 16px; flex-wrap: wrap; }
    .btn-primary { background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 8px 15px; font-weight: 600; font-size: 13px; cursor: pointer; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ghost { background: none; border: 1px solid var(--border); border-radius: 7px; padding: 6px 12px; font-size: 12.5px; cursor: pointer; color: var(--text-secondary); }
    .btn-ghost.danger { color: #dc2626; border-color: #fecaca; }
    .wk-edit-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
    .wk-icon-in { width: 46px; text-align: center; padding: 9px 6px; border: 1px solid var(--border); border-radius: 8px; font-size: 16px; background: var(--bg-card); }
    .wk-title-in { flex: 1; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 18px; font-weight: 700; background: var(--bg-card); color: var(--text-primary); }
    .wk-edit-actions { display: flex; gap: 8px; }
    .wk-edit-body { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; height: calc(100% - 60px); }
    .wk-editor { width: 100%; height: 100%; min-height: 360px; resize: none; padding: 14px; border: 1px solid var(--border); border-radius: 10px; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; font-size: 13px; line-height: 1.6; background: var(--bg-muted); color: var(--text-primary); }
    .wk-preview { overflow-y: auto; border: 1px solid var(--border-light); border-radius: 10px; padding: 4px 16px; }
    .wk-preview-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); font-weight: 700; padding: 8px 0; }
    .wk-content { font-size: 14.5px; line-height: 1.7; color: var(--text-secondary); }
    .wk-content :is(h1,h2,h3,h4) { color: var(--text-primary); font-weight: 700; margin: 1.3em 0 .5em; line-height: 1.3; }
    .wk-content h1 { font-size: 24px; } .wk-content h2 { font-size: 20px; border-bottom: 1px solid var(--border-light); padding-bottom: .3em; } .wk-content h3 { font-size: 16.5px; }
    .wk-content p { margin: .7em 0; }
    .wk-content a { color: var(--primary); }
    .wk-content code { background: var(--bg-subtle); padding: 2px 6px; border-radius: 5px; font-family: ui-monospace, monospace; font-size: .9em; }
    .wk-content pre { background: var(--bg-subtle); padding: 14px; border-radius: 10px; overflow-x: auto; }
    .wk-content pre code { background: none; padding: 0; }
    .wk-content ul, .wk-content ol { padding-left: 1.5em; margin: .6em 0; }
    .wk-content li { margin: .25em 0; }
    .wk-content blockquote { border-left: 3px solid var(--primary); margin: .8em 0; padding: .2em 1em; color: var(--text-muted); background: var(--bg-muted); border-radius: 0 8px 8px 0; }
    .wk-content hr { border: none; border-top: 1px solid var(--border); margin: 1.4em 0; }
    .wk-content table { border-collapse: collapse; margin: .8em 0; }
    .wk-content th, .wk-content td { border: 1px solid var(--border); padding: 6px 11px; }
    @media (max-width: 820px) { .wk { grid-template-columns: 1fr; } .wk-side { display: none; } .wk-edit-body { grid-template-columns: 1fr; } .wk-preview { display: none; } }
  `]
})
export class WikiComponent implements OnInit {
  pages: WikiPage[] = [];
  loading = true;
  busy = false;
  selected: WikiPage | null = null;
  editing = false;
  draft: WikiPage = { title: '', content: '', icon: '' };
  search = '';
  rendered: SafeHtml = '';
  draftRendered: SafeHtml = '';
  canManage = false;

  constructor(
    private svc: WikiService,
    private perm: PermissionService,
    private toast: ToastService,
    private t: TranslateService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.canManage = this.perm.has('wiki.manage');
    this.load();
  }

  load(selectId?: number): void {
    this.loading = true;
    this.svc.list().subscribe({
      next: p => {
        this.pages = p || [];
        this.loading = false;
        const target = selectId != null ? this.pages.find(x => x.id === selectId) : (this.selected ? this.pages.find(x => x.id === this.selected!.id) : null);
        if (target) this.select(target);
        else if (!this.selected && this.pages.length) this.select(this.pages[0]);
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Tree ──
  get visibleTree(): TreeNode[] {
    const q = this.search.trim().toLowerCase();
    if (q) {
      return this.pages.filter(p => (p.title || '').toLowerCase().includes(q)).map(p => ({ page: p, depth: 0 }));
    }
    const byParent = new Map<number | null, WikiPage[]>();
    for (const p of this.pages) {
      const k = p.parentId ?? null;
      (byParent.get(k) || byParent.set(k, []).get(k)!).push(p);
    }
    const out: TreeNode[] = [];
    const walk = (parent: number | null, depth: number) => {
      for (const p of (byParent.get(parent) || [])) {
        out.push({ page: p, depth });
        walk(p.id!, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }

  breadcrumb(p: WikiPage): WikiPage[] {
    const chain: WikiPage[] = [];
    let cur: WikiPage | undefined = this.pages.find(x => x.id === p.parentId);
    let guard = 0;
    while (cur && guard++ < 20) {
      chain.unshift(cur);
      cur = this.pages.find(x => x.id === cur!.parentId);
    }
    return chain;
  }

  select(p: WikiPage): void {
    this.editing = false;
    this.selected = p;
    // fetch full content (list may be trimmed in future; safe either way)
    this.svc.get(p.id!).subscribe({
      next: full => { this.selected = full; this.rendered = this.render(full.content || ''); },
      error: () => { this.rendered = this.render(p.content || ''); }
    });
  }

  // ── CRUD ──
  createPage(parentId: number | null): void {
    this.busy = true;
    this.svc.create({ title: this.t.instant('wiki.untitled'), content: '', parentId, icon: '📄' }).subscribe({
      next: (r: any) => {
        this.busy = false;
        const created: WikiPage = r?.data || r;
        this.load(created.id);
        setTimeout(() => { if (this.selected?.id === created.id) this.startEdit(); }, 200);
      },
      error: () => { this.busy = false; this.toast.error(this.t.instant('wiki.saveFailed')); }
    });
  }

  startEdit(): void {
    if (!this.selected) return;
    this.draft = { ...this.selected };
    this.draftRendered = this.render(this.draft.content || '');
    this.editing = true;
  }
  cancelEdit(): void { this.editing = false; }
  onDraftChange(): void { this.draftRendered = this.render(this.draft.content || ''); }

  saveEdit(): void {
    if (!this.selected?.id) return;
    this.busy = true;
    this.svc.update(this.selected.id, this.draft).subscribe({
      next: () => { this.busy = false; this.editing = false; this.toast.success(this.t.instant('wiki.saved')); this.load(this.selected!.id); },
      error: (e: any) => { this.busy = false; this.toast.error(e?.error?.message || this.t.instant('wiki.saveFailed')); }
    });
  }

  remove(p: WikiPage): void {
    if (!p.id) return;
    this.svc.delete(p.id).subscribe({
      next: () => {
        this.toast.success(this.t.instant('wiki.deleted'));
        this.selected = null;
        this.load();
      },
      error: () => this.toast.error(this.t.instant('wiki.saveFailed'))
    });
  }

  // ── Minimal, safe Markdown → HTML (input is HTML-escaped first; Angular also sanitizes) ──
  private render(md: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.mdToHtml(md));
  }
  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  private inline(s: string): string {
    return s
      .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  private mdToHtml(md: string): string {
    const src = this.esc(md || '').replace(/\r\n/g, '\n');
    const lines = src.split('\n');
    const out: string[] = [];
    let i = 0;
    let listType: 'ul' | 'ol' | null = null;
    const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };
    while (i < lines.length) {
      let line = lines[i];
      // fenced code block
      if (/^```/.test(line)) {
        closeList();
        const buf: string[] = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push(`<pre><code>${buf.join('\n')}</code></pre>`);
        continue;
      }
      if (/^\s*$/.test(line)) { closeList(); i++; continue; }
      let m: RegExpMatchArray | null;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        closeList();
        const lvl = m[1].length;
        out.push(`<h${lvl}>${this.inline(m[2])}</h${lvl}>`);
      } else if (/^\s*([-*])\s+/.test(line)) {
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push(`<li>${this.inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      } else if (/^\s*\d+\.\s+/.test(line)) {
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push(`<li>${this.inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      } else if (/^&gt;\s?/.test(line)) {
        closeList();
        out.push(`<blockquote>${this.inline(line.replace(/^&gt;\s?/, ''))}</blockquote>`);
      } else if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
        closeList();
        out.push('<hr>');
      } else {
        closeList();
        // greedily join following non-blank, non-special lines into one paragraph
        const para: string[] = [line];
        while (i + 1 < lines.length && !/^\s*$/.test(lines[i + 1]) && !/^(#{1,6}\s|```|\s*[-*]\s|\s*\d+\.\s|&gt;)/.test(lines[i + 1])) {
          i++; para.push(lines[i]);
        }
        out.push(`<p>${this.inline(para.join('<br>'))}</p>`);
      }
      i++;
    }
    closeList();
    return out.join('\n');
  }
}
