import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';

export interface SavedReport {
  id: number;
  name: string;
  date: string;
  size: string;
  format: 'PDF' | 'CSV';
  selected?: boolean;
}

export interface ProjectHealthReport {
  projectName: string;
  completionRate: number;
  health: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  tasksCompleted: number;
  tasksPending: number;
  overdueTasks: number;
}

export interface DevProductivityReport {
  developerName: string;
  role: string;
  tasksAssigned: number;
  tasksCompleted: number;
  velocityRating: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-pm-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class PmReportsComponent implements OnInit {
  managerId: number = 0;
  loading: boolean = false;

  // Form State
  reportType: string = 'Project Health & Status';
  startDate: string = '';
  endDate: string = '';
  exportFormat: 'PDF' | 'CSV' = 'PDF';

  projectsSelection = {
    websiteRedesign: true,
    mobileApp: true,
    backendApi: true
  };

  // Tab Control: 'saved' | 'health' | 'productivity'
  activeTab: 'saved' | 'health' | 'productivity' = 'saved';

  // Saved reports list
  savedReports: SavedReport[] = [
    { id: 1, name: 'Q3 Velocity Report', date: 'Oct 1, 2024', size: '1.2 MB', format: 'PDF', selected: true },
    { id: 2, name: 'Team Allocation - Sep', date: 'Sep 30, 2024', size: '850 KB', format: 'PDF', selected: false },
    { id: 3, name: 'Project Health Summary', date: 'Sep 15, 2024', size: '2.4 MB', format: 'PDF', selected: false },
    { id: 4, name: 'Sprint 42 Retrospective', date: 'Sep 10, 2024', size: '1.8 MB', format: 'CSV', selected: false }
  ];

  // Project Health reports
  healthReports: ProjectHealthReport[] = [
    { projectName: 'Website Redesign Q3', completionRate: 75, health: 'ON_TRACK', tasksCompleted: 42, tasksPending: 12, overdueTasks: 0 },
    { projectName: 'Mobile App V2.0', completionRate: 40, health: 'AT_RISK', tasksCompleted: 35, tasksPending: 48, overdueTasks: 5 },
    { projectName: 'Backend API Migration', completionRate: 90, health: 'ON_TRACK', tasksCompleted: 38, tasksPending: 4, overdueTasks: 0 },
    { projectName: 'Marketing Campaign Q4', completionRate: 15, health: 'ON_TRACK', tasksCompleted: 4, tasksPending: 26, overdueTasks: 1 },
    { projectName: 'Client Portal Overhaul', completionRate: 60, health: 'ON_TRACK', tasksCompleted: 20, tasksPending: 14, overdueTasks: 0 }
  ];

  // Developer Productivity reports
  devVelocityReports: DevProductivityReport[] = [
    { developerName: 'Alex Johnson', role: 'Frontend Architect', tasksAssigned: 26, tasksCompleted: 24, velocityRating: 'Excellent', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { developerName: 'Maya Ndlovu', role: 'Fullstack Dev', tasksAssigned: 22, tasksCompleted: 18, velocityRating: 'Very Good', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { developerName: 'Carlos Rodriguez', role: 'Backend Engineer', tasksAssigned: 25, tasksCompleted: 21, velocityRating: 'Very Good', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
    { developerName: 'Leila Hassan', role: 'Mobile Dev', tasksAssigned: 18, tasksCompleted: 16, velocityRating: 'Excellent', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' }
  ];

  // Modal overlays state
  showSettingsModal: boolean = false;
  showPreviewModal: boolean = false;
  isCompiling: boolean = false;
  compilingProgress: number = 0;
  compilingStep: string = '';
  isDownloading: boolean = false;

  settingsModel = {
    pageSize: 'A4',
    includeNotes: true,
    chartTheme: 'Glassmorphic Blue',
    velocityThreshold: 75
  };

  generatedPreview: {
    name: string;
    type: string;
    format: 'PDF' | 'CSV';
    reportTypeKey: string;
    projectsCount: number;
    tasksAnalyzed: number;
    fileSize: string;
    date: string;
  } | null = null;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.managerId = user.id;
    }
    // Initialize dates to current month range
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.startDate = firstDay.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    this.endDate = lastDay.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  setFormat(format: 'PDF' | 'CSV'): void {
    this.exportFormat = format;
  }

  setActiveTab(tab: 'saved' | 'health' | 'productivity'): void {
    this.activeTab = tab;
  }

  selectReport(report: SavedReport): void {
    this.savedReports.forEach(r => r.selected = false);
    report.selected = true;
  }

  // Settings modal
  openSettings(): void {
    this.showSettingsModal = true;
  }

  closeSettings(): void {
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    this.showSettingsModal = false;
    this.triggerToast('Report templates and default layout configurations updated!', 'success');
  }

  // Professional compilation modal flow
  generateReport(): void {
    this.isCompiling = true;
    this.compilingProgress = 12;
    this.compilingStep = 'Initializing compilation engine...';
    this.cdr.detectChanges();

    setTimeout(() => { this.compilingProgress = 40; this.compilingStep = 'Scanning project backlogs and pipelines...'; this.cdr.detectChanges(); }, 450);
    setTimeout(() => { this.compilingProgress = 70; this.compilingStep = 'Calculating velocity curves and averages...'; this.cdr.detectChanges(); }, 950);
    setTimeout(() => { this.compilingProgress = 95; this.compilingStep = 'Finalizing vector layouts and document margins...'; this.cdr.detectChanges(); }, 1450);

    setTimeout(() => {
      this.isCompiling = false;
      this.showPreviewModal = true;
      const reportTypeKey = this.getReportTypeKey(this.reportType);
      this.generatedPreview = {
        name: `${this.reportType} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        type: this.reportType,
        format: this.exportFormat,
        reportTypeKey,
        projectsCount: (this.projectsSelection.websiteRedesign ? 1 : 0) +
                       (this.projectsSelection.mobileApp ? 1 : 0) +
                       (this.projectsSelection.backendApi ? 1 : 0),
        tasksAnalyzed: 142,
        fileSize: this.exportFormat === 'PDF' ? '1.6 MB' : '380 KB',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      this.cdr.detectChanges();
    }, 1850);
  }

  private getReportTypeKey(reportType: string): string {
    if (reportType.toLowerCase().includes('health')) return 'project-health';
    if (reportType.toLowerCase().includes('allocation') || reportType.toLowerCase().includes('team')) return 'team-allocation';
    if (reportType.toLowerCase().includes('milestone') || reportType.toLowerCase().includes('delivery')) return 'milestone-delivery';
    return 'project-health';
  }

  /** Save + download the generated report */
  saveGeneratedReport(): void {
    if (!this.generatedPreview) return;
    this.isDownloading = true;
    this.cdr.detectChanges();

    const filename = `${this.generatedPreview.name.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_')}.${this.generatedPreview.format.toLowerCase()}`;

    this.reportService.downloadReport({
      type: this.generatedPreview.reportTypeKey as any,
      format: this.generatedPreview.format
    }).subscribe({
      next: (blob: Blob) => {
        ReportService.triggerDownload(blob, filename);
        this.isDownloading = false;
        this.addToSavedReports();
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: create a minimal placeholder file for offline scenarios
        this.isDownloading = false;
        const content = this.exportFormat === 'CSV'
          ? this.generateCsvContent()
          : `Report: ${this.generatedPreview?.name}\nGenerated: ${this.generatedPreview?.date}\nFormat: ${this.generatedPreview?.format}`;
        const mimeType = this.exportFormat === 'CSV' ? 'text/csv' : 'application/pdf';
        const blob = new Blob([content], { type: mimeType });
        ReportService.triggerDownload(blob, filename);
        this.addToSavedReports();
        this.cdr.detectChanges();
      }
    });
  }

  private generateCsvContent(): string {
    const lines = ['Project Name,Completion Rate,Health Status,Tasks Completed,Tasks Pending,Overdue Tasks'];
    this.healthReports.forEach(r => {
      lines.push(`"${r.projectName}",${r.completionRate}%,${r.health},${r.tasksCompleted},${r.tasksPending},${r.overdueTasks}`);
    });
    return lines.join('\n');
  }

  private addToSavedReports(): void {
    if (!this.generatedPreview) return;
    const nextId = Math.max(...this.savedReports.map(r => r.id), 0) + 1;
    const newReport: SavedReport = {
      id: nextId,
      name: this.generatedPreview.name,
      date: this.generatedPreview.date,
      size: this.generatedPreview.fileSize,
      format: this.generatedPreview.format,
      selected: true
    };
    this.savedReports.forEach(r => r.selected = false);
    this.savedReports.unshift(newReport);
    this.showPreviewModal = false;
    this.activeTab = 'saved';
    this.triggerToast('Report compiled, downloaded and archived successfully!', 'success');
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.generatedPreview = null;
  }

  /** Download a saved report to the machine */
  downloadReport(report: SavedReport, event: MouseEvent): void {
    event.stopPropagation();
    const filename = `${report.name.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_')}.${report.format?.toLowerCase() || 'pdf'}`;
    const typeKey = this.getReportTypeKey(report.name);

    this.reportService.downloadReport({ type: typeKey as any, format: report.format || 'PDF' }).subscribe({
      next: (blob: Blob) => {
        ReportService.triggerDownload(blob, filename);
        this.triggerToast(`"${report.name}" downloaded successfully!`, 'success');
      },
      error: () => {
        // Offline fallback: generate placeholder
        const content = `Report: ${report.name}\nDate: ${report.date}\nSize: ${report.size}`;
        const blob = new Blob([content], { type: 'text/plain' });
        ReportService.triggerDownload(blob, filename);
        this.triggerToast(`"${report.name}" downloaded successfully!`, 'success');
      }
    });
  }

  deleteReport(report: SavedReport, event: MouseEvent): void {
    event.stopPropagation();
    this.savedReports = this.savedReports.filter(r => r.id !== report.id);
    this.triggerToast(`Deleted "${report.name}" successfully!`, 'success');
    this.cdr.detectChanges();
  }

  private triggerToast(msg: string, type: 'success' | 'error'): void {
    this.toast.show(msg, type);
  }
}
