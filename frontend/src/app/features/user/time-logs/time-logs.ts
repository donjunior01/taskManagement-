import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeLogService, TimeLog } from '../../../core/services/time-log.service';
import { ToastService } from '../../../core/services/toast.service';

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  deadlines: Task[];
  hoursLogged: number;
}

export interface TimeLogEntry {
  id: number;
  taskName: string;
  projectName: string;
  hours: number;
  notes: string;
  date: string;
}

@Component({
  selector: 'app-user-time-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-logs.html',
  styleUrls: ['./time-logs.scss']
})
export class UserTimeLogsComponent implements OnInit {
  developerId: number = 0;
  myTasks: Task[] = [];
  timeLogsList: TimeLogEntry[] = [];
  loading: boolean = true;

  // Calendar state
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Workload telemetry summaries
  totalHoursThisWeek: number = 0;
  activeTasksWorked: number = 0;
  averageHoursPerDay: number = 0;

  // Log Entry Modal
  showLogModal: boolean = false;
  submittingLog: boolean = false;
  logForm = { taskId: 0, hours: 0, date: '', description: '' };

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private timeLogService: TimeLogService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.developerId = user.id;
    }
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load real time logs from API
    this.timeLogService.getMyTimeLogs().subscribe({
      next: (response: any) => {
        let logs: TimeLog[] = [];
        if (Array.isArray(response)) {
          logs = response;
        } else if (response && Array.isArray(response.content)) {
          logs = response.content;
        } else if (response && Array.isArray(response.data)) {
          logs = response.data;
        } else if (response && response.logs && Array.isArray(response.logs)) {
          logs = response.logs;
        }

        if (logs && logs.length > 0) {
          this.timeLogsList = logs.map(l => ({
            id: l.id!,
            taskName: `Task #${l.taskId}`,
            projectName: 'Workspace',
            hours: l.hours || (l as any).hoursSpent || 0,
            notes: l.description || '',
            date: l.date || (l as any).logDate || ''
          }));
          this.calculateTelemetry();
        }

        // Also fetch user's tasks to populate form selection
        this.taskService.getTasksByUser(this.developerId, 0, 100).subscribe({
          next: (res: any) => {
            if (res && Array.isArray(res.data)) {
              this.myTasks = res.data;
            } else if (res && Array.isArray(res.content)) {
              this.myTasks = res.content;
            } else if (Array.isArray(res)) {
              this.myTasks = res;
            }
            this.generateCalendar();
            this.cdr.detectChanges();
          },
          error: () => {
            this.generateCalendar();
            this.cdr.detectChanges();
          }
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.timeLogsList = [];
        this.myTasks = [];
        this.generateCalendar();
        this.calculateTelemetry();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openLogModal(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.logForm = { taskId: this.myTasks.length > 0 ? this.myTasks[0].id! : 0, hours: 1, date: todayStr, description: '' };
    this.showLogModal = true;
  }

  closeLogModal(): void { this.showLogModal = false; }

  submitLog(): void {
    if (!this.logForm.hours || !this.logForm.date) return;
    this.submittingLog = true;
    const payload: any = {
      taskId: Number(this.logForm.taskId),
      hours: this.logForm.hours,
      date: this.logForm.date,
      hoursSpent: this.logForm.hours,
      logDate: this.logForm.date,
      description: this.logForm.description
    };
    this.timeLogService.createTimeLog(payload).subscribe({
      next: (createdResponse: any) => {
        const created = (createdResponse && createdResponse.data) ? createdResponse.data : createdResponse;
        const loggedHours = created.hours || created.hoursSpent || this.logForm.hours;
        const loggedDate = created.date || created.logDate || this.logForm.date;
        this.timeLogsList.unshift({
          id: created.id || Math.max(0, ...this.timeLogsList.map(l => l.id)) + 1,
          taskName: `Task #${created.taskId || this.logForm.taskId}`,
          projectName: 'Workspace',
          hours: loggedHours,
          notes: created.description || this.logForm.description,
          date: loggedDate
        });
        this.calculateTelemetry();
        this.generateCalendar();
        this.submittingLog = false;
        this.showLogModal = false;
        this.triggerToast('Time log entry created successfully!');
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: add locally
        const newId = Math.max(0, ...this.timeLogsList.map(l => l.id)) + 1;
        this.timeLogsList.unshift({ id: newId, taskName: `Task #${this.logForm.taskId}`, projectName: 'Workspace', hours: this.logForm.hours, notes: this.logForm.description, date: this.logForm.date });
        this.calculateTelemetry();
        this.generateCalendar();
        this.submittingLog = false;
        this.showLogModal = false;
        this.triggerToast('Time log added locally.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteLog(id: number): void {
    this.timeLogService.deleteTimeLog(id).subscribe({
      next: () => {
        this.timeLogsList = this.timeLogsList.filter(l => l.id !== id);
        this.calculateTelemetry();
        this.generateCalendar();
        this.triggerToast('Time log deleted.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.timeLogsList = this.timeLogsList.filter(l => l.id !== id);
        this.calculateTelemetry();
        this.generateCalendar();
        this.triggerToast('Log removed locally.');
        this.cdr.detectChanges();
      }
    });
  }

  exportCsv(): void {
    this.timeLogService.exportMyTimeLogsCsv().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'my_time_logs.csv';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.triggerToast('CSV exported successfully!');
      },
      error: () => this.triggerToast('Export failed. Please try again.')
    });
  }

  private triggerToast(msg: string): void {
    this.toast.show(msg, 'success');
  }

  private generateTimeLogs(): void {
    this.timeLogsList = [];
    let idCounter = 1;

    // Simulate logs from assigned tasks
    this.myTasks.forEach(task => {
      if (task.totalHoursLogged && task.totalHoursLogged > 0) {
        // Distribute hours into entries
        const entryHours = Math.min(task.totalHoursLogged, 4);
        this.timeLogsList.push({
          id: idCounter++,
          taskName: task.name,
          projectName: task.projectName || 'Active Workspace',
          hours: entryHours,
          notes: `Implemented requirements and checked local testing pipelines for ${task.name}.`,
          date: task.deadline ? this.getPreviousDateStr(task.deadline, 1) : new Date().toISOString().split('T')[0]
        });

        if (task.totalHoursLogged > 4) {
          this.timeLogsList.push({
            id: idCounter++,
            taskName: task.name,
            projectName: task.projectName || 'Active Workspace',
            hours: task.totalHoursLogged - entryHours,
            notes: `Initial schema mapping and local boilerplate code setup.`,
            date: task.deadline ? this.getPreviousDateStr(task.deadline, 2) : new Date().toISOString().split('T')[0]
          });
        }
      }
    });

  }

  private calculateTelemetry(): void {
    this.totalHoursThisWeek = this.timeLogsList.reduce((sum, entry) => sum + entry.hours, 0);
    this.activeTasksWorked = new Set(this.timeLogsList.map(entry => entry.taskName)).size;
    
    // Average hours per logged entry
    const entriesCount = this.timeLogsList.length;
    this.averageHoursPerDay = entriesCount > 0 ? Math.round((this.totalHoursThisWeek / 5) * 10) / 10 : 0;
  }

  // Calendar builder logic
  generateCalendar(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Index of the first day (0=Sunday, 6=Saturday)
    let startDayOfWeek = firstDayOfMonth.getDay();
    // Adjust calendar start: start from Monday (1)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Previous month details
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Seed previous month overlap days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      this.calendarDays.push(this.createCalendarDay(d, false));
    }

    // Seed current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      this.calendarDays.push(this.createCalendarDay(d, true));
    }

    // Seed next month overlap days to complete grid (42 cells total)
    const remainingCells = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      this.calendarDays.push(this.createCalendarDay(d, false));
    }

    // Default select today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDay = this.calendarDays.find(d => d.date.toISOString().split('T')[0] === todayStr);
    if (todayDay) {
      this.selectedDay = todayDay;
    } else if (this.calendarDays.length > 0) {
      this.selectedDay = this.calendarDays[0];
    }
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // Find deadlines for this date
    const deadlines = this.myTasks.filter(t => t.deadline === dateStr);
    
    // Sum hours logged on this date
    const hours = this.timeLogsList
      .filter(entry => entry.date === dateStr)
      .reduce((sum, entry) => sum + entry.hours, 0);

    return {
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth,
      isToday: dateStr === todayStr,
      deadlines,
      hoursLogged: hours
    };
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  // Formatting helper
  getMonthYearLabel(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  private getPreviousDateStr(baseDateStr: string, daysAgo: number): string {
    const d = new Date(baseDateStr);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  }

}
