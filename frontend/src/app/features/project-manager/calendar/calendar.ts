import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { CalendarService, CalendarEvent as ApiCalendarEvent } from '../../../core/services/calendar.service';

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
  selector: 'app-pm-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss']
})
export class PmCalendarComponent implements OnInit {
  managerId: number = 0;
  eventsList: CalendarEvent[] = [];
  loading: boolean = true;

  // View mode
  viewMode: 'month' | 'week' | 'day' = 'month';

  // Calendar state
  currentDate: Date = new Date();
  calendarDays: DaySchedule[] = [];
  weekDays: DaySchedule[] = [];
  selectedDay: DaySchedule | null = null;

  readonly monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  // Hour slots 7 AM – 9 PM for day view
  readonly hourSlots: number[] = Array.from({ length: 15 }, (_, i) => i + 7);

  // Filters
  selectedProject: string = '';
  selectedPriority: string = '';
  selectedType: string = '';
  projectsList: string[] = [];

  // Add Event Modal
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

  // Drag and Drop state
  draggedEvent: CalendarEvent | null = null;
  dragSourceDay: DaySchedule | null = null;
  dragOverDay: DaySchedule | null = null;

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private calendarService: CalendarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) this.managerId = user.id;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.projectService.getProjectsByManager(this.managerId, 0, 100).subscribe({
      next: (response: any) => {
        const projects = response?.data ?? [];
        this.projectsList = projects.map((p: any) => p.name);
        if (!this.projectsList.length) {
          this.projectsList = ['Website Redesign Q3','Mobile App V2.0','Backend API Migration','Marketing Campaign Q4','Client Portal Overhaul'];
        }
        this.fetchCalendarEvents();
      },
      error: () => {
        this.projectsList = ['Website Redesign Q3','Mobile App V2.0','Backend API Migration','Marketing Campaign Q4','Client Portal Overhaul'];
        this.fetchCalendarEvents();
      }
    });
  }

  fetchCalendarEvents(): void {
    this.calendarService.getAllEvents().subscribe({
      next: (events: ApiCalendarEvent[]) => {
        if (events?.length) {
          this.eventsList = events.map(e => {
            const startDate = new Date(e.startTime);
            return {
              id: e.id || Date.now(),
              title: e.title,
              projectName: this.projectsList[0] || 'General',
              time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'MEETING' as const,
              priority: 'MEDIUM' as const,
              notes: `${e.description || ''}|DATE:${startDate.toISOString().split('T')[0]}`,
              originalEvent: e
            };
          });
        } else {
          this.seedMockData();
        }
        this.buildAllViews();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.seedMockData();
        this.buildAllViews();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildAllViews(): void {
    this.generateCalendarGrid();
    this.buildWeekDays();
  }

  // ── View switching ──────────────────────────────────────────────────────────

  setView(mode: 'month' | 'week' | 'day'): void {
    const refDate = this.selectedDay?.date || this.currentDate;
    this.viewMode = mode;
    if (mode === 'month') {
      this.currentDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      this.generateCalendarGrid();
      const refStr = refDate.toISOString().split('T')[0];
      this.selectedDay = this.calendarDays.find(d => d.date.toISOString().split('T')[0] === refStr)
        || this.calendarDays.find(d => d.isToday) || this.calendarDays[0];
    } else if (mode === 'week') {
      this.currentDate = new Date(refDate);
      this.buildWeekDays();
      const refStr = refDate.toISOString().split('T')[0];
      this.selectedDay = this.weekDays.find(d => d.date.toISOString().split('T')[0] === refStr)
        || this.weekDays.find(d => d.isToday) || this.weekDays[0];
    } else {
      this.currentDate = new Date(refDate);
      this.selectedDay = this.createDaySchedule(this.currentDate, true);
    }
    this.cdr.detectChanges();
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate = new Date(today);
    if (this.viewMode === 'month') {
      this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
      this.generateCalendarGrid();
      this.selectedDay = this.calendarDays.find(d => d.isToday) || this.calendarDays[0];
    } else if (this.viewMode === 'week') {
      this.buildWeekDays();
      this.selectedDay = this.weekDays.find(d => d.isToday) || this.weekDays[0];
    } else {
      this.selectedDay = this.createDaySchedule(today, true);
    }
    this.cdr.detectChanges();
  }

  prevPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
      this.generateCalendarGrid();
    } else if (this.viewMode === 'week') {
      this.currentDate = new Date(this.currentDate.getTime() - 7 * 86400000);
      this.buildWeekDays();
      this.selectedDay = this.weekDays[0];
    } else {
      this.currentDate = new Date(this.currentDate.getTime() - 86400000);
      this.selectedDay = this.createDaySchedule(this.currentDate, true);
    }
    this.cdr.detectChanges();
  }

  nextPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
      this.generateCalendarGrid();
    } else if (this.viewMode === 'week') {
      this.currentDate = new Date(this.currentDate.getTime() + 7 * 86400000);
      this.buildWeekDays();
      this.selectedDay = this.weekDays[0];
    } else {
      this.currentDate = new Date(this.currentDate.getTime() + 86400000);
      this.selectedDay = this.createDaySchedule(this.currentDate, true);
    }
    this.cdr.detectChanges();
  }

  getPeriodLabel(): string {
    if (this.viewMode === 'month') return this.getMonthYearLabel();
    if (this.viewMode === 'week') return this.getWeekRangeLabel();
    return this.currentDate.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  getMonthYearLabel(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  getWeekRangeLabel(): string {
    if (!this.weekDays.length) return '';
    const first = this.weekDays[0].date;
    const last = this.weekDays[6].date;
    if (first.getMonth() === last.getMonth()) {
      return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  buildWeekDays(): void {
    this.weekDays = [];
    const date = new Date(this.currentDate);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      this.weekDays.push(this.createDaySchedule(d, true));
    }
  }

  generateCalendarGrid(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      this.calendarDays.push(this.createDaySchedule(new Date(year, month - 1, prevMonthDays - i), false));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push(this.createDaySchedule(new Date(year, month, i), true));
    }
    const remaining = 42 - this.calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      this.calendarDays.push(this.createDaySchedule(new Date(year, month + 1, i), false));
    }

    this.selectedDay = this.calendarDays.find(d => d.isToday)
      || this.calendarDays.find(d => d.dayOfMonth === 14 && d.isCurrentMonth)
      || this.calendarDays[0];
  }

  createDaySchedule(date: Date, isCurrentMonth: boolean): DaySchedule {
    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = this.eventsList.filter(e => {
      const m = e.notes?.match(/\|DATE:([0-9-]+)/);
      return m ? m[1] === dateStr : false;
    });
    return {
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth,
      isToday: new Date().toISOString().split('T')[0] === dateStr,
      events: dayEvents
    };
  }

  // ── Filters ──────────────────────────────────────────────────────────────────

  applyFilters(): void {
    this.generateCalendarGrid();
    this.buildWeekDays();
    for (const pool of [this.calendarDays, this.weekDays]) {
      pool.forEach(day => {
        day.events = day.events.filter(e => {
          const matchesProject  = !this.selectedProject  || e.projectName === this.selectedProject;
          const matchesPriority = !this.selectedPriority || e.priority    === this.selectedPriority;
          const matchesType     = !this.selectedType     || e.type        === this.selectedType;
          return matchesProject && matchesPriority && matchesType;
        });
      });
    }
    if (this.selectedDay) {
      const pool = this.viewMode === 'week' ? this.weekDays : this.calendarDays;
      const match = pool.find(d => d.date.toDateString() === this.selectedDay?.date.toDateString());
      if (match) this.selectedDay = match;
      else if (this.viewMode === 'day') {
        this.selectedDay = this.createDaySchedule(this.currentDate, true);
      }
    }
  }

  onFilterChange(): void { this.applyFilters(); }

  resetFilters(): void {
    this.selectedProject = '';
    this.selectedPriority = '';
    this.selectedType = '';
    this.applyFilters();
  }

  selectDay(day: DaySchedule): void {
    this.selectedDay = day;
    if (this.viewMode === 'day') this.currentDate = new Date(day.date);
    this.cdr.detectChanges();
  }

  // ── Day/hour view helpers ────────────────────────────────────────────────────

  getEventsForHour(day: DaySchedule, hour: number): CalendarEvent[] {
    return day.events.filter(e => {
      const m = e.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return hour === 8;
      let h = parseInt(m[1]);
      const isPM = m[3].toUpperCase() === 'PM';
      if (isPM && h < 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return h === hour;
    });
  }

  formatHour(hour: number): string {
    if (hour === 0)  return '12 AM';
    if (hour < 12)  return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  // ── Drag and Drop ────────────────────────────────────────────────────────────

  onDragStart(event: DragEvent, calEvent: CalendarEvent, sourceDay: DaySchedule): void {
    this.draggedEvent = calEvent;
    this.dragSourceDay = sourceDay;
    event.dataTransfer?.setData('text/plain', String(calEvent.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, targetDay: DaySchedule): void {
    event.preventDefault();
    this.dragOverDay = targetDay;
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node;
    if (!target.contains(related)) this.dragOverDay = null;
  }

  onDrop(event: DragEvent, targetDay: DaySchedule): void {
    event.preventDefault();
    if (!this.draggedEvent || !this.dragSourceDay) { this.onDragEnd(); return; }

    const srcStr = this.dragSourceDay.date.toISOString().split('T')[0];
    const tgtStr = targetDay.date.toISOString().split('T')[0];
    if (srcStr === tgtStr) { this.onDragEnd(); return; }

    // Update event date in notes
    const movedEvent = { ...this.draggedEvent };
    movedEvent.notes = movedEvent.notes.replace(/\|DATE:[0-9-]+/, `|DATE:${tgtStr}`);

    // Update master eventsList
    const idx = this.eventsList.findIndex(e => e.id === movedEvent.id);
    if (idx !== -1) this.eventsList[idx] = movedEvent;

    // Sync across both grid pools
    for (const pool of [this.calendarDays, this.weekDays]) {
      const src = pool.find(d => d.date.toISOString().split('T')[0] === srcStr);
      const tgt = pool.find(d => d.date.toISOString().split('T')[0] === tgtStr);
      if (src) src.events = src.events.filter(e => e.id !== movedEvent.id);
      if (tgt && !tgt.events.some(e => e.id === movedEvent.id)) {
        tgt.events = [...tgt.events, movedEvent];
      }
    }

    // Refresh selectedDay reference if it was src or tgt
    const selStr = this.selectedDay?.date.toISOString().split('T')[0];
    const pool = this.viewMode === 'week' ? this.weekDays : this.calendarDays;
    if (selStr === srcStr || selStr === tgtStr) {
      this.selectedDay = pool.find(d => d.date.toISOString().split('T')[0] === selStr)
        || this.selectedDay;
    }

    this.triggerToast(
      `"${movedEvent.title}" moved to ${targetDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      'success'
    );
    this.onDragEnd();
  }

  onDragEnd(): void {
    this.draggedEvent = null;
    this.dragSourceDay = null;
    this.dragOverDay = null;
    this.cdr.detectChanges();
  }

  // ── Add Event ─────────────────────────────────────────────────────────────────

  openAddModal(): void {
    this.newEvent = {
      title: '',
      projectName: this.projectsList[0] || 'Website Redesign Q3',
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
    const dStr = this.selectedDay.date.toISOString().split('T')[0];
    const m = this.newEvent.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hours = 9, mins = 0;
    if (m) {
      hours = parseInt(m[1]); mins = parseInt(m[2]);
      if (m[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (m[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    const startTime = new Date(this.selectedDay.date);
    startTime.setHours(hours, mins, 0, 0);

    const apiEvent: ApiCalendarEvent = {
      title: this.newEvent.title,
      description: this.newEvent.notes,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + 3600000).toISOString(),
      isAllDay: false,
      userId: this.managerId
    };

    this.calendarService.createEvent(apiEvent).subscribe({
      next: (created) => this.finalizeNewEvent(created.id || Date.now(), created.title, created.description, dStr),
      error: () => this.finalizeNewEvent(Date.now(), this.newEvent.title, this.newEvent.notes, dStr)
    });
  }

  private finalizeNewEvent(id: number, title: string, desc: string | undefined, dStr: string): void {
    const newEv: CalendarEvent = {
      id,
      title,
      projectName: this.newEvent.projectName,
      time: this.newEvent.time,
      type: this.newEvent.type,
      priority: this.newEvent.priority,
      notes: `${desc || ''}|DATE:${dStr}`
    };
    this.eventsList.push(newEv);
    this.selectedDay?.events.push(newEv);

    // Also add to the matching weekDays slot if visible
    const wDay = this.weekDays.find(d => d.date.toISOString().split('T')[0] === dStr);
    if (wDay && !wDay.events.some(e => e.id === newEv.id)) wDay.events.push(newEv);

    this.savingEvent = false;
    this.closeAddModal();
    this.triggerToast(`"${newEv.title}" scheduled!`, 'success');
    this.cdr.detectChanges();
  }

  private triggerToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; this.cdr.detectChanges(); }, 3500);
  }

  private seedMockData(): void { this.buildEvents(); }

  buildEvents(): void {
    this.eventsList = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const d = (day: number) => new Date(year, month, day).toISOString().split('T')[0];

    this.eventsList = [
      { id: 1, title: 'Design Review Session',          projectName: 'Website Redesign Q3',    time: '10:00 AM', type: 'MEETING',   priority: 'MEDIUM',   notes: `Review high-fidelity mockups with Sarah Jenkins.|DATE:${d(5)}`     },
      { id: 2, title: 'VPC Security Groups Deployment', projectName: 'Backend API Migration',   time: '05:00 PM', type: 'DEADLINE',  priority: 'CRITICAL', notes: `Final backend security group sign-off.|DATE:${d(12)}`             },
      { id: 3, title: 'Daily Standup Sync',             projectName: 'Website Redesign Q3',    time: '09:00 AM', type: 'MEETING',   priority: 'LOW',      notes: `Tasks and roadblocks standup.|DATE:${d(14)}`                      },
      { id: 4, title: 'Mobile App Beta Launch',         projectName: 'Mobile App V2.0',        time: '02:00 PM', type: 'MILESTONE', priority: 'HIGH',     notes: `Launch beta client to stakeholders.|DATE:${d(14)}`               },
      { id: 5, title: 'SMTP Server Integration Review', projectName: 'Backend API Migration',   time: '12:30 PM', type: 'MEETING',   priority: 'MEDIUM',   notes: `SMTP handshakes code review.|DATE:${d(18)}`                       },
      { id: 6, title: 'Marketing Plan Sign-off',        projectName: 'Marketing Campaign Q4',  time: '10:00 AM', type: 'MILESTONE', priority: 'HIGH',     notes: `Sign-off final deliverables for Q4 campaign.|DATE:${d(22)}`      },
      { id: 7, title: 'Client Portal Release',          projectName: 'Client Portal Overhaul', time: '11:00 AM', type: 'DEADLINE',  priority: 'CRITICAL', notes: `Deploy stable version to production servers.|DATE:${d(28)}`      }
    ];
  }
}
