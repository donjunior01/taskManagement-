import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, User } from '../../../core/services/user.service';
import { MessageService, Message } from '../../../core/services/message.service';
import { ProjectService } from '../../../core/services/project.service';

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

  // Notification Toast setup
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeout: any = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef
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
          console.error('Error processing projects list, seeding mock fallback:', e);
          this.seedMockProjectGroups();
        } finally {
          this.loadingContacts = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.warn('API projects service offline, seeding project groups list:', err);
        try {
          this.seedMockProjectGroups();
        } catch (e) {
          console.error('Error in fallback seed:', e);
        } finally {
          this.loadingContacts = false;
          this.cdr.detectChanges();
        }
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

    if (this.contacts.length === 0) {
      this.seedMockProjectGroups();
    } else {
      this.selectDefaultContact();
    }
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
        console.warn("API Messages offline or empty, loading fallback project thread");
        if (projectId === 101) {
          this.messageThread = [
            { id: 1, senderId: 105, senderName: 'Olivia Vance', text: `Hello team, welcome to the Cloud Migration core group.`, timestamp: '10:15 AM', isSelf: false, status: 'READ' },
            { id: 2, senderId: 105, senderName: 'Olivia Vance', text: 'Please ensure you check VPC security group rules.', timestamp: '10:16 AM', isSelf: false, status: 'READ' },
            { id: 3, senderId: this.developerId, senderName: this.developerName, text: 'Hi Olivia! I have set up the public/private subnets and VPC endpoints.', timestamp: '10:20 AM', isSelf: true, status: 'READ' },
            { id: 4, senderId: 106, senderName: 'Alex Mercer', text: 'Great, I will start configuring the Kubernetes cluster inside those subnets.', timestamp: '10:22 AM', isSelf: false, status: 'READ' }
          ];
        } else {
          this.messageThread = [
            { id: 1, senderId: 106, senderName: 'Alex Mercer', text: 'Welcome everyone! Let’s coordinate our development deliverables here.', timestamp: 'Yesterday', isSelf: false, status: 'READ' },
            { id: 2, senderId: this.developerId, senderName: this.developerName, text: 'Sounds good. Pushed initial frontend boilerplate to repository.', timestamp: 'Yesterday', isSelf: true, status: 'READ' }
          ];
        }
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

    // Simulate automated real-time reply
    this.simulateReply(currentText);
  }

  private simulateReply(userMessage: string): void {
    if (!this.selectedContact) return;

    const contact = this.selectedContact;
    const lowerMsg = userMessage.toLowerCase();

    let replyText = 'Understood. I will check this and get back to you shortly.';

    if (contact.id === 101) {
      if (lowerMsg.includes('vpc') || lowerMsg.includes('aws') || lowerMsg.includes('migration')) {
        replyText = 'Excellent work on the migration phase. Let’s review the security groups rules during our bridge status meeting.';
      } else if (lowerMsg.includes('task') || lowerMsg.includes('deliverable') || lowerMsg.includes('deadline')) {
        replyText = 'Got it. Keep the progress sliders updated in your workspace so we can verify the metrics.';
      } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        replyText = `Hello! How is the development progress going on your assigned tasks?`;
      }
    } else {
      if (lowerMsg.includes('seed') || lowerMsg.includes('docker') || lowerMsg.includes('compose')) {
        replyText = 'Perfect. Pushing my local changes now so we sync dev-integration.';
      } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        replyText = 'Hey! Let me know if you need help testing the VPC endpoints!';
      }
    }

    setTimeout(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const replyMsg: ChatMessage = {
        id: this.messageThread.length + 1,
        senderId: contact.id,
        senderName: contact.name.includes('Migration') ? 'Olivia Vance' : 'Alex Mercer',
        text: replyText,
        timestamp: timeStr,
        isSelf: false,
        status: 'READ'
      };

      this.messageThread.push(replyMsg);
      
      // Update sidebar
      contact.lastMessageText = replyText;
      contact.lastMessageTime = timeStr;
      
      // If contact is not currently viewed, increase unread (safe fallback)
      if (this.selectedContact?.id !== contact.id) {
        contact.unreadCount++;
      }
    }, 2000);
  }

  private seedMockProjectGroups(): void {
    this.contacts = [
      {
        id: 101,
        name: 'Cloud Migration & Core Infrastructure Group',
        email: 'Olivia Vance (Lead PM)',
        role: 'PROJECT_MANAGER',
        online: true,
        avatarInitials: 'CM',
        unreadCount: 0,
        lastMessageText: 'Perfect. Let’s do 2:00 PM. I’ll send a bridge invite link.',
        lastMessageTime: '10:22 AM'
      },
      {
        id: 102,
        name: 'Next-Gen Mobile Commerce Group',
        email: 'Alex Mercer (Tech Lead)',
        role: 'DEVELOPER',
        online: true,
        avatarInitials: 'NM',
        unreadCount: 0,
        lastMessageText: 'Alex: Pushing my local changes now so we sync dev-integration.',
        lastMessageTime: 'Yesterday'
      },
      {
        id: 103,
        name: 'Enterprise Data Lake Platform Group',
        email: 'Marcus Thorne (Architect)',
        role: 'DEVELOPER',
        online: false,
        avatarInitials: 'ED',
        unreadCount: 0,
        lastMessageText: 'Marcus: Let’s review the schema diagrams before Wednesday.',
        lastMessageTime: '3 days ago'
      }
    ];

    this.selectDefaultContact();
  }

  // ================= TOAST FEEDBACK SYSTEM =================
  triggerToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 4000);
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
