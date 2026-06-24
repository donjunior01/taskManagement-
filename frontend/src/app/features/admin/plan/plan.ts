import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PlanService, PlanInfo, PlanOption } from '../../../core/services/plan.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-plan',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
  <div class="pl-wrap" *ngIf="info">
    <div class="pl-head">
      <h2>{{ 'admin.plan.title' | translate }}</h2>
      <p class="pl-sub">{{ 'admin.plan.subtitle' | translate:{ org: info.organizationName } }}</p>
    </div>

    <div class="pl-current">
      <div class="pl-current-badge">{{ info.plan }}</div>
      <div class="pl-usage">
        <div class="pl-meter">
          <div class="pl-meter-top"><span>{{ 'admin.plan.members' | translate }}</span><span>{{ usageLabel(info.userCount, info.maxUsers) }}</span></div>
          <div class="pl-track"><div class="pl-fill" [style.width.%]="pct(info.userCount, info.maxUsers)" [class.full]="isFull(info.userCount, info.maxUsers)"></div></div>
        </div>
        <div class="pl-meter">
          <div class="pl-meter-top"><span>{{ 'admin.plan.projects' | translate }}</span><span>{{ usageLabel(info.projectCount, info.maxProjects) }}</span></div>
          <div class="pl-track"><div class="pl-fill" [style.width.%]="pct(info.projectCount, info.maxProjects)" [class.full]="isFull(info.projectCount, info.maxProjects)"></div></div>
        </div>
      </div>
    </div>

    <h3 class="pl-plans-title">{{ 'admin.plan.choosePlan' | translate }}</h3>
    <div class="pl-plans">
      <div class="pl-plan" *ngFor="let p of info.available" [class.on]="p.key === info.plan">
        <div class="pl-plan-name">{{ p.key }}</div>
        <ul class="pl-plan-limits">
          <li>{{ (p.maxUsers < 0 ? 'admin.plan.unlimitedMembers' : 'admin.plan.upToMembers') | translate:{ n: p.maxUsers } }}</li>
          <li>{{ (p.maxProjects < 0 ? 'admin.plan.unlimitedProjects' : 'admin.plan.upToProjects') | translate:{ n: p.maxProjects } }}</li>
        </ul>
        <button class="pl-btn" *ngIf="p.key !== info.plan" (click)="change(p)" [disabled]="busy">{{ 'admin.plan.switch' | translate }}</button>
        <div class="pl-current-tag" *ngIf="p.key === info.plan">{{ 'admin.plan.currentPlan' | translate }}</div>
      </div>
    </div>
    <p class="pl-note">{{ 'admin.plan.note' | translate }}</p>
  </div>
  `,
  styles: [`
    .pl-wrap { display: flex; flex-direction: column; gap: 18px; max-width: 900px; }
    .pl-head h2 { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0; }
    .pl-sub { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
    .pl-current { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
    .pl-current-badge { font-size: 15px; font-weight: 800; letter-spacing: .5px; color: #fff; background: var(--primary); padding: 8px 16px; border-radius: 10px; }
    .pl-usage { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 240px; }
    .pl-meter-top { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }
    .pl-track { height: 8px; background: var(--bg-subtle); border-radius: 9999px; overflow: hidden; }
    .pl-fill { height: 100%; background: var(--primary); border-radius: 9999px; transition: width .4s; } .pl-fill.full { background: var(--danger); }
    .pl-plans-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 6px 0 0; }
    .pl-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .pl-plan { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
    .pl-plan.on { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-bg); }
    .pl-plan-name { font-size: 15px; font-weight: 800; color: var(--text-primary); }
    .pl-plan-limits { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; color: var(--text-secondary); }
    .pl-btn { height: 36px; border: none; border-radius: 9px; background: var(--primary); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: auto; }
    .pl-btn:disabled { opacity: .55; cursor: not-allowed; }
    .pl-current-tag { margin-top: auto; text-align: center; font-size: 12px; font-weight: 700; color: var(--primary); }
    .pl-note { font-size: 12px; color: var(--text-muted); margin: 0; }
  `]
})
export class AdminPlanComponent implements OnInit {
  info: PlanInfo | null = null;
  busy = false;

  constructor(private svc: PlanService, private toast: ToastService, private translate: TranslateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.svc.current().subscribe({
      next: (r: any) => { this.info = r?.data || r; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  pct(n: number, max: number): number { return max < 0 ? (n > 0 ? 8 : 0) : Math.min(100, max === 0 ? 0 : Math.round(n / max * 100)); }
  isFull(n: number, max: number): boolean { return max >= 0 && n >= max; }
  usageLabel(n: number, max: number): string { return max < 0 ? `${n} / ∞` : `${n} / ${max}`; }

  change(p: PlanOption): void {
    if (this.busy) return;
    this.busy = true;
    this.svc.change(p.key).subscribe({
      next: (r: any) => { this.busy = false; this.info = r?.data || r; this.toast.show(this.translate.instant('admin.plan.toastChanged', { plan: p.key }), 'success'); this.cdr.detectChanges(); },
      error: () => { this.busy = false; this.toast.show(this.translate.instant('admin.plan.toastFailed'), 'error'); this.cdr.detectChanges(); }
    });
  }
}
