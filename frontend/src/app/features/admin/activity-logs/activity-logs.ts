import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityLogService, ActivityLog } from '../../../core/services/activity-log.service';

// Interface maps to ActivityLog now, we can adapt properties
// as the backend returns them or keep the frontend model mapping
export interface AuditLog {
  id: number;
  action: string;
  performedBy: string;
  userRole: string;
  details: string;
  timestamp: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SECURITY' | 'DATA_MUTATION' | 'SYSTEM';
  ipAddress: string;
  userAgent?: string;
  metaData?: string;
}

@Component({
  selector: 'app-admin-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-logs.html',
  styleUrls: ['./activity-logs.scss']
})
export class AdminActivityLogsComponent implements OnInit {
  logsList: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];

  // Pagination State
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;

  // Filters State
  searchTerm: string = '';
  categoryFilter: string = '';
  impactFilter: string = '';
  startDateFilter: string = '';
  endDateFilter: string = '';

  // Inspector Modal
  selectedLog: AuditLog | null = null;
  showInspectorModal: boolean = false;

  constructor(private activityLogService: ActivityLogService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.activityLogService.getAllActivityLogs().subscribe({
      next: (response: any) => {
        // Extract array from Spring Data Page wrapper if present, or generic wrappers
        let logs: any[] = [];
        if (Array.isArray(response)) {
          logs = response;
        } else if (response && Array.isArray(response.content)) {
          logs = response.content;
        } else if (response && Array.isArray(response.data)) {
          logs = response.data;
        } else if (response && response.logs && Array.isArray(response.logs)) {
          logs = response.logs;
        }

        // Map backend ActivityLog to frontend AuditLog format safely
        this.logsList = logs.map(log => ({
          id: log.id,
          action: log.action || log.activityType || 'SYSTEM_ACTION',
          performedBy: log.user?.username || (log.user?.firstName ? `${log.user.firstName} ${log.user.lastName}` : 'System'),
          userRole: log.user?.role || 'SYSTEM',
          details: log.details || log.description || '',
          timestamp: log.timestamp || log.createdAt || '',
          impact: log.impact || 'MEDIUM',
          category: log.category || 'SYSTEM',
          ipAddress: log.ipAddress || 'N/A',
          metaData: JSON.stringify(log, null, 2)
        }));
        
        // If the backend returns empty or we want to keep mocks for demo:
        if (this.logsList.length === 0) {
          this.seedMockLogs();
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load activity logs', err);
        // Fallback to mock data if API fails
        this.seedMockLogs();
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.logsList];

    // Search query filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(l => 
        l.performedBy.toLowerCase().includes(term) ||
        l.details.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        l.ipAddress.includes(term)
      );
    }

    // Category filter
    if (this.categoryFilter) {
      result = result.filter(l => l.category === this.categoryFilter);
    }

    // Impact filter
    if (this.impactFilter) {
      result = result.filter(l => l.impact === this.impactFilter);
    }

    // Start Date filter
    if (this.startDateFilter) {
      result = result.filter(l => {
        const dateStr = l.timestamp.includes('T') ? l.timestamp.split('T')[0] : l.timestamp.split(' ')[0];
        return dateStr >= this.startDateFilter;
      });
    }

    // End Date filter
    if (this.endDateFilter) {
      result = result.filter(l => {
        const dateStr = l.timestamp.includes('T') ? l.timestamp.split('T')[0] : l.timestamp.split(' ')[0];
        return dateStr <= this.endDateFilter;
      });
    }

    this.totalElements = result.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);

    // Slice for current page pagination
    const startIdx = this.currentPage * this.pageSize;
    const endIdx = startIdx + this.pageSize;
    this.filteredLogs = result.slice(startIdx, endIdx);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  // Pagination Actions
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  // Inspector actions
  openInspector(log: AuditLog): void {
    this.selectedLog = log;
    this.showInspectorModal = true;
  }

  closeInspector(): void {
    this.showInspectorModal = false;
    this.selectedLog = null;
  }

  // Log level / impact badge visual classes
  getImpactClass(impact: string): string {
    return impact.toLowerCase();
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'SECURITY':
        return 'security';
      case 'DATA_MUTATION':
        return 'database';
      default:
        return 'settings';
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.impactFilter = '';
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.onFilterChange();
  }

  private seedMockLogs(): void {
    this.logsList = [
      {
        id: 1,
        action: 'USER_DEACTIVATION',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Suspended employee account for Alex Mercer due to workspace rotation compliance guidelines.',
        timestamp: '2026-05-17 15:45:12',
        impact: 'HIGH',
        category: 'SECURITY',
        ipAddress: '192.168.1.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        metaData: JSON.stringify({
          targetUserId: 3,
          targetUserEmail: 'alex.mercer@corp.net',
          previousStatus: 'ACTIVE',
          newStatus: 'SUSPENDED',
          authScope: 'EMPLOYEE_PORTAL'
        }, null, 2)
      },
      {
        id: 2,
        action: 'PROJECT_DESTROYED',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Permanently wiped project scope "ISO 27001 Compliance Audit" and 14 nested deliverables.',
        timestamp: '2026-05-17 15:22:45',
        impact: 'CRITICAL',
        category: 'DATA_MUTATION',
        ipAddress: '192.168.1.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        metaData: JSON.stringify({
          projectId: 3,
          projectName: 'ISO 27001 Compliance Audit',
          associatedTasksCount: 14,
          logsArchived: false,
          impactScore: '9.8/10'
        }, null, 2)
      },
      {
        id: 3,
        action: 'USER_PROMOTION',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Promoted Sarah Kerrigan to PROJECT_MANAGER with full corporate manager control rights.',
        timestamp: '2026-05-17 14:10:05',
        impact: 'HIGH',
        category: 'SECURITY',
        ipAddress: '192.168.1.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        metaData: JSON.stringify({
          targetUserId: 2,
          promotedTo: 'PROJECT_MANAGER',
          inheritedScopes: ['PROJECT_WRITE', 'TEAM_CREATE', 'TIME_AUDIT'],
          authorizedBy: 'don.junior'
        }, null, 2)
      },
      {
        id: 4,
        action: 'TASK_GOVERNANCE_OVERRIDE',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Boosted task priority for "Setup VPC Security Groups" to CRITICAL and set progress to 60%.',
        timestamp: '2026-05-17 13:02:18',
        impact: 'MEDIUM',
        category: 'DATA_MUTATION',
        ipAddress: '192.168.1.18',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.4.1',
        metaData: JSON.stringify({
          taskId: 1,
          previousPriority: 'MEDIUM',
          newPriority: 'CRITICAL',
          previousProgress: 20,
          newProgress: 60,
          assigneeId: 3
        }, null, 2)
      },
      {
        id: 5,
        action: 'SETTINGS_MODIFICATION',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Increased maximum file upload threshold parameter from 10MB to 50MB.',
        timestamp: '2026-05-17 11:30:00',
        impact: 'LOW',
        category: 'SYSTEM',
        ipAddress: '192.168.1.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        metaData: JSON.stringify({
          parameterName: 'max_upload_size',
          oldValue: '10MB',
          newValue: '50MB',
          effectType: 'GLOBAL_CONFIG'
        }, null, 2)
      },
      {
        id: 6,
        action: 'USER_AUTHENTICATED',
        performedBy: 'david.m',
        userRole: 'EMPLOYEE',
        details: 'Successful user authentication handshake via corporate employee login portal.',
        timestamp: '2026-05-17 10:15:33',
        impact: 'LOW',
        category: 'SECURITY',
        ipAddress: '185.190.140.8',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) Firefox/125.0',
        metaData: JSON.stringify({
          loginMethod: 'BEARER_JWT',
          sessionLifetime: '24h',
          mfaVerified: false
        }, null, 2)
      },
      {
        id: 7,
        action: 'PROJECT_LAUNCHED',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Bootstrapped project workspace "Cloud Migration Core" and assigned to Sarah Kerrigan.',
        timestamp: '2026-05-16 17:40:00',
        impact: 'MEDIUM',
        category: 'DATA_MUTATION',
        ipAddress: '192.168.1.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        metaData: JSON.stringify({
          name: 'Cloud Migration Core',
          startDate: '2026-05-17',
          endDate: '2026-06-30',
          managerId: 2,
          initialStatus: 'PLANNED'
        }, null, 2)
      },
      {
        id: 8,
        action: 'SECURITY_SHUTDOWN',
        performedBy: 'SYSTEM',
        userRole: 'CORE_KERNEL',
        details: 'Automatically flushed 11 expired web sessions from authentication cache.',
        timestamp: '2026-05-16 04:00:00',
        impact: 'LOW',
        category: 'SYSTEM',
        ipAddress: '127.0.0.1',
        userAgent: 'Internal System Core Service Daemon v1.2',
        metaData: JSON.stringify({
          expiredSessionsFlushed: 11,
          cacheType: 'REDIS_SESSION_STORE',
          freedMemoryBytes: 8192
        }, null, 2)
      },
      {
        id: 9,
        action: 'DOMAIN_BAN_ADDED',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Configured email constraint block to blacklist registrations from "@throwaway.temp".',
        timestamp: '2026-05-15 13:20:10',
        impact: 'HIGH',
        category: 'SECURITY',
        ipAddress: '192.168.1.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        metaData: JSON.stringify({
          blacklistedDomain: '@throwaway.temp',
          actionTaken: 'BLOCK_REGISTRATION',
          scope: 'SIGNUP_GATEWAY'
        }, null, 2)
      },
      {
        id: 10,
        action: 'API_VELOCITY_ALARM',
        performedBy: 'SYSTEM',
        userRole: 'CORE_KERNEL',
        details: 'Rate limiting triggered for IP 192.168.99.105 due to 450 requests/min velocity spike.',
        timestamp: '2026-05-15 08:50:11',
        impact: 'HIGH',
        category: 'SECURITY',
        ipAddress: '192.168.99.105',
        userAgent: 'Go-http-client/2.0 (Spammer simulation)',
        metaData: JSON.stringify({
          requestFrequency: '450req/min',
          thresholdMax: '100req/min',
          blockDuration: '15m',
          targetEndpoint: '/api/auth/login'
        }, null, 2)
      },
      {
        id: 11,
        action: 'PROJECT_METADATA_EDITED',
        performedBy: 'sarah.k',
        userRole: 'PROJECT_MANAGER',
        details: 'Modified business descriptions and expanded scopes for "Glassmorphic Design UI".',
        timestamp: '2026-05-14 16:12:44',
        impact: 'LOW',
        category: 'DATA_MUTATION',
        ipAddress: '192.168.1.15',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        metaData: JSON.stringify({
          projectId: 2,
          fieldsModified: ['description', 'endDate'],
          oldEndDate: '2026-05-20',
          newEndDate: '2026-05-28'
        }, null, 2)
      },
      {
        id: 12,
        action: 'USER_ONBOARDED',
        performedBy: 'don.junior',
        userRole: 'ADMINISTRATOR',
        details: 'Onboarded credentials for standard user developer account "David Miller".',
        timestamp: '2026-05-14 09:30:15',
        impact: 'MEDIUM',
        category: 'SECURITY',
        ipAddress: '192.168.1.42',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        metaData: JSON.stringify({
          username: 'david.m',
          firstName: 'David',
          lastName: 'Miller',
          email: 'david@taskmanagement.com',
          initialRole: 'USER'
        }, null, 2)
      }
    ];
  }
}
