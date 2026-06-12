import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessageService, Message } from '../../../core/services/message.service';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';

interface Conv { otherId: number; name: string; last: string; unread: number; time: string; }
interface Bubble { id?: number; text: string; mine: boolean; time: string; }

@Component({
  selector: 'app-pm-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="msg-shell">

    <!-- ═══ Conversations ═══ -->
    <div class="conv-pane">
      <div class="conv-head">
        <div class="conv-title-row">
          <h3>Conversations</h3>
          <button class="add" (click)="showNew = true" title="Nouvelle conversation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
        </div>
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Rechercher…" [(ngModel)]="search">
        </div>
      </div>
      <div class="conv-list">
        <button class="conv" *ngFor="let c of filteredConvs" [class.on]="selected?.otherId === c.otherId" (click)="select(c)">
          <span class="avatar" [style.background]="avatarColor(c.name)">{{ initials(c.name) }}</span>
          <div class="conv-body">
            <div class="conv-r1"><span class="conv-name">{{ c.name }}</span><span class="conv-time">{{ c.time }}</span></div>
            <div class="conv-r2"><span class="conv-last">{{ c.last }}</span><span class="unread" *ngIf="c.unread > 0">{{ c.unread }}</span></div>
          </div>
        </button>
        <div class="empty" *ngIf="filteredConvs.length === 0">Aucune conversation.</div>
      </div>
    </div>

    <!-- ═══ Chat ═══ -->
    <div class="chat-pane">
      <ng-container *ngIf="selected; else noConv">
        <div class="chat-head">
          <span class="avatar" [style.background]="avatarColor(selected.name)">{{ initials(selected.name) }}</span>
          <div><div class="ch-name">{{ selected.name }}</div><div class="ch-sub">En ligne</div></div>
        </div>
        <div class="chat-body" #body>
          <div class="bubble-row" *ngFor="let b of bubbles" [class.mine]="b.mine">
            <div class="bubble" [class.mine]="b.mine"><p>{{ b.text }}</p><span class="b-time">{{ b.time }}</span></div>
          </div>
          <div class="empty" *ngIf="bubbles.length === 0">Démarrez la conversation ci-dessous.</div>
        </div>
        <div class="composer">
          <input type="text" placeholder="Écrire un message…" [(ngModel)]="draft" (keyup.enter)="send()">
          <button class="send" (click)="send()" [disabled]="!draft.trim()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
        </div>
      </ng-container>
      <ng-template #noConv><div class="no-conv">Sélectionnez une conversation pour commencer.</div></ng-template>
    </div>
  </div>

  <!-- ═══ New conversation dialog ═══ -->
  <div class="modal-backdrop" *ngIf="showNew" (click)="showNew = false">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="m-head"><h3>Nouvelle conversation</h3><button class="x" (click)="showNew = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
      <div class="m-body">
        <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" placeholder="Rechercher des membres…" [(ngModel)]="memberSearch"></div>
        <div class="member-list">
          <button class="member" *ngFor="let u of filteredUsers" (click)="startConversation(u)">
            <span class="avatar sm" [style.background]="avatarColor(u.firstName + ' ' + u.lastName)">{{ initials(u.firstName + ' ' + u.lastName) }}</span>
            <span class="m-name">{{ u.firstName }} {{ u.lastName }}</span>
          </button>
          <div class="empty" *ngIf="filteredUsers.length === 0">Aucun membre.</div>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .msg-shell { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 150px); background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
    @media (max-width: 760px) { .msg-shell { grid-template-columns: 1fr; } .chat-pane { display: none; } }

    .conv-pane { display: flex; flex-direction: column; border-right: 1px solid #e2e8f0; min-height: 0; }
    .conv-head { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .conv-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .conv-title-row h3 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 0; }
    .add { width: 28px; height: 28px; border: none; background: #f1f5f9; border-radius: 7px; color: #475569; cursor: pointer; display: grid; place-items: center; } .add svg { width: 15px; height: 15px; } .add:hover { background: #e2e8f0; }
    .search { position: relative; } .search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #94a3b8; }
    .search input { width: 100%; height: 36px; padding: 0 11px 0 32px; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 13px; color: #1e293b; outline: none; background: #fff; } .search input:focus { border-color: #2563eb; }

    .conv-list { flex: 1; overflow-y: auto; min-height: 0; }
    .conv { display: flex; align-items: center; gap: 11px; width: 100%; padding: 12px; border: none; border-bottom: 1px solid #f1f5f9; background: none; text-align: left; cursor: pointer; font-family: inherit; }
    .conv:hover { background: #f8fafc; } .conv.on { background: rgba(37,99,235,.07); }
    .avatar { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0; } .avatar.sm { width: 32px; height: 32px; font-size: 11px; }
    .conv-body { flex: 1; min-width: 0; }
    .conv-r1 { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .conv-name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conv-time { font-size: 10px; color: #94a3b8; flex-shrink: 0; }
    .conv-r2 { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 2px; }
    .conv-last { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .unread { display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; padding: 0 5px; border-radius: 9999px; background: #2563eb; color: #fff; font-size: 10px; font-weight: 700; flex-shrink: 0; }

    .chat-pane { display: flex; flex-direction: column; min-height: 0; }
    .chat-head { display: flex; align-items: center; gap: 11px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .ch-name { font-size: 14px; font-weight: 700; color: #1e293b; } .ch-sub { font-size: 11px; color: #16a34a; }
    .chat-body { flex: 1; overflow-y: auto; min-height: 0; padding: 16px; background: rgba(37,99,235,.03); display: flex; flex-direction: column; gap: 10px; }
    .bubble-row { display: flex; justify-content: flex-start; } .bubble-row.mine { justify-content: flex-end; }
    .bubble { max-width: 70%; border-radius: 16px; padding: 8px 12px; font-size: 13px; box-shadow: 0 1px 2px rgba(15,23,42,.06); background: #fff; color: #1e293b; border-bottom-left-radius: 4px; }
    .bubble.mine { background: #2563eb; color: #fff; border-bottom-left-radius: 16px; border-bottom-right-radius: 4px; }
    .bubble p { margin: 0; } .b-time { display: block; text-align: right; font-size: 10px; margin-top: 3px; opacity: .7; }
    .composer { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid #e2e8f0; }
    .composer input { flex: 1; height: 38px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 9px; font-size: 13px; color: #1e293b; outline: none; } .composer input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .send { width: 38px; height: 38px; border: none; border-radius: 9px; background: #2563eb; color: #fff; cursor: pointer; display: grid; place-items: center; } .send svg { width: 16px; height: 16px; } .send:hover { background: #1d4ed8; } .send:disabled { opacity: .5; cursor: not-allowed; }
    .no-conv { flex: 1; display: grid; place-items: center; color: #94a3b8; font-size: 13px; }
    .empty { padding: 28px; text-align: center; color: #94a3b8; font-size: 12.5px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { width: 100%; max-width: 440px; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.3); }
    .m-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 10px; } .m-head h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
    .x { width: 32px; height: 32px; border: none; background: #f1f5f9; border-radius: 8px; cursor: pointer; color: #64748b; display: grid; place-items: center; } .x svg { width: 15px; height: 15px; }
    .m-body { padding: 8px 22px 20px; display: flex; flex-direction: column; gap: 12px; }
    .member-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
    .member { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; cursor: pointer; font-family: inherit; text-align: left; } .member:hover { background: #f8fafc; } .member .m-name { font-size: 13px; font-weight: 600; color: #1e293b; }
  `]
})
export class PmMessagesComponent implements OnInit, OnDestroy {
  meId = 0;
  conversations: Conv[] = [];
  selected: Conv | null = null;
  bubbles: Bubble[] = [];
  users: User[] = [];
  search = '';
  memberSearch = '';
  draft = '';
  showNew = false;
  private subs: Subscription[] = [];

  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
    private toast: ToastService,
    private badges: BadgeCountsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.meId = this.authService.getCurrentUser()?.id || 0;
    this.loadConversations();
    this.userService.getAllUsers(0, 200).subscribe({
      next: (r: any) => { this.users = (r && r.data ? r.data : []).filter((u: any) => u.id !== this.meId); this.cdr.detectChanges(); },
      error: () => { this.users = []; }
    });

    // Listen to changes in messages count. If new ones arrive, reload conversations.
    this.subs.push(this.badges.messages$.subscribe(count => {
      const currentUnread = this.conversations.reduce((sum, c) => sum + c.unread, 0);
      if (count > currentUnread && this.meId) {
        this.loadConversations();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get filteredConvs(): Conv[] {
    const t = this.search.toLowerCase().trim();
    return t ? this.conversations.filter(c => c.name.toLowerCase().includes(t) || c.last.toLowerCase().includes(t)) : this.conversations;
  }
  get filteredUsers(): User[] {
    const t = this.memberSearch.toLowerCase().trim();
    return t ? this.users.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(t)) : this.users;
  }

  loadConversations(): void {
    this.messageService.getConversations().subscribe({
      next: (r: any) => {
        const list = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        this.conversations = (list || []).map((c: any) => this.mapConv(c)).filter((c: Conv) => !!c.otherId);
        const totalUnread = this.conversations.reduce((sum, c) => sum + c.unread, 0);
        this.badges.setMessages(totalUnread);
        this.cdr.detectChanges();
      },
      error: () => { this.conversations = []; }
    });
  }

  private mapConv(c: any): Conv {
    const otherId = c.otherUserId ?? c.userId ?? c.senderId ?? c.recipientId ?? c.id ?? 0;
    const name = c.otherUserName ?? c.userName ?? c.senderName ?? c.name ?? `Utilisateur ${otherId}`;
    return {
      otherId,
      name,
      last: c.lastMessage ?? c.content ?? c.preview ?? '',
      unread: c.unreadCount ?? c.unread ?? 0,
      time: this.fmt(c.lastMessageTime ?? c.createdAt ?? c.time ?? '')
    };
  }

  select(c: Conv): void {
    this.selected = c;
    this.bubbles = [];
    this.messageService.getConversationWithUser(c.otherId).subscribe({
      next: (r: any) => {
        const msgs: Message[] = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        this.bubbles = msgs
          .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
          .map(m => ({ id: m.id, text: m.content, mine: m.senderId === this.meId, time: this.fmt(m.createdAt) }));
        this.cdr.detectChanges();
        if (c.unread > 0) {
          const unreadCount = c.unread;
          this.messageService.markConversationAsRead(c.otherId).subscribe({
            next: () => {
              c.unread = 0;
              this.badges.decMessages(unreadCount);
            },
            error: () => {
              c.unread = 0;
              this.badges.decMessages(unreadCount);
            }
          });
        }
      },
      error: () => { this.bubbles = []; }
    });
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || !this.selected) return;
    const otherId = this.selected.otherId;
    this.bubbles.push({ text, mine: true, time: this.fmt(new Date().toISOString()) });
    this.draft = '';
    this.cdr.detectChanges();
    this.messageService.sendMessage({ recipientId: otherId, content: text }).subscribe({
      next: () => { if (this.selected) this.selected.last = text; this.loadConversations(); },
      error: () => { this.toast.show('Message enregistré localement.', 'success'); }
    });
  }

  startConversation(u: User): void {
    this.showNew = false;
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u as any).email || 'Membre';
    let conv = this.conversations.find(c => c.otherId === u.id);
    if (!conv) { conv = { otherId: u.id!, name, last: '', unread: 0, time: '' }; this.conversations = [conv, ...this.conversations]; }
    this.select(conv);
  }

  initials(name?: string): string {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
  }
  avatarColor(name?: string): string {
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
    const n = name || '?'; let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }
  private fmt(s?: string): string {
    if (!s) return '';
    const d = new Date(s); if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime(); const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60); if (h < 24) return `${h} h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }
}
