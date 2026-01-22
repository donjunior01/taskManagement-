// ===========================
// PM DASHBOARD SPECIFIC JS
// ===========================

let pmTaskStatusChart, pmTeamPerformanceChart, pmTaskTrendsChart, pmTaskPriorityChart;
let pmCalendar;

// Initialize PM-specific charts
function initializePMCharts() {
    // Task Status Chart
    const taskStatusCtx = document.getElementById('pmTaskStatusChart');
    if (taskStatusCtx) {
        pmTaskStatusChart = new Chart(taskStatusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'In Review', 'Completed'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#6c757d', '#4361ee', '#f4a261', '#2a9d8f'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f8f9fa',
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Team Performance Chart
    const teamPerfCtx = document.getElementById('pmTeamPerformanceChart');
    if (teamPerfCtx) {
        pmTeamPerformanceChart = new Chart(teamPerfCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Completed',
                    data: [],
                    backgroundColor: '#2a9d8f',
                    borderRadius: 4
                }, {
                    label: 'In Progress',
                    data: [],
                    backgroundColor: '#4361ee',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f8f9fa'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd' }
                    }
                }
            }
        });
    }

    // Task Trends Chart
    const trendsCtx = document.getElementById('pmTaskTrendsChart');
    if (trendsCtx) {
        pmTaskTrendsChart = new Chart(trendsCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Tasks Created',
                    data: [],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Tasks Completed',
                    data: [],
                    borderColor: '#2a9d8f',
                    backgroundColor: 'rgba(42, 157, 143, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f8f9fa',
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#adb5bd',
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Task Priority Chart
    const priorityCtx = document.getElementById('pmTaskPriorityChart');
    if (priorityCtx) {
        pmTaskPriorityChart = new Chart(priorityCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#dc3545', '#e63946', '#f4a261', '#2a9d8f'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#f8f9fa',
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Load chart data
    loadPMChartData();
}

// Load chart data
async function loadPMChartData() {
    try {
        const tasksResponse = await apiRequest('/api/tasks?size=1000');
        const tasks = tasksResponse.data || [];

        // Task Status Distribution
        const statusCounts = { 'TODO': 0, 'IN_PROGRESS': 0, 'IN_REVIEW': 0, 'COMPLETED': 0 };
        const priorityCounts = { 'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0 };

        tasks.forEach(task => {
            if (statusCounts.hasOwnProperty(task.status)) statusCounts[task.status]++;
            if (priorityCounts.hasOwnProperty(task.priority)) priorityCounts[task.priority]++;
        });

        // Update Task Status Chart
        if (pmTaskStatusChart) {
            pmTaskStatusChart.data.datasets[0].data = [
                statusCounts['TODO'], statusCounts['IN_PROGRESS'], statusCounts['IN_REVIEW'], statusCounts['COMPLETED']
            ];
            pmTaskStatusChart.update();
        }

        // Update Task Priority Chart
        if (pmTaskPriorityChart) {
            pmTaskPriorityChart.data.datasets[0].data = [
                priorityCounts['CRITICAL'], priorityCounts['HIGH'], priorityCounts['MEDIUM'], priorityCounts['LOW']
            ];
            pmTaskPriorityChart.update();
        }

        // Load team performance
        const usersResponse = await apiRequest('/api/users?size=100');
        const users = usersResponse.data || [];

        if (pmTeamPerformanceChart && users.length > 0) {
            const performanceData = users.slice(0, 5).map(user => {
                const userTasks = tasks.filter(t => t.assignedToId === user.id);
                return {
                    name: `${user.firstName} ${user.lastName.charAt(0)}.`,
                    completed: userTasks.filter(t => t.status === 'COMPLETED').length,
                    inProgress: userTasks.filter(t => t.status === 'IN_PROGRESS').length
                };
            }).filter(u => u.completed > 0 || u.inProgress > 0);

            pmTeamPerformanceChart.data.labels = performanceData.map(u => u.name);
            pmTeamPerformanceChart.data.datasets[0].data = performanceData.map(u => u.completed);
            pmTeamPerformanceChart.data.datasets[1].data = performanceData.map(u => u.inProgress);
            pmTeamPerformanceChart.update();
        }

        // Generate trend data
        const last7Days = [];
        const createdCounts = [];
        const completedCounts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
            
            createdCounts.push(tasks.filter(t => {
                const taskDate = new Date(t.createdAt);
                return taskDate >= dayStart && taskDate <= dayEnd;
            }).length);
            
            completedCounts.push(tasks.filter(t => {
                if (t.status !== 'COMPLETED') return false;
                const taskDate = new Date(t.updatedAt);
                return taskDate >= dayStart && taskDate <= dayEnd;
            }).length);
        }

        if (pmTaskTrendsChart) {
            pmTaskTrendsChart.data.labels = last7Days;
            pmTaskTrendsChart.data.datasets[0].data = createdCounts;
            pmTaskTrendsChart.data.datasets[1].data = completedCounts;
            pmTaskTrendsChart.update();
        }

        // Update team performance table
        loadPMTeamPerformance(tasks, users);
        
        // Load recent tasks
        loadRecentTasks(tasks);

    } catch (error) {
        console.error('Error loading PM chart data:', error);
    }
}

// Load team performance table
function loadPMTeamPerformance(tasks, users) {
    const tbody = document.getElementById('pm-team-performance-body');
    if (!tbody) return;

    const performanceData = users.map(user => {
        const userTasks = tasks.filter(t => t.assignedToId === user.id);
        const completed = userTasks.filter(t => t.status === 'COMPLETED').length;
        const inProgress = userTasks.filter(t => t.status === 'IN_PROGRESS').length;
        const total = userTasks.length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { name: `${user.firstName} ${user.lastName}`, total, completed, inProgress, rate };
    }).filter(u => u.total > 0);

    if (performanceData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No task data available</td></tr>';
        return;
    }

    tbody.innerHTML = performanceData.map(user => `
        <tr>
            <td><strong>${user.name}</strong></td>
            <td>${user.total}</td>
            <td><span class="badge badge-success">${user.completed}</span></td>
            <td><span class="badge badge-primary">${user.inProgress}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 8px; background: rgba(67, 97, 238, 0.2); border-radius: 4px;">
                        <div style="width: ${user.rate}%; height: 100%; background: var(--primary); border-radius: 4px;"></div>
                    </div>
                    <span>${user.rate}%</span>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load recent tasks for dashboard
function loadRecentTasks(tasks) {
    const tbody = document.getElementById('recent-tasks-body');
    if (!tbody) return;

    const recentTasks = tasks.slice(0, 5);
    
    if (recentTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No tasks found</td></tr>';
        return;
    }

    tbody.innerHTML = recentTasks.map(task => `
        <tr>
            <td>${escapeHtml(task.name)}</td>
            <td>${task.assignedToName || 'Unassigned'}</td>
            <td><span class="priority-badge ${task.priority?.toLowerCase()}">${task.priority}</span></td>
            <td><span class="status-badge ${task.status?.toLowerCase().replace('_', '-')}">${formatStatus(task.status)}</span></td>
            <td>${formatDate(task.deadline)}</td>
        </tr>
    `).join('');
}

// Initialize PM Calendar
function initializePMCalendar() {
    const calendarEl = document.getElementById('pm-calendar');
    if (!calendarEl) return;

    pmCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        height: 'auto',
        editable: true,
        selectable: true,
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        select: function(info) {
            document.getElementById('event-start').value = info.startStr.slice(0, 16);
            document.getElementById('event-end').value = info.endStr.slice(0, 16);
            openModal('create-event-modal');
        },
        events: function(fetchInfo, successCallback, failureCallback) {
            apiRequest(`/api/calendar/range?start=${fetchInfo.startStr}&end=${fetchInfo.endStr}`)
                .then(data => {
                    if (data.success) {
                        const events = data.data.map(event => ({
                            id: event.id,
                            title: event.title,
                            start: event.startTime,
                            end: event.endTime,
                            allDay: event.allDay,
                            backgroundColor: event.color,
                            borderColor: event.color,
                            extendedProps: {
                                description: event.description,
                                eventType: event.eventType,
                                location: event.location
                            }
                        }));
                        successCallback(events);
                    } else {
                        failureCallback(data.message);
                    }
                })
                .catch(error => failureCallback(error));
        }
    });
    pmCalendar.render();

    // Load upcoming events
    loadUpcomingEvents();
}

// Load upcoming events
async function loadUpcomingEvents() {
    const container = document.getElementById('pm-upcoming-events');
    if (!container) return;

    try {
        const response = await apiRequest('/api/calendar/upcoming');
        const events = response.data || [];

        if (events.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                    <i class="fas fa-calendar-day" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No upcoming events</p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.slice(0, 5).map(event => `
            <div style="padding: 12px; background: var(--bg); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid ${event.color || '#4361ee'};">
                <strong>${escapeHtml(event.title)}</strong>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">
                    <i class="fas fa-clock"></i> ${formatDate(event.startTime)}
                </p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading upcoming events:', error);
    }
}

// Show event details
function showEventDetails(event) {
    showToast(`Event: ${event.title}`, 'info');
}

// Format status for display
function formatStatus(status) {
    const statusMap = {
        'TODO': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'IN_REVIEW': 'In Review',
        'COMPLETED': 'Completed'
    };
    return statusMap[status] || status;
}

// Load PM projects
async function loadPMProjects() {
    const tbody = document.getElementById('pm-projects-body');
    if (!tbody) return;

    try {
        const response = await apiRequest('/api/projects?size=50');
        const projects = response.data || [];

        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No projects found</td></tr>';
            return;
        }

        tbody.innerHTML = projects.map(project => `
            <tr>
                <td><strong>${escapeHtml(project.name)}</strong></td>
                <td><span class="status-badge ${project.status?.toLowerCase()}">${project.status}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="flex: 1; height: 8px; background: rgba(67, 97, 238, 0.2); border-radius: 4px;">
                            <div style="width: ${project.progress || 0}%; height: 100%; background: var(--primary); border-radius: 4px;"></div>
                        </div>
                        <span>${project.progress || 0}%</span>
                    </div>
                </td>
                <td>${project.teamCount || 0}</td>
                <td>${formatDate(project.endDate)}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 10px;" onclick="viewProject(${project.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading projects</td></tr>';
    }
}

// Load assignments
async function loadPMAssignments() {
    const tbody = document.getElementById('assignments-body');
    if (!tbody) return;

    try {
        const [tasksResponse, usersResponse] = await Promise.all([
            apiRequest('/api/tasks?size=1000'),
            apiRequest('/api/users?size=100')
        ]);
        
        const tasks = tasksResponse.data || [];
        const users = usersResponse.data || [];

        const assignments = users.map(user => {
            const userTasks = tasks.filter(t => t.assignedToId === user.id);
            return {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                total: userTasks.length,
                inProgress: userTasks.filter(t => t.status === 'IN_PROGRESS').length,
                completed: userTasks.filter(t => t.status === 'COMPLETED').length,
                overdue: userTasks.filter(t => {
                    if (!t.deadline) return false;
                    return new Date(t.deadline) < new Date() && t.status !== 'COMPLETED';
                }).length
            };
        }).filter(a => a.total > 0);

        if (assignments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No assignments found</td></tr>';
            return;
        }

        tbody.innerHTML = assignments.map(a => `
            <tr>
                <td><strong>${escapeHtml(a.name)}</strong></td>
                <td>${a.total}</td>
                <td><span class="badge badge-primary">${a.inProgress}</span></td>
                <td><span class="badge badge-success">${a.completed}</span></td>
                <td><span class="badge ${a.overdue > 0 ? 'badge-danger' : 'badge-success'}">${a.overdue}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 10px;" onclick="viewUserTasks(${a.id})">
                        <i class="fas fa-tasks"></i>
                    </button>
                    <button class="btn btn-primary" style="padding: 6px 10px;" onclick="assignNewTask(${a.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading assignments:', error);
    }
}

// View project
function viewProject(id) {
    showToast('Project details view coming soon!', 'info');
}

// View user tasks
function viewUserTasks(userId) {
    navigateToPage('tasks');
    // Could filter tasks by user here
}

// Assign new task to user
function assignNewTask(userId) {
    const select = document.getElementById('task-assignee');
    if (select) select.value = userId;
    openModal('create-task-modal');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts
    if (document.getElementById('pmTaskStatusChart')) {
        initializePMCharts();
    }
    
    // Initialize calendar when navigating to calendar page
    const calendarNav = document.querySelector('[data-page="calendar"]');
    if (calendarNav) {
        calendarNav.addEventListener('click', () => {
            setTimeout(() => {
                if (!pmCalendar && document.getElementById('pm-calendar')) {
                    initializePMCalendar();
                }
            }, 100);
        });
    }
});

// PM-specific page data loading
function loadPMPageData(pageId) {
    if (pageId === 'dashboard' && document.getElementById('pmTaskStatusChart')) {
        initializePMCharts();
    }
    if (pageId === 'calendar' && !pmCalendar) {
        setTimeout(initializePMCalendar, 100);
    }
    if (pageId === 'projects') {
        loadPMProjects();
    }
    if (pageId === 'assignments') {
        loadPMAssignments();
    }
    if (pageId === 'deliverables') {
        loadPendingDeliverables();
    }
    if (pageId === 'non-compliant') {
        loadNonCompliantUsers();
    }
    if (pageId === 'reports' && document.getElementById('pmTaskTrendsChart')) {
        if (!pmTaskTrendsChart) initializePMCharts();
        else loadPMChartData();
    }
    if (pageId === 'messages') {
        if (typeof loadProjectConversations === 'function') loadProjectConversations();
        if (typeof loadDirectMessageUsers === 'function') loadDirectMessageUsers();
        if (typeof loadComposeOptions === 'function') loadComposeOptions();
    }
}

// Load pending deliverables for review
async function loadPendingDeliverables() {
    const tbody = document.getElementById('deliverables-body');
    if (!tbody) return;
    
    try {
        const response = await apiRequest('/api/deliverables/pending');
        const deliverables = response.data || [];
        
        if (deliverables.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No pending deliverables to review</td></tr>';
            return;
        }
        
        tbody.innerHTML = deliverables.map(d => `
            <tr>
                <td>${escapeHtml(d.taskName || 'N/A')}</td>
                <td>${escapeHtml(d.submitterName || 'Unknown')}</td>
                <td><a href="${d.filePath || '#'}" target="_blank" style="color: var(--primary);">
                    <i class="fas fa-file"></i> ${escapeHtml(d.fileName) || 'File'}
                </a></td>
                <td>${formatDate(d.submittedAt)}</td>
                <td><span class="status-badge pending">Pending</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openReviewModal(${d.id})">
                        <i class="fas fa-check-circle"></i> Review
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading pending deliverables:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error loading deliverables</td></tr>';
    }
}

// Open review modal for a deliverable
async function openReviewModal(deliverableId) {
    try {
        const response = await apiRequest(`/api/deliverables/${deliverableId}`);
        const deliverable = response.data;
        
        if (deliverable) {
            document.getElementById('deliverable-id').value = deliverableId;
            document.getElementById('deliverable-task').textContent = deliverable.taskName || 'N/A';
            document.getElementById('deliverable-submitted-by').textContent = deliverable.submitterName || 'Unknown';
            document.getElementById('deliverable-file').href = deliverable.filePath || '#';
            document.getElementById('deliverable-file').textContent = deliverable.fileName || 'View File';
            document.getElementById('deliverable-status').value = 'PENDING';
            document.getElementById('deliverable-comments').value = '';
            
            openModal('review-deliverable-modal');
        }
    } catch (error) {
        showToast('Error loading deliverable details', 'error');
    }
}

// Load non-compliant users (users with overdue tasks)
async function loadNonCompliantUsers() {
    const tbody = document.getElementById('non-compliant-users-body');
    if (!tbody) return;
    
    try {
        const response = await apiRequest('/api/tasks/overdue');
        const overdueTasks = response.data || [];
        
        // Group by user
        const userMap = new Map();
        overdueTasks.forEach(task => {
            if (!task.assignedToId) return;
            
            if (!userMap.has(task.assignedToId)) {
                userMap.set(task.assignedToId, {
                    id: task.assignedToId,
                    name: task.assignedToName || 'Unknown',
                    tasks: []
                });
            }
            userMap.get(task.assignedToId).tasks.push(task);
        });
        
        if (userMap.size === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No non-compliant users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = Array.from(userMap.values()).map(user => `
            <tr>
                <td>${escapeHtml(user.name)}</td>
                <td>${user.tasks.length}</td>
                <td>${user.tasks.map(t => escapeHtml(t.name)).join(', ').substring(0, 50)}...</td>
                <td>${user.tasks.reduce((max, t) => {
                    const days = Math.floor((new Date() - new Date(t.deadline)) / (1000 * 60 * 60 * 24));
                    return Math.max(max, days);
                }, 0)} days</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="sendReminder(${user.id})">
                        <i class="fas fa-bell"></i> Remind
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading non-compliant users:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error loading data</td></tr>';
    }
}

// Send reminder to user
async function sendReminder(userId) {
    try {
        await apiRequest('/api/messages', 'POST', {
            recipientId: userId,
            content: 'This is a reminder that you have overdue tasks. Please update their status or complete them as soon as possible.',
            subject: 'Task Reminder'
        });
        showToast('Reminder sent successfully!', 'success');
    } catch (error) {
        showToast('Error sending reminder', 'error');
    }
}

// Make functions globally available
window.openReviewModal = openReviewModal;
window.sendReminder = sendReminder;

// Handle review deliverable form submission
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-deliverable-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const deliverableId = document.getElementById('deliverable-id').value;
            const status = document.getElementById('deliverable-status').value;
            const feedback = document.getElementById('deliverable-comments').value;
            
            try {
                await apiRequest(`/api/deliverables/${deliverableId}/review`, 'PUT', {
                    status: status,
                    feedback: feedback
                });
                
                showToast('Deliverable reviewed successfully!', 'success');
                closeModal('review-deliverable-modal');
                loadPendingDeliverables();
            } catch (error) {
                showToast('Error reviewing deliverable', 'error');
            }
        });
    }
});

// Hook into navigation events
document.addEventListener('DOMContentLoaded', () => {
    // Override loadPageData after DOM is ready
    if (typeof window.loadPageData === 'function') {
        const originalLoadPageData = window.loadPageData;
        window.loadPageData = function(pageId) {
            originalLoadPageData(pageId);
            loadPMPageData(pageId);
        };
    }
    
    // Initialize charts on dashboard
    if (document.getElementById('pmTaskStatusChart')) {
        initializePMCharts();
    }
});

