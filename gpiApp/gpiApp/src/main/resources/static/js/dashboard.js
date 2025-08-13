// Enhanced Dashboard Data Management System with Charts and Modals
class EnhancedDashboardManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.apiBaseUrl = '/api';
        this.charts = {};
        this.modals = {};
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
        this.loadPageData();
        this.initializeCharts();
    }

    // Load current user information
    async loadCurrentUser() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/current-user`, {
                credentials: 'include'
            });
            if (response.ok) {
                this.currentUser = await response.json();
                this.currentRole = this.currentUser.role;
                this.updateUserInterface();
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    // Update UI based on user role
    updateUserInterface() {
        if (this.currentUser) {
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name || this.currentUser.username;
            }

            const userAvatar = document.querySelector('.user-avatar');
            if (userAvatar) {
                userAvatar.src = this.currentUser.avatar || '/images/default-avatar.png';
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        this.setupNavigationListeners();
        this.setupModalEventListeners();
        this.setupFormEventListeners();
        this.setupChartEventListeners();
    }

    // Setup navigation event listeners
    setupNavigationListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if (href && !item.id.includes('logout')) {
                    this.navigateToPage(href);
                }
            });
        });
    }

    // Setup modal event listeners
    setupModalEventListeners() {
        // Close modal buttons
        document.querySelectorAll('.modal-close, .btn-close, .close-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = button.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.getAttribute('data-id');
                const itemType = button.getAttribute('data-type');
                this.openEditModal(itemType, itemId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = button.getAttribute('data-id');
                const itemType = button.getAttribute('data-type');
                this.openDeleteModal(itemType, itemId);
            });
        });
    }

    // Setup form event listeners
    setupFormEventListeners() {
        const forms = [
            'create-task-form',
            'edit-task-form',
            'create-project-form',
            'edit-project-form',
            'create-user-form',
            'edit-user-form'
        ];

        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmission(formId);
                });
            }
        });
    }

    // Setup chart event listeners
    setupChartEventListeners() {
        // Chart period selectors
        document.querySelectorAll('.chart-period-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                const chartId = e.target.getAttribute('data-chart');
                const period = e.target.value;
                this.updateChartPeriod(chartId, period);
            });
        });
    }

    // Load page-specific data
    async loadPageData() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'tasks':
                await this.loadTasksData();
                break;
            case 'projects':
                await this.loadProjectsData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'reports':
                await this.loadReportsData();
                break;
            case 'notifications':
                await this.loadNotificationsData();
                break;
            case 'calendar':
                await this.loadCalendarData();
                break;
            case 'time-tracking':
                await this.loadTimeTrackingData();
                break;
            case 'collaboration':
                await this.loadCollaborationData();
                break;
            case 'weekly-planning':
                await this.loadWeeklyPlanningData();
                break;
            default:
                console.log('No specific data loading for page:', currentPage);
        }
    }

    // Get current page name
    getCurrentPage() {
        const path = window.location.pathname;
        const segments = path.split('/');
        return segments[segments.length - 1] || 'dashboard';
    }

    // Initialize charts
    initializeCharts() {
        // Initialize Chart.js if available
        if (typeof Chart !== 'undefined') {
            this.initializeDashboardCharts();
        } else {
            console.warn('Chart.js not loaded. Charts will not be displayed.');
        }
    }

    // Initialize dashboard charts
    initializeDashboardCharts() {
        // Task Status Distribution Chart
        const taskStatusCtx = document.getElementById('task-status-chart');
        if (taskStatusCtx) {
            this.charts.taskStatus = new Chart(taskStatusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Project Progress Chart
        const projectProgressCtx = document.getElementById('project-progress-chart');
        if (projectProgressCtx) {
            this.charts.projectProgress = new Chart(projectProgressCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Progress %',
                        data: [],
                        backgroundColor: '#007bff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }

        // User Activity Chart
        const userActivityCtx = document.getElementById('user-activity-chart');
        if (userActivityCtx) {
            this.charts.userActivity = new Chart(userActivityCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Tasks Completed',
                        data: [],
                        borderColor: '#28a745',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    // Load dashboard data based on user role
    async loadDashboardData() {
        try {
            let endpoint = '';
            switch (this.currentRole) {
                case 'ADMIN':
                case 'SUPER_ADMIN':
                    endpoint = `${this.apiBaseUrl}/admin/dashboard-stats`;
                    break;
                case 'MANAGER':
                    endpoint = `${this.apiBaseUrl}/manager/dashboard-stats`;
                    break;
                case 'USER':
                case 'EMPLOYEE':
                    endpoint = `${this.apiBaseUrl}/user/dashboard-stats`;
                    break;
            }

            if (endpoint) {
                const response = await fetch(endpoint, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    this.updateDashboardStats(data);
                    this.updateDashboardCharts(data);
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Update dashboard statistics
    updateDashboardStats(data) {
        // Update stat cards with data attributes
        const statCards = {
            'total-tasks': data.totalTasks,
            'active-tasks': data.activeTasks,
            'completed-tasks': data.completedTasks,
            'overdue-tasks': data.overdueTasks,
            'total-users': data.totalUsers,
            'total-projects': data.totalProjects
        };

        Object.keys(statCards).forEach(statKey => {
            if (statCards[statKey] !== undefined) {
                const statElement = document.querySelector(`[data-stat="${statKey}"] .stat-info h3`);
                if (statElement) {
                    statElement.textContent = statCards[statKey];
                }
            }
        });
    }

    // Update dashboard charts
    updateDashboardCharts(chartData) {
        if (!chartData) return;

        // Update Task Status Chart
        if (this.charts.taskStatus && chartData.taskStatusDistribution) {
            const taskData = chartData.taskStatusDistribution;
            this.charts.taskStatus.data.datasets[0].data = [
                taskData.COMPLETED || 0,
                taskData.IN_PROGRESS || 0,
                taskData.ASSIGNED || 0,
                taskData.DRAFT || 0
            ];
            this.charts.taskStatus.update();
        }

        // Update Project Progress Chart
        if (this.charts.projectProgress && chartData.projectProgress) {
            const projectData = chartData.projectProgress;
            this.charts.projectProgress.data.labels = projectData.map(p => p.name);
            this.charts.projectProgress.data.datasets[0].data = projectData.map(p => p.progress);
            this.charts.projectProgress.update();
        }

        // Update User Activity Chart
        if (this.charts.userActivity && chartData.userActivity) {
            const activityData = chartData.userActivity;
            this.charts.userActivity.data.labels = activityData.map(a => a.date);
            this.charts.userActivity.data.datasets[0].data = activityData.map(a => a.tasksCompleted);
            this.charts.userActivity.update();
        }
    }

    // Load tasks data
    async loadTasksData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks`, {
                credentials: 'include'
            });
            if (response.ok) {
                const tasks = await response.json();
                this.updateTasksList(tasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    // Update tasks list
    updateTasksList(tasks) {
        const tasksContainer = document.querySelector('.tasks-list');
        if (!tasksContainer) return;

        tasksContainer.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
    }

    // Create task element
    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.setAttribute('data-task-id', task.id);
        
        taskDiv.innerHTML = `
            <div class="task-header">
                <h4>${task.title}</h4>
                <span class="task-priority ${task.priority?.toLowerCase()}">${task.priority}</span>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-meta">
                <span class="task-assignee">${task.assignee}</span>
                <span class="task-deadline">${new Date(task.deadline).toLocaleDateString()}</span>
                <span class="task-status ${task.status?.toLowerCase()}">${task.status}</span>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm btn-secondary btn-edit" data-id="${task.id}" data-type="task">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${task.id}" data-type="task">Delete</button>
            </div>
        `;

        return taskDiv;
    }

    // Load projects data
    async loadProjectsData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/projects`, {
                credentials: 'include'
            });
            if (response.ok) {
                const projects = await response.json();
                this.updateProjectsList(projects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    // Update projects list
    updateProjectsList(projects) {
        const projectsContainer = document.querySelector('.projects-list');
        if (!projectsContainer) return;

        projectsContainer.innerHTML = '';
        projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            projectsContainer.appendChild(projectElement);
        });
    }

    // Create project element
    createProjectElement(project) {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.setAttribute('data-project-id', project.id);
        
        projectDiv.innerHTML = `
            <div class="project-header">
                <h4>${project.name}</h4>
                <span class="project-status ${project.status?.toLowerCase()}">${project.status}</span>
            </div>
            <p class="project-description">${project.description}</p>
            <div class="project-meta">
                <span class="project-manager">${project.manager}</span>
                <span class="project-deadline">${new Date(project.deadline).toLocaleDateString()}</span>
                <span class="project-progress">${project.progress}%</span>
            </div>
            <div class="project-actions">
                <button class="btn btn-sm btn-secondary btn-edit" data-id="${project.id}" data-type="project">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${project.id}" data-type="project">Delete</button>
            </div>
        `;

        return projectDiv;
    }

    // Load users data (admin only)
    async loadUsersData() {
        if (this.currentRole !== 'ADMIN') return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/users`, {
                credentials: 'include'
            });
            if (response.ok) {
                const users = await response.json();
                this.updateUsersList(users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Update users list
    updateUsersList(users) {
        const usersContainer = document.querySelector('.users-list');
        if (!usersContainer) return;

        usersContainer.innerHTML = '';
        users.forEach(user => {
            const userElement = this.createUserElement(user);
            usersContainer.appendChild(userElement);
        });
    }

    // Create user element
    createUserElement(user) {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.setAttribute('data-user-id', user.id);
        
        userDiv.innerHTML = `
            <div class="user-header">
                <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.name}" class="user-avatar">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <span class="user-role">${user.role}</span>
                </div>
            </div>
            <div class="user-meta">
                <span class="user-email">${user.email}</span>
                <span class="user-status ${user.status?.toLowerCase()}">${user.status}</span>
            </div>
            <div class="user-actions">
                <button class="btn btn-sm btn-secondary btn-edit" data-id="${user.id}" data-type="user">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${user.id}" data-type="user">Delete</button>
            </div>
        `;

        return userDiv;
    }

    // Load weekly planning data
    async loadWeeklyPlanningData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/weekly-plannings`, {
                credentials: 'include'
            });
            if (response.ok) {
                const weeklyPlans = await response.json();
                this.updateWeeklyPlanningList(weeklyPlans);
            }
        } catch (error) {
            console.error('Error loading weekly planning data:', error);
        }
    }

    // Update weekly planning list
    updateWeeklyPlanningList(weeklyPlans) {
        const planningContainer = document.querySelector('.weekly-planning-list');
        if (!planningContainer) return;

        planningContainer.innerHTML = '';
        weeklyPlans.forEach(plan => {
            const planElement = this.createWeeklyPlanningElement(plan);
            planningContainer.appendChild(planElement);
        });
    }

    // Create weekly planning element
    createWeeklyPlanningElement(plan) {
        const planDiv = document.createElement('div');
        planDiv.className = 'weekly-plan-item';
        planDiv.setAttribute('data-plan-id', plan.id);
        
        planDiv.innerHTML = `
            <div class="plan-header">
                <h4>Week ${plan.weekNumber}, ${plan.year}</h4>
                <span class="plan-status ${plan.status?.toLowerCase()}">${plan.status}</span>
            </div>
            <div class="plan-content">
                <p><strong>Goals:</strong> ${plan.goals}</p>
                <p><strong>Priorities:</strong> ${plan.priorities}</p>
            </div>
            <div class="plan-meta">
                <span class="plan-user">${plan.userName}</span>
                <span class="plan-date">${new Date(plan.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="plan-actions">
                <button class="btn btn-sm btn-secondary btn-edit" data-id="${plan.id}" data-type="weekly-planning">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${plan.id}" data-type="weekly-planning">Delete</button>
            </div>
        `;

        return planDiv;
    }

    // Load other data types
    async loadReportsData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/reports`, {
                credentials: 'include'
            });
            if (response.ok) {
                const reports = await response.json();
                this.updateReportsList(reports);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }

    async loadNotificationsData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications`, {
                credentials: 'include'
            });
            if (response.ok) {
                const notifications = await response.json();
                this.updateNotificationsList(notifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async loadCalendarData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/calendar/events`, {
                credentials: 'include'
            });
            if (response.ok) {
                const events = await response.json();
                this.updateCalendarEvents(events);
            }
        } catch (error) {
            console.error('Error loading calendar events:', error);
        }
    }

    async loadTimeTrackingData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/time-tracking`, {
                credentials: 'include'
            });
            if (response.ok) {
                const timeData = await response.json();
                this.updateTimeTrackingData(timeData);
            }
        } catch (error) {
            console.error('Error loading time tracking data:', error);
        }
    }

    async loadCollaborationData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/collaboration`, {
                credentials: 'include'
            });
            if (response.ok) {
                const collaborationData = await response.json();
                this.updateCollaborationData(collaborationData);
            }
        } catch (error) {
            console.error('Error loading collaboration data:', error);
        }
    }

    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.modals[modalId] = modal;
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            delete this.modals[modalId];
        }
    }

    // Open edit modal
    openEditModal(type, id) {
        const modal = document.getElementById(`edit-${type}-modal`);
        if (modal) {
            this.loadItemForEdit(type, id);
            modal.classList.add('active');
        }
    }

    // Open delete modal
    openDeleteModal(type, id) {
        const modal = document.getElementById('delete-confirmation-modal');
        if (modal) {
            const confirmBtn = modal.querySelector('#confirm-delete');
            confirmBtn.onclick = () => this.deleteItem(type, id);
            modal.classList.add('active');
        }
    }

    // Load item for editing
    async loadItemForEdit(type, id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${type}/${id}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const item = await response.json();
                this.populateEditForm(type, item);
            }
        } catch (error) {
            console.error(`Error loading ${type} for edit:`, error);
        }
    }

    // Populate edit form
    populateEditForm(type, item) {
        const form = document.getElementById(`edit-${type}-form`);
        if (!form) return;

        form.reset();
        Object.keys(item).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = item[key];
            }
        });
        form.setAttribute('data-item-id', item.id);
    }

    // Handle form submission
    async handleFormSubmission(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            let response;
            if (formId.includes('edit')) {
                const itemId = form.getAttribute('data-item-id');
                const type = formId.replace('edit-', '').replace('-form', '');
                response = await fetch(`${this.apiBaseUrl}/${type}/${itemId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });
            } else {
                const type = formId.replace('create-', '').replace('-form', '');
                response = await fetch(`${this.apiBaseUrl}/${type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    credentials: 'include'
                });
            }

            if (response.ok) {
                alert(formId.includes('edit') ? 'Item updated successfully!' : 'Item created successfully!');
                this.closeModal(form.closest('.modal').id);
                this.loadPageData(); // Reload data
            } else {
                alert('Error processing request');
            }
        } catch (error) {
            console.error('Error processing form:', error);
            alert('Error processing request');
        }
    }

    // Delete item
    async deleteItem(type, id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${type}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
                this.closeModal('delete-confirmation-modal');
                this.loadPageData(); // Reload data
            } else {
                alert(`Error deleting ${type}`);
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            alert(`Error deleting ${type}`);
        }
    }

    // Update chart period
    updateChartPeriod(chartId, period) {
        // This would fetch new data based on the selected period
        console.log(`Updating chart ${chartId} for period: ${period}`);
        // Implementation would depend on your backend API
    }

    // Navigate to page
    navigateToPage(href) {
        window.location.href = href;
    }

    // Update other data displays
    updateReportsList(reports) {
        const reportsContainer = document.querySelector('.reports-list');
        if (!reportsContainer) return;

        reportsContainer.innerHTML = '';
        if (reports.systemReports) {
            reports.systemReports.forEach(report => {
                const reportElement = this.createReportElement(report);
                reportsContainer.appendChild(reportElement);
            });
        }
    }

    updateNotificationsList(notifications) {
        const notificationsContainer = document.querySelector('.notifications-list');
        if (!notificationsContainer) return;

        notificationsContainer.innerHTML = '';
        notifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            notificationsContainer.appendChild(notificationElement);
        });
    }

    updateCalendarEvents(events) {
        const calendarContainer = document.querySelector('.calendar-events');
        if (!calendarContainer) return;

        calendarContainer.innerHTML = '';
        events.forEach(event => {
            const eventElement = this.createCalendarEventElement(event);
            calendarContainer.appendChild(eventElement);
        });
    }

    updateTimeTrackingData(timeData) {
        const timeContainer = document.querySelector('.time-tracking-data');
        if (!timeContainer) return;

        timeContainer.innerHTML = '';
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'time-summary';
        summaryDiv.innerHTML = `
            <h4>Time Summary</h4>
            <div class="time-stats">
                <div class="time-stat">
                    <span class="time-label">Today:</span>
                    <span class="time-value">${timeData.todayHours || 0}h</span>
                </div>
                <div class="time-stat">
                    <span class="time-label">This Week:</span>
                    <span class="time-value">${timeData.weekHours || 0}h</span>
                </div>
                <div class="time-stat">
                    <span class="time-label">This Month:</span>
                    <span class="time-value">${timeData.monthHours || 0}h</span>
                </div>
            </div>
        `;
        timeContainer.appendChild(summaryDiv);

        if (timeData.entries && timeData.entries.length > 0) {
            const entriesDiv = document.createElement('div');
            entriesDiv.className = 'time-entries';
            entriesDiv.innerHTML = '<h4>Recent Time Entries</h4>';
            
            timeData.entries.forEach(entry => {
                const entryElement = this.createTimeEntryElement(entry);
                entriesDiv.appendChild(entryElement);
            });
            
            timeContainer.appendChild(entriesDiv);
        }
    }

    updateCollaborationData(collaborationData) {
        const collaborationContainer = document.querySelector('.collaboration-data');
        if (!collaborationContainer) return;

        collaborationContainer.innerHTML = '';
        
        if (collaborationData.teamMembers) {
            const teamDiv = document.createElement('div');
            teamDiv.className = 'team-members';
            teamDiv.innerHTML = '<h4>Team Members</h4>';
            
            collaborationData.teamMembers.forEach(member => {
                const memberElement = this.createTeamMemberElement(member);
                teamDiv.appendChild(memberElement);
            });
            
            collaborationContainer.appendChild(teamDiv);
        }

        if (collaborationData.messages) {
            const messagesDiv = document.createElement('div');
            messagesDiv.className = 'recent-messages';
            messagesDiv.innerHTML = '<h4>Recent Messages</h4>';
            
            collaborationData.messages.forEach(message => {
                const messageElement = this.createMessageElement(message);
                messagesDiv.appendChild(messageElement);
            });
            
            collaborationContainer.appendChild(messagesDiv);
        }
    }

    // Create other elements
    createReportElement(report) {
        const reportDiv = document.createElement('div');
        reportDiv.className = 'report-item';
        reportDiv.innerHTML = `
            <h4>${report.title}</h4>
            <p>${report.description}</p>
            <span class="report-date">${new Date(report.createdAt).toLocaleDateString()}</span>
        `;
        return reportDiv;
    }

    createNotificationElement(notification) {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        notificationDiv.innerHTML = `
            <div class="notification-content">
                <h5>${notification.title}</h5>
                <p>${notification.message}</p>
                <span class="notification-time">${new Date(notification.createdAt).toLocaleString()}</span>
            </div>
        `;
        return notificationDiv;
    }

    createCalendarEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event';
        eventDiv.innerHTML = `
            <h5>${event.title}</h5>
            <p>${event.description}</p>
            <span class="event-time">${new Date(event.startTime).toLocaleString()}</span>
        `;
        return eventDiv;
    }

    createTimeEntryElement(entry) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'time-entry';
        entryDiv.innerHTML = `
            <h5>${entry.taskName}</h5>
            <p>${entry.description}</p>
            <span class="entry-duration">${entry.duration}h</span>
        `;
        return entryDiv;
    }

    createTeamMemberElement(member) {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';
        memberDiv.innerHTML = `
            <h5>${member.name}</h5>
            <span class="member-role">${member.role}</span>
            <span class="member-status ${member.status}">${member.status}</span>
        `;
        return memberDiv;
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-item';
        messageDiv.innerHTML = `
            <span class="message-author">${message.author}</span>
            <p>${message.content}</p>
            <span class="message-time">${new Date(message.timestamp).toLocaleString()}</span>
        `;
        return messageDiv;
    }
}

// Initialize the enhanced dashboard manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedDashboardManager();
});

// Global modal functions for HTML onclick attributes
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}; 