// Dashboard Utilities and Helper Functions
class DashboardUtils {
    constructor() {
        this.apiBaseUrl = '/api';
        this.charts = {};
        this.currentTheme = 'dark';
        this.notificationCount = 0;
    }

    // ===== MODAL MANAGEMENT =====
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focus first input in modal
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }

    // ===== CHART MANAGEMENT =====
    initializeCharts() {
        this.createTaskStatusChart();
        this.createProjectProgressChart();
        this.createUserActivityChart();
        this.setupChartEventListeners();
    }

    createTaskStatusChart() {
        const ctx = document.getElementById('task-status-chart');
        if (!ctx) return;

        this.charts.taskStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['In Progress', 'Completed', 'Pending', 'Overdue'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: [
                        '#4361ee',
                        '#28a745',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#2d2d2d',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#404040',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    createProjectProgressChart() {
        const ctx = document.getElementById('project-progress-chart');
        if (!ctx) return;

        this.charts.projectProgress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Website Redesign', 'System Optimization', 'Mobile App', 'Database Migration'],
                datasets: [{
                    label: 'Progress (%)',
                    data: [65, 100, 45, 80],
                    backgroundColor: [
                        'rgba(67, 97, 238, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(23, 162, 184, 0.8)'
                    ],
                    borderColor: [
                        '#4361ee',
                        '#28a745',
                        '#ffc107',
                        '#17a2b8'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: '#404040'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: '#404040'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#2d2d2d',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#404040',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    createUserActivityChart() {
        const ctx = document.getElementById('user-activity-chart');
        if (!ctx) return;

        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = [65, 59, 80, 81, 56, 55, 40];

        this.charts.userActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Active Users',
                    data: data,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#4361ee',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: '#404040'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: '#404040'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#2d2d2d',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#404040',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    setupChartEventListeners() {
        const periodSelectors = document.querySelectorAll('.chart-period-selector');
        periodSelectors.forEach(selector => {
            selector.addEventListener('change', (e) => {
                const chartType = e.target.dataset.chart;
                const period = e.target.value;
                this.updateChartData(chartType, period);
            });
        });
    }

    updateChartData(chartType, period) {
        // Simulate data update based on period
        console.log(`Updating ${chartType} chart for ${period} days`);
        
        // In a real application, you would fetch new data from the server
        // For now, we'll just show a loading state
        this.showChartLoading(chartType);
        
        setTimeout(() => {
            this.hideChartLoading(chartType);
        }, 1000);
    }

    showChartLoading(chartType) {
        const chartContainer = document.querySelector(`[data-chart="${chartType}"]`).closest('.chart-container');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chart-loading';
        loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        chartContainer.appendChild(loadingDiv);
    }

    hideChartLoading(chartType) {
        const chartContainer = document.querySelector(`[data-chart="${chartType}"]`).closest('.chart-container');
        const loadingDiv = chartContainer.querySelector('.chart-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // ===== DATA LOADING =====
    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/dashboard/stats`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateDashboardStats(data);
            } else {
                console.error('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadActivityData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/dashboard/activity`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateActivityList(data);
            } else {
                console.error('Failed to load activity data');
            }
        } catch (error) {
            console.error('Error loading activity data:', error);
        }
    }

    async loadNotifications() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/notifications`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const notifications = await response.json();
                this.updateNotificationBadge(notifications.length);
                this.updateNotificationList(notifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    updateDashboardStats(data) {
        // Update stat cards with real data
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            const statType = card.dataset.stat;
            const valueElement = card.querySelector('h3');
            
            if (data[statType] !== undefined) {
                valueElement.textContent = data[statType];
            }
        });
    }

    updateActivityList(activities) {
        const activityList = document.getElementById('recent-activity-list');
        if (!activityList) return;

        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No recent activity to display</p>
                    <small>Activity will appear here as users interact with the system</small>
                </div>
            `;
            return;
        }

        const activityHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <span class="activity-meta">
                        ${activity.user} • ${this.formatTimestamp(activity.timestamp)}
                    </span>
                </div>
            </div>
        `).join('');

        activityList.innerHTML = activityHTML;
    }

    updateNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    updateNotificationList(notifications) {
        // This would update a notification dropdown or sidebar
        console.log('Notifications updated:', notifications);
    }

    // ===== UTILITY FUNCTIONS =====
    getActivityIcon(type) {
        const icons = {
            'TASK_CREATED': 'fas fa-tasks',
            'PROJECT_CREATED': 'fas fa-folder',
            'USER_LOGIN': 'fas fa-sign-in-alt',
            'TASK_COMPLETED': 'fas fa-check-circle',
            'TASK_UPDATED': 'fas fa-edit',
            'PROJECT_UPDATED': 'fas fa-folder-open',
            'USER_CREATED': 'fas fa-user-plus',
            'default': 'fas fa-info-circle'
        };
        return icons[type] || icons.default;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.createElement('div');
        alertContainer.className = `alert alert-${type} fade-in`;
        alertContainer.innerHTML = `
            <i class="fas fa-${this.getAlertIcon(type)}"></i>
            <span>${message}</span>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.insertBefore(alertContainer, contentWrapper.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alertContainer.parentElement) {
                    alertContainer.remove();
                }
            }, 5000);
        }
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // ===== FORM HANDLING =====
    setupFormHandlers() {
        // Create User Form
        const createUserForm = document.getElementById('create-user-form');
        if (createUserForm) {
            createUserForm.addEventListener('submit', this.handleCreateUser.bind(this));
        }

        // Create Project Form
        const createProjectForm = document.getElementById('create-project-form');
        if (createProjectForm) {
            createProjectForm.addEventListener('submit', this.handleCreateProject.bind(this));
        }

        // Create Task Form
        const createTaskForm = document.getElementById('create-task-form');
        if (createTaskForm) {
            createTaskForm.addEventListener('submit', this.handleCreateTask.bind(this));
        }
    }

    async handleCreateUser(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData)),
                credentials: 'include'
            });

            if (response.ok) {
                this.showAlert('User created successfully!', 'success');
                this.closeModal('create-user-modal');
                form.reset();
                this.loadDashboardData(); // Refresh dashboard
            } else {
                const error = await response.json();
                this.showAlert(error.message || 'Failed to create user', 'danger');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            this.showAlert('An error occurred while creating the user', 'danger');
        }
    }

    async handleCreateProject(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData)),
                credentials: 'include'
            });

            if (response.ok) {
                this.showAlert('Project created successfully!', 'success');
                this.closeModal('create-project-modal');
                form.reset();
                this.loadDashboardData(); // Refresh dashboard
            } else {
                const error = await response.json();
                this.showAlert(error.message || 'Failed to create project', 'danger');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            this.showAlert('An error occurred while creating the project', 'danger');
        }
    }

    async handleCreateTask(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData)),
                credentials: 'include'
            });

            if (response.ok) {
                this.showAlert('Task created successfully!', 'success');
                this.closeModal('create-task-modal');
                form.reset();
                this.loadDashboardData(); // Refresh dashboard
            } else {
                const error = await response.json();
                this.showAlert(error.message || 'Failed to create task', 'danger');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            this.showAlert('An error occurred while creating the task', 'danger');
        }
    }

    // ===== THEME MANAGEMENT =====
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.currentTheme = savedTheme;
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    // ===== EXPORT FUNCTIONS =====
    exportChart(chartId) {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const link = document.createElement('a');
            link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Menu toggle for mobile
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('show');
            });
        }

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    // ===== INITIALIZATION =====
    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.setupFormHandlers();
        this.initializeCharts();
        this.loadDashboardData();
        this.loadActivityData();
        this.loadNotifications();
        
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
            this.loadNotifications();
        }, 30000);
    }
}

// Global functions for backward compatibility
function openModal(modalId) {
    dashboardUtils.openModal(modalId);
}

function closeModal(modalId) {
    dashboardUtils.closeModal(modalId);
}

function refreshDashboard() {
    dashboardUtils.loadDashboardData();
    dashboardUtils.loadActivityData();
    dashboardUtils.showAlert('Dashboard refreshed!', 'success');
}

function loadMoreActivity() {
    dashboardUtils.showAlert('Loading more activity...', 'info');
    // Implement pagination logic here
}

function exportChart(chartId) {
    dashboardUtils.exportChart(chartId);
}

// Initialize dashboard utilities
const dashboardUtils = new DashboardUtils();

// Export for use in other scripts
window.DashboardUtils = DashboardUtils;
window.dashboardUtils = dashboardUtils; 