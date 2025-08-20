/**
 * Comprehensive Page Manager for Task Management System
 * Handles data loading, charts, and modals for all pages across different user roles
 */
class PageManager {
    constructor() {
        this.currentPage = null;
        this.currentUser = null;
        this.charts = {};
        this.modals = {};
        this.dataCache = {};
        this.init();
    }

    init() {
        this.detectCurrentPage();
        this.loadCurrentUser();
        this.setupGlobalEventListeners();
        this.initializePage();
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/admin/')) {
            this.currentPage = 'admin';
        } else if (path.includes('/project-manager/')) {
            this.currentPage = 'project-manager';
        } else if (path.includes('/user/')) {
            this.currentPage = 'user';
        } else {
            this.currentPage = 'dashboard';
        }
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/auth/current-user');
            if (response.ok) {
                this.currentUser = await response.json();
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    setupGlobalEventListeners() {
        // Global modal functions
        window.openModal = (modalId) => this.openModal(modalId);
        window.closeModal = (modalId) => this.closeModal(modalId);
        
        // Global form submission
        document.addEventListener('submit', (e) => this.handleFormSubmission(e));
        
        // Global modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn') || e.target.classList.contains('modal-overlay')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeActiveModal();
            }
        });
    }

    initializePage() {
        const path = window.location.pathname;
        const pageName = this.getPageNameFromPath(path);
        
        switch (pageName) {
            case 'adminDashboard':
                this.initializeAdminDashboard();
                break;
            case 'userManagement':
                this.initializeUserManagement();
                break;
            case 'globalTasks':
                this.initializeGlobalTasks();
                break;
            case 'globalReports':
                this.initializeGlobalReports();
                break;
            case 'teamPerformance':
                this.initializeTeamPerformance();
                break;
            case 'pmDashboard':
                this.initializePMDashboard();
                break;
            case 'teamTask':
                this.initializeTeamTask();
                break;
            case 'reportsAndAnalytics':
                this.initializeReportsAndAnalytics();
                break;
            case 'userDashboard':
                this.initializeUserDashboard();
                break;
            case 'tasks':
                this.initializeUserTasks();
                break;
            case 'calendar':
                this.initializeCalendar();
                break;
            case 'timeTracking':
                this.initializeTimeTracking();
                break;
            case 'collaboration':
                this.initializeCollaboration();
                break;
            default:
                this.initializeGenericPage();
        }
    }

    getPageNameFromPath(path) {
        const segments = path.split('/').filter(seg => seg);
        return segments[segments.length - 1] || 'dashboard';
    }

    // Admin Pages
    async initializeAdminDashboard() {
        await this.loadAdminDashboardData();
        this.initializeAdminCharts();
        this.setupAdminModals();
    }

    async initializeProjectManagement() {
        await this.loadProjectManagementData();
        this.initializeProjectManagementCharts();
        this.setupProjectManagementModals();
    }

    async initializeUserManagement() {
        await this.loadUserManagementData();
        this.setupUserManagementModals();
    }

    async initializeGlobalTasks() {
        await this.loadGlobalTasksData();
        this.setupTaskModals();
    }

    async initializeGlobalReports() {
        await this.loadGlobalReportsData();
        this.initializeReportCharts();
    }

    async initializeTeamPerformance() {
        await this.loadTeamPerformanceData();
        this.initializeTeamPerformanceCharts();
    }

    // Project Manager Pages
    async initializePMDashboard() {
        await this.loadPMDashboardData();
        this.initializePMCharts();
        this.setupPMModals();
    }

    async initializeTeamTask() {
        await this.loadTeamTaskData();
        this.setupTaskModals();
    }

    async initializeReportsAndAnalytics() {
        await this.loadReportsAndAnalyticsData();
        this.initializeAnalyticsCharts();
    }

    // User Pages
    async initializeUserDashboard() {
        await this.loadUserDashboardData();
        this.initializeUserCharts();
        this.setupUserModals();
    }

    async initializeUserTasks() {
        await this.loadUserTasksData();
        this.setupTaskModals();
    }

    async initializeCalendar() {
        await this.loadCalendarData();
        this.initializeCalendarView();
    }

    async initializeTimeTracking() {
        await this.loadTimeTrackingData();
        this.initializeTimeTrackingCharts();
    }

    async initializeCollaboration() {
        await this.loadCollaborationData();
        this.setupCollaborationModals();
    }

    // Generic page initialization
    initializeGenericPage() {
        this.setupGenericModals();
        this.loadGenericPageData();
    }

    // Data Loading Methods
    async loadAdminDashboardData() {
        try {
            const [statsResponse, tasksResponse, usersResponse] = await Promise.all([
                fetch('/api/admin/dashboard-stats'),
                fetch('/api/tasks'),
                fetch('/api/users')
            ]);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateAdminStats(stats);
            }

            if (tasksResponse.ok) {
                const tasks = await tasksResponse.json();
                this.updateAdminTasks(tasks);
            }

            if (usersResponse.ok) {
                const users = await usersResponse.json();
                this.updateAdminUsers(users);
            }
        } catch (error) {
            console.error('Error loading admin dashboard data:', error);
        }
    }

    async loadUserManagementData() {
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const users = await response.json();
                this.updateUserManagementTable(users);
            }
        } catch (error) {
            console.error('Error loading user management data:', error);
        }
    }

    async loadGlobalTasksData() {
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const tasks = await response.json();
                this.updateGlobalTasksTable(tasks);
            }
        } catch (error) {
            console.error('Error loading global tasks data:', error);
        }
    }

    async loadGlobalReportsData() {
        try {
            const response = await fetch('/api/reports');
            if (response.ok) {
                const reports = await response.json();
                this.dataCache.reports = reports; // Cache data for filtering/searching
                this.updateGlobalReports(reports);
                this.updateReportsStats(reports);
            }
        } catch (error) {
            this.handleError(error, 'loading global reports data');
        }
    }

    async loadTeamPerformanceData() {
        try {
            const response = await fetch('/api/reports');
            if (response.ok) {
                const performance = await response.json();
                this.dataCache.teamPerformance = performance; // Cache data for filtering/searching
                this.updateTeamPerformance(performance);
                this.updateTeamPerformanceStats(performance);
            }
        } catch (error) {
            this.handleError(error, 'loading team performance data');
        }
    }

    async loadProjectManagementData() {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const projects = await response.json();
                this.dataCache.projects = projects; // Cache data for filtering/searching
                this.updateProjectManagementTable(projects);
                this.updateProjectManagementStats(projects);
            }
        } catch (error) {
            this.handleError(error, 'loading project management data');
        }
    }

    async loadPMDashboardData() {
        try {
            const [statsResponse, tasksResponse, teamResponse] = await Promise.all([
                fetch('/api/manager/dashboard-stats'),
                fetch('/api/tasks'),
                fetch('/api/pm/employees')
            ]);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updatePMStats(stats);
            }

            if (tasksResponse.ok) {
                const tasks = await tasksResponse.json();
                this.updatePMTasks(tasks);
            }

            if (teamResponse.ok) {
                const team = await teamResponse.json();
                this.updatePMTeam(team);
            }
        } catch (error) {
            console.error('Error loading PM dashboard data:', error);
        }
    }

    async loadTeamTaskData() {
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const tasks = await response.json();
                this.updateTeamTaskTable(tasks);
            }
        } catch (error) {
            console.error('Error loading team task data:', error);
        }
    }

    async loadReportsAndAnalyticsData() {
        try {
            const response = await fetch('/api/reports');
            if (response.ok) {
                const analytics = await response.json();
                this.updateReportsAndAnalytics(analytics);
            }
        } catch (error) {
            console.error('Error loading reports and analytics data:', error);
        }
    }

    async loadUserDashboardData() {
        try {
            const [statsResponse, tasksResponse] = await Promise.all([
                fetch('/api/dashboard/user/stats'),
                fetch('/api/dashboard/user/tasks')
            ]);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateUserStats(stats);
            }

            if (tasksResponse.ok) {
                const tasks = await tasksResponse.json();
                this.updateUserTasks(tasks);
            }
        } catch (error) {
            console.error('Error loading user dashboard data:', error);
        }
    }

    async loadUserTasksData() {
        try {
            const response = await fetch('/api/dashboard/user/tasks');
            if (response.ok) {
                const tasks = await response.json();
                this.updateUserTasksTable(tasks);
            }
        } catch (error) {
            console.error('Error loading user tasks data:', error);
        }
    }

    async loadCalendarData() {
        try {
            const response = await fetch('/api/dashboard/user/calendar');
            if (response.ok) {
                const events = await response.json();
                this.updateCalendarEvents(events);
            }
        } catch (error) {
            console.error('Error loading calendar data:', error);
        }
    }

    async loadTimeTrackingData() {
        try {
            const response = await fetch('/api/dashboard/user/time-tracking');
            if (response.ok) {
                const timeData = await response.json();
                this.updateTimeTracking(timeData);
            }
        } catch (error) {
            console.error('Error loading time tracking data:', error);
        }
    }

    async loadCollaborationData() {
        try {
            const response = await fetch('/api/dashboard/user/collaboration');
            if (response.ok) {
                const collaboration = await response.json();
                this.updateCollaboration(collaboration);
            }
        } catch (error) {
            console.error('Error loading collaboration data:', error);
        }
    }

    // Data Update Methods
    updateAdminStats(stats) {
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    updateAdminTasks(tasks) {
        const container = document.getElementById('recent-activity-list');
        if (container) {
            container.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');
        }
    }

    updateAdminUsers(users) {
        // Update user-related statistics
        const totalUsersElement = document.querySelector('[data-stat="totalUsers"]');
        if (totalUsersElement) {
            totalUsersElement.textContent = users.length;
        }
    }

    updateUserManagementTable(users) {
        const tbody = document.querySelector('#users .data-table tbody');
        if (tbody) {
            tbody.innerHTML = users.map(user => this.createUserRow(user)).join('');
        }
    }

    updateGlobalTasksTable(tasks) {
        const tbody = document.querySelector('#tasks .data-table tbody');
        if (tbody) {
            tbody.innerHTML = tasks.map(task => this.createTaskRow(task)).join('');
        }
    }

    updateGlobalReports(reports) {
        // Update reports table
        const tbody = document.querySelector('#reports .data-table tbody');
        if (tbody) {
            tbody.innerHTML = reports.map(report => this.createReportRow(report)).join('');
        }
    }

    updateReportsStats(reports) {
        const stats = {
            totalReports: reports.length,
            completedReports: reports.filter(r => r.status === 'COMPLETED').length,
            pendingReports: reports.filter(r => r.status === 'PENDING').length,
            overdueReports: reports.filter(r => r.status === 'OVERDUE').length
        };
        
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    updateTeamPerformance(performance) {
        // Update team rankings table
        const tbody = document.querySelector('#performance .data-table tbody');
        if (tbody) {
            tbody.innerHTML = performance.teams?.map((team, index) => this.createTeamRankingRow(team, index + 1)).join('') || '';
        }

        // Update top performers table
        const performersTbody = document.querySelector('#top-performers-table-body');
        if (performersTbody) {
            performersTbody.innerHTML = performance.topPerformers?.map((performer, index) => this.createTopPerformerRow(performer, index + 1)).join('') || '';
        }
    }

    updateTeamRankings(teams) {
        const tbody = document.querySelector('#performance .data-table tbody');
        if (tbody) {
            tbody.innerHTML = teams.map((team, index) => this.createTeamRankingRow(team, index + 1)).join('');
        }
    }

    updateTopPerformers(performers) {
        const performersTbody = document.querySelector('#top-performers-table-body');
        if (performersTbody) {
            performersTbody.innerHTML = performers.map((performer, index) => this.createTopPerformerRow(performer, index + 1)).join('');
        }
    }

    updateProjectManagementTable(projects) {
        const tbody = document.querySelector('#projects .data-table tbody');
        if (tbody) {
            tbody.innerHTML = projects.map(project => this.createProjectRow(project)).join('');
        }
    }

    updateProjectManagementStats(projects) {
        const stats = {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
            completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
            onHoldProjects: projects.filter(p => p.status === 'ON_HOLD').length
        };
        
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    updateTeamPerformanceStats(performance) {
        const stats = {
            overallPerformance: performance.overallPerformance || '0%',
            taskCompletionRate: performance.taskCompletionRate || '0%',
            avgTaskDuration: performance.avgTaskDuration || '0 days',
            teamSatisfaction: performance.teamSatisfaction || '0/5'
        };
        
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    updatePMStats(stats) {
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    updatePMTasks(tasks) {
        const container = document.getElementById('recent-tasks-list');
        if (container) {
            container.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');
        }
    }

    updatePMTeam(team) {
        const container = document.getElementById('team-members-list');
        if (container) {
            container.innerHTML = team.map(member => this.createTeamMemberElement(member)).join('');
        }
    }

    updateTeamTaskTable(tasks) {
        const tbody = document.querySelector('#tasks .data-table tbody');
        if (tbody) {
            tbody.innerHTML = tasks.map(task => this.createTeamTaskRow(task)).join('');
        }
    }

    updateReportsAndAnalytics(analytics) {
        // Update analytics display
        const container = document.getElementById('analytics-container');
        if (container) {
            container.innerHTML = analytics.map(item => this.createAnalyticsElement(item)).join('');
        }
    }

    updateUserStats(stats) {
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    updateUserTasks(tasks) {
        const container = document.getElementById('recent-tasks-list');
        if (container) {
            container.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');
        }
    }

    updateUserTasksTable(tasks) {
        const tbody = document.querySelector('#tasks .data-table tbody');
        if (tbody) {
            tbody.innerHTML = tasks.map(task => this.createUserTaskRow(task)).join('');
        }
    }

    updateCalendarEvents(events) {
        const container = document.getElementById('calendar-events');
        if (container) {
            container.innerHTML = events.map(event => this.createCalendarEventElement(event)).join('');
        }
    }

    updateTimeTracking(timeData) {
        const container = document.getElementById('time-tracking-data');
        if (container) {
            container.innerHTML = timeData.map(entry => this.createTimeTrackingElement(entry)).join('');
        }
    }

    updateCollaboration(collaboration) {
        const container = document.getElementById('collaboration-data');
        if (container) {
            container.innerHTML = collaboration.map(item => this.createCollaborationElement(item)).join('');
        }
    }

    // Element Creation Methods
    createTaskElement(task) {
        return `
            <div class="task-item">
                <div class="task-header">
                    <h4>${task.title}</h4>
                    <span class="status-badge ${task.status.toLowerCase()}">${task.status}</span>
                </div>
                <p>${task.description}</p>
                <div class="task-meta">
                    <span><i class="fas fa-calendar"></i> ${task.deadline}</span>
                    <span><i class="fas fa-user"></i> ${task.assignee}</span>
                    <span><i class="fas fa-flag"></i> ${task.priority}</span>
                </div>
            </div>
        `;
    }

    createUserRow(user) {
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${user.avatar || 'https://via.placeholder.com/30x30/4361ee/ffffff?text=' + user.name.charAt(0)}" 
                             style="width: 30px; height: 30px; border-radius: 50%;">
                        <div>
                            <div style="font-weight: 500;">${user.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${user.role}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge" style="background-color: rgba(67, 97, 238, 0.1); color: var(--primary);">${user.role}</span>
                </td>
                <td>
                    <span class="status-badge ${user.status.toLowerCase()}">${user.status}</span>
                </td>
                <td>${user.lastLogin || 'Never'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="pageManager.editUser('${user.id}')" style="padding: 8px 12px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="pageManager.deleteUser('${user.id}')" style="padding: 8px 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    createTaskRow(task) {
        return `
            <tr>
                <td><a href="/admin/tasks/${task.id}">${task.title}</a></td>
                <td>${task.assignee}</td>
                <td>${task.priority}</td>
                <td>${task.progress}%</td>
                <td><span class="status-badge ${task.status.toLowerCase()}">${task.status}</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="pageManager.editTask('${task.id}')" style="padding: 8px 12px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="pageManager.deleteTask('${task.id}')" style="padding: 8px 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    createReportElement(report) {
        return `
            <div class="report-item">
                <h4>${report.title}</h4>
                <p>${report.description}</p>
                <div class="report-meta">
                    <span>Generated: ${report.generatedAt}</span>
                    <span>Type: ${report.type}</span>
                </div>
            </div>
        `;
    }

    createReportRow(report) {
        return `
            <tr>
                <td>${report.name || report.title}</td>
                <td><span class="status-badge" style="background-color: rgba(67, 97, 238, 0.1); color: var(--primary);">${report.type}</span></td>
                <td>${report.generatedBy || 'System'}</td>
                <td><span class="status-badge ${report.status.toLowerCase()}">${report.status}</span></td>
                <td>${report.generatedAt || report.createdAt || 'N/A'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="pageManager.editReport('${report.id}')" style="padding: 8px 12px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="pageManager.deleteReport('${report.id}')" style="padding: 8px 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    createPerformanceElement(metric) {
        return `
            <div class="performance-item">
                <h4>${metric.teamName}</h4>
                <div class="performance-stats">
                    <span>Tasks: ${metric.completedTasks}/${metric.totalTasks}</span>
                    <span>Efficiency: ${metric.efficiency}%</span>
                </div>
            </div>
        `;
    }

    createTeamRankingRow(team, rank) {
        return `
            <tr>
                <td>${rank}</td>
                <td>${team.name}</td>
                <td>${team.memberCount || 0}</td>
                <td>${team.activeProjects || 0}</td>
                <td><span class="status-badge" style="background-color: rgba(40, 167, 69, 0.1); color: var(--success);">${team.performanceScore || 0}%</span></td>
                <td>${team.tasksCompleted || 0}</td>
                <td>${team.averageRating || '0/5'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="pageManager.viewTeamDetails('${team.id}')" style="padding: 8px 12px;">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </td>
            </tr>
        `;
    }

    createTopPerformerRow(performer, rank) {
        return `
            <tr>
                <td>${rank}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${performer.avatar || 'https://via.placeholder.com/32x32/4361ee/ffffff?text=' + performer.name.charAt(0)}" 
                             style="width: 32px; height: 32px; border-radius: 50%;">
                        <span>${performer.name}</span>
                    </div>
                </td>
                <td>${performer.team}</td>
                <td>${performer.tasksCompleted || 0}</td>
                <td><span class="status-badge ${this.getPerformanceClass(performer.performanceScore)}">${performer.performanceScore || 0}%</span></td>
                <td>${performer.averageRating || '0/5'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="pageManager.viewEmployeeProfile('${performer.id}')" style="padding: 8px 12px;">
                        <i class="fas fa-user"></i> View Profile
                    </button>
                </td>
            </tr>
        `;
    }

    getPerformanceClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'average';
        return 'below-average';
    }

    createTeamMemberElement(member) {
        return `
            <div class="team-member">
                <img src="${member.avatar || 'https://via.placeholder.com/40x40/4361ee/ffffff?text=' + member.name.charAt(0)}" alt="${member.name}">
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p>${member.role}</p>
                    <span class="status ${member.status}">${member.status}</span>
                </div>
            </div>
        `;
    }

    createTeamTaskRow(task) {
        return `
            <tr>
                <td>${task.title}</td>
                <td>${task.assignee}</td>
                <td>${task.priority}</td>
                <td>${task.progress}%</td>
                <td><span class="status-badge ${task.status.toLowerCase()}">${task.status}</span></td>
                <td>
                    <button class="btn btn-secondary edit-task-btn" onclick="pageManager.editTask('${task.id}')" style="padding: 8px 12px; margin-right: 5px;" data-task-id="${task.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="pageManager.deleteTask('${task.id}')" style="padding: 8px 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    createAnalyticsElement(item) {
        return `
            <div class="analytics-item">
                <h4>${item.title}</h4>
                <div class="analytics-value">${item.value}</div>
                <div class="analytics-change ${item.change >= 0 ? 'positive' : 'negative'}">
                    ${item.change >= 0 ? '+' : ''}${item.change}%
                </div>
            </div>
        `;
    }

    createUserTaskRow(task) {
        return `
            <tr>
                <td><a href="/user/tasks/${task.id}">${task.title}</a></td>
                <td>${task.priority}</td>
                <td>${task.deadline}</td>
                <td>${task.progress}%</td>
                <td><span class="status-badge ${task.status.toLowerCase()}">${task.status}</span></td>
                <td>
                    <a href="/user/tasks/${task.id}/edit" class="btn btn-secondary" style="padding: 8px 12px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="/user/tasks/${task.id}/complete" class="btn btn-danger" style="padding: 8px 12px;">
                        <i class="fas fa-exclamation-circle"></i>
                    </a>
                </td>
            </tr>
        `;
    }

    createCalendarEventElement(event) {
        return `
            <div class="calendar-event">
                <div class="event-time">${event.time}</div>
                <div class="event-title">${event.title}</div>
                <div class="event-description">${event.description}</div>
            </div>
        `;
    }

    createTimeTrackingElement(entry) {
        return `
            <div class="time-entry">
                <div class="entry-date">${entry.date}</div>
                <div class="entry-task">${entry.task}</div>
                <div class="entry-duration">${entry.duration}</div>
            </div>
        `;
    }

    createCollaborationElement(item) {
        return `
            <div class="collaboration-item">
                <div class="collab-type">${item.type}</div>
                <div class="collab-content">${item.content}</div>
                <div class="collab-meta">${item.timestamp}</div>
            </div>
        `;
    }

    // Chart Initialization Methods
    initializeAdminCharts() {
        this.initializeChart('task-status-chart', 'doughnut', {
            labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
            datasets: [{
                data: [65, 20, 10, 5],
                backgroundColor: ['#28a745', '#ffc107', '#17a2b8', '#dc3545']
            }]
        });

        this.initializeChart('project-progress-chart', 'bar', {
            labels: ['Project A', 'Project B', 'Project C', 'Project D'],
            datasets: [{
                label: 'Progress %',
                data: [75, 60, 90, 45],
                backgroundColor: '#4361ee'
            }]
        });

        this.initializeChart('user-activity-chart', 'line', {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Active Users',
                data: [120, 135, 125, 140, 130],
                borderColor: '#4361ee',
                fill: false
            }]
        });
    }

    initializeUserManagementCharts() {
        this.initializeChart('user-activity-chart', 'line', {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Active Users',
                data: [120, 135, 125, 140, 130, 110, 95],
                borderColor: '#4361ee',
                fill: false
            }]
        });

        this.initializeChart('user-role-chart', 'doughnut', {
            labels: ['Super Admin', 'Manager', 'Employee'],
            datasets: [{
                data: [5, 25, 120],
                backgroundColor: ['#dc3545', '#ffc107', '#17a2b8']
            }]
        });
    }

    initializeReportCharts() {
        // Initialize charts for global reports page
        this.initializeChart('reports-overview-chart', 'bar', {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Reports Generated',
                data: [45, 52, 48, 61, 55, 67],
                backgroundColor: '#28a745'
            }]
        });

        this.initializeChart('report-type-distribution-chart', 'doughnut', {
            labels: ['Task Report', 'Performance Report', 'System Report', 'User Report'],
            datasets: [{
                data: [35, 25, 20, 20],
                backgroundColor: ['#4361ee', '#28a745', '#ffc107', '#17a2b8']
            }]
        });
    }

    initializeTeamPerformanceCharts() {
        // Initialize charts for team performance page
        this.initializeChart('team-efficiency-chart', 'radar', {
            labels: ['Productivity', 'Quality', 'Timeliness', 'Collaboration', 'Innovation'],
            datasets: [{
                label: 'Team A',
                data: [85, 90, 75, 88, 82],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)'
            }]
        });

        this.initializeChart('team-comparison-chart', 'bar', {
            labels: ['Development', 'Design', 'Marketing', 'Support'],
            datasets: [{
                label: 'Performance Score',
                data: [92.5, 89.3, 85.7, 82.1],
                backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#6c757d']
            }]
        });

        this.initializeChart('performance-metrics-chart', 'doughnut', {
            labels: ['Task Completion', 'On-Time Delivery', 'Quality Score', 'Team Collaboration'],
            datasets: [{
                data: [94.2, 87.5, 92.1, 89.7],
                backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#6c757d']
            }]
        });
    }

    initializePMCharts() {
        this.initializeChart('team-performance-chart', 'bar', {
            labels: ['Team A', 'Team B', 'Team C'],
            datasets: [{
                label: 'Performance Score',
                data: [85, 92, 78],
                backgroundColor: '#28a745'
            }]
        });

        this.initializeChart('project-progress-chart', 'doughnut', {
            labels: ['Completed', 'In Progress', 'Planning'],
            datasets: [{
                data: [40, 35, 25],
                backgroundColor: ['#28a745', '#ffc107', '#17a2b8']
            }]
        });
    }

    initializeUserCharts() {
        this.initializeChart('task-progress-chart', 'doughnut', {
            labels: ['Completed', 'In Progress', 'Pending'],
            datasets: [{
                data: [70, 20, 10],
                backgroundColor: ['#28a745', '#ffc107', '#17a2b8']
            }]
        });

        this.initializeChart('time-tracking-chart', 'line', {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Hours Worked',
                data: [8, 7.5, 8.5, 7, 8],
                borderColor: '#4361ee',
                fill: false
            }]
        });
    }

    initializeAnalyticsCharts() {
        // Initialize charts for reports and analytics page
        this.initializeChart('analytics-overview-chart', 'line', {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Performance Score',
                data: [78, 82, 85, 89],
                borderColor: '#28a745',
                fill: false
            }]
        });
    }

    initializeTimeTrackingCharts() {
        // Initialize charts for time tracking page
        this.initializeChart('time-distribution-chart', 'pie', {
            labels: ['Development', 'Design', 'Testing', 'Meetings', 'Documentation'],
            datasets: [{
                data: [40, 25, 15, 12, 8],
                backgroundColor: ['#4361ee', '#28a745', '#ffc107', '#17a2b8', '#dc3545']
            }]
        });
    }

    initializeChart(canvasId, type, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text')
                        }
                    }
                }
            }
        });
    }

    // Chart Update Methods
    updateUserActivityChart(period) {
        // Update user activity chart based on selected period
        const chart = this.charts['user-activity-chart'];
        if (chart) {
            // Simulate data update based on period
            const data = this.generateChartData(period);
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.values;
            chart.update();
        }
    }

    updateReportsOverviewChart(period) {
        // Update reports overview chart based on selected period
        const chart = this.charts['reports-overview-chart'];
        if (chart) {
            const data = this.generateChartData(period);
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.values;
            chart.update();
        }
    }

    updateTaskProgressChart(period) {
        // Update task progress chart based on selected period
        const chart = this.charts['task-progress-chart'];
        if (chart) {
            const data = this.generateChartData(period);
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.values;
            chart.update();
        }
    }

    updateTeamPerformanceChart(period) {
        // Update team performance chart based on selected period
        const chart = this.charts['team-performance-chart'];
        if (chart) {
            const data = this.generateChartData(period);
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.values;
            chart.update();
        }
    }

    // Data Generation Methods
    generateChartData(period) {
        const periods = {
            '7': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], count: 7 },
            '30': { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], count: 4 },
            '90': { labels: ['Month 1', 'Month 2', 'Month 3'], count: 3 }
        };

        const periodData = periods[period] || periods['30'];
        const values = Array.from({ length: periodData.count }, () => Math.floor(Math.random() * 100) + 20);

        return {
            labels: periodData.labels,
            values: values
        };
    }

    // Filtering and Search Methods
    filterUsers() {
        const roleFilter = document.getElementById('role-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        // Apply filters to user data
        this.applyUserFilters(roleFilter, statusFilter);
    }

    filterTasks() {
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        
        // Apply filters to task data
        this.applyTaskFilters(statusFilter, priorityFilter);
    }

    filterTeamTasks() {
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        const assigneeFilter = document.getElementById('assignee-filter').value;
        
        // Apply filters to team task data
        this.applyTeamTaskFilters(statusFilter, priorityFilter, assigneeFilter);
    }

    filterGlobalTasks() {
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        const projectFilter = document.getElementById('project-filter').value;
        
        // Apply filters to global task data
        this.applyGlobalTaskFilters(statusFilter, priorityFilter, projectFilter);
    }

    filterReports() {
        const typeFilter = document.getElementById('type-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        // Apply filters to reports data
        this.applyReportFilters(typeFilter, statusFilter);
    }

    filterTeams() {
        const teamFilter = document.getElementById('team-filter').value;
        
        // Apply filters to team data
        this.applyTeamFilters(teamFilter);
    }

    filterPerformers() {
        const performanceFilter = document.getElementById('performance-filter').value;
        
        // Apply filters to performer data
        this.applyPerformerFilters(performanceFilter);
    }

    searchUsers(query) {
        if (query.length < 2) {
            this.displayAllUsers();
            return;
        }
        
        // Filter users based on search query
        const filteredUsers = this.dataCache.users?.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()) ||
            user.role.toLowerCase().includes(query.toLowerCase())
        ) || [];
        
        this.updateUserManagementTable(filteredUsers);
    }

    searchTasks(query) {
        if (query.length < 2) {
            this.displayAllTasks();
            return;
        }
        
        // Filter tasks based on search query
        const filteredTasks = this.dataCache.tasks?.filter(task => 
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase())
        ) || [];
        
        this.updateUserTasksTable(filteredTasks);
    }

    searchTeamTasks(query) {
        if (query.length < 2) {
            this.displayAllTeamTasks();
            return;
        }
        
        // Filter team tasks based on search query
        const filteredTasks = this.dataCache.teamTasks?.filter(task => 
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase()) ||
            task.assignee.toLowerCase().includes(query.toLowerCase())
        ) || [];
        
        this.updateTeamTaskTable(filteredTasks);
    }

    searchGlobalTasks(query) {
        if (query.length < 2) {
            this.displayAllGlobalTasks();
            return;
        }
        
        // Filter global tasks based on search query
        const filteredTasks = this.dataCache.globalTasks?.filter(task => 
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase()) ||
            task.projectName.toLowerCase().includes(query.toLowerCase()) ||
            task.assignee.toLowerCase().includes(query.toLowerCase())
        ) || [];
        
        this.updateGlobalTasksTable(filteredTasks);
    }

    searchReports(query) {
        if (query.length < 2) {
            this.displayAllReports();
            return;
        }
        
        // Filter reports based on search query
        const filteredReports = this.dataCache.reports?.filter(report => 
            (report.name || report.title || '').toLowerCase().includes(query.toLowerCase()) ||
            (report.description || '').toLowerCase().includes(query.toLowerCase()) ||
            (report.type || '').toLowerCase().includes(query.toLowerCase())
        ) || [];
        
        this.updateGlobalReports(filteredReports);
    }

    searchTeams(query) {
        if (query.length < 2) {
            this.displayAllTeams();
            return;
        }
        
        // Filter teams based on search query
        const filteredTeams = this.dataCache.teamPerformance?.teams?.filter(team => 
            team.name.toLowerCase().includes(query.toLowerCase())
        ) || [];
        
        this.updateTeamRankings(filteredTeams);
    }

    searchPerformers(query) {
        if (query.length < 2) {
            this.displayAllPerformers();
            return;
        }
        
        // Filter performers based on search query
        const filteredPerformers = this.dataCache.teamPerformance?.topPerformers?.filter(performer => 
            performer.name.toLowerCase().includes(query.toLowerCase()) ||
            performer.team.toLowerCase().includes(query.toLowerCase())
        ) || [];
        
        this.updateTopPerformers(filteredPerformers);
    }

    // Filter Application Methods
    applyUserFilters(role, status) {
        let filteredUsers = this.dataCache.users || [];
        
        if (role) {
            filteredUsers = filteredUsers.filter(user => user.role === role);
        }
        
        if (status) {
            filteredUsers = filteredUsers.filter(user => user.status === status);
        }
        
        this.updateUserManagementTable(filteredUsers);
    }

    applyTaskFilters(status, priority) {
        let filteredTasks = this.dataCache.tasks || [];
        
        if (status) {
            filteredTasks = filteredTasks.filter(task => task.status === status);
        }
        
        if (priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === priority);
        }
        
        this.updateUserTasksTable(filteredTasks);
    }

    applyTeamTaskFilters(status, priority, assignee) {
        let filteredTasks = this.dataCache.teamTasks || [];
        
        if (status) {
            filteredTasks = filteredTasks.filter(task => task.status === status);
        }
        
        if (priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === priority);
        }
        
        if (assignee) {
            filteredTasks = filteredTasks.filter(task => task.assigneeId === assignee);
        }
        
        this.updateTeamTaskTable(filteredTasks);
    }

    applyGlobalTaskFilters(status, priority, project) {
        let filteredTasks = this.dataCache.globalTasks || [];

        if (status) {
            filteredTasks = filteredTasks.filter(task => task.status === status);
        }

        if (priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === priority);
        }

        if (project) {
            filteredTasks = filteredTasks.filter(task => task.projectId === project);
        }

        this.updateGlobalTasksTable(filteredTasks);
    }

    applyReportFilters(type, status) {
        let filteredReports = this.dataCache.reports || [];

        if (type) {
            filteredReports = filteredReports.filter(report => report.type === type);
        }

        if (status) {
            filteredReports = filteredReports.filter(report => report.status === status);
        }

        this.updateGlobalReports(filteredReports);
    }

    applyTeamFilters(teamType) {
        let filteredTeams = this.dataCache.teamPerformance?.teams || [];

        if (teamType) {
            filteredTeams = filteredTeams.filter(team => team.type === teamType);
        }

        this.updateTeamRankings(filteredTeams);
    }

    applyPerformerFilters(performanceLevel) {
        let filteredPerformers = this.dataCache.teamPerformance?.topPerformers || [];

        if (performanceLevel) {
            switch (performanceLevel) {
                case 'EXCELLENT':
                    filteredPerformers = filteredPerformers.filter(p => p.performanceScore >= 90);
                    break;
                case 'GOOD':
                    filteredPerformers = filteredPerformers.filter(p => p.performanceScore >= 80 && p.performanceScore < 90);
                    break;
                case 'AVERAGE':
                    filteredPerformers = filteredPerformers.filter(p => p.performanceScore >= 70 && p.performanceScore < 80);
                    break;
                case 'BELOW_AVERAGE':
                    filteredPerformers = filteredPerformers.filter(p => p.performanceScore < 70);
                    break;
            }
        }

        this.updateTopPerformers(filteredPerformers);
    }

    // Display Methods
    displayAllUsers() {
        this.updateUserManagementTable(this.dataCache.users || []);
    }

    displayAllTasks() {
        this.updateUserTasksTable(this.dataCache.tasks || []);
    }

    displayAllTeamTasks() {
        this.updateTeamTaskTable(this.dataCache.teamTasks || []);
    }

    displayAllGlobalTasks() {
        this.updateGlobalTasksTable(this.dataCache.globalTasks || []);
    }

    displayAllReports() {
        this.updateGlobalReports(this.dataCache.reports || []);
    }

    displayAllTeams() {
        this.updateTeamRankings(this.dataCache.teamPerformance?.teams || []);
    }

    displayAllPerformers() {
        this.updateTopPerformers(this.dataCache.teamPerformance?.topPerformers || []);
    }

    // Additional CRUD Operations
    async confirmDeleteUser() {
        const userId = document.getElementById('delete-user-id').value;
        await this.deleteUser(userId);
        this.closeModal('delete-confirmation-modal');
    }

    async confirmDeleteTask() {
        const taskId = document.getElementById('delete-task-id').value;
        await this.deleteTask(taskId);
        this.closeModal('delete-confirmation-modal');
    }

    async confirmDeleteReport() {
        const reportId = document.getElementById('delete-report-id').value;
        await this.deleteReport(reportId);
        this.closeModal('delete-confirmation-modal');
    }

    // Load Additional Data Methods
    async loadGenericPageData() {
        // Load generic data for pages without specific data requirements
        try {
            const response = await fetch('/api/dashboard/generic/stats');
            if (response.ok) {
                const data = await response.json();
                this.updateGenericPageData(data);
            }
        } catch (error) {
            console.error('Error loading generic page data:', error);
        }
    }

    updateGenericPageData(data) {
        // Update generic page elements
        Object.keys(data).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = data[key];
            }
        });
    }

    // Enhanced Modal Setup Methods
    setupUserManagementModals() {
        // Setup user management specific modals
        this.loadTeamMembersForAssignment();
        this.loadProjectsForAssignment();
    }

    setupTaskModals() {
        // Setup task-related modals
        this.loadTeamMembersForAssignment();
        this.loadProjectsForAssignment();
    }

    setupPMModals() {
        // Setup project manager specific modals
        this.loadTeamMembersForAssignment();
        this.loadProjectsForAssignment();
    }

    setupUserModals() {
        // Setup user-specific modals
        this.loadCategoriesForTasks();
    }

    setupCollaborationModals() {
        // Setup collaboration modals
        this.loadTeamMembersForCollaboration();
    }

    setupGenericModals() {
        // Setup generic modals for pages without specific modal requirements
    }

    // Load Options for Select Fields
    async loadTeamMembersForAssignment() {
        try {
            const response = await fetch('/api/users/team-members');
            if (response.ok) {
                const teamMembers = await response.json();
                this.populateAssigneeSelects(teamMembers);
            }
        } catch (error) {
            console.error('Error loading team members:', error);
        }
    }

    async loadProjectsForAssignment() {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const projects = await response.json();
                this.populateProjectSelects(projects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    async loadCategoriesForTasks() {
        try {
            const response = await fetch('/api/task-categories');
            if (response.ok) {
                const categories = await response.json();
                this.populateCategorySelects(categories);
            }
        } catch (error) {
            console.error('Error loading task categories:', error);
        }
    }

    async loadTeamMembersForCollaboration() {
        try {
            const response = await fetch('/api/users/team-members');
            if (response.ok) {
                const teamMembers = await response.json();
                this.populateCollaborationSelects(teamMembers);
            }
        } catch (error) {
            console.error('Error loading team members for collaboration:', error);
        }
    }

    // Populate Select Fields
    populateAssigneeSelects(teamMembers) {
        const selects = document.querySelectorAll('#task-assignee, #edit-task-assignee');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Team Member</option>';
            teamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.name;
                select.appendChild(option);
            });
        });
    }

    populateProjectSelects(projects) {
        const selects = document.querySelectorAll('#task-project, #edit-task-project');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Project</option>';
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
        });
    }

    populateCategorySelects(categories) {
        const selects = document.querySelectorAll('#task-category, #edit-task-category');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    populateCollaborationSelects(teamMembers) {
        const selects = document.querySelectorAll('#collaboration-members');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select Team Member</option>';
            teamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.name;
                select.appendChild(option);
            });
        });
    }

    // Enhanced Form Submission
    async submitForm(formId, data) {
        const endpoints = {
            'create-task-form': '/api/tasks',
            'edit-task-form': '/api/tasks',
            'create-user-form': '/api/users',
            'edit-user-form': '/api/users',
            'create-project-form': '/api/projects',
            'edit-project-form': '/api/projects',
            'create-global-task-form': '/api/tasks', // Assuming global tasks use the same API
            'edit-global-task-form': '/api/tasks',
            'create-report-form': '/api/reports',
            'edit-report-form': '/api/reports',
            'create-collaboration-form': '/api/collaboration',
            'edit-collaboration-form': '/api/collaboration'
        };

        const endpoint = endpoints[formId];
        if (!endpoint) {
            throw new Error('Unknown form type');
        }

        const method = formId.includes('edit') ? 'PUT' : 'POST';
        const url = formId.includes('edit') ? `${endpoint}/${data.id}` : endpoint;

        return fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

    // Enhanced Error Handling
    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        this.showToast('Error!', `An error occurred while ${context}.`, 'error');
    }

    // Enhanced Success Handling
    handleSuccess(message, context) {
        this.showToast('Success!', message, 'success');
        this.refreshPageData();
    }

    // Enhanced Data Refresh
    async refreshPageData() {
        try {
            await this.initializePage();
            this.showToast('Success!', 'Data refreshed successfully.', 'success');
        } catch (error) {
            this.handleError(error, 'refreshing data');
        }
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            this.modals[modalId] = true;
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.modals[modalId] = false;
            document.body.style.overflow = 'auto';
        }
    }

    closeActiveModal() {
        Object.keys(this.modals).forEach(modalId => {
            if (this.modals[modalId]) {
                this.closeModal(modalId);
            }
        });
    }

    // Form Handling
    async handleFormSubmission(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await this.submitForm(form.id, data);
            if (response.ok) {
                this.showToast('Success!', 'Form submitted successfully.', 'success');
                this.closeModal(form.closest('.modal').id);
                this.refreshPageData();
            } else {
                this.showToast('Error!', 'Failed to submit form.', 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showToast('Error!', 'An error occurred while submitting the form.', 'error');
        }
    }

    // Utility Methods
    showToast(title, message, type = 'info') {
        if (window.dashboardUtils && window.dashboardUtils.showToast) {
            window.dashboardUtils.showToast(title, message, type);
        } else {
            // Fallback toast implementation
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-header">
                    <strong>${title}</strong>
                    <button onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="toast-body">${message}</div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }
    }

    exportReports() {
        if (this.dataCache.reports && this.dataCache.reports.length > 0) {
            const csv = this.convertToCSV(this.dataCache.reports);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reports_export.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            this.showToast('Success!', 'Reports exported successfully.', 'success');
        } else {
            this.showToast('Info', 'No reports to export.', 'info');
        }
    }

    exportPerformanceReport() {
        if (this.dataCache.teamPerformance) {
            const reportData = {
                overallPerformance: this.dataCache.teamPerformance.overallPerformance,
                taskCompletionRate: this.dataCache.teamPerformance.taskCompletionRate,
                avgTaskDuration: this.dataCache.teamPerformance.avgTaskDuration,
                teamSatisfaction: this.dataCache.teamPerformance.teamSatisfaction,
                teams: this.dataCache.teamPerformance.teams || [],
                topPerformers: this.dataCache.teamPerformance.topPerformers || []
            };
            
            const csv = this.convertToCSV(reportData);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'team_performance_report.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            this.showToast('Success!', 'Performance report exported successfully.', 'success');
        } else {
            this.showToast('Info', 'No performance data to export.', 'info');
        }
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    // CRUD Operations
    async editUser(userId) {
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (response.ok) {
                const user = await response.json();
                this.populateEditForm('edit-user-form', user);
                this.openModal('edit-user-modal');
            }
        } catch (error) {
            console.error('Error loading user for edit:', error);
        }
    }

    async deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
                if (response.ok) {
                    this.showToast('Success!', 'User deleted successfully.', 'success');
                    this.refreshPageData();
                } else {
                    this.showToast('Error!', 'Failed to delete user.', 'error');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                this.showToast('Error!', 'An error occurred while deleting the user.', 'error');
            }
        }
    }

    async editTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`);
            if (response.ok) {
                const task = await response.json();
                this.populateEditForm('edit-task-form', task);
                this.openModal('edit-task-modal');
            }
        } catch (error) {
            console.error('Error loading task for edit:', error);
        }
    }

    async editReport(reportId) {
        try {
            const response = await fetch(`/api/reports/${reportId}`);
            if (response.ok) {
                const report = await response.json();
                this.populateEditForm('edit-report-form', report);
                this.openModal('edit-report-modal');
            }
        } catch (error) {
            console.error('Error loading report for edit:', error);
        }
    }

    viewTeamDetails(teamId) {
        const team = this.dataCache.teamPerformance?.teams?.find(t => t.id === teamId);
        if (team) {
            document.getElementById('team-name').textContent = team.name;
            document.getElementById('team-description').textContent = team.description || 'No description available';
            document.getElementById('team-total-members').textContent = team.memberCount || 0;
            document.getElementById('team-active-projects').textContent = team.activeProjects || 0;
            document.getElementById('team-performance-score').textContent = team.performanceScore || 0 + '%';
            document.getElementById('team-task-completion').textContent = team.taskCompletionRate || 0 + '%';
            
            // Populate team members list
            const membersList = document.getElementById('team-members-list');
            if (membersList && team.members) {
                membersList.innerHTML = team.members.map(member => `
                    <div class="team-member-item">
                        <img src="${member.avatar || 'https://via.placeholder.com/40x40/4361ee/ffffff?text=' + member.name.charAt(0)}" alt="${member.name}">
                        <div class="member-info">
                            <h5>${member.name}</h5>
                            <p>${member.role}</p>
                        </div>
                        <div class="member-performance">
                            <span class="performance-score">${member.performanceScore || 0}%</span>
                        </div>
                    </div>
                `).join('');
            }
            
            this.openModal('team-details-modal');
        }
    }

    viewEmployeeProfile(employeeId) {
        const performer = this.dataCache.teamPerformance?.topPerformers?.find(p => p.id === employeeId);
        if (performer) {
            document.getElementById('employee-name').textContent = performer.name;
            document.getElementById('employee-role').textContent = performer.role || 'Employee';
            document.getElementById('employee-team').textContent = performer.team;
            document.getElementById('employee-avatar').src = performer.avatar || 'https://via.placeholder.com/80x80/4361ee/ffffff?text=' + performer.name.charAt(0);
            document.getElementById('employee-tasks-completed').textContent = performer.tasksCompleted || 0;
            document.getElementById('employee-performance').textContent = performer.performanceScore || 0 + '%';
            document.getElementById('employee-rating').textContent = performer.averageRating || '0/5';
            document.getElementById('employee-on-time').textContent = performer.onTimeDelivery || 0 + '%';
            
            // Populate recent tasks
            const recentTasks = document.getElementById('employee-recent-tasks');
            if (recentTasks && performer.recentTasks) {
                recentTasks.innerHTML = performer.recentTasks.map(task => `
                    <div class="recent-task-item">
                        <h6>${task.title}</h6>
                        <p>${task.description}</p>
                        <span class="task-status ${task.status.toLowerCase()}">${task.status}</span>
                    </div>
                `).join('');
            }
            
            this.openModal('employee-profile-modal');
        }
    }

    async deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
                if (response.ok) {
                    this.showToast('Success!', 'Task deleted successfully.', 'success');
                    this.refreshPageData();
                } else {
                    this.showToast('Error!', 'Failed to delete task.', 'error');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                this.showToast('Error!', 'An error occurred while deleting the task.', 'error');
            }
        }
    }

    async deleteReport(reportId) {
        if (confirm('Are you sure you want to delete this report?')) {
            try {
                const response = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
                if (response.ok) {
                    this.showToast('Success!', 'Report deleted successfully.', 'success');
                    this.refreshPageData();
                } else {
                    this.showToast('Error!', 'Failed to delete report.', 'error');
                }
            } catch (error) {
                console.error('Error deleting report:', error);
                this.showToast('Error!', 'An error occurred while deleting the report.', 'error');
            }
        }
    }

    populateEditForm(formId, data) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    }

    // Modal Setup Methods
    setupAdminModals() {
        // Admin-specific modals are already in the HTML
    }

    setupUserManagementModals() {
        // User management modals
    }

    setupTaskModals() {
        // Task-related modals
    }

    setupPMModals() {
        // Project manager modals
    }

    setupUserModals() {
        // User modals
    }

    setupCollaborationModals() {
        // Collaboration modals
    }

    setupGenericModals() {
        // Generic modals for pages without specific modal requirements
    }
}

// Initialize the page manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pageManager = new PageManager();
}); 