import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';

export interface SavedAdminReport {
  id: number;
  name: string;
  date: string;
  size: string;
  selected?: boolean;
}

export interface SystemPerformanceMetrics {
  serviceName: string;
  cpuUsage: number;
  memoryUsage: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  responseTime: number; // in ms
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
  auditType: string = 'System Load & Performance';
  startDate: string = 'Sep 01, 2024';
  endDate: string = 'Sep 30, 2024';
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
    { id: 1, name: 'System Security Audit - Q3', date: 'Oct 1, 2024', size: '2.5 MB', selected: true },
    { id: 2, name: 'SLA Support Performance', date: 'Sep 30, 2024', size: '1.1 MB', selected: false },
    { id: 3, name: 'User Directory Export', date: 'Sep 15, 2024', size: '920 KB', selected: false },
    { id: 4, name: 'Kubernetes Container Vitals', date: 'Sep 10, 2024', size: '3.4 MB', selected: false }
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

  // Modals overlays state
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

  // Notification Toast State
  showToast: boolean = false;
  toastMessage: string = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.adminId = user.id;
    }
  }

  setFormat(format: 'PDF' | 'CSV'): void {
    this.exportFormat = format;
  }

  setActiveTab(tab: 'saved' | 'performance' | 'logs'): void {
    this.activeTab = tab;
  }

  selectReport(report: SavedAdminReport): void {
    this.savedReports.forEach(r => r.selected = false);
    report.selected = true;
  }

  // Settings
  openSettings(): void {
    this.showSettingsModal = true;
  }

  closeSettings(): void {
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    this.showSettingsModal = false;
    this.triggerToast('System executive auditing templates and parameters updated successfully!');
  }

  // Audit compile pipeline
  generateReport(): void {
    this.isCompiling = true;
    this.compilingProgress = 8;
    this.compilingStep = 'Initializing system control hooks...';
    this.cdr.detectChanges();

    // Step 1: 400ms
    setTimeout(() => {
      this.compilingProgress = 32;
      this.compilingStep = 'Scanning microservice container allocations...';
      this.cdr.detectChanges();
    }, 450);

    // Step 2: 900ms
    setTimeout(() => {
      this.compilingProgress = 65;
      this.compilingStep = 'Calculating API SLA resolution response times...';
      this.cdr.detectChanges();
    }, 950);

    // Step 3: 1400ms
    setTimeout(() => {
      this.compilingProgress = 92;
      this.compilingStep = 'Signing cryptographic checksum digests...';
      this.cdr.detectChanges();
    }, 1450);

    // Step 4: 1800ms
    setTimeout(() => {
      this.isCompiling = false;
      this.showPreviewModal = true;
      this.generatedPreview = {
        name: `${this.auditType} - Executive Summary`,
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
    
    const nextId = Math.max(...this.savedReports.map(r => r.id)) + 1;
    const newReport: SavedAdminReport = {
      id: nextId,
      name: this.generatedPreview.name,
      date: this.generatedPreview.date,
      size: this.generatedPreview.fileSize,
      selected: true
    };

    this.savedReports.forEach(r => r.selected = false);
    this.savedReports.unshift(newReport);
    
    this.showPreviewModal = false;
    this.activeTab = 'saved';
    this.triggerToast('System audit successfully logged and archived.');
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.generatedPreview = null;
  }

  downloadReport(report: SavedAdminReport, event: MouseEvent): void {
    event.stopPropagation();
    
    if (report.name.includes('Users Directory')) {
       this.triggerToast(`Generating PDF from API...`);
       this.reportService.getUsersReportPdf().subscribe(blob => this.handleBlobDownload(blob, 'users_report.pdf'));
    } else if (report.name.includes('Tasks Report')) {
       this.triggerToast(`Generating PDF from API...`);
       this.reportService.getTasksReportPdf().subscribe(blob => this.handleBlobDownload(blob, 'tasks_report.pdf'));
    } else if (report.name.includes('Projects Report')) {
       this.triggerToast(`Generating PDF from API...`);
       this.reportService.getProjectsReportPdf().subscribe(blob => this.handleBlobDownload(blob, 'projects_report.pdf'));
    } else {
       this.triggerToast(`Downloading "${report.name}" (${report.size})...`);
    }
  }

  private handleBlobDownload(blob: Blob, filename: string): void {
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     window.URL.revokeObjectURL(url);
     this.triggerToast('Download complete!');
  }

  deleteReport(report: SavedAdminReport, event: MouseEvent): void {
    event.stopPropagation();
    this.savedReports = this.savedReports.filter(r => r.id !== report.id);
    this.triggerToast(`Audit report "${report.name}" deleted.`);
  }

  private triggerToast(msg: string): void {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 2500);
  }
}
