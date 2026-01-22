// ===========================
// ADMIN DASHBOARD FEATURES
// ===========================

let systemPerformanceChart = null;
let currentActivityLogPage = 0;
let currentLoginAttemptsPage = 0;

// Track if data has been loaded to prevent infinite loading
let activityLogsLoaded = false;
let deliverablesLoaded = false;
let upcomingEventsLoaded = false;
let supportTicketsLoaded = false;

// Initialize System Performance Chart
function initializeSystemPerformanceChart() {
    const ctx = document.getElementById('systemPerformanceChart');
    if (!ctx) return;
    
    const period = document.getElementById('chart-period')?.value || '7';
    const days = parseInt(period);
    
    // Generate labels for the selected period
    const labels = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    // Get stats from window.dashboardStats
    const stats = window.dashboardStats || {};
    const totalTasks = stats.totalTasks || 0;
    const completedTasks = stats.completedTasks || 0;
    const overdueTasks = stats.overdueTasks || 0;
    
    // Generate sample data based on actual stats (distributed across days)
    const tasksData = Array(days).fill(0).map((_, i) => Math.floor(totalTasks / days) + Math.floor(Math.random() * 5));
    const completedData = Array(days).fill(0).map((_, i) => Math.floor(completedTasks / days) + Math.floor(Math.random() * 3));
    const overdueData = Array(days).fill(0).map((_, i) => Math.floor(overdueTasks / days) + Math.floor(Math.random() * 2));
    
    // Destroy existing chart if it exists
    if (systemPerformanceChart) {
        systemPerformanceChart.destroy();
    }
    
    systemPerformanceChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Tasks',
                    data: tasksData,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Completed',
                    data: completedData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Overdue',
                    data: overdueData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f8f9fa',
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Make it globally available
window.initializeSystemPerformanceChart = initializeSystemPerformanceChart;

// Initialize admin dashboard features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize system performance chart on dashboard page
    setTimeout(() => {
        const dashboardPage = document.getElementById('dashboard');
        if (dashboardPage && dashboardPage.classList.contains('active')) {
            initializeSystemPerformanceChart();
        }
    }, 500);
    
    // Load notifications and message count on startup
    loadAdminNotifications();
    if (typeof loadUnreadMessageCount === 'function') {
        loadUnreadMessageCount();
    }
    
    // Refresh notifications every 30 seconds
    setInterval(() => {
        loadAdminNotifications();
        if (typeof loadUnreadMessageCount === 'function') {
            loadUnreadMessageCount();
        }
    }, 30000);
    
    // Override loadPageData to handle admin-specific pages
    const originalLoadPageData = window.loadPageData;
    window.loadPageData = function(pageId) {
        // Call original function first
        if (originalLoadPageData) {
            originalLoadPageData(pageId);
        }
        
        // Handle admin-specific pages
        switch(pageId) {
            case 'dashboard':
                // Initialize chart when navigating to dashboard
                setTimeout(initializeSystemPerformanceChart, 100);
                break;
            case 'activity':
                if (!activityLogsLoaded) {
                    loadActivityLogs();
                    activityLogsLoaded = true;
                }
                break;
            case 'deliverables':
                if (!deliverablesLoaded) {
                    loadAdminDeliverables();
                    deliverablesLoaded = true;
                }
                break;
            case 'calendar':
                if (!upcomingEventsLoaded) {
                    loadAdminUpcomingEvents();
                    upcomingEventsLoaded = true;
                }
                break;
            case 'support':
                if (!supportTicketsLoaded) {
                    loadAdminSupportTickets();
                    supportTicketsLoaded = true;
                }
                break;
            case 'security':
                loadSecurityMetrics();
                loadLoginAttempts();
                loadSecurityLogs();
                break;
        }
    };
    
    // Load initial page data if on a specific page
    const activePage = document.querySelector('.page-content.active');
    if (activePage) {
        const pageId = activePage.id;
        if (pageId && window.loadPageData) {
            window.loadPageData(pageId);
        }
    }
});

// ===========================
// SECURITY METRICS
// ===========================

async function loadSecurityMetrics() {
    try {
        const response = await apiRequest('/api/admin/security/metrics');
        const metrics = response.data || response || {};
        
        // Update security stats
        const loginAttemptsEl = document.getElementById('security-login-attempts');
        const failedLoginsEl = document.getElementById('security-failed-logins');
        const activeSessionsEl = document.getElementById('security-active-sessions');
        const securityThreatsEl = document.getElementById('security-threats');
        
        if (loginAttemptsEl) loginAttemptsEl.textContent = metrics.dailyLoginAttempts || 0;
        if (failedLoginsEl) failedLoginsEl.textContent = metrics.failedLogins || 0;
        if (activeSessionsEl) activeSessionsEl.textContent = metrics.activeSessions || 0;
        if (securityThreatsEl) securityThreatsEl.textContent = metrics.securityAlerts || 0;
        
        // Also update dashboard stats if they exist
        const dashboardLoginAttempts = document.getElementById('security-login-attempts');
        const dashboardFailedLogins = document.getElementById('security-failed-logins');
        const dashboardActiveSessions = document.getElementById('security-active-sessions');
        const dashboardSecurityAlerts = document.getElementById('security-threats');
        
        if (dashboardLoginAttempts) dashboardLoginAttempts.textContent = metrics.dailyLoginAttempts || 0;
        if (dashboardFailedLogins) dashboardFailedLogins.textContent = metrics.failedLogins || 0;
        if (dashboardActiveSessions) dashboardActiveSessions.textContent = metrics.activeSessions || 0;
        if (dashboardSecurityAlerts) dashboardSecurityAlerts.textContent = metrics.securityAlerts || 0;
        
    } catch (error) {
        console.error('Error loading security metrics:', error);
    }
}

// ===========================
// LOGIN ATTEMPTS
// ===========================

async function loadLoginAttempts(page = 0, size = 10) {
    try {
        const response = await apiRequest(`/api/admin/security/login-attempts?page=${page}&size=${size}`);
        const data = response.content || response.data || [];
        
        const tableBody = document.getElementById('login-attempts-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No login attempts found</td></tr>';
            return;
        }
        
        data.forEach(attempt => {
            const row = document.createElement('tr');
            const statusClass = attempt.status === 'SUCCESS' ? 'badge-success' : 'badge-danger';
            const statusText = attempt.status === 'SUCCESS' ? 'Success' : 'Failed';
            
            row.innerHTML = `
                <td>${formatDateTime(attempt.attemptedAt)}</td>
                <td>${attempt.username || attempt.email || 'N/A'}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${attempt.ipAddress || 'N/A'}</td>
                <td>${attempt.reason || '-'}</td>
            `;
            tableBody.appendChild(row);
        });
        
        currentLoginAttemptsPage = page;
    } catch (error) {
        console.error('Error loading login attempts:', error);
        const tableBody = document.getElementById('login-attempts-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Error loading login attempts</td></tr>';
        }
    }
}

// ===========================
// SECURITY LOGS
// ===========================

async function loadSecurityLogs() {
    try {
        // Load activity logs filtered by security-related types
        const response = await apiRequest('/api/activity-logs/type/SECURITY_ALERT?page=0&size=20');
        const data = response.content || response.data || [];
        
        const tableBody = document.getElementById('security-logs-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No security logs found</td></tr>';
            return;
        }
        
        data.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateTime(log.createdAt)}</td>
                <td><span class="badge badge-warning">${log.activityType}</span></td>
                <td>${log.userName || 'System'}</td>
                <td>${log.ipAddress || 'N/A'}</td>
                <td><span class="badge badge-danger">Alert</span></td>
                <td>${log.description || '-'}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading security logs:', error);
    }
}

// ===========================
// ACTIVITY LOGS
// ===========================

async function loadActivityLogs(page = 0, size = 20) {
    try {
        const tableBody = document.getElementById('activity-logs-body');
        if (!tableBody) {
            console.warn('Activity logs table body not found');
            return;
        }
        
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading activity logs...</td></tr>';
        
        const response = await apiRequest(`/api/activity-logs?page=${page}&size=${size}`);
        const data = response.content || response.data || [];
        
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No activity logs found</td></tr>';
            return;
        }
        
        data.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateTime(log.createdAt)}</td>
                <td><span class="badge">${formatActivityType(log.activityType)}</span></td>
                <td>${escapeHtml(log.userName || 'System')}</td>
                <td>${escapeHtml(log.description || '-')}</td>
                <td>${escapeHtml(log.ipAddress || 'N/A')}</td>
            `;
            tableBody.appendChild(row);
        });
        
        currentActivityLogPage = page;
    } catch (error) {
        console.error('Error loading activity logs:', error);
        const tableBody = document.getElementById('activity-logs-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Error loading activity logs</td></tr>';
        }
    }
}

async function deleteAllActivityLogs() {
    if (!confirm('Are you sure you want to delete ALL activity logs? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await apiRequest('/api/activity-logs/all', 'DELETE');
        showToast('All activity logs deleted successfully', 'success');
        loadActivityLogs();
    } catch (error) {
        console.error('Error deleting activity logs:', error);
        showToast('Error deleting activity logs', 'error');
    }
}

function filterActivityLogs() {
    const filter = document.getElementById('activity-log-filter')?.value;
    if (filter) {
        // Reload with filter
        loadActivityLogsByType(filter);
    } else {
        loadActivityLogs();
    }
}

async function loadActivityLogsByType(type) {
    try {
        const response = await apiRequest(`/api/activity-logs/type/${type}?page=0&size=20`);
        const data = response.content || response.data || [];
        
        const tableBody = document.getElementById('activity-logs-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No activity logs found</td></tr>';
            return;
        }
        
        data.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateTime(log.createdAt)}</td>
                <td><span class="badge">${formatActivityType(log.activityType)}</span></td>
                <td>${log.userName || 'System'}</td>
                <td>${log.description || '-'}</td>
                <td>${log.ipAddress || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading activity logs by type:', error);
    }
}

// ===========================
// DELIVERABLES
// ===========================

async function loadAdminDeliverables(page = 0, size = 20) {
    try {
        const tableBody = document.getElementById('admin-deliverables-body');
        if (!tableBody) {
            console.warn('Deliverables table body not found');
            return;
        }
        
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading deliverables...</td></tr>';
        
        const response = await apiRequest(`/api/deliverables?page=${page}&size=${size}`);
        const data = response.content || response.data || [];
        
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No deliverables found</td></tr>';
            return;
        }
        
        data.forEach(deliverable => {
            const row = document.createElement('tr');
            const statusClass = getDeliverableStatusClass(deliverable.status);
            row.innerHTML = `
                <td>${escapeHtml(deliverable.taskName || 'N/A')}</td>
                <td>${escapeHtml(deliverable.submittedByName || 'N/A')}</td>
                <td><a href="/uploads/${deliverable.filePath || deliverable.fileUrl || ''}" target="_blank" style="color: var(--primary);">${escapeHtml(deliverable.fileName || 'View File')}</a></td>
                <td><span class="badge ${statusClass}">${deliverable.status || 'PENDING'}</span></td>
                <td>${formatDateTime(deliverable.submittedAt || deliverable.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="reviewDeliverable(${deliverable.id})">
                        <i class="fas fa-eye"></i> Review
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading deliverables:', error);
        const tableBody = document.getElementById('admin-deliverables-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Error loading deliverables</td></tr>';
        }
    }
}

function filterAdminDeliverables() {
    const status = document.getElementById('filter-deliverable-status')?.value;
    if (status) {
        loadDeliverablesByStatus(status);
    } else {
        loadAdminDeliverables();
    }
}

async function loadDeliverablesByStatus(status) {
    try {
        const response = await apiRequest(`/api/deliverables/status/${status}?page=0&size=20`);
        const data = response.content || response.data || [];
        
        const tableBody = document.getElementById('admin-deliverables-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No deliverables found</td></tr>';
            return;
        }
        
        data.forEach(deliverable => {
            const row = document.createElement('tr');
            const statusClass = getDeliverableStatusClass(deliverable.status);
            row.innerHTML = `
                <td>${deliverable.taskName || 'N/A'}</td>
                <td>${deliverable.submittedByName || 'N/A'}</td>
                <td><a href="/uploads/${deliverable.filePath}" target="_blank" style="color: var(--primary);">${deliverable.fileName || 'View File'}</a></td>
                <td><span class="badge ${statusClass}">${deliverable.status || 'PENDING'}</span></td>
                <td>${formatDateTime(deliverable.submittedAt)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="reviewDeliverable(${deliverable.id})">
                        <i class="fas fa-eye"></i> Review
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading deliverables by status:', error);
    }
}

function getDeliverableStatusClass(status) {
    switch(status?.toUpperCase()) {
        case 'APPROVED': return 'badge-success';
        case 'REJECTED': return 'badge-danger';
        case 'PENDING': return 'badge-warning';
        default: return 'badge';
    }
}

// ===========================
// SYSTEM PERFORMANCE CHART
// ===========================

function initializeSystemPerformanceChart(period = 7) {
    const ctx = document.getElementById('systemPerformanceChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (systemPerformanceChart) {
        systemPerformanceChart.destroy();
    }
    
    // Load data for the selected period
    loadSystemPerformanceData(period).then(data => {
        systemPerformanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Tasks Created',
                        data: data.tasksCreated,
                        borderColor: 'rgb(67, 97, 238)',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Tasks Completed',
                        data: data.tasksCompleted,
                        borderColor: 'rgb(42, 157, 143)',
                        backgroundColor: 'rgba(42, 157, 143, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Tasks Overdue',
                        data: data.tasksOverdue,
                        borderColor: 'rgb(230, 57, 70)',
                        backgroundColor: 'rgba(230, 57, 70, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

async function loadSystemPerformanceData(period = 7) {
    try {
        // Get dashboard stats
        const statsResponse = await apiRequest('/api/dashboard/admin/stats');
        const stats = statsResponse.data || statsResponse || {};
        
        // Generate labels for the period
        const labels = [];
        const tasksCreated = [];
        const tasksCompleted = [];
        const tasksOverdue = [];
        
        for (let i = period - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // For now, use random data - in production, fetch actual historical data
            tasksCreated.push(Math.floor(Math.random() * 20) + 5);
            tasksCompleted.push(Math.floor(Math.random() * 15) + 3);
            tasksOverdue.push(Math.floor(Math.random() * 5));
        }
        
        return {
            labels,
            tasksCreated,
            tasksCompleted,
            tasksOverdue
        };
    } catch (error) {
        console.error('Error loading system performance data:', error);
        return {
            labels: [],
            tasksCreated: [],
            tasksCompleted: [],
            tasksOverdue: []
        };
    }
}

// Make function available globally
window.initializeSystemPerformanceChart = initializeSystemPerformanceChart;

// ===========================
// NOTIFICATIONS
// ===========================

async function loadAdminNotifications() {
    try {
        const response = await apiRequest('/api/notifications?page=0&size=20');
        const data = response.content || response.data || [];
        
        const unreadCount = data.filter(n => !n.isRead).length;
        const notificationCountEl = document.getElementById('notification-count');
        if (notificationCountEl) {
            if (unreadCount > 0) {
                notificationCountEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
                notificationCountEl.style.display = 'inline-block';
            } else {
                notificationCountEl.style.display = 'none';
            }
        }
        
        // Update notification dropdown
        updateNotificationDropdown(data);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationDropdown(notifications) {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    
    const unreadNotifications = notifications.filter(n => !n.isRead).slice(0, 5);
    
    if (unreadNotifications.length === 0) {
        dropdown.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No new notifications</p>
            </div>
        `;
        return;
    }
    
    dropdown.innerHTML = unreadNotifications.map(notif => `
        <div class="notification-item" onclick="markNotificationAsRead(${notif.id})">
            <div class="notification-content">
                <strong>${notif.title || 'Notification'}</strong>
                <p>${notif.message || ''}</p>
                <small>${timeAgo(notif.createdAt)}</small>
            </div>
        </div>
    `).join('');
}

async function markNotificationAsRead(id) {
    try {
        await apiRequest(`/api/notifications/${id}/read`, 'POST');
        loadAdminNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatActivityType(type) {
    if (!type) return 'Unknown';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ===========================
// UPCOMING EVENTS & DEADLINES
// ===========================

async function loadAdminUpcomingEvents() {
    try {
        const tableBody = document.getElementById('upcoming-events-body');
        if (!tableBody) {
            console.warn('Upcoming events table body not found');
            return;
        }
        
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading events...</td></tr>';
        
        const response = await apiRequest('/api/calendar/upcoming');
        const events = response.data || response.content || [];
        
        tableBody.innerHTML = '';
        
        if (events.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No upcoming events</td></tr>';
            return;
        }
        
        events.slice(0, 10).forEach(event => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(event.title || 'Untitled Event')}</td>
                <td><span class="badge badge-info">${escapeHtml(event.eventType || 'CUSTOM')}</span></td>
                <td>${formatDateTime(event.startTime)}</td>
                <td>${event.entityType ? `${escapeHtml(event.entityType)} #${event.entityId}` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewEventById(${event.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading upcoming events:', error);
        const tableBody = document.getElementById('upcoming-events-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Error loading events</td></tr>';
        }
    }
}

// ===========================
// SUPPORT TICKETS
// ===========================

async function loadAdminSupportTickets() {
    try {
        const tableBody = document.getElementById('support-tickets-body');
        if (!tableBody) {
            console.warn('Support tickets table body not found');
            return;
        }
        
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading support tickets...</td></tr>';
        
        const response = await apiRequest('/api/support-tickets');
        const tickets = response.data || response.content || [];
        
        tableBody.innerHTML = '';
        
        if (tickets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No support tickets found</td></tr>';
            return;
        }
        
        tickets.forEach(ticket => {
            const row = document.createElement('tr');
            const priorityClass = ticket.priority?.toLowerCase() || 'medium';
            const statusClass = ticket.status?.toLowerCase() || 'open';
            row.innerHTML = `
                <td>#${ticket.id}</td>
                <td>${escapeHtml(ticket.subject || 'No Subject')}</td>
                <td>${escapeHtml(ticket.userName || 'N/A')}</td>
                <td><span class="badge priority-${priorityClass}">${escapeHtml(ticket.priority || 'MEDIUM')}</span></td>
                <td><span class="badge status-${statusClass}">${escapeHtml(ticket.status || 'OPEN')}</span></td>
                <td>${formatDateTime(ticket.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewTicket(${ticket.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading support tickets:', error);
        const tableBody = document.getElementById('support-tickets-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Error loading support tickets</td></tr>';
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally
window.loadSecurityMetrics = loadSecurityMetrics;
window.loadLoginAttempts = loadLoginAttempts;
window.loadActivityLogs = loadActivityLogs;
window.deleteAllActivityLogs = deleteAllActivityLogs;
window.filterActivityLogs = filterActivityLogs;
window.loadAdminDeliverables = loadAdminDeliverables;
window.filterAdminDeliverables = filterAdminDeliverables;
window.loadSecurityLogs = loadSecurityLogs;
window.loadAdminUpcomingEvents = loadAdminUpcomingEvents;
window.loadAdminSupportTickets = loadAdminSupportTickets;

