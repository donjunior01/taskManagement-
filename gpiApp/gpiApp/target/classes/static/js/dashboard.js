// Dashboard JavaScript - Task Management System

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.calendar = null;
        this.currentView = 'dashboard';
        this.tasks = [];
        this.projects = [];
        this.teams = [];
        
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        this.setupEventListeners();
        this.initializeCalendar();
        this.loadDashboardData();
        this.setupNavigation();
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/users/current');
            if (response.ok) {
                this.currentUser = await response.json();
                document.getElementById('userName').textContent = 
                    `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView(link.dataset.view);
            });
        });

        // Buttons
        document.getElementById('addTaskBtn')?.addEventListener('click', () => this.showTaskModal());
        document.getElementById('createTaskBtn')?.addEventListener('click', () => this.showTaskModal());
        document.getElementById('saveTaskBtn')?.addEventListener('click', () => this.saveTask());
    }

    setupNavigation() {
        this.showView('dashboard');
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.style.display = 'none';
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.style.display = 'block';
            this.currentView = viewName;
        }

        // Add active class to nav link
        const activeLink = document.querySelector(`[data-view="${viewName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load view-specific data
        switch (viewName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'calendar':
                this.loadCalendarData();
                break;
            case 'tasks':
                this.loadTasksData();
                break;
        }
    }

    // Calendar Implementation
    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            droppable: true,
            selectable: true,
            events: this.loadCalendarEvents.bind(this),
            eventDrop: this.handleEventDrop.bind(this),
            select: this.handleDateSelect.bind(this),
            eventClick: this.handleEventClick.bind(this),
            height: 'auto'
        });

        this.calendar.render();
    }

    async loadCalendarEvents(info, successCallback, failureCallback) {
        try {
            const response = await fetch(`/api/tasks/calendar?start=${info.startStr}&end=${info.endStr}`);
            
            if (response.ok) {
                const events = await response.json();
                const calendarEvents = events.map(task => ({
                    id: task.taskId,
                    title: task.title,
                    start: task.startDate,
                    end: task.dueDate,
                    backgroundColor: this.getTaskColor(task.status),
                    borderColor: this.getTaskColor(task.status),
                    textColor: '#ffffff'
                }));
                successCallback(calendarEvents);
            }
        } catch (error) {
            console.error('Error loading calendar events:', error);
            failureCallback(error);
        }
    }

    getTaskColor(status) {
        switch (status) {
            case 'COMPLETED': return '#28a745';
            case 'IN_PROGRESS': return '#ffc107';
            case 'OVERDUE': return '#dc3545';
            default: return '#007bff';
        }
    }

    handleEventDrop(info) {
        const taskId = info.event.id;
        const newStartDate = info.event.startStr;
        const newEndDate = info.event.endStr;
        this.updateTaskDates(taskId, newStartDate, newEndDate);
    }

    handleDateSelect(info) {
        this.showTaskModal({
            startDate: info.startStr,
            endDate: info.endStr
        });
    }

    handleEventClick(info) {
        this.showTaskDetails(info.event.id);
    }

    // Dashboard Data Loading
    async loadDashboardData() {
        await Promise.all([
            this.loadStatistics(),
            this.loadPerformanceChart(),
            this.loadRecentTasks()
        ]);
    }

    async loadStatistics() {
        try {
            const response = await fetch('/api/dashboard/statistics');
            
            if (response.ok) {
                const stats = await response.json();
                document.getElementById('totalTasks').textContent = stats.totalTasks || 0;
                document.getElementById('completedTasks').textContent = stats.completedTasks || 0;
                document.getElementById('inProgressTasks').textContent = stats.inProgressTasks || 0;
                document.getElementById('overdueTasks').textContent = stats.overdueTasks || 0;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    loadPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: [12, 19, 15, 25, 22, 30],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async loadRecentTasks() {
        try {
            const response = await fetch('/api/tasks/recent');
            
            if (response.ok) {
                const tasks = await response.json();
                this.renderRecentTasks(tasks);
            }
        } catch (error) {
            console.error('Error loading recent tasks:', error);
        }
    }

    renderRecentTasks(tasks) {
        const container = document.getElementById('recentTasksList');
        if (!container) return;

        container.innerHTML = tasks.map(task => `
            <div class="task-item" onclick="dashboard.showTaskDetails('${task.taskId}')">
                <div class="task-header">
                    <h6 class="task-title">${task.title}</h6>
                    <span class="badge bg-${this.getStatusColor(task.status)}">${task.status}</span>
                </div>
                <div class="task-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}</span>
                    <span><i class="fas fa-user"></i> ${task.createdByName}</span>
                </div>
                <div class="task-progress">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${task.progressPercentage}%"></div>
                    </div>
                    <small class="text-muted">${task.progressPercentage}% complete</small>
                </div>
            </div>
        `).join('');
    }

    getStatusColor(status) {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'IN_PROGRESS': return 'warning';
            case 'OVERDUE': return 'danger';
            default: return 'secondary';
        }
    }

    // Task Management
    async loadTasksData() {
        try {
            const response = await fetch('/api/tasks');
            
            if (response.ok) {
                this.tasks = await response.json();
                this.renderTasksTable();
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    renderTasksTable() {
        const container = document.getElementById('tasksTable');
        if (!container) return;

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Project</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>Progress</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.tasks.map(task => `
                            <tr>
                                <td>
                                    <strong>${task.title}</strong>
                                    <br><small class="text-muted">${task.description?.substring(0, 50)}...</small>
                                </td>
                                <td>${task.projectName || 'N/A'}</td>
                                <td><span class="badge bg-${this.getStatusColor(task.status)}">${task.status}</span></td>
                                <td><span class="badge bg-secondary">${task.priority}</span></td>
                                <td>${new Date(task.dueDate).toLocaleDateString()}</td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar" style="width: ${task.progressPercentage}%">
                                            ${task.progressPercentage}%
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="dashboard.editTask('${task.taskId}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info" onclick="dashboard.showTaskDetails('${task.taskId}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Modal Management
    showTaskModal(taskData = null) {
        const modal = new bootstrap.Modal(document.getElementById('taskModal'));
        const title = document.getElementById('taskModalTitle');
        const form = document.getElementById('taskForm');

        if (taskData) {
            title.textContent = 'Edit Task';
            this.populateTaskForm(taskData);
        } else {
            title.textContent = 'Create Task';
            form.reset();
            
            if (taskData?.startDate) {
                document.getElementById('taskStartDate').value = taskData.startDate;
            }
            if (taskData?.endDate) {
                document.getElementById('taskDueDate').value = taskData.endDate;
            }
        }

        modal.show();
    }

    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStartDate').value = task.startDate;
        document.getElementById('taskDueDate').value = task.dueDate;
    }

    async saveTask() {
        const formData = this.getTaskFormData();
        
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('taskModal')).hide();
                this.loadTasksData();
                if (this.currentView === 'calendar') {
                    this.calendar.refetchEvents();
                }
                this.showToast('Task saved successfully!', 'success');
            } else {
                throw new Error('Failed to save task');
            }
        } catch (error) {
            console.error('Error saving task:', error);
            this.showToast('Error saving task', 'error');
        }
    }

    getTaskFormData() {
        return {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            priority: document.getElementById('taskPriority').value,
            startDate: document.getElementById('taskStartDate').value,
            dueDate: document.getElementById('taskDueDate').value
        };
    }

    // Utility Methods
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        document.body.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toast);
        });
    }

    async updateTaskDates(taskId, startDate, endDate) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/dates`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ startDate, endDate })
            });

            if (response.ok) {
                this.showToast('Task dates updated successfully!', 'success');
            } else {
                throw new Error('Failed to update task dates');
            }
        } catch (error) {
            console.error('Error updating task dates:', error);
            this.showToast('Error updating task dates', 'error');
            this.calendar.refetchEvents();
        }
    }

    showTaskDetails(taskId) {
        console.log('Show task details:', taskId);
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.taskId === taskId);
        if (task) {
            this.showTaskModal(task);
        }
    }

    loadCalendarData() {
        if (this.calendar) {
            this.calendar.refetchEvents();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
}); 