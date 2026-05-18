import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../../core/services/task.service';
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
  selector: 'app-user-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss']
})
export class UserCalendarComponent implements OnInit {
  developerId: number = 0;
  myTasks: Task[] = [];
  eventsList: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];
  loading: boolean = true;

  // Calendar Grid State
  currentDate: Date = new Date();
  calendarDays: DaySchedule[] = [];
  selectedDay: DaySchedule | null = null;
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

  // Notification Toast State
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private calendarService: CalendarService,
    private cdr: ChangeDetectorRef
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
      next: (events: ApiCalendarEvent[]) => {
        if (events && events.length > 0) {
          this.eventsList = events.map(e => {
            const startDate = new Date(e.startTime);
            return {
              id: e.id || Date.now(),
              title: e.title,
              projectName: this.projectsList[0] || 'General',
              time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'MEETING',
              priority: 'MEDIUM',
              notes: `${e.description || ''}|DATE:${startDate.toISOString().split('T')[0]}`,
              originalEvent: e
            };
          });
          this.extractProjects();
          this.generateCalendarGrid();
          this.loading = false;
          this.cdr.detectChanges();
        } else {
          this.seedMockData();
          this.extractProjects();
          this.generateCalendarGrid();
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn("Failed to load events from API, using mock", err);
        this.seedMockData();
        this.extractProjects();
        this.generateCalendarGrid();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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

  buildEvents(): void {
    this.eventsList = [];
    
    // Seed exact events from the calendar screenshot
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const d5 = new Date(year, month, 5).toISOString().split('T')[0];
    const d12 = new Date(year, month, 12).toISOString().split('T')[0];
    const d14 = new Date(year, month, 14).toISOString().split('T')[0];
    const d18 = new Date(year, month, 18).toISOString().split('T')[0];
    const d22 = new Date(year, month, 22).toISOString().split('T')[0];
    const d28 = new Date(year, month, 28).toISOString().split('T')[0];

    this.eventsList.push(
      {
        id: 1,
        title: 'Design Review',
        projectName: 'Glassmorphic Design UI',
        time: '10:00 AM',
        type: 'MEETING',
        priority: 'MEDIUM',
        notes: 'Review the high fidelity mockups and feedback.'
      },
      {
        id: 2,
        title: 'Project Deadline',
        projectName: 'Cloud Migration Core',
        time: '05:00 PM',
        type: 'DEADLINE',
        priority: 'CRITICAL',
        notes: 'Final workspace milestone delivery and sign-off.'
      },
      {
        id: 3,
        title: 'Daily Standup',
        projectName: 'General Admin',
        time: '09:00 AM',
        type: 'MEETING',
        priority: 'LOW',
        notes: 'Daily sync with the product team.'
      },
      {
        id: 4,
        title: 'Client Call',
        projectName: 'ApexTask Integration',
        time: '02:00 PM',
        type: 'MEETING',
        priority: 'HIGH',
        notes: 'Align integration targets with corporate stakeholders.'
      },
      {
        id: 5,
        title: 'Team Lunch',
        projectName: 'Social Sync',
        time: '12:30 PM',
        type: 'MILESTONE',
        priority: 'LOW',
        notes: 'Offsite bonding lunch with the core developer squad.'
      },
      {
        id: 6,
        title: 'Spring Kickoff',
        projectName: 'ApexTask NextGen',
        time: '10:00 AM',
        type: 'MILESTONE',
        priority: 'HIGH',
        notes: 'Review architecture layout specifications and stack standards.'
      },
      {
        id: 7,
        title: 'Release Deployment',
        projectName: 'Production Build',
        time: '11:59 PM',
        type: 'DEADLINE',
        priority: 'CRITICAL',
        notes: 'Deploy stable hotfixes and token interception strategies.'
      }
    );

    // Map deadline/meeting dates
    this.eventsList[0].notes += `|DATE:${d5}`;
    this.eventsList[1].notes += `|DATE:${d12}`;
    this.eventsList[2].notes += `|DATE:${d14}`;
    this.eventsList[3].notes += `|DATE:${d14}`;
    this.eventsList[4].notes += `|DATE:${d18}`;
    this.eventsList[5].notes += `|DATE:${d22}`;
    this.eventsList[6].notes += `|DATE:${d28}`;
  }

  generateCalendarGrid(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 Sunday, 1 Monday... matches SUN MON ...

    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    // Previous month days fill
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDaysCount - i);
      this.calendarDays.push(this.createDaySchedule(d, false));
    }

    // Current month days fill
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      this.calendarDays.push(this.createDaySchedule(d, true));
    }

    // Next month days fill
    const remainingCells = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      this.calendarDays.push(this.createDaySchedule(d, false));
    }

    // Default select today or cell 14
    const targetDay = this.calendarDays.find(d => d.dayOfMonth === 14 && d.isCurrentMonth) || this.calendarDays[0];
    this.selectedDay = targetDay;
  }

  private createDaySchedule(date: Date, isCurrentMonth: boolean): DaySchedule {
    const dateStr = date.toISOString().split('T')[0];

    // Filter matching events based on dates encoded in notes or standard date matching
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
      isToday: new Date().toISOString().split('T')[0] === dateStr,
      events: dayEvents
    };
  }

  applyFilters(): void {
    this.generateCalendarGrid();
    this.calendarDays.forEach(day => {
      day.events = day.events.filter(e => {
        const matchesProject = !this.selectedProject || e.projectName === this.selectedProject;
        const matchesPriority = !this.selectedPriority || e.priority === this.selectedPriority;
        const matchesType = !this.selectedType || e.type === this.selectedType;
        return matchesProject && matchesPriority && matchesType;
      });
    });

    if (this.selectedDay) {
      const match = this.calendarDays.find(d => d.date.toDateString() === this.selectedDay?.date.toDateString());
      if (match) this.selectedDay = match;
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedProject = '';
    this.selectedPriority = '';
    this.selectedType = '';
    this.applyFilters();
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendarGrid();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendarGrid();
  }

  selectDay(day: DaySchedule): void {
    this.selectedDay = day;
  }

  getMonthYearLabel(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

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

  closeAddModal(): void {
    this.showAddModal = false;
  }

  saveCustomEvent(): void {
    if (!this.newEvent.title.trim() || !this.selectedDay) return;

    this.savingEvent = true;

    const dStr = this.selectedDay!.date.toISOString().split('T')[0];
    
    // Parse time like "09:00 AM" to actual time in ISO
    const timeParts = this.newEvent.time.match(/(\d+):(\d+) (\w+)/);
    let hours = 9; let mins = 0;
    if (timeParts) {
      hours = parseInt(timeParts[1]);
      mins = parseInt(timeParts[2]);
      if (timeParts[3] === 'PM' && hours < 12) hours += 12;
      if (timeParts[3] === 'AM' && hours === 12) hours = 0;
    }
    const startTime = new Date(this.selectedDay!.date);
    startTime.setHours(hours, mins, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour

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
        // Fallback optimistic save
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
        this.triggerToast(`Optimistic Event "${newEv.title}" successfully scheduled!`, 'success');
        this.cdr.detectChanges();
      }
    });
  }

  private triggerToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  private getFutureDateStr(baseDateStr: string, daysForward: number): string {
    const d = new Date(baseDateStr);
    d.setDate(d.getDate() + daysForward);
    return d.toISOString().split('T')[0];
  }

  private seedMockData(): void {
    this.buildEvents();
  }
}
