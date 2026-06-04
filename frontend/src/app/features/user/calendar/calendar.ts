import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiDescribeButtonComponent } from '../../../shared/components/ai-describe/ai-describe';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { CalendarService, CalendarEvent as ApiCalendarEvent, CalendarSyncStatus } from '../../../core/services/calendar.service';
import { ToastService } from '../../../core/services/toast.service';

export interface CalendarEvent {
  id: number;
  title: string;
  projectName: string;
  time: string;
  type: 'DEADLINE' | 'MEETING' | 'MILESTONE';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  notes: string;
  originalEvent?: ApiCalendarEvent;
}

export interface DaySchedule {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-user-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, AiDescribeButtonComponent],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss']
})
export class UserCalendarComponent implements OnInit {
  developerId: number = 0;
  myTasks: Task[] = [];
  eventsList: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];
  loading: boolean = true;

  // View Mode
  viewMode: 'month' | 'week' | 'day' = 'month';

  // Calendar Grid State
  currentDate: Date = new Date();
  calendarDays: DaySchedule[] = [];
  weekDays: DaySchedule[] = [];
  selectedDay: DaySchedule | null = null;
  readonly hourSlots: number[] = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM – 9 PM
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filters State
  selectedProject: string = '';
  selectedPriority: string = '';
  selectedType: string = '';
  projectsList: string[] = [];

  // Add Event Form State
  showAddModal: boolean = false;
  newEvent = {
    title: '',
    projectName: '',
    time: '09:00 AM',
    type: 'MEETING' as 'DEADLINE' | 'MEETING' | 'MILESTONE',
    priority: 'MEDIUM' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    notes: ''
  };
  savingEvent: boolean = false;

  // Drag & Drop State
  draggedEvent: CalendarEvent | null = null;
  dragSourceDay: DaySchedule | null = null;
  dragOverDay: DaySchedule | null = null;

  // Google Calendar sync
  syncStatus: CalendarSyncStatus | null = null;
  syncing: boolean = false;
  importing: boolean = false;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private calendarService: CalendarService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.developerId = user.id;
    }
    this.loadData();
    this.loadSyncStatus();
  }

  // ── Google Calendar sync ─────────────────────────────────────────────────────

  loadSyncStatus(): void {
    this.calendarService.getSyncStatus().subscribe({
      next: (res: any) => {
        this.syncStatus = res?.data || res;
        this.cdr.detectChanges();
      },
      error: () => { this.syncStatus = null; }
    });
  }

  syncAllToGoogle(): void {
    if (this.syncing) return;
    this.syncing = true;
    this.calendarService.syncAllToGoogle().subscribe({
      next: (res: any) => {
        const result = res?.data || res;
        this.syncing = false;
        if (result?.enabled) {
          this.triggerToast(result.message || 'Synced to Google Calendar.', 'success');
        } else {
          this.triggerToast(result?.message || 'Google Calendar is not configured.', 'error');
        }
        this.loadSyncStatus();
        this.cdr.detectChanges();
      },
      error: () => {
        this.syncing = false;
        this.triggerToast('Sync failed. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  importFromGoogle(): void {
    if (this.importing) return;
    this.importing = true;
    // Import a 6-month window around today.
    const start = new Date(); start.setMonth(start.getMonth() - 1);
    const end = new Date(); end.setMonth(end.getMonth() + 5);
    this.calendarService.importFromGoogle(start.toISOString(), end.toISOString()).subscribe({
      next: (res: any) => {
        const result = res?.data || res;
        this.importing = false;
        if (result?.enabled) {
          this.triggerToast(result.message || 'Imported from Google Calendar.', 'success');
          this.loadData();
        } else {
          this.triggerToast(result?.message || 'Google Calendar is not configured.', 'error');
        }
        this.loadSyncStatus();
        this.cdr.detectChanges();
      },
      error: () => {
        this.importing = false;
        this.triggerToast('Import failed. Please try again.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.taskService.getTasksByUser(this.developerId, 0, 100).subscribe({
      next: (response: any) => {
        try {
          this.myTasks = response && response.data ? response.data : [];
        } catch (e) {
          console.error('Error processing calendar tasks:', e);
        }
        this.fetchCalendarEvents();
      },
      error: (err: any) => {
        console.warn('API offline, seeding calendar mock data:', err);
        this.fetchCalendarEvents();
      }
    });
  }

  fetchCalendarEvents(): void {
    this.calendarService.getUserEvents().subscribe({
      next: (response: any) => {
        const events: ApiCalendarEvent[] = Array.isArray(response)
          ? response
          : (response?.data || response?.content || []);
        const apiEvents = events.map(e => {
          const startDate = new Date(e.startTime);
          return {
            id: e.id || Date.now(),
            title: e.title,
            projectName: this.projectsList[0] || 'General',
            time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'MEETING' as const,
            priority: 'MEDIUM' as const,
            notes: `${e.description || ''}|DATE:${this.toDateStr(startDate)}`,
            originalEvent: e
          } as CalendarEvent;
        });
        this.eventsList = [...apiEvents, ...this.buildTaskEvents()];
        this.extractProjects();
        this.buildAllViews();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Even when there are no custom calendar events, still surface task deadlines.
        this.eventsList = [...this.buildTaskEvents()];
        this.extractProjects();
        this.buildAllViews();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Turns the user's assigned tasks into all-day deadline events on the calendar. */
  private buildTaskEvents(): CalendarEvent[] {
    return this.myTasks
      .filter(t => !!t.deadline)
      .map(t => ({
        // Synthetic negative id keeps task markers distinct from real calendar events.
        id: -(t.id || 0) - 1000000,
        title: t.name,
        projectName: t.projectName || 'General',
        time: 'All day',
        type: 'DEADLINE' as const,
        priority: (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes((t.priority || '').toUpperCase())
          ? (t.priority as string).toUpperCase() : 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        notes: `Task deadline${t.status ? ' · ' + t.status : ''}|DATE:${t.deadline}`
      } as CalendarEvent));
  }

  /**
   * Local YYYY-MM-DD (avoids the UTC roll-back that toISOString() causes for
   * timezones ahead of UTC, which would place events on the wrong day).
   */
  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private extractProjects(): void {
    const projects = new Set<string>();
    this.myTasks.forEach(t => {
      if (t.projectName) projects.add(t.projectName);
    });
    this.eventsList.forEach(e => {
      if (e.projectName) projects.add(e.projectName);
    });
    this.projectsList = Array.from(projects);
  }

  buildAllViews(): void {
    this.generateCalendarGrid();
    this.buildWeekDays();
  }

  // ── View switching ────────────────────────────────────────────────────────────

  setView(mode: 'month' | 'week' | 'day'): void {
    if (mode !== 'month' && this.selectedDay) {
      this.currentDate = new Date(this.selectedDay.date);
    }
    this.viewMode = mode;
    this.buildWeekDays();
    this.cdr.detectChanges();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendarGrid();
    this.buildWeekDays();
    const todayCell = this.calendarDays.find(d => d.isToday);
    if (todayCell) this.selectedDay = todayCell;
    this.cdr.detectChanges();
  }

  prevPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
      this.generateCalendarGrid();
    } else if (this.viewMode === 'week') {
      this.currentDate = new Date(this.currentDate);
      this.currentDate.setDate(this.currentDate.getDate() - 7);
      this.buildWeekDays();
    } else {
      this.currentDate = new Date(this.currentDate);
      this.currentDate.setDate(this.currentDate.getDate() - 1);
      const match = this.calendarDays.find(d => d.date.toDateString() === this.currentDate.toDateString());
      if (match) this.selectedDay = match;
      this.buildWeekDays();
    }
    this.cdr.detectChanges();
  }

  nextPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
      this.generateCalendarGrid();
    } else if (this.viewMode === 'week') {
      this.currentDate = new Date(this.currentDate);
      this.currentDate.setDate(this.currentDate.getDate() + 7);
      this.buildWeekDays();
    } else {
      this.currentDate = new Date(this.currentDate);
      this.currentDate.setDate(this.currentDate.getDate() + 1);
      const match = this.calendarDays.find(d => d.date.toDateString() === this.currentDate.toDateString());
      if (match) this.selectedDay = match;
      this.buildWeekDays();
    }
    this.cdr.detectChanges();
  }

  getPeriodLabel(): string {
    if (this.viewMode === 'month') return this.getMonthYearLabel();
    if (this.viewMode === 'week') return this.getWeekRangeLabel();
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getDate()}, ${this.currentDate.getFullYear()}`;
  }

  getWeekRangeLabel(): string {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const s = `${this.monthNames[startOfWeek.getMonth()].slice(0, 3)} ${startOfWeek.getDate()}`;
    const e = `${this.monthNames[endOfWeek.getMonth()].slice(0, 3)} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    return `${s} – ${e}`;
  }

  generateCalendarGrid(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDaysCount - i);
      this.calendarDays.push(this.createDaySchedule(d, false));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      this.calendarDays.push(this.createDaySchedule(d, true));
    }
    const remainingCells = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      this.calendarDays.push(this.createDaySchedule(d, false));
    }

    const targetDay = this.calendarDays.find(d => d.dayOfMonth === 14 && d.isCurrentMonth) || this.calendarDays[0];
    this.selectedDay = targetDay;
  }

  buildWeekDays(): void {
    const anchor = new Date(this.currentDate);
    const startOfWeek = new Date(anchor);
    startOfWeek.setDate(anchor.getDate() - anchor.getDay());

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      this.weekDays.push(this.createDaySchedule(d, true));
    }

    if (this.viewMode === 'day') {
      const dayMatch = this.weekDays.find(d => d.date.toDateString() === this.currentDate.toDateString());
      if (dayMatch) this.selectedDay = dayMatch;
    }
  }

  createDaySchedule(date: Date, isCurrentMonth: boolean): DaySchedule {
    const dateStr = this.toDateStr(date);
    const dayEvents = this.eventsList.filter(e => {
      if (e.notes && e.notes.includes('|DATE:')) {
        const parts = e.notes.split('|DATE:');
        return parts[1] === dateStr;
      }
      return false;
    });
    return {
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth,
      isToday: this.toDateStr(new Date()) === dateStr,
      events: dayEvents
    };
  }

  getEventsForHour(day: DaySchedule | null, hour: number): CalendarEvent[] {
    if (!day) return [];
    return day.events.filter(e => {
      const match = e.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return false;
      let h = parseInt(match[1]);
      const meridiem = match[3].toUpperCase();
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return h === hour;
    });
  }

  formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────────

  onDragStart(event: DragEvent, calEvent: CalendarEvent, day: DaySchedule): void {
    // Drag-to-reschedule is disabled: users must not change task due dates by
    // dragging events on the calendar. Block the drag from starting.
    event.preventDefault();
  }

  onDragOver(event: DragEvent, day: DaySchedule): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverDay = day;
  }

  onDragLeave(event: DragEvent, day: DaySchedule): void {
    if (this.dragOverDay === day) this.dragOverDay = null;
  }

  onDrop(event: DragEvent, targetDay: DaySchedule): void {
    event.preventDefault();
    if (!this.draggedEvent || !this.dragSourceDay) return;
    if (this.dragSourceDay.date.toDateString() === targetDay.date.toDateString()) {
      this.dragOverDay = null;
      return;
    }
    this.syncEventMove(this.draggedEvent, this.dragSourceDay, targetDay);
    this.triggerToast(`"${this.draggedEvent.title}" moved to ${this.monthNames[targetDay.date.getMonth()].slice(0,3)} ${targetDay.dayOfMonth}`, 'success');
    this.dragOverDay = null;
    this.draggedEvent = null;
    this.dragSourceDay = null;
    this.cdr.detectChanges();
  }

  onDragEnd(): void {
    this.draggedEvent = null;
    this.dragSourceDay = null;
    this.dragOverDay = null;
  }

  private syncEventMove(ev: CalendarEvent, source: DaySchedule, target: DaySchedule): void {
    const newDateStr = this.toDateStr(target.date);

    // Update notes date
    if (ev.notes.includes('|DATE:')) {
      const notesBase = ev.notes.split('|DATE:')[0];
      ev.notes = `${notesBase}|DATE:${newDateStr}`;
    } else {
      ev.notes = `${ev.notes}|DATE:${newDateStr}`;
    }

    // Remove from source in calendarDays
    const srcMonth = this.calendarDays.find(d => d.date.toDateString() === source.date.toDateString());
    if (srcMonth) srcMonth.events = srcMonth.events.filter(e => e.id !== ev.id);

    // Add to target in calendarDays
    const tgtMonth = this.calendarDays.find(d => d.date.toDateString() === target.date.toDateString());
    if (tgtMonth && !tgtMonth.events.find(e => e.id === ev.id)) tgtMonth.events.push(ev);

    // Remove from source in weekDays
    const srcWeek = this.weekDays.find(d => d.date.toDateString() === source.date.toDateString());
    if (srcWeek) srcWeek.events = srcWeek.events.filter(e => e.id !== ev.id);

    // Add to target in weekDays
    const tgtWeek = this.weekDays.find(d => d.date.toDateString() === target.date.toDateString());
    if (tgtWeek && !tgtWeek.events.find(e => e.id === ev.id)) tgtWeek.events.push(ev);

    // Sync source/target objects themselves (if they're refs into the arrays)
    source.events = source.events.filter(e => e.id !== ev.id);
    if (!target.events.find(e => e.id === ev.id)) target.events.push(ev);
  }

  // ── Filter / Navigation ───────────────────────────────────────────────────────

  applyFilters(): void {
    this.generateCalendarGrid();
    this.buildWeekDays();
    this.calendarDays.forEach(day => {
      day.events = day.events.filter(e => {
        const matchesProject  = !this.selectedProject  || e.projectName === this.selectedProject;
        const matchesPriority = !this.selectedPriority || e.priority    === this.selectedPriority;
        const matchesType     = !this.selectedType     || e.type        === this.selectedType;
        return matchesProject && matchesPriority && matchesType;
      });
    });
    if (this.selectedDay) {
      const match = this.calendarDays.find(d => d.date.toDateString() === this.selectedDay?.date.toDateString());
      if (match) this.selectedDay = match;
    }
  }

  onFilterChange(): void { this.applyFilters(); }
  resetFilters(): void {
    this.selectedProject = '';
    this.selectedPriority = '';
    this.selectedType = '';
    this.applyFilters();
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendarGrid();
    this.buildWeekDays();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendarGrid();
    this.buildWeekDays();
  }

  selectDay(day: DaySchedule): void {
    this.selectedDay = day;
    if (this.viewMode !== 'month') {
      this.currentDate = new Date(day.date);
      this.buildWeekDays();
    }
  }

  getMonthYearLabel(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  // ── Modal ─────────────────────────────────────────────────────────────────────

  openAddModal(): void {
    this.newEvent = {
      title: '',
      projectName: this.projectsList[0] || 'Cloud Migration Core',
      time: '09:00 AM',
      type: 'MEETING',
      priority: 'MEDIUM',
      notes: ''
    };
    this.showAddModal = true;
  }

  closeAddModal(): void { this.showAddModal = false; }

  saveCustomEvent(): void {
    if (!this.newEvent.title.trim() || !this.selectedDay) return;
    this.savingEvent = true;

    const dStr = this.toDateStr(this.selectedDay!.date);
    const timeParts = this.newEvent.time.match(/(\d+):(\d+) (\w+)/);
    let hours = 9; let mins = 0;
    if (timeParts) {
      hours = parseInt(timeParts[1]);
      mins  = parseInt(timeParts[2]);
      if (timeParts[3] === 'PM' && hours < 12) hours += 12;
      if (timeParts[3] === 'AM' && hours === 12) hours = 0;
    }
    const startTime = new Date(this.selectedDay!.date);
    startTime.setHours(hours, mins, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const apiEvent: ApiCalendarEvent = {
      title: this.newEvent.title,
      description: this.newEvent.notes,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isAllDay: false,
      userId: this.developerId
    };

    this.calendarService.createEvent(apiEvent).subscribe({
      next: (createdEvent) => {
        const newEv: CalendarEvent = {
          id: createdEvent.id || this.eventsList.length + 1,
          title: createdEvent.title,
          projectName: this.newEvent.projectName,
          time: this.newEvent.time,
          type: this.newEvent.type,
          priority: this.newEvent.priority,
          notes: `${createdEvent.description || ''}|DATE:${dStr}`,
          originalEvent: createdEvent
        };
        this.eventsList.push(newEv);
        this.selectedDay?.events.push(newEv);
        this.savingEvent = false;
        this.closeAddModal();
        this.triggerToast(`Event "${newEv.title}" successfully scheduled!`, 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        const newEv: CalendarEvent = {
          id: this.eventsList.length + 1,
          title: this.newEvent.title,
          projectName: this.newEvent.projectName,
          time: this.newEvent.time,
          type: this.newEvent.type,
          priority: this.newEvent.priority,
          notes: `${this.newEvent.notes}|DATE:${dStr}`
        };
        this.eventsList.push(newEv);
        this.selectedDay?.events.push(newEv);
        this.savingEvent = false;
        this.closeAddModal();
        this.triggerToast(`Event "${newEv.title}" optimistically scheduled!`, 'success');
        this.cdr.detectChanges();
      }
    });
  }

  private triggerToast(msg: string, type: 'success' | 'error'): void {
    this.toast.show(msg, type);
  }

}
