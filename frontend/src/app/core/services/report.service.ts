import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ReportDownloadOptions {
  type: 'project-health' | 'team-allocation' | 'milestone-delivery' | 'users' | 'tasks' | 'projects';
  format: 'PDF' | 'CSV';
  startDate?: string;
  endDate?: string;
  projectIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private basePath = '/reports';

  constructor(private apiService: ApiService) {}

  // --- Core blob download methods ---
  getUsersReportPdf(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/users/pdf`);
  }

  getTasksReportPdf(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/tasks/pdf`);
  }

  getProjectsReportPdf(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/projects/pdf`);
  }

  getProjectHealthReportPdf(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/project-health/pdf`);
  }

  getTeamAllocationReportPdf(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/team-allocation/pdf`);
  }

  getMilestoneDeliveryReportPdf(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/milestone-delivery/pdf`);
  }

  getTasksReportCsv(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/tasks/csv`);
  }

  getProjectsReportCsv(): Observable<Blob> {
    return this.apiService.getBlob(`${this.basePath}/projects/csv`);
  }

  /**
   * Universal report download – picks the right endpoint based on options.
   * Falls back to projects PDF if type is not matched.
   */
  downloadReport(options: ReportDownloadOptions): Observable<Blob> {
    const fmt = options.format.toLowerCase();
    switch (options.type) {
      case 'project-health':
        return fmt === 'csv' ? this.getProjectsReportCsv() : this.getProjectHealthReportPdf();
      case 'team-allocation':
        return fmt === 'csv' ? this.getUsersReportPdf() : this.getTeamAllocationReportPdf();
      case 'milestone-delivery':
        return fmt === 'csv' ? this.getTasksReportCsv() : this.getMilestoneDeliveryReportPdf();
      case 'tasks':
        return fmt === 'csv' ? this.getTasksReportCsv() : this.getTasksReportPdf();
      case 'users':
        return this.getUsersReportPdf();
      case 'projects':
      default:
        return fmt === 'csv' ? this.getProjectsReportCsv() : this.getProjectsReportPdf();
    }
  }

  /**
   * Utility: trigger a browser file download from a Blob.
   */
  static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 300);
  }
}
