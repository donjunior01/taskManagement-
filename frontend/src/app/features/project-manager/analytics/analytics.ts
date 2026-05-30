import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, ManagerAnalytics, WeeklyPoint } from '../../../core/services/analytics.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pm-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.scss']
})
export class PmAnalyticsComponent implements OnInit {
  analytics: ManagerAnalytics | null = null;
  loading = true;

  constructor(
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.analyticsService.getManagerAnalytics().subscribe({
      next: (response: any) => {
        this.analytics = response?.data || response;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.show('Could not load analytics.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Chart helpers ──────────────────────────────────────────────────────────
  /** Max value across created/completed in the trend, for bar scaling (min 1). */
  get trendMax(): number {
    if (!this.analytics?.weeklyTrend?.length) return 1;
    let max = 1;
    for (const p of this.analytics.weeklyTrend) {
      max = Math.max(max, p.created, p.completed);
    }
    return max;
  }

  barHeight(value: number): number {
    return Math.round((value / this.trendMax) * 100);
  }

  get maxWorkload(): number {
    if (!this.analytics?.workloadByMember?.length) return 1;
    return Math.max(1, ...this.analytics.workloadByMember.map(m => m.openTasks + m.completedTasks));
  }

  workloadWidth(value: number): number {
    return Math.round((value / this.maxWorkload) * 100);
  }

  /** stroke-dasharray for a 283-circumference ring at the given percentage. */
  ringDash(pct: number): string {
    const p = Math.min(100, Math.max(0, pct || 0));
    const filled = (p / 100) * 283;
    return `${filled} ${283 - filled}`;
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }

  trackByLabel(_i: number, p: WeeklyPoint): string {
    return p.label;
  }
}
