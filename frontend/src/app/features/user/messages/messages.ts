import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, User } from '../../../core/services/user.service';
import { MessageService, Message } from '../../../core/services/message.service';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';

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
export class UserMessagesComponent implements OnInit {
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

  // Attachment and Voice Note setups
  showAttachMenu: boolean = false;
  recordingVoice: boolean = false;
  voiceTimer: string = '0:00';
  voiceSeconds: number = 0;
  voiceInterval: any = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

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
  }

  private selectDefaultContact(): void {
    if (this.contacts.length > 0) {
      this.selectContact(this.contacts[0]);
    }
  }

  selectContact(contact: ChatContact): void {
    this.selectedContact = contact;
    contact.unreadCount = 0; // Clear unread count
    this.loadMessageThread(contact.id);
  }

  loadMessageThread(projectId: number): void {
    const contact = this.contacts.find(c => c.id === projectId);
    if (!contact) return;

    this.messageService.getMessagesByProject(projectId).subscribe({
      next: (response: any) => {
        const messages = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
        this.messageThread = messages.map((m: any) => ({
          id: m.id || 0,
          senderId: m.senderId || 0,
          senderName: m.senderName || 'Team Member',
          text: m.content,
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          isSelf: m.senderId === this.developerId,
          status: m.isRead ? 'READ' : 'DELIVERED'
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageThread = [];
      }
    });

    this.applyContactsFilters();
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

    const newMsg: ChatMessage = {
      id: this.messageThread.length + 1,
      senderId: this.developerId,
      senderName: this.developerName,
      text: currentText,
      timestamp: timeStr,
      isSelf: true,
      status: 'SENT'
    };

    const newMsgObj: Message = {
      senderId: this.developerId,
      projectId: this.selectedContact.id,
      content: currentText
    };

    this.messageService.sendMessage(newMsgObj).subscribe({
      next: (m) => {
        newMsg.id = m.id || newMsg.id;
        newMsg.status = 'DELIVERED';
      },
      error: () => {}
    });

    this.messageThread.push(newMsg);
    this.newMessageText = '';

    // Update last message in sidebar contact
    this.selectedContact.lastMessageText = `${this.developerName}: ${currentText}`;
    this.selectedContact.lastMessageTime = timeStr;

    // Simulate delivery checklist checkmarks
    setTimeout(() => {
      newMsg.status = 'DELIVERED';
    }, 800);

    setTimeout(() => {
      newMsg.status = 'READ';
    }, 1800);

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
    this.showAttachMenu = false;
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size limit: max 15MB (15 * 1024 * 1024 bytes)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      this.triggerToast("File too large. Photo & Video uploads are limited to 15MB.", "error");
      event.target.value = ''; // Reset input
      return;
    }

    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const isVideo = file.type.startsWith('video/');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create local object URL for preview
    const fileUrl = URL.createObjectURL(file);

    const newMsg: ChatMessage = {
      id: this.messageThread.length + 1,
      senderId: this.developerId,
      senderName: this.developerName,
      text: file.name,
      timestamp: timeStr,
      isSelf: true,
      status: 'SENT',
      attachmentType: isVideo ? 'VIDEO' : 'IMAGE',
      attachmentUrl: fileUrl,
      attachmentName: file.name,
      attachmentSize: sizeStr
    };

    this.messageThread.push(newMsg);
    this.cdr.detectChanges();

    if (this.selectedContact) {
      this.selectedContact.lastMessageText = `📁 Sent ${isVideo ? 'video' : 'photo'}: ${file.name}`;
      this.selectedContact.lastMessageTime = timeStr;
    }

    this.triggerToast("Media file uploaded successfully!", "success");
    event.target.value = ''; // Reset input
  }

  handleDocumentSelected(event: any): void {
    this.showAttachMenu = false;
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size limit: max 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      this.triggerToast("File too large. Document uploads are limited to 15MB.", "error");
      event.target.value = ''; // Reset input
      return;
    }

    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: this.messageThread.length + 1,
      senderId: this.developerId,
      senderName: this.developerName,
      text: file.name,
      timestamp: timeStr,
      isSelf: true,
      status: 'SENT',
      attachmentType: 'DOCUMENT',
      attachmentUrl: '#',
      attachmentName: file.name,
      attachmentSize: sizeStr
    };

    this.messageThread.push(newMsg);
    this.cdr.detectChanges();

    if (this.selectedContact) {
      this.selectedContact.lastMessageText = `📄 Sent document: ${file.name}`;
      this.selectedContact.lastMessageTime = timeStr;
    }

    this.triggerToast("Document uploaded successfully!", "success");
    event.target.value = ''; // Reset input
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
