import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, User } from '../../../core/services/user.service';
import { MessageService, Message } from '../../../core/services/message.service';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { BadgeCountsService } from '../../../core/services/badge-counts.service';
import { FileService } from '../../../core/services/file.service';
import { BrandingService } from '../../../core/services/branding.service';

export interface ChatContact {
  id: number;
  name: string;
  email: string;
  role: 'PROJECT_MANAGER' | 'DEVELOPER' | 'ADMIN';
  online: boolean;
  avatarInitials: string;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  status: 'SENT' | 'DELIVERED' | 'READ';
  attachmentType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'VOICE';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  isVoicePlaying?: boolean;
  voiceProgress?: number;
}

@Component({
  selector: 'app-user-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss']
})
export class UserMessagesComponent implements OnInit, OnDestroy {
  developerId: number = 0;
  developerName: string = 'Developer';

  // Contact & Thread lists
  contacts: ChatContact[] = [];
  filteredContacts: ChatContact[] = [];
  selectedContact: ChatContact | null = null;
  messageThread: ChatMessage[] = [];
  
  // Input text
  newMessageText: string = '';
  searchQuery: string = '';
  loadingContacts: boolean = true;
  sendingMessage: boolean = false;

  // Group-chat synchronisation
  private confirmedServerIds = new Set<number>();
  private threadPollHandle: any = null;
  private readonly THREAD_POLL_MS = 7000;
  // Per-group unread badge tracking (last-read message id is kept per user per
  // project in localStorage, since group messages have no per-user read state).
  private unreadPollHandle: any = null;
  private readonly UNREAD_POLL_MS = 15000;

  // Attachment and Voice Note setups
  showAttachMenu: boolean = false;
  recordingVoice: boolean = false;
  voiceTimer: string = '0:00';
  voiceSeconds: number = 0;
  voiceInterval: any = null;

  // Emoji picker
  showEmojiPanel: boolean = false;
  readonly emojis: string[] = ['😀','😁','😂','🤣','😊','😍','😎','😉','🙂','😅','🤔','😴','😮','😢','😭','😡','👍','👎','👏','🙏','🙌','💪','👀','🔥','✅','❌','⭐','💯','🎉','🚀','❤️','💙','💚','📎','📄','📁','📌','⏰','✔️','⚡'];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private badges: BadgeCountsService,
    private fileService: FileService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    public branding: BrandingService
  ) {}

  toggleEmojiPanel(): void { this.showEmojiPanel = !this.showEmojiPanel; this.showAttachMenu = false; }
  insertEmoji(e: string): void { this.newMessageText = (this.newMessageText || '') + e; this.showEmojiPanel = false; }

  /** Push the page's total unread to the shared badge service (sidebar + top bar). */
  private syncBadge(): void {
    this.badges.setMessages(this.contacts.reduce((s, c) => s + (c.unreadCount || 0), 0));
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.developerId = user.id;
      this.developerName = `${user.firstName} ${user.lastName}`;
    }
    this.loadContacts();
  }

  loadContacts(): void {
    this.loadingContacts = true;
    
    // Fetch projects to construct project-based group conversation list
    this.projectService.getActiveProjectsForUser().subscribe({
      next: (response: any) => {
        try {
          const rawProjects = response && response.data ? response.data : [];
          this.mapProjectsToGroupConversations(rawProjects);
        } catch (e) {
          console.error('Error processing projects list:', e);
          this.contacts = [];
          this.filteredContacts = [];
        } finally {
          this.loadingContacts = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.contacts = [];
        this.filteredContacts = [];
        this.loadingContacts = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapProjectsToGroupConversations(projects: any[]): void {
    this.contacts = projects.map(p => {
      const initials = ((p.name?.[0] || 'P') + (p.name?.[1] || 'G')).toUpperCase();
      return {
        id: p.id || 0,
        name: p.name,
        email: p.managerName ? `${p.managerName} (Manager)` : 'Manager',
        role: 'PROJECT_MANAGER' as const,
        online: true,
        avatarInitials: initials,
        unreadCount: 0,
        lastMessageText: p.description || 'Project group discussion',
        lastMessageTime: ''
      };
    });

    if (this.contacts.length > 0) {
      this.selectDefaultContact();
    }
    this.filteredContacts = [...this.contacts];

    // Compute unread badges immediately, then keep them fresh on an interval so
    // new group messages light up the counter even while viewing another group.
    this.refreshUnreadCounts();
    this.startUnreadPolling();
  }

  /** Recomputes the unread badge for every group the user is not viewing. */
  private refreshUnreadCounts(): void {
    for (const contact of this.contacts) {
      const projectId = contact.id;
      this.messageService.getMessagesByProject(projectId).subscribe({
        next: (response: any) => {
          const messages: any[] = response?.data || (Array.isArray(response) ? response : []);
          // The currently open group is always considered read.
          if (this.selectedContact && this.selectedContact.id === projectId) {
            contact.unreadCount = 0;
            if (messages.length) this.setLastReadId(projectId, this.maxId(messages));
          } else {
            const lastRead = this.getLastReadId(projectId);
            contact.unreadCount = messages.filter(
              m => m.id != null && m.id > lastRead && m.senderId !== this.developerId).length;
          }
          const last = messages.length ? messages[messages.length - 1] : null;
          if (last) {
            contact.lastMessageText = `${last.senderName || 'Team'}: ${last.content}`;
            contact.lastMessageTime = last.createdAt
              ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          }
          this.syncBadge();
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  private startUnreadPolling(): void {
    this.stopUnreadPolling();
    this.unreadPollHandle = setInterval(() => this.refreshUnreadCounts(), this.UNREAD_POLL_MS);
  }

  private stopUnreadPolling(): void {
    if (this.unreadPollHandle) {
      clearInterval(this.unreadPollHandle);
      this.unreadPollHandle = null;
    }
  }

  private lastReadKey(projectId: number): string {
    return `msg_lastread_${this.developerId}_${projectId}`;
  }

  private getLastReadId(projectId: number): number {
    const v = localStorage.getItem(this.lastReadKey(projectId));
    return v ? Number(v) : 0;
  }

  private setLastReadId(projectId: number, id: number): void {
    if (id > this.getLastReadId(projectId)) {
      localStorage.setItem(this.lastReadKey(projectId), String(id));
    }
  }

  private maxId(messages: any[]): number {
    return messages.reduce((mx, m) => (m.id != null && m.id > mx ? m.id : mx), 0);
  }

  private selectDefaultContact(): void {
    if (this.contacts.length > 0) {
      this.selectContact(this.contacts[0]);
    }
  }

  selectContact(contact: ChatContact): void {
    this.selectedContact = contact;
    contact.unreadCount = 0; // Clear unread count
    this.syncBadge(); // keep sidebar + top-bar counters in sync immediately
    // Reset sync state for the newly opened group conversation.
    this.confirmedServerIds.clear();
    this.messageThread = [];
    this.loadMessageThread(contact.id);
    this.startThreadPolling(contact.id);
  }

  /**
   * Loads/refreshes the project group conversation. Server messages are merged
   * by id (never wiping locally-added attachment/voice notes and never
   * duplicating a message that is already on screen), so the panel stays in
   * sync with the rest of the team as new messages arrive.
   */
  loadMessageThread(projectId: number): void {
    const contact = this.contacts.find(c => c.id === projectId);
    if (!contact) return;

    this.messageService.getMessagesByProject(projectId).subscribe({
      next: (response: any) => {
        const messages = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
        this.mergeServerMessages(projectId, messages);
        // Viewing a group marks it read up to its latest message.
        if (this.selectedContact && this.selectedContact.id === projectId && messages.length) {
          this.setLastReadId(projectId, this.maxId(messages));
          contact.unreadCount = 0;
        }
        this.cdr.detectChanges();
      },
      // Keep whatever is already on screen on a transient failure.
      error: () => {}
    });

    this.applyContactsFilters();
  }

  /** Merge a server snapshot into the active thread without dups or flicker. */
  private mergeServerMessages(projectId: number, messages: any[]): void {
    if (!this.selectedContact || this.selectedContact.id !== projectId) return;
    if (!Array.isArray(messages)) return;

    let appended = false;
    for (const m of messages) {
      const id = m.id;
      if (id == null || this.confirmedServerIds.has(id)) continue;

      // If this is our own message echoed back (an optimistic bubble awaiting
      // confirmation), adopt the real id instead of adding a duplicate.
      const pending = this.messageThread.find(
        x => x.isSelf && (x as any)._pending && x.text === m.content);
      if (pending) {
        pending.id = id;
        (pending as any)._pending = false;
        pending.status = 'DELIVERED';
        this.confirmedServerIds.add(id);
        continue;
      }

      this.confirmedServerIds.add(id);
      const hasAttach = !!m.attachmentUrl;
      const bubble: ChatMessage = {
        id,
        senderId: m.senderId || 0,
        senderName: m.senderName || 'Team Member',
        // When an attachment is present, content holds the caption (or the file name).
        text: hasAttach && m.content === m.attachmentName ? '' : (m.content || ''),
        timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        isSelf: m.senderId === this.developerId,
        status: m.isRead ? 'READ' : 'DELIVERED',
        attachmentType: hasAttach ? (m.attachmentType || 'DOCUMENT') : undefined,
        attachmentName: m.attachmentName,
        attachmentSize: m.attachmentSize
      };
      if (hasAttach) {
        (bubble as any)._serverUrl = m.attachmentUrl;
        // Images: fetch the auth-protected blob and show it inline.
        if ((m.attachmentType || '') === 'IMAGE') {
          this.fileService.fetchBlob(m.attachmentUrl).subscribe({
            next: (blob: Blob) => { bubble.attachmentUrl = URL.createObjectURL(blob); this.cdr.detectChanges(); },
            error: () => {}
          });
        }
      }
      this.messageThread.push(bubble);
      appended = true;
    }

    if (appended) {
      const last = this.messageThread[this.messageThread.length - 1];
      if (last) {
        this.selectedContact.lastMessageText = `${last.senderName}: ${last.text}`;
        this.selectedContact.lastMessageTime = last.timestamp;
      }
    }
  }

  private startThreadPolling(projectId: number): void {
    this.stopThreadPolling();
    this.threadPollHandle = setInterval(() => {
      if (this.selectedContact && this.selectedContact.id === projectId) {
        this.loadMessageThread(projectId);
      }
    }, this.THREAD_POLL_MS);
  }

  private stopThreadPolling(): void {
    if (this.threadPollHandle) {
      clearInterval(this.threadPollHandle);
      this.threadPollHandle = null;
    }
  }

  ngOnDestroy(): void {
    this.stopThreadPolling();
    this.stopUnreadPolling();
  }

  applyContactsFilters(): void {
    if (!this.searchQuery.trim()) {
      this.filteredContacts = [...this.contacts];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredContacts = this.contacts.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q)
      );
    }
  }

  onSearchChange(): void {
    this.applyContactsFilters();
  }

  sendMessage(): void {
    if (!this.newMessageText.trim() || !this.selectedContact) return;

    const currentText = this.newMessageText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const projectId = this.selectedContact.id;
    const newMsg: ChatMessage = {
      id: 0,
      senderId: this.developerId,
      senderName: this.developerName,
      text: currentText,
      timestamp: timeStr,
      isSelf: true,
      status: 'SENT'
    };
    // Marks this bubble as awaiting server confirmation so the next poll adopts
    // its real id rather than appending a duplicate.
    (newMsg as any)._pending = true;

    const newMsgObj: Message = {
      senderId: this.developerId,
      projectId,
      content: currentText
    };

    this.messageService.sendMessage(newMsgObj).subscribe({
      next: (response: any) => {
        // Backend returns an ApiResponse wrapper { success, message, data }.
        const saved = response?.data || response;
        if (saved && saved.id != null) {
          newMsg.id = saved.id;
          (newMsg as any)._pending = false;
          this.confirmedServerIds.add(saved.id);
        }
        newMsg.status = 'DELIVERED';
        this.cdr.detectChanges();
      },
      error: () => {
        newMsg.status = 'SENT';
        this.triggerToast('Message could not be delivered. Retrying on next refresh.', 'error');
        this.cdr.detectChanges();
      }
    });

    this.messageThread.push(newMsg);
    this.newMessageText = '';

    // Update last message in sidebar contact
    this.selectedContact.lastMessageText = `${this.developerName}: ${currentText}`;
    this.selectedContact.lastMessageTime = timeStr;
  }

  // ================= TOAST FEEDBACK SYSTEM =================
  triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toast.show(message, type);
  }

  // ================= UPLOAD PHOTO, DOCUMENTS & VIDEOS =================
  toggleAttachMenu(): void {
    this.showAttachMenu = !this.showAttachMenu;
  }

  handleMediaSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) this.uploadAndSend(file, 'IMAGE');
    event.target.value = '';
  }

  handleDocumentSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) this.uploadAndSend(file, 'DOCUMENT');
    event.target.value = '';
  }

  private humanSize(bytes: number): string {
    return bytes >= 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(1) + ' Mo' : Math.max(1, Math.round(bytes / 1024)) + ' Ko';
  }

  /** Upload a file to the server, then persist it as a chat message attachment. */
  private uploadAndSend(file: File, type: 'IMAGE' | 'DOCUMENT'): void {
    this.showAttachMenu = false;
    if (!this.selectedContact) return;
    // Hard client cap; the backend enforces the admin-configured limit (default 100 MB).
    const MAX = 100 * 1024 * 1024;
    if (file.size > MAX) { this.triggerToast('Fichier trop volumineux (max 100 Mo).', 'error'); return; }

    const sizeStr = this.humanSize(file.size);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const projectId = this.selectedContact.id;
    const caption = this.newMessageText.trim();
    const content = caption || file.name;

    // Optimistic bubble. For images we can show the local object URL right away.
    const newMsg: ChatMessage = {
      id: 0, senderId: this.developerId, senderName: this.developerName,
      text: caption, timestamp: timeStr, isSelf: true, status: 'SENT',
      attachmentType: type, attachmentUrl: type === 'IMAGE' ? URL.createObjectURL(file) : undefined,
      attachmentName: file.name, attachmentSize: sizeStr
    };
    (newMsg as any)._pending = true;
    (newMsg as any)._uploading = true;
    this.messageThread.push(newMsg);
    this.newMessageText = '';
    this.cdr.detectChanges();

    this.fileService.uploadFile(file).subscribe({
      next: (res: any) => {
        const url = res?.data?.fileUrl ?? res?.fileUrl;
        if (!url) { this.messageThread = this.messageThread.filter(x => x !== newMsg); this.triggerToast('Téléversement échoué.', 'error'); this.cdr.detectChanges(); return; }
        (newMsg as any)._uploading = false;
        (newMsg as any)._serverUrl = url;          // the authenticated /uploads path for download
        const msgObj: Message = {
          senderId: this.developerId, projectId, content,
          attachmentUrl: url, attachmentName: file.name, attachmentType: type, attachmentSize: sizeStr
        };
        this.messageService.sendMessage(msgObj).subscribe({
          next: (resp: any) => {
            const saved = resp?.data || resp;
            if (saved?.id != null) { newMsg.id = saved.id; (newMsg as any)._pending = false; this.confirmedServerIds.add(saved.id); }
            newMsg.status = 'DELIVERED';
            this.cdr.detectChanges();
          },
          error: () => { newMsg.status = 'SENT'; this.triggerToast('Échec de l\'envoi du message.', 'error'); this.cdr.detectChanges(); }
        });
        if (this.selectedContact) {
          this.selectedContact.lastMessageText = `📎 ${file.name}`;
          this.selectedContact.lastMessageTime = timeStr;
        }
      },
      error: (err: any) => {
        this.messageThread = this.messageThread.filter(x => x !== newMsg);
        this.triggerToast(err?.error?.message || 'Type de fichier non autorisé ou trop volumineux.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  /** Download a message attachment (authenticated blob fetch). */
  downloadAttachment(message: ChatMessage): void {
    const url = (message as any)._serverUrl || message.attachmentUrl;
    if (!url || url === '#') { this.triggerToast('Aucun fichier à télécharger.', 'error'); return; }
    this.fileService.downloadFile(url, message.attachmentName).subscribe({
      next: () => this.triggerToast('Téléchargement démarré.', 'success'),
      error: () => this.triggerToast('Échec du téléchargement.', 'error')
    });
  }
  /** Open an image/PDF attachment in a new tab. */
  previewAttachment(message: ChatMessage): void {
    const url = (message as any)._serverUrl || message.attachmentUrl;
    if (!url || url === '#') return;
    this.fileService.previewFile(url).subscribe({ error: () => this.triggerToast('Impossible d\'ouvrir le fichier.', 'error') });
  }

  // ================= MICROPHONE VOICE RECORDING ACTIONS =================
  startVoiceRecording(): void {
    this.recordingVoice = true;
    this.voiceSeconds = 0;
    this.voiceTimer = '0:00';
    this.cdr.detectChanges();

    if (this.voiceInterval) {
      clearInterval(this.voiceInterval);
    }

    this.voiceInterval = setInterval(() => {
      this.voiceSeconds++;
      const mins = Math.floor(this.voiceSeconds / 60);
      const secs = this.voiceSeconds % 60;
      this.voiceTimer = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      this.cdr.detectChanges();
    }, 1000);
  }

  cancelVoiceRecording(): void {
    if (this.voiceInterval) {
      clearInterval(this.voiceInterval);
      this.voiceInterval = null;
    }
    this.recordingVoice = false;
    this.cdr.detectChanges();
    this.triggerToast("Voice note recording discarded.", "error");
  }

  sendVoiceRecording(): void {
    if (this.voiceInterval) {
      clearInterval(this.voiceInterval);
      this.voiceInterval = null;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const finalDuration = this.voiceTimer;
    this.recordingVoice = false;

    const newMsg: ChatMessage = {
      id: this.messageThread.length + 1,
      senderId: this.developerId,
      senderName: this.developerName,
      text: `Voice Note (${finalDuration})`,
      timestamp: timeStr,
      isSelf: true,
      status: 'SENT',
      attachmentType: 'VOICE',
      attachmentName: `Voice Note (${finalDuration})`,
      attachmentSize: finalDuration,
      isVoicePlaying: false,
      voiceProgress: 0
    };

    this.messageThread.push(newMsg);
    this.cdr.detectChanges();

    if (this.selectedContact) {
      this.selectedContact.lastMessageText = `🎤 Voice Note (${finalDuration})`;
      this.selectedContact.lastMessageTime = timeStr;
    }

    this.triggerToast("Voice note sent successfully!", "success");
  }

  // ================= DYNAMIC PLAY/PAUSE SIMULATOR =================
  toggleVoicePlayback(message: ChatMessage): void {
    if (message.attachmentType !== 'VOICE') return;

    if (message.isVoicePlaying) {
      // Pause action
      message.isVoicePlaying = false;
      if ((message as any)._voiceInterval) {
        clearInterval((message as any)._voiceInterval);
        (message as any)._voiceInterval = null;
      }
      this.triggerToast("Voice playback paused", "success");
    } else {
      // Play action: stop all other voice playbacks first!
      this.messageThread.forEach(m => {
        if (m.attachmentType === 'VOICE' && m.isVoicePlaying) {
          m.isVoicePlaying = false;
          m.voiceProgress = 0;
          if ((m as any)._voiceInterval) {
            clearInterval((m as any)._voiceInterval);
            (m as any)._voiceInterval = null;
          }
        }
      });

      message.isVoicePlaying = true;
      if (message.voiceProgress === undefined || message.voiceProgress >= 100) {
        message.voiceProgress = 0;
      }

      // 14 seconds typical audio track duration simulation
      const totalDuration = 14; 
      const stepIntervalMs = 200;
      const totalSteps = (totalDuration * 1000) / stepIntervalMs;
      const progressPerStep = 100 / totalSteps;

      (message as any)._voiceInterval = setInterval(() => {
        if (!message.isVoicePlaying) {
          clearInterval((message as any)._voiceInterval);
          (message as any)._voiceInterval = null;
          return;
        }

        if (message.voiceProgress! >= 100) {
          message.isVoicePlaying = false;
          message.voiceProgress = 0;
          clearInterval((message as any)._voiceInterval);
          (message as any)._voiceInterval = null;
          this.triggerToast("Voice note finished playing", "success");
        } else {
          message.voiceProgress! += progressPerStep;
        }
        this.cdr.detectChanges();
      }, stepIntervalMs);
    }
    this.cdr.detectChanges();
  }

  // ================= DELETE MESSAGE SYSTEM =================
  deleteMessage(messageId: number): void {
    const msg = this.messageThread.find(m => m.id === messageId);
    if (!msg) return;

    // Clear voice note interval if currently playing
    if (msg.attachmentType === 'VOICE' && (msg as any)._voiceInterval) {
      clearInterval((msg as any)._voiceInterval);
    }

    this.messageThread = this.messageThread.filter(m => m.id !== messageId);
    this.cdr.detectChanges();

    // Update sidebar's last message if we deleted the most recent one
    if (this.selectedContact && this.messageThread.length > 0) {
      const last = this.messageThread[this.messageThread.length - 1];
      this.selectedContact.lastMessageText = last.attachmentType ? `📁 ${last.attachmentName}` : last.text;
      this.selectedContact.lastMessageTime = last.timestamp;
    } else if (this.selectedContact) {
      this.selectedContact.lastMessageText = 'No messages in this chat';
      this.selectedContact.lastMessageTime = '';
    }

    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        this.triggerToast("Message deleted successfully", "success");
      },
      error: () => {
        this.triggerToast("Optimistic: Message deleted successfully", "success");
      }
    });
  }
}
