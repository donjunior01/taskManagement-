import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private activityLogService: ActivityLogService,
    private cdr: ChangeDetectorRef
  ) {}

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

        // Map backend ActivityLogDTO to frontend AuditLog format
        this.logsList = logs.map((log: any) => ({
          id: log.id,
          action: log.action || log.activityType || 'SYSTEM_ACTION',
          performedBy: log.userName || log.user?.username || (log.user?.firstName ? `${log.user.firstName} ${log.user.lastName}` : 'System'),
          userRole: log.userRole || log.user?.role || 'SYSTEM',
          details: log.details || log.description || '',
          timestamp: log.timestamp || log.createdAt || '',
          impact: log.impact || 'MEDIUM',
          category: log.category || log.entityType || 'SYSTEM',
          ipAddress: log.ipAddress || 'N/A',
          metaData: JSON.stringify(log, null, 2)
        }));
        
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.logsList = [];
        this.applyFilters();
        this.cdr.detectChanges();
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

}
