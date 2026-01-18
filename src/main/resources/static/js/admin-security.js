// Admin Dashboard Security & Analytics Script

// Load security metrics
async function loadSecurityMetrics() {
    try {
        const response = await fetch('/api/admin/security/metrics');
        const data = await response.json();
        
        // Update security metric cards
        document.getElementById('daily-logins').textContent = data.dailyLoginAttempts || 0;
        document.getElementById('failed-logins').textContent = data.failedLoginAttempts || 0;
        document.getElementById('active-sessions').textContent = data.activeSessionsCount || 0;
        document.getElementById('security-alerts').textContent = data.unresolvedAlertsCount || 0;
    } catch (error) {
        console.error('Error loading security metrics:', error);
    }
}

// Load activity logs table
async function loadActivityLogs(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/activity-logs?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('activity-logs-body');
        tableBody.innerHTML = '';
        
        data.content.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(log.createdAt).toLocaleString()}</td>
                <td>${log.userName || 'System'}</td>
                <td><span class="badge badge-info">${log.activityType}</span></td>
                <td>${log.description}</td>
                <td>${log.ipAddress || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteActivityLog(${log.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

// Delete activity log
async function deleteActivityLog(logId) {
    if (confirm('Are you sure you want to delete this activity log?')) {
        try {
            const response = await fetch(`/api/activity-logs/${logId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Activity log deleted successfully', 'success');
                loadActivityLogs();
            } else {
                showNotification('Error deleting activity log', 'error');
            }
        } catch (error) {
            console.error('Error deleting activity log:', error);
            showNotification('Error deleting activity log', 'error');
        }
    }
}

// Delete all activity logs
async function deleteAllActivityLogs() {
    if (confirm('Are you sure you want to delete ALL activity logs? This cannot be undone.')) {
        try {
            const response = await fetch('/api/activity-logs/all', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('All activity logs deleted successfully', 'success');
                loadActivityLogs();
            } else {
                showNotification('Error deleting activity logs', 'error');
            }
        } catch (error) {
            console.error('Error deleting activity logs:', error);
            showNotification('Error deleting activity logs', 'error');
        }
    }
}

// Load login attempts
async function loadLoginAttempts(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/admin/security/login-attempts?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('login-attempts-body');
        tableBody.innerHTML = '';
        
        data.content.forEach(attempt => {
            const row = document.createElement('tr');
            const statusClass = attempt.status === 'SUCCESS' ? 'badge-success' : 'badge-danger';
            row.innerHTML = `
                <td>${new Date(attempt.attemptedAt).toLocaleString()}</td>
                <td>${attempt.username}</td>
                <td><span class="badge ${statusClass}">${attempt.status}</span></td>
                <td>${attempt.ipAddress || 'N/A'}</td>
                <td>${attempt.reason || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading login attempts:', error);
    }
}

// Load active sessions
async function loadActiveSessions(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/admin/security/active-sessions?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('sessions-body');
        tableBody.innerHTML = '';
        
        data.content.forEach(session => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session.username}</td>
                <td>${new Date(session.loginTime).toLocaleString()}</td>
                <td>${session.ipAddress || 'N/A'}</td>
                <td>${session.deviceType || 'Unknown'}</td>
                <td>${session.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>'}</td>
                <td>${session.durationMinutes || 0} mins</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading active sessions:', error);
    }
}

// Load security alerts
async function loadSecurityAlerts(page = 0, size = 10) {
    try {
        const response = await fetch(`/api/admin/security/security-alerts?page=${page}&size=${size}`);
        const data = await response.json();
        
        const tableBody = document.getElementById('alerts-body');
        tableBody.innerHTML = '';
        
        data.content.forEach(alert => {
            const row = document.createElement('tr');
            const severityClass = `badge-${alert.severity.toLowerCase() === 'high' ? 'danger' : alert.severity.toLowerCase() === 'medium' ? 'warning' : 'info'}`;
            row.innerHTML = `
                <td>${new Date(alert.createdAt).toLocaleString()}</td>
                <td>${alert.username}</td>
                <td><span class="badge ${severityClass}">${alert.severity}</span></td>
                <td>${alert.alertType}</td>
                <td>${alert.description}</td>
                <td>
                    ${!alert.isResolved ? `<button class="btn btn-sm btn-primary" onclick="resolveAlert(${alert.id})">Resolve</button>` : 'Resolved'}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading security alerts:', error);
    }
}

// Resolve security alert
async function resolveAlert(alertId) {
    try {
        const response = await fetch(`/api/admin/security/security-alerts/${alertId}/resolve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Security alert resolved', 'success');
            loadSecurityAlerts();
            loadSecurityMetrics();
        }
    } catch (error) {
        console.error('Error resolving alert:', error);
        showNotification('Error resolving alert', 'error');
    }
}

// Load system performance chart
async function loadSystemPerformanceChart() {
    try {
        const response = await fetch('/api/dashboard/admin/stats');
        const stats = await response.json();
        
        const ctx = document.getElementById('systemPerformanceChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['CPU Usage', 'Memory Usage', 'Disk Usage', 'Available'],
                datasets: [{
                    data: [
                        stats.cpuUsage || 30,
                        stats.memoryUsage || 45,
                        stats.diskUsage || 60,
                        100 - (stats.cpuUsage || 30)
                    ],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading system performance chart:', error);
    }
}

// Helper function to show notifications
function showNotification(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    const container = document.querySelector('.content-wrapper');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSecurityMetrics();
    loadActivityLogs();
    loadLoginAttempts();
    loadActiveSessions();
    loadSecurityAlerts();
    loadSystemPerformanceChart();
    
    // Refresh metrics every 30 seconds
    setInterval(loadSecurityMetrics, 30000);
    setInterval(loadActiveSessions, 30000);
});
