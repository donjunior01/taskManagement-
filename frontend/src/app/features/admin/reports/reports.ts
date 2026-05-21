import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';

export interface SavedAdminReport {
  id: number;
  name: string;
  date: string;
  size: string;
  format: 'PDF' | 'CSV';
  selected?: boolean;
}

export interface SystemPerformanceMetrics {
  serviceName: string;
  cpuUsage: number;
  memoryUsage: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  responseTime: number;
  activeConnections: number;
}

export interface AuditOperationLog {
  id: number;
  operatorName: string;
  action: string;
  target: string;
  timestamp: string;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class AdminReportsComponent implements OnInit {
  adminId: number = 0;
  loading: boolean = false;

  // Form State
  auditType: string = 'Project Health Report';
  startDate: string = '';
  endDate: string = '';
  exportFormat: 'PDF' | 'CSV' = 'PDF';

  scopesSelection = {
    serverLogs: true,
    usersActivity: true,
    taskBacklogs: true,
    financialAudits: false
  };

  // Tab Control
  activeTab: 'saved' | 'performance' | 'logs' = 'saved';

  // Saved audits list
  savedReports: SavedAdminReport[] = [
    { id: 1, name: 'System Security Audit - Q3', date: 'Oct 1, 2024', size: '2.5 MB', format: 'PDF', selected: true },
    { id: 2, name: 'SLA Support Performance', date: 'Sep 30, 2024', size: '1.1 MB', format: 'PDF', selected: false },
    { id: 3, name: 'User Directory Export', date: 'Sep 15, 2024', size: '920 KB', format: 'PDF', selected: false },
    { id: 4, name: 'Kubernetes Container Vitals', date: 'Sep 10, 2024', size: '3.4 MB', format: 'PDF', selected: false }
  ];

  // System performance vitals
  performanceMetrics: SystemPerformanceMetrics[] = [
    { serviceName: 'Authentication Service', cpuUsage: 35, memoryUsage: 45, status: 'OPTIMAL', responseTime: 85, activeConnections: 1240 },
    { serviceName: 'Project Management APIs', cpuUsage: 68, memoryUsage: 78, status: 'OPTIMAL', responseTime: 120, activeConnections: 3120 },
    { serviceName: 'Database Node Main', cpuUsage: 85, memoryUsage: 82, status: 'DEGRADED', responseTime: 240, activeConnections: 450 },
    { serviceName: 'Notification Socket Stream', cpuUsage: 15, memoryUsage: 25, status: 'OPTIMAL', responseTime: 10, activeConnections: 890 },
    { serviceName: 'Nginx API Gateway', cpuUsage: 42, memoryUsage: 38, status: 'OPTIMAL', responseTime: 40, activeConnections: 5410 }
  ];

  // Audit Logs
  auditLogsList: AuditOperationLog[] = [
    { id: 101, operatorName: 'Admin User', action: 'Generated Audit Report', target: 'Security Audit - Q3', timestamp: '10 mins ago' },
    { id: 98, operatorName: 'Sarah Jenkins', action: 'Deleted user account', target: 'David Miller', timestamp: '2 hours ago' },
    { id: 95, operatorName: 'Admin User', action: 'Updated System Settings', target: 'JWT Token Expiration', timestamp: '5 hours ago' },
    { id: 92, operatorName: 'Alex Johnson', action: 'Exported project database', target: 'Cloud Migration Core', timestamp: '1 day ago' }
  ];

  // Modals state
  showSettingsModal: boolean = false;
  showPreviewModal: boolean = false;
  isCompiling: boolean = false;
  compilingProgress: number = 0;
  compilingStep: string = '';

  settingsModel = {
    pageSize: 'Letter',
    includeNotes: true,
    chartTheme: 'Neon Teal',
    threshold: 85
  };

  generatedPreview: {
    name: string;
    type: string;
    format: string;
    scopesCount: number;
    metricsAnalyzed: number;
    fileSize: string;
    date: string;
  } | null = null;

  // Audit types that map to real backend endpoints
  private readonly REAL_PDF_TYPES = [
    'Users Directory (PDF)',
    'Tasks Report (PDF)',
    'Projects Report (PDF)',
    'Project Health Report',
    'Team Allocation Report',
    'Milestone Delivery Report'
  ];

  private readonly CSV_SUPPORTED_TYPES = [
    'Tasks Report (PDF)',
    'Projects Report (PDF)',
    'Project Health Report',
    'Team Allocation Report',
    'Milestone Delivery Report'
  ];

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private reportService: ReportService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) this.adminId = user.id;
  }

  isRealReportType(): boolean {
    return this.REAL_PDF_TYPES.includes(this.auditType);
  }

  isCsvSupported(): boolean {
    return this.CSV_SUPPORTED_TYPES.includes(this.auditType);
  }

  setFormat(format: 'PDF' | 'CSV'): void {
    if (format === 'CSV' && !this.isCsvSupported()) return;
    this.exportFormat = format;
  }

  setActiveTab(tab: 'saved' | 'performance' | 'logs'): void {
    this.activeTab = tab;
  }

  selectReport(report: SavedAdminReport): void {
    this.savedReports.forEach(r => r.selected = false);
    report.selected = true;
  }

  openSettings(): void { this.showSettingsModal = true; }
  closeSettings(): void { this.showSettingsModal = false; }

  saveSettings(): void {
    this.showSettingsModal = false;
    this.triggerToast('Audit parameters updated successfully!');
  }

  // Audit compile pipeline
  generateReport(): void {
    this.isCompiling = true;
    this.compilingProgress = 8;
    this.compilingStep = 'Initializing system control hooks...';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.compilingProgress = 32;
      this.compilingStep = 'Scanning microservice container allocations...';
      this.cdr.detectChanges();
    }, 450);

    setTimeout(() => {
      this.compilingProgress = 65;
      this.compilingStep = 'Calculating API SLA resolution response times...';
      this.cdr.detectChanges();
    }, 950);

    setTimeout(() => {
      this.compilingProgress = 92;
      this.compilingStep = 'Signing cryptographic checksum digests...';
      this.cdr.detectChanges();
    }, 1450);

    setTimeout(() => {
      this.isCompiling = false;
      this.showPreviewModal = true;
      this.generatedPreview = {
        name: `${this.auditType} — Executive Summary`,
        type: this.auditType,
        format: this.exportFormat,
        scopesCount: (this.scopesSelection.serverLogs ? 1 : 0) +
                     (this.scopesSelection.usersActivity ? 1 : 0) +
                     (this.scopesSelection.taskBacklogs ? 1 : 0) +
                     (this.scopesSelection.financialAudits ? 1 : 0),
        metricsAnalyzed: 842,
        fileSize: this.exportFormat === 'PDF' ? '2.8 MB' : '540 KB',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      this.cdr.detectChanges();
    }, 1850);
  }

  saveGeneratedReport(): void {
    if (!this.generatedPreview) return;

    const nextId = this.savedReports.length > 0
      ? Math.max(...this.savedReports.map(r => r.id)) + 1
      : 1;

    const newReport: SavedAdminReport = {
      id: nextId,
      name: this.generatedPreview.name,
      date: this.generatedPreview.date,
      size: this.generatedPreview.fileSize,
      format: this.exportFormat,
      selected: true
    };

    this.savedReports.forEach(r => r.selected = false);
    this.savedReports.unshift(newReport);
    this.showPreviewModal = false;
    this.activeTab = 'saved';
    this.cdr.detectChanges();

    // Trigger actual API download for real report types
    this.triggerApiDownload(this.auditType, this.exportFormat);
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.generatedPreview = null;
  }

  downloadReport(report: SavedAdminReport, event: MouseEvent): void {
    event.stopPropagation();
    const name = report.name;
    const fmt = report.format ?? 'PDF';

    const obs = this.resolveReportObservable(name, fmt);
    const filename = this.resolveFilename(name, fmt);

    if (obs) {
      this.triggerToast('Generating report from API...');
      obs.subscribe({
        next: (blob) => this.handleBlobDownload(blob, filename),
        error: () => this.triggerToast('Error generating report. Please try again.')
      });
    } else {
      this.triggerToast(`Downloading "${report.name}" (${report.size})...`);
    }
  }

  deleteReport(report: SavedAdminReport, event: MouseEvent): void {
    event.stopPropagation();
    this.savedReports = this.savedReports.filter(r => r.id !== report.id);
    this.triggerToast(`Audit report "${report.name}" deleted.`);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private triggerApiDownload(auditType: string, format: 'PDF' | 'CSV'): void {
    const obs = this.resolveReportObservable(auditType, format);
    const filename = this.resolveFilename(auditType, format);

    if (obs) {
      this.triggerToast('Generating report from API...');
      obs.subscribe({
        next: (blob) => this.handleBlobDownload(blob, filename),
        error: () => this.triggerToast('Error generating report. Please try again.')
      });
    } else {
      this.triggerToast('System audit successfully logged and archived.');
    }
  }

  private resolveReportObservable(nameOrType: string, format: 'PDF' | 'CSV'): Observable<Blob> | null {
    const n = nameOrType.toLowerCase();

    if (n.includes('project health')) {
      return format === 'CSV'
        ? this.reportService.getProjectsReportCsv()
        : this.reportService.getProjectHealthReportPdf();
    }
    if (n.includes('team allocation')) {
      return format === 'CSV'
        ? this.reportService.getTasksReportCsv()
        : this.reportService.getTeamAllocationReportPdf();
    }
    if (n.includes('milestone delivery')) {
      return format === 'CSV'
        ? this.reportService.getTasksReportCsv()
        : this.reportService.getMilestoneDeliveryReportPdf();
    }
    if (n.includes('users directory') || n.includes('user directory') || n.includes('users report')) {
      return this.reportService.getUsersReportPdf();
    }
    if (n.includes('tasks report') || n.includes('tasks (')) {
      return format === 'CSV'
        ? this.reportService.getTasksReportCsv()
        : this.reportService.getTasksReportPdf();
    }
    if (n.includes('projects report') || n.includes('projects (')) {
      return format === 'CSV'
        ? this.reportService.getProjectsReportCsv()
        : this.reportService.getProjectsReportPdf();
    }
    return null;
  }

  private resolveFilename(nameOrType: string, format: 'PDF' | 'CSV'): string {
    const ext = format.toLowerCase();
    const n = nameOrType.toLowerCase();
    if (n.includes('project health'))    return `project_health_report.${ext}`;
    if (n.includes('team allocation'))   return `team_allocation_report.${ext}`;
    if (n.includes('milestone delivery')) return `milestone_delivery_report.${ext}`;
    if (n.includes('users directory') || n.includes('user directory')) return `users_report.pdf`;
    if (n.includes('tasks report') || n.includes('tasks (')) return `tasks_report.${ext}`;
    if (n.includes('projects report') || n.includes('projects (')) return `projects_report.${ext}`;
    return `report.${ext}`;
  }

  private handleBlobDownload(blob: Blob, filename: string): void {
    ReportService.triggerDownload(blob, filename);
    this.triggerToast('Download complete!');
    this.cdr.detectChanges();
  }

  private triggerToast(msg: string): void {
    this.toast.show(msg, 'success');
  }
}
